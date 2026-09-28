#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "=== Running Iris Test Suite ==="
node --test "$ROOT_DIR"/tests/*.test.js
echo "✓ All Iris tests passed!"
