const { test, describe, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { createIrisEngine, createIrisOverlayState } = require("./helpers/qml-env.js");

describe("Files & Folders Search & Preview Feature", () => {
  let engine;
  let FileProvider;

  beforeEach(() => {
    const iris = createIrisEngine();
    engine = iris.Engine;
    FileProvider = iris.FileProvider;
  });

  describe("1. Query Generation (buildFdArgs)", () => {
    test("builds fd command with standard limit, exclusions, and search directory", () => {
      const args = Array.from(FileProvider.buildFdArgs("report", "/home/user"));

      assert.strictEqual(args[0], "fd");
      assert.ok(args.includes("--max-results"));
      assert.ok(args.includes("25"));

      // Standard noise exclusions
      assert.ok(args.includes(".git"));
      assert.ok(args.includes("node_modules"));
      assert.ok(args.includes(".cache"));
      assert.ok(args.includes(".venv"));

      // Search target and directory
      assert.strictEqual(args[args.length - 2], "report");
      assert.strictEqual(args[args.length - 1], "/home/user");

      // Regular query should not include hidden flag
      assert.strictEqual(args.includes("-H"), false);
    });

    test("includes -H flag when query starts with a dot (hidden files)", () => {
      const args = Array.from(FileProvider.buildFdArgs(".config", "/home/user"));

      assert.ok(args.includes("-H"));
      assert.strictEqual(args[args.length - 2], ".config");
    });
  });

  describe("2. Output Parsing, Categorization & Preview Metadata", () => {
    const mockFdOutput = [
      "/home/user/Documents/Projects/",
      "/home/user/Documents/report.pdf",
      "/home/user/Projects/iris/Iris.qml",
      "/home/user/Pictures/wallpaper.png",
      "/home/user/Music/track.flac",
      "/home/user/Downloads/backup.tar.gz",
      "/home/user/notes.txt",
      "/home/user/data.unknown"
    ].join("\n");

    test("parses fd stdout into structured Iris item models", () => {
      const items = Array.from(FileProvider.parseOutput(mockFdOutput, "/home/user"));

      assert.strictEqual(items.length, 8);
      items.forEach(item => {
        assert.strictEqual(item.kind, "file");
        assert.strictEqual(item.hasPreview, true);
        assert.strictEqual(item.previewType, "file");
        assert.strictEqual(item.action, "open-file");
      });
    });

    test("identifies folders with correct trailing slash handling and category", () => {
      const items = Array.from(FileProvider.parseOutput(mockFdOutput, "/home/user"));
      const folder = items[0];

      assert.strictEqual(folder.name, "Projects");
      assert.strictEqual(folder.path, "/home/user/Documents/Projects");
      assert.strictEqual(folder.dir, "/home/user/Documents");
      assert.strictEqual(folder.isFolder, true);
      assert.strictEqual(folder.category, "Folders");
      assert.strictEqual(folder.icon, "󰉋");
      assert.strictEqual(folder.description, "~/Documents");
    });

    test("categorizes files accurately by extension and assigns distinct icons", () => {
      const items = Array.from(FileProvider.parseOutput(mockFdOutput, "/home/user"));
      const itemMap = new Map(items.map(i => [i.name, i]));

      // Code
      const qmlFile = itemMap.get("Iris.qml");
      assert.strictEqual(qmlFile.category, "Code");
      assert.strictEqual(qmlFile.extension, "qml");
      assert.strictEqual(qmlFile.icon, "󰌠");

      // Documents
      const pdfFile = itemMap.get("report.pdf");
      assert.strictEqual(pdfFile.category, "Documents");
      assert.strictEqual(pdfFile.extension, "pdf");
      assert.strictEqual(pdfFile.icon, "󰈙");

      // Images
      const imgFile = itemMap.get("wallpaper.png");
      assert.strictEqual(imgFile.category, "Images");
      assert.strictEqual(imgFile.extension, "png");
      assert.strictEqual(imgFile.icon, "󰋩");

      // Media
      const mediaFile = itemMap.get("track.flac");
      assert.strictEqual(mediaFile.category, "Media");
      assert.strictEqual(mediaFile.extension, "flac");
      assert.strictEqual(mediaFile.icon, "󰝚");

      // Archives
      const archiveFile = itemMap.get("backup.tar.gz");
      assert.strictEqual(archiveFile.category, "Archives");
      assert.strictEqual(archiveFile.icon, "󰛫");

      // Generic Files
      const genericFile = itemMap.get("data.unknown");
      assert.strictEqual(genericFile.category, "Files");
      assert.strictEqual(genericFile.icon, "󰈔");
    });

    test("returns empty array for empty or whitespace output", () => {
      assert.deepStrictEqual(Array.from(FileProvider.parseOutput("", "/home/user")), []);
      assert.deepStrictEqual(Array.from(FileProvider.parseOutput("   \n  ", "/home/user")), []);
    });
  });

  describe("3. File Action Handlers", () => {
    let executedCommands = [];
    const mockUtil = {
      shellQuote(s) {
        return `'${s}'`;
      },
      env(name) {
        return name === "HOME" ? "/home/user" : "";
      },
      execDetached(cmd) {
        executedCommands.push(cmd);
        return true;
      }
    };

    beforeEach(() => {
      executedCommands = [];
    });

    test("open() executes xdg-open with quoted path", () => {
      const fileItem = { path: "/home/user/notes.txt" };
      FileProvider.open(fileItem, mockUtil);

      assert.strictEqual(executedCommands.length, 1);
      assert.strictEqual(executedCommands[0], "xdg-open '/home/user/notes.txt'");
    });

    test("showInFolder() reveals file in nautilus file manager", () => {
      const fileItem = { path: "/home/user/Documents/report.pdf" };
      FileProvider.showInFolder(fileItem, mockUtil);

      assert.strictEqual(executedCommands.length, 1);
      assert.strictEqual(executedCommands[0], "uwsm-app -- nautilus --select '/home/user/Documents/report.pdf'");
    });

    test("openTerminal() opens terminal in directory of selected file", () => {
      const fileItem = {
        path: "/home/user/Projects/iris/Iris.qml",
        dir: "/home/user/Projects/iris",
        isFolder: false
      };
      FileProvider.openTerminal(fileItem, mockUtil);

      assert.strictEqual(executedCommands.length, 1);
      assert.strictEqual(executedCommands[0], "uwsm-app -- xdg-terminal-exec --dir='/home/user/Projects/iris'");
    });

    test("openTerminal() opens terminal directly in selected folder path", () => {
      const folderItem = {
        path: "/home/user/Projects/iris",
        isFolder: true
      };
      FileProvider.openTerminal(folderItem, mockUtil);

      assert.strictEqual(executedCommands.length, 1);
      assert.strictEqual(executedCommands[0], "uwsm-app -- xdg-terminal-exec --dir='/home/user/Projects/iris'");
    });

    test("copyPath() copies exact path to wl-clipboard", () => {
      const fileItem = { path: "/home/user/Pictures/wallpaper.png" };
      FileProvider.copyPath(fileItem, mockUtil);

      assert.strictEqual(executedCommands.length, 1);
      assert.strictEqual(executedCommands[0], "printf %s '/home/user/Pictures/wallpaper.png' | wl-copy");
    });

    test("action handlers safely handle null or malformed items", () => {
      FileProvider.open(null, mockUtil);
      FileProvider.showInFolder(null, mockUtil);
      FileProvider.openTerminal(null, mockUtil);
      FileProvider.copyPath(null, mockUtil);

      assert.strictEqual(executedCommands.length, 0);
    });
  });

  describe("4. End-to-End Iris Overlay Integration", () => {
    test("surfacing file search results adapts overlay to two-pane mode", () => {
      const iris = createIrisOverlayState();
      iris.open("{}");

      const parsedFiles = FileProvider.parseOutput("/home/user/Projects/iris/Iris.qml", "/home/user");
      iris.fileResults = parsedFiles;
      iris.setFilterText("iris");

      assert.ok(iris.itemsList.length > 0);
      const fileItem = iris.itemsList.find(i => i.kind === "file");
      assert.ok(fileItem);
      assert.strictEqual(fileItem.name, "Iris.qml");
      assert.strictEqual(fileItem.hasPreview, true);
      assert.strictEqual(fileItem.previewType, "file");

      // Select file item and verify two-pane adaptation
      iris.selectedIndex = iris.itemsList.indexOf(fileItem);
      assert.strictEqual(iris.hasPreview, true);
      assert.strictEqual(iris.currentCardWidth, 920);
    });

    test("activating file item opens file and dismisses overlay", () => {
      const iris = createIrisOverlayState();
      iris.open("{}");

      const parsedFiles = FileProvider.parseOutput("/home/user/report.pdf", "/home/user");
      iris.fileResults = parsedFiles;
      iris.setFilterText("report");

      const fileItem = iris.itemsList.find(i => i.kind === "file");
      assert.ok(fileItem);

      iris.activateItem(fileItem);

      assert.strictEqual(iris.launchedCommands.length, 1);
      assert.strictEqual(iris.launchedCommands[0], "xdg-open '/home/user/report.pdf'");
      assert.strictEqual(iris.opened, false);
      assert.strictEqual(iris.shellCalls.hide, 1);
    });

    test("showInFolder action triggers reveal command and dismisses overlay", () => {
      const iris = createIrisOverlayState();
      iris.open("{}");

      const parsedFiles = FileProvider.parseOutput("/home/user/report.pdf", "/home/user");
      iris.fileResults = parsedFiles;
      iris.setFilterText("report");

      const fileItem = iris.itemsList.find(i => i.kind === "file");
      iris.showInFolder(fileItem);

      assert.strictEqual(iris.launchedCommands.length, 1);
      assert.strictEqual(iris.launchedCommands[0], "uwsm-app -- nautilus --select '/home/user/report.pdf'");
      assert.strictEqual(iris.opened, false);
    });

    test("copyPath action triggers wl-copy without dismissing overlay", () => {
      const iris = createIrisOverlayState();
      iris.open("{}");

      const parsedFiles = FileProvider.parseOutput("/home/user/report.pdf", "/home/user");
      iris.fileResults = parsedFiles;
      iris.setFilterText("report");

      const fileItem = iris.itemsList.find(i => i.kind === "file");
      iris.copyPath(fileItem);

      assert.strictEqual(iris.launchedCommands.length, 1);
      assert.strictEqual(iris.launchedCommands[0], "printf %s '/home/user/report.pdf' | wl-copy");
      // Copy path does not dismiss so user keeps their context
      assert.strictEqual(iris.opened, true);
    });
  });
});
