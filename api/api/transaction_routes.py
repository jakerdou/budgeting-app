from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime, timezone
from .db import db

router = APIRouter()

class User(BaseModel):
    email: str
    user_id: str

# Request model for the POST request
class UserIDRequest(BaseModel):
    user_id: str

class Category(BaseModel):
    name: str
    user_id: str

class Transaction(BaseModel):
    amount: float
    user_id: str
    category_id: str
    name: str
    date: datetime

class DeleteTransactionRequest(BaseModel):
    user_id: str
    transaction_id: str

class UpdateTransactionCategoryRequest(BaseModel):
    user_id: str
    transaction_id: str
    category_id: str

@router.post("/get-transactions")
async def get_transactions(request: UserIDRequest):
    try:
        # logger.info("Fetching transactions for user_id: %s", request.user_id)
        
        # Query transactions with a `user_id` field equal to `request.user_id`
        transactions_query = db.collection("transactions").where("user_id", "==", request.user_id)
        transactions_docs = transactions_query.stream()

        # Collect transactions into a list, converting each document to a dictionary
        transactions = []
        for doc in transactions_docs:
            transaction_data = doc.to_dict()
            transaction_data["id"] = doc.id  # Add the transaction ID to the response
            
            # Remove or handle any unserializable fields here, if necessary
            transactions.append(transaction_data)

        # logger.info("Successfully fetched transactions for user_id: %s", request.user_id)
        # logger.info("Transactions: %s", transactions)
        return {"transactions": transactions}
    
    except Exception as e:
        # logger.error("Failed to get transactions for user_id: %s, error: %s", request.user_id, e)
        raise HTTPException(status_code=500, detail=f"Failed to get transactions: %e")
    
@router.post("/create-transaction")
async def create_transaction(transaction: Transaction):
    try:
        # logger.info("Creating a new transaction with name: %s for user_id: %s and category_id: %s", transaction.name, transaction.user_id, transaction.category_id)
        
        user_ref = db.collection("users").document(transaction.user_id)
        category_ref = db.collection("categories").document(transaction.category_id)

        user_doc = user_ref.get()
        if not user_doc.exists:
            raise HTTPException(status_code=404, detail="User not found")

        category_doc = category_ref.get()
        if not category_doc.exists:
            raise HTTPException(status_code=404, detail="Category not found")
        
        transaction_ref = db.collection("transactions").document()
        transaction_ref.set({
            "amount": transaction.amount,
            "user_id": transaction.user_id,
            "category_id": transaction.category_id,
            "name": transaction.name,
            "date": transaction.date,
            "type": "debit" if transaction.amount < 0 else "credit",
            "created_at": datetime.now(timezone.utc)
        })
        
        if category_doc.exists:
            category_data = category_doc.to_dict()
            new_available = category_data.get("available", 0.0) + transaction.amount
            category_ref.update({"available": new_available})
        
        # logger.info("Transaction created successfully with ID: %s", transaction_ref.id)
        return {"message": "Transaction created successfully.", "transaction_id": transaction_ref.id}
    except Exception as e:
        # logger.error("Failed to create transaction: %s", e)
        raise HTTPException(status_code=500, detail=f"Failed to create transaction: %e")

@router.post("/delete-transaction")
async def delete_transaction(request: DeleteTransactionRequest):
    try:
        # logger.info("Deleting transaction with ID: %s for user_id: %s", request.transaction_id, request.user_id)
        
        transaction_ref = db.collection("transactions").document(request.transaction_id)
        transaction_doc = transaction_ref.get()
        
        if not transaction_doc.exists:
            raise HTTPException(status_code=404, detail="Transaction not found")
        
        transaction_data = transaction_doc.to_dict()
        
        if transaction_data["user_id"] != request.user_id:
            raise HTTPException(status_code=403, detail="User ID does not match the transaction")
        
        category_ref = db.collection("categories").document(transaction_data["category_id"])
        category_doc = category_ref.get()
        
        if not category_doc.exists:
            raise HTTPException(status_code=404, detail="Category not found")
        
        # Delete the transaction
        transaction_ref.delete()
        
        # Update the available amount in the category
        category_data = category_doc.to_dict()
        new_available = category_data.get("available", 0.0) - transaction_data["amount"]
        category_ref.update({"available": new_available})
        
        # logger.info("Transaction deleted successfully with ID: %s", request.transaction_id)
        return {"message": "Transaction deleted successfully.", "transaction_id": request.transaction_id}
    except Exception as e:
        # logger.error("Failed to delete transaction: %s", e)
        raise HTTPException(status_code=500, detail=f"Failed to delete transaction: %e")

@router.post("/update-transaction-category")
async def update_transaction_category(request: UpdateTransactionCategoryRequest):
    try:
        # logger.info("Updating category for transaction_id: %s for user_id: %s to category_id: %s", request.transaction_id, request.user_id, request.category_id)
        
        transaction_ref = db.collection("transactions").document(request.transaction_id)
        transaction_doc = transaction_ref.get()
        
        if not transaction_doc.exists:
            raise HTTPException(status_code=404, detail="Transaction not found")
        
        transaction_data = transaction_doc.to_dict()
        
        if transaction_data["user_id"] != request.user_id:
            raise HTTPException(status_code=403, detail="User ID does not match the transaction")
        
        old_category_ref = db.collection("categories").document(transaction_data["category_id"])
        old_category_doc = old_category_ref.get()
        
        if not old_category_doc.exists:
            raise HTTPException(status_code=404, detail="Old category not found")
        
        new_category_ref = db.collection("categories").document(request.category_id)
        new_category_doc = new_category_ref.get()
        
        if not new_category_doc.exists:
            raise HTTPException(status_code=404, detail="New category not found")
        
        new_category_data = new_category_doc.to_dict()
        
        if new_category_data["user_id"] != request.user_id:
            raise HTTPException(status_code=403, detail="New category does not belong to the user")
        
        # Update the transaction's category_id
        transaction_ref.update({"category_id": request.category_id})

        # Adjust the available amounts in the old and new categories
        transaction_amount = transaction_data["amount"]
        old_category_data = old_category_doc.to_dict()
        new_old_available = old_category_data.get("available", 0.0) - transaction_amount
        old_category_ref.update({"available": new_old_available})

        new_new_available = new_category_data.get("available", 0.0) + transaction_amount
        new_category_ref.update({"available": new_new_available})
        
        # logger.info("Transaction category updated successfully for transaction_id: %s", request.transaction_id)
        return {"message": "Transaction category updated successfully.", "transaction_id": request.transaction_id}
    except Exception as e:
        # logger.error("Failed to update transaction category: %s", e)
        raise HTTPException(status_code=500, detail=f"Failed to update transaction category: {e}")