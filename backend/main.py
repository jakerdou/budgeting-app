from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.user_routes import router as user_router
from api.category_routes import router as category_router
from api.transaction_routes import router as transaction_router
from api.assignment_routes import router as assignment_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8081", "http://192.168.4.132:19000", "http://172.29.134.86:19000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(user_router, prefix="/user")
app.include_router(category_router, prefix="/category")
app.include_router(transaction_router, prefix="/transaction")
app.include_router(assignment_router, prefix="/assignment")

@app.get("/")
def read_root():
    return {"message": "Welcome to the combined models and routes API"}
