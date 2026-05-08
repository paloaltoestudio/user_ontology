# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this project is

A B2B SaaS platform that tracks user onboarding lifecycles. Clients embed forms or connect external forms via webhooks to capture leads. The platform builds a live "user ontology" — tracking each lead's lifecycle stage, goals, actions, and AI-driven suggestions. There are two views: individual lead detail ("microscope") and aggregated flow across the entire user base ("telescope").

## Repository layout

```
api/        FastAPI backend (Python)
admin/      React + Vite frontend (TypeScript)
nginx/      Nginx config (production reverse proxy)
docker-compose.yml  Production stack: postgres + api + nginx
```

## Development commands

### Backend (run from `api/`)

```bash
# Start API server (dev)
uvicorn main:app --reload --port 8000

# Run migrations
alembic upgrade head

# Create a new migration
alembic revision --autogenerate -m "description"

# Run tests
pytest

# Run a single test file
pytest tests/test_leads.py -v
```

Dev database is SQLite (`test.db`). Production uses PostgreSQL via `DATABASE_URL` env var.

### Frontend (run from `admin/`)

```bash
npm run dev        # Start Vite dev server (port 5173)
npm run build      # Production build
npm run typecheck  # tsc --noEmit
npm run lint       # ESLint
```

Frontend talks to `VITE_API_URL` (defaults to `http://localhost:8000`).

### Production

```bash
docker-compose up --build   # Runs postgres + api + nginx on port 80
```

The API container runs `entrypoint.sh` which applies migrations then starts uvicorn with 2 workers.

## Backend architecture

**Entry point:** `main.py` — registers all routers under `/api/v1`, configures CORS, imports all models so SQLAlchemy registers them.

**Pattern:** async SQLAlchemy with `AsyncSession`. All DB calls use `await db.execute(select(...))`. Use `selectinload()` for relationships to avoid N+1.

**Models** (`models/`): `Form`, `FormStep`, `FormField`, `Lead`, `LeadStatusHistory`, `WebhookDelivery`, `ExternalSubmission`, `Action`, `ActionLog`, `Goal`, `GoalAssignment`, `GoalCompletion`, `User`, `ApiKey`, `ScoringRule`, `EventLog`.

**Endpoints** (`api/v1/endpoints/`):

| File | Routes | Auth |
|------|--------|------|
| `auth.py` | login, refresh, register | public |
| `forms.py` | form CRUD + step/field management | public GET, admin write |
| `leads.py` | lead CRUD, submit, journey, bulk actions | public submit, admin rest |
| `inbound.py` | external webhook receiver + admin management | public POST, admin rest |
| `actions.py` | action CRUD, form attachment | admin |
| `goals.py` | goal CRUD, assignments, completions | admin |
| `webhooks.py` | inbound event logging + n8n callbacks | public |
| `settings.py` | app config | admin |

**Background tasks:** form submission triggers two `BackgroundTasks` — `send_webhooks` and `trigger_actions_for_form` — both open their own `AsyncSessionLocal` session since the request session may be closed.

**Auth:** JWT bearer tokens. `get_current_admin` dependency on all admin routes. `ADMIN_SETUP_KEY` env var gates the initial admin creation endpoint.

## Frontend architecture

**Routing:** React Router v6 in `App.tsx`. Public routes (`/forms/public/:formId`, `/login`) come before the protected route wrapper. All admin pages require auth.

**State:** Zustand `authStore` for JWT tokens. TanStack Query for all server state (cache keys follow `['resource', id, filter]` convention). No Redux.

**API client** (`api/client.ts`): Axios instance that auto-injects `Authorization: Bearer` header from `authStore` and clears tokens on 401.

**Key pages:**

| Route | Page | Purpose |
|-------|------|---------|
| `/` | `DashboardPage` | Telescope view — aggregated lifecycle flow graph |
| `/users` | `UserOntologySummaryPage` | Lead list with lifecycle metrics |
| `/users/:id` | `UserDetailPageTabbed` | Individual lead journey |
| `/suggestions` | `UserSuggestionsInboxPage` | AI action inbox with batch approval |
| `/forms` | `FormsPage` | Form management |
| `/forms/:id` | `FormDetailPage` | Form builder — 6 tabs: General, Actions, Webhooks, Steps, Lead Mapping, External Integrations |
| `/forms/public/:formId` | `PublicFormPage` | Public form submission (no auth) |

**FormDetailPage tabs:** each tab saves independently. "External Integrations" tab is the entire external webhook flow — webhook URL, submission inbox (Pending/Failed/Processed), and contextual field mapping.

## Key data flows

### Internal form submission
`PublicFormPage` → `POST /leads/submit/{form_id}` → creates `Lead` → background tasks send webhooks + trigger actions.

The form's `lead_field_mapping` maps lead static fields (`name`, `email`, etc.) to form field names. `PublicFormPage` applies this mapping client-side before submission.

### External form submission (inbound webhooks)
External form → `POST /inbound/{token}` → stores `ExternalSubmission` (raw payload, always lossless) → if `external_field_mapping` configured, tries to create `Lead` immediately, otherwise stays `pending`.

Admin workflow: External Integrations tab → pick a pending/failed submission → configure field mapping from its payload keys → "Map & Process" → applies mapping, processes that submission, then forward-reprocesses remaining pending/failed with **fail-fast** (stops on first failure, leaves rest as `pending`).

### Field mapping for external submissions
`Form.external_field_mapping` is a dict mapping lead property → payload key path (dot notation for nested). Example: `{"email": "user.contact_email", "name": "first_name"}`. The `_flatten()` utility in `inbound.py` normalizes nested payloads before extraction.

## Migration conventions

Migrations live in `api/migrations/versions/`. The chain currently has two merged heads. New migrations should set `down_revision` to the current head (run `alembic heads` to check). The migration at `1713033608` merges the two previous branches — use that pattern if heads diverge again.

SQLite is used in dev — avoid `unique=True` on `add_column` (SQLite limitation); create uniqueness via `create_index(..., unique=True)` instead.

## Terminology

- **Lead** = a person who submitted a form (called "User" in some older parts of the codebase)
- **Form** = the template the client creates; has steps → fields
- **ExternalSubmission** = raw inbound payload from a third-party form, before mapping
- **Ontology** = the full graph of all leads and their lifecycle stages
- **Action** = a webhook-based automation triggered on form submission
- **Goal** = a milestone assigned to a lead (e.g., "complete onboarding step 2")
