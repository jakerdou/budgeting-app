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
        # First get all fields, including None values
        dict_data = self.model_dump(exclude_none=False)
        
        # Special handling for category_id to ensure it's always included
        # Try using empty string instead of None as a workaround
        if hasattr(self, 'category_id'):
            # Store empty string instead of None if needed
            dict_data['category_id'] = "" if getattr(self, 'category_id') is None else getattr(self, 'category_id')
            
        return dict_data
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]):
        """Create model instance from Firestore document data"""
        return cls(**data)