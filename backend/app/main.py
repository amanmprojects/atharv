from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import analyze_router, enhance_router, transform_router

app = FastAPI(
    title="AI Writer - Script & Content Enhancement System",
    description="Intelligent writing assistant for narrative consistency, content enhancement, and style transformation",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analyze_router, prefix="/api")
app.include_router(enhance_router, prefix="/api")
app.include_router(transform_router, prefix="/api")


@app.get("/")
async def root():
    return {
        "message": "AI Writer API",
        "version": "1.0.0",
        "endpoints": {
            "analyze": "/api/analyze",
            "enhance": "/api/enhance",
            "transform": "/api/transform"
        }
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
