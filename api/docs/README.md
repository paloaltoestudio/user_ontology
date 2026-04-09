# SaaS Registration Engine - FastAPI Backend

A headless FastAPI backend for managing user registration, authentication, and lead scoring in SaaS applications.

## Features

- **JWT-based Authentication**: OAuth2 with access and refresh tokens
- **User Management**: User registration, profile updates, role-based access control
- **Async Database**: PostgreSQL with SQLAlchemy 2.0 async support
- **Lead Scoring**: Dynamic scoring rules that calculate user lead scores based on metadata
- **Event Logging**: Track user milestones and registration steps
- **n8n Integration**: Webhook support for workflow orchestration
- **CORS Support**: Pre-configured for React Vite frontend at localhost:5173

## Tech Stack

- **Framework**: FastAPI 0.104+
- **Database**: PostgreSQL 15 + SQLAlchemy 2.0 (async)
- **Authentication**: JWT (python-jose) + Passlib (bcrypt)
- **Validation**: Pydantic v2
- **Container**: Docker + Docker Compose

## Project Structure

```
/app
  /api/v1
    /endpoints
      - auth.py         # User registration and login
      - users.py        # User management
      - flows.py        # Registration flows
      - scoring.py      # Scoring rules and calculations
      - webhooks.py     # Event logging and n8n webhooks
  /core
    - config.py         # Configuration management
    - security.py       # JWT and authentication logic
    - database.py       # Database connection setup
  /models
    - user.py           # User ORM model
    - scoring_rule.py   # Scoring rules ORM model
    - event_log.py      # Event logging ORM model
  /schemas
    - user.py           # User Pydantic schemas
    - scoring_rule.py   # Scoring rule Pydantic schemas
    - event_log.py      # Event log Pydantic schemas
  /services
    - scoring_logic.py  # Scoring calculation service
    - n8n_client.py     # n8n webhook client
  - main.py             # FastAPI application factory
/docker
  - Dockerfile
  - docker-compose.yml
/migrations
  - Alembic migration files (TBD)
```

## Getting Started

### Prerequisites

- Python 3.11+
- PostgreSQL 15+
- Docker & Docker Compose (optional)

### Local Development Setup

1. **Clone and navigate to project**
   ```bash
   cd onboarding_app
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. **Run migrations** (TBD - Alembic setup)
   ```bash
   alembic upgrade head
   ```

6. **Start development server**
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

   API will be available at `http://localhost:8000`
   - Docs: `http://localhost:8000/docs`
   - ReDoc: `http://localhost:8000/redoc`

### Docker Compose Setup

```bash
docker-compose -f api/docker/docker-compose.yml up -d
```

This will start:
- FastAPI application on `http://localhost:8000`
- PostgreSQL database on `localhost:5432`

Monitor logs:
```bash
docker-compose -f api/docker/docker-compose.yml logs -f fastapi
```

Stop services:
```bash
docker-compose -f api/docker/docker-compose.yml down
```

## API Endpoints

### Authentication

```
POST   /api/v1/auth/register          Register new user
POST   /api/v1/auth/login             Login with credentials
GET    /api/v1/auth/me                Get current user info
```

### Users

```
GET    /api/v1/users/{user_id}        Get user profile
PUT    /api/v1/users/{user_id}        Update user profile
PUT    /api/v1/users/admin/{user_id}  Admin: Update any user
```

### Scoring

```
GET    /api/v1/scoring/rules          Get all scoring rules
POST   /api/v1/scoring/rules          Create scoring rule
PUT    /api/v1/scoring/rules/{id}     Update scoring rule
POST   /api/v1/scoring/recalculate/{user_id}   Recalculate user score
POST   /api/v1/scoring/recalculate-all         Recalculate all scores
```

### Flows

```
POST   /api/v1/flows/start/{flow_id}      Start registration flow
POST   /api/v1/flows/complete/{flow_id}   Complete flow step
```

### Webhooks

```
POST   /api/v1/webhooks/events            Log event and recalculate score
POST   /api/v1/webhooks/n8n/{workflow_id} Handle n8n workflow callbacks
```

## Authentication

All protected endpoints require a JWT token in the `Authorization` header:

```
Authorization: Bearer <access_token>
```

### Getting a Token

1. Register a new user:
   ```bash
   curl -X POST http://localhost:8000/api/v1/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "email": "user@example.com",
       "username": "john_doe",
       "password": "SecurePassword123",
       "first_name": "John",
       "last_name": "Doe"
     }'
   ```

2. Login to get tokens:
   ```bash
   curl -X POST http://localhost:8000/api/v1/auth/login \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "username=john_doe&password=SecurePassword123"
   ```

3. Use access token in requests:
   ```bash
   curl -X GET http://localhost:8000/api/v1/auth/me \
     -H "Authorization: Bearer <access_token>"
   ```

## Scoring Logic

The scoring engine evaluates user lead score based on configurable rules:

### Scoring Rules

Rules match against user metadata using field comparisons:

```json
{
  "field_key": "email_verified",
  "operator": "equals",
  "value": "true",
  "points": 10
}
```

### Supported Operators

- `equals`: Exact match (case-insensitive)
- `contains`: Substring match
- `greater_than`: Numeric comparison
- `less_than`: Numeric comparison
- `greater_than_or_equal`: Numeric comparison
- `less_than_or_equal`: Numeric comparison
- `exists`: Check if field exists

### Example Scoring Rules

```json
[
  {
    "field_key": "form_step_1_complete",
    "operator": "equals",
    "value": "true",
    "points": 15
  },
  {
    "field_key": "email_verified",
    "operator": "equals",
    "value": "true",
    "points": 20
  },
  {
    "field_key": "profile_completed",
    "operator": "equals",
    "value": "true",
    "points": 25
  }
]
```

## Event Logging

Events are logged via webhook and trigger automatic score recalculation:

```bash
curl -X POST http://localhost:8000/api/v1/webhooks/events \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "event_type": "form_step_1_complete",
    "event_data": {
      "step": 1,
      "timestamp": "2024-01-01T00:00:00Z"
    }
  }'
```

## Role-Based Access Control

### User Roles

- `user`: Regular user (default)
- `admin`: Administrator with full access

### Protected Endpoints by Role

- `/api/v1/scoring/*` - Admin only
- `/api/v1/users/admin/*` - Admin only
- All other user endpoints - Own profile or Admin

## n8n Integration

Send events to n8n for workflow orchestration:

```python
from api.services.n8n_client import N8NClient

n8n = N8NClient()
await n8n.send_event(
    event_type="user_registered",
    user_id=1,
    event_data={"email": "user@example.com"}
)
```

## Development

### Running Tests

```bash
pytest
pytest -v                    # Verbose
pytest --cov=app           # With coverage
```

### Code Quality

Format code:
```bash
black api/
```

Lint code:
```bash
flake8 app/
mypy api/  # Type checking
```

## Database Migrations

Using Alembic for schema management:

```bash
# Create migration
alembic revision --autogenerate -m "Add new field"

# Apply migrations
alembic upgrade head

# Rollback
alembic downgrade -1
```

## Environment Variables

See `.env.example` for all available configuration options.

Key variables:
- `DATABASE_URL`: PostgreSQL connection string
- `SECRET_KEY`: JWT signing key (generate with `openssl rand -hex 32`)
- `ACCESS_TOKEN_EXPIRE_MINUTES`: JWT token expiry
- `CORS_ORIGINS`: Allowed frontend origins
- `N8N_WEBHOOK_URL`: n8n webhook endpoint

## Security Considerations

1. **JWT Secret**: Generate a secure secret in production:
   ```bash
   openssl rand -hex 32
   ```

2. **Password Hashing**: Uses bcrypt with automatic salt
3. **CORS**: Restrict to trusted origins only
4. **HTTPS**: Use HTTPS in production
5. **Token Expiry**: Configure appropriate token lifetimes

## Troubleshooting

### Database Connection Issues

```bash
# Test PostgreSQL connection
psql postgresql://postgres:postgres@localhost:5432/registration_db

# Check Docker container logs
docker-compose -f api/docker/docker-compose.yml logs postgres
```

### Port Already in Use

Change ports in `.env` or `docker-compose.yml`

### Missing Dependencies

Reinstall requirements:
```bash
pip install --upgrade -r requirements.txt
```

## Next Steps

- [ ] Set up Alembic migrations
- [ ] Implement registration flow endpoints
- [ ] Add comprehensive test suite
- [ ] Set up CI/CD pipeline
- [ ] Add request rate limiting
- [ ] Implement email verification
- [ ] Add password reset functionality
- [ ] Expand n8n integration examples

## License

Proprietary - SaaS Registration Engine

## Support

For issues or questions, check the API documentation at `/docs` endpoint.
