#!/bin/bash
# Teach Today — start the local Whisper grader server
# Run this once before opening the lesson in the browser.

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# Install dependencies if needed
if ! python3 -c "import whisper, flask, flask_cors" 2>/dev/null; then
  echo "Installing dependencies…"
  pip3 install -r requirements.txt
fi

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║   Teach Today — Whisper Grader Server   ║"
echo "║   http://localhost:5000                 ║"
echo "║   Ctrl+C to stop                        ║"
echo "╚══════════════════════════════════════════╝"
echo ""

python3 grader.py
