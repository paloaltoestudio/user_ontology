#!/bin/bash

# UserVision API MCP Server Launcher
# This script starts the MCP server in development or production mode

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
MCP_PORT=${MCP_PORT:-8001}
API_PORT=${API_PORT:-8000}
API_HOST=${API_HOST:-localhost}
ENV=${ENV:-development}

# Function to print info messages
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed"
    exit 1
fi

print_info "UserVision API MCP Server Launcher"
print_info "Environment: $ENV"
print_info "API Server: http://$API_HOST:$API_PORT"

# Change to API directory
cd "$(dirname "$0")"

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    print_warning "Virtual environment not found. Creating one..."
    python3 -m venv venv
fi

# Activate virtual environment
print_info "Activating virtual environment..."
source venv/bin/activate

# Install dependencies
print_info "Installing dependencies..."
pip install -q -r requirements.txt 2>/dev/null || {
    print_warning "Some dependencies failed to install, but continuing..."
}

# Check if FastAPI is running
print_info "Checking if FastAPI API is running on http://$API_HOST:$API_PORT..."
if timeout 2 python3 -c "import httpx; httpx.get('http://$API_HOST:$API_PORT/api/v1/health', timeout=1)" 2>/dev/null; then
    print_success "FastAPI API is running ✓"
else
    print_warning "FastAPI API is not responding. Make sure it's running on http://$API_HOST:$API_PORT"
    print_warning "Start the API in another terminal with: uvicorn main:app --reload --port $API_PORT"
fi

print_info ""
print_success "Starting MCP Server..."
print_info "MCP Server will be available on stdio"
print_info ""

# Display usage information
echo "┌────────────────────────────────────────────────────────────┐"
echo "│         UserVision API MCP Server Started                  │"
echo "├────────────────────────────────────────────────────────────┤"
echo "│ To use with n8n or other MCP clients:                      │"
echo "│ 1. Get an API key from the admin panel                    │"
echo "│ 2. Call authenticate(api_key=\"sk_xxx\") first             │"
echo "│ 3. Then use other tools like list_forms(), create_lead()  │"
echo "│                                                            │"
echo "│ For help, see: MCP_README.md                              │"
echo "└────────────────────────────────────────────────────────────┘"
echo ""

# Run the MCP server
python3 mcp_server.py
