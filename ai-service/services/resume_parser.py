import re
import io
from typing import List, Optional
from pypdf import PdfReader
from models.schemas import ParsedResumeResponse, EducationItem, ProjectItem, ExperienceItem

EMAIL_REGEX = r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+'
PHONE_REGEX = r'(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}'
LINKEDIN_REGEX = r'(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+'
GITHUB_REGEX = r'(?:https?:\/\/)?(?:www\.)?github\.com\/[a-zA-Z0-9_-]+'
PORTFOLIO_REGEX = r'(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9_-]+\.(?:dev|me|io|tech|com)'

COMMON_SKILLS = [
    "python", "java", "javascript", "typescript", "c++", "c#", "go", "rust", "php",
    "react", "react.js", "next.js", "angular", "vue", "html", "css", "tailwind",
    "spring boot", "django", "fastapi", "flask", "node.js", "express",
    "sql", "mysql", "postgresql", "mongodb", "redis", "docker", "kubernetes",
    "aws", "gcp", "azure", "git", "github", "linux", "rest api", "graphql",
    "machine learning", "deep learning", "nlp", "pandas", "numpy", "tensorflow", "pytorch"
]

class ResumeParser:

    def extract_text_from_pdf(self, file_bytes: bytes) -> str:
        pdf_file = io.BytesIO(file_bytes)
        reader = PdfReader(pdf_file)
        full_text = []
        for page in reader.pages:
            text = page.extract_text()
            if text:
                full_text.append(text)
        return "\n".join(full_text)

    def parse_resume(self, file_bytes: bytes) -> ParsedResumeResponse:
        raw_text = self.extract_text_from_pdf(file_bytes)
        lines = [line.strip() for line in raw_text.splitlines() if line.strip()]

        # 1. Contact info
        email_match = re.search(EMAIL_REGEX, raw_text)
        email = email_match.group(0) if email_match else None

        phone_match = re.search(PHONE_REGEX, raw_text)
        phone = phone_match.group(0) if phone_match else None

        linkedin_match = re.search(LINKEDIN_REGEX, raw_text, re.IGNORECASE)
        linkedin_url = linkedin_match.group(0) if linkedin_match else None

        github_match = re.search(GITHUB_REGEX, raw_text, re.IGNORECASE)
        github_url = github_match.group(0) if github_match else None

        portfolio_match = re.search(PORTFOLIO_REGEX, raw_text, re.IGNORECASE)
        portfolio_url = None
        if portfolio_match:
            candidate = portfolio_match.group(0)
            if "linkedin" not in candidate and "github" not in candidate:
                portfolio_url = candidate

        # Candidate Name heuristic: look in first 8 lines
        full_name = None
        first_name = None
        last_name = None
        # Job title heuristic: detected as headline line just below name
        job_title = None
        JOB_TITLE_KEYWORDS = [
            "engineer", "developer", "designer", "analyst", "manager", "architect",
            "consultant", "scientist", "researcher", "lead", "intern", "specialist",
            "director", "coordinator", "associate", "administrator", "officer"
        ]
        for line in lines[:8]:
            clean_line = re.sub(r'[^a-zA-Z\s]', ' ', line).strip()
            words = clean_line.split()
            if not re.search(EMAIL_REGEX, line) and not re.search(PHONE_REGEX, line) and 2 <= len(words) <= 4:
                lower_line = line.lower()
                exclude_words = ["resume", "curriculum", "page", "developer", "engineer", "software", "portfolio", "profile", "contact", "experience", "education", "skills"]
                if not any(w in lower_line for w in exclude_words):
                    full_name = clean_line
                    first_name = words[0]
                    last_name = " ".join(words[1:])
                    break

        # Extract job title: look for a headline-style line with job title keywords (lines 1-5)
        for line in lines[1:6]:
            ll = line.lower()
            if any(kw in ll for kw in JOB_TITLE_KEYWORDS):
                # Skip if it's a section header or clearly company name
                if not re.search(r'\b(experience|education|skills|project|achievement)\b', ll, re.I):
                    job_title = line.strip()
                    break

        # 2. Extract Skills
        extracted_skills = []
        lower_text = raw_text.lower()
        for skill in COMMON_SKILLS:
            # Word boundary matching
            pattern = r'\b' + re.escape(skill) + r'\b'
            if re.search(pattern, lower_text):
                extracted_skills.append(skill.title() if len(skill) > 3 else skill.upper())

        # 3. Extract Education (heuristic pattern matching)
        education_list = []
        edu_keywords = ["bachelor", "master", "b.tech", "btech", "m.tech", "mtech", "b.e", "be", "m.e", "me", "b.s", "bs", "m.s", "ms", "bca", "mca", "bba", "mba", "ph.d", "phd", "degree", "diploma"]
        majors_list = [
            "computer science", "information technology", "data science", "artificial intelligence",
            "machine learning", "software engineering", "electrical engineering", "mechanical engineering",
            "electronics", "civil engineering", "business administration", "mathematics", "physics"
        ]

        for idx, line in enumerate(lines):
            line_lower = line.lower()
            if any(k in line_lower for k in edu_keywords):
                edu_item = EducationItem()
                edu_item.degree = line

                # Look for year (4-digit number e.g., 2020-2024 or 2024)
                year_match = re.search(r'\b(20\d{2}|19\d{2})\b', line)
                if year_match:
                    edu_item.graduation_year = year_match.group(1)

                # Look for CGPA / GPA
                cgpa_match = re.search(r'(?:cgpa|gpa|score)[\s:]*([0-9.]+)', line_lower)
                if cgpa_match:
                    edu_item.cgpa = cgpa_match.group(1)

                # Look around surrounding lines for college name
                college_keywords = ["university", "institute", "college", "school", "academy", "iit", "nit", "bits", "stanford", "mit", "harvard"]
                if idx > 0 and any(ck in lines[idx-1].lower() for ck in college_keywords):
                    edu_item.college = lines[idx-1]
                elif idx + 1 < len(lines) and any(ck in lines[idx+1].lower() for ck in college_keywords):
                    edu_item.college = lines[idx+1]
                elif any(ck in line_lower for ck in college_keywords):
                    edu_item.college = line

                # Extract Field of Study / Major
                major_match = re.search(r'(?:in|major[\s:]+|field of study[\s:]+|branch[\s:]+|discipline[\s:]+)([A-Za-z\s&]{3,40})', line, re.IGNORECASE)
                if major_match:
                    fos = major_match.group(1).strip()
                    edu_item.field_of_study = fos
                    edu_item.branch = fos
                else:
                    for m in majors_list:
                        if m in line_lower or (idx > 0 and m in lines[idx-1].lower()) or (idx + 1 < len(lines) and m in lines[idx+1].lower()):
                            edu_item.field_of_study = m.title()
                            edu_item.branch = m.title()
                            break

                education_list.append(edu_item)

        # Address heuristic from top contact lines
        address = None
        for line in lines[1:8]:
            if not re.search(EMAIL_REGEX, line) and not re.search(PHONE_REGEX, line) and not re.search(r'https?://', line):
                # Match "City, State/Country" or zip patterns
                if re.search(r'([A-Za-z\s]{3,25},\s*[A-Za-z\s]{2,20})', line) or re.search(r'\b\d{5,6}\b', line):
                    if not any(header in line.lower() for header in ["developer", "engineer", "resume", "github", "linkedin"]):
                        address = line.strip()
                        break

        # 4. Extract Projects & Experience stubs
        projects = []
        experience = []

        return ParsedResumeResponse(
            full_name=full_name,
            first_name=first_name,
            last_name=last_name,
            email=email,
            phone=phone,
            address=address,
            summary=lines[2] if len(lines) > 2 and len(lines[2]) > 40 else None,
            job_title=job_title,
            current_role=job_title,
            desired_role=None,  # cannot be inferred from resume text alone
            linkedin_url=linkedin_url,
            github_url=github_url,
            portfolio_url=portfolio_url,
            education=education_list,
            skills=list(dict.fromkeys(extracted_skills)),  # deduplicate
            projects=projects,
            experience=experience,
            raw_text_length=len(raw_text)
        )

resume_parser = ResumeParser()
