// src/storage/profileStorage.ts
// Handles local profile storage in chrome.storage.local and backend sync

export interface EducationEntry {
  college: string;
  university?: string;
  degree: string;
  fieldOfStudy?: string;
  branch: string;
  cgpa: string;
  graduationYear: string;
}

export interface ProjectEntry {
  name: string;
  description: string;
  technologies: string;
  githubUrl: string;
}

export interface ExperienceEntry {
  company: string;
  role: string;
  startDate: string;
  endDate: string;
  description: string;
}

export interface SecondaryEducation {
  tenthSchool?: string;
  tenthBoard?: string;
  tenthPercentage?: string;
  tenthYear?: string;
  twelfthSchool?: string;
  twelfthBoard?: string;
  twelfthPercentage?: string;
  twelfthYear?: string;
  twelfthStream?: string; // Science / Commerce / Arts
}

export interface UserProfile {
  // ── Identity ──────────────────────────────────────────────────────────
  fullName: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  email: string;
  phone: string;
  alternatePhone?: string;
  dob?: string;            // ISO date: YYYY-MM-DD
  gender?: string;
  nationality?: string;
  languages?: string;      // comma-separated spoken languages
  maritalStatus?: string;

  // ── Location breakdown ────────────────────────────────────────────────
  address: string;         // full address (single line)
  city?: string;
  state?: string;
  country?: string;
  pinCode?: string;        // ZIP / Postal code

  // ── Professional summary & role ───────────────────────────────────────
  summary?: string;
  jobTitle?: string;
  currentRole?: string;
  desiredRole?: string;
  totalYearsExperience?: string;  // e.g. "3" or "3.5"
  currentCompany?: string;
  currentCTC?: string;     // current salary / CTC

  // ── Links ─────────────────────────────────────────────────────────────
  linkedinUrl: string;
  githubUrl: string;
  portfolioUrl: string;

  // ── Education ─────────────────────────────────────────────────────────
  education: EducationEntry[];
  secondaryEducation?: SecondaryEducation;

  // ── Skills ────────────────────────────────────────────────────────────
  skills: string[];

  // ── Projects & Experience ─────────────────────────────────────────────
  projects: ProjectEntry[];
  experience: ExperienceEntry[];

  // ── Documents (sensitive) ─────────────────────────────────────────────
  panNumber?: string;
  passportNumber?: string;
  drivingLicense?: string;

  // ── Declarations (sensitive) ──────────────────────────────────────────
  declarations?: {
    workAuth?: string;
    noticePeriod?: string;
    expectedSalary?: string;
    currentSalary?: string;
    veteranStatus?: string;
    disabilityStatus?: string;
  };
}

export const DEFAULT_PROFILE: UserProfile = {
  // Identity
  fullName: "Alex Rivera",
  firstName: "Alex",
  lastName: "Rivera",
  middleName: "",
  email: "alex.rivera@example.com",
  phone: "+1 (555) 234-5678",
  alternatePhone: "",
  dob: "2001-05-15",
  gender: "Male",
  nationality: "Indian",
  languages: "English, Hindi",
  maritalStatus: "Single",

  // Location
  address: "742 Evergreen Terrace, Springfield, OR 97477",
  city: "Springfield",
  state: "Oregon",
  country: "United States",
  pinCode: "97477",

  // Professional
  summary: "Full-Stack Software Engineer with experience in React, TypeScript, Python, and Java.",
  jobTitle: "Software Engineer",
  currentRole: "Software Engineer",
  desiredRole: "Full-Stack Software Engineer / Backend Engineer",
  totalYearsExperience: "2",
  currentCompany: "Tech Innovators Inc",
  currentCTC: "$85,000",

  // Links
  linkedinUrl: "https://linkedin.com/in/alexrivera-dev",
  githubUrl: "https://github.com/alexrivera-code",
  portfolioUrl: "https://alexrivera.dev",

  // Education
  education: [
    {
      college: "Stanford University",
      university: "Stanford University",
      degree: "Bachelor of Science",
      fieldOfStudy: "Computer Science",
      branch: "Computer Science",
      cgpa: "3.85",
      graduationYear: "2024"
    }
  ],
  secondaryEducation: {
    twelfthSchool: "Springfield High School",
    twelfthBoard: "CBSE",
    twelfthPercentage: "92.4",
    twelfthYear: "2019",
    twelfthStream: "Science",
    tenthSchool: "Springfield Middle School",
    tenthBoard: "CBSE",
    tenthPercentage: "94.6",
    tenthYear: "2017"
  },

  skills: ["React", "TypeScript", "Python", "FastAPI", "Java", "Spring Boot", "MySQL", "Docker", "Git"],

  projects: [
    {
      name: "CareerFill AI",
      description: "Intelligent career form autofill browser extension with semantic matching",
      technologies: "TypeScript, Python, FastAPI, Spring Boot",
      githubUrl: "https://github.com/alexrivera-code/career-autofill"
    }
  ],

  experience: [
    {
      company: "Tech Innovators Inc",
      role: "Software Engineering Intern",
      startDate: "2023-06",
      endDate: "2023-09",
      description: "Built scalable REST APIs and modernized frontend dashboard with React."
    }
  ],

  // Documents
  panNumber: "",
  passportNumber: "",
  drivingLicense: "",

  // Declarations
  declarations: {
    workAuth: "Authorized to work in US without sponsorship",
    noticePeriod: "Immediate / 2 weeks",
    expectedSalary: "$110,000",
    currentSalary: "$85,000",
    veteranStatus: "Not a Veteran",
    disabilityStatus: "No"
  }
};

export async function getLocalProfile(): Promise<UserProfile> {
  return new Promise((resolve) => {
    if (typeof chrome !== "undefined" && chrome.storage?.local) {
      chrome.storage.local.get(["userProfile"], (result) => {
        if (result.userProfile) {
          const prof = { ...DEFAULT_PROFILE, ...result.userProfile } as UserProfile;
          // Auto-derive firstName/lastName from fullName if missing
          if ((!prof.firstName || !prof.lastName) && prof.fullName) {
            const parts = prof.fullName.trim().split(/\s+/);
            if (!prof.firstName) prof.firstName = parts[0] || '';
            if (!prof.lastName) prof.lastName = parts.slice(1).join(' ') || '';
          }
          // Auto-derive city/state/country from address if missing
          if (!prof.address) prof.address = DEFAULT_PROFILE.address;
          // Ensure fieldOfStudy / branch consistency
          if (prof.education && prof.education.length > 0) {
            prof.education = prof.education.map(e => ({
              ...e,
              fieldOfStudy: e.fieldOfStudy || e.branch || '',
              branch: e.branch || e.fieldOfStudy || ''
            }));
          }
          resolve(prof);
        } else {
          chrome.storage.local.set({ userProfile: DEFAULT_PROFILE });
          resolve(DEFAULT_PROFILE);
        }
      });
    } else {
      resolve(DEFAULT_PROFILE);
    }
  });
}

export async function saveLocalProfile(profile: UserProfile): Promise<void> {
  return new Promise((resolve) => {
    if (typeof chrome !== "undefined" && chrome.storage?.local) {
      chrome.storage.local.set({ userProfile: profile }, () => {
        resolve();
      });
    } else {
      resolve();
    }
  });
}

export async function getAuthToken(): Promise<string | null> {
  return new Promise((resolve) => {
    if (typeof chrome !== "undefined" && chrome.storage?.local) {
      chrome.storage.local.get(["authToken"], (res) => {
        resolve(res.authToken || null);
      });
    } else {
      resolve(null);
    }
  });
}

export async function setAuthToken(token: string | null): Promise<void> {
  return new Promise((resolve) => {
    if (typeof chrome !== "undefined" && chrome.storage?.local) {
      if (token) {
        chrome.storage.local.set({ authToken: token }, resolve);
      } else {
        chrome.storage.local.remove(["authToken"], resolve);
      }
    } else {
      resolve();
    }
  });
}
