#!/usr/bin/env bash

# Start the Managed ChatKit FastAPI backend.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$PROJECT_ROOT"

if [ ! -d ".venv" ]; then
  echo "Creating virtual env in $PROJECT_ROOT/.venv ..."
  # Try python3.11 first (check both command and common paths), fallback to python3.13, then python3
  PYTHON_CMD=""
  if command -v python3.11 &> /dev/null; then
    PYTHON_CMD="python3.11"
  elif [ -f "/opt/homebrew/bin/python3.11" ]; then
    PYTHON_CMD="/opt/homebrew/bin/python3.11"
  elif command -v python3.13 &> /dev/null; then
    PYTHON_CMD="python3.13"
  elif [ -f "/opt/homebrew/bin/python3.13" ]; then
    PYTHON_CMD="/opt/homebrew/bin/python3.13"
  elif command -v python3 &> /dev/null; then
    PYTHON_CMD="python3"
  else
    echo "Error: No suitable Python version found. Requires Python 3.11+"
    exit 1
  fi
  $PYTHON_CMD -m venv .venv
fi

source .venv/bin/activate

echo "Upgrading pip ..."
pip install --upgrade pip >/dev/null

echo "Installing backend deps (editable) ..."
pip install -e . >/dev/null

# Load env vars from the repo's .env.local (if present) so OPENAI_API_KEY
# does not need to be exported manually.
ENV_FILE="$PROJECT_ROOT/../.env.local"
if [ -z "${OPENAI_API_KEY:-}" ] && [ -f "$ENV_FILE" ]; then
  echo "Sourcing OPENAI_API_KEY from $ENV_FILE"
  # shellcheck disable=SC1090
  set -a
  . "$ENV_FILE"
  set +a
fi

if [ -z "${OPENAI_API_KEY:-}" ]; then
  echo "Set OPENAI_API_KEY in your environment or in .env.local before running this script."
  exit 1
fi

export PYTHONPATH="$PROJECT_ROOT${PYTHONPATH:+:$PYTHONPATH}"

echo "Starting Managed ChatKit backend on http://127.0.0.1:8000 ..."
exec uvicorn app.main:app --reload --host 127.0.0.1 --port 8000

