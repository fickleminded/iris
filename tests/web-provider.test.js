const { test, describe, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { createIrisEngine, createIrisOverlayState } = require("./helpers/qml-env.js");

describe("Iris Web Provider & Bang Shortcuts (WebProvider)", () => {
  let engine;
  let WebProvider;

  beforeEach(() => {
    const iris = createIrisEngine();
    engine = iris.Engine;
    WebProvider = iris.WebProvider;
  });

  describe("1. Search Engines Inventory & Schema (ENGINES & BANG_MAP)", () => {
    test("defines all 7 core web search engines with complete metadata", () => {
      const engines = WebProvider.ENGINES;
      const expectedEngines = ["google", "github", "youtube", "wikipedia", "duckduckgo", "arch", "reddit"];

      expectedEngines.forEach(id => {
        const eng = engines[id];
        assert.ok(eng, `Missing engine configuration for '${id}'`);
        assert.strictEqual(eng.id, id);
        assert.ok(typeof eng.name === "string" && eng.name.length > 0, `Missing name for ${id}`);
        assert.ok(typeof eng.shortName === "string" && eng.shortName.length > 0, `Missing shortName for ${id}`);
        assert.ok(typeof eng.icon === "string" && eng.icon.length > 0, `Missing icon for ${id}`);
        assert.ok(typeof eng.badge === "string" && eng.badge.length > 0, `Missing badge for ${id}`);
        assert.ok(typeof eng.color === "string" && eng.color.startsWith("#"), `Missing valid color for ${id}`);
        assert.ok(typeof eng.searchUrl === "string" && eng.searchUrl.startsWith("https://"), `Missing searchUrl for ${id}`);
      });
    });

    test("maps all bang and prefix aliases accurately in BANG_MAP", () => {
      const map = WebProvider.BANG_MAP;
      const engines = WebProvider.ENGINES;

      // Google aliases
      assert.strictEqual(map["g"], engines.google);
      assert.strictEqual(map["google"], engines.google);

      // GitHub aliases
      assert.strictEqual(map["gh"], engines.github);
      assert.strictEqual(map["github"], engines.github);

      // YouTube aliases
      assert.strictEqual(map["yt"], engines.youtube);
      assert.strictEqual(map["youtube"], engines.youtube);

      // Wikipedia aliases
      assert.strictEqual(map["w"], engines.wikipedia);
      assert.strictEqual(map["wiki"], engines.wikipedia);
      assert.strictEqual(map["wikipedia"], engines.wikipedia);

      // DuckDuckGo aliases
      assert.strictEqual(map["ddg"], engines.duckduckgo);
      assert.strictEqual(map["duck"], engines.duckduckgo);
      assert.strictEqual(map["duckduckgo"], engines.duckduckgo);

      // ArchWiki aliases
      assert.strictEqual(map["arch"], engines.arch);
      assert.strictEqual(map["archwiki"], engines.arch);

      // Reddit aliases
      assert.strictEqual(map["r"], engines.reddit);
      assert.strictEqual(map["reddit"], engines.reddit);
    });
  });

  describe("2. Direct URL Detection & Navigation", () => {
    test("detects full https and http URLs with paths and query parameters", () => {
      const inputs = [
        "https://github.com",
        "https://github.com/torvalds/linux",
        "http://example.com:8080",
        "https://wiki.archlinux.org/title/Hyprland?action=edit"
      ];

      inputs.forEach(url => {
        const results = WebProvider.search(url);
        assert.strictEqual(results.length, 1);
        const item = results[0];
        assert.strictEqual(item.kind, "web");
        assert.strictEqual(item.category, "Web");
        assert.strictEqual(item.url, url);
        assert.strictEqual(item.action, "open-url");
        assert.strictEqual(item.badge, "URL");
        assert.strictEqual(item.isTopHit, true);
        assert.strictEqual(item.hasPreview, true);
        assert.strictEqual(item.previewType, "web");
        assert.strictEqual(item.engineName, "Direct URL");
      });
    });

    test("detects domain names without scheme and prepends https://", () => {
      const inputs = [
        { input: "archlinux.org", expected: "https://archlinux.org" },
        { input: "github.com/omarchy", expected: "https://github.com/omarchy" },
        { input: "subdomain.example.co.uk:3000/api", expected: "https://subdomain.example.co.uk:3000/api" },
        { input: "news.ycombinator.com", expected: "https://news.ycombinator.com" }
      ];

      inputs.forEach(({ input, expected }) => {
        const results = WebProvider.search(input);
        assert.strictEqual(results.length, 1);
        const item = results[0];
        assert.strictEqual(item.url, expected);
        assert.strictEqual(item.name, "Open " + input);
        assert.strictEqual(item.description, "Navigate directly to " + expected);
        assert.strictEqual(item.isTopHit, true);
      });
    });

    test("does not treat multi-word queries with spaces as direct URLs", () => {
      const results = WebProvider.search("archlinux.org install guide");
      assert.ok(results.length >= 2);
      // First hit should be Google fallback search, not direct URL
      assert.strictEqual(results[0].engineName, "Google Search");
      assert.strictEqual(results[0].isTopHit, false);
    });
  });

  describe("3. Bang Notation Syntax (!bang <query>)", () => {
    test("handles standard bangs with queries across all engines", () => {
      const cases = [
        { query: "!g rust programming", engine: "google", url: "https://www.google.com/search?q=rust%20programming" },
        { query: "!gh quickshell", engine: "github", url: "https://github.com/search?q=quickshell" },
        { query: "!yt lo-fi beats", engine: "youtube", url: "https://www.youtube.com/results?search_query=lo-fi%20beats" },
        { query: "!wiki quantum entanglement", engine: "wikipedia", url: "https://en.wikipedia.org/wiki/Special:Search?search=quantum%20entanglement" },
        { query: "!w wayland", engine: "wikipedia", url: "https://en.wikipedia.org/wiki/Special:Search?search=wayland" },
        { query: "!ddg nixos", engine: "duckduckgo", url: "https://duckduckgo.com/?q=nixos" },
        { query: "!duck privacy guide", engine: "duckduckgo", url: "https://duckduckgo.com/?q=privacy%20guide" },
        { query: "!arch pipewire", engine: "arch", url: "https://wiki.archlinux.org/index.php?search=pipewire" },
        { query: "!r unixporn", engine: "reddit", url: "https://www.reddit.com/search/?q=unixporn" },
        { query: "!reddit hyprland", engine: "reddit", url: "https://www.reddit.com/search/?q=hyprland" }
      ];

      cases.forEach(({ query, engine, url }) => {
        const results = WebProvider.search(query);
        assert.strictEqual(results.length, 1);
        const item = results[0];
        assert.strictEqual(item.kind, "web");
        assert.strictEqual(item.url, url);
        assert.strictEqual(item.isTopHit, true);
        assert.strictEqual(item.hasPreview, true);
        assert.strictEqual(item.previewType, "web");
        assert.strictEqual(item.action, "open-url");
      });
    });

    test("supports case-insensitive bang identifiers", () => {
      const resultsUpper = WebProvider.search("!GH quickshell");
      assert.strictEqual(resultsUpper.length, 1);
      assert.strictEqual(resultsUpper[0].url, "https://github.com/search?q=quickshell");

      const resultsMixed = WebProvider.search("!Yt Synthwave");
      assert.strictEqual(resultsMixed.length, 1);
      assert.strictEqual(resultsMixed[0].url, "https://www.youtube.com/results?search_query=Synthwave");
    });

    test("handles bare bang without query by opening engine root URL", () => {
      const cases = [
        { bang: "!g", expectedRoot: "https://www.google.com/search" },
        { bang: "!gh", expectedRoot: "https://github.com/search" },
        { bang: "!yt", expectedRoot: "https://www.youtube.com/results" },
        { bang: "!wiki", expectedRoot: "https://en.wikipedia.org/wiki/Special:Search" },
        { bang: "!ddg", expectedRoot: "https://duckduckgo.com/" },
        { bang: "!arch", expectedRoot: "https://wiki.archlinux.org/index.php" },
        { bang: "!r", expectedRoot: "https://www.reddit.com/search/" }
      ];

      cases.forEach(({ bang, expectedRoot }) => {
        const results = WebProvider.search(bang);
        assert.strictEqual(results.length, 1);
        assert.strictEqual(results[0].url, expectedRoot);
        assert.strictEqual(results[0].isTopHit, true);
      });
    });

    test("falls back to Google search when an unknown bang is entered", () => {
      const results = WebProvider.search("!unknownbang query text");
      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].engineName, "Google Search");
      assert.strictEqual(results[0].url, "https://www.google.com/search?q=query%20text");
      assert.strictEqual(results[0].isTopHit, true);
    });

    test("special GitHub repo direct jump: '!gh user/repo' opens https://github.com/user/repo", () => {
      const results = WebProvider.search("!gh outfoxxed/quickshell");
      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].url, "https://github.com/outfoxxed/quickshell");
      assert.strictEqual(results[0].isTopHit, true);

      // Verify with dots and dashes in repo name
      const resultsComplex = WebProvider.search("!gh rust-lang/rust.vim");
      assert.strictEqual(resultsComplex.length, 1);
      assert.strictEqual(resultsComplex[0].url, "https://github.com/rust-lang/rust.vim");
    });
  });

  describe("4. Space-Separated Prefix Shortcuts (<prefix> <query>)", () => {
    test("handles space-separated prefixes for all mapped engines", () => {
      const cases = [
        { query: "g arch install", engine: "google", url: "https://www.google.com/search?q=arch%20install" },
        { query: "google arch install", engine: "google", url: "https://www.google.com/search?q=arch%20install" },
        { query: "gh hyprland", engine: "github", url: "https://github.com/search?q=hyprland" },
        { query: "yt lofi hip hop", engine: "youtube", url: "https://www.youtube.com/results?search_query=lofi%20hip%20hop" },
        { query: "wiki linux kernel", engine: "wikipedia", url: "https://en.wikipedia.org/wiki/Special:Search?search=linux%20kernel" },
        { query: "w arch linux", engine: "wikipedia", url: "https://en.wikipedia.org/wiki/Special:Search?search=arch%20linux" },
        { query: "ddg duckduckgo bangs", engine: "duckduckgo", url: "https://duckduckgo.com/?q=duckduckgo%20bangs" },
        { query: "duck rust lang", engine: "duckduckgo", url: "https://duckduckgo.com/?q=rust%20lang" },
        { query: "arch nvidia drivers", engine: "arch", url: "https://wiki.archlinux.org/index.php?search=nvidia%20drivers" },
        { query: "r mechanicalkeyboards", engine: "reddit", url: "https://www.reddit.com/search/?q=mechanicalkeyboards" },
        { query: "reddit battlestations", engine: "reddit", url: "https://www.reddit.com/search/?q=battlestations" }
      ];

      cases.forEach(({ query, engine, url }) => {
        const results = WebProvider.search(query);
        assert.strictEqual(results.length, 1);
        const item = results[0];
        assert.strictEqual(item.kind, "web");
        assert.strictEqual(item.url, url);
        assert.strictEqual(item.isTopHit, true);
        assert.strictEqual(item.hasPreview, true);
      });
    });

    test("supports case-insensitive prefixes", () => {
      const results = WebProvider.search("GH Neovim");
      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].url, "https://github.com/search?q=Neovim");
    });

    test("special GitHub repo direct jump with prefix: 'gh user/repo'", () => {
      const results = WebProvider.search("gh fickleminded/iris");
      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].url, "https://github.com/fickleminded/iris");
      assert.strictEqual(results[0].isTopHit, true);
    });

    test("does not treat unmapped leading words as prefix shortcuts", () => {
      // E.g. "foo bar" should drop to generic web search fallback
      const results = WebProvider.search("foo bar");
      assert.strictEqual(results.length, 2);
      assert.strictEqual(results[0].engineName, "Google Search");
      assert.strictEqual(results[0].isTopHit, false);
      assert.strictEqual(results[1].engineName, "DuckDuckGo");
      assert.strictEqual(results[1].isTopHit, false);
    });
  });

  describe("5. Reddit Subreddit Shorthand", () => {
    test("matches 'r/<subreddit>' and generates direct subreddit link", () => {
      const results = WebProvider.search("r/unixporn");
      assert.strictEqual(results.length, 1);
      const item = results[0];
      assert.strictEqual(item.kind, "web");
      assert.strictEqual(item.name, "Reddit: r/unixporn");
      assert.strictEqual(item.url, "https://www.reddit.com/r/unixporn");
      assert.strictEqual(item.badge, "REDDIT");
      assert.strictEqual(item.isTopHit, true);
      assert.strictEqual(item.hasPreview, true);
      assert.strictEqual(item.previewType, "web");
    });

    test("matches leading slash '/r/<subreddit>'", () => {
      const results = WebProvider.search("/r/archlinux");
      assert.strictEqual(results.length, 1);
      const item = results[0];
      assert.strictEqual(item.url, "https://www.reddit.com/r/archlinux");
      assert.strictEqual(item.name, "Reddit: r/archlinux");
      assert.strictEqual(item.isTopHit, true);
    });

    test("handles alphanumeric subreddits with underscores", () => {
      const results = WebProvider.search("r/rust_gamedev");
      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].url, "https://www.reddit.com/r/rust_gamedev");
    });
  });

  describe("6. Default Web Search Fallbacks & Query Encoding", () => {
    test("provides Google and DuckDuckGo search fallbacks for queries >= 2 characters", () => {
      const results = WebProvider.search("how to install arch linux");
      assert.strictEqual(results.length, 2);

      const google = results[0];
      assert.strictEqual(google.engineName, "Google Search");
      assert.strictEqual(google.url, "https://www.google.com/search?q=how%20to%20install%20arch%20linux");
      assert.strictEqual(google.isTopHit, false);
      assert.strictEqual(google.hasPreview, true);
      assert.strictEqual(google.previewType, "web");

      const ddg = results[1];
      assert.strictEqual(ddg.engineName, "DuckDuckGo");
      assert.strictEqual(ddg.url, "https://duckduckgo.com/?q=how%20to%20install%20arch%20linux");
      assert.strictEqual(ddg.isTopHit, false);
    });

    test("properly URL-encodes special characters, punctuation, and spaces", () => {
      const query = "C++ & Rust: What's the 100% best choice?";
      const results = WebProvider.search(query);
      assert.strictEqual(results.length, 2);

      const encoded = encodeURIComponent(query);
      assert.strictEqual(results[0].url, "https://www.google.com/search?q=" + encoded);
      assert.strictEqual(results[1].url, "https://duckduckgo.com/?q=" + encoded);
    });

    test("returns empty array for empty, whitespace, or 1-character queries", () => {
      [WebProvider.search(""), WebProvider.search("   "), WebProvider.search("a"), WebProvider.search(null), WebProvider.search(undefined)].forEach(res => {
        assert.ok(Array.isArray(res));
        assert.strictEqual(res.length, 0);
      });
    });
  });

  describe("7. Browser Execution (openUrl)", () => {
    test("executes browser launch command via quickshellUtil.execDetached", () => {
      const executedCommands = [];
      const mockUtil = {
        execDetached(cmd) {
          executedCommands.push(cmd);
          return true;
        }
      };

      const testUrl = "https://wiki.archlinux.org/title/Hyprland";
      WebProvider.openUrl(testUrl, mockUtil);

      assert.strictEqual(executedCommands.length, 1);
      assert.strictEqual(
        executedCommands[0],
        'omarchy-launch-browser "https://wiki.archlinux.org/title/Hyprland" || xdg-open "https://wiki.archlinux.org/title/Hyprland"'
      );
    });

    test("escapes double quotes safely in target URL", () => {
      const executedCommands = [];
      const mockUtil = {
        execDetached(cmd) {
          executedCommands.push(cmd);
        }
      };

      const maliciousUrl = 'https://google.com/search?q="quotes"&test="123"';
      WebProvider.openUrl(maliciousUrl, mockUtil);

      assert.strictEqual(executedCommands.length, 1);
      assert.strictEqual(
        executedCommands[0],
        'omarchy-launch-browser "https://google.com/search?q=\\"quotes\\"&test=\\"123\\"" || xdg-open "https://google.com/search?q=\\"quotes\\"&test=\\"123\\""'
      );
    });

    test("safely ignores execution on null, undefined, or empty URLs", () => {
      const executedCommands = [];
      const mockUtil = {
        execDetached(cmd) {
          executedCommands.push(cmd);
        }
      };

      WebProvider.openUrl(null, mockUtil);
      WebProvider.openUrl(undefined, mockUtil);
      WebProvider.openUrl("", mockUtil);

      assert.strictEqual(executedCommands.length, 0);
    });

    test("safely handles missing or invalid quickshellUtil without throwing", () => {
      assert.doesNotThrow(() => {
        WebProvider.openUrl("https://archlinux.org", null);
      });
      assert.doesNotThrow(() => {
        WebProvider.openUrl("https://archlinux.org", {});
      });
      assert.doesNotThrow(() => {
        WebProvider.openUrl("https://archlinux.org", undefined);
      });
    });
  });

  describe("8. End-to-End Iris Overlay Integration", () => {
    test("typing a bang query promotes web hit to top and adapts overlay to two-pane mode", () => {
      const overlay = createIrisOverlayState();
      overlay.open("{}");

      overlay.setFilterText("!gh quickshell");

      assert.ok(overlay.itemsList.length >= 1);
      const topHit = overlay.itemsList[0];
      assert.strictEqual(topHit.kind, "web");
      assert.strictEqual(topHit.url, "https://github.com/search?q=quickshell");
      assert.strictEqual(topHit.isTopHit, true);
      assert.strictEqual(topHit.hasPreview, true);
      assert.strictEqual(overlay.selectedItem, topHit);
      assert.strictEqual(overlay.hasPreview, true);
      assert.strictEqual(overlay.currentCardWidth, 920); // Two-pane width
    });

    test("typing a direct URL expands overlay to two-pane mode", () => {
      const overlay = createIrisOverlayState();
      overlay.open("{}");

      overlay.setFilterText("https://archlinux.org");

      assert.strictEqual(overlay.itemsList.length, 1);
      const item = overlay.itemsList[0];
      assert.strictEqual(item.kind, "web");
      assert.strictEqual(item.url, "https://archlinux.org");
      assert.strictEqual(overlay.hasPreview, true);
      assert.strictEqual(overlay.currentCardWidth, 920);
    });

    test("typing a subreddit shorthand expands overlay with Reddit preview", () => {
      const overlay = createIrisOverlayState();
      overlay.open("{}");

      overlay.setFilterText("r/unixporn");

      assert.strictEqual(overlay.itemsList.length, 1);
      const item = overlay.itemsList[0];
      assert.strictEqual(item.kind, "web");
      assert.strictEqual(item.badge, "REDDIT");
      assert.strictEqual(overlay.hasPreview, true);
      assert.strictEqual(overlay.currentCardWidth, 920);
    });

    test("activating a web item opens browser command and dismisses overlay", () => {
      const overlay = createIrisOverlayState();
      overlay.open("{}");
      overlay.setFilterText("!yt synthwave");

      assert.strictEqual(overlay.opened, true);
      const item = overlay.selectedItem;
      assert.ok(item);

      overlay.activateItem(item);

      assert.strictEqual(overlay.opened, false);
      assert.strictEqual(overlay.shellCalls.hide, 1);
      assert.strictEqual(overlay.launchedCommands.length, 1);
      assert.ok(overlay.launchedCommands[0].includes("omarchy-launch-browser"));
      assert.ok(overlay.launchedCommands[0].includes("https://www.youtube.com/results?search_query=synthwave"));
    });

    test("direct openWebUrl helper launches browser command and dismisses overlay", () => {
      const overlay = createIrisOverlayState();
      overlay.open("{}");

      const item = {
        kind: "web",
        url: "https://wiki.archlinux.org"
      };

      overlay.openWebUrl(item);

      assert.strictEqual(overlay.opened, false);
      assert.strictEqual(overlay.shellCalls.hide, 1);
      assert.strictEqual(overlay.launchedCommands.length, 1);
      assert.ok(overlay.launchedCommands[0].includes("https://wiki.archlinux.org"));
    });

    test("general queries place web search fallbacks at the bottom of the results list", () => {
      const overlay = createIrisOverlayState({
        applications: [
          { id: "firefox", name: "Firefox", genericName: "Web Browser", comment: "Browse the internet", exec: "firefox" }
        ]
      });
      overlay.open("{}");
      overlay.setFilterText("firefox");

      // Top hit should be the App
      assert.strictEqual(overlay.itemsList[0].kind, "app");
      assert.strictEqual(overlay.itemsList[0].name, "Firefox");

      // Bottom items should contain the Google & DDG search fallbacks
      const webFallbacks = overlay.itemsList.filter(it => it.kind === "web");
      assert.strictEqual(webFallbacks.length, 2);
      assert.strictEqual(webFallbacks[0].engineName, "Google Search");
      assert.strictEqual(webFallbacks[1].engineName, "DuckDuckGo");
    });
  });
});
