from pydantic import BaseModel
from typing import Dict, Any

class FirestoreModel(BaseModel):
    """Base model for Firestore documents"""
    
    # Configure model to forbid extra fields
    model_config = {
        "extra": "forbid"
    }
    
    @classmethod
    def collection_name(cls) -> str:
        """Return the Firestore collection name"""
        raise NotImplementedError("Subclasses must implement collection_name()")
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert model to a dictionary for Firestore"""
        return self.model_dump(exclude_none=True)
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]):
        """Create model instance from Firestore document data"""
        return cls(**data)