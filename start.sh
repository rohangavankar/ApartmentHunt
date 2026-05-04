#!/bin/bash
set -e

echo "==> Starting ApartHunt"

# Check Docker
if ! command -v docker &>/dev/null; then
  echo "ERROR: Docker not found. Install Docker Desktop first."
  exit 1
fi

# Start services
echo "==> Starting Postgres + Redis..."
docker compose up -d postgres redis

echo "==> Waiting for Postgres..."
until docker compose exec -T postgres pg_isready -U aparthunt &>/dev/null; do sleep 1; done

echo "==> Installing Python deps..."
cd backend
pip install -r requirements.txt -q

echo "==> Running DB migrations and seed..."
python seed_data.py
cd ..

echo "==> Starting backend (port 8000)..."
cd backend
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!
cd ..

echo "==> Installing frontend deps..."
cd frontend
npm install --silent

echo "==> Starting frontend (port 3000)..."
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "======================================"
echo "  ApartHunt is running!"
echo "  Map:           http://localhost:3000"
echo "  Neighborhoods: http://localhost:3000/neighborhoods"
echo "  Alerts:        http://localhost:3000/alerts"
echo "  Chat:          http://localhost:3000/chat"
echo "  API docs:      http://localhost:8000/docs"
echo "======================================"
echo ""
echo "Press Ctrl+C to stop"

wait $BACKEND_PID $FRONTEND_PID
