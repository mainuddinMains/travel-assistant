from fastapi import APIRouter

router = APIRouter()


@router.get("/health", summary="API health check")
async def api_health() -> dict[str, str]:
    """Simple health endpoint for API consumers."""
    return {"status": "ok"}

