"""
Main Weave Our Tapestry - FastAPI Server Entry Point
File Description: Starts the backend server and connects everything
Objectives:
- Create FastAPI app
- Register routers
- Initialize database tables
- Add global error handler
- Add logging configuration
"""


from dotenv import load_dotenv
from pathlib import Path

env_path = Path(__file__).resolve().parent / ".env" 
load_dotenv(dotenv_path=env_path)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api.routes import router
from .database.db import engine
from .database.model import Base



app = FastAPI(title="Weave Our Tapestry API")

Base.metadata.create_all(bind=engine)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://weaveourtapestry.netlify.app",
        "https://weaveourtapestrydev.netlify.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "Welcome to our CS250 Group Project"}

app.include_router(router)