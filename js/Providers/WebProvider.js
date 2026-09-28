.pragma library

// WebProvider.js: Web Search & Bang Shortcuts Provider for Iris Spotlight
// Supports bang notation (!g, !gh, !yt, !wiki, !ddg, !arch), prefix shortcuts (g, gh, yt, wiki, ddg),
// direct URL navigation, and default web fallback.

var ENGINES = {
  google: {
    id: "google",
    name: "Google Search",
    shortName: "Google",
    icon: "󰊭",
    badge: "GOOGLE",
    color: "#4285F4",
    searchUrl: "https://www.google.com/search?q="
  },
  github: {
    id: "github",
    name: "GitHub",
    shortName: "GitHub",
    icon: "󰊤",
    badge: "GITHUB",
    color: "#f0f6fc",
    searchUrl: "https://github.com/search?q="
  },
  youtube: {
    id: "youtube",
    name: "YouTube",
    shortName: "YouTube",
    icon: "󰗃",
    badge: "YOUTUBE",
    color: "#FF0000",
    searchUrl: "https://www.youtube.com/results?search_query="
  },
  wikipedia: {
    id: "wikipedia",
    name: "Wikipedia",
    shortName: "Wikipedia",
    icon: "󰖬",
    badge: "WIKI",
    color: "#e0e0e0",
    searchUrl: "https://en.wikipedia.org/wiki/Special:Search?search="
  },
  duckduckgo: {
    id: "duckduckgo",
    name: "DuckDuckGo",
    shortName: "DuckDuckGo",
    icon: "󰇧",
    badge: "DDG",
    color: "#DE5833",
    searchUrl: "https://duckduckgo.com/?q="
  },
  arch: {
    id: "arch",
    name: "ArchWiki",
    shortName: "ArchWiki",
    icon: "󰣇",
    badge: "ARCH",
    color: "#1793D1",
    searchUrl: "https://wiki.archlinux.org/index.php?search="
  },
  reddit: {
    id: "reddit",
    name: "Reddit",
    shortName: "Reddit",
    icon: "󰑍",
    badge: "REDDIT",
    color: "#FF4500",
    searchUrl: "https://www.reddit.com/search/?q="
  }
};

// Bang and prefix mappings
var BANG_MAP = {
  "g": ENGINES.google,
  "google": ENGINES.google,
  "gh": ENGINES.github,
  "github": ENGINES.github,
  "yt": ENGINES.youtube,
  "youtube": ENGINES.youtube,
  "w": ENGINES.wikipedia,
  "wiki": ENGINES.wikipedia,
  "wikipedia": ENGINES.wikipedia,
  "ddg": ENGINES.duckduckgo,
  "duck": ENGINES.duckduckgo,
  "duckduckgo": ENGINES.duckduckgo,
  "arch": ENGINES.arch,
  "archwiki": ENGINES.arch,
  "r": ENGINES.reddit,
  "reddit": ENGINES.reddit
};

// URL validation regex (checks if input looks like a direct URL or domain)
var URL_REGEX = /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(:\d+)?(\/[^\s]*)?$/i;

// Build search item object
function buildWebItem(engine, queryText, targetUrl, isTopHit, customTitle) {
  var title = customTitle || (engine.name + ": \"" + queryText + "\"");
  return {
    id: "web-" + engine.id + "-" + encodeURIComponent(queryText || "root"),
    kind: "web",
    category: "Web",
    name: title,
    description: "Search " + engine.shortName + " for '" + queryText + "'",
    url: targetUrl,
    icon: engine.icon,
    badge: engine.badge,
    badgeColor: engine.color,
    engineName: engine.name,
    searchQuery: queryText,
    isTopHit: isTopHit,
    hasPreview: true,
    previewType: "web",
    action: "open-url"
  };
}

// Build direct URL navigation item
function buildUrlItem(rawUrl) {
  var fullUrl = rawUrl;
  if (!/^https?:\/\//i.test(fullUrl)) {
    fullUrl = "https://" + fullUrl;
  }
  return {
    id: "web-direct-" + encodeURIComponent(fullUrl),
    kind: "web",
    category: "Web",
    name: "Open " + rawUrl,
    description: "Navigate directly to " + fullUrl,
    url: fullUrl,
    icon: "󰌹",
    badge: "URL",
    badgeColor: "#4285F4",
    engineName: "Direct URL",
    searchQuery: rawUrl,
    isTopHit: true,
    hasPreview: true,
    previewType: "web",
    action: "open-url"
  };
}

// Parse bang or prefix and search
function search(rawInput) {
  var text = (rawInput || "").trim();
  if (text.length === 0) return [];

  var results = [];

  // 1. Direct URL detection (e.g. "https://github.com", "archlinux.org", "google.com/maps")
  if (URL_REGEX.test(text) && text.indexOf(" ") === -1) {
    results.push(buildUrlItem(text));
    return results;
  }

  // 2. Bang notation check: "!g omarchy", "!gh quickshell", "!yt synthwave"
  var bangMatch = text.match(/^!([a-z]+)\s*(.*)$/i);
  if (bangMatch) {
    var bangKey = bangMatch[1].toLowerCase();
    var bangQuery = bangMatch[2].trim();
    var engine = BANG_MAP[bangKey] || ENGINES.google;
    var targetUrl = bangQuery.length > 0 
      ? engine.searchUrl + encodeURIComponent(bangQuery)
      : engine.searchUrl.replace(/[?&](?:q|search|search_query)=.*$/, "");

    // Special jump for GitHub repo format: "!gh user/repo" -> https://github.com/user/repo
    if (engine.id === "github" && /^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/.test(bangQuery)) {
      targetUrl = "https://github.com/" + bangQuery;
    }

    results.push(buildWebItem(engine, bangQuery, targetUrl, true, engine.name + ": " + (bangQuery || engine.shortName)));
    return results;
  }

  // 3. Space-separated prefix check: "g omarchy", "gh quickshell", "yt lo-fi", "wiki linux", "r/unixporn"
  var prefixMatch = text.match(/^([a-z]+)\s+(.+)$/i);
  if (prefixMatch) {
    var prefixKey = prefixMatch[1].toLowerCase();
    var queryPart = prefixMatch[2].trim();
    if (BANG_MAP[prefixKey]) {
      var prefEngine = BANG_MAP[prefixKey];
      var prefUrl = prefEngine.searchUrl + encodeURIComponent(queryPart);

      // Special jump for GitHub repo format: "gh user/repo"
      if (prefEngine.id === "github" && /^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/.test(queryPart)) {
        prefUrl = "https://github.com/" + queryPart;
      }

      results.push(buildWebItem(prefEngine, queryPart, prefUrl, true, prefEngine.name + ": " + queryPart));
      return results;
    }
  }

  // 4. Reddit subreddit shorthand: "r/archlinux" or "/r/archlinux"
  var redditMatch = text.match(/^\/?r\/([a-zA-Z0-9_]+)$/i);
  if (redditMatch) {
    var sub = redditMatch[1];
    var subUrl = "https://www.reddit.com/r/" + sub;
    results.push(buildWebItem(ENGINES.reddit, "r/" + sub, subUrl, true, "Reddit: r/" + sub));
    return results;
  }

  // 5. Default Google & DuckDuckGo fallback suggestions (not top hit, for general queries)
  if (text.length >= 2) {
    var googleUrl = ENGINES.google.searchUrl + encodeURIComponent(text);
    results.push(buildWebItem(ENGINES.google, text, googleUrl, false, "Search Google for \"" + text + "\""));

    var ddgUrl = ENGINES.duckduckgo.searchUrl + encodeURIComponent(text);
    results.push(buildWebItem(ENGINES.duckduckgo, text, ddgUrl, false, "Search DuckDuckGo for \"" + text + "\""));
  }

  return results;
}

// Open target URL in the user's default browser via Omarchy launcher or xdg-open
function openUrl(url, quickshellUtil) {
  if (!url) return;
  var safeUrl = url.replace(/"/g, '\\"');
  var cmd = 'omarchy-launch-browser "' + safeUrl + '" || xdg-open "' + safeUrl + '"';
  if (quickshellUtil && typeof quickshellUtil.execDetached === "function") {
    quickshellUtil.execDetached(cmd);
  }
}
