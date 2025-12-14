@echo off
echo ============================================
echo Stock ^& Crypto Chart Viewer
echo ============================================
echo.

REM Check if node_modules exists
if not exist "node_modules\" (
    echo [SETUP] Installing Node.js dependencies...
    call npm install
    echo.
)

REM Check if .venv exists
if not exist ".venv\" (
    echo [SETUP] Creating Python virtual environment...
    call uv venv
    echo.
)

REM Activate virtual environment and check Python packages
echo [SETUP] Checking Python environment...
call .venv\Scripts\activate.bat

python -c "import yfinance" 2>nul
if errorlevel 1 (
    echo [SETUP] Installing Python dependencies...
    call uv pip install -e .
    echo.
)

echo [READY] Starting web server...
echo [INFO] Server will be available at: http://localhost:3000
echo [INFO] Press Ctrl+C to stop the server
echo.

REM Start the server
node src\web\server.js
