from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.api import analysis, documents, health
from app.core.config import settings
from app.services.gemini_client import gemini_client

@asynccontextmanager
async def lifespan(app: FastAPI):
    gemini_client.initialize()
    yield

app = FastAPI(
    title="Narrative Intelligence Platform API",
    description="AI-Powered Writer - Script & Content Enhancement System",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/api", tags=["Health"])
app.include_router(analysis.router, prefix="/api/analysis", tags=["Analysis"])
app.include_router(documents.router, prefix="/api/documents", tags=["Documents"])

@app.get("/")
async def root():
    return {"message": "Narrative Intelligence Platform API", "version": "1.0.0"}
