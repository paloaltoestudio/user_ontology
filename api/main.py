import os
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


@app.on_event("startup")
async def startup_mcp_server():
    """Start MCP server as subprocess on app startup"""
    global mcp_process

    # Check if MCP should be enabled (from settings or env var)
    enable_mcp = os.getenv("ENABLE_MCP", str(app_settings.ENABLE_MCP)).lower() != "false"

    if not enable_mcp:
        logger.info("MCP Server is disabled (ENABLE_MCP=false)")
        return

    try:
        # Start MCP server as a subprocess
        mcp_process = subprocess.Popen(
            ["python", "mcp_server.py"],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            bufsize=1,  # Line buffered
        )
        logger.info("✓ MCP Server started successfully (PID: %s)", mcp_process.pid)
        logger.info("  → MCP tools are available to n8n, Claude, and other MCP clients")
        logger.info("  → API Base URL: http://localhost:%d", app_settings.PORT)
    except Exception as e:
        logger.warning("⚠ Failed to start MCP Server: %s", str(e))
        logger.warning("  You can run it manually with: python mcp_server.py")
        mcp_process = None


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
