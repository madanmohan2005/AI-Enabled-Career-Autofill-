import re
import numpy as np
from typing import Dict, List, Tuple, Optional
from config import settings
from models.schemas import FieldSignal, FieldMatchResult

# Canonical concepts as specified in Blueprint Section 7 & 8
CANONICAL_CONCEPTS: Dict[str, Dict] = {
    "FULL_NAME": {
        "profile_field": "fullName",
        "descriptions": [
            "full name", "applicant full name", "candidate name", "enter your full name",
            "complete legal name", "your name"
        ],
        "sensitive": False
    },
    "FIRST_NAME": {
        "profile_field": "firstName",
        "descriptions": [
            "first name", "given name", "forename", "candidate first name",
            "applicant first name", "enter your first name", "legal first name",
            "fname", "first_name", "your first name"
        ],
        "sensitive": False
    },
    "LAST_NAME": {
        "profile_field": "lastName",
        "descriptions": [
            "last name", "family name", "surname", "candidate last name",
            "applicant last name", "enter your last name", "legal last name",
            "lname", "last_name", "your last name"
        ],
        "sensitive": False
    },
    "EMAIL": {
        "profile_field": "email",
        "descriptions": [
            "email address", "e-mail", "primary email", "contact email address", "user email"
        ],
        "sensitive": False
    },
    "PHONE": {
        "profile_field": "phone",
        "descriptions": [
            "mobile no", "mobile number", "mobile", "phone number", "phone no",
            "contact no", "contact number", "mobile phone", "cell number", "cell phone",
            "telephone number", "telephone", "phone", "whatsapp number", "calling number",
            "contact tel", "tel no", "primary mobile", "primary phone", "candidate mobile number",
            "enter mobile number", "mobile no without country code", "handphone",
            "phone mobile", "mobile contact", "phone contact", "contact mobile",
            "your phone number", "your mobile", "mobile phone number", "phone tel",
            "cell mobile", "contact phone", "phone number mobile", "applicant phone",
            "applicant mobile", "phone or mobile", "mobile or phone", "whatsapp mobile",
            "mobile number phone", "enter phone", "enter mobile", "mobile no number"
        ],
        "sensitive": False
    },
    "COLLEGE": {
        "profile_field": "education.college",
        "descriptions": [
            "college name", "university attended", "academic institution", "school or university",
            "higher education institute", "degree granting institution"
        ],
        "sensitive": False
    },
    "DEGREE": {
        "profile_field": "education.degree",
        "descriptions": [
            "degree name", "qualification", "bachelors masters phd", "educational degree", "program of study"
        ],
        "sensitive": False
    },
    "FIELD_OF_STUDY": {
        "profile_field": "education.fieldOfStudy",
        "descriptions": [
            "field of study", "major", "academic major", "area of study", "field of study or major",
            "major or branch of study", "major discipline", "specialization", "course of study", "program major"
        ],
        "sensitive": False
    },
    "BRANCH": {
        "profile_field": "education.branch",
        "descriptions": [
            "branch of study", "major or field of study", "engineering branch", "specialization", "department", "academic discipline"
        ],
        "sensitive": False
    },
    "CGPA": {
        "profile_field": "education.cgpa",
        "descriptions": [
            "cgpa", "gpa grade score", "cumulative grade point average", "academic percentage score", "marks or gpa"
        ],
        "sensitive": False
    },
    "GRADUATION_YEAR": {
        "profile_field": "education.graduationYear",
        "descriptions": [
            "graduation year", "year of passing", "expected graduation date", "batch completion year"
        ],
        "sensitive": False
    },
    "LINKEDIN": {
        "profile_field": "linkedinUrl",
        "descriptions": [
            "linkedin profile url", "linkedin account link", "link to linkedin", "linkedin profile"
        ],
        "sensitive": False
    },
    "GITHUB": {
        "profile_field": "githubUrl",
        "descriptions": [
            "github profile url", "github username link", "link to github repositories", "code portfolio github"
        ],
        "sensitive": False
    },
    "PORTFOLIO": {
        "profile_field": "portfolioUrl",
        "descriptions": [
            "portfolio website link", "personal website url", "personal project link", "online portfolio"
        ],
        "sensitive": False
    },
    "ADDRESS": {
        "profile_field": "address",
        "descriptions": [
            "residential address", "home address", "current city country location", "street address",
            "mailing address", "current residential address", "permanent address", "applicant address",
            "city state zip address", "physical address"
        ],
        "sensitive": False
    },
    "SKILLS": {
        "profile_field": "skills",
        "descriptions": [
            "technical skills", "programming languages and tools", "core competencies", "technologies known", "key skills"
        ],
        "sensitive": False
    },
    "SUMMARY": {
        "profile_field": "summary",
        "descriptions": [
            "professional summary", "about yourself", "cover letter note", "brief introduction", "profile bio"
        ],
        "sensitive": False
    },
    "YEARS_OF_EXPERIENCE": {
        "profile_field": "experience.totalYears",
        "descriptions": [
            "years of experience", "total professional experience", "relevant industry experience in years"
        ],
        "sensitive": True
    },
    "WORK_AUTHORIZATION": {
        "profile_field": "declarations.workAuth",
        "descriptions": [
            "work authorization", "authorized to work in country", "sponsorship required", "visa status"
        ],
        "sensitive": True
    },
    "NOTICE_PERIOD": {
        "profile_field": "declarations.noticePeriod",
        "descriptions": [
            "notice period in days", "how soon can you join", "availability to start", "joining time"
        ],
        "sensitive": True
    },
    "EXPECTED_SALARY": {
        "profile_field": "declarations.expectedSalary",
        "descriptions": [
            "expected salary ctc", "compensation expectation", "desired annual salary", "target remuneration"
        ],
        "sensitive": True
    },
    "JOB_TITLE": {
        "profile_field": "jobTitle",
        "descriptions": [
            "job title", "position title", "current job title", "designation", "role title",
            "professional title", "your job title", "current designation", "applicant title",
            "title of position", "what is your job title", "current position title"
        ],
        "sensitive": False
    },
    "CURRENT_ROLE": {
        "profile_field": "currentRole",
        "descriptions": [
            "current role", "current position", "present role", "current job", "current designation",
            "present designation", "currently working as", "your current role", "existing role",
            "present position", "current employment role"
        ],
        "sensitive": False
    },
    "DESIRED_ROLE": {
        "profile_field": "desiredRole",
        "descriptions": [
            "desired role", "target role", "position applied for", "role applied for",
            "applying for position", "job applied", "position of interest", "preferred role",
            "desired position", "role you are applying for", "position you are applying for",
            "what role are you applying for", "preferred job position", "job preference"
        ],
        "sensitive": False
    }
}

class SemanticMatcher:
    AUTOCOMPLETE_MAP = {
        "name": "full name",
        "given-name": "first name",
        "fname": "first name",
        "family-name": "last name",
        "lname": "last name",
        "email": "email",
        "tel": "phone",
        "tel-national": "phone",
        "street-address": "street address",
        "address-line1": "address",
        "address-line2": "address",
        "address-level2": "city",
        "address-level1": "state",
        "postal-code": "postal code zip",
        "organization": "company organization",
        "organization-title": "job title role"
    }

    def __init__(self):
        self.model = None
        self.vectorizer = None
        self.concept_embeddings: Dict[str, np.ndarray] = {}
        self._init_models()

    def _init_models(self):
        """Attempts to load sentence-transformers, with TF-IDF fallback for lightweight/fast startup."""
        try:
            from sentence_transformers import SentenceTransformer  # type: ignore
            print(f"[SemanticMatcher] Loading SentenceTransformer: {settings.EMBEDDING_MODEL_NAME}")
            self.model = SentenceTransformer(settings.EMBEDDING_MODEL_NAME)
            self._compute_embeddings_transformer()
            print("[SemanticMatcher] SentenceTransformer embeddings initialized.")
        except Exception as e:
            print(f"[SemanticMatcher] Warning: SentenceTransformer not loaded ({e}). Using Sklearn TF-IDF.")
            self._init_tfidf()

    def _compute_embeddings_transformer(self):
        for concept, data in CANONICAL_CONCEPTS.items():
            texts = data["descriptions"]
            embs = self.model.encode(texts, convert_to_numpy=True)
            # Store normalized matrix (N, D) for max-pooling
            norms = np.linalg.norm(embs, axis=1, keepdims=True)
            norms[norms == 0] = 1.0
            self.concept_embeddings[concept] = embs / norms

    def _init_tfidf(self):
        from sklearn.feature_extraction.text import TfidfVectorizer
        all_texts = []
        for concept, data in CANONICAL_CONCEPTS.items():
            all_texts.extend(data["descriptions"])

        self.vectorizer = TfidfVectorizer(ngram_range=(1, 2))
        self.vectorizer.fit(all_texts)
        for concept, data in CANONICAL_CONCEPTS.items():
            matrix = self.vectorizer.transform(data["descriptions"]).toarray()
            norms = np.linalg.norm(matrix, axis=1, keepdims=True)
            norms[norms == 0] = 1.0
            self.concept_embeddings[concept] = matrix / norms

    def extract_signal_text(self, signal: FieldSignal) -> str:
        tokens = []

        # 1. Input type is a HARD SIGNAL - tel/phone type means it IS a phone field
        #    Add multiple strong phone phrases so embedding always wins for phone
        if signal.input_type and signal.input_type.lower() in ["tel", "phone"]:
            tokens.append("mobile phone number")
            tokens.append("phone number")
            tokens.append("mobile number")
            tokens.append("contact number")

        # 2. Autocomplete attribute is explicit and high fidelity
        if signal.autocomplete:
            auto_val = signal.autocomplete.lower().strip()
            if auto_val in self.AUTOCOMPLETE_MAP:
                tokens.append(self.AUTOCOMPLETE_MAP[auto_val])
            else:
                tokens.append(self._normalize_text(signal.autocomplete))

        # 3. Label text and aria-label are the highest fidelity human descriptions
        if signal.label_text:
            cleaned_label = re.sub(r'[*:\(\)]', ' ', signal.label_text)
            tokens.append(self._normalize_text(cleaned_label))
        if signal.aria_label:
            cleaned_aria = re.sub(r'[*:\(\)]', ' ', signal.aria_label)
            tokens.append(self._normalize_text(cleaned_aria))

        # 4. Form control name & id (excluding random generated IDs)
        if signal.name:
            norm_name = self._normalize_text(signal.name)
            if not norm_name.startswith("cf field"):
                tokens.append(norm_name)
        if signal.html_id:
            norm_id = self._normalize_text(signal.html_id)
            if not norm_id.startswith("cf field"):
                tokens.append(norm_id)

        # 5. Placeholder: for tel input always include; for others filter descriptively
        if signal.placeholder:
            norm_ph = self._normalize_text(signal.placeholder)
            is_tel = signal.input_type and signal.input_type.lower() in ["tel", "phone"]
            descriptive_words = {
                "name", "email", "phone", "mobile", "contact", "cell", "tel",
                "address", "degree", "major", "study", "college", "university",
                "enter", "select", "type", "gpa", "year", "number", "no"
            }
            if is_tel or any(w in norm_ph for w in descriptive_words):
                tokens.append(norm_ph)

        # 6. Surrounding text (up to 80 chars)
        if signal.surrounding_text:
            cleaned_surr = re.sub(r'[*:\(\)]', ' ', signal.surrounding_text[:80])
            tokens.append(self._normalize_text(cleaned_surr))

        # Join all tokens - do NOT deduplicate aggressively (repeated phone terms reinforce the signal)
        combined = " ".join(t for t in tokens if t)
        # Only collapse actual duplicate consecutive words
        combined = re.sub(r'\b(\w+)( \1)+\b', r'\1', combined)
        return re.sub(r'\s+', ' ', combined).strip()

    def _normalize_text(self, text: str) -> str:
        # Convert camelCase, snake_case, kebab-case to space separated words
        s1 = re.sub(r'(.)([A-Z][a-z]+)', r'\1 \2', text)
        s2 = re.sub(r'([a-z0-9])([A-Z])', r'\1 \2', s1)
        s3 = s2.replace('_', ' ').replace('-', ' ').replace('.', ' ')
        # Expand common form abbreviations: 'mobile no' -> 'mobile number', 'phone no' -> 'phone number'
        s3 = re.sub(r'\b(no|no\.|num|nbr)\b', 'number', s3, flags=re.IGNORECASE)
        s3 = re.sub(r'\bmob\b', 'mobile', s3, flags=re.IGNORECASE)
        return re.sub(r'\s+', ' ', s3).strip().lower()

    def match_field(self, signal: FieldSignal) -> FieldMatchResult:
        # FAST PATH: If input_type is "tel" or "phone", it IS a phone field - no embedding needed
        if signal.input_type and signal.input_type.lower() in ["tel", "phone"]:
            return FieldMatchResult(
                element_id=signal.element_id,
                detected_concept="PHONE",
                confidence_score=0.99,
                action="SAFE_AUTOFILL",
                mapped_profile_field="phone",
                rationale="Hard override: input type=tel/phone is definitively a phone number field"
            )

        query_text = self.extract_signal_text(signal)
        if not query_text:
            return FieldMatchResult(
                element_id=signal.element_id,
                detected_concept="UNKNOWN",
                confidence_score=0.0,
                action="UNCERTAIN",
                mapped_profile_field="",
                rationale="No text signals found on field"
            )

        # Compute query vector
        if self.model:
            q_vec = self.model.encode([query_text], convert_to_numpy=True)[0]
        else:
            q_vec = self.vectorizer.transform([query_text]).toarray()[0]

        q_norm = np.linalg.norm(q_vec)
        if q_norm > 0:
            q_vec = q_vec / q_norm

        best_concept = "UNKNOWN"
        best_score = 0.0
        best_desc = ""

        # Max-pooling cosine similarity against individual descriptions per concept
        for concept, c_matrix in self.concept_embeddings.items():
            scores = np.dot(c_matrix, q_vec)
            score = float(np.max(scores))
            if score > best_score:
                best_score = score
                best_concept = concept
                best_desc_idx = int(np.argmax(scores))
                best_desc = CANONICAL_CONCEPTS[concept]["descriptions"][best_desc_idx]

        is_sensitive = CANONICAL_CONCEPTS.get(best_concept, {}).get("sensitive", False)
        mapped_field = CANONICAL_CONCEPTS.get(best_concept, {}).get("profile_field", "")

        confidence = max(0.0, min(1.0, best_score))

        if confidence >= settings.CONFIDENCE_HIGH and not is_sensitive:
            action = "SAFE_AUTOFILL"
            rationale = f"High similarity ({confidence:.2f}) to concept '{best_concept}' (closest phrase: '{best_desc}')"
        elif confidence >= settings.CONFIDENCE_MEDIUM or (confidence >= settings.CONFIDENCE_HIGH and is_sensitive):
            action = "REQUIRES_CONFIRMATION"
            if is_sensitive:
                rationale = f"Sensitive field detected ('{best_concept}'); requires user confirmation"
            else:
                rationale = f"Moderate similarity ({confidence:.2f}) to concept '{best_concept}' (closest phrase: '{best_desc}')"
        else:
            action = "UNCERTAIN"
            rationale = f"Low confidence match ({confidence:.2f}); best guess was '{best_concept}'"

        return FieldMatchResult(
            element_id=signal.element_id,
            detected_concept=best_concept if confidence >= 0.40 else "UNKNOWN",
            confidence_score=round(confidence, 3),
            action=action,
            mapped_profile_field=mapped_field if confidence >= 0.40 else "",
            rationale=rationale
        )

semantic_matcher = SemanticMatcher()
