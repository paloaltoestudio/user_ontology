# UserVision API - MCP Server

The MCP (Model Context Protocol) Server exposes your UserVision API as a set of tools that can be used by any AI agent, n8n workflow, or external system compatible with MCP.

## Features

- **Agent-Agnostic**: Works with Claude, n8n, custom agents, or any system that supports MCP
- **API Key Authentication**: Secure authentication using the existing API key system
- **All Endpoints Exposed**: CRUD operations for users, forms, leads, actions, goals, scoring, and webhooks
- **Resources & Tools**: Both tool-based operations and resource discovery
- **Async/Await**: Full async support for optimal performance

## Installation

### 1. Install MCP Package

The `mcp` package has already been added to `requirements.txt`. Install dependencies:

```bash
cd api
pip install -r requirements.txt
```

### 2. Ensure Your FastAPI API is Running

The MCP server communicates with your FastAPI backend via HTTP:

```bash
# In one terminal, start your FastAPI app
cd api
uvicorn main:app --reload --port 8000
```

## Running the MCP Server

### Option 1: Direct Python Execution

```bash
# In another terminal, start the MCP server
cd api
python mcp_server.py
```

### Option 2: As a Module Import

You can also import and run it from your FastAPI app or another service:

```python
from mcp_server import server, main
import asyncio

asyncio.run(main())
```

## Getting Started with the MCP Server

### Step 1: Create an API Key

Use your admin credentials to create an API key for the MCP server:

```bash
# Make a request to your API (via admin panel or API call)
# This creates a key like: sk_abc123xyz...
```

Or via database:
```sql
INSERT INTO api_keys (key, name, description, scopes, is_active, created_by)
VALUES (
  'sk_test_' || substr(md5(random()::text), 1, 32),
  'MCP Server Integration',
  'API key for MCP server and n8n agents',
  '[]',
  true,
  1
);
```

### Step 2: Connect from n8n

In your n8n workflow, configure the MCP server connection:

1. **MCP Connection Details**:
   - **Host**: `localhost` (or your server address)
   - **Port**: Configured in MCP server startup

2. **Authentication**:
   - Use the `authenticate` tool with your API key first
   - Example: `{"api_key": "sk_test_xxxxx"}`

### Step 3: Use Tools in Your Workflow

Example n8n workflow using the MCP server:

```json
{
  "nodes": [
    {
      "name": "Authenticate MCP",
      "type": "mcp",
      "action": "authenticate",
      "parameters": {
        "api_key": "sk_test_xxxxx"
      }
    },
    {
      "name": "List Forms",
      "type": "mcp",
      "action": "list_forms",
      "parameters": {}
    },
    {
      "name": "Create Lead",
      "type": "mcp",
      "action": "create_lead",
      "parameters": {
        "data": {
          "form_id": 1,
          "field_values": {
            "email": "user@example.com",
            "name": "John Doe"
          }
        }
      }
    }
  ]
}
```

## Available Tools

### Authentication
- **authenticate** - Authenticate with API key (required before other operations)

### Users
- **get_user** - Get user profile
- **update_user** - Update user profile

### Forms
- **list_forms** - List all forms
- **create_form** - Create new form
- **get_form** - Get form by ID
- **update_form** - Update form
- **delete_form** - Delete form

### Leads
- **list_leads** - List leads (with optional form_id filter)
- **get_lead** - Get lead by ID
- **create_lead** - Create new lead
- **update_lead** - Update lead

### Actions
- **list_actions** - List all actions
- **create_action** - Create new action
- **get_action** - Get action by ID
- **update_action** - Update action
- **delete_action** - Delete action
- **trigger_action** - Trigger action for a lead

### Goals
- **list_goals** - List all goals
- **create_goal** - Create new goal
- **get_goal** - Get goal by ID
- **update_goal** - Update goal
- **delete_goal** - Delete goal

### Scoring
- **get_scoring_config** - Get scoring configuration
- **update_scoring_config** - Update scoring configuration
- **calculate_lead_score** - Calculate score for a lead

### Webhooks
- **get_webhook_deliveries** - Get webhook delivery history

### Health
- **health_check** - Check API health

## Configuration

The MCP server reads configuration from your FastAPI settings:

- **Base URL**: Automatically constructed from `settings.PORT` or defaults to `http://localhost:8000`
- **Database**: Uses the same SQLAlchemy session as FastAPI
- **Logging**: Configured at INFO level

To customize:

```python
# In mcp_server.py, modify MCPServerState.__init__()
self.base_url = "http://your-api-server:port"
```

## Example: Using with Claude

If you're using Claude with MCP:

```python
# In Claude Code or a custom integration
from mcp_server import server

# Connect to the server
async with server:
    # Use tools like:
    # - authenticate(api_key="sk_xxx")
    # - list_forms()
    # - create_lead(data={...})
```

## Example: Using with Custom Python Agent

```python
import asyncio
from mcp_server import server, MCPServerState

async def run_agent():
    state = MCPServerState()
    
    # Authenticate
    is_valid = await state.authenticate_api_key("sk_test_xxxxx")
    if not is_valid:
        raise ValueError("Invalid API key")
    
    # Make requests
    forms = await state.make_request("GET", "/api/v1/forms")
    print(f"Found {len(forms['data'])} forms")
    
    # Create a lead
    result = await state.make_request(
        "POST",
        "/api/v1/leads",
        json_data={
            "form_id": 1,
            "field_values": {"email": "test@example.com"}
        }
    )
    print(f"Created lead: {result['data']}")

asyncio.run(run_agent())
```

## Troubleshooting

### "Could not connect to API"
- Ensure FastAPI server is running on the configured port
- Check `state.base_url` is correct
- Verify network connectivity

### "Invalid API key"
- Create a new API key in the admin panel
- Ensure the key is marked as `is_active = true`
- Verify you're using the correct key value (with `sk_` prefix if applicable)

### "Not authenticated"
- Call the `authenticate` tool first with your API key
- Store the authenticated state between operations

### Database Connection Issues
- Ensure SQLAlchemy is properly initialized
- Check database credentials in `core/config.py`
- Verify database is running and accessible

## Security Considerations

1. **API Keys**: Keep API keys secure and rotate regularly
2. **Scopes**: Assign minimal necessary scopes to each key
3. **HTTPS**: Use HTTPS in production
4. **Network**: Run on secure internal networks or with VPN
5. **Audit**: Monitor API key usage via the admin panel

## Integration Examples

### n8n with MCP Node
```
MCP Server Connection
├── Host: localhost
├── Port: 8000
└── Auth: API Key

Workflow:
1. Authenticate with API key
2. List all forms
3. For each form, count leads
4. Generate report
```

### Custom Python Automation
```python
async def import_leads_from_csv():
    await state.authenticate_api_key("sk_xxx")
    
    for row in csv_reader:
        await state.make_request("POST", "/api/v1/leads", json_data=row)
```

### Zapier Integration (Future)
```
Trigger: New Lead in Form
↓
Action: Call MCP Server
├── Tool: create_lead
├── API Key: sk_xxx
└── Data: Mapped from Zapier fields
```

## Production Deployment

For production use:

1. **Environment Variables**: Store API keys in environment variables
   ```bash
   export USERVISION_MCP_API_KEY="sk_prod_xxxxx"
   ```

2. **Systemd Service**: Create a systemd service for auto-start
   ```ini
   [Service]
   ExecStart=/usr/bin/python3 /path/to/api/mcp_server.py
   Restart=always
   ```

3. **Docker**: Run in container
   ```dockerfile
   FROM python:3.11
   WORKDIR /app
   COPY api/requirements.txt .
   RUN pip install -r requirements.txt
   COPY api .
   CMD ["python", "mcp_server.py"]
   ```

4. **Monitoring**: Track MCP server health
   - Use `health_check` tool periodically
   - Monitor logs for errors
   - Alert on authentication failures

## Support & Troubleshooting

For issues or questions:
1. Check logs: Look in the MCP server terminal output
2. Verify API: Test endpoints directly with curl/Postman
3. Check authentication: Ensure API key is valid and active
4. Review configuration: Verify base URL and database connection

## Architecture

```
┌─────────────────────────────────────┐
│  External System / Agent / n8n      │
├─────────────────────────────────────┤
│         MCP Protocol (stdio)         │
├─────────────────────────────────────┤
│    MCP Server (mcp_server.py)       │
├─────────────────────────────────────┤
│   HTTP Requests (with API Key)      │
├─────────────────────────────────────┤
│    FastAPI Application              │
├─────────────────────────────────────┤
│    Database (PostgreSQL)            │
└─────────────────────────────────────┘
```

## Future Enhancements

- [ ] WebSocket support for real-time updates
- [ ] Batch operations for bulk create/update
- [ ] Advanced filtering and search capabilities
- [ ] Rate limiting and quota management
- [ ] Webhook callbacks to external systems
- [ ] Streaming responses for large datasets
