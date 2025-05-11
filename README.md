# Budgeting App

cd frontend
npx expo start -c

cd backend
.\api-venv\Scripts\activate
uvicorn main:app --host 0.0.0.0 --reload --reload-dir=./api --reload-dir=./db