# Quick Start Guide

## 🚀 5-Minute Setup

### Option 1: Docker (Recommended)

```bash
# Start both FastAPI and PostgreSQL
docker-compose -f api/docker/docker-compose.yml up -d

# Check logs
docker-compose -f api/docker/docker-compose.yml logs -f fastapi

# API ready at http://localhost:8000
# Docs at http://localhost:8000/docs
```

### Option 2: Local Development

```bash
# Navigate to API folder
cd api

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Setup environment
cp .env.example .env
# Edit .env with your database URL

# Run database migrations (Alembic)
alembic upgrade head

# Start server
uvicorn main:app --reload

# API ready at http://localhost:8000
```

---

## 📝 Quick API Test

### 1. Register a User

```bash
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "username": "john_doe",
    "password": "SecurePass123",
    "first_name": "John",
    "last_name": "Doe"
  }'
```

**Response:**
```json
{
  "id": 1,
  "email": "user@example.com",
  "username": "john_doe",
  "first_name": "John",
  "last_name": "Doe",
  "role": "user",
  "is_active": true,
  "lead_score": 0,
  "metadata": {},
  "created_at": "2024-01-01T00:00:00",
  "updated_at": "2024-01-01T00:00:00"
}
```

### 2. Login

```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=john_doe&password=SecurePass123"
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

### 3. Get Current User (Protected)

```bash
curl -X GET http://localhost:8000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

### 4. Create a Scoring Rule (Admin Only)

First, you need to make the user an admin. Connect to the database:

```bash
# Using docker
docker-compose -f api/docker/docker-compose.yml exec postgres psql -U postgres -d registration_db

# Update user role to admin
UPDATE users SET role = 'admin' WHERE id = 1;
```

Then create scoring rule:

```bash
curl -X POST http://localhost:8000/api/v1/scoring/rules \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "field_key": "email_verified",
    "operator": "equals",
    "value": "true",
    "points": 20
  }'
```

### 5. Log an Event (Triggers Scoring)

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

### 6. Check Updated Lead Score

```bash
curl -X GET http://localhost:8000/api/v1/users/1 \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    FastAPI Application                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   /auth      │  │   /users     │  │   /scoring   │     │
│  │ ├ register   │  │ ├ GET        │  │ ├ GET rules  │     │
│  │ ├ login      │  │ ├ PUT        │  │ ├ POST rules │     │
│  │ └ me         │  │ └ PUT admin  │  │ └ recalc     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐                        │
│  │  /webhooks   │  │   /flows     │                        │
│  │ ├ events     │  │ ├ start      │                        │
│  │ └ n8n        │  │ └ complete   │                        │
│  └──────────────┘  └──────────────┘                        │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                  Core Modules                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────────────┐ │
│  │ Security │  │ Database │  │  Scoring Logic Service   │ │
│  │ JWT/OAuth2   │ Async    │  │  - evaluate_rule()     │ │
│  │            │  │ Sessions │  │  - calculate_score()   │ │
│  └──────────┘  └──────────┘  └──────────────────────────┘ │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                  Database Models                           │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────────────┐ │
│  │   User   │  │ ScoringRule  │  │    EventLog         │ │
│  │ id       │  │ id           │  │ id                  │ │
│  │ email    │  │ field_key    │  │ user_id (FK)        │ │
│  │ username │  │ operator     │  │ event_type          │ │
│  │ password │  │ value        │  │ event_data          │ │
│  │ role     │  │ points       │  │ created_at          │ │
│  │ lead_score   │ is_active    │  │                    │ │
│  │ metadata │  │ timestamps   │  │ timestamps          │ │
│  └──────────┘  └──────────────┘  └──────────────────────┘ │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ (PostgreSQL 15)
                            ▼
                    ┌──────────────────┐
                    │  PostgreSQL 15   │
                    │  registration_db │
                    │  (Docker)        │
                    └──────────────────┘
```

---

## 🔐 Authentication Flow

```
1. User Registration
   POST /auth/register
   └─> Hash password with bcrypt
   └─> Store in users table
   └─> Return user object

2. User Login
   POST /auth/login
   └─> Verify email/username exists
   └─> Verify password (bcrypt compare)
   └─> Create JWT tokens (access + refresh)
   └─> Return tokens

3. Protected Requests
   GET /users/1 (Authorization: Bearer TOKEN)
   └─> Verify JWT signature
   └─> Check token expiry
   └─> Lookup user in database
   └─> Check is_active flag
   └─> Proceed if all valid
```

---

## 🎯 Scoring Flow

```
1. Event is logged
   POST /webhooks/events
   {
     "user_id": 1,
     "event_type": "form_step_1_complete",
     "event_data": {...}
   }

2. Event stored in event_logs table

3. Scoring engine triggers
   calculate_user_score(user_id)
   
4. For each ScoringRule:
   └─> Get rule.field_key from user.metadata
   └─> Evaluate condition using rule.operator
   └─> If matches, add rule.points to total
   
5. Update user.lead_score = total

6. Return new score to client
```

---

## 📊 Example Scoring Scenario

**Scoring Rules Setup:**
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

**User Metadata:**
```json
{
  "form_step_1_complete": "true",
  "email_verified": "true",
  "profile_completed": "false"
}
```

**Calculation:**
```
Rule 1: form_step_1_complete == "true" ✓ +15
Rule 2: email_verified == "true" ✓ +20
Rule 3: profile_completed == "true" ✗ +0
─────────────────────────────────────
Total Score: 35
```

---

## 🔧 Development Commands

### Database Migrations (Alembic)

```bash
# Run all pending migrations
alembic upgrade head

# Create a new migration (after model changes)
alembic revision --autogenerate -m "Description of changes"

# View migration history
alembic history

# Downgrade to specific revision
alembic downgrade <revision_id>
```

### API Development

```bash
# View API documentation
open http://localhost:8000/docs

# Run tests
pytest
pytest -v --cov=api

# Format code
black api/

# Check types
mypy api/

# View database (SQLite)
sqlite3 test.db

# View database (Docker PostgreSQL)
docker-compose -f api/docker/docker-compose.yml exec postgres psql -U postgres -d registration_db

# View server logs
docker-compose -f api/docker/docker-compose.yml logs -f fastapi

# Stop all containers
docker-compose -f api/docker/docker-compose.yml down

# Stop and clean volumes
docker-compose -f api/docker/docker-compose.yml down -v
```

---

## 📖 Useful Documentation

- **Full README**: See `README.md`
- **Implementation Details**: See `IMPLEMENTATION.md`
- **Project Structure**: See `PROJECT_STRUCTURE.md`
- **API Docs**: http://localhost:8000/docs (Swagger UI)
- **ReDoc**: http://localhost:8000/redoc

---

## ✅ Health Checks

```bash
# Check API is running
curl http://localhost:8000/api/v1/health

# Check database connection
docker-compose -f api/docker/docker-compose.yml ps
```

---

## 🆘 Troubleshooting

### Port 8000 already in use
```bash
# Change port in docker-compose.yml or .env
# Or kill existing process
lsof -ti:8000 | xargs kill -9
```

### Database connection error
```bash
# Check PostgreSQL is running
docker-compose -f api/docker/docker-compose.yml ps

# View database logs
docker-compose -f api/docker/docker-compose.yml logs postgres

# Ensure .env has correct DATABASE_URL
cat .env | grep DATABASE_URL
```

### Token errors
```bash
# Verify SECRET_KEY is set
cat .env | grep SECRET_KEY

# Token must be Bearer format
Authorization: Bearer <token_without_"Bearer"_prefix>
```

---

## 🎓 Next Steps

1. **Read the docs**: Check `README.md` for full documentation
2. **Implement flows**: Complete the `/api/v1/flows` endpoints
3. **Add tests**: Create pytest test suite
4. **Deploy**: Use Docker image for production
