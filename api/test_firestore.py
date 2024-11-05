import os
from google.cloud import firestore
from google.oauth2 import service_account

# Path to your service account key file
SERVICE_ACCOUNT_FILE = "./budgeting-app-ff37e-firebase-adminsdk-7f0ji-69d5d2e5a8.json"

# Initialize Firestore client
credentials = service_account.Credentials.from_service_account_file(SERVICE_ACCOUNT_FILE)
db = firestore.Client(credentials=credentials)

def test_firestore_connection():
    try:
        # Attempt to fetch the list of collections
        collections = db.collections()
        
        print("Connected to Firestore! Here are the collections:")
        for collection in collections:
            print(f" - {collection.id}")
        
        # Optionally, add a test document
        test_doc_ref = db.collection("test_collection").document("test_document")
        test_doc_ref.set({"test_key": "test_value"})
        print("Test document added successfully.")
        
    except Exception as e:
        print(f"Error connecting to Firestore: {e}")

if __name__ == "__main__":
    test_firestore_connection()
