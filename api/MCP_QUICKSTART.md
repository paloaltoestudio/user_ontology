# MCP Server - Quick Start Guide

Get the MCP server up and running in 5 minutes.

## Prerequisites

- FastAPI API is running (port 8000)
- Python 3.11+
- Dependencies installed: `pip install -r requirements.txt`

## Step 1: Start FastAPI (with Integrated MCP)

```bash
cd api
uvicorn main:app --reload
```

Expected output:
```
INFO:     Started server process [12345]
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:root:✓ MCP Server started successfully (PID: 12346)
  → MCP tools are available to n8n, Claude, and other MCP clients
  → API Base URL: http://localhost:8000
```

**That's it!** Both FastAPI API and MCP server are now running in a single process.

## Step 2: Get an API Key

### Option A: Create via Admin Panel
1. Log into your admin UI
2. Go to Settings → API Keys
3. Create new key (e.g., name: "MCP Integration")
4. Copy the key (looks like: `sk_abc123xyz...`)

### Option B: Create via Database
```sql
-- Replace with actual values
INSERT INTO api_keys (key, name, description, scopes, is_active, created_by)
VALUES (
  'sk_test_' || substr(md5(random()::text), 1, 32),
  'MCP Server',
  'MCP integration for n8n',
  '[]',
  true,
  1
);
```

## Step 3: Test the MCP Server

### Using curl/HTTP (if your client supports it):

```bash
# Authenticate
curl -X POST http://localhost:8001/authenticate \
  -H "Content-Type: application/json" \
  -d '{"api_key": "sk_your_key_here"}'

# List forms
curl http://localhost:8001/api/v1/forms \
  -H "X-API-Key: sk_your_key_here"
```

### Using Python:

```python
import asyncio
from api.mcp_server import MCPServerState

async def test():
    state = MCPServerState()
    
    # Authenticate
    is_valid = await state.authenticate_api_key("sk_your_key_here")
    print(f"Authenticated: {is_valid}")
    
    if is_valid:
        state.api_key = "sk_your_key_here"
        
        # List forms
        result = await state.make_request("GET", "/api/v1/forms")
        print(f"Forms: {result}")

asyncio.run(test())
```

## Step 4: Connect from n8n

In n8n, add an HTTP Request node:

1. **Method**: POST
2. **URL**: `http://localhost:8001/call/authenticate`
3. **Body**:
```json
{
  "api_key": "sk_your_key_here"
}
```

Then use other tools with the authenticated state:

```json
{
  "tool": "list_forms"
}
```

## Common Operations

### List all forms
```
Tool: list_forms
Parameters: {}
```

### Create a lead
```
Tool: create_lead
Parameters: {
  "data": {
    "form_id": 1,
    "field_values": {
      "email": "user@example.com",
      "name": "John Doe"
    }
  }
}
```

### Update a lead
```
Tool: update_lead
Parameters: {
  "lead_id": 1,
  "data": {
    "field_values": {
      "status": "qualified"
    }
  }
}
```

### Trigger an action
```
Tool: trigger_action
Parameters: {
  "action_id": 1,
  "data": {
    "lead_id": 1,
    "custom_field": "value"
  }
}
```

## Troubleshooting

### "Connection refused"
```
✓ FastAPI running? Check: curl http://localhost:8000/api/v1/health
✓ MCP server running? Check terminal 2
✓ Firewall blocking? Check network settings
```

### "Invalid API key"
```
✓ Key exists? Check admin panel or database
✓ Correct spelling? Copy paste from admin panel
✓ Key active? Check is_active = true in database
```

### "Not authenticated"
```
✓ Call authenticate tool first
✓ Use returned session token in subsequent requests
✓ Check logs for authentication errors
```

## Next Steps

1. **Read Full Docs**: See [MCP_README.md](MCP_README.md)
2. **Explore Tools**: Use `list_tools()` to see all available operations
3. **Build Integration**: Create n8n workflows using MCP tools
4. **Monitor Usage**: Check API key last_used_at in admin panel
5. **Manage Scopes**: Assign scopes to keys for security

## Architecture Diagram

```
┌─────────────────────┐
│  Your n8n/Agent     │
└──────────┬──────────┘
           │ (MCP Protocol)
┌──────────▼──────────┐
│   MCP Server        │ ← You are here
│ (mcp_server.py)     │
└──────────┬──────────┘
           │ (HTTP + API Key)
┌──────────▼──────────┐
│   FastAPI App       │
│ (main.py)           │
└──────────┬──────────┘
           │ (SQLAlchemy)
┌──────────▼──────────┐
│    PostgreSQL       │
└─────────────────────┘
```

## Example n8n Workflow

```
Start
  ↓
[HTTP] Authenticate with API key
  ↓
[IF] Success?
  ├─ Yes → [MCP] List Forms
  │         ↓
  │        [Loop] For each form
  │         ↓
  │        [MCP] Get form details
  │         ↓
  │        [MCP] Count leads for form
  │         ↓
  │        [SEND] Slack message
  │
  └─ No → [ERROR] Log authentication failure
```

## Support

- Check logs: Look at terminal output
- Read docs: See [MCP_README.md](MCP_README.md)
- Test API: Verify endpoints work with `curl` or Postman
- Database: Check API keys table for issues

---

**Ready?** Start with Step 1 above! 🚀
