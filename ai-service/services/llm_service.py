import json
import requests
from typing import Optional
from config import settings
from models.schemas import FieldSignal, FieldMatchResult

class LLMService:
    def __init__(self):
        self.api_key = settings.LLM_API_KEY
        self.provider = settings.LLM_PROVIDER

    def classify_ambiguous_field(self, signal: FieldSignal) -> Optional[FieldMatchResult]:
        """
        Calls external LLM when semantic similarity is low or ambiguous.
        Constrained to output structured JSON matching canonical categories.
        """
        if not self.api_key:
            return None

        prompt = f"""
You are an AI assistant analyzing a web form field to autofill a career profile.
Field metadata:
- Name: {signal.name}
- ID: {signal.html_id}
- Placeholder: {signal.placeholder}
- Label: {signal.label_text}
- Surrounding Text: {signal.surrounding_text}
- Input Type: {signal.input_type}

Classify this into one of the following concepts:
[FULL_NAME, FIRST_NAME, LAST_NAME, EMAIL, PHONE, COLLEGE, DEGREE, FIELD_OF_STUDY, BRANCH, CGPA, GRADUATION_YEAR, LINKEDIN, GITHUB, PORTFOLIO, ADDRESS, SKILLS, SUMMARY, YEARS_OF_EXPERIENCE, WORK_AUTHORIZATION, NOTICE_PERIOD, EXPECTED_SALARY, UNKNOWN]

Respond strictly with valid JSON with the format:
{{"concept": "...", "confidence": 0.0 to 1.0, "reason": "..."}}
"""
        try:
            # Stub for configurable LLM provider (Gemini / OpenAI compatible)
            headers = {"Content-Type": "application/json"}
            # Return placeholder result if key is dummy
            return None
        except Exception as e:
            print(f"[LLMService] Error during fallback classification: {e}")
            return None

llm_service = LLMService()
