.pragma library

// Iris FileProvider: High-performance file and folder search provider
// Coordinates fd queries, categorization, path parsing, and file actions.

var CODE_EXTS = {
  "js": 1, "ts": 1, "jsx": 1, "tsx": 1, "qml": 1, "py": 1, "rs": 1, "go": 1,
  "c": 1, "cpp": 1, "h": 1, "hpp": 1, "sh": 1, "bash": 1, "zsh": 1, "fish": 1,
  "html": 1, "css": 1, "scss": 1, "json": 1, "jsonc": 1, "toml": 1, "yaml": 1,
  "yml": 1, "lua": 1, "vim": 1, "sql": 1, "php": 1, "java": 1, "kt": 1
};

var DOC_EXTS = {
  "pdf": 1, "md": 1, "markdown": 1, "txt": 1, "docx": 1, "doc": 1, "odt": 1,
  "csv": 1, "tsv": 1, "xlsx": 1, "xls": 1, "org": 1, "epub": 1
};

var IMAGE_EXTS = {
  "png": 1, "jpg": 1, "jpeg": 1, "webp": 1, "svg": 1, "gif": 1, "bmp": 1,
  "ico": 1, "tiff": 1, "avif": 1
};

var MEDIA_EXTS = {
  "mp3": 1, "flac": 1, "wav": 1, "ogg": 1, "m4a": 1, "aac": 1,
  "mp4": 1, "mkv": 1, "webm": 1, "mov": 1, "avi": 1
};

var ARCHIVE_EXTS = {
  "zip": 1, "tar": 1, "gz": 1, "xz": 1, "bz2": 1, "7z": 1, "rar": 1
};

// Determine file category based on extension and trailing slash
function fileCategory(path, isDir) {
  if (isDir) return "Folders";
  var dot = path.lastIndexOf(".");
  if (dot === -1) return "Files";
  var ext = path.slice(dot + 1).toLowerCase();

  if (CODE_EXTS[ext]) return "Code";
  if (DOC_EXTS[ext]) return "Documents";
  if (IMAGE_EXTS[ext]) return "Images";
  if (MEDIA_EXTS[ext]) return "Media";
  if (ARCHIVE_EXTS[ext]) return "Archives";
  return "Files";
}

// Select appropriate Nerd Font icon
function fileIcon(path, isDir) {
  if (isDir) return "󰉋";
  var dot = path.lastIndexOf(".");
  if (dot === -1) return "󰈔";
  var ext = path.slice(dot + 1).toLowerCase();

  if (CODE_EXTS[ext]) return "󰌠";
  if (DOC_EXTS[ext]) return "󰈙";
  if (IMAGE_EXTS[ext]) return "󰋩";
  if (MEDIA_EXTS[ext]) return "󰝚";
  if (ARCHIVE_EXTS[ext]) return "󰛫";
  return "󰈔";
}

// Generate fd command line arguments
function buildFdArgs(query, searchDir) {
  var q = String(query || "").trim();
  var dir = searchDir || (typeof Quickshell !== "undefined" && Quickshell.env ? Quickshell.env("HOME") : "") || ".";

  var args = [
    "fd",
    "--max-results", "25"
  ];

  // If query starts with dot, search hidden files as well
  if (q.charAt(0) === ".") {
    args.push("-H");
  }

  // Noise directory exclusions
  args.push("--exclude", ".git");
  args.push("--exclude", "node_modules");
  args.push("--exclude", ".cache");
  args.push("--exclude", ".venv");
  args.push("--exclude", "__pycache__");
  args.push("--exclude", ".npm");
  args.push("--exclude", ".cargo");
  args.push("--exclude", ".rustup");
  args.push("--exclude", ".local/share/Trash");
  args.push("--exclude", "steamapps");

  // Search pattern and target directory
  args.push(q);
  args.push(dir);

  return args;
}

// Parse fd stdout lines into Iris item models
function parseOutput(rawOutput, searchDir) {
  var text = String(rawOutput || "").trim();
  if (text.length === 0) return [];

  var lines = text.split(/\r?\n/);
  var results = [];
  var homeDir = searchDir || (typeof Quickshell !== "undefined" && Quickshell.env ? Quickshell.env("HOME") : "") || "";

  for (var i = 0; i < lines.length && i < 25; i++) {
    var line = lines[i].trim();
    if (line.length === 0) continue;

    var isDir = line.slice(-1) === "/";
    var cleanPath = isDir ? line.slice(0, -1) : line;
    var slash = cleanPath.lastIndexOf("/");
    var name = slash !== -1 ? cleanPath.slice(slash + 1) : cleanPath;
    var dir = slash !== -1 ? cleanPath.slice(0, slash) : "";

    var dot = name.lastIndexOf(".");
    var ext = (!isDir && dot !== -1) ? name.slice(dot + 1).toLowerCase() : "";
    var category = fileCategory(cleanPath, isDir);
    var icon = fileIcon(cleanPath, isDir);

    var displayDir = dir.indexOf(homeDir) === 0 ? "~" + dir.slice(homeDir.length) : dir;

    results.push({
      id: "file:" + cleanPath,
      path: cleanPath,
      dir: dir,
      kind: "file",
      category: category,
      name: name,
      description: displayDir,
      icon: icon,
      extension: ext,
      isFolder: isDir,
      hasPreview: true,
      previewType: "file",
      action: "open-file"
    });
  }

  return results;
}

// Action Handlers
function open(item, quickshellUtil) {
  if (!item || !item.path) return;
  if (quickshellUtil && typeof quickshellUtil.execDetached === "function") {
    quickshellUtil.execDetached("xdg-open " + quickshellUtil.shellQuote(item.path));
  }
}

function showInFolder(item, quickshellUtil) {
  if (!item || !item.path) return;
  if (quickshellUtil && typeof quickshellUtil.execDetached === "function") {
    quickshellUtil.execDetached("uwsm-app -- nautilus --select " + quickshellUtil.shellQuote(item.path));
  }
}

function openTerminal(item, quickshellUtil) {
  if (!item) return;
  var fallbackHome = (quickshellUtil && typeof quickshellUtil.env === "function" ? quickshellUtil.env("HOME") : "") || "";
  var targetDir = item.isFolder ? item.path : (item.dir || fallbackHome || ".");
  if (quickshellUtil && typeof quickshellUtil.execDetached === "function") {
    quickshellUtil.execDetached("uwsm-app -- xdg-terminal-exec --dir=" + quickshellUtil.shellQuote(targetDir));
  }
}

function copyPath(item, quickshellUtil) {
  if (!item || !item.path) return;
  if (quickshellUtil && typeof quickshellUtil.execDetached === "function") {
    quickshellUtil.execDetached("printf %s " + quickshellUtil.shellQuote(item.path) + " | wl-copy");
  }
}
