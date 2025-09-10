from fastapi import APIRouter
from datetime import datetime, timezone
from pydantic import BaseModel

router = APIRouter()

class HealthResponse(BaseModel):
    status: str
    timestamp: str
    message: str

@router.get("/", response_model=HealthResponse)
def health_check():
    """
    Basic health check endpoint to verify the backend is running and reachable.
    """
    return HealthResponse(
        status="healthy",
        timestamp=datetime.now(timezone.utc).isoformat(),
        message="Backend is running successfully"
    )

@router.get("/ping")
def ping():
    """
    Simple ping endpoint for basic connectivity checks.
    """
    return {"ping": "pong"}
