from google.cloud import firestore
from google.oauth2 import service_account

# Path to your service account key file
SERVICE_ACCOUNT_FILE = "./budgeting-app-firebase-adminsdk.json"
# SERVICE_ACCOUNT_FILE = "./budgeting-app-ff37e-firebase-adminsdk-7f0ji-69d5d2e5a8.json"

# Initialize Firestore client
credentials = service_account.Credentials.from_service_account_file(SERVICE_ACCOUNT_FILE)
db = firestore.Client(credentials=credentials)