.pragma library
.import "Providers/AppProvider.js" as AppProvider
.import "Providers/FileProvider.js" as FileProvider
.import "Providers/CalcProvider.js" as CalcProvider
.import "Providers/SystemProvider.js" as SystemProvider
.import "Providers/WebProvider.js" as WebProvider
.import "Providers/AiProvider.js" as AiProvider

// Iris Engine: Central dispatcher and provider coordinator
// Coordinates AppProvider, FileProvider, CalcProvider, SystemProvider, WebProvider, and AiProvider.

var VERSION = "1.1.0";
var MAX_RESULTS = 50;

// Format byte sizes into human readable strings (B, KB, MB, GB)
function formatSize(bytes) {
  if (isNaN(bytes) || bytes === null || bytes === undefined) return "";
  var b = parseInt(bytes, 10);
  if (b < 1024) return b + " B";
  var kb = b / 1024;
  if (kb < 1024) return kb.toFixed(1) + " KB";
  var mb = kb / 1024;
  if (mb < 1024) return mb.toFixed(1) + " MB";
  var gb = mb / 1024;
  return gb.toFixed(1) + " GB";
}

// Build fd arguments for file search
function buildFdArgs(query, baseDir) {
  return FileProvider.buildFdArgs(query, baseDir);
}

// Parse fd output
function parseFdOutput(rawOutput, baseDir) {
  return FileProvider.parseOutput(rawOutput, baseDir);
}

// Main search dispatcher for Iris Spotlight
function search(text, context) {
  var q = (text || "").trim();
  var results = [];
  var apps = (context && context.applications) || [];
  var resolveIcon = context && context.resolveIcon;
  var fileResults = (context && context.fileResults) || [];

  if (q.length === 0) {
    return [
      {
        id: "hint-apps",
        kind: "hint",
        category: "Applications",
        name: "Search Applications",
        description: "Type an app name or acronym (e.g. 'term', 'ff' for Firefox, 'code')",
        icon: "󰀻",
        hasPreview: false,
        action: "hint"
      },
      {
        id: "hint-files",
        kind: "hint",
        category: "Files & Folders",
        name: "Find Files & Documents",
        description: "Search local files and directories with live previews",
        icon: "󰉋",
        hasPreview: false,
        action: "hint"
      },
      {
        id: "hint-calc",
        kind: "hint",
        category: "Calculator",
        name: "Math & Unit Conversions",
        description: "Evaluate math or units (e.g. '144 / 12', '50 f to c', '10 km to miles')",
        icon: "󰃬",
        hasPreview: false,
        action: "hint",
        fillQuery: "50 f to c"
      },
      {
        id: "hint-ai",
        kind: "hint",
        category: "AI Agent",
        name: "AI Agent Prompting",
        description: "Prompt default agent: 'ai <question>' or '? <prompt>' with live response",
        icon: "󰚩",
        hasPreview: false,
        action: "hint",
        fillQuery: "ai "
      },
      {
        id: "hint-web",
        kind: "hint",
        category: "Web Search",
        name: "Web Bangs & Direct URLs",
        description: "Prefix search: !g (Google), !gh (GitHub), !yt (YouTube), or enter URL",
        icon: "󰖟",
        hasPreview: false,
        action: "hint",
        fillQuery: "!g "
      },
      {
        id: "hint-system",
        kind: "hint",
        category: "System Actions",
        name: "Omarchy System & Themes",
        description: "Quick actions: 'lock', 'suspend', 'theme <name>', or 'wallpaper'",
        icon: "󰒓",
        hasPreview: false,
        action: "hint",
        fillQuery: "theme "
      }
    ];
  } else {
    // 0. AI Agent Mode Search (ai <prompt> or ? <prompt>)
    if (AiProvider.isAiQuery(q)) {
      var aiMatches = AiProvider.search(q, context);
      if (aiMatches.length > 0) {
        return aiMatches;
      }
    }

    // 1. Calculator & Unit Conversion Search (Instant calculation as you type)
    var calcHit = CalcProvider.evaluate(q);
    if (calcHit) {
      results.push(calcHit);
    }

    // 2. Web Search & Bang Shortcuts (e.g. !g, g, !gh, gh, yt, wiki, direct URLs)
    var webMatches = WebProvider.search(q);
    var hasWebTopHit = !calcHit && webMatches.length > 0 && webMatches[0].isTopHit === true;
    if (hasWebTopHit) {
      for (var w = 0; w < webMatches.length; w++) {
        results.push(webMatches[w]);
      }
      return results;
    }

    // 3. System Controls Provider Search
    var sysMatches = SystemProvider.search(q, context);
    var hasSysTopHit = !calcHit && sysMatches.length > 0 && sysMatches[0].isTopHit === true;
    if (hasSysTopHit) {
      results.push(sysMatches[0]);
    }

    // 4. Applications Provider Search
    var appMatches = AppProvider.search(q, apps, resolveIcon);
    var hasAppTopHit = !calcHit && !hasSysTopHit && appMatches.length > 0 && appMatches[0].isTopHit === true;
    if (hasAppTopHit) {
      results.push(appMatches[0]);
    }

    // Add remaining system actions (up to 8 if system is top hit, else up to 4)
    var maxSys = hasSysTopHit ? 8 : 4;
    var sysStartIdx = hasSysTopHit ? 1 : 0;
    for (var s = sysStartIdx; s < sysMatches.length && results.length < maxSys; s++) {
      results.push(sysMatches[s]);
    }

    // Add remaining app matches (up to 8 additional)
    var appStartIdx = hasAppTopHit ? 1 : 0;
    for (var i = appStartIdx; i < appMatches.length && results.length < 10; i++) {
      results.push(appMatches[i]);
    }

    // 5. Files & Folders Search results
    for (var f = 0; f < fileResults.length && results.length < 25; f++) {
      results.push(fileResults[f]);
    }

    // 6. Web Search Fallback (Google & DuckDuckGo options at bottom)
    for (var wb = 0; wb < webMatches.length && results.length < 28; wb++) {
      results.push(webMatches[wb]);
    }

    // If still no results, fallback search echo
    if (results.length === 0) {
      results.push({
        id: "query-echo",
        kind: "query",
        category: "Search",
        name: "Search for '" + text + "'",
        description: "No matching applications, files, or actions found",
        icon: "󰍉",
        hasPreview: false,
        action: "search"
      });
    }
  }

  return results;
}

// Action Handlers
function launchApp(item, shell, quickshellUtil) {
  return AppProvider.launch(item, shell, quickshellUtil);
}

function openFile(item, quickshellUtil) {
  return FileProvider.open(item, quickshellUtil);
}

function showInFolder(item, quickshellUtil) {
  return FileProvider.showInFolder(item, quickshellUtil);
}

function openTerminal(item, quickshellUtil) {
  return FileProvider.openTerminal(item, quickshellUtil);
}

function copyPath(item, quickshellUtil) {
  return FileProvider.copyPath(item, quickshellUtil);
}

function copyCalcResult(item, quickshellUtil) {
  return CalcProvider.copyResult(item, quickshellUtil);
}

function executeSystemAction(item, quickshellUtil) {
  return SystemProvider.execute(item, quickshellUtil);
}

function openWebUrl(item, quickshellUtil) {
  return WebProvider.openUrl(item && item.url, quickshellUtil);
}

function launchAi(item, quickshellUtil) {
  return AiProvider.launchInteractive(item, quickshellUtil);
}

function copyAiResponse(text, quickshellUtil) {
  return AiProvider.copyResponse(text, quickshellUtil);
}

function isAiQuery(query) {
  return AiProvider.isAiQuery(query);
}

function parseAiQuery(query) {
  return AiProvider.parseQuery(query);
}

function buildAiInlineArgs(prompt) {
  return AiProvider.buildInlineArgs(prompt);
}


