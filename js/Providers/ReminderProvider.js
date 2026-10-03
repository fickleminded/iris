.pragma library

// ReminderProvider.js: Reminders & Countdown Timers Provider for Iris Spotlight
// Connects Iris Spotlight to Omarchy's systemd user timer reminders ('omarchy reminder').
// Supports natural language scheduling ('remind me in 10m check oven', 'timer 25m Pomodoro'),
// listing active countdown timers, and clearing scheduled reminders via CLI.

// Format remaining seconds into human-readable string (matches omarchy-reminder format_remaining)
function formatRemaining(totalSeconds) {
  var sec = Math.max(0, parseInt(totalSeconds, 10) || 0);
  var minutes = Math.floor(sec / 60);
  var remainder = sec % 60;

  if (minutes > 0 && remainder > 0) {
    return minutes + "m " + remainder + "s";
  } else if (minutes > 0) {
    return minutes + "m";
  } else {
    return remainder + "s";
  }
}

// Format future timestamp based on minutes from now (HH:MM)
function formatTargetTime(minutes, fromDate) {
  var base = fromDate instanceof Date ? fromDate : new Date();
  var target = new Date(base.getTime() + (Math.max(1, parseInt(minutes, 10) || 1) * 60 * 1000));
  var hours = target.getHours();
  var mins = target.getMinutes();
  var formattedMins = mins < 10 ? "0" + mins : String(mins);
  return hours + ":" + formattedMins;
}

// Single-quote a string for safe POSIX shell execution, preventing any parameter expansion or command substitution
function shellQuote(value) {
  return "'" + String(value || "").replace(/'/g, "'\\''") + "'";
}

// Sanitize user message: strips ASCII control characters, collapses whitespace, unquotes outer wrappers, and limits length
function sanitizeMessage(msg) {
  if (!msg || typeof msg !== "string") return "";
  var clean = msg.replace(/[\x00-\x1f\x7f]/g, " ").replace(/\s+/g, " ").trim();
  clean = clean.replace(/^["'](.*)["']$/, "$1").trim();
  return clean.slice(0, 500);
}

// Maximum timer duration: 1 year in minutes (525600) to prevent bash/systemd integer overflows
var MAX_MINUTES = 525600;

// Parses duration string (e.g. "10", "15m", "1h", "1.5h", "1h30m", "45 mins") into positive integer minutes (>= 1)
function parseDurationMinutes(durationStr) {
  if (!durationStr || typeof durationStr !== "string") return 0;
  var str = durationStr.trim().toLowerCase();
  if (str.length === 0) return 0;

  // 1. Raw integer minutes: "5", "15", "120"
  if (/^[0-9]+$/.test(str)) {
    var rawMin = parseInt(str, 10);
    return (isFinite(rawMin) && rawMin > 0) ? Math.min(MAX_MINUTES, rawMin) : 0;
  }

  // 2. Compound format: "1h30m", "1h 30m", "2 hours 15 mins", "1hr 45m"
  var compoundMatch = str.match(/^(\d+(?:\.\d+)?)\s*(?:h|hr|hrs|hours?)\s*(?:and\s*)?(\d+)\s*(?:m|min|mins|minutes?)?$/i);
  if (compoundMatch) {
    var cHours = parseFloat(compoundMatch[1]) || 0;
    var cMins = parseInt(compoundMatch[2], 10) || 0;
    var total = Math.round(cHours * 60) + cMins;
    return (isFinite(total) && total > 0) ? Math.min(MAX_MINUTES, total) : 0;
  }

  // 3. Hours only: "1h", "2 hrs", "1.5h", "0.5 hr"
  var hourMatch = str.match(/^(\d+(?:\.\d+)?)\s*(?:h|hr|hrs|hours?)$/i);
  if (hourMatch) {
    var hoursVal = parseFloat(hourMatch[1]) || 0;
    var convertedMins = Math.round(hoursVal * 60);
    return (isFinite(convertedMins) && convertedMins > 0) ? Math.min(MAX_MINUTES, Math.max(1, convertedMins)) : 0;
  }

  // 4. Minutes only: "10m", "15 mins", "30 minutes", "5min"
  var minMatch = str.match(/^(\d+)\s*(?:m|min|mins|minutes?)$/i);
  if (minMatch) {
    var mVal = parseInt(minMatch[1], 10) || 0;
    return (isFinite(mVal) && mVal > 0) ? Math.min(MAX_MINUTES, mVal) : 0;
  }

  return 0;
}

// Parses natural language queries into reminder intents
// Returns: { type: "set" | "list" | "clear" | "interactive" | "hint" | null, minutes, message, isTimer, raw }
function parseReminderQuery(rawQuery) {
  if (!rawQuery || typeof rawQuery !== "string") return null;
  var text = rawQuery.trim();
  if (text.length === 0) return null;

  var lower = text.toLowerCase();

  // 1. Clear actions: "clear reminders", "reminder clear", "cancel timers", etc.
  if (/^(?:clear|cancel)\s+(?:all\s+)?(?:reminders?|timers?)$/i.test(lower) ||
      /^(?:reminders?|timers?)\s+(?:clear|cancel)$/i.test(lower)) {
    return {
      type: "clear",
      raw: text
    };
  }

  // 2. Open interactive modal: "open reminders", "reminders -i", "reminders interactive"
  if (/^(?:open)\s+(?:interactive\s+)?(?:reminders?|timers?)$/i.test(lower) ||
      /^(?:reminders?|timers?)\s+(?:-i|--interactive|interactive)$/i.test(lower)) {
    return {
      type: "interactive",
      raw: text
    };
  }

  // 3. List active reminders: "reminders", "timers", "reminder list", "show reminders", "timers list"
  if (/^(?:reminders|timers|reminder\s+list|timers?\s+list|active\s+reminders?|show\s+reminders?|list\s+reminders?)$/i.test(lower)) {
    return {
      type: "list",
      raw: text
    };
  }

  // 4. Bare triggers: "remind" or "timer" or "alarm" without arguments -> hint
  if (/^(?:remind|timer|alarm)$/i.test(lower)) {
    var bareTimer = (lower === "timer" || lower === "alarm");
    return {
      type: "hint",
      isTimer: bareTimer,
      raw: text
    };
  }

  // 5. Timer schedule: "timer <duration> [label]" or "alarm <duration> [label]"
  var timerMatch = text.match(/^(?:timer|alarm)\s+(?:for\s+)?([0-9]+(?:\.[0-9]+)?\s*(?:h|hr|hrs|hours?|m|min|mins|minutes?)?(?:\s*(?:and\s*)?[0-9]+\s*(?:m|min|mins|minutes?)?)?)(?:\s+(.+))?$/i);
  if (timerMatch) {
    var timerDurationStr = timerMatch[1].trim();
    var timerLabel = timerMatch[2] ? sanitizeMessage(timerMatch[2]) : "";
    var timerMinutes = parseDurationMinutes(timerDurationStr);

    if (timerMinutes > 0) {
      return {
        type: "set",
        minutes: timerMinutes,
        message: timerLabel,
        isTimer: true,
        raw: text
      };
    }
  }

  // 6. Remind schedule: "remind [me] [in] <duration> [to|that|about] [message]"
  var remindMatch = text.match(/^remind\s+(?:me\s+)?(?:in\s+)?([0-9]+(?:\.[0-9]+)?\s*(?:h|hr|hrs|hours?|m|min|mins|minutes?)?(?:\s*(?:and\s*)?[0-9]+\s*(?:m|min|mins|minutes?)?)?)(?:\s+(?:to|that|about)?\s*(.+))?$/i);
  if (remindMatch) {
    var remindDurationStr = remindMatch[1].trim();
    var remindMsg = remindMatch[2] ? remindMatch[2].trim() : "";
    var remindMinutes = parseDurationMinutes(remindDurationStr);

    if (remindMinutes > 0) {
      // Clean leading connector word if captured
      remindMsg = remindMsg.replace(/^(?:to|that|about)\s+/i, "");
      remindMsg = sanitizeMessage(remindMsg);
      return {
        type: "set",
        minutes: remindMinutes,
        message: remindMsg,
        isTimer: false,
        raw: text
      };
    }
  }

  return null;
}

// Builds the execution CLI command and argument array for an item
function buildCliCommand(item) {
  if (!item || typeof item !== "object") return { commandStr: "", commandArgs: [] };

  if (item.kind === "reminder-clear") {
    return {
      commandStr: "omarchy reminder clear",
      commandArgs: ["omarchy", "reminder", "clear"]
    };
  }

  if (item.kind === "reminder-interactive") {
    return {
      commandStr: "omarchy reminder -i",
      commandArgs: ["omarchy", "reminder", "-i"]
    };
  }

  if (item.kind === "reminder-active") {
    return {
      commandStr: "omarchy reminder show",
      commandArgs: ["omarchy", "reminder", "show"]
    };
  }

  if (item.kind === "reminder-set") {
    var rawMin = parseInt(item.minutes, 10);
    var min = (isFinite(rawMin) && rawMin > 0) ? Math.min(MAX_MINUTES, rawMin) : 1;
    var minStr = String(min);
    var cleanMsg = sanitizeMessage(item.message);

    var args = ["omarchy", "reminder", minStr];
    var cmdStr = "omarchy reminder " + minStr;

    if (cleanMsg.length > 0) {
      args.push(cleanMsg);
      cmdStr += " " + shellQuote(cleanMsg);
    }

    return {
      commandStr: cmdStr,
      commandArgs: args
    };
  }

  return { commandStr: "", commandArgs: [] };
}

// Generates search results based on user query and optional active reminders JSON
function search(rawQuery, activeRemindersData) {
  var intent = parseReminderQuery(rawQuery);
  if (!intent) return [];

  var results = [];
  var now = new Date();

  // 1. Bare hint state: "remind" or "timer"
  if (intent.type === "hint") {
    var isTimer = intent.isTimer;
    var hintName = isTimer ? "Start a Timer" : "Set a Reminder";
    var hintDesc = isTimer
      ? 'Type duration and optional label (e.g. "timer 25m Pomodoro" or "timer 10")'
      : 'Type duration and message (e.g. "remind me in 10m check oven" or "remind 1h take break")';

    var hintMins = isTimer ? 25 : 10;
    var hintMessage = isTimer ? "Pomodoro" : "Check the oven";
    var hintCli = buildCliCommand({
      kind: "reminder-set",
      minutes: hintMins,
      message: hintMessage
    });

    results.push({
      id: isTimer ? "reminder-hint-timer" : "reminder-hint-remind",
      kind: "reminder-hint",
      category: "Reminders",
      name: hintName,
      description: hintDesc,
      icon: isTimer ? "󰔟" : "󰢌",
      badge: isTimer ? "TIMER" : "REMINDER",
      isTopHit: true,
      hasPreview: true,
      previewType: "reminder",
      action: "hint",
      isTimer: isTimer,
      minutes: hintMins,
      message: hintMessage,
      atTime: formatTargetTime(hintMins, now),
      command: hintCli.commandStr,
      commandArgs: hintCli.commandArgs
    });

    // Also offer interactive dialog as alternative
    var hintModalCli = buildCliCommand({ kind: "reminder-interactive" });
    results.push({
      id: "reminder-interactive-dialog",
      kind: "reminder-interactive",
      category: "Reminders",
      name: "Open Interactive Reminders",
      description: "Launch Omarchy desktop reminder modal",
      icon: "󰢌",
      badge: "MODAL",
      isTopHit: false,
      hasPreview: false,
      action: "interactive",
      command: hintModalCli.commandStr,
      commandArgs: hintModalCli.commandArgs
    });

    return results;
  }

  // 2. Set timer or reminder
  if (intent.type === "set") {
    var minutes = intent.minutes;
    var msg = intent.message;
    var isTimerMode = intent.isTimer;
    var atTime = formatTargetTime(minutes, now);
    var targetLabel = msg && msg.length > 0 ? msg : (minutes + "-minute " + (isTimerMode ? "timer" : "reminder"));
    var title = isTimerMode
      ? "Start " + minutes + "-Minute Timer"
      : "Set Reminder for " + atTime;
    var desc = msg && msg.length > 0
      ? 'Reminding at ' + atTime + ' • "' + msg + '"'
      : 'Reminding at ' + atTime + ' (in ' + minutes + 'm)';

    var cli = buildCliCommand({
      kind: "reminder-set",
      minutes: minutes,
      message: msg
    });

    results.push({
      id: "reminder-set-" + minutes + "-" + (msg ? msg.replace(/\s+/g, "-").toLowerCase() : "default"),
      kind: "reminder-set",
      category: "Reminders",
      name: title,
      description: desc,
      label: targetLabel,
      message: msg,
      minutes: minutes,
      atTime: atTime,
      isTimer: isTimerMode,
      icon: isTimerMode ? "󰔟" : "󰢌",
      badge: isTimerMode ? "TIMER" : "REMINDER",
      isTopHit: true,
      hasPreview: true,
      previewType: "reminder",
      action: "set",
      command: cli.commandStr,
      commandArgs: cli.commandArgs
    });

    return results;
  }

  // 3. Clear reminders action
  if (intent.type === "clear") {
    var clearCli = buildCliCommand({ kind: "reminder-clear" });
    results.push({
      id: "reminder-action-clear",
      kind: "reminder-clear",
      category: "Reminders",
      name: "Clear All Reminders & Timers",
      description: "Cancel and stop all scheduled systemd reminder timers",
      icon: "󰅖",
      badge: "CLEAR",
      isTopHit: true,
      isDestructive: true,
      hasPreview: true,
      previewType: "reminder",
      action: "clear",
      command: clearCli.commandStr,
      commandArgs: clearCli.commandArgs
    });

    return results;
  }

  // 4. Interactive modal summon
  if (intent.type === "interactive") {
    var modalCli = buildCliCommand({ kind: "reminder-interactive" });
    results.push({
      id: "reminder-action-interactive",
      kind: "reminder-interactive",
      category: "Reminders",
      name: "Open Interactive Reminders",
      description: "Launch Omarchy desktop reminder dialog",
      icon: "󰢌",
      badge: "MODAL",
      isTopHit: true,
      hasPreview: false,
      action: "interactive",
      command: modalCli.commandStr,
      commandArgs: modalCli.commandArgs
    });

    return results;
  }

  // 5. List active reminders
  if (intent.type === "list") {
    var remindersList = [];
    var count = 0;
    var active = false;

    if (activeRemindersData && typeof activeRemindersData === "object") {
      var rawList = Array.isArray(activeRemindersData.reminders) ? activeRemindersData.reminders : [];
      remindersList = [];
      for (var i = 0; i < rawList.length; i++) {
        var r = rawList[i];
        if (r && typeof r === "object") {
          remindersList.push({
            id: String(r.id || "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 50),
            unit: String(r.unit || "").replace(/[^a-zA-Z0-9_.-]/g, "").slice(0, 50),
            message: sanitizeMessage(String(r.message || r.label || "")),
            label: sanitizeMessage(String(r.label || r.message || "")),
            remaining: String(r.remaining || "").replace(/[\x00-\x1f\x7f]/g, " ").replace(/[^\w\s]/g, "").replace(/\s+/g, " ").trim().slice(0, 30),
            atTime: String(r.atTime || "").replace(/[^\d:]/g, "").slice(0, 10),
            leftSec: (typeof r.leftSec === "number" && isFinite(r.leftSec)) ? Math.max(0, Math.floor(r.leftSec)) : 0
          });
        }
      }
      count = (typeof activeRemindersData.count === "number" && isFinite(activeRemindersData.count))
        ? Math.max(0, Math.floor(activeRemindersData.count))
        : remindersList.length;
      active = count > 0;
    }

    var listTitle = active
      ? count + " Active " + (count === 1 ? "Reminder" : "Reminders")
      : "No Active Reminders";
    var listDesc = active
      ? "View scheduled timers and countdowns"
      : "No pending reminder timers scheduled";

    var showCli = buildCliCommand({ kind: "reminder-active" });

    results.push({
      id: "reminder-active-list",
      kind: "reminder-active",
      category: "Reminders",
      name: listTitle,
      description: listDesc,
      icon: "󰢌",
      badge: active ? "ACTIVE (" + count + ")" : "TIMERS",
      isTopHit: true,
      hasPreview: true,
      previewType: "reminder",
      action: "list",
      count: count,
      active: active,
      reminders: remindersList,
      command: showCli.commandStr,
      commandArgs: showCli.commandArgs
    });

    // If there are active reminders, also suggest the clear action
    if (active) {
      var clearSugCli = buildCliCommand({ kind: "reminder-clear" });
      results.push({
        id: "reminder-action-clear-suggest",
        kind: "reminder-clear",
        category: "Reminders",
        name: "Clear All Reminders (" + count + ")",
        description: "Cancel all active scheduled timers",
        icon: "󰅖",
        badge: "CLEAR",
        isTopHit: false,
        isDestructive: true,
        hasPreview: true,
        previewType: "reminder",
        action: "clear",
        command: clearSugCli.commandStr,
        commandArgs: clearSugCli.commandArgs
      });
    }

    // Always offer interactive modal as second option
    var modalSugCli = buildCliCommand({ kind: "reminder-interactive" });
    results.push({
      id: "reminder-interactive-modal-opt",
      kind: "reminder-interactive",
      category: "Reminders",
      name: "Open Interactive Reminders",
      description: "Launch Omarchy desktop reminder dialog",
      icon: "󰢌",
      badge: "MODAL",
      isTopHit: false,
      hasPreview: false,
      action: "interactive",
      command: modalSugCli.commandStr,
      commandArgs: modalSugCli.commandArgs
    });

    return results;
  }

  return results;
}

// Executes reminder commands via Quickshell's detached process executor
function execute(item, quickshellUtil) {
  if (!item || typeof item !== "object") return;

  var cli = buildCliCommand(item);
  var cmd = cli.commandStr;
  if (!cmd) return;

  if (quickshellUtil && typeof quickshellUtil.execDetached === "function") {
    quickshellUtil.execDetached(cmd);
  }
}

// CommonJS export for unit testing in Node.js
if (typeof module !== "undefined") {
  module.exports = {
    formatRemaining: formatRemaining,
    formatTargetTime: formatTargetTime,
    parseDurationMinutes: parseDurationMinutes,
    parseReminderQuery: parseReminderQuery,
    buildCliCommand: buildCliCommand,
    search: search,
    execute: execute
  };
}
