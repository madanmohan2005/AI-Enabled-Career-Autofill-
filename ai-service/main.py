import uvicorn
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from config import settings
from models.schemas import (
    FieldSignal,
    FieldMatchResult,
    BatchMatchRequest,
    BatchMatchResponse,
    ParsedResumeResponse
)
from services.semantic_matcher import semantic_matcher
from services.resume_parser import resume_parser
from services.llm_service import llm_service

app = FastAPI(
    title="CareerFill AI Service",
    description="Embeddings, Semantic Field Matching, and Resume Intelligence API",
    version="0.1.0"
)

# Allow Chrome Extension & local services
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {
        "status": "UP",
        "service": "CareerFill AI Service",
        "embedding_model": settings.EMBEDDING_MODEL_NAME,
        "transformer_active": semantic_matcher.model is not None
    }

@app.post("/api/ai/match-field", response_model=FieldMatchResult)
def match_single_field(signal: FieldSignal):
    result = semantic_matcher.match_field(signal)
    # If uncertain and LLM is enabled, attempt LLM fallback
    if result.action == "UNCERTAIN" and settings.LLM_API_KEY:
        llm_result = llm_service.classify_ambiguous_field(signal)
        if llm_result:
            return llm_result
    return result

@app.post("/api/ai/match-fields-batch", response_model=BatchMatchResponse)
def match_batch_fields(request: BatchMatchRequest):
    results = []
    for signal in request.fields:
        res = semantic_matcher.match_field(signal)
        if res.action == "UNCERTAIN" and settings.LLM_API_KEY:
            llm_res = llm_service.classify_ambiguous_field(signal)
            if llm_res:
                res = llm_res
        results.append(res)
    return BatchMatchResponse(results=results)

@app.post("/api/ai/parse-resume", response_model=ParsedResumeResponse)
async def parse_resume(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are currently supported")

    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    try:
        parsed_data = resume_parser.parse_resume(contents)
        return parsed_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process resume: {str(e)}")

if __name__ == "__main__":
    uvicorn.run("main:app", host=settings.HOST, port=settings.PORT, reload=True)
