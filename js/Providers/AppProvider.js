.pragma library

// Iris AppProvider: Desktop applications provider for Iris Spotlight
// Scans, indexes, fuzzy matches, and launches desktop applications.

var cachedEntries = [];
var indexTimestamp = 0;

function entryName(entry) {
  return String((entry && entry.name) || (entry && entry.id) || "").trim();
}

function entrySubtext(entry) {
  var generic = String((entry && entry.genericName) || "").trim();
  if (generic.length > 0) return generic;
  var comment = String((entry && entry.comment) || "").trim();
  return comment;
}

function entryKeywords(entry) {
  try {
    if (entry && entry.keywords) {
      if (Array.isArray(entry.keywords)) return entry.keywords.join(" ");
      if (typeof entry.keywords.join === "function") return entry.keywords.join(" ");
      return String(entry.keywords);
    }
  } catch (e) {}
  return "";
}

function entrySearchHaystack(entry) {
  if (!entry) return "";
  var parts = [
    entryName(entry),
    String((entry && entry.genericName) || ""),
    String((entry && entry.comment) || ""),
    entryKeywords(entry),
    String((entry && entry.id) || "")
  ];
  return parts.join(" ").toLowerCase();
}

function words(text) {
  var cleaned = String(text || "")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[._:/\\-]+/g, " ")
    .toLowerCase();
  var raw = cleaned.split(/[^a-z0-9]+/);
  var res = [];
  for (var i = 0; i < raw.length; i++) {
    if (raw[i] && raw[i].length > 0) res.push(raw[i]);
  }
  return res;
}

function entryAcronym(entry) {
  var w = words(entryName(entry));
  var res = "";
  for (var i = 0; i < w.length; i++) {
    res += w[i].charAt(0);
  }
  return res;
}

// Multi-tier fuzzy & prefix scoring
function scoreEntry(entry, query) {
  var q = String(query || "").trim().toLowerCase();
  if (!q) return 0;

  var name = entryName(entry).toLowerCase();
  var id = String((entry && entry.id) || "").toLowerCase();
  var subtext = entrySubtext(entry).toLowerCase();
  var haystack = entrySearchHaystack(entry);

  // Exact full match
  if (name === q) return 20000;
  if (id === q) return 19000;

  // Exact prefix match (Top Hit candidates)
  if (name.indexOf(q) === 0) {
    return 15000 - (name.length - q.length) * 10;
  }
  if (id.indexOf(q) === 0) {
    return 14000 - (id.length - q.length) * 10;
  }

  // Word prefix match (e.g. "studio" matches "Visual Studio Code")
  var nameWords = words(name);
  for (var w = 0; w < nameWords.length; w++) {
    if (nameWords[w].indexOf(q) === 0) {
      return 12000 - w * 100 - (nameWords[w].length - q.length) * 10;
    }
  }

  // Exact ID component match (e.g. "gimp" in org.gimp.GIMP)
  var idWords = words(id);
  for (var iw = 0; iw < idWords.length; iw++) {
    if (idWords[iw] === q) {
      return 14500;
    }
    if (idWords[iw].indexOf(q) === 0) {
      return 13500 - (idWords[iw].length - q.length) * 10;
    }
  }

  // Acronym match (e.g. "vsc" or "gimp")
  var acronym = entryAcronym(entry);
  if (acronym.length > 0 && acronym.indexOf(q) === 0) {
    return 13000 - (acronym.length - q.length) * 50;
  }

  // Substring match in name
  var nameIndex = name.indexOf(q);
  if (nameIndex > 0) {
    return 8000 - nameIndex * 20 - name.length;
  }

  // Substring match in generic name / subtext
  var subIndex = subtext.indexOf(q);
  if (subIndex >= 0) {
    return 6000 - subIndex * 15;
  }

  // Substring match in full haystack (keywords, comment, id)
  var hayIndex = haystack.indexOf(q);
  if (hayIndex >= 0) {
    return 4000 - hayIndex;
  }

  return -1;
}

// Convert a DesktopEntry to an Iris result object
function formatResult(entry, score, isTopHit, resolveIconFn) {
  var id = String((entry && entry.id) || "").replace(/\.desktop$/, "");
  var name = entryName(entry);
  var subtext = entrySubtext(entry);
  var comment = String((entry && entry.comment) || "").trim();
  var icon = String((entry && entry.icon) || "application-x-executable");
  var isTerminal = !!(entry && entry.terminal);

  var iconSource = "";
  if (typeof resolveIconFn === "function") {
    iconSource = resolveIconFn(icon);
  }

  var categories = [];
  if (entry && entry.categories) {
    if (Array.isArray(entry.categories)) {
      categories = entry.categories;
    } else if (typeof entry.categories === "string") {
      categories = entry.categories.split(";").filter(function(c) { return c && c.length > 0; });
    }
  }

  return {
    id: "app:" + id,
    appId: id,
    kind: "app",
    category: "Applications",
    name: name,
    description: subtext || comment || "Desktop Application",
    comment: comment,
    icon: icon,
    iconSource: iconSource,
    terminal: isTerminal,
    categories: categories,
    score: score,
    isTopHit: isTopHit,
    hasPreview: true,
    previewType: "app",
    action: "launch-app"
  };
}

// Search applications given query text and entries collection
function search(query, rawEntries, resolveIconFn) {
  var entries = rawEntries || cachedEntries || [];
  var q = String(query || "").trim().toLowerCase();
  var matches = [];

  for (var i = 0; i < entries.length; i++) {
    var entry = entries[i];
    if (!entry) continue;
    if (entry.noDisplay) continue;

    var name = entryName(entry);
    if (!name) continue;

    var score = scoreEntry(entry, q);
    if (score >= 0) {
      matches.push({ entry: entry, score: score, name: name });
    }
  }

  // Sort descending by score, then alphabetically
  matches.sort(function(a, b) {
    if (b.score !== a.score) return b.score - a.score;
    return a.name.localeCompare(b.name);
  });

  var results = [];
  var limit = q.length === 0 ? 12 : 30;
  for (var j = 0; j < matches.length && j < limit; j++) {
    var item = matches[j];
    var isTopHit = (q.length > 0 && j === 0 && item.score >= 10000);
    results.push(formatResult(item.entry, item.score, isTopHit, resolveIconFn));
  }

  return results;
}

// Launch application execution handler
function launch(item, shell, quickshellUtil) {
  if (!item || !item.appId) return false;
  var id = item.appId;
  var name = item.name || id;

  // 1. Prefer Omarchy shell appLibrary if available
  if (shell && shell.appLibrary && typeof shell.appLibrary.launch === "function") {
    shell.appLibrary.launch(id, name);
    return true;
  }

  // 2. Detached launch via uwsm-app / gtk-launch
  if (quickshellUtil && typeof quickshellUtil.execDetached === "function") {
    var quoted = quickshellUtil.shellQuote(id + ".desktop");
    quickshellUtil.execDetached("uwsm-app -- gtk-launch " + quoted);
    return true;
  }

  return false;
}
