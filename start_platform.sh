#!/bin/bash
set -e

echo "=== Starting Orvia API Platform ==="

# Kill any lingering instances
pkill -f "uvicorn app.main:app" || true
pkill -f "next start" || true
pkill -f "cloudflared tunnel" || true
sleep 1

# Start Backend
echo "Starting Backend (FastAPI on port 8000)..."
cd /root/api/backend
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# Start Frontend
echo "Starting Frontend (Next.js on port 3000)..."
cd /root/api/frontend
npm run start &
FRONTEND_PID=$!

# Wait for both services to be responsive
echo "Awaiting health check responses..."
for i in {1..30}; do
    if curl -s http://127.0.0.1:8000/health > /dev/null && curl -s -I http://127.0.0.1:3000 > /dev/null; then
        echo "✅ Both Backend (8000) and Frontend (3000) are healthy and online!"
        break
    fi
    sleep 1
done

# Start Cloudflare Tunnel for Direct Backend
echo "Starting Cloudflare Quick Tunnel for Backend API (port 8000)..."
cloudflared tunnel --url http://127.0.0.1:8000 > /root/api/tunnel_backend.log 2>&1 &
BACKEND_TUNNEL_PID=$!

# Start Cloudflare Tunnel for Web Portal & Admin Console (port 3000 in foreground to keep runner active)
echo "Starting Cloudflare Quick Tunnel for Web Portal & Dashboard (port 3000)..."
cloudflared tunnel --url http://127.0.0.1:3000
