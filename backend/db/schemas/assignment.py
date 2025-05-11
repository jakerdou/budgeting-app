from pydantic import BaseModel, Field, field_validator
from datetime import datetime, timezone
from typing import Dict, Any
from .base import FirestoreModel

class Assignment(FirestoreModel):
    """Model for assignment documents in Firestore"""
    
    amount: float
    user_id: str
    category_id: str
    date: datetime
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    @classmethod
    def collection_name(cls) -> str:
        return "assignments"
    
    @field_validator('amount')
    @classmethod
    def validate_amount(cls, v):
        if v == 0:
            raise ValueError("Assignment amount cannot be zero")
        return v
    
    @field_validator('user_id')
    @classmethod
    def validate_user_id(cls, v):
        if not v or len(v.strip()) == 0:
            raise ValueError("User ID cannot be empty")
        return v
    
    @field_validator('category_id')
    @classmethod
    def validate_category_id(cls, v):
        if not v or len(v.strip()) == 0:
            raise ValueError("Category ID cannot be empty")
        return v