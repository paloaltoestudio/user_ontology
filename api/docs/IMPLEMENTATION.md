# Implementation Guide

## Core Components Implemented

### 1. Security Module (`app/core/security.py`)

#### Key Functions

**Password Management**
- `hash_password(password: str) -> str`: Hashes password using bcrypt
- `verify_password(plain: str, hashed: str) -> bool`: Verifies plain password against hash

**JWT Token Management**
- `create_access_token(data: dict, expires_delta: timedelta) -> str`
  - Default expiry: 30 minutes (configurable)
  - Payload includes: `sub` (user_id), `exp`, `iat`, `role`
  
- `create_refresh_token(data: dict) -> str`
  - Default expiry: 7 days (configurable)
  - Used for obtaining new access tokens

**Security Dependencies**
- `get_current_user(token, db) -> User`
  - Verifies JWT token
  - Fetches user from database
  - Checks user is active
  - Raises HTTPException (401) if invalid
  
- `get_current_admin(user) -> User`
  - Wraps `get_current_user`
  - Verifies user role is "admin"
  - Raises HTTPException (403) if not admin

**OAuth2 Configuration**
- Uses `OAuth2PasswordBearer` scheme
- Token endpoint: `/api/v1/auth/login`
- All protected endpoints use `Depends(oauth2_scheme)` or dependency functions

#### Security Features

✅ Bcrypt password hashing with automatic salt
✅ JWT signing with HS256 algorithm
✅ Token expiry validation
✅ Database-backed user verification
✅ Active user status checking
✅ Role-based access control
✅ Automatic token refresh support

---

### 2. Database Models

#### User Model (`app/models/user.py`)

**Fields:**
- `id` (Integer, Primary Key): Unique user identifier
- `email` (String, Unique, Indexed): User email address
- `username` (String, Unique, Indexed): Username for login
- `hashed_password` (String): Bcrypt hashed password
- `first_name` (String, Optional): User's first name
- `last_name` (String, Optional): User's last name
- `role` (Enum): User role (admin | user)
- `is_active` (Boolean): Whether user account is active
- `lead_score` (Integer): Calculated lead/quality score (default: 0)
- `metadata` (JSON): Custom user data for scoring (e.g., form completion status)
- `created_at` (DateTime): Account creation timestamp
- `updated_at` (DateTime): Last update timestamp

**Relationships:**
- `event_logs` (One-to-Many): User's event history with cascade delete

**Validations:**
- Email and username must be unique
- All fields properly indexed for query performance

#### ScoringRule Model (`app/models/scoring_rule.py`)

**Fields:**
- `id` (Integer, Primary Key): Rule identifier
- `field_key` (String, Indexed): Metadata field to evaluate (e.g., "email_verified")
- `operator` (String): Comparison operator (equals, contains, greater_than, etc.)
- `value` (String): Expected value for comparison
- `points` (Integer): Points awarded when rule matches
- `is_active` (Integer): 1=active, 0=inactive (for soft deletes)
- `created_at` (DateTime): Rule creation timestamp
- `updated_at` (DateTime): Last update timestamp

**Validations:**
- Field key must be unique per operator/value combination
- Points must be non-negative
- Operators validated against supported list

#### EventLog Model (`app/models/event_log.py`)

**Fields:**
- `id` (Integer, Primary Key): Event identifier
- `user_id` (Integer, ForeignKey): Reference to User
- `event_type` (String, Indexed): Event category (e.g., "form_step_1_complete")
- `event_data` (JSON): Event metadata
- `created_at` (DateTime, Indexed): Event timestamp

**Relationships:**
- `user` (Many-to-One): Reference to User with cascade delete

**Audit Trail:**
- Immutable event records for complete audit trail
- Indexed by user_id and created_at for efficient querying

---

### 3. Scoring Logic Service (`app/services/scoring_logic.py`)

#### Main Function: `calculate_user_score(user_id, db) -> int`

**Algorithm:**
1. Fetch user and their metadata from database
2. Fetch all active scoring rules
3. For each rule, evaluate against user metadata
4. Sum points from all matching rules
5. Update user's lead_score in database
6. Return new score

**Error Handling:**
- Raises `ValueError` if user not found
- Automatically committed to database

#### Rule Evaluation: `_evaluate_rule(rule, metadata) -> bool`

**Supported Operators:**
- `equals`: Case-insensitive string comparison
- `contains`: Substring search
- `greater_than`: Numeric comparison
- `less_than`: Numeric comparison
- `greater_than_or_equal`: Numeric comparison
- `less_than_or_equal`: Numeric comparison
- `exists`: Check if field exists in metadata

**Type Handling:**
- Automatic type conversion (string ↔ numeric)
- Boolean value support ("true"/"false" strings)
- Safe error handling for type mismatches
- Returns False on any conversion error

**Example Usage:**

```python
# In event webhook handler
new_score = await calculate_user_score(user_id, db)

# Updates user.metadata with event data
# Evaluates all active ScoringRules
# Sums matching points
# Updates user.lead_score
```

---

### 4. Database Configuration (`app/core/database.py`)

**Async Engine Setup:**
- Uses `asyncpg` driver for PostgreSQL
- Connection pooling enabled
- Echo SQL queries controlled by DEBUG setting

**Session Management:**
- `AsyncSessionLocal`: Session factory for creating sessions
- `get_db()`: Dependency function for injecting sessions into endpoints
- Automatic session cleanup with context manager

**Base Model:**
- `Base = declarative_base()`: SQLAlchemy ORM base class
- All models inherit from this for table creation

---

### 5. Configuration Management (`app/core/config.py`)

**Settings Class** (Pydantic BaseSettings):

Database:
- `DATABASE_URL`: Async PostgreSQL connection string
- `DATABASE_ECHO`: SQL query logging toggle

JWT:
- `SECRET_KEY`: 256-bit signing key (must change in production)
- `ALGORITHM`: HS256 by default
- `ACCESS_TOKEN_EXPIRE_MINUTES`: 30 (default)
- `REFRESH_TOKEN_EXPIRE_DAYS`: 7 (default)

CORS:
- `CORS_ORIGINS`: ["http://localhost:5173", "http://localhost:3000"]
- `CORS_ALLOW_CREDENTIALS`: True
- Wildcard methods and headers by default

External Services:
- `N8N_WEBHOOK_URL`: Optional n8n webhook endpoint
- `N8N_API_KEY`: Optional API authentication

**Environment Loading:**
- Reads from `.env` file using Pydantic Settings
- Case-sensitive key matching
- Type validation on load

---

## Database Schema

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(100) UNIQUE NOT NULL,
  hashed_password VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  role VARCHAR(20) DEFAULT 'user' NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  lead_score INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE scoring_rules (
  id SERIAL PRIMARY KEY,
  field_key VARCHAR(255) NOT NULL,
  operator VARCHAR(50) NOT NULL,
  value VARCHAR(255) NOT NULL,
  points INTEGER NOT NULL,
  is_active INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE event_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_type VARCHAR(255) NOT NULL,
  event_data JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_scoring_rules_field_key ON scoring_rules(field_key);
CREATE INDEX idx_event_logs_user_id ON event_logs(user_id);
CREATE INDEX idx_event_logs_created_at ON event_logs(created_at);
```

---

## Pydantic Schemas

### User Schemas

**UserBase**: Email, username, first/last name
**UserCreate**: Extends UserBase + password (min 8 chars)
**UserUpdate**: All UserBase fields optional, + metadata
**UserResponse**: UserBase + id, role, is_active, lead_score, metadata, timestamps
**UserAdminUpdate**: UserUpdate + role, is_active, lead_score fields

### ScoringRule Schemas

**ScoringRuleBase**: field_key, operator, value, points (0-1000)
**ScoringRuleCreate**: Extends ScoringRuleBase
**ScoringRuleUpdate**: All fields optional
**ScoringRuleResponse**: Base + id, is_active, timestamps

### EventLog Schemas

**EventLogBase**: event_type, event_data (JSON)
**EventLogCreate**: Extends EventLogBase
**EventLogResponse**: Base + id, user_id, created_at

---

## API Endpoints Implemented

### Authentication (`/api/v1/auth`)
- `POST /register`: Create new user account
- `POST /login`: Get access + refresh tokens
- `GET /me`: Get current user info (requires auth)

### Users (`/api/v1/users`)
- `GET /{user_id}`: Get user profile
- `PUT /{user_id}`: Update own profile
- `PUT /admin/{user_id}`: Admin user update

### Scoring (`/api/v1/scoring`)
- `GET /rules`: List active scoring rules (admin)
- `POST /rules`: Create scoring rule (admin)
- `PUT /rules/{id}`: Update scoring rule (admin)
- `POST /recalculate/{user_id}`: Recalculate user score (admin)
- `POST /recalculate-all`: Batch recalculate all scores (admin)

### Webhooks (`/api/v1/webhooks`)
- `POST /events`: Log event and trigger scoring
- `POST /n8n/{workflow_id}`: Handle n8n callbacks

### Flows (`/api/v1/flows`)
- `POST /start/{flow_id}`: Start registration flow
- `POST /complete/{flow_id}`: Complete flow step

---

## Environment & Docker

### Requirements (`requirements.txt`)
- FastAPI 0.104.1
- SQLAlchemy 2.0.23 (async)
- PostgreSQL 15
- python-jose[cryptography] (JWT)
- passlib[bcrypt] (password hashing)
- Pydantic v2
- Uvicorn server

### Docker Compose
- **Service**: PostgreSQL 15 Alpine
  - Database: registration_db
  - User: postgres / postgres
  - Healthcheck: 5-second interval
  - Volume: postgres_data (persistent)

- **Service**: FastAPI Application
  - Port: 8000
  - Depends on: PostgreSQL health
  - Auto-runs migrations
  - Hot-reload enabled

---

## Security Best Practices Implemented

✅ **Password Security**
- Bcrypt hashing with automatic salt
- Minimum 8-character requirement
- No plain text storage

✅ **JWT Authentication**
- HS256 algorithm
- Expiring tokens (30-min access, 7-day refresh)
- User verification on each request
- Active status checking

✅ **CORS Configuration**
- Restricted to trusted origins
- Credential support enabled
- Proper method/header handling

✅ **Database**
- Async driver prevents blocking
- SQL injection protection (parameterized queries)
- Foreign key constraints
- Cascade delete for data integrity

✅ **Access Control**
- Role-based endpoint protection
- User ownership validation
- Admin-only scoring operations
- Webhook validation ready

---

## Testing & Development Ready

The implementation provides:
- Type hints throughout (FastAPI auto-validation)
- Comprehensive docstrings
- Structured error handling
- Database session management
- Dependency injection setup
- Health check endpoint

To test:
```bash
# Install deps
pip install -r requirements.txt

# Start server
uvicorn app.main:app --reload

# API docs available at
# http://localhost:8000/docs
```
