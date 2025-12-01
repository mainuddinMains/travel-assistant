from fastapi import APIRouter

from app.api.v1.endpoints import auth_router, users_router, health

api_router = APIRouter()

# Health endpoint
api_router.include_router(health.router, tags=["health"])

# Include auth endpoints
api_router.include_router(auth_router, prefix="/auth", tags=["authentication"])

# Include user endpoints
api_router.include_router(users_router, prefix="/users", tags=["users"])
