# Project Structure

```
onboarding_app/
│
├── README.md                           # Main project documentation
├── IMPLEMENTATION.md                   # Detailed implementation guide
├── PROJECT_STRUCTURE.md               # This file
├── requirements.txt                    # Python dependencies
├── .env.example                        # Environment template
├── .gitignore                          # Git ignore rules
│
├── app/                               # Main application package
│   ├── __init__.py
│   ├── main.py                        # FastAPI application factory
│   │
│   ├── core/                          # Core application modules
│   │   ├── __init__.py
│   │   ├── config.py                  # Settings & configuration
│   │   ├── database.py                # Database setup & session
│   │   └── security.py                # JWT & authentication logic ⭐
│   │
│   ├── models/                        # SQLAlchemy ORM models
│   │   ├── __init__.py
│   │   ├── user.py                    # User model with role & lead_score ⭐
│   │   ├── scoring_rule.py            # ScoringRule model ⭐
│   │   └── event_log.py               # EventLog model ⭐
│   │
│   ├── schemas/                       # Pydantic validation schemas
│   │   ├── __init__.py
│   │   ├── user.py                    # User request/response schemas
│   │   ├── scoring_rule.py            # ScoringRule schemas
│   │   └── event_log.py               # EventLog schemas
│   │
│   ├── services/                      # Business logic services
│   │   ├── __init__.py
│   │   ├── scoring_logic.py           # Scoring calculation service ⭐
│   │   └── n8n_client.py              # n8n webhook client
│   │
│   └── api/                           # API routes & endpoints
│       ├── __init__.py
│       └── v1/
│           ├── __init__.py
│           └── endpoints/
│               ├── __init__.py
│               ├── auth.py             # User registration & login
│               ├── users.py            # User management
│               ├── flows.py            # Registration flows (stub)
│               ├── scoring.py          # Scoring rules management
│               └── webhooks.py         # Event & n8n webhooks
│
├── docker/                            # Docker configuration
│   ├── Dockerfile                     # FastAPI app container
│   └── docker-compose.yml             # Multi-container setup
│
└── migrations/                        # Alembic migrations (TBD)
    └── (migration files will go here)

⭐ = Core components requested in specification
```

## Quick Reference

### Core Security Module: `app/core/security.py`
- **Functions**: 
  - `hash_password()` - Bcrypt hashing
  - `verify_password()` - Password verification
  - `create_access_token()` - JWT token creation
  - `create_refresh_token()` - Refresh token creation
- **Dependencies**:
  - `get_current_user()` - OAuth2 + DB lookup + active check
  - `get_current_admin()` - Role-based admin check

### User Model: `app/models/user.py`
- **Key Fields**:
  - `id`, `email`, `username` (unique)
  - `hashed_password`
  - `role` (Enum: admin, user)
  - `is_active` (Boolean)
  - `lead_score` (Integer) ⭐
  - `metadata` (JSON for scoring data)
  - `created_at`, `updated_at`

### Scoring Rule Model: `app/models/scoring_rule.py`
- **Key Fields**:
  - `field_key` (String) - metadata field to evaluate
  - `operator` (String) - comparison type
  - `value` (String) - expected value
  - `points` (Integer) - award when matches
  - `is_active` (Integer)

### Event Log Model: `app/models/event_log.py`
- **Key Fields**:
  - `user_id` (ForeignKey to User)
  - `event_type` (String) - e.g., "form_step_1_complete"
  - `event_data` (JSON) - event metadata
  - `created_at` (DateTime)

### Scoring Service: `app/services/scoring_logic.py`
- **Main Function**: `calculate_user_score(user_id, db)`
  - Fetches active ScoringRules
  - Evaluates rules against user.metadata
  - Sums matching points
  - Updates user.lead_score
- **Operators Supported**: equals, contains, greater_than, less_than, exists, etc.

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  username VARCHAR(100) UNIQUE,
  hashed_password VARCHAR(255),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  role ENUM ('admin', 'user'),
  is_active BOOLEAN DEFAULT TRUE,
  lead_score INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Scoring Rules Table
```sql
CREATE TABLE scoring_rules (
  id SERIAL PRIMARY KEY,
  field_key VARCHAR(255),
  operator VARCHAR(50),
  value VARCHAR(255),
  points INTEGER,
  is_active INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Event Logs Table
```sql
CREATE TABLE event_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  event_type VARCHAR(255),
  event_data JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);
```

## API Endpoints Overview

### `/api/v1/auth`
- `POST /register` - Register new user
- `POST /login` - Get JWT tokens
- `GET /me` - Get current user (protected)

### `/api/v1/users`
- `GET /{user_id}` - Get user (protected)
- `PUT /{user_id}` - Update user (protected)
- `PUT /admin/{user_id}` - Admin update (admin only)

### `/api/v1/scoring`
- `GET /rules` - List rules (admin only)
- `POST /rules` - Create rule (admin only)
- `PUT /rules/{id}` - Update rule (admin only)
- `POST /recalculate/{user_id}` - Recalc score (admin only)
- `POST /recalculate-all` - Batch recalc (admin only)

### `/api/v1/flows`
- `POST /start/{flow_id}` - Start flow
- `POST /complete/{flow_id}` - Complete flow step

### `/api/v1/webhooks`
- `POST /events` - Log event + recalculate score
- `POST /n8n/{workflow_id}` - Handle n8n callback

## Tech Stack Summary

| Component | Technology | Version |
|-----------|-----------|---------|
| Framework | FastAPI | 0.104.1 |
| Database | PostgreSQL | 15 |
| ORM | SQLAlchemy | 2.0.23 |
| Async Driver | asyncpg | latest |
| Validation | Pydantic | 2.5.0 |
| Authentication | python-jose | 3.3.0 |
| Password Hash | passlib+bcrypt | 1.7.4 |
| Server | Uvicorn | 0.24.0 |
| Container | Docker | Compose v3.8 |

## Getting Started

1. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   ```

3. **Start with Docker**
   ```bash
   docker-compose -f api/docker/docker-compose.yml up -d
   ```

4. **Access API**
   - Main: http://localhost:8000
   - Docs: http://localhost:8000/docs
   - ReDoc: http://localhost:8000/redoc

## Files Status

✅ **Implemented**
- Core configuration (config.py)
- Database setup (database.py)
- Security & JWT (security.py)
- User model & schema
- ScoringRule model & schema
- EventLog model & schema
- Scoring logic service
- n8n client
- Authentication endpoints
- User management endpoints
- Scoring management endpoints
- Event webhook endpoints
- Docker setup

📝 **To Implement**
- Alembic migrations
- Flow endpoints (complete implementation)
- Comprehensive tests
- Rate limiting
- Email verification
- Password reset
- Advanced n8n integration

## Notes

- All models use async/await pattern
- Database connections are pooled
- JWT tokens expire after configured duration
- Scoring rules are evaluated on event webhook
- CORS configured for React Vite (localhost:5173)
- Health check available at `/api/v1/health`
- Swagger docs auto-generated at `/docs`
