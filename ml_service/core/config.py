import os
from typing import Optional
from pydantic import BaseModel, Field

class Settings(BaseModel):
    PROJECT_NAME: str = "EduSphere ML Microservice"
    VERSION: str = "2.0.0"
    ENVIRONMENT: str = Field(default=os.getenv("ENVIRONMENT", "development"))
    HOST: str = Field(default=os.getenv("HOST", "0.0.0.0"))
    PORT: int = Field(default=int(os.getenv("PORT", "8001")))
    LOG_LEVEL: str = Field(default=os.getenv("LOG_LEVEL", "INFO"))
    
    # Security: Service-to-Service authentication secret
    ML_SERVICE_SECRET: Optional[str] = Field(default=os.getenv("ML_SERVICE_SECRET", None))
    
    # Database
    MONGO_URI: Optional[str] = Field(default=os.getenv("MONGO_URI", None))
    
    # LLM & Embedding Providers
    GEMINI_API_KEY: Optional[str] = Field(default=os.getenv("GEMINI_API_KEY", os.getenv("LLM_API_KEY", None)))
    EMBEDDING_PROVIDER: str = Field(default=os.getenv("EMBEDDING_PROVIDER", "lexical"))  # lexical | gemini | sentence_transformers
    
    # CORS Configuration
    ALLOWED_ORIGINS: str = Field(default=os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:5000,http://127.0.0.1:5173,http://127.0.0.1:5000"))
    
    # Paths & Limits
    MODEL_STORAGE_PATH: str = Field(default=os.getenv("MODEL_STORAGE_PATH", os.path.join(os.path.dirname(__file__), "..", "models")))
    MAX_REQUEST_SIZE_BYTES: int = 10 * 1024 * 1024  # 10 MB
    MAX_UPLOAD_SIZE_BYTES: int = 10 * 1024 * 1024   # 10 MB
    RATE_LIMIT_PER_MINUTE: int = 120

    def get_cors_origins(self) -> list[str]:
        if self.ENVIRONMENT == "production":
            return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]
        return ["*"] if self.ALLOWED_ORIGINS == "*" else [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]

settings = Settings()
