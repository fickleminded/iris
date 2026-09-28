const { test, describe, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { createIrisEngine, createIrisOverlayState } = require("./helpers/qml-env.js");

describe("Desktop Applications Launcher Feature", () => {
  const sampleDesktopApps = [
    {
      id: "firefox",
      name: "Firefox",
      genericName: "Web Browser",
      comment: "Browse the World Wide Web",
      keywords: ["web", "internet", "browser"],
      exec: "firefox %u",
      categories: ["Network", "WebBrowser"]
    },
    {
      id: "google-chrome",
      name: "Google Chrome",
      genericName: "Web Browser",
      comment: "Access the Internet",
      keywords: ["google", "chrome", "internet"],
      exec: "google-chrome-stable %U",
      categories: ["Network", "WebBrowser"]
    },
    {
      id: "foot",
      name: "Terminal",
      genericName: "Wayland Terminal Emulator",
      comment: "Fast Wayland terminal",
      keywords: ["shell", "prompt", "command line"],
      exec: "foot",
      categories: ["System", "TerminalEmulator"]
    },
    {
      id: "code",
      name: "Visual Studio Code",
      genericName: "Code Editor",
      comment: "Code Editing. Redefined.",
      keywords: ["vscode", "development", "ide"],
      exec: "code %F",
      categories: ["Development", "IDE"]
    },
    {
      id: "hidden-utility",
      name: "Internal Helper",
      genericName: "Background Helper",
      comment: "Should not appear in search",
      exec: "helper",
      noDisplay: true
    }
  ];

  let engine;
  let AppProvider;

  beforeEach(() => {
    const iris = createIrisEngine();
    engine = iris.Engine;
    AppProvider = iris.AppProvider;
  });

  describe("1. Search & Matching Precision", () => {
    test("matches applications by exact name as top hit", () => {
      const results = AppProvider.search("firefox", sampleDesktopApps);

      assert.ok(results.length > 0);
      const top = results[0];
      assert.strictEqual(top.name, "Firefox");
      assert.strictEqual(top.appId, "firefox");
      assert.strictEqual(top.isTopHit, true);
    });

    test("matches applications by name prefix", () => {
      const results = AppProvider.search("fire", sampleDesktopApps);

      assert.ok(results.length > 0);
      assert.strictEqual(results[0].name, "Firefox");
    });

    test("matches applications by acronym / initialism", () => {
      // "gc" matches "Google Chrome"
      const chromeResults = AppProvider.search("gc", sampleDesktopApps);
      assert.ok(chromeResults.length > 0);
      assert.strictEqual(chromeResults[0].name, "Google Chrome");

      // "vsc" matches "Visual Studio Code"
      const vscResults = AppProvider.search("vsc", sampleDesktopApps);
      assert.ok(vscResults.length > 0);
      assert.strictEqual(vscResults[0].name, "Visual Studio Code");
    });

    test("matches applications by genericName and comment", () => {
      // Searching "browser" finds Firefox & Chrome via genericName
      const browserResults = AppProvider.search("browser", sampleDesktopApps);
      assert.ok(browserResults.length >= 2);
      const names = browserResults.map(r => r.name);
      assert.ok(names.includes("Firefox"));
      assert.ok(names.includes("Google Chrome"));

      // Searching "command line" matches foot terminal via comment / keywords
      const terminalResults = AppProvider.search("command line", sampleDesktopApps);
      assert.ok(terminalResults.length > 0);
      assert.strictEqual(terminalResults[0].name, "Terminal");
    });

    test("matches applications by keywords list", () => {
      // "development" matches VS Code keywords
      const devResults = AppProvider.search("development", sampleDesktopApps);
      assert.ok(devResults.length > 0);
      assert.strictEqual(devResults[0].name, "Visual Studio Code");
    });

    test("case-insensitive searching across all fields", () => {
      const results = AppProvider.search("FIREFOX", sampleDesktopApps);
      assert.ok(results.length > 0);
      assert.strictEqual(results[0].name, "Firefox");
    });

    test("filters out applications with noDisplay: true", () => {
      const results = AppProvider.search("Internal Helper", sampleDesktopApps);
      assert.strictEqual(results.length, 0);
    });
  });

  describe("2. Result Model Schema & Preview Properties", () => {
    test("populates standardized IrisItem fields with preview enabled", () => {
      const results = AppProvider.search("terminal", sampleDesktopApps);
      const app = results[0];

      assert.strictEqual(app.kind, "app");
      assert.strictEqual(app.category, "Applications");
      assert.strictEqual(app.hasPreview, true);
      assert.strictEqual(app.previewType, "app");
      assert.strictEqual(app.action, "launch-app");
      assert.strictEqual(app.appId, "foot");
      assert.strictEqual(app.name, "Terminal");
      assert.strictEqual(app.description, "Wayland Terminal Emulator");

      assert.strictEqual(app.comment, "Fast Wayland terminal");
      assert.deepStrictEqual(Array.from(app.categories), ["System", "TerminalEmulator"]);
    });
  });

  describe("3. Application Launch Execution", () => {
    test("launches via Omarchy shell appLibrary when available", () => {
      let launchedApp = null;
      const mockShell = {
        appLibrary: {
          launch(id, name) {
            launchedApp = { id, name };
            return true;
          }
        }
      };

      const item = {
        kind: "app",
        appId: "firefox",
        name: "Firefox"
      };

      const success = AppProvider.launch(item, mockShell, null);
      assert.strictEqual(success, true);
      assert.deepStrictEqual(launchedApp, { id: "firefox", name: "Firefox" });
    });

    test("launches via quickshellUtil detached command when shell is unavailable", () => {
      let detachedCommand = null;
      const mockUtil = {
        shellQuote(s) {
          return `'${s}'`;
        },
        execDetached(cmd) {
          detachedCommand = cmd;
          return true;
        }
      };

      const item = {
        kind: "app",
        appId: "code",
        name: "Visual Studio Code"
      };

      const success = AppProvider.launch(item, null, mockUtil);
      assert.strictEqual(success, true);
      assert.strictEqual(detachedCommand, "uwsm-app -- gtk-launch 'code.desktop'");
    });

    test("returns false safely when item is null or missing appId", () => {
      assert.strictEqual(AppProvider.launch(null, null, null), false);
      assert.strictEqual(AppProvider.launch({}, null, null), false);
      assert.strictEqual(AppProvider.launch({ name: "Invalid" }, null, null), false);
    });
  });

  describe("4. End-to-End Iris Overlay Integration", () => {
    test("typing app query in Iris selects application and expands to two-pane mode", () => {
      const iris = createIrisOverlayState({ applications: sampleDesktopApps });
      iris.open("{}");

      iris.setFilterText("code");

      assert.ok(iris.itemsList.length > 0);
      assert.strictEqual(iris.selectedItem.name, "Visual Studio Code");
      assert.strictEqual(iris.selectedItem.kind, "app");
      assert.strictEqual(iris.hasPreview, true);
      assert.strictEqual(iris.currentCardWidth, 920);
    });

    test("activating selected app launches process and dismisses overlay", () => {
      const iris = createIrisOverlayState({ applications: sampleDesktopApps });
      iris.open("{}");
      iris.setFilterText("firefox");

      assert.strictEqual(iris.opened, true);
      assert.strictEqual(iris.selectedItem.name, "Firefox");

      // User presses Enter / activates item
      iris.activateItem(iris.selectedItem);

      // Verify app launched
      assert.strictEqual(iris.launchedApps.length, 1);
      assert.strictEqual(iris.launchedApps[0].id, "firefox");

      // Verify overlay dismissed
      assert.strictEqual(iris.opened, false);
      assert.strictEqual(iris.shellCalls.hide, 1);
    });
  });
});
