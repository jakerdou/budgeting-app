from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime, timezone
from .db import db
from backend.db.schemas import CategoryGroup as CategoryGroupSchema

router = APIRouter()

# Request models
class CreateCategoryGroupRequest(BaseModel):
    name: str
    user_id: str
    sort_order: int = 0

class DeleteCategoryGroupRequest(BaseModel):
    category_group_id: str
    user_id: str

class GetCategoryGroupRequest(BaseModel):
    category_group_id: str
    user_id: str

class UserIDRequest(BaseModel):
    user_id: str

# Response models
class CategoryGroupResponse(BaseModel):
    id: str
    name: str
    user_id: str
    sort_order: int
    created_at: datetime

@router.post("/create-category-group")
async def create_category_group(request: CreateCategoryGroupRequest):
    """Create a new category group"""
    try:
        # Create category group using schema
        category_group = CategoryGroupSchema(
            name=request.name,
            user_id=request.user_id,
            sort_order=request.sort_order
        )
        
        # Add to Firestore
        doc_ref = db.collection(CategoryGroupSchema.collection_name()).add(category_group.to_dict())
        
        return {
            "message": "Category group created successfully",
            "category_group_id": doc_ref[1].id
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating category group: {str(e)}")

@router.post("/get-category-groups")
async def get_category_groups_by_user(request: UserIDRequest):
    """Get all category groups for a user"""
    try:
        # Query category groups by user_id
        category_groups_ref = db.collection(CategoryGroupSchema.collection_name())
        query = category_groups_ref.where("user_id", "==", request.user_id).order_by("sort_order")
        
        category_groups = []
        for doc in query.stream():
            category_group_data = doc.to_dict()
            category_group_data["id"] = doc.id
            category_groups.append(CategoryGroupResponse(**category_group_data))
        
        return {"category_groups": category_groups}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving category groups: {str(e)}")

@router.post("/delete-category-group")
async def delete_category_group(request: DeleteCategoryGroupRequest):
    """Delete a category group"""
    try:
        # Check if category group exists
        doc_ref = db.collection(CategoryGroupSchema.collection_name()).document(request.category_group_id)
        doc = doc_ref.get()
        
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Category group not found")
        
        # Verify ownership
        category_group_data = doc.to_dict()
        if category_group_data.get("user_id") != request.user_id:
            raise HTTPException(status_code=403, detail="Not authorized to delete this category group")
        
        # Check if any categories are still assigned to this group
        categories_ref = db.collection("categories")
        categories_with_group = categories_ref.where("group_id", "==", request.category_group_id).limit(1).stream()
        
        if any(categories_with_group):
            raise HTTPException(
                status_code=400, 
                detail="Cannot delete category group: categories are still assigned to this group"
            )
        
        # Delete the category group
        doc_ref.delete()
        
        return {"message": "Category group deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting category group: {str(e)}")

@router.post("/get-category-group")
async def get_category_group(request: GetCategoryGroupRequest):
    """Get a specific category group by ID"""
    try:
        doc_ref = db.collection(CategoryGroupSchema.collection_name()).document(request.category_group_id)
        doc = doc_ref.get()
        
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Category group not found")
        
        category_group_data = doc.to_dict()
        
        # Verify ownership
        if category_group_data.get("user_id") != request.user_id:
            raise HTTPException(status_code=403, detail="Not authorized to access this category group")
        
        category_group_data["id"] = doc.id
        
        return CategoryGroupResponse(**category_group_data)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving category group: {str(e)}")
