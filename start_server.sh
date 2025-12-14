#!/bin/bash

echo "============================================"
echo "Stock & Crypto Chart Viewer"
echo "============================================"
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "[SETUP] Installing Node.js dependencies..."
    npm install
    echo ""
fi

# Check if .venv exists
if [ ! -d ".venv" ]; then
    echo "[SETUP] Creating Python virtual environment..."
    uv venv
    echo ""
fi

# Activate virtual environment and check Python packages
echo "[SETUP] Checking Python environment..."
source .venv/bin/activate

python -c "import yfinance" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "[SETUP] Installing Python dependencies..."
    uv pip install -e .
    echo ""
fi

echo "[READY] Starting web server..."
echo "[INFO] Server will be available at: http://localhost:3000"
echo "[INFO] Press Ctrl+C to stop the server"
echo ""

# Start the server
node src/web/server.js
