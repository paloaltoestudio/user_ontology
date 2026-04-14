from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from core.config import settings
from core.database import engine

# Import all models to register them
from models import user, scoring_rule, event_log, form, lead, action, goal
from models.lead import WebhookDelivery  # Explicitly import to register the model
from models.action import ActionLog  # Explicitly import to register the model
from models.goal import Goal, GoalCompletion, GoalAssignment, IdempotencyKey  # Explicitly import to register the models
from models.api_key import ApiKey  # Explicitly import to register the model

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description="Headless FastAPI Backend for SaaS Registration Engine",
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=settings.CORS_ALLOW_CREDENTIALS,
    allow_methods=settings.CORS_ALLOW_METHODS,
    allow_headers=settings.CORS_ALLOW_HEADERS,
)


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
