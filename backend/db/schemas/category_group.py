from pydantic import BaseModel, Field, field_validator
from datetime import datetime, timezone
from typing import Optional, Dict, Any
from .base import FirestoreModel

class CategoryGroup(FirestoreModel):
    """Model for category group documents in Firestore"""
    
    name: str
    user_id: str
    sort_order: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    @classmethod
    def collection_name(cls) -> str:
        return "category_groups"
    
    @field_validator('name')
    @classmethod
    def validate_name(cls, v):
        if not v or len(v.strip()) == 0:
            raise ValueError("Category group name cannot be empty")
        return v.strip()
    
    @field_validator('user_id')
    @classmethod
    def validate_user_id(cls, v):
        if not v or len(v.strip()) == 0:
            raise ValueError("User ID cannot be empty")
        return v
    
    @field_validator('sort_order')
    @classmethod
    def validate_sort_order(cls, v):
        if v < 0:
            raise ValueError("Sort order must be non-negative")
        return v
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert model to a dictionary for Firestore"""
        return self.model_dump(exclude_none=True)
