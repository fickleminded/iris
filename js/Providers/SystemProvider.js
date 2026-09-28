.pragma library

// SystemProvider.js: Omarchy System Actions, Theme Controls & Power for Iris Spotlight
// Provides searchable actions for desktop shell, themes, wallpapers, hardware, and power operations.


var SYSTEM_ACTIONS = [
  // 1. Theme & Wallpaper Commands (User Priority)
  {
    id: "sys-theme-bg-switcher",
    name: "Change Wallpaper",
    category: "Appearance",
    description: "Open wallpaper and background picker",
    command: "omarchy theme bg-switcher",
    icon: "󰸉",
    keywords: ["wallpaper", "change wallpaper", "set wallpaper", "wallpaper picker", "background", "change background", "bg switcher", "bg-switcher"],
    dangerLevel: "normal",
    isDestructive: false,
    detailText: "Opens the Omarchy wallpaper switcher overlay to browse and select desktop backgrounds."
  },
  {
    id: "sys-theme-bg-next",
    name: "Next Wallpaper",
    category: "Appearance",
    description: "Cycle to next wallpaper for current theme",
    command: "iris wallpaper next || omarchy theme bg next",
    icon: "󰸉",
    keywords: ["next wallpaper", "cycle wallpaper", "next background", "switch wallpaper", "bg next"],
    dangerLevel: "normal",
    isDestructive: false,
    detailText: "Cycles to the next available background image bundled with the current theme."
  },
  {
    id: "sys-theme-switcher",
    name: "Theme Switcher",
    category: "Appearance",
    description: "Open interactive theme selector",
    command: "omarchy theme switcher",
    icon: "󰔎",
    keywords: ["theme switcher", "switch theme", "change theme", "themes", "theme selector", "set theme"],
    dangerLevel: "normal",
    isDestructive: false,
    detailText: "Opens the interactive theme switcher menu to preview and apply desktop themes."
  },

  // 2. Desktop Shell & Compositor
  {
    id: "sys-restart-shell",
    name: "Restart Shell",
    category: "System",
    description: "Reload Quickshell overlay and desktop panels",
    command: "omarchy restart shell",
    icon: "󰑓",
    keywords: ["restart shell", "reload shell", "quickshell", "refresh shell", "shell"],
    dangerLevel: "normal",
    isDestructive: false,
    detailText: "Restarts the Omarchy desktop shell process and reloads all mounted widgets and plugins."
  },
  {
    id: "sys-reload-hyprland",
    name: "Reload Hyprland",
    category: "System",
    description: "Reload Hyprland compositor configuration",
    command: "omarchy restart hyprctl",
    icon: "󰖲",
    keywords: ["reload hyprland", "hyprland", "hyprctl reload", "restart hyprctl", "compositor"],
    dangerLevel: "normal",
    isDestructive: false,
    detailText: "Re-evaluates Hyprland configuration, window rules, bindings, and active monitors."
  },
  {
    id: "sys-restart-waybar",
    name: "Restart Waybar",
    category: "System",
    description: "Restart Waybar panel service",
    command: "omarchy restart waybar",
    icon: "󰑓",
    keywords: ["restart waybar", "reload waybar", "waybar"],
    dangerLevel: "normal",
    isDestructive: false,
    detailText: "Reloads the Waybar process and updates bar modules and styles."
  },
  {
    id: "sys-toggle-bar",
    name: "Toggle Desktop Bar",
    category: "Display",
    description: "Show or hide top status bar",
    command: "omarchy toggle bar",
    icon: "󱂬",
    keywords: ["toggle bar", "hide bar", "show bar", "waybar", "bar"],
    dangerLevel: "normal",
    isDestructive: false,
    detailText: "Toggles the visibility of the primary desktop status bar."
  },

  // 3. Hardware & Display
  {
    id: "sys-nightlight",
    name: "Toggle Night Light",
    category: "Display",
    description: "Toggle blue-light screen temperature (hyprsunset)",
    command: "omarchy toggle nightlight",
    icon: "󰖔",
    keywords: ["nightlight", "night light", "blue light", "sunset", "screen temperature", "warm"],
    dangerLevel: "normal",
    isDestructive: false,
    detailText: "Toggles blue-light filtering on all active displays to reduce eye strain."
  },
  {
    id: "sys-toggle-touchpad",
    name: "Toggle Touchpad",
    category: "Hardware",
    description: "Enable or disable laptop touchpad",
    command: "omarchy toggle touchpad",
    icon: "󰟸",
    keywords: ["toggle touchpad", "touchpad", "trackpad", "disable touchpad", "enable touchpad"],
    dangerLevel: "normal",
    isDestructive: false,
    detailText: "Toggles the trackpad input device without affecting external mouse devices."
  },
  {
    id: "sys-toggle-idle",
    name: "Toggle Idle Sleep / Keep Awake",
    category: "Power",
    description: "Inhibit or restore automatic system sleep",
    command: "omarchy toggle idle",
    icon: "󰒲",
    keywords: ["toggle idle", "keep awake", "caffeine", "inhibit sleep", "stay awake", "idle"],
    dangerLevel: "normal",
    isDestructive: false,
    detailText: "Toggles sleep inhibition so the system stays awake during presentations or downloads."
  },
  {
    id: "sys-restart-audio",
    name: "Restart Audio",
    category: "System",
    description: "Restart PipeWire and audio subsystem",
    command: "omarchy restart audio",
    icon: "󰓃",
    keywords: ["restart audio", "audio", "sound", "pipewire", "wireplumber", "volume"],
    dangerLevel: "normal",
    isDestructive: false,
    detailText: "Restarts audio services and recovers any stuck USB or Bluetooth audio devices."
  },
  {
    id: "sys-restart-wifi",
    name: "Restart Wi-Fi",
    category: "Network",
    description: "Unblock and reconnect Wi-Fi service",
    command: "omarchy restart wifi",
    icon: "󰖩",
    keywords: ["restart wifi", "restart wi-fi", "wifi", "network", "reconnect wifi"],
    dangerLevel: "normal",
    isDestructive: false,
    detailText: "Unblocks and restarts NetworkManager and wireless interface hardware."
  },
  {
    id: "sys-restart-bluetooth",
    name: "Restart Bluetooth",
    category: "Hardware",
    description: "Reset Bluetooth daemon and adapters",
    command: "omarchy restart bluetooth",
    icon: "󰂯",
    keywords: ["restart bluetooth", "bluetooth", "reconnect bluetooth", "bt restart"],
    dangerLevel: "normal",
    isDestructive: false,
    detailText: "Restarts the BlueZ system service and resets connected peripheral controllers."
  },
  {
    id: "sys-toggle-dnd",
    name: "Toggle Do Not Disturb",
    category: "Notifications",
    description: "Mute or unmute desktop notifications",
    command: "omarchy toggle notification silencing",
    icon: "󰂛",
    keywords: ["dnd", "do not disturb", "mute notifications", "silence notifications", "notifications"],
    dangerLevel: "normal",
    isDestructive: false,
    detailText: "Toggles notification silencing so popups are suppressed during focused work."
  },

  // 4. Utilities & Maintenance
  {
    id: "sys-screenshot",
    name: "Capture Screenshot",
    category: "Utility",
    description: "Take a screen capture or region snip",
    command: "omarchy screenshot",
    icon: "󰄄",
    keywords: ["screenshot", "capture screen", "screen capture", "snip", "print screen"],
    dangerLevel: "normal",
    isDestructive: false,
    detailText: "Invokes Omarchy screenshot capture utility to grab display regions or full windows."
  },
  {
    id: "sys-update",
    name: "Update System",
    category: "Maintenance",
    description: "Update Omarchy shell and Arch packages",
    command: "omarchy update",
    icon: "󰚰",
    keywords: ["update", "system update", "upgrade", "pacman update", "omarchy update", "check updates"],
    dangerLevel: "normal",
    isDestructive: false,
    detailText: "Synchronizes package databases and performs rolling release system updates."
  },
  {
    id: "sys-share",
    name: "Share Files / Clipboard",
    category: "Network",
    description: "Share files and clipboard via LocalSend",
    command: "omarchy share",
    icon: "󰒍",
    keywords: ["share", "localsend", "send file", "airdrop"],
    dangerLevel: "normal",
    isDestructive: false,
    detailText: "Opens Omarchy LocalSend share utility to transfer files across local devices."
  },
  {
    id: "sys-screensaver",
    name: "Run Screensaver",
    category: "Display",
    description: "Launch Omarchy terminal screensaver",
    command: "omarchy screensaver",
    icon: "󰹑",
    keywords: ["screensaver", "screen saver", "tte screensaver", "matrix"],
    dangerLevel: "normal",
    isDestructive: false,
    detailText: "Runs the terminal-based visual screensaver with random visual effects."
  },
  {
    id: "sys-snapshot",
    name: "System Snapshots",
    category: "Maintenance",
    description: "Create or restore Snapper Btrfs snapshots",
    command: "omarchy snapshot",
    icon: "󰁯",
    keywords: ["snapshot", "snapper", "backup", "restore", "system snapshot"],
    dangerLevel: "normal",
    isDestructive: false,
    detailText: "Opens system snapshot utility to manage filesystem rollbacks and recovery points."
  },

  // 5. Session & Power Actions
  {
    id: "sys-lock",
    name: "Lock Screen",
    category: "Security",
    description: "Lock computer immediately via hyprlock",
    command: "omarchy system lock",
    icon: "󰌾",
    keywords: ["lock", "screen", "hyprlock", "secure", "lockscreen"],
    dangerLevel: "normal",
    isDestructive: false,
    detailText: "Immediately activates hyprlock to secure the current session and turns off display output."
  },
  {
    id: "sys-suspend",
    name: "Suspend / Sleep",
    category: "Power",
    description: "Put computer to sleep (systemctl suspend)",
    command: "systemctl suspend",
    icon: "󰒲",
    keywords: ["suspend", "sleep", "standby"],
    dangerLevel: "medium",
    isDestructive: false,
    detailText: "Puts the computer into low-power standby mode while preserving open work in memory."
  },
  {
    id: "sys-reboot",
    name: "Reboot System",
    category: "Power",
    description: "Restart computer safely (omarchy system reboot)",
    command: "omarchy system reboot",
    icon: "󰜉",
    keywords: ["reboot", "restart computer", "restart system", "reboot system"],
    dangerLevel: "high",
    isDestructive: true,
    detailText: "Closes active user applications safely and restarts the operating system."
  },
  {
    id: "sys-poweroff",
    name: "Power Off / Shut Down",
    category: "Power",
    description: "Shut down computer completely (omarchy system shutdown)",
    command: "omarchy system shutdown",
    icon: "󰐥",
    keywords: ["power off", "shutdown", "turn off", "poweroff", "shut down"],
    dangerLevel: "high",
    isDestructive: true,
    detailText: "Closes active user applications and turns off power to the machine."
  },
  {
    id: "sys-logout",
    name: "Log Out",
    category: "Session",
    description: "Log out of current Hyprland session",
    command: "omarchy system logout",
    icon: "󰍃",
    keywords: ["logout", "log out", "sign out", "exit session"],
    dangerLevel: "medium",
    isDestructive: true,
    detailText: "Closes all active windows and ends the current graphical Wayland session."
  }
];

// Safely quote an argument for POSIX / bash -lc execution using single quotes
function quoteShellArg(arg) {
  return "'" + String(arg || "").replace(/'/g, "'\\''") + "'";
}

// Helper: Build a Theme Apply Action object with fallback to theme switcher on error
function buildThemeAction(themeName, score, isTopHit) {
  var slug = themeName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return {
    id: "sys-theme-" + slug,
    kind: "system",
    category: "Theme",
    name: "Apply Theme: " + themeName,
    description: "Switch desktop theme to " + themeName + " (falls back to switcher on failure)",
    command: "omarchy theme set " + quoteShellArg(themeName) + " || omarchy theme switcher",
    icon: "󰔎",
    dangerLevel: "normal",
    isDestructive: false,
    detailText: "Attempts to apply the " + themeName + " theme. If not found or if the command fails, launches the Omarchy theme switcher.",
    isTopHit: isTopHit,
    hasPreview: true,
    previewType: "system",
    action: "execute",
    _score: score
  };
}

// Search system actions, theme controls, and wallpaper pickers
function search(query, context) {
  var q = (query || "").trim().toLowerCase();
  if (q.length === 0) return [];

  var matches = [];
  var themeActionAdded = {};
  var dynamicThemes = (context && context.themes && Array.isArray(context.themes))
    ? context.themes
    : [];

  // Check for explicit theme query formats:
  // "omarchy theme set <name>", "set theme <name>", "change theme <name>", "switch theme <name>", "theme set <name>", or "theme <name>"
  var themeMatch = q.match(/^(?:omarchy\s+theme\s+set|set\s+theme|change\s+theme|switch\s+theme|theme\s+set|theme)\s*(.*)$/i);
  if (themeMatch) {
    var rawThemeArg = (themeMatch[1] || "").trim();
    var themeArg = rawThemeArg.toLowerCase();
    var isSwitcherQuery = themeArg.length === 0 || themeArg === "switcher" || themeArg === "selector";
    
    // Always add Theme Switcher GUI option if user typed "theme" or "change theme"
    matches.push({
      id: "sys-theme-switcher",
      kind: "system",
      category: "Theme",
      name: "Open Theme Switcher",
      description: "Open the interactive theme selector menu",
      command: "omarchy theme switcher",
      icon: "󰔎",
      dangerLevel: "normal",
      isDestructive: false,
      detailText: "Opens the Omarchy theme picker overlay to visually preview and select themes.",
      isTopHit: isSwitcherQuery,
      hasPreview: true,
      previewType: "system",
      action: "execute",
      _score: isSwitcherQuery ? 100 : 75
    });

    var hasMatchedTheme = false;
    for (var t = 0; t < dynamicThemes.length; t++) {
      var thName = dynamicThemes[t];
      var thLower = thName.toLowerCase();
      var tScore = 0;

      if (isSwitcherQuery) {
        tScore = 70; // list all themes when user simply types "theme" or "theme switcher"
      } else if (thLower === themeArg) {
        tScore = 100;
        hasMatchedTheme = true;
      } else if (thLower.indexOf(themeArg) === 0) {
        tScore = 95;
        hasMatchedTheme = true;
      } else if (thLower.indexOf(themeArg) !== -1) {
        tScore = 85;
        hasMatchedTheme = true;
      }

      if (tScore > 0) {
        themeActionAdded[thLower] = true;
        matches.push(buildThemeAction(thName, tScore, tScore >= 95));
      }
    }

    // If user provided a specific theme argument that didn't match known themes (e.g. newly added or custom),
    // still create the direct execution action for it with fallback to switcher on failure!
    if (rawThemeArg.length > 0 && !isSwitcherQuery && !hasMatchedTheme && !themeActionAdded[themeArg]) {
      matches.push(buildThemeAction(rawThemeArg, 100, true));
      themeActionAdded[themeArg] = true;
    }
  } else {
    // If not prefixed with "theme", check if query matches an installed theme directly
    // e.g. "lumon", "tokyo night", "catppuccin", "nord", "gruvbox"
    for (var tn = 0; tn < dynamicThemes.length; tn++) {
      var themeCandidate = dynamicThemes[tn];
      var candLower = themeCandidate.toLowerCase();
      var candScore = 0;

      if (candLower === q) {
        candScore = 96;
      } else if (candLower.indexOf(q) === 0 && q.length >= 3) {
        candScore = 80;
      } else if (candLower.indexOf(q) !== -1 && q.length >= 4) {
        candScore = 65;
      }

      if (candScore > 0 && !themeActionAdded[candLower]) {
        themeActionAdded[candLower] = true;
        matches.push(buildThemeAction(themeCandidate, candScore, candScore >= 95));
      }
    }
  }

  // Search static SYSTEM_ACTIONS
  for (var i = 0; i < SYSTEM_ACTIONS.length; i++) {
    var act = SYSTEM_ACTIONS[i];
    var nameLower = act.name.toLowerCase();
    var descLower = act.description.toLowerCase();
    var score = 0;

    if (nameLower === q) {
      score = 100;
    } else if (nameLower.indexOf(q) === 0) {
      score = 88;
    } else if (nameLower.indexOf(q) !== -1) {
      score = 65;
    }

    for (var k = 0; k < act.keywords.length; k++) {
      var kw = act.keywords[k].toLowerCase();
      if (kw === q) {
        score = Math.max(score, 98);
      } else if (kw.indexOf(q) === 0) {
        score = Math.max(score, 85);
      } else if (kw.indexOf(q) !== -1) {
        score = Math.max(score, 60);
      }
    }

    if (score === 0 && descLower.indexOf(q) !== -1) {
      score = 35;
    }

    if (score > 0) {
      // Don't duplicate theme switcher if already added in themeMatch branch
      var alreadyAdded = false;
      for (var m = 0; m < matches.length; m++) {
        if (matches[m].id === act.id) {
          alreadyAdded = true;
          break;
        }
      }

      if (!alreadyAdded) {
        matches.push({
          id: act.id,
          kind: "system",
          category: act.category,
          name: act.name,
          description: act.description,
          command: act.command,
          icon: act.icon,
          dangerLevel: act.dangerLevel,
          isDestructive: act.isDestructive,
          detailText: act.detailText,
          isTopHit: score >= 85,
          hasPreview: true,
          previewType: "system",
          action: "execute",
          _score: score
        });
      }
    }
  }

  matches.sort(function(a, b) {
    return b._score - a._score;
  });

  return matches;
}

// Execute the system command detached via Omarchy Util
function execute(item, quickshellUtil) {
  if (!item || !item.command) return;
  if (quickshellUtil && typeof quickshellUtil.execDetached === "function") {
    quickshellUtil.execDetached(item.command);
  }
}
