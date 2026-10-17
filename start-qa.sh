#!/usr/bin/env bash
# Quickstart script for PortGrid QA Testing
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec "${SCRIPT_DIR}/start.sh" qa "$@"
