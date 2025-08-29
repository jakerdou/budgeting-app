import sys
import os

# Add the parent directory to Python path for absolute imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.user_routes import router as user_router
from api.category_routes import router as category_router
from api.category_group_routes import router as category_group_router
from api.transaction_routes import router as transaction_router
from api.assignment_routes import router as assignment_router
from api.account_routes import router as account_router
from api.plaid_routes import router as plaid_router
from api.plaid_item_routes import router as plaid_item_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    # allow_origins=["*"],
    allow_origins=["http://localhost:8081", "http://192.168.4.132:19000", "http://172.29.139.81:19000", "http://134.238.187.199:19000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(user_router, prefix="/user")
app.include_router(category_router, prefix="/category")
app.include_router(category_group_router, prefix="/category")
app.include_router(transaction_router, prefix="/transaction")
app.include_router(assignment_router, prefix="/assignment")
app.include_router(account_router, prefix="/account")
app.include_router(plaid_router, prefix="/plaid")
app.include_router(plaid_item_router, prefix="/plaid_item")

@app.get("/")
def read_root():
    return {"message": "Welcome to the combined models and routes API"}
