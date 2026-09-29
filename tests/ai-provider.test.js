const { test, describe, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { createIrisEngine, createIrisOverlayState } = require("./helpers/qml-env.js");

describe("Iris AI Agent Provider (AiProvider)", () => {
  let engine;
  let AiProvider;

  beforeEach(() => {
    const iris = createIrisEngine();
    engine = iris.Engine;
    AiProvider = iris.AiProvider;
  });

  describe("1. Agent Metadata & Supported Engines", () => {
    test("defines all core Omarchy coding agents with full metadata schemas", () => {
      const agents = AiProvider.AGENTS;
      const expectedAgents = [
        "agy", "gemini", "claude", "opencode", "codex",
        "copilot", "pi", "crush", "grok", "openclaw",
        "cursor", "cursor-agent", "hermes", "muse", "omp"
      ];

      expectedAgents.forEach(id => {
        const ag = agents[id];
        assert.ok(ag, `Missing agent metadata for '${id}'`);
        assert.ok(typeof ag.id === "string" && ag.id.length > 0, `Missing id for ${id}`);
        assert.ok(typeof ag.name === "string" && ag.name.length > 0, `Missing name for ${id}`);
        assert.ok(typeof ag.badge === "string" && ag.badge.length > 0, `Missing badge for ${id}`);
        assert.ok(typeof ag.icon === "string" && ag.icon.length > 0, `Missing icon for ${id}`);
        assert.ok(typeof ag.color === "string" && ag.color.startsWith("#"), `Missing color for ${id}`);
        assert.ok(typeof ag.command === "string" && ag.command.length > 0, `Missing command for ${id}`);
        assert.ok(typeof ag.description === "string" && ag.description.length > 0, `Missing description for ${id}`);
      });
    });

    test("resolves Antigravity (agy) correctly with aliases", () => {
      const agy1 = AiProvider.getAgentMeta("agy");
      assert.strictEqual(agy1.id, "agy");
      assert.strictEqual(agy1.name, "Antigravity");
      assert.strictEqual(agy1.badge, "ANTIGRAVITY");

      const agy2 = AiProvider.getAgentMeta("antigravity");
      assert.strictEqual(agy2.id, "agy");
      assert.strictEqual(agy2.name, "Antigravity");

      const agy3 = AiProvider.getAgentMeta("AGY");
      assert.strictEqual(agy3.id, "agy");
    });

    test("resolves other Omarchy agents cleanly", () => {
      const claude = AiProvider.getAgentMeta("claude");
      assert.strictEqual(claude.id, "claude");
      assert.strictEqual(claude.name, "Claude Code");
      assert.strictEqual(claude.badge, "CLAUDE");

      const gemini = AiProvider.getAgentMeta("gemini");
      assert.strictEqual(gemini.id, "gemini");
      assert.strictEqual(gemini.badge, "GEMINI");

      const opencode = AiProvider.getAgentMeta("opencode");
      assert.strictEqual(opencode.id, "opencode");
      assert.strictEqual(opencode.badge, "OPENCODE");
    });

    test("falls back cleanly on unknown agent names", () => {
      const custom = AiProvider.getAgentMeta("custom-agent");
      assert.strictEqual(custom.id, "custom-agent");
      assert.strictEqual(custom.name, "Custom-agent");
      assert.strictEqual(custom.badge, "CUSTOM-AGENT");
      assert.strictEqual(custom.icon, "󰚩");
    });
  });

  describe("2. Trigger Syntax Recognition (isAiQuery)", () => {
    test("detects bare triggers 'ai' and '?'", () => {
      assert.strictEqual(AiProvider.isAiQuery("ai"), true);
      assert.strictEqual(AiProvider.isAiQuery("AI"), true);
      assert.strictEqual(AiProvider.isAiQuery("?"), true);
      assert.strictEqual(AiProvider.isAiQuery("  ai  "), true);
      assert.strictEqual(AiProvider.isAiQuery("  ?  "), true);
    });

    test("detects space-separated triggers 'ai <prompt>' and '? <prompt>'", () => {
      assert.strictEqual(AiProvider.isAiQuery("ai explain quickshell"), true);
      assert.strictEqual(AiProvider.isAiQuery("AI how to list systemd services"), true);
      assert.strictEqual(AiProvider.isAiQuery("? write a python script"), true);
      assert.strictEqual(AiProvider.isAiQuery("? what is omarchy?"), true);
    });

    test("detects colon-separated triggers 'ai:<prompt>' and '?:<prompt>'", () => {
      assert.strictEqual(AiProvider.isAiQuery("ai:debug memory leak"), true);
      assert.strictEqual(AiProvider.isAiQuery("?:fix docker permissions"), true);
    });

    test("rejects non-AI queries", () => {
      assert.strictEqual(AiProvider.isAiQuery(""), false);
      assert.strictEqual(AiProvider.isAiQuery(null), false);
      assert.strictEqual(AiProvider.isAiQuery("air"), false);
      assert.strictEqual(AiProvider.isAiQuery("airplane"), false);
      assert.strictEqual(AiProvider.isAiQuery("aid"), false);
      assert.strictEqual(AiProvider.isAiQuery("firefox"), false);
      assert.strictEqual(AiProvider.isAiQuery("!g ai agents"), false);
      assert.strictEqual(AiProvider.isAiQuery("what is ai"), false);
    });
  });

  describe("3. Query Parsing (parseQuery)", () => {
    test("parses bare 'ai' into guide mode", () => {
      const parsed = AiProvider.parseQuery("ai");
      assert.strictEqual(parsed.isAi, true);
      assert.strictEqual(parsed.isGuide, true);
      assert.strictEqual(parsed.prompt, "");
      assert.strictEqual(parsed.prefix, "ai");
    });

    test("parses bare '?' into guide mode", () => {
      const parsed = AiProvider.parseQuery("?");
      assert.strictEqual(parsed.isAi, true);
      assert.strictEqual(parsed.isGuide, true);
      assert.strictEqual(parsed.prompt, "");
      assert.strictEqual(parsed.prefix, "?");
    });

    test("parses 'ai <prompt>' into active prompt mode", () => {
      const parsed = AiProvider.parseQuery("ai explain quickshell in one sentence");
      assert.strictEqual(parsed.isAi, true);
      assert.strictEqual(parsed.isGuide, false);
      assert.strictEqual(parsed.prompt, "explain quickshell in one sentence");
      assert.strictEqual(parsed.prefix, "ai");
    });

    test("parses '? <prompt>' into active prompt mode", () => {
      const parsed = AiProvider.parseQuery("? how do I configure hyprland?");
      assert.strictEqual(parsed.isAi, true);
      assert.strictEqual(parsed.isGuide, false);
      assert.strictEqual(parsed.prompt, "how do I configure hyprland?");
      assert.strictEqual(parsed.prefix, "?");
    });

    test("handles extra leading/trailing whitespace cleanly", () => {
      const parsed = AiProvider.parseQuery("  ai    review this code   ");
      assert.strictEqual(parsed.isAi, true);
      assert.strictEqual(parsed.isGuide, false);
      assert.strictEqual(parsed.prompt, "review this code");
    });
  });

  describe("4. Item Generation & Schema (search)", () => {
    test("generates guide item when bare 'ai' is typed", () => {
      const results = AiProvider.search("ai", { defaultAgent: "agy" });
      assert.strictEqual(results.length, 1);
      const guide = results[0];

      assert.strictEqual(guide.id, "ai-guide");
      assert.strictEqual(guide.kind, "hint");
      assert.strictEqual(guide.category, "AI Agent");
      assert.ok(guide.name.includes("Antigravity"));
      assert.strictEqual(guide.badge, "ANTIGRAVITY");
      assert.strictEqual(guide.isTopHit, true);
      assert.strictEqual(guide.hasPreview, true);
      assert.strictEqual(guide.previewType, "ai");
      assert.strictEqual(guide.fillQuery, "ai ");
    });

    test("generates active AI prompt candidate item", () => {
      const results = AiProvider.search("ai explain quickshell", { defaultAgent: "agy" });
      assert.strictEqual(results.length, 1);
      const item = results[0];

      assert.strictEqual(item.kind, "ai");
      assert.strictEqual(item.category, "AI Agent");
      assert.strictEqual(item.name, "explain quickshell");
      assert.strictEqual(item.prompt, "explain quickshell");
      assert.strictEqual(item.badge, "ANTIGRAVITY");
      assert.strictEqual(item.isTopHit, true);
      assert.strictEqual(item.hasPreview, true);
      assert.strictEqual(item.previewType, "ai");
      assert.strictEqual(item.action, "ai");

      // Verify command and inlineArgs
      assert.ok(item.command.includes("omarchy agent prompt"));
      assert.deepStrictEqual(Array.from(item.inlineArgs), ["omarchy", "agent", "prompt", "--inline", "explain quickshell"]);
    });

    test("adapts badge and name according to context.defaultAgent", () => {
      const claudeResults = AiProvider.search("? check syntax", { defaultAgent: "claude" });
      assert.strictEqual(claudeResults[0].badge, "CLAUDE");
      assert.ok(claudeResults[0].description.includes("Claude Code"));

      const geminiResults = AiProvider.search("ai check syntax", { defaultAgent: "gemini" });
      assert.strictEqual(geminiResults[0].badge, "GEMINI");
      assert.ok(geminiResults[0].description.includes("Gemini"));
    });
  });

  describe("5. Command & Argument Builders", () => {
    test("builds inline arguments correctly", () => {
      const args = AiProvider.buildInlineArgs("hello world");
      assert.deepStrictEqual(Array.from(args), ["omarchy", "agent", "prompt", "--inline", "hello world"]);
    });

    test("builds launch command escaping quotes safely", () => {
      const cmd = AiProvider.buildLaunchCommand('explain "Quickshell" properly');
      assert.strictEqual(cmd, 'omarchy agent prompt "explain \\"Quickshell\\" properly"');
    });
  });

  describe("6. Action Handlers (launchInteractive & copyResponse)", () => {
    test("launches interactive session via quickshellUtil.execDetached", () => {
      let executedCommand = null;
      const fakeUtil = {
        execDetached: (cmd) => { executedCommand = cmd; }
      };

      const item = {
        prompt: "explain quickshell",
        command: 'omarchy agent prompt "explain quickshell"'
      };

      AiProvider.launchInteractive(item, fakeUtil);
      assert.strictEqual(executedCommand, 'omarchy agent prompt "explain quickshell"');
    });

    test("copies response text to clipboard using copyToClipboard", () => {
      let copiedText = null;
      const fakeUtil = {
        copyToClipboard: (t) => { copiedText = t; }
      };

      AiProvider.copyResponse("This is an AI response.", fakeUtil);
      assert.strictEqual(copiedText, "This is an AI response.");
    });

    test("safely ignores empty copyResponse calls", () => {
      let called = false;
      const fakeUtil = {
        copyToClipboard: () => { called = true; }
      };

      AiProvider.copyResponse("", fakeUtil);
      AiProvider.copyResponse(null, fakeUtil);
      assert.strictEqual(called, false);
    });
  });

  describe("7. End-to-End Iris Overlay Integration (IrisEngine.js)", () => {
    test("empty query hint list includes 'hint-ai'", () => {
      const hints = engine.search("");
      const aiHint = hints.find(h => h.id === "hint-ai");
      assert.ok(aiHint, "Missing 'hint-ai' in empty search hints");
      assert.strictEqual(aiHint.category, "AI Agent");
      assert.strictEqual(aiHint.fillQuery, "ai ");
    });

    test("typing 'ai' in IrisEngine returns AI guide as top hit", () => {
      const results = engine.search("ai", { defaultAgent: "agy" });
      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].id, "ai-guide");
      assert.strictEqual(results[0].badge, "ANTIGRAVITY");
    });

    test("typing 'ai <prompt>' in IrisEngine returns prompt as top hit", () => {
      const results = engine.search("ai how to run tests in node", { defaultAgent: "agy" });
      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].kind, "ai");
      assert.strictEqual(results[0].prompt, "how to run tests in node");
      assert.strictEqual(results[0].badge, "ANTIGRAVITY");
      assert.strictEqual(results[0].hasPreview, true);
    });

    test("typing '? <prompt>' in IrisEngine returns prompt as top hit", () => {
      const results = engine.search("? what is quickshell", { defaultAgent: "agy" });
      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].kind, "ai");
      assert.strictEqual(results[0].prompt, "what is quickshell");
    });

    test("launchAi helper executes interactive launch", () => {
      let executed = null;
      const fakeUtil = { execDetached: (cmd) => { executed = cmd; } };
      const item = { prompt: "test prompt", command: 'omarchy agent prompt "test prompt"' };

      engine.launchAi(item, fakeUtil);
      assert.strictEqual(executed, 'omarchy agent prompt "test prompt"');
    });

    test("copyAiResponse helper copies text", () => {
      let copied = null;
      const fakeUtil = { copyToClipboard: (t) => { copied = t; } };

      engine.copyAiResponse("AI response text", fakeUtil);
      assert.strictEqual(copied, "AI response text");
    });
  });

  describe("8. Overlay Process Lifecycle & State Machine (Step 7.3)", () => {
    test("initializes overlay with idle AI state", () => {
      const overlay = createIrisOverlayState();
      assert.strictEqual(overlay.aiState, "idle");
      assert.strictEqual(overlay.aiPrompt, "");
      assert.strictEqual(overlay.aiResponseText, "");
      assert.strictEqual(overlay.aiErrorText, "");
      assert.strictEqual(overlay.aiQueryGen, 0);
    });

    test("typing bare 'ai' remains in idle guide mode", () => {
      const overlay = createIrisOverlayState();
      overlay.setFilterText("ai");
      assert.strictEqual(overlay.aiState, "idle");
      assert.strictEqual(overlay.aiPrompt, "");
    });

    test("typing prompt sets aiPrompt and cancels any prior query", () => {
      const overlay = createIrisOverlayState();
      overlay.setFilterText("ai what is quickshell");
      assert.strictEqual(overlay.aiPrompt, "what is quickshell");
      assert.strictEqual(overlay.aiState, "idle");
    });

    test("executeAiQuery transitions to 'thinking' state and bumps generation", () => {
      const overlay = createIrisOverlayState();
      overlay.setFilterText("ai explain quickshell");
      const initialGen = overlay.aiQueryGen;

      overlay.executeAiQuery();
      assert.strictEqual(overlay.aiState, "thinking");
      assert.strictEqual(overlay.aiQueryGen, initialGen + 1);
    });

    test("cancelAiQuery stops running query and resets to idle", () => {
      const overlay = createIrisOverlayState();
      overlay.setFilterText("ai explain quickshell");
      overlay.executeAiQuery();
      assert.strictEqual(overlay.aiState, "thinking");

      overlay.cancelAiQuery();
      assert.strictEqual(overlay.aiState, "idle");
    });

    test("changing query cancels prior query and resets text on non-AI input", () => {
      const overlay = createIrisOverlayState();
      overlay.setFilterText("ai explain quickshell");
      overlay.executeAiQuery();
      overlay.aiResponseText = "Partial response...";

      // Backspacing to non-AI clears AI state and text
      overlay.setFilterText("firefox");
      assert.strictEqual(overlay.aiPrompt, "");
      assert.strictEqual(overlay.aiState, "idle");
      assert.strictEqual(overlay.aiResponseText, "");
    });

    test("closing or opening overlay cleanly cancels in-flight AI queries", () => {
      const overlay = createIrisOverlayState();
      overlay.setFilterText("ai explain quickshell");
      overlay.executeAiQuery();
      assert.strictEqual(overlay.aiState, "thinking");

      overlay.close();
      assert.strictEqual(overlay.aiState, "idle");

      overlay.open("{}");
      assert.strictEqual(overlay.aiState, "idle");
      assert.strictEqual(overlay.aiPrompt, "");
      assert.strictEqual(overlay.aiResponseText, "");
    });

    test("activating AI candidate launches interactive terminal and dismisses overlay", () => {
      const overlay = createIrisOverlayState();
      overlay.open("{}");
      overlay.setFilterText("ai how to build quickshell");

      const item = overlay.selectedItem;
      assert.ok(item);
      assert.strictEqual(item.kind, "ai");

      overlay.activateItem(item);
      assert.strictEqual(overlay.opened, false);
      assert.strictEqual(overlay.launchedCommands.length, 1);
      assert.strictEqual(overlay.launchedCommands[0], 'omarchy agent prompt "how to build quickshell"');
    });

    test("copyAiResponse helper copies streamed response text", () => {
      let copiedText = null;
      const overlay = createIrisOverlayState({
        quickshellUtil: {
          copyToClipboard: (txt) => { copiedText = txt; }
        }
      });

      overlay.copyAiResponse("Here is the generated answer.");
      assert.strictEqual(copiedText, "Here is the generated answer.");
    });
  });

  describe("9. Proactive Unconfigured Agent Setup Flow", () => {
    test("resolves setup metadata when agent is empty, unset, or none", () => {
      const emptyMeta = AiProvider.getAgentMeta("");
      assert.strictEqual(emptyMeta.id, "unset");
      assert.strictEqual(emptyMeta.badge, "SETUP");
      assert.strictEqual(emptyMeta.isConfigured, false);
      assert.strictEqual(emptyMeta.command, "omarchy-menu summon setup.default.agent");

      const unsetMeta = AiProvider.getAgentMeta("unset");
      assert.strictEqual(unsetMeta.badge, "SETUP");
      assert.strictEqual(unsetMeta.isConfigured, false);

      const nullMeta = AiProvider.getAgentMeta(null);
      assert.strictEqual(nullMeta.badge, "SETUP");
      assert.strictEqual(nullMeta.isConfigured, false);
    });

    test("search returns ai-setup-guide when default agent is unset", () => {
      const results = AiProvider.search("ai", { defaultAgent: "" });
      assert.strictEqual(results.length, 1);
      const item = results[0];

      assert.strictEqual(item.id, "ai-setup-guide");
      assert.strictEqual(item.kind, "ai-setup");
      assert.strictEqual(item.badge, "SETUP");
      assert.strictEqual(item.action, "ai-setup");
      assert.strictEqual(item.command, "omarchy-menu summon setup.default.agent");
    });

    test("search returns ai-setup-prompt when user types query with unset agent", () => {
      const results = AiProvider.search("ai explain quickshell", { defaultAgent: "" });
      assert.strictEqual(results.length, 1);
      const item = results[0];

      assert.strictEqual(item.id, "ai-setup-prompt");
      assert.strictEqual(item.kind, "ai-setup");
      assert.strictEqual(item.name, "explain quickshell");
      assert.strictEqual(item.badge, "SETUP");
      assert.strictEqual(item.command, "omarchy-menu summon setup.default.agent");
    });

    test("launchInteractive executes omarchy-menu summon setup.default.agent for ai-setup item", () => {
      let executed = null;
      const fakeUtil = { execDetached: (cmd) => { executed = cmd; } };
      const item = { kind: "ai-setup", action: "ai-setup", command: "omarchy-menu summon setup.default.agent" };

      AiProvider.launchInteractive(item, fakeUtil);
      assert.strictEqual(executed, "omarchy-menu summon setup.default.agent");
    });

    test("activating setup item in overlay executes setup menu and dismisses overlay", () => {
      const overlay = createIrisOverlayState({ defaultAgent: "" });
      overlay.open("{}");
      overlay.setFilterText("ai");

      const item = overlay.selectedItem;
      assert.ok(item);
      assert.strictEqual(item.kind, "ai-setup");

      overlay.activateItem(item);
      assert.strictEqual(overlay.opened, false);
      assert.strictEqual(overlay.launchedCommands.length, 1);
      assert.strictEqual(overlay.launchedCommands[0], "omarchy-menu summon setup.default.agent");
    });
  });
});


