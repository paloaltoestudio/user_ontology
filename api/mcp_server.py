#!/usr/bin/env python3
"""
MCP Server for UserVision API
Exposes all FastAPI endpoints as MCP tools, accessible by any AI agent or system.
Authentication via API keys stored in the database.
"""

import asyncio
import json
import logging
from typing import Any, Optional
from contextlib import asynccontextmanager

import httpx
from mcp.server import Server, NotImplementedError as MCPNotImplementedError
from mcp.types import (
    Tool,
    TextContent,
    ToolResult,
    Resource,
    ResourceTemplate,
)

from core.config import settings
from core.database import AsyncSessionLocal, engine, get_db
from models.api_key import ApiKey
from sqlalchemy import select

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create MCP Server
server = Server("uservision-api-mcp")


class MCPServerState:
    """Holds server state and session management"""

    def __init__(self):
        self.base_url = f"http://localhost:{settings.PORT or 8000}"
        self.api_key: Optional[str] = None

    async def authenticate_api_key(self, api_key: str) -> bool:
        """Verify API key exists in database"""
        async with AsyncSessionLocal() as session:
            result = await session.execute(
                select(ApiKey).where(ApiKey.key == api_key).where(ApiKey.is_active == True)
            )
            key_obj = result.scalars().first()
            return key_obj is not None

    async def make_request(
        self,
        method: str,
        endpoint: str,
        headers: Optional[dict] = None,
        json_data: Optional[dict] = None,
        params: Optional[dict] = None,
    ) -> dict:
        """Make authenticated request to the API"""
        if not self.api_key:
            return {"error": "No API key authenticated"}

        if headers is None:
            headers = {}

        headers["X-API-Key"] = self.api_key
        headers["Content-Type"] = "application/json"

        url = f"{self.base_url}{endpoint}"

        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                response = await client.request(
                    method=method,
                    url=url,
                    headers=headers,
                    json=json_data,
                    params=params,
                )
                return {
                    "status": response.status_code,
                    "data": response.json() if response.content else None,
                    "headers": dict(response.headers),
                }
            except Exception as e:
                return {"error": str(e), "status": 500}


state = MCPServerState()


# ============================================================================
# TOOLS - API Endpoint Operations
# ============================================================================


@server.call_tool()
async def handle_tool_call(name: str, arguments: dict) -> list[TextContent | ToolResult]:
    """Handle tool calls for all API operations"""

    if name == "authenticate":
        api_key = arguments.get("api_key")
        if await state.authenticate_api_key(api_key):
            state.api_key = api_key
            return [TextContent(type="text", text="Successfully authenticated with API key")]
        else:
            return [TextContent(type="text", text="Invalid API key")]

    # All other operations require authentication
    if not state.api_key:
        return [TextContent(type="text", text="Error: Not authenticated. Use 'authenticate' tool first.")]

    # User endpoints
    if name == "get_user":
        user_id = arguments.get("user_id")
        result = await state.make_request("GET", f"/api/v1/users/{user_id}")
        return [TextContent(type="text", text=json.dumps(result, indent=2))]

    elif name == "update_user":
        user_id = arguments.get("user_id")
        data = arguments.get("data", {})
        result = await state.make_request("PUT", f"/api/v1/users/{user_id}", json_data=data)
        return [TextContent(type="text", text=json.dumps(result, indent=2))]

    # Forms endpoints
    elif name == "list_forms":
        result = await state.make_request("GET", "/api/v1/forms")
        return [TextContent(type="text", text=json.dumps(result, indent=2))]

    elif name == "create_form":
        data = arguments.get("data", {})
        result = await state.make_request("POST", "/api/v1/forms", json_data=data)
        return [TextContent(type="text", text=json.dumps(result, indent=2))]

    elif name == "get_form":
        form_id = arguments.get("form_id")
        result = await state.make_request("GET", f"/api/v1/forms/{form_id}")
        return [TextContent(type="text", text=json.dumps(result, indent=2))]

    elif name == "update_form":
        form_id = arguments.get("form_id")
        data = arguments.get("data", {})
        result = await state.make_request("PUT", f"/api/v1/forms/{form_id}", json_data=data)
        return [TextContent(type="text", text=json.dumps(result, indent=2))]

    elif name == "delete_form":
        form_id = arguments.get("form_id")
        result = await state.make_request("DELETE", f"/api/v1/forms/{form_id}")
        return [TextContent(type="text", text=json.dumps(result, indent=2))]

    # Leads endpoints
    elif name == "list_leads":
        form_id = arguments.get("form_id")
        params = {"form_id": form_id} if form_id else {}
        result = await state.make_request("GET", "/api/v1/leads", params=params)
        return [TextContent(type="text", text=json.dumps(result, indent=2))]

    elif name == "get_lead":
        lead_id = arguments.get("lead_id")
        result = await state.make_request("GET", f"/api/v1/leads/{lead_id}")
        return [TextContent(type="text", text=json.dumps(result, indent=2))]

    elif name == "create_lead":
        data = arguments.get("data", {})
        result = await state.make_request("POST", "/api/v1/leads", json_data=data)
        return [TextContent(type="text", text=json.dumps(result, indent=2))]

    elif name == "update_lead":
        lead_id = arguments.get("lead_id")
        data = arguments.get("data", {})
        result = await state.make_request("PUT", f"/api/v1/leads/{lead_id}", json_data=data)
        return [TextContent(type="text", text=json.dumps(result, indent=2))]

    # Actions endpoints
    elif name == "list_actions":
        result = await state.make_request("GET", "/api/v1/actions")
        return [TextContent(type="text", text=json.dumps(result, indent=2))]

    elif name == "create_action":
        data = arguments.get("data", {})
        result = await state.make_request("POST", "/api/v1/actions", json_data=data)
        return [TextContent(type="text", text=json.dumps(result, indent=2))]

    elif name == "get_action":
        action_id = arguments.get("action_id")
        result = await state.make_request("GET", f"/api/v1/actions/{action_id}")
        return [TextContent(type="text", text=json.dumps(result, indent=2))]

    elif name == "update_action":
        action_id = arguments.get("action_id")
        data = arguments.get("data", {})
        result = await state.make_request("PUT", f"/api/v1/actions/{action_id}", json_data=data)
        return [TextContent(type="text", text=json.dumps(result, indent=2))]

    elif name == "delete_action":
        action_id = arguments.get("action_id")
        result = await state.make_request("DELETE", f"/api/v1/actions/{action_id}")
        return [TextContent(type="text", text=json.dumps(result, indent=2))]

    elif name == "trigger_action":
        action_id = arguments.get("action_id")
        data = arguments.get("data", {})
        result = await state.make_request(
            "POST", f"/api/v1/actions/{action_id}/trigger", json_data=data
        )
        return [TextContent(type="text", text=json.dumps(result, indent=2))]

    # Goals endpoints
    elif name == "list_goals":
        result = await state.make_request("GET", "/api/v1/goals")
        return [TextContent(type="text", text=json.dumps(result, indent=2))]

    elif name == "create_goal":
        data = arguments.get("data", {})
        result = await state.make_request("POST", "/api/v1/goals", json_data=data)
        return [TextContent(type="text", text=json.dumps(result, indent=2))]

    elif name == "get_goal":
        goal_id = arguments.get("goal_id")
        result = await state.make_request("GET", f"/api/v1/goals/{goal_id}")
        return [TextContent(type="text", text=json.dumps(result, indent=2))]

    elif name == "update_goal":
        goal_id = arguments.get("goal_id")
        data = arguments.get("data", {})
        result = await state.make_request("PUT", f"/api/v1/goals/{goal_id}", json_data=data)
        return [TextContent(type="text", text=json.dumps(result, indent=2))]

    elif name == "delete_goal":
        goal_id = arguments.get("goal_id")
        result = await state.make_request("DELETE", f"/api/v1/goals/{goal_id}")
        return [TextContent(type="text", text=json.dumps(result, indent=2))]

    # Scoring endpoints
    elif name == "get_scoring_config":
        result = await state.make_request("GET", "/api/v1/scoring/config")
        return [TextContent(type="text", text=json.dumps(result, indent=2))]

    elif name == "update_scoring_config":
        data = arguments.get("data", {})
        result = await state.make_request("PUT", "/api/v1/scoring/config", json_data=data)
        return [TextContent(type="text", text=json.dumps(result, indent=2))]

    elif name == "calculate_lead_score":
        lead_id = arguments.get("lead_id")
        result = await state.make_request("POST", f"/api/v1/scoring/leads/{lead_id}/score")
        return [TextContent(type="text", text=json.dumps(result, indent=2))]

    # Webhooks endpoints
    elif name == "get_webhook_deliveries":
        action_id = arguments.get("action_id")
        result = await state.make_request("GET", f"/api/v1/webhooks/actions/{action_id}/deliveries")
        return [TextContent(type="text", text=json.dumps(result, indent=2))]

    # Health check
    elif name == "health_check":
        result = await state.make_request("GET", "/api/v1/health")
        return [TextContent(type="text", text=json.dumps(result, indent=2))]

    else:
        return [TextContent(type="text", text=f"Unknown tool: {name}")]


# ============================================================================
# RESOURCES - Available Endpoints and Schemas
# ============================================================================


@server.list_resources()
async def list_resources() -> list[Resource | ResourceTemplate]:
    """List available resources (endpoints and documentation)"""
    return [
        Resource(
            uri="uservision://api/endpoints/users",
            name="Users Endpoints",
            description="User management endpoints (get, update profile)",
            mimeType="application/json",
        ),
        Resource(
            uri="uservision://api/endpoints/forms",
            name="Forms Endpoints",
            description="Form CRUD operations (create, list, read, update, delete)",
            mimeType="application/json",
        ),
        Resource(
            uri="uservision://api/endpoints/leads",
            name="Leads Endpoints",
            description="Lead management (create, list, get, update)",
            mimeType="application/json",
        ),
        Resource(
            uri="uservision://api/endpoints/actions",
            name="Actions Endpoints",
            description="Action CRUD and triggering operations",
            mimeType="application/json",
        ),
        Resource(
            uri="uservision://api/endpoints/goals",
            name="Goals Endpoints",
            description="Goal management and tracking",
            mimeType="application/json",
        ),
        Resource(
            uri="uservision://api/endpoints/scoring",
            name="Scoring Endpoints",
            description="Lead scoring configuration and calculation",
            mimeType="application/json",
        ),
        Resource(
            uri="uservision://api/endpoints/webhooks",
            name="Webhooks Endpoints",
            description="Webhook delivery tracking",
            mimeType="application/json",
        ),
        Resource(
            uri="uservision://api/health",
            name="Health Check",
            description="API health status",
            mimeType="application/json",
        ),
    ]


@server.read_resource()
async def read_resource(uri: str) -> str:
    """Read resource documentation"""
    resources_doc = {
        "uservision://api/endpoints/users": {
            "description": "User management API",
            "endpoints": [
                {
                    "name": "get_user",
                    "method": "GET",
                    "path": "/api/v1/users/{user_id}",
                    "description": "Get user by ID",
                    "params": {"user_id": "int"},
                }
            ],
        },
        "uservision://api/endpoints/forms": {
            "description": "Form management API",
            "endpoints": [
                {
                    "name": "list_forms",
                    "method": "GET",
                    "path": "/api/v1/forms",
                    "description": "List all forms",
                },
                {
                    "name": "create_form",
                    "method": "POST",
                    "path": "/api/v1/forms",
                    "description": "Create new form",
                },
                {
                    "name": "get_form",
                    "method": "GET",
                    "path": "/api/v1/forms/{form_id}",
                    "description": "Get form by ID",
                },
            ],
        },
        "uservision://api/endpoints/leads": {
            "description": "Lead management API",
            "endpoints": [
                {
                    "name": "list_leads",
                    "method": "GET",
                    "path": "/api/v1/leads",
                    "description": "List leads",
                    "params": {"form_id": "int (optional)"},
                },
                {
                    "name": "create_lead",
                    "method": "POST",
                    "path": "/api/v1/leads",
                    "description": "Create new lead",
                },
                {
                    "name": "get_lead",
                    "method": "GET",
                    "path": "/api/v1/leads/{lead_id}",
                    "description": "Get lead by ID",
                },
            ],
        },
    }

    if uri in resources_doc:
        return json.dumps(resources_doc[uri], indent=2)
    else:
        return json.dumps({"error": "Unknown resource"})


# ============================================================================
# AVAILABLE TOOLS
# ============================================================================


def get_tools() -> list[Tool]:
    """Get all available tools"""
    return [
        # Authentication
        Tool(
            name="authenticate",
            description="Authenticate with an API key. Required before using other tools.",
            inputSchema={
                "type": "object",
                "properties": {
                    "api_key": {
                        "type": "string",
                        "description": "The API key for authentication",
                    }
                },
                "required": ["api_key"],
            },
        ),
        # User operations
        Tool(
            name="get_user",
            description="Get user profile by ID",
            inputSchema={
                "type": "object",
                "properties": {
                    "user_id": {"type": "integer", "description": "The user ID"}
                },
                "required": ["user_id"],
            },
        ),
        Tool(
            name="update_user",
            description="Update user profile",
            inputSchema={
                "type": "object",
                "properties": {
                    "user_id": {"type": "integer", "description": "The user ID"},
                    "data": {
                        "type": "object",
                        "description": "User data to update (email, first_name, last_name, etc.)",
                    },
                },
                "required": ["user_id", "data"],
            },
        ),
        # Form operations
        Tool(
            name="list_forms",
            description="List all forms",
            inputSchema={
                "type": "object",
                "properties": {},
            },
        ),
        Tool(
            name="create_form",
            description="Create a new form",
            inputSchema={
                "type": "object",
                "properties": {
                    "data": {
                        "type": "object",
                        "description": "Form data (name, description, fields, etc.)",
                    }
                },
                "required": ["data"],
            },
        ),
        Tool(
            name="get_form",
            description="Get form by ID",
            inputSchema={
                "type": "object",
                "properties": {
                    "form_id": {"type": "integer", "description": "The form ID"}
                },
                "required": ["form_id"],
            },
        ),
        Tool(
            name="update_form",
            description="Update form",
            inputSchema={
                "type": "object",
                "properties": {
                    "form_id": {"type": "integer", "description": "The form ID"},
                    "data": {
                        "type": "object",
                        "description": "Form data to update",
                    },
                },
                "required": ["form_id", "data"],
            },
        ),
        Tool(
            name="delete_form",
            description="Delete a form",
            inputSchema={
                "type": "object",
                "properties": {
                    "form_id": {"type": "integer", "description": "The form ID"}
                },
                "required": ["form_id"],
            },
        ),
        # Lead operations
        Tool(
            name="list_leads",
            description="List leads with optional filtering",
            inputSchema={
                "type": "object",
                "properties": {
                    "form_id": {
                        "type": "integer",
                        "description": "Optional form ID to filter leads",
                    }
                },
            },
        ),
        Tool(
            name="get_lead",
            description="Get lead by ID",
            inputSchema={
                "type": "object",
                "properties": {
                    "lead_id": {"type": "integer", "description": "The lead ID"}
                },
                "required": ["lead_id"],
            },
        ),
        Tool(
            name="create_lead",
            description="Create a new lead",
            inputSchema={
                "type": "object",
                "properties": {
                    "data": {
                        "type": "object",
                        "description": "Lead data (form_id, field values, etc.)",
                    }
                },
                "required": ["data"],
            },
        ),
        Tool(
            name="update_lead",
            description="Update lead data",
            inputSchema={
                "type": "object",
                "properties": {
                    "lead_id": {"type": "integer", "description": "The lead ID"},
                    "data": {
                        "type": "object",
                        "description": "Lead data to update",
                    },
                },
                "required": ["lead_id", "data"],
            },
        ),
        # Action operations
        Tool(
            name="list_actions",
            description="List all actions",
            inputSchema={
                "type": "object",
                "properties": {},
            },
        ),
        Tool(
            name="create_action",
            description="Create a new action",
            inputSchema={
                "type": "object",
                "properties": {
                    "data": {
                        "type": "object",
                        "description": "Action data (name, description, webhook_url, etc.)",
                    }
                },
                "required": ["data"],
            },
        ),
        Tool(
            name="get_action",
            description="Get action by ID",
            inputSchema={
                "type": "object",
                "properties": {
                    "action_id": {"type": "integer", "description": "The action ID"}
                },
                "required": ["action_id"],
            },
        ),
        Tool(
            name="update_action",
            description="Update action",
            inputSchema={
                "type": "object",
                "properties": {
                    "action_id": {"type": "integer", "description": "The action ID"},
                    "data": {
                        "type": "object",
                        "description": "Action data to update",
                    },
                },
                "required": ["action_id", "data"],
            },
        ),
        Tool(
            name="delete_action",
            description="Delete an action",
            inputSchema={
                "type": "object",
                "properties": {
                    "action_id": {"type": "integer", "description": "The action ID"}
                },
                "required": ["action_id"],
            },
        ),
        Tool(
            name="trigger_action",
            description="Trigger an action for a lead",
            inputSchema={
                "type": "object",
                "properties": {
                    "action_id": {"type": "integer", "description": "The action ID"},
                    "data": {
                        "type": "object",
                        "description": "Data to send with the action trigger",
                    },
                },
                "required": ["action_id", "data"],
            },
        ),
        # Goal operations
        Tool(
            name="list_goals",
            description="List all goals",
            inputSchema={
                "type": "object",
                "properties": {},
            },
        ),
        Tool(
            name="create_goal",
            description="Create a new goal",
            inputSchema={
                "type": "object",
                "properties": {
                    "data": {
                        "type": "object",
                        "description": "Goal data (name, description, etc.)",
                    }
                },
                "required": ["data"],
            },
        ),
        Tool(
            name="get_goal",
            description="Get goal by ID",
            inputSchema={
                "type": "object",
                "properties": {
                    "goal_id": {"type": "integer", "description": "The goal ID"}
                },
                "required": ["goal_id"],
            },
        ),
        Tool(
            name="update_goal",
            description="Update goal",
            inputSchema={
                "type": "object",
                "properties": {
                    "goal_id": {"type": "integer", "description": "The goal ID"},
                    "data": {
                        "type": "object",
                        "description": "Goal data to update",
                    },
                },
                "required": ["goal_id", "data"],
            },
        ),
        Tool(
            name="delete_goal",
            description="Delete a goal",
            inputSchema={
                "type": "object",
                "properties": {
                    "goal_id": {"type": "integer", "description": "The goal ID"}
                },
                "required": ["goal_id"],
            },
        ),
        # Scoring operations
        Tool(
            name="get_scoring_config",
            description="Get current scoring configuration",
            inputSchema={
                "type": "object",
                "properties": {},
            },
        ),
        Tool(
            name="update_scoring_config",
            description="Update scoring configuration",
            inputSchema={
                "type": "object",
                "properties": {
                    "data": {
                        "type": "object",
                        "description": "Scoring config data to update",
                    }
                },
                "required": ["data"],
            },
        ),
        Tool(
            name="calculate_lead_score",
            description="Calculate score for a lead",
            inputSchema={
                "type": "object",
                "properties": {
                    "lead_id": {"type": "integer", "description": "The lead ID"}
                },
                "required": ["lead_id"],
            },
        ),
        # Webhook operations
        Tool(
            name="get_webhook_deliveries",
            description="Get webhook delivery history for an action",
            inputSchema={
                "type": "object",
                "properties": {
                    "action_id": {"type": "integer", "description": "The action ID"}
                },
                "required": ["action_id"],
            },
        ),
        # Health check
        Tool(
            name="health_check",
            description="Check API health status",
            inputSchema={
                "type": "object",
                "properties": {},
            },
        ),
    ]


@server.list_tools()
async def list_tools() -> list[Tool]:
    """List all available tools"""
    return get_tools()


# ============================================================================
# SERVER STARTUP
# ============================================================================


async def main():
    """Main entry point - start the MCP server"""
    logger.info("Starting UserVision API MCP Server")
    logger.info(f"API Base URL: {state.base_url}")

    async with server:
        logger.info("MCP Server initialized and ready")
        logger.info("Available tools: authenticate, get_user, list_forms, create_form, etc.")
        logger.info("Use authenticate tool with API key to begin")

        # Keep server running
        while True:
            await asyncio.sleep(1)


if __name__ == "__main__":
    asyncio.run(main())
