from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime, timezone
from google.cloud import firestore
from .db import db, NULL_VALUE
from .plaid_utils import get_plaid_transactions, get_saved_cursor  # Assuming helper functions exist for Plaid API calls
from backend.db.schemas import Transaction as TransactionSchema
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

class User(BaseModel):
    email: str
    user_id: str

# Request model for the POST request
class UserIDRequest(BaseModel):
    user_id: str
    category_id: str = None
    limit: int = 20  # Default number of transactions per page
    cursor_id: str = None  # Document ID to start after for pagination

class Category(BaseModel):
    name: str
    user_id: str

class Transaction(BaseModel):
    amount: float
    user_id: str
    category_id: str
    name: str
    date: str

class DeleteTransactionRequest(BaseModel):
    user_id: str
    transaction_id: str

class UpdateTransactionCategoryRequest(BaseModel):
    user_id: str
    transaction_id: str
    category_id: str

class SyncPlaidTransactionsRequest(BaseModel):
    user_id: str

@router.post("/get-transactions")
async def get_transactions(request: UserIDRequest):
    try:
        # print(f"Request received: user_id={request.user_id}, category_id={request.category_id}, limit={request.limit}, cursor_id={request.cursor_id}")
        
        # Start with the basic user_id filter
        transactions_query = db.collection("transactions").where("user_id", "==", request.user_id)
        
        # If a category_id is provided, add that filter
        if request.category_id:
            logger.info(f"Filtering transactions by category_id: {request.category_id}")
            
            # Special case for handling "null" category - find transactions with no category
            if request.category_id == "null":
                print("Filtering for null category_id")
                # Use NULL_VALUE (None) for consistent null value handling
                transactions_query = db.collection("transactions").where("user_id", "==", request.user_id).where("category_id", "==", NULL_VALUE)
                
                print(f"Using NULL_VALUE to query for transactions with null category_id")
            else:
                transactions_query = db.collection("transactions").where("user_id", "==", request.user_id).where("category_id", "==", request.category_id)
        
        # Sort by date in descending order (most recent first)
        transactions_query = transactions_query.order_by("date", direction=firestore.Query.DESCENDING)
        
        # If cursor_id is provided, start after that document for pagination
        if request.cursor_id:
            # Get the document to use as cursor
            cursor_doc = db.collection("transactions").document(request.cursor_id).get()
            if cursor_doc.exists:
                transactions_query = transactions_query.start_after(cursor_doc)
                print(f"Starting after document with ID: {request.cursor_id}")
            else:
                print(f"Cursor document with ID {request.cursor_id} not found")
        
        # Limit the number of results
        transactions_query = transactions_query.limit(request.limit)
        
        # Execute the query
        transactions_docs = transactions_query.stream()

        # Collect transactions into a list, converting each document to a dictionary
        transactions = []
        last_doc_id = None
        
        for doc in transactions_docs:
            transaction_data = doc.to_dict()
            transaction_data["id"] = doc.id  # Add the transaction ID to the response
            
            # Store the last document ID for pagination
            last_doc_id = doc.id
            
            # Debug the category ID situation
            # print(f"Transaction {doc.id} category_id = {transaction_data.get('category_id')}")
            
            # Remove or handle any unserializable fields here, if necessary
            transactions.append(transaction_data)

        # Sort transactions by date (most to least recent)
        # Note: This should be unnecessary since we're already sorting in the query
        # transactions.sort(key=lambda x: x["date"], reverse=True)

        # Determine if there are more results
        has_more = len(transactions) == request.limit
        
        # Return the transactions along with pagination metadata
        return {
            "transactions": transactions,
            "pagination": {
                "has_more": has_more,
                "next_cursor": last_doc_id if has_more else None
            }
        }
    
    except Exception as e:
        logger.error(f"Failed to get transactions for user_id: {request.user_id}, error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get transactions: {str(e)}")
    
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
        
        # Create a validated transaction using our schema
        transaction_schema = TransactionSchema(
            amount=transaction.amount,
            user_id=transaction.user_id,
            category_id=transaction.category_id,
            name=transaction.name,
            date=transaction.date,
            type="debit" if transaction.amount < 0 else "credit"
        )
        
        # Convert to dict and save to Firestore
        transaction_ref = db.collection("transactions").document()
        transaction_ref.set(transaction_schema.to_dict())
        
        if category_doc.exists:
            category_data = category_doc.to_dict()
            new_available = category_data.get("available", 0.0) + transaction.amount
            category_ref.update({"available": new_available})
        
        # logger.info("Transaction created successfully with ID: %s", transaction_ref.id)
        return {"message": "Transaction created successfully.", "transaction_id": transaction_ref.id}
    except ValueError as e:
        # This will catch validation errors from the Pydantic model
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        # logger.error("Failed to create transaction: %s", e)
        raise HTTPException(status_code=500, detail=f"Failed to create transaction: {str(e)}")

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
        print(f"Received request to update transaction category: {request}")
        
        transaction_ref = db.collection("transactions").document(request.transaction_id)
        transaction_doc = transaction_ref.get()
        
        if not transaction_doc.exists:
            print(f"Transaction with ID {request.transaction_id} not found.")
            raise HTTPException(status_code=404, detail="Transaction not found")
        
        transaction_data = transaction_doc.to_dict()
        print(f"Transaction data: {transaction_data}")
        
        if transaction_data["user_id"] != request.user_id:
            print(f"User ID mismatch: {transaction_data['user_id']} != {request.user_id}")
            raise HTTPException(status_code=403, detail="User ID does not match the transaction")
        
        old_category_id = transaction_data.get("category_id")
        old_category_ref = db.collection("categories").document(old_category_id) if old_category_id else None
        old_category_doc = old_category_ref.get() if old_category_ref and callable(old_category_ref.get) else None
        
        if old_category_id and old_category_doc and not old_category_doc.exists:
            print(f"Old category with ID {old_category_id} not found.")
            raise HTTPException(status_code=404, detail="Old category not found")
        
        old_category_data = old_category_doc.to_dict() if old_category_doc else None
        print(f"Old category data: {old_category_data}")
        
        # Check if the category is already the same - no need to update
        normalized_old_category_id = old_category_id if old_category_id else None
        normalized_new_category_id = None if (request.category_id == "null" or request.category_id is None) else request.category_id
        
        if normalized_old_category_id == normalized_new_category_id:
            print(f"Category is already the same ({normalized_old_category_id}), no update needed")
            return {"message": "Transaction category is already set to the requested category.", "transaction_id": request.transaction_id}
        
        # Handle setting category to null/None
        if request.category_id == "null" or request.category_id is None:
            print(f"Setting transaction {request.transaction_id} to have no category")
            new_category_data = None
            new_category_ref = None
        else:
            new_category_ref = db.collection("categories").document(request.category_id)
            new_category_doc = new_category_ref.get() if callable(new_category_ref.get) else None
            
            if not new_category_doc or not new_category_doc.exists:
                print(f"New category with ID {request.category_id} not found.")
                raise HTTPException(status_code=404, detail="New category not found")
            
            new_category_data = new_category_doc.to_dict()
            print(f"New category data: {new_category_data}")
            
            if new_category_data["user_id"] != request.user_id:
                print(f"New category user ID mismatch: {new_category_data['user_id']} != {request.user_id}")
                raise HTTPException(status_code=403, detail="New category does not belong to the user")
          # Update the transaction's category_id
        if request.category_id == "null" or request.category_id is None:
            print(f"Setting transaction {request.transaction_id} to have no category (null)")
            transaction_ref.update({"category_id": None})
        else:
            print(f"Updating transaction {request.transaction_id} to new category {request.category_id}")
            transaction_ref.update({"category_id": request.category_id})

        # Adjust the available amounts in the old and new categories
        transaction_amount = transaction_data["amount"]
        print(f"Transaction amount: {transaction_amount}")
        
        if old_category_data:
            print(f"Old category available before update: {old_category_data.get('available', 0.0)}")
            new_old_available = old_category_data.get("available", 0.0) - transaction_amount
            old_category_ref.update({"available": new_old_available})
            print(f"Updated old category available amount to {new_old_available}")
        else:
            print("No old category to update (transaction was uncategorized).")
        
        # Only update the new category if it's not null
        if new_category_data:
            print(f"New category available before update: {new_category_data.get('available', 0.0)}")
            new_new_available = new_category_data.get("available", 0.0) + transaction_amount
            new_category_ref.update({"available": new_new_available})
            print(f"Updated new category available amount to {new_new_available}")
        else:
            print("Transaction set to have no category - no new category to update")
        
        print(f"Transaction category updated successfully for transaction_id: {request.transaction_id}")
        return {"message": "Transaction category updated successfully.", "transaction_id": request.transaction_id}
    except Exception as e:
        print(f"Error updating transaction category: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to update transaction category: {e}")

@router.post("/sync-plaid-transactions")
async def sync_plaid_transactions(request: SyncPlaidTransactionsRequest):
    try:
        print(f"Starting sync for user_id: {request.user_id}")
        
        user_id = request.user_id
        plaid_items_query = db.collection("plaid_items").where("user_id", "==", user_id)
        plaid_items_docs = list(plaid_items_query.stream())  # Convert to list so we can iterate twice

        added_transactions = []
        modified_transactions = []
        deleted_transactions = []
        
        # Keep track of which item each transaction belongs to
        transaction_item_map = {}
        
        # Store cursor updates to apply later
        cursor_updates = {}

        for item_doc in plaid_items_docs:
            item_data = item_doc.to_dict()
            item_id = item_doc.id
            print(f"Processing Plaid item: {item_data['institution_name']}")
            # print(f"Processing Plaid item with access_token: {item_data['access_token']}")
            
            saved_cursor = item_data.get("cursor")
            has_more = True
            last_cursor = None

            while has_more:
                plaid_response = get_plaid_transactions(item_data["access_token"], cursor=saved_cursor)
                # print(f"Fetched transactions from Plaid: {plaid_response}")

                # Save the new cursor value (but don't update the database yet)
                new_cursor = plaid_response.get("next_cursor")
                if new_cursor:
                    last_cursor = new_cursor
                    saved_cursor = new_cursor

                # Associate each transaction with this Plaid item's data
                for trans in plaid_response.get("added", []):
                    transaction_item_map[trans["transaction_id"]] = item_data
                
                for trans in plaid_response.get("modified", []):
                    transaction_item_map[trans["transaction_id"]] = item_data
                
                for trans in plaid_response.get("removed", []):
                    transaction_item_map[trans["transaction_id"]] = item_data

                added_transactions.extend(plaid_response.get("added", []))
                modified_transactions.extend(plaid_response.get("modified", []))
                deleted_transactions.extend(plaid_response.get("removed", []))

                # Check if there are more transactions to sync
                has_more = plaid_response.get("has_more", False)
                print(f"Has more transactions: {has_more}")
            
            # Store the last cursor for this item to update later
            if last_cursor:
                cursor_updates[item_id] = last_cursor        # Process added transactions
        print(f"Processing {len(added_transactions)} added transactions")
        print("Debug: Making sure category_id is explicitly set to None")
        for transaction in added_transactions:
            # Get the correct item_data for this transaction
            item_data = transaction_item_map.get(transaction["transaction_id"])
            if not item_data:
                print(f"Warning: No item data found for transaction {transaction['transaction_id']}")
                continue

            print(f"Adding transaction: {transaction['transaction_id']}")

            account_name = next(
                (account["name"] for account in item_data.get("accounts", []) if account["account_id"] == transaction["account_id"]),
                None
            )              
            # Create a validated transaction using our schema
            transaction_schema = TransactionSchema(
                amount=-transaction["amount"],
                name=transaction["name"],
                date=transaction['date'].strftime("%Y-%m-%d"),
                user_id=user_id,
                plaid_transaction_id=transaction["transaction_id"],
                institution_name=item_data["institution_name"],
                account_name=account_name,
                category_id=None  # Explicitly set category_id to None for new transactions
            )
            
            # Create explicit transaction data dictionary
            transaction_dict = {
                "amount": -transaction["amount"],
                "name": transaction["name"],
                "date": transaction['date'].strftime("%Y-%m-%d"),
                "user_id": user_id,
                "plaid_transaction_id": transaction["transaction_id"],
                "institution_name": item_data["institution_name"],
                "account_name": account_name,
                "category_id": NULL_VALUE,  # Use the explicit NULL_VALUE constant
                "created_at": datetime.now(timezone.utc),
                "type": "debit" if -transaction["amount"] < 0 else "credit"
            }
            
            print(f"Debug direct dictionary with NULL_VALUE: {transaction_dict}")
            
            transaction_ref = db.collection("transactions").document()
            # Use merge=False to ensure fields are set exactly as provided
            transaction_ref.set(transaction_dict, merge=False)
            
            # Verify the document was created with the category_id field
            created_doc = transaction_ref.get()
            created_data = created_doc.to_dict()
            print(f"Debug created document data: {created_data}")
            print(f"Debug created document has category_id: {'category_id' in created_data}")

        # Process modified transactions
        print(f"Processing {len(modified_transactions)} modified transactions")
        for transaction in modified_transactions:
            # Get the correct item_data for this transaction
            item_data = transaction_item_map.get(transaction["transaction_id"])
            if not item_data:
                print(f"Warning: No item data found for modified transaction {transaction['transaction_id']}")
                continue
                
            print(f"Modifying transaction: {transaction['transaction_id']}")

            account_name = next(
                (account["name"] for account in item_data.get("accounts", []) if account["account_id"] == transaction["account_id"]),
                None
            )
            existing_query = db.collection("transactions").where("plaid_transaction_id", "==", transaction["transaction_id"]).where("user_id", "==", user_id)
            existing_docs = existing_query.stream()
            existing_doc = next(existing_docs, None)

            if existing_doc:
                print(f"Updating existing transaction with ID: {existing_doc.id}")
                existing_doc.reference.update({
                    "amount": -transaction["amount"] if transaction["amount"] > 0 else transaction["amount"],
                    "name": transaction["name"],
                    "date": transaction['date'].strftime("%Y-%m-%d")
                })
            else:
                print(f"Creating new transaction for modified transaction: {transaction['transaction_id']}")
                  # Create a validated transaction using our schema
                transaction_schema = TransactionSchema(
                    amount=-transaction["amount"],
                    name=transaction["name"],
                    date=transaction['date'].strftime("%Y-%m-%d"),
                    user_id=user_id,
                    plaid_transaction_id=transaction["transaction_id"],
                    institution_name=item_data["institution_name"],
                    account_name=account_name,
                    category_id=None  # Explicitly set category_id to None for modified transactions
                )
                
                # Create explicit transaction data dictionary
                transaction_dict = {
                    "amount": -transaction["amount"],
                    "name": transaction["name"],
                    "date": transaction['date'].strftime("%Y-%m-%d"),
                    "user_id": user_id,
                    "plaid_transaction_id": transaction["transaction_id"],
                    "institution_name": item_data["institution_name"],
                    "account_name": account_name,
                    "category_id": NULL_VALUE,  # Use the explicit NULL_VALUE constant
                    "created_at": datetime.now(timezone.utc),
                    "type": "debit" if -transaction["amount"] < 0 else "credit"
                }
                
                print(f"Debug modified transaction with NULL_VALUE: {transaction_dict}")
                
                transaction_ref = db.collection("transactions").document()
                # Use merge=False to ensure fields are set exactly as provided
                transaction_ref.set(transaction_dict, merge=False)

        # Process deleted transactions
        print(f"Processing {len(deleted_transactions)} deleted transactions")
        for transaction in deleted_transactions:
            print(f"Deleting transaction: {transaction['transaction_id']}")
            existing_query = db.collection("transactions").where("plaid_transaction_id", "==", transaction["transaction_id"]).where("user_id", "==", user_id)
            existing_docs = existing_query.stream()

            for doc in existing_docs:
                print(f"Deleting transaction with ID: {doc.id}")
                doc.reference.delete()

        # Now that all transactions have been processed successfully, update the cursors
        for item_id, cursor in cursor_updates.items():
            print(f"Updating cursor for item {item_id} to {cursor}")
            db.collection("plaid_items").document(item_id).update({"cursor": cursor})

        print("Sync completed successfully")
        return {"message": "Transactions synced successfully."}
    except Exception as e:
        print(f"Error during sync: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to sync transactions: {e}")