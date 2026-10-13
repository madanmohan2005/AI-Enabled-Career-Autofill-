import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", 8000))
    EMBEDDING_MODEL_NAME: str = os.getenv("EMBEDDING_MODEL_NAME", "all-MiniLM-L6-v2")
    LLM_API_KEY: str = os.getenv("LLM_API_KEY", "")
    LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "gemini")  # or "openai"
    
    # Confidence thresholds calibrated for sentence-transformers cosine similarity
    CONFIDENCE_HIGH: float = 0.70
    CONFIDENCE_MEDIUM: float = 0.50

settings = Settings()
