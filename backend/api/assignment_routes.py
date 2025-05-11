from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime, timezone
from .db import db
from backend.db.schemas import Assignment as AssignmentSchema

router = APIRouter()

class Assignment(BaseModel):
    amount: float
    user_id: str
    category_id: str
    date: datetime

@router.post("/create-assignment")
async def create_assignment(assignment: Assignment):
    try:
        # logger.info("Creating a new assignment for user_id: %s and category_id: %s", assignment.user_id, assignment.category_id)
        
        if assignment.amount == 0:
            raise HTTPException(status_code=400, detail="Assignment amount cannot be zero")
        
        user_ref = db.collection("users").document(assignment.user_id)
        category_ref = db.collection("categories").document(assignment.category_id)

        user_doc = user_ref.get()
        if not user_doc.exists:
            raise HTTPException(status_code=404, detail="User not found")

        category_doc = category_ref.get()
        if not category_doc.exists:
            raise HTTPException(status_code=404, detail="Category not found")
        
        # Create a validated assignment using our schema
        assignment_schema = AssignmentSchema(
            amount=assignment.amount,
            user_id=assignment.user_id,
            category_id=assignment.category_id,
            date=assignment.date
        )
        
        # Convert to dict and save to Firestore
        assignment_ref = db.collection("assignments").document()
        assignment_ref.set(assignment_schema.to_dict())

        unallocated_query = db.collection("categories").where("user_id", "==", assignment.user_id).where("is_unallocated_funds", "==", True).limit(1)
        unallocated_docs = unallocated_query.stream()
        unallocated_category = None
        for doc in unallocated_docs:
            unallocated_category = doc
            break

        if not unallocated_category:
            raise HTTPException(status_code=404, detail="Unallocated funds category not found")

        unallocated_data = unallocated_category.to_dict()
        new_available = unallocated_data.get("available", 0.0) - assignment.amount
        unallocated_category.reference.update({"available": new_available})

        category_data = category_doc.to_dict()
        new_category_available = category_data.get("available", 0.0) + assignment.amount
        category_ref.update({"available": new_category_available})

        # logger.info("Assignment created successfully with ID: %s", assignment_ref.id)
        return {"message": "Assignment created successfully.", "assignment_id": assignment_ref.id}
    except Exception as e:
        # logger.error("Failed to create assignment: %s", e)
        raise HTTPException(status_code=500, detail=f"Failed to create assignment: %e")