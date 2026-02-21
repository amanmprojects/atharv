from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    PROJECT_NAME: str = "Narrative Intelligence Platform"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"

    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ]
    ALLOWED_ORIGIN_REGEX: str = r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$"

    LLM_PROVIDER: str = "gemini"
    GEMINI_API_KEY: str = ""
    GOOGLE_NL_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-1.5-flash"
    OPENAI_COMPAT_API_KEY: str = ""
    OPENAI_COMPAT_BASE_URL: str = ""
    OPENAI_EMBEDDING_MODEL: str = "gemini-embedding-001"
    OPENAI_EMBEDDING_INPUT_TYPE: str = "SEMANTIC_SIMILARITY"

    LLM_MAX_CALLS_PER_DOC: int = 10
    SIMILARITY_THRESHOLD: float = 0.85
    TRANSITION_SIMILARITY_PROVIDER: str = "lexical"

    # Firebase / GCP
    GOOGLE_CLOUD_PROJECT: str = ""
    GOOGLE_CLOUD_REGION: str = "us-central1"
    FIREBASE_STORAGE_BUCKET: str = ""

    class Config:
        env_file = (".env", "backend/.env")
        case_sensitive = True


settings = Settings()
