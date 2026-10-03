const { test, describe, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { createIrisOverlayState } = require("./helpers/qml-env.js");

describe("Iris Overlay Core Lifecycle & Adaptive Presentation", () => {
  let iris;

  beforeEach(() => {
    iris = createIrisOverlayState();
  });

  describe("1. Initial Launch & First-Time Presentation", () => {
    test("starts in closed state prior to invocation", () => {
      assert.strictEqual(iris.opened, false);
      assert.strictEqual(iris.itemsList.length, 0);
      assert.strictEqual(iris.selectedItem, null);
    });

    test("launching opens the overlay and initializes query state", () => {
      iris.open("{}");

      assert.strictEqual(iris.opened, true);
      assert.strictEqual(iris.filterText, "");
      assert.strictEqual(iris.selectedIndex, 0);
    });

    test("picks a greeting placeholder from the curated rotation list", () => {
      iris.open("{}");

      assert.ok(iris.placeholders.includes(iris.currentPlaceholder));
      assert.ok(iris.currentPlaceholder.length > 0);
    });

    test("first-time view presents discovery hints across core categories", () => {
      iris.open("{}");

      // Exactly 7 discovery hints on empty launch (Apps, Files, Calc, AI, Web, Reminders, System)
      assert.strictEqual(iris.itemsList.length, 7);

      const categories = Array.from(iris.itemsList.map(item => item.category));
      assert.deepStrictEqual(categories, [
        "Applications",
        "Files & Folders",
        "Calculator",
        "AI Agent",
        "Web Search",
        "Reminders",
        "System Actions"
      ]);

      // All initial hints should have kind "hint" and action "hint"
      iris.itemsList.forEach(item => {
        assert.strictEqual(item.kind, "hint");
        assert.strictEqual(item.action, "hint");
      });
    });

    test("default cursor selects the first hint on launch", () => {
      iris.open("{}");

      assert.strictEqual(iris.selectedIndex, 0);
      assert.strictEqual(iris.selectedItem.id, "hint-apps");
      assert.strictEqual(iris.selectedItem.name, "Search Applications");
    });

    test("navigating items with select(delta) updates cursor and wraps around", () => {
      iris.open("{}");

      iris.select(1);
      assert.strictEqual(iris.selectedIndex, 1);
      assert.strictEqual(iris.selectedItem.id, "hint-files");

      iris.select(5);
      assert.strictEqual(iris.selectedIndex, 6);
      assert.strictEqual(iris.selectedItem.id, "hint-system");

      // Wrap around to top
      iris.select(1);
      assert.strictEqual(iris.selectedIndex, 0);

      // Wrap around backwards to bottom
      iris.select(-1);
      assert.strictEqual(iris.selectedIndex, 6);
    });

    test("activating a hint populates actionable query template", () => {
      iris.open("{}");

      // Find web search hint
      const webHint = iris.itemsList.find(i => i.id === "hint-web");
      assert.ok(webHint);
      assert.strictEqual(webHint.fillQuery, "!g ");

      iris.activateItem(webHint);
      assert.strictEqual(iris.filterText, "!g ");
      // Typing "!g " triggers search query refresh
      assert.ok(iris.itemsList.length > 0);
    });
  });

  describe("2. Dismiss & Shell Lifecycle", () => {
    test("dismiss() closes the overlay and triggers shell hide IPC", () => {
      iris.open("{}");
      assert.strictEqual(iris.opened, true);

      iris.dismiss();

      assert.strictEqual(iris.opened, false);
      assert.strictEqual(iris.shellCalls.hide, 1);
    });

    test("toggle() summons when closed and dismisses when open", () => {
      assert.strictEqual(iris.opened, false);

      iris.toggle();
      assert.strictEqual(iris.opened, true);

      iris.toggle();
      assert.strictEqual(iris.opened, false);
      assert.strictEqual(iris.shellCalls.hide, 1);
    });

    test("opening with direct query pre-populates search filter", () => {
      iris.open(JSON.stringify({ query: "calc 12 * 8" }));

      assert.strictEqual(iris.opened, true);
      assert.strictEqual(iris.filterText, "calc 12 * 8");
      assert.ok(iris.itemsList.length > 0);
    });
  });

  describe("3. Adaptive Single-Pane vs Two-Pane Mode Geometry", () => {
    test("initial launch presents compact single-pane mode (640px) with no preview", () => {
      iris.open("{}");

      // All initial hints have hasPreview === false
      assert.strictEqual(iris.hasPreview, false);
      assert.strictEqual(iris.currentCardWidth, 640);
    });

    test("expands to two-pane mode (920px) when an item has live preview", () => {
      iris.open("{}");
      assert.strictEqual(iris.currentCardWidth, 640);

      // Calculator query produces an instant calculation item with hasPreview === true
      iris.setFilterText("25 * 4");

      assert.ok(iris.itemsList.length > 0);
      assert.strictEqual(iris.selectedItem.category, "Calculator");
      assert.strictEqual(iris.selectedItem.hasPreview, true);
      assert.strictEqual(iris.selectedItem.previewType, "calc");

      // Geometry adapts to full two-pane width
      assert.strictEqual(iris.hasPreview, true);
      assert.strictEqual(iris.currentCardWidth, 920);
    });

    test("collapses back to single-pane mode (640px) when returning to non-preview query", () => {
      iris.open("{}");

      // 1. Expand to two-pane with calculator
      iris.setFilterText("100 eur to usd");
      assert.strictEqual(iris.hasPreview, true);
      assert.strictEqual(iris.currentCardWidth, 920);

      // 2. Clear query back to initial hints
      iris.setFilterText("");
      assert.strictEqual(iris.hasPreview, false);
      assert.strictEqual(iris.currentCardWidth, 640);
    });

    test("web search bang adapts to two-pane mode with destination preview", () => {
      iris.open("{}");

      iris.setFilterText("!gh omarchy");

      assert.ok(iris.itemsList.length > 0);
      assert.strictEqual(iris.selectedItem.category, "Web");
      assert.strictEqual(iris.selectedItem.hasPreview, true);
      assert.strictEqual(iris.selectedItem.previewType, "web");
      assert.strictEqual(iris.currentCardWidth, 920);
    });

    test("AI agent query adapts to two-pane mode with AI preview", () => {
      iris.open("{}");

      iris.setFilterText("ai explain quickshell");

      assert.ok(iris.itemsList.length > 0);
      assert.strictEqual(iris.selectedItem.category, "AI Agent");
      assert.strictEqual(iris.selectedItem.hasPreview, true);
      assert.strictEqual(iris.selectedItem.previewType, "ai");
      assert.strictEqual(iris.currentCardWidth, 920);
    });
  });

  describe("4. Clipboard Security & Bounds Verification", () => {
    test("Iris.qml only executes bounded wl-paste pipelines capped at 4096 bytes", () => {
      const qmlPath = require("node:path").resolve(__dirname, "../Iris.qml");
      const qmlSource = require("node:fs").readFileSync(qmlPath, "utf8");

      // Verify no unbounded wl-paste array is passed to Process.command
      assert.strictEqual(
        qmlSource.includes('["wl-paste"'),
        false,
        "Iris.qml must never assign direct unbounded ['wl-paste', ...] commands"
      );

      // Verify pasteCommand and primaryPasteCommand are bounded
      assert.ok(
        qmlSource.includes("wl-paste --no-newline 2>/dev/null | head -c 4096"),
        "Standard paste command must pipe to head -c 4096"
      );
      assert.ok(
        qmlSource.includes("wl-paste --primary --no-newline 2>/dev/null | head -c 4096"),
        "Primary paste command must pipe to head -c 4096"
      );

      // Verify pasteFromClipboard and pastePrimarySelection use bounded commands
      assert.ok(
        qmlSource.includes("pasteProcess.command = root.pasteCommand"),
        "pasteFromClipboard must use bounded root.pasteCommand"
      );
      assert.ok(
        qmlSource.includes("primaryPasteProcess.command = root.primaryPasteCommand"),
        "pastePrimarySelection must use bounded root.primaryPasteCommand"
      );
    });
  });
});
