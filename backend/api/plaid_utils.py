import plaid
from plaid.model.transactions_sync_request import TransactionsSyncRequest
from plaid.api import plaid_api
import os
from dotenv import load_dotenv
import json
import datetime

load_dotenv()

# Available environments are
# 'Production'
# 'Sandbox'
configuration = plaid.Configuration(
    host=plaid.Environment.Production,
    api_key={
        'clientId': os.getenv("PLAID_CLIENT_ID"),
        'secret': os.getenv("PLAID_SECRET_PRODUCTION"),
    }
)

api_client = plaid.ApiClient(configuration)
client = plaid_api.PlaidApi(api_client)

def get_plaid_transactions(access_token: str, cursor=None):
    request_data = {"access_token": access_token}
    if cursor is not None:
        request_data["cursor"] = cursor  # Include cursor only if it's not None

    print("Request data:", request_data)
    request = TransactionsSyncRequest(**request_data)
    response = client.transactions_sync(request)

    # Return the full response as is
    return response

def save_cursor(access_token: str, cursor: str):
    # Implement logic to save the cursor, e.g., in a database or file
    pass

def get_saved_cursor(access_token: str) -> str:
    # Implement logic to retrieve the saved cursor, e.g., from a database or file
    return None