from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db import Base, engine
from app.routers import auth

# Create DB tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Speech Therapy API")

# ✅ Add CORS Middleware
origins = [
    "http://localhost:3000",  # React frontend
    "http://127.0.0.1:3000",  # sometimes React uses this
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,          # domains allowed
    allow_credentials=True,
    allow_methods=["*"],            # allow all methods (POST, GET, PUT, DELETE, etc.)
    allow_headers=["*"],            # allow all headers
)

# Include routes
app.include_router(auth.router)
