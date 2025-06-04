# Budgeting App

A comprehensive personal finance application with Plaid integration for transaction syncing, budget allocation, and expense tracking.

## Project Structure

The project consists of two main parts:
- **Frontend**: React Native app built with Expo
- **Backend**: FastAPI server with Firebase Firestore database

## Setup Instructions

### Prerequisites

- Node.js (v16 or later)
- Python 3.10+ 
- Git (to clone the repository)

### Backend Setup

1. **Set up Python virtual environment**:
   ```bash
   cd backend
   python -m venv api-venv
   
   # On Windows
   Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
   .\api-venv\Scripts\activate
   
   # On macOS/Linux
   source api-venv/bin/activate
   ```

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Firebase and Plaid Configuration**:
   - The required configuration files are already included:
     - `backend/budgeting-app-firebase-adminsdk.json` for Firebase
     - `backend/.env` containing Plaid API credentials
   - No additional setup is needed for these services

4. **Run the backend server**:
   ```bash
   uvicorn main:app --host 0.0.0.0 --reload --reload-dir=./api --reload-dir=./db
   ```
   The server will run at `http://localhost:8000`

5. **API Documentation**:
   - Once the server is running, visit `http://localhost:8000/docs` for interactive API documentation

### Frontend Setup

1. **Install dependencies**:
   ```bash
   cd frontend
   npm install
   ```

2. **Firebase Configuration**:
   - The required `frontend/firebaseConfig.js` file is already included
   - No additional Firebase setup is required

3. **Run the frontend app**:
   ```bash
   npx expo start -c
   ```

4. **Testing on mobile devices**:
   - Install the Expo Go app on your iOS or Android device
   - Scan the QR code from the terminal to open the app

## Key Files and Directories

### Backend

- `main.py`: Entry point for the FastAPI server
- `api/`: Contains all API route handlers
  - `db.py`: Database connection setup
  - `*_routes.py`: Route handlers for various resources
- `db/schemas/`: Pydantic models for data validation
  - `base.py`: Base Firestore model
  - `user.py`, `category.py`, etc.: Schema definitions
- `api-venv/`: Python virtual environment

### Frontend

- `app/`: Main app screens using Expo Router
- `components/`: Reusable React components
- `services/`: API service calls
- `context/`: React context providers
- `hooks/`: Custom React hooks
- `types/`: TypeScript type definitions

## Development Workflow

1. Start the backend server
2. Start the frontend Expo app
3. Make changes to either part - both support hot reloading

## Database Schema

The app uses Firestore with the following collections:
- `users`: User profiles
- `categories`: Budget categories
- `transactions`: Financial transactions
- `assignments`: Budget allocations
- `plaid_items`: Plaid integration data

## Troubleshooting

- **Backend connection issues**: Make sure your virtual environment is activated and dependencies are installed
- **Frontend can't connect to backend**: Check the API base URL in your services configuration
- **Firebase permission denied**: Check your Firebase rules and service account credentials