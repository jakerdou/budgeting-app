from pydantic import BaseModel, Field, field_validator
from datetime import datetime, timezone
from typing import Optional, Dict, Any, ClassVar
from decimal import Decimal
from .base import FirestoreModel

class Transaction(FirestoreModel):
    """Model for transaction documents in Firestore"""
    
    amount: Decimal
    user_id: str
    name: str
    date: str    
    category_id: Optional[str] = None  # Explicitly nullable field
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    type: str = "debit"  # 'debit' or 'credit'
    plaid_transaction_id: Optional[str] = None
    institution_name: Optional[str] = None
    account_name: Optional[str] = None
    
    @classmethod
    def collection_name(cls) -> str:
        return "transactions"
    
    @field_validator('amount')
    @classmethod
    def validate_amount(cls, v):
        # Amount can be negative (expense) or positive (income)
        # Convert to Decimal if it's not already
        if isinstance(v, (int, float)):
            return Decimal(str(v))
        elif isinstance(v, str):
            return Decimal(v)
        return v
    
    @field_validator('user_id')
    @classmethod
    def validate_user_id(cls, v):
        if not v or len(v.strip()) == 0:
            raise ValueError("User ID cannot be empty")
        return v
    
    @field_validator('name')
    @classmethod
    def validate_name(cls, v):
        if not v or len(v.strip()) == 0:
            raise ValueError("Transaction name cannot be empty")
        return v
    
    @field_validator('type')
    @classmethod
    def validate_type(cls, v):
        if v not in ["debit", "credit"]:
            raise ValueError("Transaction type must be 'debit' or 'credit'")
        return v
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert model to a dictionary for Firestore"""
        data = self.model_dump(exclude_none=True)
        # Convert Decimal to float for Firestore storage
        data["amount"] = float(self.amount)
        # Ensure the type is set based on amount for consistency
        data["type"] = "debit" if self.amount < 0 else "credit"
        return data