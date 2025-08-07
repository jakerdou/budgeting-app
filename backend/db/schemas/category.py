from pydantic import BaseModel, Field, field_validator
from datetime import datetime, timezone
from typing import Optional, Dict, Any, ClassVar
from decimal import Decimal
from .base import FirestoreModel

class Category(FirestoreModel):
    """Model for category documents in Firestore"""
    
    name: str
    user_id: str
    available: Decimal = Decimal('0.0')
    is_unallocated_funds: bool = False
    goal_amount: Optional[Decimal] = None
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
    
    @field_validator('available')
    @classmethod
    def validate_available(cls, v):
        # Convert to Decimal if it's not already
        if isinstance(v, (int, float)):
            return Decimal(str(v))
        elif isinstance(v, str):
            return Decimal(v)
        return v
    
    @field_validator('goal_amount')
    @classmethod
    def validate_goal_amount(cls, v):
        if v is None:
            return v
        # Convert to Decimal if it's not already
        if isinstance(v, (int, float)):
            return Decimal(str(v))
        elif isinstance(v, str):
            return Decimal(v)
        return v
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert model to a dictionary for Firestore"""
        data = self.model_dump(exclude_none=True)
        # Convert Decimal fields to float for Firestore storage
        data["available"] = float(self.available)
        if self.goal_amount is not None:
            data["goal_amount"] = float(self.goal_amount)
        return data