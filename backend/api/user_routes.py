from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime, timezone
from typing import Optional
from .db import db
from backend.db.schemas import User as UserSchema, UserPreferences, PaySchedule, Category as CategorySchema

router = APIRouter()

# API Request Models
class User(BaseModel):
    email: str
    user_id: str

class UpdatePreferencesRequest(BaseModel):
    user_id: str
    preferences: UserPreferences

# User Methods
@router.post("/create-user")
async def create_user(user: User):
    try:
        # Create a validated User object with schema
        user_schema = UserSchema(
            email=user.email
        )
        
        # Convert to dict for Firestore (validation happens automatically)
        user_data = user_schema.to_dict()
        
        # Create "Unallocated Funds" category for the new user using schema
        unallocated_category = CategorySchema(
            name="Unallocated Funds",
            user_id=user.user_id,  # Use the provided user_id instead of user_ref.id
            available=0.0,
            is_unallocated_funds=True
        )
        
        # Use batch write for atomicity
        batch = db.batch()
        
        # 1. Create the user
        user_ref = db.collection(UserSchema.collection_name()).document(user.user_id)
        batch.set(user_ref, user_data)
        
        # 2. Create the unallocated funds category
        unallocated_category_ref = db.collection(CategorySchema.collection_name()).document()
        batch.set(unallocated_category_ref, unallocated_category.to_dict())
        
        # Execute all writes atomically
        batch.commit()

        return {"message": "User created successfully.", "user_id": user_ref.id}
    except ValueError as ve:
        # This will catch schema validation errors
        raise HTTPException(status_code=400, detail=f"Invalid user data: {str(ve)}")
    except Exception as e:
        # logger.error("Failed to create user: %s", e)
        raise HTTPException(status_code=500, detail=f"Failed to create user: {e}")

@router.post("/update-preferences")
async def update_preferences(request: UpdatePreferencesRequest):
    try:
        # print request
        # print(f"Updating preferences: {request.preferences}")
        user_ref = db.collection("users").document(request.user_id)
        user_doc = user_ref.get()
        if not user_doc.exists:
            # print(f"User with user_id: {request.user_id} not found")
            raise HTTPException(status_code=404, detail="User not found")

        # The preferences are already validated by Pydantic
        # Update the user document with the preferences
        user_ref.update({
            "preferences": request.preferences.model_dump(exclude_none=True)
        })

        # print("Preferences updated successfully")
        return {"message": "Preferences updated successfully."}
    except ValueError as ve:
        # This will catch schema validation errors
        raise HTTPException(status_code=400, detail=f"Invalid preferences data: {str(ve)}")
    except Exception as e:
        print(f"Failed to update preferences: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to update preferences: {e}")
