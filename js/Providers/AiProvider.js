.pragma library

// AiProvider.js: AI Agent Integration Provider for Iris Spotlight
// Connects Iris Spotlight to Omarchy's system default AI coding agent (e.g. Antigravity/agy).
// Supports 'ai <prompt>' and '? <prompt>' triggers, live streaming integration, and interactive terminal handoff.

var AGENTS = {
  agy: {
    id: "agy",
    name: "Antigravity",
    shortName: "Antigravity",
    badge: "ANTIGRAVITY",
    icon: "󰚩",
    color: "#8ab4f8",
    command: "agy",
    description: "Google DeepMind Advanced Agentic Coding CLI"
  },
  gemini: {
    id: "gemini",
    name: "Gemini",
    shortName: "Gemini",
    badge: "GEMINI",
    icon: "󰚩",
    color: "#4285f4",
    command: "gemini",
    description: "Google Gemini CLI"
  },
  claude: {
    id: "claude",
    name: "Claude Code",
    shortName: "Claude",
    badge: "CLAUDE",
    icon: "󰚩",
    color: "#d97706",
    command: "claude",
    description: "Anthropic Claude Code CLI"
  },
  opencode: {
    id: "opencode",
    name: "OpenCode",
    shortName: "OpenCode",
    badge: "OPENCODE",
    icon: "󰚩",
    color: "#10b981",
    command: "opencode",
    description: "OpenCode AI Assistant"
  },
  codex: {
    id: "codex",
    name: "Codex",
    shortName: "Codex",
    badge: "CODEX",
    icon: "󰚩",
    color: "#10a37f",
    command: "codex",
    description: "OpenAI Codex CLI"
  },
  copilot: {
    id: "copilot",
    name: "GitHub Copilot",
    shortName: "Copilot",
    badge: "COPILOT",
    icon: "󰚩",
    color: "#6e40c9",
    command: "copilot",
    description: "GitHub Copilot CLI"
  },
  pi: {
    id: "pi",
    name: "Pi Agent",
    shortName: "Pi",
    badge: "PI",
    icon: "󰚩",
    color: "#ec4899",
    command: "pi",
    description: "Pi Personal AI"
  },
  crush: {
    id: "crush",
    name: "Crush",
    shortName: "Crush",
    badge: "CRUSH",
    icon: "󰚩",
    color: "#ef4444",
    command: "crush",
    description: "Crush AI Coding Agent"
  },
  grok: {
    id: "grok",
    name: "Grok",
    shortName: "Grok",
    badge: "GROK",
    icon: "󰚩",
    color: "#ffffff",
    command: "grok",
    description: "xAI Grok CLI"
  },
  openclaw: {
    id: "openclaw",
    name: "OpenClaw",
    shortName: "OpenClaw",
    badge: "OPENCLAW",
    icon: "󰚩",
    color: "#06b6d4",
    command: "openclaw",
    description: "OpenClaw Autonomous Agent Platform"
  },
  cursor: {
    id: "cursor-agent",
    name: "Cursor CLI",
    shortName: "Cursor",
    badge: "CURSOR",
    icon: "󰚩",
    color: "#007acc",
    command: "cursor-agent",
    description: "Cursor Agent CLI"
  },
  hermes: {
    id: "hermes",
    name: "Hermes",
    shortName: "Hermes",
    badge: "HERMES",
    icon: "󰚩",
    color: "#f59e0b",
    command: "hermes",
    description: "Hermes Agent CLI"
  },
  muse: {
    id: "muse",
    name: "Muse Code",
    shortName: "Muse",
    badge: "MUSE",
    icon: "󰚩",
    color: "#8b5cf6",
    command: "muse",
    description: "Meta Muse Code CLI"
  },
  omp: {
    id: "omp",
    name: "Oh My Pi",
    shortName: "Oh My Pi",
    badge: "OMP",
    icon: "󰚩",
    color: "#14b8a6",
    command: "omp",
    description: "Oh My Pi Agent"
  }
};
AGENTS["cursor-agent"] = AGENTS.cursor;

// Retrieve agent metadata by id, falling back to unset/setup state if empty
function getAgentMeta(agentId) {
  if (!agentId || String(agentId).trim().length === 0 || String(agentId).trim().toLowerCase() === "none" || String(agentId).trim().toLowerCase() === "unset") {
    return {
      id: "unset",
      name: "Configure AI Agent",
      shortName: "Setup",
      badge: "SETUP",
      icon: "󰚩",
      color: "#8ab4f8",
      command: "omarchy-menu summon setup.default.agent",
      description: "No default coding agent set in Omarchy",
      isConfigured: false
    };
  }

  var key = String(agentId).trim().toLowerCase();
  if (key === "antigravity") key = "agy";
  if (AGENTS[key]) {
    var meta = Object.assign({}, AGENTS[key]);
    meta.isConfigured = true;
    return meta;
  }
  return {
    id: key,
    name: key.charAt(0).toUpperCase() + key.slice(1),
    shortName: key,
    badge: key.toUpperCase(),
    icon: "󰚩",
    color: "#8ab4f8",
    command: key,
    description: "AI Agent (" + key + ")",
    isConfigured: true
  };
}

// Check if query is an AI trigger query
function isAiQuery(queryText) {
  if (!queryText) return false;
  var q = String(queryText).trim();
  if (q.length === 0) return false;
  var lower = q.toLowerCase();

  // Bare triggers
  if (lower === "ai" || lower === "?") return true;

  // Prefix triggers
  if (lower.indexOf("ai ") === 0 || lower.indexOf("? ") === 0) return true;
  if (lower.indexOf("ai:") === 0 || lower.indexOf("?:") === 0) return true;

  return false;
}

// Parse AI query into prompt and guide state
function parseQuery(queryText) {
  if (!queryText) return { isAi: false, isGuide: false, prompt: "", prefix: "" };
  var raw = String(queryText).trim();
  var lower = raw.toLowerCase();

  if (lower === "ai" || lower === "?") {
    return { isAi: true, isGuide: true, prompt: "", prefix: lower };
  }

  var prefix = "";
  var prompt = "";

  if (lower.indexOf("ai ") === 0) {
    prefix = "ai";
    prompt = raw.slice(3).trim();
  } else if (lower.indexOf("? ") === 0) {
    prefix = "?";
    prompt = raw.slice(2).trim();
  } else if (lower.indexOf("ai:") === 0) {
    prefix = "ai:";
    prompt = raw.slice(3).trim();
  } else if (lower.indexOf("?:") === 0) {
    prefix = "?:";
    prompt = raw.slice(2).trim();
  } else {
    return { isAi: false, isGuide: false, prompt: "", prefix: "" };
  }

  return {
    isAi: true,
    isGuide: prompt.length === 0,
    prompt: prompt,
    prefix: prefix
  };
}

// Build inline CLI arguments for Process execution
function buildInlineArgs(prompt) {
  return ["omarchy", "agent", "prompt", "--inline", String(prompt || "")];
}

// Build interactive command string for full terminal session
function buildLaunchCommand(prompt) {
  var escaped = String(prompt || "").replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\$/g, "\\$").replace(/`/g, "\\`");
  return 'omarchy agent prompt "' + escaped + '"';
}

// Main search provider entry point
function search(queryText, context) {
  var parsed = parseQuery(queryText);
  if (!parsed.isAi) return [];

  var defaultAgentId = context && context.defaultAgent !== undefined ? context.defaultAgent : "agy";
  var agentMeta = getAgentMeta(defaultAgentId);

  // If no agent configured, route to native Omarchy agent setup
  if (!agentMeta.isConfigured) {
    if (parsed.isGuide) {
      return [
        {
          id: "ai-setup-guide",
          kind: "ai-setup",
          category: "AI Agent",
          name: "Configure Default AI Agent",
          description: "No default agent set • Enter to pick an agent in Omarchy",
          icon: "󰚩",
          badge: "SETUP",
          agent: agentMeta,
          prompt: "",
          isTopHit: true,
          hasPreview: true,
          previewType: "ai",
          action: "ai-setup",
          fillQuery: "ai ",
          command: "omarchy-menu summon setup.default.agent"
        }
      ];
    }

    return [
      {
        id: "ai-setup-prompt",
        kind: "ai-setup",
        category: "AI Agent",
        name: parsed.prompt,
        description: "No default agent set • Enter to pick an agent in Omarchy",
        icon: "󰚩",
        badge: "SETUP",
        agent: agentMeta,
        prompt: parsed.prompt,
        isTopHit: true,
        hasPreview: true,
        previewType: "ai",
        action: "ai-setup",
        command: "omarchy-menu summon setup.default.agent"
      }
    ];
  }

  if (parsed.isGuide) {
    return [
      {
        id: "ai-guide",
        kind: "hint",
        category: "AI Agent",
        name: "AI Agent Mode (" + agentMeta.name + ")",
        description: "Type 'ai <question>' or '? <prompt>' to ask " + agentMeta.name + " with live response",
        icon: agentMeta.icon,
        badge: agentMeta.badge,
        agent: agentMeta,
        prompt: "",
        isTopHit: true,
        hasPreview: true,
        previewType: "ai",
        action: "hint",
        fillQuery: "ai "
      }
    ];
  }

  return [
    {
      id: "ai-prompt-" + encodeURIComponent(parsed.prompt),
      kind: "ai",
      category: "AI Agent",
      name: parsed.prompt,
      description: "Ask " + agentMeta.name + " (" + agentMeta.badge + ") • Enter to launch interactive terminal",
      icon: agentMeta.icon,
      badge: agentMeta.badge,
      agent: agentMeta,
      prompt: parsed.prompt,
      isTopHit: true,
      hasPreview: true,
      previewType: "ai",
      action: "ai",
      command: buildLaunchCommand(parsed.prompt),
      inlineArgs: buildInlineArgs(parsed.prompt)
    }
  ];
}

// Launch full interactive TUI agent terminal or agent setup picker via quickshellUtil
function launchInteractive(item, quickshellUtil) {
  if (!item) return;
  if (item.action === "ai-setup" || item.kind === "ai-setup") {
    var setupCmd = item.command || "omarchy-menu summon setup.default.agent";
    if (quickshellUtil && typeof quickshellUtil.execDetached === "function") {
      quickshellUtil.execDetached(setupCmd);
    }
    return;
  }
  if (!item.prompt) return;
  var cmd = item.command || buildLaunchCommand(item.prompt);
  if (quickshellUtil && typeof quickshellUtil.execDetached === "function") {
    quickshellUtil.execDetached(cmd);
  }
}

// Copy AI response to clipboard
function copyResponse(text, quickshellUtil) {
  if (text === null || text === undefined || String(text).trim().length === 0) return;
  var clean = String(text);
  if (quickshellUtil && typeof quickshellUtil.copyToClipboard === "function") {
    quickshellUtil.copyToClipboard(clean);
  } else if (quickshellUtil && typeof quickshellUtil.execDetached === "function") {
    if (typeof quickshellUtil.shellQuote === "function") {
      quickshellUtil.execDetached("printf %s " + quickshellUtil.shellQuote(clean) + " | wl-copy");
    } else {
      var escaped = clean.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\$/g, "\\$").replace(/`/g, "\\`");
      quickshellUtil.execDetached('printf "%s" "' + escaped + '" | wl-copy');
    }
  }
}

