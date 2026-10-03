const { test, describe, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { createIrisEngine, createIrisOverlayState } = require("./helpers/qml-env.js");

describe("Iris Reminders & Timers Provider (ReminderProvider)", () => {
  let iris;
  let Engine;
  let ReminderProvider;

  beforeEach(() => {
    iris = createIrisEngine();
    Engine = iris.Engine;
    ReminderProvider = iris.ReminderProvider;
  });

  describe("1. Duration Normalization (parseDurationMinutes)", () => {
    test("parses raw integers as minutes", () => {
      assert.strictEqual(ReminderProvider.parseDurationMinutes("5"), 5);
      assert.strictEqual(ReminderProvider.parseDurationMinutes("15"), 15);
      assert.strictEqual(ReminderProvider.parseDurationMinutes("120"), 120);
      assert.strictEqual(ReminderProvider.parseDurationMinutes("0"), 0);
      assert.strictEqual(ReminderProvider.parseDurationMinutes("-5"), 0);
    });

    test("parses explicit minutes notations", () => {
      assert.strictEqual(ReminderProvider.parseDurationMinutes("5m"), 5);
      assert.strictEqual(ReminderProvider.parseDurationMinutes("10min"), 10);
      assert.strictEqual(ReminderProvider.parseDurationMinutes("15 mins"), 15);
      assert.strictEqual(ReminderProvider.parseDurationMinutes("30 minutes"), 30);
      assert.strictEqual(ReminderProvider.parseDurationMinutes(" 45 min "), 45);
    });

    test("parses whole hours notations into minutes", () => {
      assert.strictEqual(ReminderProvider.parseDurationMinutes("1h"), 60);
      assert.strictEqual(ReminderProvider.parseDurationMinutes("1hr"), 60);
      assert.strictEqual(ReminderProvider.parseDurationMinutes("2 hrs"), 120);
      assert.strictEqual(ReminderProvider.parseDurationMinutes("3 hours"), 180);
      assert.strictEqual(ReminderProvider.parseDurationMinutes("12h"), 720);
      assert.strictEqual(ReminderProvider.parseDurationMinutes("24 hours"), 1440);
    });

    test("parses decimal hours notations into rounded minutes", () => {
      assert.strictEqual(ReminderProvider.parseDurationMinutes("0.25h"), 15);
      assert.strictEqual(ReminderProvider.parseDurationMinutes("0.5h"), 30);
      assert.strictEqual(ReminderProvider.parseDurationMinutes("0.75h"), 45);
      assert.strictEqual(ReminderProvider.parseDurationMinutes("1.5h"), 90);
      assert.strictEqual(ReminderProvider.parseDurationMinutes("2.5 hours"), 150);
      assert.strictEqual(ReminderProvider.parseDurationMinutes("0.1h"), 6);
    });

    test("parses compound hours and minutes notations", () => {
      assert.strictEqual(ReminderProvider.parseDurationMinutes("1h30m"), 90);
      assert.strictEqual(ReminderProvider.parseDurationMinutes("1h 30m"), 90);
      assert.strictEqual(ReminderProvider.parseDurationMinutes("2 hours 15 mins"), 135);
      assert.strictEqual(ReminderProvider.parseDurationMinutes("1hr and 15m"), 75);
      assert.strictEqual(ReminderProvider.parseDurationMinutes("1h 45mins"), 105);
    });

    test("gracefully handles invalid, empty, or garbage input", () => {
      assert.strictEqual(ReminderProvider.parseDurationMinutes(""), 0);
      assert.strictEqual(ReminderProvider.parseDurationMinutes(null), 0);
      assert.strictEqual(ReminderProvider.parseDurationMinutes(undefined), 0);
      assert.strictEqual(ReminderProvider.parseDurationMinutes("abc"), 0);
      assert.strictEqual(ReminderProvider.parseDurationMinutes("hello world"), 0);
      assert.strictEqual(ReminderProvider.parseDurationMinutes("-15m"), 0);
    });
  });

  describe("2. Time Formatting Utilities", () => {
    test("formatRemaining formats seconds to human readable strings matching omarchy-reminder", () => {
      assert.strictEqual(ReminderProvider.formatRemaining(125), "2m 5s");
      assert.strictEqual(ReminderProvider.formatRemaining(120), "2m");
      assert.strictEqual(ReminderProvider.formatRemaining(45), "45s");
      assert.strictEqual(ReminderProvider.formatRemaining(0), "0s");
      assert.strictEqual(ReminderProvider.formatRemaining(-10), "0s");
    });

    test("formatTargetTime computes correct target HH:MM clock time", () => {
      const fixedDate = new Date(2026, 9, 2, 14, 5, 0); // 14:05
      assert.strictEqual(ReminderProvider.formatTargetTime(10, fixedDate), "14:15");
      assert.strictEqual(ReminderProvider.formatTargetTime(55, fixedDate), "15:00");
      assert.strictEqual(ReminderProvider.formatTargetTime(1, fixedDate), "14:06");
      assert.strictEqual(ReminderProvider.formatTargetTime(60, fixedDate), "15:05");
    });
  });

  describe("3. Natural Language Query Parser (parseReminderQuery)", () => {
    test("parses 'remind me in <time> <message>' queries", () => {
      const q = ReminderProvider.parseReminderQuery("remind me in 10m check the oven");
      assert.ok(q);
      assert.strictEqual(q.type, "set");
      assert.strictEqual(q.minutes, 10);
      assert.strictEqual(q.message, "check the oven");
      assert.strictEqual(q.isTimer, false);
    });

    test("parses 'remind in <time> to <message>' stripping connector word 'to'", () => {
      const q = ReminderProvider.parseReminderQuery("remind in 1h to take a break");
      assert.ok(q);
      assert.strictEqual(q.type, "set");
      assert.strictEqual(q.minutes, 60);
      assert.strictEqual(q.message, "take a break");
      assert.strictEqual(q.isTimer, false);
    });

    test("parses 'remind <minutes> <message>' shorthand", () => {
      const q = ReminderProvider.parseReminderQuery("remind 15 call mom");
      assert.ok(q);
      assert.strictEqual(q.type, "set");
      assert.strictEqual(q.minutes, 15);
      assert.strictEqual(q.message, "call mom");
      assert.strictEqual(q.isTimer, false);
    });

    test("parses 'remind <minutes>' with no message", () => {
      const q = ReminderProvider.parseReminderQuery("remind 5");
      assert.ok(q);
      assert.strictEqual(q.type, "set");
      assert.strictEqual(q.minutes, 5);
      assert.strictEqual(q.message, "");
      assert.strictEqual(q.isTimer, false);
    });

    test("parses 'timer <duration> [label]'", () => {
      const q1 = ReminderProvider.parseReminderQuery("timer 25m Pomodoro");
      assert.ok(q1);
      assert.strictEqual(q1.type, "set");
      assert.strictEqual(q1.minutes, 25);
      assert.strictEqual(q1.message, "Pomodoro");
      assert.strictEqual(q1.isTimer, true);

      const q2 = ReminderProvider.parseReminderQuery("timer 10");
      assert.ok(q2);
      assert.strictEqual(q2.type, "set");
      assert.strictEqual(q2.minutes, 10);
      assert.strictEqual(q2.message, "");
      assert.strictEqual(q2.isTimer, true);

      const q3 = ReminderProvider.parseReminderQuery("timer 1h30m Deep Work");
      assert.ok(q3);
      assert.strictEqual(q3.type, "set");
      assert.strictEqual(q3.minutes, 90);
      assert.strictEqual(q3.message, "Deep Work");
      assert.strictEqual(q3.isTimer, true);
    });

    test("parses 'alarm <duration> [label]'", () => {
      const q = ReminderProvider.parseReminderQuery("alarm 15m Steep tea");
      assert.ok(q);
      assert.strictEqual(q.type, "set");
      assert.strictEqual(q.minutes, 15);
      assert.strictEqual(q.message, "Steep tea");
      assert.strictEqual(q.isTimer, true);
    });

    test("handles case-insensitivity in queries", () => {
      const q1 = ReminderProvider.parseReminderQuery("REMIND ME IN 20M MEETING");
      assert.ok(q1);
      assert.strictEqual(q1.type, "set");
      assert.strictEqual(q1.minutes, 20);
      assert.strictEqual(q1.message, "MEETING");

      const q2 = ReminderProvider.parseReminderQuery("Timer 45m Workshop");
      assert.ok(q2);
      assert.strictEqual(q2.type, "set");
      assert.strictEqual(q2.minutes, 45);
      assert.strictEqual(q2.message, "Workshop");
      assert.strictEqual(q2.isTimer, true);
    });

    test("parses bare trigger words as hints", () => {
      const qRemind = ReminderProvider.parseReminderQuery("remind");
      assert.ok(qRemind);
      assert.strictEqual(qRemind.type, "hint");
      assert.strictEqual(qRemind.isTimer, false);

      const qTimer = ReminderProvider.parseReminderQuery("timer");
      assert.ok(qTimer);
      assert.strictEqual(qTimer.type, "hint");
      assert.strictEqual(qTimer.isTimer, true);

      const qAlarm = ReminderProvider.parseReminderQuery("alarm");
      assert.ok(qAlarm);
      assert.strictEqual(qAlarm.type, "hint");
      assert.strictEqual(qAlarm.isTimer, true);
    });

    test("parses list active reminders queries", () => {
      ["reminders", "timers", "reminder list", "show reminders", "active reminders", "list reminders"].forEach(qStr => {
        const q = ReminderProvider.parseReminderQuery(qStr);
        assert.ok(q, `Failed for '${qStr}'`);
        assert.strictEqual(q.type, "list", `Expected type 'list' for '${qStr}'`);
      });
    });

    test("parses clear reminders queries", () => {
      ["clear reminders", "reminder clear", "cancel timer", "cancel timers", "clear all reminders"].forEach(qStr => {
        const q = ReminderProvider.parseReminderQuery(qStr);
        assert.ok(q, `Failed for '${qStr}'`);
        assert.strictEqual(q.type, "clear", `Expected type 'clear' for '${qStr}'`);
      });
    });

    test("parses interactive dialog summon queries", () => {
      ["open reminders", "reminders -i", "reminders interactive", "reminders --interactive"].forEach(qStr => {
        const q = ReminderProvider.parseReminderQuery(qStr);
        assert.ok(q, `Failed for '${qStr}'`);
        assert.strictEqual(q.type, "interactive", `Expected type 'interactive' for '${qStr}'`);
      });
    });

    test("returns null for non-reminder queries", () => {
      assert.strictEqual(ReminderProvider.parseReminderQuery("firefox"), null);
      assert.strictEqual(ReminderProvider.parseReminderQuery("calc 2+2"), null);
      assert.strictEqual(ReminderProvider.parseReminderQuery("ai hello"), null);
      assert.strictEqual(ReminderProvider.parseReminderQuery(""), null);
      assert.strictEqual(ReminderProvider.parseReminderQuery(null), null);
    });
  });

  describe("4. CLI Command Builder (buildCliCommand)", () => {
    test("builds command for reminder with custom message", () => {
      const cli = ReminderProvider.buildCliCommand({
        kind: "reminder-set",
        minutes: 10,
        message: "check the oven"
      });
      assert.strictEqual(cli.commandStr, "omarchy reminder 10 'check the oven'");
      assert.deepStrictEqual(Array.from(cli.commandArgs), ["omarchy", "reminder", "10", "check the oven"]);
    });

    test("escapes double and single quotes safely in custom message", () => {
      const cli = ReminderProvider.buildCliCommand({
        kind: "reminder-set",
        minutes: 10,
        message: 'check "the" oven'
      });
      assert.strictEqual(cli.commandStr, "omarchy reminder 10 'check \"the\" oven'");
      assert.deepStrictEqual(Array.from(cli.commandArgs), ["omarchy", "reminder", "10", 'check "the" oven']);

      const singleQuoteCli = ReminderProvider.buildCliCommand({
        kind: "reminder-set",
        minutes: 10,
        message: "don't forget"
      });
      assert.strictEqual(singleQuoteCli.commandStr, "omarchy reminder 10 'don'\\''t forget'");
    });

    test("builds command for reminder without custom message (falls back to CLI default)", () => {
      const cli = ReminderProvider.buildCliCommand({
        kind: "reminder-set",
        minutes: 25,
        message: ""
      });
      assert.strictEqual(cli.commandStr, "omarchy reminder 25");
      assert.deepStrictEqual(Array.from(cli.commandArgs), ["omarchy", "reminder", "25"]);
    });

    test("builds command for clear reminders action", () => {
      const cli = ReminderProvider.buildCliCommand({
        kind: "reminder-clear"
      });
      assert.strictEqual(cli.commandStr, "omarchy reminder clear");
      assert.deepStrictEqual(Array.from(cli.commandArgs), ["omarchy", "reminder", "clear"]);
    });

    test("builds command for interactive modal summon", () => {
      const cli = ReminderProvider.buildCliCommand({
        kind: "reminder-interactive"
      });
      assert.strictEqual(cli.commandStr, "omarchy reminder -i");
      assert.deepStrictEqual(Array.from(cli.commandArgs), ["omarchy", "reminder", "-i"]);
    });
  });

  describe("5. Direct Search Method & Active Data Processing", () => {
    test("generates reminder-set item with preview and topHit for 'remind me in 15m test'", () => {
      const results = ReminderProvider.search("remind me in 15m test");
      assert.strictEqual(results.length, 1);
      const item = results[0];
      assert.strictEqual(item.kind, "reminder-set");
      assert.strictEqual(item.category, "Reminders");
      assert.strictEqual(item.minutes, 15);
      assert.strictEqual(item.message, "test");
      assert.strictEqual(item.isTopHit, true);
      assert.strictEqual(item.hasPreview, true);
      assert.strictEqual(item.previewType, "reminder");
      assert.strictEqual(item.command, "omarchy reminder 15 'test'");
    });

    test("generates timer-set item with timer badge and icon for 'timer 25m Focus'", () => {
      const results = ReminderProvider.search("timer 25m Focus");
      assert.strictEqual(results.length, 1);
      const item = results[0];
      assert.strictEqual(item.kind, "reminder-set");
      assert.strictEqual(item.badge, "TIMER");
      assert.strictEqual(item.icon, "󰔟");
      assert.strictEqual(item.isTimer, true);
      assert.strictEqual(item.minutes, 25);
      assert.strictEqual(item.message, "Focus");
    });

    test("generates hint item when query is bare 'timer' or 'remind'", () => {
      const results = ReminderProvider.search("remind");
      assert.strictEqual(results.length, 2);
      assert.strictEqual(results[0].kind, "reminder-hint");
      assert.strictEqual(results[0].isTopHit, true);
      assert.strictEqual(results[1].kind, "reminder-interactive");
    });

    test("generates clear action item for 'clear reminders'", () => {
      const results = ReminderProvider.search("clear reminders");
      assert.strictEqual(results.length, 1);
      const item = results[0];
      assert.strictEqual(item.kind, "reminder-clear");
      assert.strictEqual(item.badge, "CLEAR");
      assert.strictEqual(item.isDestructive, true);
      assert.strictEqual(item.command, "omarchy reminder clear");
    });

    test("generates active list item populated from activeRemindersData", () => {
      const mockActiveData = {
        count: 2,
        active: true,
        tooltip: "2 reminders",
        reminders: [
          {
            unit: "omarchy-reminder-10m-123456",
            timer: "omarchy-reminder-10m-123456.timer",
            minutes: 10,
            message: "Check oven",
            remaining: "8m 30s",
            atTime: "14:15"
          },
          {
            unit: "omarchy-reminder-25m-123457",
            timer: "omarchy-reminder-25m-123457.timer",
            minutes: 25,
            message: "Pomodoro",
            remaining: "24m 10s",
            atTime: "14:30"
          }
        ]
      };

      const results = ReminderProvider.search("reminders", mockActiveData);
      assert.ok(results.length >= 2);
      const listSummary = results[0];
      assert.strictEqual(listSummary.kind, "reminder-active");
      assert.strictEqual(listSummary.count, 2);
      assert.strictEqual(listSummary.active, true);
      assert.strictEqual(listSummary.reminders.length, 2);

      // Verify clear suggestion is presented when active timers exist
      const clearItem = results.find(r => r.kind === "reminder-clear");
      assert.ok(clearItem, "Clear suggestion should be presented when timers are active");
    });

    test("handles malformed or missing activeRemindersData safely", () => {
      const results1 = ReminderProvider.search("reminders", null);
      assert.strictEqual(results1[0].count, 0);
      assert.strictEqual(results1[0].active, false);

      const results2 = ReminderProvider.search("reminders", { notReminders: true });
      assert.strictEqual(results2[0].count, 0);
      assert.strictEqual(results2[0].active, false);
    });
  });

  describe("6. Engine Integration & Search Dispatching", () => {
    test("Engine.search prioritizes reminder query as top hit", () => {
      const results = Engine.search("remind 10m check oven");
      assert.ok(results.length > 0);
      const topHit = results[0];
      assert.strictEqual(topHit.kind, "reminder-set");
      assert.strictEqual(topHit.category, "Reminders");
      assert.strictEqual(topHit.minutes, 10);
      assert.strictEqual(topHit.message, "check oven");
      assert.strictEqual(topHit.hasPreview, true);
      assert.strictEqual(topHit.previewType, "reminder");
    });

    test("Engine.search prioritizes timer query as top hit with TIMER badge", () => {
      const results = Engine.search("timer 25m Focus");
      assert.ok(results.length > 0);
      const topHit = results[0];
      assert.strictEqual(topHit.kind, "reminder-set");
      assert.strictEqual(topHit.badge, "TIMER");
      assert.strictEqual(topHit.icon, "󰔟");
      assert.strictEqual(topHit.minutes, 25);
    });

    test("Engine.search returns clear action item for 'clear reminders'", () => {
      const results = Engine.search("clear reminders");
      assert.ok(results.length > 0);
      const topHit = results[0];
      assert.strictEqual(topHit.kind, "reminder-clear");
      assert.strictEqual(topHit.badge, "CLEAR");
      assert.strictEqual(topHit.isDestructive, true);
    });

    test("Engine.executeReminderAction executes command via quickshellUtil", () => {
      const executed = [];
      const mockUtil = {
        execDetached(cmd) {
          executed.push(cmd);
          return true;
        }
      };

      Engine.executeReminderAction({ kind: "reminder-set", minutes: 15, message: "Stretch" }, mockUtil);
      assert.strictEqual(executed.length, 1);
      assert.strictEqual(executed[0], "omarchy reminder 15 'Stretch'");

      Engine.executeReminderAction({ kind: "reminder-clear" }, mockUtil);
      assert.strictEqual(executed.length, 2);
      assert.strictEqual(executed[1], "omarchy reminder clear");

      Engine.executeReminderAction({ kind: "reminder-interactive" }, mockUtil);
      assert.strictEqual(executed.length, 3);
      assert.strictEqual(executed[2], "omarchy reminder -i");
    });
  });

  describe("7. End-to-End Iris Overlay Integration", () => {
    test("typing a reminder query expands overlay to two-pane mode with reminder preview", () => {
      const overlay = createIrisOverlayState();
      overlay.open("{}");

      overlay.setFilterText("remind 10m check oven");
      assert.strictEqual(overlay.hasPreview, true);
      assert.strictEqual(overlay.currentCardWidth, overlay.twoPaneWidth);
      assert.strictEqual(overlay.selectedItem.previewType, "reminder");
    });

    test("typing a timer query expands overlay to two-pane mode with timer preview", () => {
      const overlay = createIrisOverlayState();
      overlay.open("{}");

      overlay.setFilterText("timer 25m Pomodoro");
      assert.strictEqual(overlay.hasPreview, true);
      assert.strictEqual(overlay.currentCardWidth, overlay.twoPaneWidth);
      assert.strictEqual(overlay.selectedItem.isTimer, true);
    });

    test("activating a reminder item executes command detached and dismisses overlay", () => {
      const overlay = createIrisOverlayState();
      overlay.open("{}");
      overlay.setFilterText("remind 15m stretch");

      const item = overlay.selectedItem;
      assert.ok(item);
      assert.strictEqual(item.kind, "reminder-set");

      overlay.activateItem(item);
      assert.strictEqual(overlay.launchedCommands.length, 1);
      assert.strictEqual(overlay.launchedCommands[0], "omarchy reminder 15 'stretch'");
      assert.strictEqual(overlay.shellCalls.hide, 1);
      assert.strictEqual(overlay.opened, false);
    });

    test("activating clear reminders executes 'omarchy reminder clear' and dismisses overlay", () => {
      const overlay = createIrisOverlayState();
      overlay.open("{}");
      overlay.setFilterText("clear reminders");

      const item = overlay.selectedItem;
      assert.ok(item);
      assert.strictEqual(item.kind, "reminder-clear");

      overlay.activateItem(item);
      assert.strictEqual(overlay.launchedCommands.length, 1);
      assert.strictEqual(overlay.launchedCommands[0], "omarchy reminder clear");
      assert.strictEqual(overlay.shellCalls.hide, 1);
      assert.strictEqual(overlay.opened, false);
    });

    test("activating interactive reminder item executes 'omarchy reminder -i' and dismisses overlay", () => {
      const overlay = createIrisOverlayState();
      overlay.open("{}");
      overlay.setFilterText("open reminders");

      const item = overlay.selectedItem;
      assert.ok(item);
      assert.strictEqual(item.kind, "reminder-interactive");

      overlay.activateItem(item);
      assert.strictEqual(overlay.launchedCommands.length, 1);
      assert.strictEqual(overlay.launchedCommands[0], "omarchy reminder -i");
      assert.strictEqual(overlay.shellCalls.hide, 1);
      assert.strictEqual(overlay.opened, false);
    });

    test("selecting the reminder discovery hint fills query with template 'remind 10m '", () => {
      const overlay = createIrisOverlayState();
      overlay.open("{}");

      const hint = overlay.itemsList.find(i => i.id === "hint-reminder");
      assert.ok(hint, "hint-reminder should be present in discovery hints");
      assert.strictEqual(hint.fillQuery, "remind 10m ");

      overlay.activateItem(hint);
      assert.strictEqual(overlay.filterText, "remind 10m ");
      // Overlay expands to two-pane mode immediately upon template fill
      assert.strictEqual(overlay.hasPreview, true);
      assert.strictEqual(overlay.selectedItem.minutes, 10);
    });
  });

  describe("8. Security & Vulnerability Hardening (HANCORE-linux compliance)", () => {
    test("neutralizes shell command injection attempts in reminder messages", () => {
      const maliciousPayloads = [
        "$(whoami)",
        "`cat /etc/passwd`",
        "test; reboot",
        "foo && rm -rf /",
        "bar | wall",
        "baz > /tmp/pwned",
        "'; shutdown -h now; '",
        'test" || id || "'
      ];

      for (const payload of maliciousPayloads) {
        const cli = ReminderProvider.buildCliCommand({
          kind: "reminder-set",
          minutes: 10,
          message: payload
        });

        // The entire message must be safely single-quoted with embedded quotes escaped as '\''
        assert.ok(cli.commandStr.startsWith("omarchy reminder 10 '"), `Command must wrap message in single quotes: ${cli.commandStr}`);
        assert.ok(cli.commandStr.endsWith("'"), `Command must terminate with single quote: ${cli.commandStr}`);
        // Ensure no unescaped single quotes exist
        const innerContent = cli.commandStr.slice("omarchy reminder 10 '".length, -1);
        const unescapedSingleQuotes = innerContent.replace(/'\\''/g, "");
        assert.strictEqual(unescapedSingleQuotes.includes("'"), false, `Unescaped single quote found in: ${cli.commandStr}`);
      }
    });

    test("strips dangerous ASCII control characters and newlines from user messages", () => {
      const dirty = "Line 1\nLine 2\r\n\x00NullByte\x1b[31mRed\x7f";
      const cli = ReminderProvider.buildCliCommand({
        kind: "reminder-set",
        minutes: 5,
        message: dirty
      });

      assert.strictEqual(cli.commandStr.includes("\n"), false, "Must not contain newlines");
      assert.strictEqual(cli.commandStr.includes("\r"), false, "Must not contain carriage returns");
      assert.strictEqual(cli.commandStr.includes("\x00"), false, "Must not contain null bytes");
      assert.strictEqual(cli.commandStr.includes("\x1b"), false, "Must not contain ANSI escape codes");
    });

    test("enforces maximum duration bounds (MAX_MINUTES = 525600) to prevent integer overflows", () => {
      assert.strictEqual(ReminderProvider.parseDurationMinutes("999999999"), 525600);
      assert.strictEqual(ReminderProvider.parseDurationMinutes("1000000h"), 525600);
      assert.strictEqual(ReminderProvider.parseDurationMinutes("-10m"), 0);
      assert.strictEqual(ReminderProvider.parseDurationMinutes("0m"), 0);
      assert.strictEqual(ReminderProvider.parseDurationMinutes("NaN"), 0);

      // In buildCliCommand:
      const cliOverflow = ReminderProvider.buildCliCommand({
        kind: "reminder-set",
        minutes: 999999999,
        message: "overflow test"
      });
      assert.strictEqual(cliOverflow.commandArgs[2], "525600");
    });

    test("enforces message length limits to prevent buffer/argument overflows", () => {
      const hugeMessage = "A".repeat(2000);
      const cli = ReminderProvider.buildCliCommand({
        kind: "reminder-set",
        minutes: 5,
        message: hugeMessage
      });

      assert.strictEqual(cli.commandArgs[3].length <= 500, true);
    });

    test("strictly executes whitelisted actions and ignores arbitrary command strings", () => {
      const executed = [];
      const mockUtil = {
        execDetached(cmd) { executed.push(cmd); }
      };

      // Attempting to pass an unauthorized kind or injected command string
      ReminderProvider.execute({ kind: "arbitrary-kind", command: "reboot" }, mockUtil);
      assert.strictEqual(executed.length, 0, "Must not execute unauthorized kinds");

      ReminderProvider.execute(null, mockUtil);
      ReminderProvider.execute(undefined, mockUtil);
      ReminderProvider.execute("invalid", mockUtil);
      assert.strictEqual(executed.length, 0);
    });

    test("handles malformed, polluted, or prototype-tampered activeRemindersData safely", () => {
      const poisonData = {
        count: -5,
        reminders: [
          null,
          undefined,
          "invalid",
          { id: "<script>alert(1)</script>", message: "Hello\x00World", atTime: "99:99; rm -rf", remaining: "10m\nleft", leftSec: "bad" }
        ]
      };

      const results = ReminderProvider.search("reminders", poisonData);
      assert.strictEqual(results.length >= 1, true);
      const list = results[0];
      assert.strictEqual(list.reminders.length, 1);
      assert.strictEqual(list.reminders[0].id, "scriptalert1script");
      assert.strictEqual(list.reminders[0].message.includes("\x00"), false);
      assert.strictEqual(list.reminders[0].remaining.includes("\n"), false);
      assert.strictEqual(list.reminders[0].leftSec, 0);
    });
  });
});
