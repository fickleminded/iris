const { test, describe, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { createIrisEngine, createIrisOverlayState } = require("./helpers/qml-env.js");

describe("Omarchy System Commands & Actions (SystemProvider)", () => {
  let engine;
  let SystemProvider;

  const mockThemes = ["Tokyo Night", "Catppuccin Mocha", "Nord", "Gruvbox", "Everforest"];

  beforeEach(() => {
    const iris = createIrisEngine();
    engine = iris.Engine;
    SystemProvider = iris.SystemProvider;
  });

  describe("1. Static System Actions Inventory & Schema", () => {
    test("defines all 24 core Omarchy system actions with complete schemas", () => {
      const actions = SystemProvider.SYSTEM_ACTIONS;
      assert.strictEqual(actions.length, 24);

      actions.forEach(act => {
        assert.ok(act.id && act.id.startsWith("sys-"), `Invalid id for ${act.name}: ${act.id}`);
        assert.ok(typeof act.name === "string" && act.name.length > 0, `Missing name for ${act.id}`);
        assert.ok(typeof act.category === "string" && act.category.length > 0, `Missing category for ${act.id}`);
        assert.ok(typeof act.description === "string" && act.description.length > 0, `Missing description for ${act.id}`);
        assert.ok(typeof act.command === "string" && act.command.length > 0, `Missing command for ${act.id}`);
        assert.ok(typeof act.icon === "string" && act.icon.length > 0, `Missing icon for ${act.id}`);
        assert.ok(Array.isArray(act.keywords) && act.keywords.length > 0, `Missing keywords for ${act.id}`);
        assert.ok(["normal", "medium", "high"].includes(act.dangerLevel), `Invalid dangerLevel for ${act.id}: ${act.dangerLevel}`);
        assert.ok(typeof act.isDestructive === "boolean", `isDestructive must be boolean for ${act.id}`);
        assert.ok(typeof act.detailText === "string" && act.detailText.length > 0, `Missing detailText for ${act.id}`);
      });
    });

    test("accurately flags high-danger and destructive power operations", () => {
      const actions = SystemProvider.SYSTEM_ACTIONS;

      // High danger & destructive: reboot and poweroff
      const reboot = actions.find(a => a.id === "sys-reboot");
      assert.ok(reboot);
      assert.strictEqual(reboot.dangerLevel, "high");
      assert.strictEqual(reboot.isDestructive, true);
      assert.strictEqual(reboot.command, "omarchy system reboot");

      const poweroff = actions.find(a => a.id === "sys-poweroff");
      assert.ok(poweroff);
      assert.strictEqual(poweroff.dangerLevel, "high");
      assert.strictEqual(poweroff.isDestructive, true);
      assert.strictEqual(poweroff.command, "omarchy system shutdown");

      // Medium danger: suspend and logout
      const suspend = actions.find(a => a.id === "sys-suspend");
      assert.ok(suspend);
      assert.strictEqual(suspend.dangerLevel, "medium");
      assert.strictEqual(suspend.isDestructive, false);
      assert.strictEqual(suspend.command, "systemctl suspend");

      const logout = actions.find(a => a.id === "sys-logout");
      assert.ok(logout);
      assert.strictEqual(logout.dangerLevel, "medium");
      assert.strictEqual(logout.isDestructive, true);
      assert.strictEqual(logout.command, "omarchy system logout");

      // Non-destructive safe actions: lock screen
      const lock = actions.find(a => a.id === "sys-lock");
      assert.ok(lock);
      assert.strictEqual(lock.dangerLevel, "normal");
      assert.strictEqual(lock.isDestructive, false);
      assert.strictEqual(lock.command, "omarchy system lock");
    });

    test("verifies all 24 system actions are discoverable by primary query", () => {
      const actions = SystemProvider.SYSTEM_ACTIONS;

      actions.forEach(action => {
        // Query using the action's first keyword
        const query = action.keywords[0];
        const results = SystemProvider.search(query, { themes: mockThemes });

        const matched = results.find(r => r.id === action.id);
        assert.ok(matched, `Action ${action.id} (${action.name}) was not found using keyword "${query}"`);
        assert.strictEqual(matched.command, action.command);
        assert.strictEqual(matched.hasPreview, true);
        assert.strictEqual(matched.previewType, "system");
        assert.strictEqual(matched.action, "execute");
      });
    });
  });

  describe("2. Search & Ranking Precision Across Categories", () => {
    test("Category: Appearance - Wallpaper and Theme controls", () => {
      const bgResults = SystemProvider.search("wallpaper", { themes: mockThemes });
      assert.ok(bgResults.length > 0);
      assert.strictEqual(bgResults[0].id, "sys-theme-bg-switcher");
      assert.strictEqual(bgResults[0].command, "omarchy theme bg-switcher");

      const nextBgResults = SystemProvider.search("next wallpaper", { themes: mockThemes });
      assert.ok(nextBgResults.length > 0);
      assert.strictEqual(nextBgResults[0].id, "sys-theme-bg-next");
      assert.strictEqual(nextBgResults[0].command, "iris wallpaper next || omarchy theme bg next");
    });

    test("Category: Desktop Shell & Compositor controls", () => {
      const shellResults = SystemProvider.search("restart shell", { themes: mockThemes });
      assert.ok(shellResults.length > 0);
      assert.strictEqual(shellResults[0].id, "sys-restart-shell");
      assert.strictEqual(shellResults[0].command, "omarchy restart shell");

      const hyprResults = SystemProvider.search("reload hyprland", { themes: mockThemes });
      assert.ok(hyprResults.length > 0);
      assert.strictEqual(hyprResults[0].id, "sys-reload-hyprland");
      assert.strictEqual(hyprResults[0].command, "omarchy restart hyprctl");

      const waybarResults = SystemProvider.search("restart waybar", { themes: mockThemes });
      assert.ok(waybarResults.length > 0);
      assert.strictEqual(waybarResults[0].id, "sys-restart-waybar");
      assert.strictEqual(waybarResults[0].command, "omarchy restart waybar");

      const barResults = SystemProvider.search("toggle bar", { themes: mockThemes });
      assert.ok(barResults.length > 0);
      assert.strictEqual(barResults[0].id, "sys-toggle-bar");
      assert.strictEqual(barResults[0].command, "omarchy toggle bar");
    });

    test("Category: Hardware, Display & Peripherals", () => {
      const nightResults = SystemProvider.search("nightlight", { themes: mockThemes });
      assert.ok(nightResults.length > 0);
      assert.strictEqual(nightResults[0].id, "sys-nightlight");
      assert.strictEqual(nightResults[0].command, "omarchy toggle nightlight");

      const padResults = SystemProvider.search("touchpad", { themes: mockThemes });
      assert.ok(padResults.length > 0);
      assert.strictEqual(padResults[0].id, "sys-toggle-touchpad");
      assert.strictEqual(padResults[0].command, "omarchy toggle touchpad");

      const idleResults = SystemProvider.search("keep awake", { themes: mockThemes });
      assert.ok(idleResults.length > 0);
      assert.strictEqual(idleResults[0].id, "sys-toggle-idle");
      assert.strictEqual(idleResults[0].command, "omarchy toggle idle");

      const audioResults = SystemProvider.search("restart audio", { themes: mockThemes });
      assert.ok(audioResults.length > 0);
      assert.strictEqual(audioResults[0].id, "sys-restart-audio");
      assert.strictEqual(audioResults[0].command, "omarchy restart audio");

      const wifiResults = SystemProvider.search("restart wifi", { themes: mockThemes });
      assert.ok(wifiResults.length > 0);
      assert.strictEqual(wifiResults[0].id, "sys-restart-wifi");
      assert.strictEqual(wifiResults[0].command, "omarchy restart wifi");

      const btResults = SystemProvider.search("restart bluetooth", { themes: mockThemes });
      assert.ok(btResults.length > 0);
      assert.strictEqual(btResults[0].id, "sys-restart-bluetooth");
      assert.strictEqual(btResults[0].command, "omarchy restart bluetooth");

      const dndResults = SystemProvider.search("dnd", { themes: mockThemes });
      assert.ok(dndResults.length > 0);
      assert.strictEqual(dndResults[0].id, "sys-toggle-dnd");
      assert.strictEqual(dndResults[0].command, "omarchy toggle notification silencing");
    });

    test("Category: Utilities & Maintenance", () => {
      const snipResults = SystemProvider.search("snip", { themes: mockThemes });
      assert.ok(snipResults.length > 0);
      assert.strictEqual(snipResults[0].id, "sys-screenshot");
      assert.strictEqual(snipResults[0].command, "omarchy screenshot");

      const updateResults = SystemProvider.search("upgrade", { themes: mockThemes });
      assert.ok(updateResults.length > 0);
      assert.strictEqual(updateResults[0].id, "sys-update");
      assert.strictEqual(updateResults[0].command, "omarchy update");

      const shareResults = SystemProvider.search("localsend", { themes: mockThemes });
      assert.ok(shareResults.length > 0);
      assert.strictEqual(shareResults[0].id, "sys-share");
      assert.strictEqual(shareResults[0].command, "omarchy share");

      const saverResults = SystemProvider.search("matrix", { themes: mockThemes });
      assert.ok(saverResults.length > 0);
      assert.strictEqual(saverResults[0].id, "sys-screensaver");
      assert.strictEqual(saverResults[0].command, "omarchy screensaver");

      const snapResults = SystemProvider.search("snapper", { themes: mockThemes });
      assert.ok(snapResults.length > 0);
      assert.strictEqual(snapResults[0].id, "sys-snapshot");
      assert.strictEqual(snapResults[0].command, "omarchy snapshot");
    });

    test("Category: Session & Power controls", () => {
      const lockResults = SystemProvider.search("hyprlock", { themes: mockThemes });
      assert.ok(lockResults.length > 0);
      assert.strictEqual(lockResults[0].id, "sys-lock");
      assert.strictEqual(lockResults[0].command, "omarchy system lock");

      const sleepResults = SystemProvider.search("sleep", { themes: mockThemes });
      assert.ok(sleepResults.length > 0);
      assert.strictEqual(sleepResults[0].id, "sys-suspend");
      assert.strictEqual(sleepResults[0].command, "systemctl suspend");

      const rebootResults = SystemProvider.search("reboot system", { themes: mockThemes });
      assert.ok(rebootResults.length > 0);
      assert.strictEqual(rebootResults[0].id, "sys-reboot");
      assert.strictEqual(rebootResults[0].command, "omarchy system reboot");

      const shutResults = SystemProvider.search("shutdown", { themes: mockThemes });
      assert.ok(shutResults.length > 0);
      assert.strictEqual(shutResults[0].id, "sys-poweroff");
      assert.strictEqual(shutResults[0].command, "omarchy system shutdown");

      const logoutResults = SystemProvider.search("logout", { themes: mockThemes });
      assert.ok(logoutResults.length > 0);
      assert.strictEqual(logoutResults[0].id, "sys-logout");
      assert.strictEqual(logoutResults[0].command, "omarchy system logout");
    });

    test("handles case-insensitivity, leading/trailing whitespace, and empty queries safely", () => {
      assert.strictEqual(SystemProvider.search("").length, 0);
      assert.strictEqual(SystemProvider.search("   ").length, 0);

      const resMixedCase = SystemProvider.search("   rEbOoT   ", { themes: mockThemes });
      assert.ok(resMixedCase.length > 0);
      assert.strictEqual(resMixedCase[0].id, "sys-reboot");
    });
  });

  describe("3. Dynamic Themes Integration & Fallbacks", () => {
    test("typing 'theme' provides theme switcher as top hit along with installed themes", () => {
      const results = SystemProvider.search("theme", { themes: mockThemes });

      assert.ok(results.length >= 6); // 1 switcher + 5 dynamic themes
      assert.strictEqual(results[0].id, "sys-theme-switcher");
      assert.strictEqual(results[0].isTopHit, true);
      assert.strictEqual(results[0].command, "omarchy theme switcher");

      // Verify all installed themes are listed with correct commands
      mockThemes.forEach(th => {
        const themeSlug = th.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        const found = results.find(r => r.id === "sys-theme-" + themeSlug);
        assert.ok(found, `Expected theme action for ${th}`);
        assert.strictEqual(found.command, `omarchy theme set '${th}' || omarchy theme switcher`);
      });
    });

    test("matches dynamic theme when prefixed with 'theme <name>' or 'set theme <name>'", () => {
      const results = SystemProvider.search("theme tokyo night", { themes: mockThemes });
      assert.ok(results.length > 0);

      const topTheme = results[0];
      assert.strictEqual(topTheme.id, "sys-theme-tokyo-night");
      assert.strictEqual(topTheme.name, "Apply Theme: Tokyo Night");
      assert.strictEqual(topTheme.command, "omarchy theme set 'Tokyo Night' || omarchy theme switcher");
      assert.strictEqual(topTheme.isTopHit, true);
    });

    test("matches installed themes directly without 'theme' prefix", () => {
      const directResults = SystemProvider.search("catppuccin", { themes: mockThemes });
      assert.ok(directResults.length > 0);

      const top = directResults[0];
      assert.strictEqual(top.id, "sys-theme-catppuccin-mocha");
      assert.strictEqual(top.name, "Apply Theme: Catppuccin Mocha");
      assert.strictEqual(top.command, "omarchy theme set 'Catppuccin Mocha' || omarchy theme switcher");
    });

    test("generates fallback theme action when user specifies custom unlisted theme", () => {
      const customResults = SystemProvider.search("theme solarized-dark", { themes: mockThemes });
      assert.ok(customResults.length > 0);

      const customTheme = customResults.find(r => r.id === "sys-theme-solarized-dark");
      assert.ok(customTheme, "Custom theme action should be created");
      assert.strictEqual(customTheme.name, "Apply Theme: solarized-dark");
      assert.strictEqual(customTheme.command, "omarchy theme set 'solarized-dark' || omarchy theme switcher");
      assert.strictEqual(customTheme.isTopHit, true);
    });

    test("safely quotes theme names containing double quotes and shell metacharacters", () => {
      const malicious = 'evil" && touch /tmp/pwned #';
      const results = SystemProvider.search("theme " + malicious, { themes: [malicious] });
      assert.ok(results.length > 0);
      const action = results.find(r => r.name.includes(malicious));
      assert.ok(action);
      assert.strictEqual(action.command, "omarchy theme set 'evil\" && touch /tmp/pwned #' || omarchy theme switcher");
    });
  });

  describe("4. Command Execution via quickshellUtil (execute)", () => {
    test("executes action command detached via quickshellUtil", () => {
      const executed = [];
      const mockUtil = {
        execDetached(cmd) {
          executed.push(cmd);
          return true;
        }
      };

      const action = {
        id: "sys-lock",
        command: "omarchy system lock"
      };

      SystemProvider.execute(action, mockUtil);
      assert.strictEqual(executed.length, 1);
      assert.strictEqual(executed[0], "omarchy system lock");
    });

    test("safely ignores execution on null or missing commands", () => {
      const executed = [];
      const mockUtil = {
        execDetached(cmd) {
          executed.push(cmd);
        }
      };

      SystemProvider.execute(null, mockUtil);
      SystemProvider.execute({}, mockUtil);
      SystemProvider.execute({ command: "" }, mockUtil);

      assert.strictEqual(executed.length, 0);
    });
  });

  describe("5. End-to-End Iris Overlay Integration", () => {
    test("typing a system command expands overlay to two-pane mode with system preview", () => {
      const overlay = createIrisOverlayState({ themes: mockThemes });
      overlay.open("{}");

      // Initial state: single-pane 640px
      assert.strictEqual(overlay.filterText, "");
      assert.strictEqual(overlay.hasPreview, false);
      assert.strictEqual(overlay.currentCardWidth, 640);

      // Typing system action
      overlay.setFilterText("lock");

      assert.ok(overlay.itemsList.length > 0);
      const topHit = overlay.selectedItem;
      assert.strictEqual(topHit.id, "sys-lock");
      assert.strictEqual(topHit.kind, "system");
      assert.strictEqual(topHit.hasPreview, true);
      assert.strictEqual(topHit.previewType, "system");

      // Adaptive UI expansion to two-pane mode (920px)
      assert.strictEqual(overlay.currentCardWidth, 920);
    });

    test("activating a system action launches command and dismisses overlay", () => {
      const overlay = createIrisOverlayState({ themes: mockThemes });
      overlay.open("{}");
      overlay.setFilterText("wallpaper");

      const topHit = overlay.selectedItem;
      assert.strictEqual(topHit.id, "sys-theme-bg-switcher");

      // User presses Enter to activate
      overlay.activateItem(topHit);

      // Command executed
      assert.strictEqual(overlay.launchedCommands.length, 1);
      assert.strictEqual(overlay.launchedCommands[0], "omarchy theme bg-switcher");

      // Overlay dismissed
      assert.strictEqual(overlay.opened, false);
      assert.ok(overlay.shellCalls.hide >= 1);
    });

    test("direct executeSystemAction helper executes command and dismisses overlay", () => {
      const overlay = createIrisOverlayState({ themes: mockThemes });
      overlay.open("{}");

      const actionItem = {
        kind: "system",
        command: "omarchy restart shell"
      };

      overlay.executeSystemAction(actionItem);

      assert.strictEqual(overlay.launchedCommands.length, 1);
      assert.strictEqual(overlay.launchedCommands[0], "omarchy restart shell");
      assert.strictEqual(overlay.opened, false);
    });
  });
});
