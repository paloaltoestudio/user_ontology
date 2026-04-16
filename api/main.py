import os
import sys
import subprocess
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from core.config import settings as app_settings
from core.database import engine

# Configure logging
logger = logging.getLogger(__name__)

# Import all models to register them
from models import user, scoring_rule, event_log, form, lead, action, goal
from models.lead import WebhookDelivery  # Explicitly import to register the model
from models.action import ActionLog  # Explicitly import to register the model
from models.goal import Goal, GoalCompletion, GoalAssignment, IdempotencyKey  # Explicitly import to register the models
from models.api_key import ApiKey  # Explicitly import to register the model

app = FastAPI(
    title=app_settings.PROJECT_NAME,
    version="1.0.0",
    description="Headless FastAPI Backend for SaaS Registration Engine",
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=app_settings.CORS_ORIGINS,
    allow_credentials=app_settings.CORS_ALLOW_CREDENTIALS,
    allow_methods=app_settings.CORS_ALLOW_METHODS,
    allow_headers=app_settings.CORS_ALLOW_HEADERS,
)

# MCP Server process management
mcp_process = None


def start_mcp_server_subprocess():
    """Start MCP server as subprocess (called at module import time)"""
    global mcp_process

    import time

    logger.info("🔧 Starting MCP Server subprocess...")

    # Check if MCP should be enabled (from settings or env var)
    enable_mcp = os.getenv("ENABLE_MCP", str(app_settings.ENABLE_MCP)).lower() != "false"

    if not enable_mcp:
        logger.info("MCP Server is disabled (ENABLE_MCP=false)")
        return

    try:
        # Start MCP HTTP server as a subprocess on port 8001
        # Use sys.executable to ensure we use the same Python interpreter (venv)
        mcp_process = subprocess.Popen(
            [sys.executable, "mcp_server.py"],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            bufsize=1,
        )
        time.sleep(1.5)

        if mcp_process.poll() is None:  # Process is still running
            logger.info("✓ MCP Server started successfully (PID: %s)", mcp_process.pid)
            logger.info("  → MCP HTTP Server: http://localhost:8001")
            logger.info("  → Connect Inspector: npx @modelcontextprotocol/inspector http://localhost:8001/mcp")
        else:
            # Process exited - read the error output
            stdout, stderr = mcp_process.communicate(timeout=1)
            error_msg = stderr or stdout or "Unknown error"
            logger.warning("⚠ MCP Server process exited immediately")
            logger.warning("Error output:\n%s", error_msg)
            logger.warning("Try running manually to debug: python mcp_server.py")
            mcp_process = None
    except Exception as e:
        logger.warning("⚠ Failed to start MCP Server: %s", str(e))
        logger.warning("  You can run it manually with: python mcp_server.py")
        mcp_process = None


# Start MCP server when module loads (only in main process, not in reloader)
# Check if MCP is already running to avoid conflicts during reloader cycles
if not os.getenv("MCP_SERVER_STARTED"):
    os.environ["MCP_SERVER_STARTED"] = "1"
    start_mcp_server_subprocess()


@app.on_event("shutdown")
async def shutdown_mcp_server():
    """Gracefully shutdown MCP server on app shutdown"""
    global mcp_process

    if mcp_process is None:
        return

    try:
        logger.info("Shutting down MCP Server...")
        mcp_process.terminate()

        # Wait up to 5 seconds for graceful shutdown
        try:
            mcp_process.wait(timeout=5)
            logger.info("✓ MCP Server shutdown complete")
        except subprocess.TimeoutExpired:
            logger.warning("MCP Server did not shutdown gracefully, force killing...")
            mcp_process.kill()
            mcp_process.wait()
            logger.info("✓ MCP Server force killed")
    except Exception as e:
        logger.warning("Error during MCP Server shutdown: %s", str(e))


@app.get("/api/v1/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok"}


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "SaaS Registration Engine API",
        "version": "1.0.0",
        "docs": "/docs",
    }


# Import and include routers from endpoints
from api.v1.endpoints import auth, users, flows, scoring, webhooks, forms, leads, actions, goals, settings

app.include_router(auth.router, prefix="/api/v1")
app.include_router(users.router, prefix="/api/v1")
app.include_router(flows.router, prefix="/api/v1")
app.include_router(scoring.router, prefix="/api/v1")
app.include_router(webhooks.router, prefix="/api/v1")
app.include_router(forms.router, prefix="/api/v1")
app.include_router(leads.router, prefix="/api/v1")
app.include_router(actions.router, prefix="/api/v1")
app.include_router(goals.router, prefix="/api/v1")
app.include_router(settings.router, prefix="/api/v1")
