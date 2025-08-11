from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime, timezone
from decimal import Decimal
from google.cloud import firestore
from .db import db, NULL_VALUE
from .plaid_utils import get_plaid_transactions, get_saved_cursor  # Assuming helper functions exist for Plaid API calls
from backend.db.schemas import Transaction as TransactionSchema
import logging
import os

# Setup logging for transactions
log_dir = os.path.join(os.path.dirname(__file__), "logs")
os.makedirs(log_dir, exist_ok=True)
transaction_logger = logging.getLogger("transaction_logger")
transaction_logger.setLevel(logging.INFO)
transaction_handler = logging.FileHandler(os.path.join(log_dir, "transaction.log"))
transaction_formatter = logging.Formatter('%(asctime)s - %(message)s')
transaction_handler.setFormatter(transaction_formatter)
transaction_logger.addHandler(transaction_handler)
transaction_logger.propagate = False

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
    amount: Decimal
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
            # logger.info(f"Filtering transactions by category_id: {request.category_id}")
            
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
        
        # Calculate new available amount for the category
        category_data = category_doc.to_dict()
        current_available = Decimal(str(category_data.get("available", 0.0)))
        new_available = current_available + transaction.amount
        
        # Use batch write for atomicity
        batch = db.batch()
        
        # 1. Create the transaction
        transaction_ref = db.collection("transactions").document()
        batch.set(transaction_ref, transaction_schema.to_dict())
        
        # 2. Update category available amount
        batch.update(category_ref, {"available": float(new_available)})
        
        # Execute all writes atomically
        batch.commit()
        
        # Get user email for logging
        user_data = user_doc.to_dict()
        user_email = user_data.get('email', 'Unknown')
        
        # Log transaction creation with category
        transaction_logger.info(f"Transaction created with category - Transaction: '{transaction.name}' (ID: {transaction_ref.id}), Amount: ${transaction.amount}, Category: '{category_data.get('name', 'Unknown')}' (ID: {transaction.category_id}), New category available: ${new_available}, User ID: {transaction.user_id}, User Email: {user_email}")
        
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
        # print(f"Deleting transaction {request.transaction_id} for user {request.user_id}")
        
        transaction_ref = db.collection("transactions").document(request.transaction_id)
        transaction_doc = transaction_ref.get()
        
        if not transaction_doc.exists:
            raise HTTPException(status_code=404, detail="Transaction not found")
        
        transaction_data = transaction_doc.to_dict()
        # print(f"Transaction data: amount={transaction_data['amount']}, category_id={transaction_data.get('category_id')}")
        
        if transaction_data["user_id"] != request.user_id:
            raise HTTPException(status_code=403, detail="User ID does not match the transaction")
        
        category_id = transaction_data.get("category_id")
        new_available = None
        
        if category_id:
            category_ref = db.collection("categories").document(category_id)
            category_doc = category_ref.get()
            
            if not category_doc.exists:
                raise HTTPException(status_code=404, detail="Category not found")
            
            # Calculate new available amount for the category
            category_data = category_doc.to_dict()
            transaction_amount = Decimal(str(transaction_data["amount"]))
            current_available = Decimal(str(category_data.get("available", 0.0)))
            new_available = current_available - transaction_amount
        else:
            print("Transaction has no category - skipping category update")

        # Use batch write for atomicity
        batch = db.batch()
        
        # 1. Delete the transaction
        batch.delete(transaction_ref)
        
        # 2. Update category available amount if transaction had a category
        if category_id and new_available is not None:
            batch.update(category_ref, {"available": float(new_available)})
        
        # Execute all writes atomically
        batch.commit()
        # print(f"Transaction {request.transaction_id} deleted successfully")
        
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
        
        # Get transaction amount for calculations
        transaction_amount = transaction_data["amount"]
        print(f"Transaction amount: {transaction_amount}")
        
        # Get user email for logging
        user_ref = db.collection("users").document(request.user_id)
        user_doc = user_ref.get()
        user_email = "Unknown"
        if user_doc.exists:
            user_data = user_doc.to_dict()
            user_email = user_data.get('email', 'Unknown')

        # Calculate new available amounts before batch operations
        new_old_available = None
        new_new_available = None
        
        if old_category_data:
            old_available = Decimal(str(old_category_data.get("available", 0.0)))
            new_old_available = old_available - Decimal(str(transaction_amount))
            
        if new_category_data:
            new_available = Decimal(str(new_category_data.get("available", 0.0)))
            new_new_available = new_available + Decimal(str(transaction_amount))

        # Use batch write for atomicity
        batch = db.batch()
        
        # 1. Update the transaction's category_id
        if request.category_id == "null" or request.category_id is None:
            batch.update(transaction_ref, {"category_id": None})
        else:
            batch.update(transaction_ref, {"category_id": request.category_id})
        
        # 2. Update old category available amount (subtract transaction amount)
        if old_category_data and old_category_ref:
            batch.update(old_category_ref, {"available": float(new_old_available)})
        
        # 3. Update new category available amount (add transaction amount)
        if new_category_data and new_category_ref:
            batch.update(new_category_ref, {"available": float(new_new_available)})
        
        # Execute all writes atomically
        batch.commit()
        # Log the transaction categorization results
        if new_category_data and new_new_available is not None:
            print(f"Updated new category available amount to {new_new_available}")
            
            # Log transaction categorization
            transaction_logger.info(f"Transaction categorized - Transaction: '{transaction_data.get('name', 'Unknown')}' (ID: {request.transaction_id}), Amount: ${transaction_amount}, New category: '{new_category_data.get('name', 'Unknown')}' (ID: {request.category_id}), New category available: ${new_new_available}, User ID: {request.user_id}, User Email: {user_email}")
        else:
            print("Transaction set to have no category - no new category to update")
            
            # Log transaction uncategorization
            transaction_logger.info(f"Transaction uncategorized - Transaction: '{transaction_data.get('name', 'Unknown')}' (ID: {request.transaction_id}), Amount: ${transaction_amount}, Set to no category, User ID: {request.user_id}, User Email: {user_email}")
        
        if old_category_data and new_old_available is not None:
            print(f"Updated old category available amount to {new_old_available}")
        else:
            print("No old category to update (transaction was uncategorized).")
        
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
                cursor_updates[item_id] = last_cursor        # Process added transactions with batch operations
        print(f"Processing {len(added_transactions)} added transactions")
        print("Debug: Making sure category_id is explicitly set to None")
        
        # Process in batches of 500 (Firestore batch limit)
        batch_size = 500
        total_batches = (len(added_transactions) + batch_size - 1) // batch_size
        successful_batches = 0
        
        for i in range(0, len(added_transactions), batch_size):
            batch_num = (i // batch_size) + 1
            print(f"Processing batch {batch_num}/{total_batches}")
            
            batch = db.batch()
            batch_transactions = added_transactions[i:i + batch_size]
            
            try:
                for transaction in batch_transactions:
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
                    
                    transaction_ref = db.collection("transactions").document()
                    batch.set(transaction_ref, transaction_dict)
                
                # Commit this batch of transactions
                batch.commit()
                successful_batches += 1
                print(f"✅ Successfully created batch {batch_num}/{total_batches} with {len(batch_transactions)} transactions")
                
            except Exception as batch_error:
                print(f"❌ Failed to process batch {batch_num}/{total_batches}: {batch_error}")
                # Continue with next batch rather than failing entirely
                continue
        
        print(f"Completed transaction creation: {successful_batches}/{total_batches} batches successful")

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

        # Now that all transactions have been processed successfully, update the cursors with batch write
        if cursor_updates:
            batch = db.batch()
            for item_id, cursor in cursor_updates.items():
                print(f"Updating cursor for item {item_id} to {cursor}")
                item_ref = db.collection("plaid_items").document(item_id)
                batch.update(item_ref, {"cursor": cursor})
            batch.commit()
            print(f"Updated {len(cursor_updates)} cursors atomically")

        print("Sync completed successfully")
        return {"message": "Transactions synced successfully."}
    except Exception as e:
        print(f"Error during sync: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to sync transactions: {e}")