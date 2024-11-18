from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime, timezone
from .db import db

router = APIRouter()

# Models
class User(BaseModel):
    email: str
    user_id: str

# Request model for the POST request
class UserIDRequest(BaseModel):
    user_id: str

class CategoriesWithAllocatedRequest(BaseModel):
    user_id: str
    start_date: datetime
    end_date: datetime

class Category(BaseModel):
    name: str
    user_id: str

# Category Methods
@router.post("/get-categories")
async def get_categories(request: UserIDRequest):
    try:
        # logger.info("Fetching categories for user_id: %s", request.user_id)
        
        # Query categories with a `user` field equal to `user_ref`
        # logger.info("Querying categories for user_ref: %s", request.user_id)
        categories_query = db.collection("categories").where("user_id", "==", request.user_id)
        categories_docs = categories_query.stream()

        # Collect categories into a list, converting each document to a dictionary
        categories = []
        for doc in categories_docs:
            category_data = doc.to_dict()
            category_data["id"] = doc.id  # Add the category ID to the response
            
            # Remove or handle any unserializable fields here, if necessary
            
            categories.append(category_data)

        # logger.info("Successfully fetched categories for user_id: %s", request.user_id)
        # logger.info("Categories: %s", categories)
        return {"categories": categories}
    
    except Exception as e:
        # logger.error("Failed to get categories for user_id: %s, error: %s", request.user_id, e)
        raise HTTPException(status_code=500, detail=f"Failed to get categories: %e")

@router.post("/get-categories-with-allocated")
async def get_categories_with_allocated(request: CategoriesWithAllocatedRequest):
    try:
        # logger.info("Fetching categories with allocated amounts for user_id: %s", request.user_id)
        
        # Query categories with a `user_id` field equal to `request.user_id`
        categories_query = db.collection("categories").where("user_id", "==", request.user_id)
        categories_docs = categories_query.stream()

        # Collect categories into a list, converting each document to a dictionary
        categories = []
        for doc in categories_docs:
            category_data = doc.to_dict()
            category_data["id"] = doc.id  # Add the category ID to the response
            
            # Calculate allocated amount for the category
            assignments_query = db.collection("assignments").where("category_id", "==", doc.id).where("date", ">=", request.start_date).where("date", "<=", request.end_date)
            assignments_docs = assignments_query.stream()
            allocated_amount = sum(assignment.to_dict().get("amount", 0.0) for assignment in assignments_docs)
            
            category_data["allocated"] = allocated_amount
            categories.append(category_data)

        # logger.info("Successfully fetched categories with allocated amounts for user_id: %s", request.user_id)
        return {"categories": categories}
    
    except Exception as e:
        # logger.error("Failed to get categories with allocated amounts for user_id: %s, error: %s", request.user_id, e)
        raise HTTPException(status_code=500, detail=f"Failed to get categories with allocated amounts: %e")

@router.post("/get-allocated")
async def get_categories_with_allocated(request: CategoriesWithAllocatedRequest):
    try:
        # logger.info("Fetching categories with allocated amounts for user_id: %s", request.user_id)
        
        # Query categories with a `user_id` field equal to `request.user_id`
        categories_query = db.collection("categories").where("user_id", "==", request.user_id)
        categories_docs = categories_query.stream()

        # Collect categories into a list, converting each document to a dictionary
        allocated = []
        for doc in categories_docs:
            allocated_data = {}
            allocated_data["category_id"] = doc.id  # Add the category ID to the response
            
            # Calculate allocated amount for the category
            assignments_query = db.collection("assignments").where("category_id", "==", doc.id).where("date", ">=", request.start_date).where("date", "<=", request.end_date)

            assignments_docs = assignments_query.stream()
            allocated_amount = sum(assignment.to_dict().get("amount", 0.0) for assignment in assignments_docs)
            
            allocated_data["allocated"] = allocated_amount
            allocated.append(allocated_data)

        # logger.info("Successfully fetched allocated amounts for user_id: %s", request.user_id)
        return {"allocated": allocated}
    
    except Exception as e:
        # logger.error("Failed to get categories with allocated amounts for user_id: %s, error: %s", request.user_id, e)
        raise HTTPException(status_code=500, detail=f"Failed to get categories with allocated amounts: %e")

@router.post("/create-category")
async def create_category(category: Category):
    try:
        user_ref = db.collection("users").document(category.user_id)
        user_doc = user_ref.get()
        if not user_doc.exists:
            raise HTTPException(status_code=404, detail="User not found")

        # logger.info("Creating a new category with name: %s", category.name)
        category_ref = db.collection("categories").document()
        category_ref.set({
            "name": category.name,
            "user_id": category.user_id,
            "available": 0.0,
            "is_unallocated_funds": False,
            "created_at": datetime.now(timezone.utc)
        })
        # logger.info("Category created successfully with ID: %s", category_ref.id)
        return {"message": "Category created successfully.", "category_id": category_ref.id}
    except Exception as e:
        # logger.error("Failed to create category: %s", e)
        raise HTTPException(status_code=500, detail=f"Failed to create category: %e")