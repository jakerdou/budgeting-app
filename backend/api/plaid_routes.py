from .db import db
import time
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import plaid
from plaid.api import plaid_api
from plaid.model.link_token_create_request import LinkTokenCreateRequest
from plaid.model.products import Products
from plaid.model.country_code import CountryCode
from plaid.model.link_token_create_request_user import LinkTokenCreateRequestUser
from plaid.model.item_public_token_exchange_request import ItemPublicTokenExchangeRequest
from plaid.model.item_public_token_exchange_response import ItemPublicTokenExchangeResponse
from dotenv import load_dotenv
import os
import logging
from datetime import datetime, timezone
from backend.db.schemas import PlaidItem as PlaidItemSchema

load_dotenv()

# Initialize FastAPI router
router = APIRouter()

# Set up Plaid environment variables
PLAID_CLIENT_ID = os.getenv("PLAID_CLIENT_ID")
PLAID_SECRET_PRODUCTION = os.getenv("PLAID_SECRET_PRODUCTION")
PLAID_SECRET_SANDBOX = os.getenv("PLAID_SECRET_SANDBOX")
CLIENT_NAME = 'Budgeting App'

# Create logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
logger.info(f'plaidd {PLAID_CLIENT_ID} {PLAID_SECRET_PRODUCTION} {PLAID_SECRET_SANDBOX}')

# Initialize Plaid API client
configuration = plaid.Configuration(
    host=plaid.Environment.Production,
    api_key={
        'clientId': PLAID_CLIENT_ID,
        'secret': PLAID_SECRET_PRODUCTION,
        'plaidVersion': '2020-09-14'
    }
)

api_client = plaid.ApiClient(configuration)
client = plaid_api.PlaidApi(api_client)

class LinkTokenResponse(BaseModel):
    link_token: str

class Account(BaseModel):
    # user_id: str
    account_id: str
    name: str
    # access_token: str
    type: str

class ExchangePublicTokenRequest(BaseModel):
    public_token: str
    user_id: str
    accounts: list[Account]
    institution_name: str

class ExchangePublicTokenResponse(BaseModel):
    access_token: str
    item_id: str

@router.get("/get-link-token", response_model=LinkTokenResponse)
async def get_link_token():
    try:
        # Create a link token request
        request = LinkTokenCreateRequest(
            products=[Products("transactions")],
            client_name=CLIENT_NAME,
            country_codes=[CountryCode("US")],
            language="en",
            user=LinkTokenCreateRequestUser(client_user_id=str(time.time())),
        )
        # Create link token
        response = client.link_token_create(request)
        logger.info(f"Link token created: {response.link_token}")

        return {"link_token": response.link_token}
    
    except Exception as e:
        logger.error(f"Error creating link token: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

async def create_account(account: Account, user_id: str, access_token: str):
    try:
        # Ensure the user exists
        user_ref = db.collection("users").document(user_id)
        user_doc = user_ref.get()
        if not user_doc.exists:
            raise HTTPException(status_code=404, detail="User not found")

        # Create a new account document in the 'accounts' collection
        account_ref = db.collection("accounts").document()
        account_ref.set({
            "user_id": user_id,
            "account_id": account.account_id,
            "name": account.name,
            "access_token": access_token,
            "type": account.type,
            "created_at": datetime.now(timezone.utc),  # Add creation timestamp
        })

        return {"message": "Account created successfully.", "account_id": account_ref.id}
    
    except Exception as e:
        # If something goes wrong, raise an HTTPException
        raise HTTPException(status_code=500, detail=f"Failed to create account: {str(e)}")
    
async def create_plaid_item(request: ExchangePublicTokenRequest, access_token: str, item_id: str):
    try:
        # Ensure the user exists
        user_ref = db.collection("users").document(request.user_id)
        user_doc = user_ref.get()
        if not user_doc.exists:
            raise HTTPException(status_code=404, detail="User not found")

        # Create a validated plaid item using our schema
        plaid_item_schema = PlaidItemSchema(
            user_id=request.user_id,
            access_token=access_token,
            item_id=item_id,
            institution_id=item_id,  # Using item_id as institution_id if not provided
            institution_name=request.institution_name,
            accounts=[account.dict() for account in request.accounts],
            cursor=None
        )
        
        # Create a new plaid item document in the 'plaid_items' collection
        plaid_item_ref = db.collection("plaid_items").document()
        plaid_item_ref.set(plaid_item_schema.to_dict())

        return {"message": "Plaid item created successfully.", "plaid_item_id": plaid_item_ref.id}
    
    except ValueError as e:
        # Catch validation errors from the schema
        raise HTTPException(status_code=400, detail=f"Invalid plaid item data: {str(e)}")
    except Exception as e:
        # If something goes wrong, raise an HTTPException
        raise HTTPException(status_code=500, detail=f"Failed to create plaid item: {str(e)}")

# Endpoint to exchange the public token for an access token and then store it and 
# create a plaid item and accounts in the database
@router.post("/exchange-public-token", response_model=ExchangePublicTokenResponse)
async def exchange_public_token(request: ExchangePublicTokenRequest):
    try:
        # Create the request object for Plaid
        exchange_request = ItemPublicTokenExchangeRequest(public_token=request.public_token)
        
        # Call Plaid API to exchange the public token for an access token
        response: ItemPublicTokenExchangeResponse = client.item_public_token_exchange(exchange_request)
        
        access_token = response.access_token
        item_id = response.item_id
        logger.info(f"Access token received: {access_token}")


        await create_plaid_item(request, access_token, item_id)

        return {"access_token": access_token, "item_id": item_id}
    
    except Exception as e:
        logger.error(f"Error exchanging public token: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
