from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from .db import db

router = APIRouter()

class UserIDRequest(BaseModel):
    user_id: str

class DeletePlaidItemRequest(BaseModel):
    item_id: str

@router.post("/get-plaid-items")
async def get_plaid_items(request: UserIDRequest):
    try:
        # Query plaid_items with a `user_id` field equal to `request.user_id`
        plaid_items_query = db.collection("plaid_items").where("user_id", "==", request.user_id)
        plaid_items_docs = plaid_items_query.stream()

        # Collect plaid_items into a list, converting each document to a dictionary
        plaid_items = []
        for doc in plaid_items_docs:
            plaid_item_data = doc.to_dict()
            plaid_item_data["id"] = doc.id  # Add the plaid_item ID to the response
            plaid_items.append(plaid_item_data)

        return {"plaid_items": plaid_items}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get plaid items: {e}")

@router.post("/delete-plaid-item")
async def delete_plaid_item(request: DeletePlaidItemRequest):
    try:
        # Delete the plaid_item with the given ID
        db.collection("plaid_items").document(request.item_id).delete()
        return {"success": True, "message": "Plaid item deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete plaid item: {e}")