from pydantic import BaseModel, Field, field_validator
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from .base import FirestoreModel

class PlaidItem(FirestoreModel):
    """Model for plaid_item documents in Firestore"""
    
    user_id: str
    access_token: str
    item_id: str
    institution_id: str
    institution_name: str
    cursor: Optional[str] = None
    accounts: List[Dict[str, Any]] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    @classmethod
    def collection_name(cls) -> str:
        return "plaid_items"
    
    @field_validator('user_id')
    @classmethod
    def validate_user_id(cls, v):
        if not v or len(v.strip()) == 0:
            raise ValueError("User ID cannot be empty")
        return v
    
    @field_validator('access_token')
    @classmethod
    def validate_access_token(cls, v):
        if not v or len(v.strip()) == 0:
            raise ValueError("Access token cannot be empty")
        return v
    
    @field_validator('item_id')
    @classmethod
    def validate_item_id(cls, v):
        if not v or len(v.strip()) == 0:
            raise ValueError("Item ID cannot be empty")
        return v
    
    @field_validator('institution_name')
    @classmethod
    def validate_institution_name(cls, v):
        if not v or len(v.strip()) == 0:
            raise ValueError("Institution name cannot be empty")
        return v