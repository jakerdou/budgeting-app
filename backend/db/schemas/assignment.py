from pydantic import BaseModel, Field, field_validator
from datetime import datetime, timezone
from typing import Dict, Any
from decimal import Decimal
from .base import FirestoreModel

class Assignment(FirestoreModel):
    """Model for assignment documents in Firestore"""
    
    amount: Decimal
    user_id: str
    category_id: str
    date: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    @classmethod
    def collection_name(cls) -> str:
        return "assignments"
    
    @field_validator('amount')
    @classmethod
    def validate_amount(cls, v):
        # Convert to Decimal if it's not already
        if isinstance(v, (int, float)):
            v = Decimal(str(v))
        elif isinstance(v, str):
            v = Decimal(v)
        
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
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert model to a dictionary for Firestore"""
        data = self.model_dump(exclude_none=True)
        # Convert Decimal to float for Firestore storage
        data["amount"] = float(self.amount)
        return data