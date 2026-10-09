#!/usr/bin/env bash

# PortGrid Local Developer Platform Launcher
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

echo "=========================================================="
echo "Starting PortGrid Control Plane and Dashboard..."
echo "=========================================================="

# Start backend in background
(cd backend && npm run start:dev) &
BACKEND_PID=$!

# Start frontend in background
(cd frontend && npm run dev) &
FRONTEND_PID=$!

cleanup() {
  echo ""
  echo "Shutting down PortGrid..."
  kill $BACKEND_PID 2>/dev/null || true
  kill $FRONTEND_PID 2>/dev/null || true
  exit 0
}

trap cleanup INT TERM

echo ""
echo "PortGrid is active."
echo "Dashboard: http://localhost:3000"
echo "Control Plane API: http://localhost:4000/api"
echo "Press Ctrl+C to stop both services."
echo ""

wait
