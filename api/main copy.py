from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime, timezone
import logging
from google.cloud import firestore
from google.oauth2 import service_account
from typing import Optional

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8081", "http://192.168.4.132:19000", "http://172.29.132.166:19000"],  # Change this to the address of your Expo app
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods
    allow_headers=["*"],  # Allow all headers
)

# Path to your service account key file
SERVICE_ACCOUNT_FILE = "./budgeting-app-firebase-adminsdk.json"
# SERVICE_ACCOUNT_FILE = "./budgeting-app-ff37e-firebase-adminsdk-7f0ji-69d5d2e5a8.json"

# Initialize Firestore client
credentials = service_account.Credentials.from_service_account_file(SERVICE_ACCOUNT_FILE)
db = firestore.Client(credentials=credentials)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

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

class Transaction(BaseModel):
    amount: float
    user_id: str
    category_id: str
    name: str
    date: datetime

class Assignment(BaseModel):
    amount: float
    user_id: str
    category_id: str
    date: datetime

class DeleteTransactionRequest(BaseModel):
    user_id: str
    transaction_id: str

class UpdateTransactionCategoryRequest(BaseModel):
    user_id: str
    transaction_id: str
    category_id: str

class PaySchedule(BaseModel):
    start_date: datetime # change this to optional

class Preferences(BaseModel):
    budget_period: Optional[str] = None
    pay_schedule: Optional[PaySchedule] = None
    # Add other preference fields here as needed

class UpdatePreferencesRequest(BaseModel):
    user_id: str
    preferences: Preferences

# Test Methods
@app.get("/test-connection")
async def test_connection():
    try:
        test_doc = db.collection("test").document("test_doc").get()
        if test_doc.exists:
            return {"message": "Connection to Firestore is successful.", "test_doc": test_doc.to_dict()}
        else:
            return {"message": "Connection to Firestore is successful, but test document does not exist."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Connection to Firestore failed: {e}")

# User Methods
@app.post("/create-user")
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

@app.post("/update-preferences")
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

# Category Methods
@app.post("/get-categories")
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

@app.post("/get-categories-with-allocated")
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

@app.post("/get-allocated")
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

@app.post("/create-category")
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

# Transaction Methods
@app.post("/get-transactions")
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
    
@app.post("/create-transaction")
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

@app.post("/delete-transaction")
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

@app.post("/update-transaction-category")
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

# Assignment Methods
@app.post("/create-assignment")
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
        
        assignment_ref = db.collection("assignments").document()
        assignment_ref.set({
            "amount": assignment.amount,
            "user_id": assignment.user_id,
            "category_id": assignment.category_id,
            "date": assignment.date,
            "created_at": datetime.now(timezone.utc)
        })

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