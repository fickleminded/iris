const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

// Loads a QML-style JS file (stripping .pragma and .import directives)
function loadQmlJs(filePath, context = {}) {
  const fullPath = path.resolve(__dirname, "../../", filePath);
  let code = fs.readFileSync(fullPath, "utf8");
  code = code.replace(/^\s*\.(pragma|import)\s+[^\n]+/gm, "");
  const ctx = vm.createContext({
    console,
    Math,
    Number,
    Boolean,
    RegExp,
    Date,
    String,
    Array,
    Object,
    JSON,
    parseInt,
    parseFloat,
    isNaN,
    isFinite,
    ...context
  });
  vm.runInContext(code, ctx);
  return ctx;
}

function createIrisEngine() {
  const AppProvider = loadQmlJs("js/Providers/AppProvider.js");
  const FileProvider = loadQmlJs("js/Providers/FileProvider.js");
  const CalcProvider = loadQmlJs("js/Providers/CalcProvider.js");
  const SystemProvider = loadQmlJs("js/Providers/SystemProvider.js");
  const WebProvider = loadQmlJs("js/Providers/WebProvider.js");

  const Engine = loadQmlJs("js/IrisEngine.js", {
    AppProvider,
    FileProvider,
    CalcProvider,
    SystemProvider,
    WebProvider
  });

  return { Engine, AppProvider, FileProvider, CalcProvider, SystemProvider, WebProvider };
}

// Models the state and lifecycle of Iris.qml
function createIrisOverlayState(options = {}) {
  const { Engine } = createIrisEngine();

  const state = {
    opened: false,
    filterText: "",
    selectedIndex: 0,
    itemsList: [],
    desktopApplications: options.applications || [
      { id: "firefox", name: "Firefox", genericName: "Web Browser", comment: "Browse the internet", exec: "firefox" },
      { id: "foot", name: "Terminal", genericName: "Terminal Emulator", comment: "Command line", exec: "foot" },
      { id: "code", name: "VS Code", genericName: "Code Editor", comment: "Edit files", exec: "code" }
    ],
    fileResults: [],
    installedThemes: options.themes || ["Tokyo Night", "Catppuccin Mocha", "Nord"],
    placeholders: [
      "What do you want to do today?",
      "What would you like to do today?",
      "What would you like to do?",
      "What can I help you find or do?"
    ],
    currentPlaceholder: "What do you want to do today?",
    singlePaneWidth: 640,
    twoPaneWidth: 920,
    shellCalls: {
      hide: 0,
      summon: 0
    },
    launchedApps: [],
    launchedCommands: [],
    shell: options.shell || {
      appLibrary: {
        launch(id, name) {
          state.launchedApps.push({ id, name, method: "shell" });
          return true;
        }
      },
      hide(id) {
        state.shellCalls.hide += 1;
      }
    },
    quickshellUtil: options.quickshellUtil || {
      shellQuote(str) {
        return "'" + String(str).replace(/'/g, "'\\''") + "'";
      },
      execDetached(cmd) {
        state.launchedCommands.push(cmd);
        return true;
      }
    },

    get selectedItem() {
      return state.itemsList.length > state.selectedIndex && state.selectedIndex >= 0
        ? state.itemsList[state.selectedIndex]
        : null;
    },

    get hasPreview() {
      return state.selectedItem ? state.selectedItem.hasPreview === true : false;
    },

    get currentCardWidth() {
      return state.hasPreview ? state.twoPaneWidth : state.singlePaneWidth;
    },

    pickRandomPlaceholder() {
      const available = state.placeholders.filter(p => p !== state.currentPlaceholder);
      const list = available.length > 0 ? available : state.placeholders;
      state.currentPlaceholder = list[Math.floor(Math.random() * list.length)];
    },

    refreshQuery() {
      const ctx = {
        applications: state.desktopApplications,
        fileResults: state.fileResults,
        themes: state.installedThemes,
        resolveIcon: (name) => name || "default-icon"
      };
      state.itemsList = Engine.search(state.filterText, ctx);
      if (state.selectedIndex >= state.itemsList.length) {
        state.selectedIndex = Math.max(0, state.itemsList.length - 1);
      }
    },

    setFilterText(text) {
      state.filterText = text;
      state.refreshQuery();
    },

    open(payloadJson) {
      state.pickRandomPlaceholder();
      let query = "";
      if (typeof payloadJson === "string") {
        const trimmed = payloadJson.trim();
        if (trimmed.length > 0) {
          if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
            try {
              const p = JSON.parse(trimmed);
              if (p && typeof p.query === "string") query = p.query;
            } catch (e) {
              query = trimmed;
            }
          } else {
            query = trimmed;
          }
        }
      } else if (payloadJson && typeof payloadJson.query === "string") {
        query = payloadJson.query;
      }

      state.opened = true;
      state.selectedIndex = 0;
      state.filterText = query;
      state.refreshQuery();
    },

    close() {
      state.opened = false;
    },

    dismiss() {
      state.close();
      state.shellCalls.hide += 1;
    },

    toggle() {
      if (state.opened) {
        state.dismiss();
      } else {
        state.open("{}");
      }
    },

    select(delta) {
      if (state.itemsList.length === 0) return;
      const next = state.selectedIndex + delta;
      if (next < 0) {
        state.selectedIndex = state.itemsList.length - 1;
      } else if (next >= state.itemsList.length) {
        state.selectedIndex = 0;
      } else {
        state.selectedIndex = next;
      }
    },

    activateItem(item) {
      if (!item) return;
      if (item.kind === "hint" || item.kind === "guide") {
        if (item.fillQuery) {
          state.setFilterText(item.fillQuery);
        }
        return;
      }
      if (item.kind === "app") {
        Engine.launchApp(item, state.shell, state.quickshellUtil);
      } else if (item.kind === "file") {
        Engine.openFile(item, state.quickshellUtil);
      } else if (item.kind === "calc") {
        Engine.copyCalcResult(item, state.quickshellUtil);
      } else if (item.kind === "system") {
        Engine.executeSystemAction(item, state.quickshellUtil);
      } else if (item.kind === "web") {
        Engine.openWebUrl(item, state.quickshellUtil);
      }
      state.dismiss();
    },

    openWebUrl(item) {
      if (item) Engine.openWebUrl(item, state.quickshellUtil);
      state.dismiss();
    },

    executeSystemAction(item) {
      if (item) Engine.executeSystemAction(item, state.quickshellUtil);
      state.dismiss();
    },

    copyCalcResult(item) {
      if (item) Engine.copyCalcResult(item, state.quickshellUtil);
    },

    openFile(item) {
      if (item) Engine.openFile(item, state.quickshellUtil);
      state.dismiss();
    },

    showInFolder(item) {
      if (item) Engine.showInFolder(item, state.quickshellUtil);
      state.dismiss();
    },

    openTerminal(item) {
      if (item) Engine.openTerminal(item, state.quickshellUtil);
      state.dismiss();
    },

    copyPath(item) {
      if (item) Engine.copyPath(item, state.quickshellUtil);
    }
  };

  return state;
}

module.exports = {
  loadQmlJs,
  createIrisEngine,
  createIrisOverlayState
};
