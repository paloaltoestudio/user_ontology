@echo off
REM UserVision API MCP Server Launcher (Windows)

setlocal enabledelayedexpansion

REM Configuration
set MCP_PORT=8001
set API_PORT=8000
set API_HOST=localhost
set ENV=development

echo.
echo [INFO] UserVision API MCP Server Launcher
echo [INFO] Environment: %ENV%
echo [INFO] API Server: http://%API_HOST%:%API_PORT%
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed or not in PATH
    exit /b 1
)

REM Change to API directory
cd /d "%~dp0"

REM Check if virtual environment exists
if not exist "venv" (
    echo [WARNING] Virtual environment not found. Creating one...
    python -m venv venv
)

REM Activate virtual environment
echo [INFO] Activating virtual environment...
call venv\Scripts\activate.bat

REM Install dependencies
echo [INFO] Installing dependencies...
pip install -q -r requirements.txt

echo.
echo [SUCCESS] Starting MCP Server...
echo.

REM Display usage information
echo.
echo ============================================================
echo          UserVision API MCP Server Started
echo ============================================================
echo.
echo To use with n8n or other MCP clients:
echo  1. Get an API key from the admin panel
echo  2. Call authenticate(api_key="sk_xxx") first
echo  3. Then use other tools like list_forms(), create_lead()
echo.
echo For help, see: MCP_README.md
echo.
echo ============================================================
echo.

REM Run the MCP server
python mcp_server.py

pause
