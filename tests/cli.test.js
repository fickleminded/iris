const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const { execSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

describe("Iris CLI Companion (bin/iris)", () => {
  const irisBinPath = path.resolve(__dirname, "../bin/iris");

  test("binary exists and has executable permissions", () => {
    assert.ok(fs.existsSync(irisBinPath), "bin/iris must exist");
    const stats = fs.statSync(irisBinPath);
    // Check user executable bit (0o100)
    assert.ok((stats.mode & 0o111) !== 0, "bin/iris must have executable permissions");
  });

  test("displays comprehensive usage guide with help commands", () => {
    const helpOutputs = [
      execSync(`"${irisBinPath}" help`).toString(),
      execSync(`"${irisBinPath}" --help`).toString(),
      execSync(`"${irisBinPath}" -h`).toString()
    ];

    helpOutputs.forEach(out => {
      assert.ok(out.includes("Usage: iris [COMMAND] [ARGS]"));
      assert.ok(out.includes("toggle"));
      assert.ok(out.includes("open [PAYLOAD]"));
      assert.ok(out.includes("close"));
      assert.ok(out.includes("theme [status|sync]"));
      assert.ok(out.includes("setup-keybind [KEY]"));
      assert.ok(out.includes("remove-keybind"));
      assert.ok(out.includes("install-cli"));
    });
  });

  test("inspects and reports active Omarchy theme status", () => {
    const themeOut = execSync(`"${irisBinPath}" theme status`).toString();
    assert.ok(themeOut.includes("• Iris Theme Status:"));
    assert.ok(themeOut.includes("Active Omarchy Theme:"));
    assert.ok(themeOut.includes("Design System: Bound reactively to Omarchy Color and Style tokens."));
  });

  test("builds well-formed JSON payloads for search queries", () => {
    const irisContent = fs.readFileSync(irisBinPath, "utf8");
    const funcMatch = irisContent.match(/build_payload\(\)\s*\{[\s\S]*?\n\}/);
    assert.ok(funcMatch, "build_payload function must exist in bin/iris");
    const buildPayloadFunc = funcMatch[0];

    const runPayload = (args) => {
      const script = `
        ${buildPayloadFunc}
        build_payload ${args}
      `;
      return execSync(script, { shell: "/bin/bash" }).toString().trim();
    };

    // Empty invocation yields empty JSON object
    assert.strictEqual(runPayload(""), "{}");

    // Single query string
    assert.deepStrictEqual(JSON.parse(runPayload("firefox")), { query: "firefox" });

    // Multi-word query string
    assert.deepStrictEqual(JSON.parse(runPayload('"calc 45 * 2"')), { query: "calc 45 * 2" });

    // Raw JSON string passes through intact
    assert.deepStrictEqual(JSON.parse(runPayload('\'{"query":"custom"}\'')), { query: "custom" });
  });

  test("exits with error and displays hint on unknown command", () => {
    assert.throws(
      () => execSync(`"${irisBinPath}" non-existent-command`, { stdio: "pipe" }),
      (err) => {
        return err && err.stderr && err.stderr.toString().includes("iris: unknown command 'non-existent-command'");
      }
    );
  });

  test("proves ownership before installing over existing CLI or desktop files", () => {
    const tmpHome = fs.mkdtempSync("/tmp/iris-test-home-");
    const fakeBinDir = path.join(tmpHome, ".local/bin");
    const fakeAppDir = path.join(tmpHome, ".local/share/applications");
    fs.mkdirSync(fakeBinDir, { recursive: true });
    fs.mkdirSync(fakeAppDir, { recursive: true });

    // Create an unrelated file at ~/.local/bin/iris
    const unrelatedBin = path.join(fakeBinDir, "iris");
    fs.writeFileSync(unrelatedBin, "#!/bin/sh\necho unrelated\n");

    // Invoking install-cli with HOME=tmpHome must refuse to overwrite
    assert.throws(
      () => execSync(`"${irisBinPath}" install-cli`, { env: { ...process.env, HOME: tmpHome }, stdio: "pipe" }),
      (err) => {
        return err && err.stderr && err.stderr.toString().includes("refusing to overwrite existing");
      }
    );

    // Clean up
    fs.rmSync(tmpHome, { recursive: true, force: true });
  });

  test("only removes delimited Iris bindings and preserves unrelated user bindings", () => {
    const tmpHome = fs.mkdtempSync("/tmp/iris-bind-test-");
    const fakeHyprDir = path.join(tmpHome, ".config/hypr");
    fs.mkdirSync(fakeHyprDir, { recursive: true });
    const bindingsFile = path.join(fakeHyprDir, "bindings.lua");

    // Bindings file with user custom binding that mentions 'iris toggle' in a comment or command
    const originalContent = [
      '-- Custom user keybinding',
      'o.bind("SUPER + I", "My custom script", "~/bin/my-iris toggle-helper.sh")',
      '-- BEGIN fickleminded.iris',
      'o.bind("ALT + SPACE", "Iris Spotlight overlay", "omarchy-shell shell toggle fickleminded.iris")',
      '-- END fickleminded.iris',
      'o.bind("SUPER + RETURN", "Terminal", "kitty")'
    ].join("\n");

    fs.writeFileSync(bindingsFile, originalContent);

    // Run remove-keybind
    execSync(`"${irisBinPath}" remove-keybind`, { env: { ...process.env, HOME: tmpHome }, stdio: "pipe" });

    const updatedContent = fs.readFileSync(bindingsFile, "utf8");
    // Delimited block removed
    assert.strictEqual(updatedContent.includes("BEGIN fickleminded.iris"), false);
    assert.strictEqual(updatedContent.includes("END fickleminded.iris"), false);
    // User bindings strictly preserved
    assert.strictEqual(updatedContent.includes('o.bind("SUPER + I", "My custom script", "~/bin/my-iris toggle-helper.sh")'), true);
    assert.strictEqual(updatedContent.includes('o.bind("SUPER + RETURN", "Terminal", "kitty")'), true);

    fs.rmSync(tmpHome, { recursive: true, force: true });
  });

  test("preserves subsequent user bindings when BEGIN marker is present without matching END marker", () => {
    const tmpHome = fs.mkdtempSync("/tmp/iris-orphan-bind-test-");
    const fakeHyprDir = path.join(tmpHome, ".config/hypr");
    fs.mkdirSync(fakeHyprDir, { recursive: true });
    const bindingsFile = path.join(fakeHyprDir, "bindings.lua");

    const malformedContent = [
      '-- Custom user keybinding before',
      'o.bind("SUPER + B", "Browser", "firefox")',
      '-- BEGIN fickleminded.iris',
      'o.bind("ALT + SPACE", "Iris Spotlight overlay", "omarchy-shell shell toggle fickleminded.iris")',
      '-- User binding after unclosed begin marker',
      'o.bind("SUPER + RETURN", "Terminal", "kitty")'
    ].join("\n");

    fs.writeFileSync(bindingsFile, malformedContent);

    // Run remove-keybind
    execSync(`"${irisBinPath}" remove-keybind`, { env: { ...process.env, HOME: tmpHome }, stdio: "pipe" });

    const updatedContent = fs.readFileSync(bindingsFile, "utf8");
    // Orphan BEGIN marker removed
    assert.strictEqual(updatedContent.includes("BEGIN fickleminded.iris"), false);
    // Iris command removed
    assert.strictEqual(updatedContent.includes("omarchy-shell shell toggle fickleminded.iris"), false);
    // User bindings before and AFTER unclosed begin marker are preserved
    assert.strictEqual(updatedContent.includes('o.bind("SUPER + B", "Browser", "firefox")'), true);
    assert.strictEqual(updatedContent.includes('o.bind("SUPER + RETURN", "Terminal", "kitty")'), true);

    fs.rmSync(tmpHome, { recursive: true, force: true });
  });
});
