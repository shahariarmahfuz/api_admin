#!/bin/bash
set -e

echo "=== Starting Orvia API Platform (Unified Architecture) ==="

# Kill any lingering instances
pkill -f "uvicorn app.main:app" || true
pkill -f "next start" || true
pkill -f "cloudflared tunnel" || true
sleep 1

export PORT="${PORT:-3000}"
export BACKEND_INTERNAL_URL="http://127.0.0.1:8000"

# Step 1: Start Internal Backend (FastAPI on 127.0.0.1:8000 ONLY)
echo "Starting internal Backend (FastAPI on 127.0.0.1:8000)..."
cd /root/api/backend
python3 -m uvicorn app.main:app --host 127.0.0.1 --port 8000 &
BACKEND_PID=$!

# Step 2: Start Public Frontend (Next.js on 0.0.0.0:3000)
echo "Starting public Frontend (Next.js on 0.0.0.0:3000)..."
cd /root/api/frontend
npm run start -- -H 0.0.0.0 -p 3000 &
FRONTEND_PID=$!

# Step 3: Wait for both services to be responsive
echo "Awaiting health check responses..."
for i in {1..30}; do
    if curl -s http://127.0.0.1:8000/api/v1/health > /dev/null && curl -s -I http://127.0.0.1:3000 > /dev/null; then
        echo "✅ Internal Backend (127.0.0.1:8000) and Frontend (0.0.0.0:3000) are healthy and online!"
        break
    fi
    sleep 1
done

# Step 4: Start Cloudflare Tunnel ONLY for Public Entry Point (Next.js on port 3000)
# FastAPI on port 8000 remains strictly internal and is never directly exposed.
echo "Starting Cloudflare Quick Tunnel for Web Portal & Dashboard (port 3000)..."
cloudflared tunnel --url http://127.0.0.1:3000
