# Iris Developer Guide 🛠️

This guide is for anyone who wants to run **Iris** locally, build new capabilities or search providers, create custom preview components, and run the automated test suite.

---

## 🏗️ Architecture Overview

Iris is built as a native **Omarchy** overlay plugin utilizing **Quickshell**, **QtQuick/QML**, and a modular JavaScript engine.

```
omarchy-plugins/iris/
├── manifest.json            # Plugin manifest (id: fickleminded.iris, kinds: ["overlay"])
├── Iris.qml                 # Main Layer-Shell window, keyboard handler & layout controller
├── bin/
│   └── iris                 # CLI companion script & IPC wrapper
├── js/
│   ├── IrisEngine.js        # Central query dispatcher, scoring & coordinator
│   └── Providers/           # Modular search providers
│       ├── AppProvider.js   # Desktop application launcher (.desktop)
│       ├── FileProvider.js  # High-speed file & directory search (fd)
│       ├── CalcProvider.js  # Math evaluation & unit/currency conversions
│       ├── SystemProvider.js# Omarchy system controls & themes
│       └── WebProvider.js   # Web search bangs & URL handler
├── components/
│   └── previews/            # Right-side live preview cards
│       ├── AppPreview.qml   # Application actions & metadata
│       ├── FilePreview.qml  # Code/text snippet, image thumbnail & metadata
│       ├── CalcPreview.qml  # Large calculator result card
│       ├── SystemPreview.qml# System action confirmation card
│       └── WebPreview.qml   # Web destination card
└── tests/                   # Automated test suite
    ├── helpers/
    │   └── qml-env.js       # Sandboxed QML/JS test harness
    ├── iris-overlay.test.js # Core lifecycle, presentation & adaptive layout tests
    └── run.sh               # Test runner script
```

---

## 🚀 Local Development Setup

### 1. Prerequisites
Ensure you have the following installed on your system:
- **Omarchy Shell** & **Quickshell**
- **Node.js** (v18+ for running the test suite)
- `qmllint` (included in Qt tools)
- `fd`, `wl-clipboard`, `xdg-terminal-exec`

### 2. Symlink Repository to Omarchy Plugins
To test local changes live in your running desktop shell, link this repository to your user plugin directory:

```bash
# Link the repo
ln -sf "$PWD" ~/.config/omarchy/plugins/fickleminded.iris

# Tell Omarchy shell to discover the plugin
omarchy-shell shell rescanPlugins
omarchy-shell shell enablePlugin fickleminded.iris '{}'
```

### 3. Hot-Reloading Workflow
When you make changes to QML or JS files:

```bash
# Rescan plugins to pick up code changes
omarchy-shell shell rescanPlugins

# Test toggling the overlay
./bin/iris toggle

# Open with a test query
./bin/iris open "25 * 4"
./bin/iris open "!gh omarchy"
```

---

## 🧪 Running the Test Suite

Iris includes an automated unit test suite powered by the native Node.js test runner (`node:test`). Tests run in a sandboxed VM environment that validates the QML engine, search providers, and overlay lifecycle without needing an active Wayland display.

### Run All Tests
```bash
./tests/run.sh
```

Or run directly with Node:
```bash
node --test tests/*.test.js
```

### Watch Mode (Test-Driven Development)
Rerun tests automatically on file save while developing:
```bash
node --test --watch tests/*.test.js
```

### Writing New Tests
Add new test files under `tests/` matching `*.test.js`. You can use the provided `tests/helpers/qml-env.js` harness:

```javascript
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const { createIrisOverlayState, createIrisEngine } = require("./helpers/qml-env.js");

describe("My New Feature", () => {
  test("processes query correctly", () => {
    const iris = createIrisOverlayState();
    iris.open("{}");
    iris.setFilterText("my-query");

    assert.ok(iris.itemsList.length > 0);
  });
});
```

---

## 🧩 Adding a New Search Provider

All search providers reside in `js/Providers/`. To add a new provider:

### 1. Create the Provider File
Create `js/Providers/MyProvider.js`:

```javascript
.pragma library

function search(query, context) {
  var q = (query || "").trim();
  if (q.length === 0) return [];

  // Implement search / match logic
  var results = [];
  results.push({
    id: "my-result-1",
    kind: "custom",
    category: "My Category",
    name: "Result Name",
    description: "Helpful subtitle or description",
    icon: "󰄲",                // Nerd Font glyph
    isTopHit: true,
    hasPreview: true,         // true = expands to two-pane layout
    previewType: "myPreview", // maps to your preview component
    action: "execute",
    details: {
      customField: "data"
    }
  });

  return results;
}
```

### 2. Standard `IrisItem` Model Schema

| Property | Type | Description |
|---|---|---|
| `id` | `string` | Unique identifier (e.g. `app-firefox`, `calc-100`) |
| `kind` | `string` | Kind tag (`"app"`, `"file"`, `"calc"`, `"web"`, `"system"`, `"hint"`) |
| `category` | `string` | Display category pill (e.g. `"Applications"`, `"Calculator"`) |
| `name` | `string` | Primary headline text |
| `description` | `string` | Secondary descriptive text / path |
| `icon` | `string` | Nerd Font glyph character (fallback) |
| `iconSource` | `string` | Optional URL/path for high-res icons (`image://...`, `file://...`) |
| `hasPreview` | `boolean` | `true` expands Iris to two panes; `false` stays compact |
| `previewType` | `string` | Identifier for the preview card (`"app"`, `"file"`, `"calc"`, etc.) |
| `action` | `string` | Action identifier (`"launch"`, `"open"`, `"copy"`, etc.) |
| `details` | `object` | Arbitrary metadata passed directly to the preview card |

### 3. Register Provider in `js/IrisEngine.js`
1. Import your provider at the top:
   ```javascript
   .import "Providers/MyProvider.js" as MyProvider
   ```
2. Dispatch queries in `search(text, context)` in `IrisEngine.js`.
3. Add the execution handler in `Iris.qml` (`activateItem(item)`).

### 4. Create Preview Component (Optional)
If your items set `hasPreview: true`, add a QML preview component in `components/previews/MyPreview.qml` and bind it into the `Loader` inside `Iris.qml`.

---

## 🔍 Validation Checklist

Before submitting code, always run the validation suite:

```bash
# 1. Run unit tests
./tests/run.sh

# 2. QML syntax and imports lint
qmllint -I "$OMARCHY_PATH/shell" Iris.qml

# 3. Omarchy plugin manifest check
omarchy plugin validate .
```
