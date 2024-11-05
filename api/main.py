from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime, timezone
import logging
from google.cloud import firestore
from google.oauth2 import service_account

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8081", "http://192.168.4.132:19000", "http://172.29.146.9:19000"],  # Change this to the address of your Expo app
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
        logger.info("Creating a new user with email: %s", user.email)
        user_ref = db.collection("users").document(user.user_id)
        user_ref.set({
            "email": user.email,
            "created_at": datetime.now(timezone.utc)
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

        logger.info("User created successfully with ID: %s", user_ref.id)
        return {"message": "User created successfully.", "user_id": user_ref.id}
    except Exception as e:
        logger.error("Failed to create user: %s", e)
        raise HTTPException(status_code=500, detail=f"Failed to create user: {e}")

# Category Methods
@app.post("/get-categories")
async def get_categories(request: UserIDRequest):
    try:
        logger.info("Fetching categories for user_id: %s", request.user_id)
        
        # Query categories with a `user` field equal to `user_ref`
        logger.info("Querying categories for user_ref: %s", request.user_id)
        categories_query = db.collection("categories").where("user_id", "==", request.user_id)
        categories_docs = categories_query.stream()

        # Collect categories into a list, converting each document to a dictionary
        categories = []
        for doc in categories_docs:
            category_data = doc.to_dict()
            category_data["id"] = doc.id  # Add the category ID to the response
            
            # Remove or handle any unserializable fields here, if necessary
            
            categories.append(category_data)

        logger.info("Successfully fetched categories for user_id: %s", request.user_id)
        logger.info("Categories: %s", categories)
        return {"categories": categories}
    
    except Exception as e:
        logger.error("Failed to get categories for user_id: %s, error: %s", request.user_id, e)
        raise HTTPException(status_code=500, detail=f"Failed to get categories: %e")

@app.post("/create-category")
async def create_category(category: Category):
    try:
        user_ref = db.collection("users").document(category.user_id)
        user_doc = user_ref.get()
        if not user_doc.exists:
            raise HTTPException(status_code=404, detail="User not found")

        logger.info("Creating a new category with name: %s", category.name)
        category_ref = db.collection("categories").document()
        category_ref.set({
            "name": category.name,
            "user_id": category.user_id,
            "available": 0.0,
            "is_unallocated_funds": False,
            "created_at": datetime.now(timezone.utc)
        })
        logger.info("Category created successfully with ID: %s", category_ref.id)
        return {"message": "Category created successfully.", "category_id": category_ref.id}
    except Exception as e:
        logger.error("Failed to create category: %s", e)
        raise HTTPException(status_code=500, detail=f"Failed to create category: %e")

# Transaction Methods
@app.post("/get-transactions")
async def get_transactions(request: UserIDRequest):
    try:
        logger.info("Fetching transactions for user_id: %s", request.user_id)
        
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

        logger.info("Successfully fetched transactions for user_id: %s", request.user_id)
        logger.info("Transactions: %s", transactions)
        return {"transactions": transactions}
    
    except Exception as e:
        logger.error("Failed to get transactions for user_id: %s, error: %s", request.user_id, e)
        raise HTTPException(status_code=500, detail=f"Failed to get transactions: %e")
    
@app.post("/create-transaction")
async def create_transaction(transaction: Transaction):
    try:
        logger.info("Creating a new transaction with name: %s for user_id: %s and category_id: %s", transaction.name, transaction.user_id, transaction.category_id)
        
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
        
        logger.info("Transaction created successfully with ID: %s", transaction_ref.id)
        return {"message": "Transaction created successfully.", "transaction_id": transaction_ref.id}
    except Exception as e:
        logger.error("Failed to create transaction: %s", e)
        raise HTTPException(status_code=500, detail=f"Failed to create transaction: %e")

# Assignment Methods
@app.post("/create-assignment")
async def create_assignment(assignment: Assignment):
    try:
        logger.info("Creating a new assignment for user_id: %s and category_id: %s", assignment.user_id, assignment.category_id)
        
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

        logger.info("Assignment created successfully with ID: %s", assignment_ref.id)
        return {"message": "Assignment created successfully.", "assignment_id": assignment_ref.id}
    except Exception as e:
        logger.error("Failed to create assignment: %s", e)
        raise HTTPException(status_code=500, detail=f"Failed to create assignment: %e")