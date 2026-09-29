#!/bin/bash
set -e

echo "=========================================================="
echo " Starting Orvia API Platform (Unified Production Container)"
echo "=========================================================="

# Bind to Render's dynamic $PORT environment variable, defaulting to 3000
PORT="${PORT:-3000}"
export PORT
export BACKEND_INTERNAL_URL="${BACKEND_INTERNAL_URL:-http://127.0.0.1:8000}"
export NODE_ENV="production"
export PYTHONUNBUFFERED=1

echo "Target Public Port: 0.0.0.0:${PORT}"
echo "Internal Backend:   ${BACKEND_INTERNAL_URL}"

# Signal Handler for Graceful Shutdown
cleanup() {
    echo "Received shutdown signal. Stopping child processes..."
    if [ -n "$FRONTEND_PID" ]; then
        kill -TERM "$FRONTEND_PID" 2>/dev/null || true
    fi
    if [ -n "$BACKEND_PID" ]; then
        kill -TERM "$BACKEND_PID" 2>/dev/null || true
    fi
    wait
    echo "Orvia API Platform stopped cleanly."
    exit 0
}

trap cleanup SIGTERM SIGINT SIGQUIT

# Step 1: Database Migration Check
if [ -n "$DATABASE_URL" ]; then
    echo "Checking and applying database migrations (Alembic)..."
    cd /app/backend
    python3 -m alembic upgrade head || echo "Database migration warning: continuing with application launch..."
    cd /app
fi

# Step 2: Start Internal FastAPI Backend (127.0.0.1:8000)
echo "Starting internal FastAPI backend on 127.0.0.1:8000..."
cd /app/backend
python3 -m uvicorn app.main:app --host 127.0.0.1 --port 8000 &
BACKEND_PID=$!
cd /app

# Step 3: Health Verification of Internal Backend
echo "Verifying internal FastAPI backend readiness..."
BACKEND_ONLINE=0
for i in $(seq 1 40); do
    if curl -s "http://127.0.0.1:8000/api/v1/health" | grep -q "healthy" || curl -s "http://127.0.0.1:8000/health" | grep -q "online"; then
        echo "✅ Internal FastAPI backend is operational on 127.0.0.1:8000!"
        BACKEND_ONLINE=1
        break
    fi
    if ! kill -0 "$BACKEND_PID" 2>/dev/null; then
        echo "❌ Fatal Error: FastAPI backend process died on startup."
        exit 1
    fi
    sleep 1
done

if [ "$BACKEND_ONLINE" -ne 1 ]; then
    echo "❌ Fatal Error: FastAPI backend did not respond within 40 seconds."
    kill -TERM "$BACKEND_PID" 2>/dev/null || true
    exit 1
fi

# Step 4: Start Public Next.js Frontend on 0.0.0.0:$PORT
echo "Starting public Next.js frontend on 0.0.0.0:${PORT}..."
cd /app/frontend
./node_modules/.bin/next start -H 0.0.0.0 -p "${PORT}" &
FRONTEND_PID=$!
cd /app

echo "=========================================================="
echo " Orvia API Platform is LIVE on 0.0.0.0:${PORT}"
echo " Reverse Proxy /api/ -> ${BACKEND_INTERNAL_URL}/api/"
echo "=========================================================="

# Step 5: Supervision Loop
while true; do
    if ! kill -0 "$BACKEND_PID" 2>/dev/null; then
        echo "❌ Fatal: Internal FastAPI backend exited unexpectedly."
        cleanup
        exit 1
    fi
    if ! kill -0 "$FRONTEND_PID" 2>/dev/null; then
        echo "❌ Fatal: Next.js frontend process exited unexpectedly."
        cleanup
        exit 1
    fi
    sleep 2
done
