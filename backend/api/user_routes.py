from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime, timezone
from typing import Optional
from .db import db

router = APIRouter()

# Models
class User(BaseModel):
    email: str
    user_id: str

class PaySchedule(BaseModel):
    start_date: datetime # change this to optional

class Preferences(BaseModel):
    budget_period: Optional[str] = None
    pay_schedule: Optional[PaySchedule] = None
    # Add other preference fields here as needed

class UpdatePreferencesRequest(BaseModel):
    user_id: str
    preferences: Preferences

class PaySchedule(BaseModel):
    start_date: datetime

class Preferences(BaseModel):
    budget_period: Optional[str] = None
    pay_schedule: Optional[PaySchedule] = None

# User Methods
@router.post("/create-user")
async def create_user(user: User):
    try:
        # logger.info("Creating a new user with email: %s", user.email)
        user_ref = db.collection("users").document(user.user_id)
        user_ref.set({
            "email": user.email,
            "created_at": datetime.now(timezone.utc),
            "preferences": {
                "budget_period": "monthly",
                "pay_schedule": None
            }
        })

        # Create "Unallocated Funds" category for the new user
        unallocated_category_ref = db.collection("categories").document()
        unallocated_category_ref.set({
            "name": "Unallocated Funds",
            "user_id": user_ref.id,
            "available": 0.0,
            "is_unallocated_funds": True,
            "created_at": datetime.now(timezone.utc)
        })

        # logger.info("User created successfully with ID: %s", user_ref.id)
        return {"message": "User created successfully.", "user_id": user_ref.id}
    except Exception as e:
        # logger.error("Failed to create user: %s", e)
        raise HTTPException(status_code=500, detail=f"Failed to create user: %e")

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

        if request.preferences.budget_period:
            # print(f"Updating budget period to: {request.preferences.budget_period}")
            update_budget_period(user_ref, request.preferences.budget_period, request.preferences.pay_schedule)

        # Add other preference updates here as needed

        # print("Preferences updated successfully")
        return {"message": "Preferences updated successfully."}
    except Exception as e:
        print(f"Failed to update preferences: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to update preferences: {e}")

def update_budget_period(user_ref, budget_period, pay_schedule):
    # print(f"Updating budget period to: {budget_period} with pay_schedule: {pay_schedule}")
    if budget_period not in ["monthly", "bi-weekly"]:
        print("Invalid budget period")
        raise HTTPException(status_code=400, detail="Invalid budget period. Must be 'monthly' or 'bi-weekly'.")

    if budget_period == "bi-weekly":
        # print("Bi-weekly budget period selected")
        # print(f"Pay schedule: {pay_schedule}, type: {type(pay_schedule)}")
        if not pay_schedule or not pay_schedule.start_date:
            print("Pay schedule with 'start_date' is required for bi-weekly budget period")
            raise HTTPException(status_code=400, detail="Pay schedule with 'start_date' is required for bi-weekly budget period.")

    user_ref.update({
        "preferences.budget_period": budget_period,
        "preferences.pay_schedule": pay_schedule.dict() if pay_schedule else None
    })
