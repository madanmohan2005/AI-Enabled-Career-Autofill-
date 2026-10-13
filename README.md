# CareerFill — AI-Powered Career Autofill System

CareerFill is a full-stack, AI-powered browser extension system that securely maintains your professional profile and intelligently autofills career, internship, and job application forms across any website.

---

## 🏗️ System Architecture

```text
career-autofill/
├── dist/                     # Production-ready unpacked Chrome Extension (Manifest V3)
├── src/                      # Extension TypeScript & React source code
│   ├── popup/                # Popup UI (Autofill review, Profile editor, Resume AI, Cloud sync)
│   ├── content/              # Injected content script with DOM inspection & MutationObserver
│   ├── detector/             # Field signal detection & 2-tier intelligent classifier
│   ├── filler/               # Form filler (inputs, textareas, selects, checkboxes, radios)
│   └── storage/              # chrome.storage.local profile manager
│
├── backend/                  # Java 17 + Spring Boot REST API
│   ├── pom.xml
│   └── src/main/java/com/careerfill/
│       ├── controller/       # Auth (JWT) & Profile sync endpoints
│       ├── entity/           # MySQL JPA entities (User, Profile, Education, Skills, etc.)
│       ├── security/         # Spring Security 6, BCrypt password hashing, stateless JWT
│       └── service/          # Business logic & MySQL persistence
│
├── ai-service/               # Python + FastAPI AI Microservice
│   ├── main.py               # REST API endpoints & CORS
│   ├── services/
│   │   ├── semantic_matcher.py # Sentence Transformers / Cosine Similarity classifier
│   │   ├── resume_parser.py    # PDF text extraction & structured entity recognition
│   │   └── llm_service.py      # LLM fallback for ambiguous fields
│   ├── Dockerfile
│   └── requirements.txt
│
├── docker-compose.yml        # Orchestrates MySQL 8.0 & Python AI service
└── test-form.html            # Realistic job application form for testing
```

---

## 🚀 Quick Start Guide (End-to-End)

### Step 1: Load the Chrome Extension
1. Open Google Chrome and navigate to `chrome://extensions`.
2. Toggle on **Developer mode** in the top-right corner.
3. Click **Load unpacked**.
4. Select the directory:
   ```
   c:\Users\madan\career-autofill\dist
   ```
5. Pin **CareerFill** to your browser toolbar.

---

### Step 2: Test the Extension with the Test Form
1. Open [`test-form.html`](file:///c:/Users/madan/career-autofill/test-form.html) in Chrome (`file:///c:/Users/madan/career-autofill/test-form.html`).
2. Click the **CareerFill extension icon** in your toolbar.
3. On the **Autofill** tab, click **🔍 Scan Form Fields**.
   - You will see real-time field classifications (Full Name, Email, Phone, College, Degree, CGPA, LinkedIn, GitHub, Skills, etc.) with confidence scores!
4. Click **🚀 Autofill Page**.
   - Watch the form populate instantly with formatted values and gentle green highlight outlines!

---

### Step 3: Run the AI Service (Embeddings & Resume Intelligence)
You can run it via Docker or directly in Python:

**Using Python:**
```powershell
cd c:\Users\madan\career-autofill\ai-service
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python main.py
```
- API Docs: `http://localhost:8000/docs`
- Health: `http://localhost:8000/health`

**Resume Parsing via Extension:**
- In the extension popup, go to the **📄 Resume** tab.
- Upload any PDF resume and click **Parse Resume & Update Profile**.
- AI extracts your contact info, skills, education, and links directly into your CareerFill profile!

---

### Step 4: Run the Backend & Database (Optional Cloud Sync)
1. Start the MySQL database:
   ```powershell
   cd c:\Users\madan\career-autofill
   docker compose up -d mysql
   ```
2. Start the Spring Boot backend:
   ```powershell
   cd c:\Users\madan\career-autofill\backend
   mvn spring-boot:run
   ```
3. In the extension popup under the **🔐 Cloud** tab:
   - Register or sign in to sync your profile securely to your MySQL database.
