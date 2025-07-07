from pydantic import BaseModel, Field, field_validator
from datetime import datetime, timezone
from typing import Optional, Dict, Any, ClassVar
from .base import FirestoreModel

class Category(FirestoreModel):
    """Model for category documents in Firestore"""
    
    name: str
    user_id: str
    available: float = 0.0
    is_unallocated_funds: bool = False
    goal_amount: Optional[float] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    @classmethod
    def collection_name(cls) -> str:
        return "categories"
    
    @field_validator('name')
    @classmethod
    def validate_name(cls, v):
        if not v or len(v.strip()) == 0:
            raise ValueError("Category name cannot be empty")
        return v
    
    @field_validator('user_id')
    @classmethod
    def validate_user_id(cls, v):
        if not v or len(v.strip()) == 0:
            raise ValueError("User ID cannot be empty")
        return v