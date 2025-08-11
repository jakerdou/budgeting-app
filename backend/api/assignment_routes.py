from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime, timezone
from decimal import Decimal
from .db import db
from backend.db.schemas import Assignment as AssignmentSchema
import logging
import os

# Setup logging for assignments
log_dir = os.path.join(os.path.dirname(__file__), "logs")
os.makedirs(log_dir, exist_ok=True)
assignment_logger = logging.getLogger("assignment_logger")
assignment_logger.setLevel(logging.INFO)
assignment_handler = logging.FileHandler(os.path.join(log_dir, "assignment.log"))
assignment_formatter = logging.Formatter('%(asctime)s - %(message)s')
assignment_handler.setFormatter(assignment_formatter)
assignment_logger.addHandler(assignment_handler)
assignment_logger.propagate = False

router = APIRouter()

class Assignment(BaseModel):
    amount: Decimal
    user_id: str
    category_id: str
    date: str

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
        
        # Find unallocated funds category before starting batch
        unallocated_query = db.collection("categories").where("user_id", "==", assignment.user_id).where("is_unallocated_funds", "==", True).limit(1)
        unallocated_docs = unallocated_query.stream()
        unallocated_category = None
        for doc in unallocated_docs:
            unallocated_category = doc
            break

        if not unallocated_category:
            raise HTTPException(status_code=404, detail="Unallocated funds category not found")

        # Get current data for calculations
        unallocated_data = unallocated_category.to_dict()
        category_data = category_doc.to_dict()
        
        current_available = Decimal(str(unallocated_data.get("available", 0.0)))
        new_available = current_available - assignment.amount
        
        current_category_available = Decimal(str(category_data.get("available", 0.0)))
        new_category_available = current_category_available + assignment.amount

        # Use batch write for atomicity
        batch = db.batch()
        
        # 1. Create assignment document
        assignment_ref = db.collection("assignments").document()
        batch.set(assignment_ref, assignment_schema.to_dict())
        
        # 2. Update unallocated funds (subtract assignment amount)
        batch.update(unallocated_category.reference, {"available": float(new_available)})
        
        # 3. Update target category (add assignment amount)
        batch.update(category_ref, {"available": float(new_category_available)})
        
        # Execute all writes atomically
        batch.commit()

        # Get user email for logging
        user_data = user_doc.to_dict()
        user_email = user_data.get('email', 'Unknown')

        # Log the assignment
        assignment_logger.info(f"Assignment created - ID: {assignment_ref.id}, Amount: ${assignment.amount}, Category: '{category_data.get('name', 'Unknown')}' (ID: {assignment.category_id}), New category available: ${new_category_available}, User ID: {assignment.user_id}, User Email: {user_email}")

        # logger.info("Assignment created successfully with ID: %s", assignment_ref.id)
        return {"message": "Assignment created successfully.", "assignment_id": assignment_ref.id}
    except Exception as e:
        # logger.error("Failed to create assignment: %s", e)
        raise HTTPException(status_code=500, detail=f"Failed to create assignment: %e")