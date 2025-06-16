from pydantic import BaseModel, Field, field_validator
from datetime import datetime, timezone
from typing import Optional, Dict, Any, ClassVar
from .base import FirestoreModel

class PaySchedule(BaseModel):
    # Configure model to forbid extra fields
    model_config = {
        "extra": "forbid"
    }
    
    start_date: str

class UserPreferences(BaseModel):
    # Configure model to forbid extra fields
    model_config = {
        "extra": "forbid"
    }
    
    budget_period: str = "monthly"
    pay_schedule: Optional[PaySchedule] = None
    
    @field_validator('budget_period')
    @classmethod
    def validate_budget_period(cls, v):
        if v not in ["monthly", "bi-weekly"]:
            raise ValueError("Budget period must be 'monthly' or 'bi-weekly'")
        return v

class User(FirestoreModel):
    email: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    preferences: UserPreferences = Field(default_factory=UserPreferences)
    
    @classmethod
    def collection_name(cls) -> str:
        return "users"
    
    @field_validator('email')
    @classmethod
    def validate_email(cls, v):
        if '@' not in v:
            raise ValueError("Invalid email format")
        return v