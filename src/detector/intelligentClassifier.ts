// src/detector/intelligentClassifier.ts
import { FieldSignal } from './fieldDetector';
import { UserProfile } from '../storage/profileStorage';

export interface FieldMappingResult {
  element_id: string;
  detected_concept: string;
  confidence_score: number;
  action: 'SAFE_AUTOFILL' | 'REQUIRES_CONFIRMATION' | 'UNCERTAIN';
  valueToFill: string;
  fieldLabel: string;
}

const SENSITIVE_CONCEPTS = new Set([
  'EXPECTED_SALARY', 'CURRENT_SALARY', 'WORK_AUTHORIZATION', 'NOTICE_PERIOD',
  'YEARS_OF_EXPERIENCE', 'PAN_NUMBER', 'PASSPORT_NUMBER', 'DRIVING_LICENSE',
  'DATE_OF_BIRTH', 'VETERAN_STATUS', 'DISABILITY_STATUS', 'CURRENT_CTC'
]);

// Rule keywords map for instantaneous high-confidence client-side matching
const HEURISTIC_PATTERNS: Record<string, { regex: RegExp; concept: string; field: string }> = {
  // ── Identity ─────────────────────────────────────────────────────────────
  FULL_NAME: {
    regex: /(full[\s_-]?name|candidate[\s_-]?name|applicant[\s_-]?name|your[\s_-]?name|^name$|legal[\s_-]?name)/i,
    concept: 'FULL_NAME', field: 'fullName'
  },
  FIRST_NAME: {
    regex: /(first[\s_-]?name|given[\s_-]?name|forename|^fname$)/i,
    concept: 'FIRST_NAME', field: 'firstName'
  },
  MIDDLE_NAME: {
    regex: /(middle[\s_-]?name|middle[\s_-]?initial)/i,
    concept: 'MIDDLE_NAME', field: 'middleName'
  },
  LAST_NAME: {
    regex: /(last[\s_-]?name|surname|family[\s_-]?name|^lname$)/i,
    concept: 'LAST_NAME', field: 'lastName'
  },
  EMAIL: {
    regex: /(e[\s_-]?mail|email[\s_-]?address)/i,
    concept: 'EMAIL', field: 'email'
  },
  PHONE: {
    regex: /(phone|mobile|mob|tel|cell|whatsapp|contact[\s_-]*(no|num|number|mobile|phone|tel)|mobile[\s_-]*(no|num|number)|phone[\s_-]*(no|num|number)|calling[\s_-]*(no|number)|handphone|primary[\s_-]*(mobile|phone)|candidate[\s_-]*mobile)/i,
    concept: 'PHONE', field: 'phone'
  },
  ALTERNATE_PHONE: {
    regex: /(alternate[\s_-]?(phone|mobile|number)|alternative[\s_-]?(phone|mobile)|secondary[\s_-]?(phone|mobile|number)|other[\s_-]?(phone|mobile)|backup[\s_-]?(phone|number))/i,
    concept: 'ALTERNATE_PHONE', field: 'alternatePhone'
  },
  DATE_OF_BIRTH: {
    regex: /(date[\s_-]?of[\s_-]?birth|birth[\s_-]?date|dob|^age$|born[\s_-]?on|birthday)/i,
    concept: 'DATE_OF_BIRTH', field: 'dob'
  },
  GENDER: {
    regex: /(gender|sex[\s_-]?identity|^sex$|male[\s_-]?female|applicant[\s_-]?gender)/i,
    concept: 'GENDER', field: 'gender'
  },
  NATIONALITY: {
    regex: /(nationality|citizenship|country[\s_-]?of[\s_-]?citizenship|national[\s_-]?identity|citizen)/i,
    concept: 'NATIONALITY', field: 'nationality'
  },
  LANGUAGES: {
    regex: /(language|languages[\s_-]?known|spoken[\s_-]?language|fluent[\s_-]?in|language[\s_-]?proficiency)/i,
    concept: 'LANGUAGES', field: 'languages'
  },
  MARITAL_STATUS: {
    regex: /(marital[\s_-]?status|marriage[\s_-]?status|civil[\s_-]?status|family[\s_-]?status)/i,
    concept: 'MARITAL_STATUS', field: 'maritalStatus'
  },

  // ── Location ──────────────────────────────────────────────────────────────
  ADDRESS: {
    regex: /(address|location|residence|street[\s_-]?address|mailing[\s_-]?address|residential[\s_-]?address|permanent[\s_-]?address)/i,
    concept: 'ADDRESS', field: 'address'
  },
  CITY: {
    regex: /(^city$|city[\s_-]?name|current[\s_-]?city|home[\s_-]?city|applicant[\s_-]?city|town[\s_-]?city)/i,
    concept: 'CITY', field: 'city'
  },
  STATE: {
    regex: /(^state$|state[\s_-]?province|province|^region$|state[\s_-]?name)/i,
    concept: 'STATE', field: 'state'
  },
  COUNTRY: {
    regex: /(^country$|country[\s_-]?name|country[\s_-]?of[\s_-]?residence|home[\s_-]?country)/i,
    concept: 'COUNTRY', field: 'country'
  },
  PIN_CODE: {
    regex: /(pin[\s_-]?code|zip[\s_-]?code|postal[\s_-]?code|pincode|zipcode|zip[\s_-]?pin)/i,
    concept: 'PIN_CODE', field: 'pinCode'
  },

  // ── Education: Graduation ─────────────────────────────────────────────────
  COLLEGE: {
    regex: /(college|university|institution|school|academic[\s_-]?institute)/i,
    concept: 'COLLEGE', field: 'education.college'
  },
  DEGREE: {
    regex: /(degree|qualification|program[\s_-]?of[\s_-]?study)/i,
    concept: 'DEGREE', field: 'education.degree'
  },
  FIELD_OF_STUDY: {
    regex: /(field[\s_-]?of[\s_-]?study|area[\s_-]?of[\s_-]?study|major|discipline|specialization|academic[\s_-]?major)/i,
    concept: 'FIELD_OF_STUDY', field: 'education.fieldOfStudy'
  },
  BRANCH: {
    regex: /(branch[\s_-]?of[\s_-]?study|^branch$)/i,
    concept: 'BRANCH', field: 'education.branch'
  },
  CGPA: {
    regex: /(cgpa|gpa|percentage|grade[\s_-]?score|academic[\s_-]?score)/i,
    concept: 'CGPA', field: 'education.cgpa'
  },
  GRADUATION_YEAR: {
    regex: /(grad[\s_-]?year|graduation|year[\s_-]?of[\s_-]?passing|batch|passing[\s_-]?year)/i,
    concept: 'GRADUATION_YEAR', field: 'education.graduationYear'
  },

  // ── Education: 12th / Secondary ───────────────────────────────────────────
  TWELFTH_PERCENTAGE: {
    regex: /(12th[\s_-]?(percentage|marks|score|cgpa|gpa)|class[\s_-]?12|hsc[\s_-]?(marks|percentage|score)|higher[\s_-]?secondary[\s_-]?(marks|score|percentage|result)|inter[\s_-]?(marks|percentage)|\+2[\s_-]?(marks|percentage|score))/i,
    concept: 'TWELFTH_PERCENTAGE', field: 'secondaryEducation.twelfthPercentage'
  },
  TWELFTH_SCHOOL: {
    regex: /(12th[\s_-]?(school|college|institution)|higher[\s_-]?secondary[\s_-]?(school|institution)|hsc[\s_-]?(school|institution)|inter[\s_-]?(college|school))/i,
    concept: 'TWELFTH_SCHOOL', field: 'secondaryEducation.twelfthSchool'
  },
  TWELFTH_BOARD: {
    regex: /(12th[\s_-]?board|hsc[\s_-]?board|higher[\s_-]?secondary[\s_-]?board|board[\s_-]?12th|inter[\s_-]?board)/i,
    concept: 'TWELFTH_BOARD', field: 'secondaryEducation.twelfthBoard'
  },
  TWELFTH_YEAR: {
    regex: /(12th[\s_-]?year|year[\s_-]?of[\s_-]?12th|12th[\s_-]?passing[\s_-]?year|hsc[\s_-]?year)/i,
    concept: 'TWELFTH_YEAR', field: 'secondaryEducation.twelfthYear'
  },

  // ── Education: 10th / Matriculation ──────────────────────────────────────
  TENTH_PERCENTAGE: {
    regex: /(10th[\s_-]?(percentage|marks|score|cgpa|gpa)|class[\s_-]?10|ssc[\s_-]?(marks|percentage|score)|matriculation[\s_-]?(marks|score|percentage)|matric[\s_-]?(marks|percentage)|10[\s_-]?std[\s_-]?(marks|percentage))/i,
    concept: 'TENTH_PERCENTAGE', field: 'secondaryEducation.tenthPercentage'
  },
  TENTH_SCHOOL: {
    regex: /(10th[\s_-]?(school|institution)|ssc[\s_-]?(school|institution)|matriculation[\s_-]?school|matric[\s_-]?school)/i,
    concept: 'TENTH_SCHOOL', field: 'secondaryEducation.tenthSchool'
  },
  TENTH_BOARD: {
    regex: /(10th[\s_-]?board|ssc[\s_-]?board|matriculation[\s_-]?board|board[\s_-]?10th|matric[\s_-]?board)/i,
    concept: 'TENTH_BOARD', field: 'secondaryEducation.tenthBoard'
  },

  // ── Links ────────────────────────────────────────────────────────────────
  LINKEDIN: {
    regex: /(linkedin)/i,
    concept: 'LINKEDIN', field: 'linkedinUrl'
  },
  GITHUB: {
    regex: /(github|git[\s_-]?repo)/i,
    concept: 'GITHUB', field: 'githubUrl'
  },
  PORTFOLIO: {
    regex: /(portfolio|personal[\s_-]?website|personal[\s_-]?url|personal[\s_-]?link)/i,
    concept: 'PORTFOLIO', field: 'portfolioUrl'
  },

  // ── Skills & Summary ─────────────────────────────────────────────────────
  SKILLS: {
    regex: /(skill|technologies|tools|competenc)/i,
    concept: 'SKILLS', field: 'skills'
  },
  SUMMARY: {
    regex: /(summary|about[\s_-]?you|bio|cover[\s_-]?letter|introduction|describe[\s_-]?yourself)/i,
    concept: 'SUMMARY', field: 'summary'
  },

  // ── Job Role ─────────────────────────────────────────────────────────────
  JOB_TITLE: {
    regex: /(job[\s_-]?title|position[\s_-]?title|designation|professional[\s_-]?title)/i,
    concept: 'JOB_TITLE', field: 'jobTitle'
  },
  CURRENT_ROLE: {
    regex: /(current[\s_-]?role|current[\s_-]?position|present[\s_-]?role|current[\s_-]?designation|currently[\s_-]?working)/i,
    concept: 'CURRENT_ROLE', field: 'currentRole'
  },
  DESIRED_ROLE: {
    regex: /(desired[\s_-]?role|target[\s_-]?role|position[\s_-]?applied|role[\s_-]?applied|applying[\s_-]?for|preferred[\s_-]?role|desired[\s_-]?position)/i,
    concept: 'DESIRED_ROLE', field: 'desiredRole'
  },
  CURRENT_COMPANY: {
    regex: /(current[\s_-]?company|current[\s_-]?employer|present[\s_-]?company|organization[\s_-]?name|employer[\s_-]?name|company[\s_-]?working)/i,
    concept: 'CURRENT_COMPANY', field: 'currentCompany'
  },

  // ── Experience & Compensation ─────────────────────────────────────────────
  YEARS_OF_EXPERIENCE: {
    regex: /(years?[\s_-]?of[\s_-]?experience|total[\s_-]?experience|work[\s_-]?experience[\s_-]?years|professional[\s_-]?experience|experience[\s_-]?years)/i,
    concept: 'YEARS_OF_EXPERIENCE', field: 'totalYearsExperience'
  },
  EXPECTED_SALARY: {
    regex: /(expected[\s_-]?salary|expected[\s_-]?ctc|desired[\s_-]?salary|target[\s_-]?salary|compensation[\s_-]?expected|salary[\s_-]?expectation)/i,
    concept: 'EXPECTED_SALARY', field: 'declarations.expectedSalary'
  },
  CURRENT_CTC: {
    regex: /(current[\s_-]?ctc|current[\s_-]?salary|present[\s_-]?salary|existing[\s_-]?salary|last[\s_-]?drawn[\s_-]?salary)/i,
    concept: 'CURRENT_CTC', field: 'currentCTC'
  },

  // ── Declarations ─────────────────────────────────────────────────────────
  WORK_AUTHORIZATION: {
    regex: /(work[\s_-]?auth|authorized[\s_-]?to[\s_-]?work|visa[\s_-]?status|sponsorship|work[\s_-]?permit|employment[\s_-]?authorization)/i,
    concept: 'WORK_AUTHORIZATION', field: 'declarations.workAuth'
  },
  NOTICE_PERIOD: {
    regex: /(notice[\s_-]?period|availability|joining[\s_-]?time|when[\s_-]?can[\s_-]?you[\s_-]?join|start[\s_-]?date)/i,
    concept: 'NOTICE_PERIOD', field: 'declarations.noticePeriod'
  },
  VETERAN_STATUS: {
    regex: /(veteran|military[\s_-]?service|armed[\s_-]?forces|served[\s_-]?military)/i,
    concept: 'VETERAN_STATUS', field: 'declarations.veteranStatus'
  },
  DISABILITY_STATUS: {
    regex: /(disability|disabled|differently[\s_-]?abled|handicap|special[\s_-]?needs)/i,
    concept: 'DISABILITY_STATUS', field: 'declarations.disabilityStatus'
  },

  // ── Documents (sensitive) ─────────────────────────────────────────────────
  PAN_NUMBER: {
    regex: /(pan[\s_-]?(number|no|card)|permanent[\s_-]?account[\s_-]?number)/i,
    concept: 'PAN_NUMBER', field: 'panNumber'
  },
  PASSPORT_NUMBER: {
    regex: /(passport[\s_-]?(number|no))/i,
    concept: 'PASSPORT_NUMBER', field: 'passportNumber'
  },
  DRIVING_LICENSE: {
    regex: /(driving[\s_-]?(license|licence)|driver[\s_-]?(license|licence)|dl[\s_-]?number)/i,
    concept: 'DRIVING_LICENSE', field: 'drivingLicense'
  }
};

export function extractProfileValue(profile: UserProfile, concept: string): string {
  switch (concept) {
    // Identity
    case 'FULL_NAME':    return profile.fullName || `${profile.firstName || ''} ${profile.lastName || ''}`.trim();
    case 'FIRST_NAME':   return profile.firstName || profile.fullName?.trim().split(/\s+/)[0] || '';
    case 'MIDDLE_NAME':  return profile.middleName || '';
    case 'LAST_NAME':    return profile.lastName || profile.fullName?.trim().split(/\s+/).slice(1).join(' ') || '';
    case 'EMAIL':        return profile.email || '';
    case 'PHONE':        return profile.phone || '';
    case 'ALTERNATE_PHONE': return profile.alternatePhone || profile.phone || '';
    case 'DATE_OF_BIRTH': return profile.dob || '';
    case 'GENDER':       return profile.gender || '';
    case 'NATIONALITY':  return profile.nationality || '';
    case 'LANGUAGES':    return profile.languages || '';
    case 'MARITAL_STATUS': return profile.maritalStatus || '';

    // Location
    case 'ADDRESS':   return profile.address || '';
    case 'CITY':      return profile.city || '';
    case 'STATE':     return profile.state || '';
    case 'COUNTRY':   return profile.country || '';
    case 'PIN_CODE':  return profile.pinCode || '';

    // Education – graduation
    case 'COLLEGE':          return profile.education[0]?.college || profile.education[0]?.university || '';
    case 'DEGREE':           return profile.education[0]?.degree || '';
    case 'FIELD_OF_STUDY':   return profile.education[0]?.fieldOfStudy || profile.education[0]?.branch || '';
    case 'BRANCH':           return profile.education[0]?.branch || profile.education[0]?.fieldOfStudy || '';
    case 'CGPA':             return profile.education[0]?.cgpa || '';
    case 'GRADUATION_YEAR':  return profile.education[0]?.graduationYear || '';

    // Education – 12th
    case 'TWELFTH_PERCENTAGE': return profile.secondaryEducation?.twelfthPercentage || '';
    case 'TWELFTH_SCHOOL':     return profile.secondaryEducation?.twelfthSchool || '';
    case 'TWELFTH_BOARD':      return profile.secondaryEducation?.twelfthBoard || '';
    case 'TWELFTH_YEAR':       return profile.secondaryEducation?.twelfthYear || '';

    // Education – 10th
    case 'TENTH_PERCENTAGE':  return profile.secondaryEducation?.tenthPercentage || '';
    case 'TENTH_SCHOOL':      return profile.secondaryEducation?.tenthSchool || '';
    case 'TENTH_BOARD':       return profile.secondaryEducation?.tenthBoard || '';

    // Links
    case 'LINKEDIN':   return profile.linkedinUrl || '';
    case 'GITHUB':     return profile.githubUrl || '';
    case 'PORTFOLIO':  return profile.portfolioUrl || '';

    // Skills & Summary
    case 'SKILLS':   return profile.skills?.join(', ') || '';
    case 'SUMMARY':  return profile.summary || '';

    // Job Role
    case 'JOB_TITLE':       return profile.jobTitle || profile.currentRole || '';
    case 'CURRENT_ROLE':    return profile.currentRole || profile.jobTitle || '';
    case 'DESIRED_ROLE':    return profile.desiredRole || profile.jobTitle || '';
    case 'CURRENT_COMPANY': return profile.currentCompany || profile.experience[0]?.company || '';

    // Experience & Compensation
    case 'YEARS_OF_EXPERIENCE': return profile.totalYearsExperience || '';
    case 'CURRENT_CTC':         return profile.currentCTC || profile.declarations?.currentSalary || '';
    case 'EXPECTED_SALARY':     return profile.declarations?.expectedSalary || '';
    case 'CURRENT_SALARY':      return profile.declarations?.currentSalary || profile.currentCTC || '';

    // Declarations
    case 'WORK_AUTHORIZATION': return profile.declarations?.workAuth || 'Authorized';
    case 'NOTICE_PERIOD':      return profile.declarations?.noticePeriod || 'Immediate';
    case 'VETERAN_STATUS':     return profile.declarations?.veteranStatus || 'Not a Veteran';
    case 'DISABILITY_STATUS':  return profile.declarations?.disabilityStatus || 'No';

    // Documents
    case 'PAN_NUMBER':      return profile.panNumber || '';
    case 'PASSPORT_NUMBER': return profile.passportNumber || '';
    case 'DRIVING_LICENSE': return profile.drivingLicense || '';

    default: return '';
  }
}

export async function classifyFields(
  signals: FieldSignal[],
  profile: UserProfile,
  aiServiceUrl: string = 'http://localhost:8000/api/ai/match-fields-batch'
): Promise<FieldMappingResult[]> {
  const results: FieldMappingResult[] = [];
  let aiMatchedMap = new Map<string, any>();

  // Step 1: AI Service Semantic Classifier (sentence-transformers / embeddings)
  try {
    const response = await fetch(aiServiceUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: signals })
    });

    if (response.ok) {
      const aiData = await response.json();
      for (const item of (aiData.results || [])) {
        if (item.element_id && item.detected_concept && item.detected_concept !== 'UNKNOWN') {
          aiMatchedMap.set(item.element_id, item);
        }
      }
    }
  } catch (err) {
    console.warn('[CareerFill] AI service unreachable; using local heuristic classifier.', err);
  }

  // Step 2: Combine AI + Heuristic with fast-paths for unambiguous field types
  for (const sig of signals) {
    const inputType = sig.input_type?.toLowerCase();

    // FAST PATH A: tel/phone input type → always PHONE
    if (inputType === 'tel' || inputType === 'phone') {
      results.push({
        element_id: sig.element_id,
        detected_concept: 'PHONE',
        confidence_score: 0.99,
        action: 'SAFE_AUTOFILL',
        valueToFill: extractProfileValue(profile, 'PHONE'),
        fieldLabel: sig.label_text || sig.aria_label || sig.placeholder || sig.name || 'Phone'
      });
      continue;
    }

    // FAST PATH B: email input type → always EMAIL
    if (inputType === 'email') {
      results.push({
        element_id: sig.element_id,
        detected_concept: 'EMAIL',
        confidence_score: 0.99,
        action: 'SAFE_AUTOFILL',
        valueToFill: extractProfileValue(profile, 'EMAIL'),
        fieldLabel: sig.label_text || sig.aria_label || sig.placeholder || sig.name || 'Email'
      });
      continue;
    }

    // FAST PATH C: url input type → check label for linkedin/github/portfolio
    if (inputType === 'url') {
      const combinedUrl = [sig.label_text, sig.aria_label, sig.name, sig.html_id, sig.placeholder]
        .filter(Boolean).join(' ');
      if (/linkedin/i.test(combinedUrl)) {
        results.push({ element_id: sig.element_id, detected_concept: 'LINKEDIN', confidence_score: 0.99, action: 'SAFE_AUTOFILL', valueToFill: extractProfileValue(profile, 'LINKEDIN'), fieldLabel: sig.label_text || 'LinkedIn URL' });
        continue;
      }
      if (/github/i.test(combinedUrl)) {
        results.push({ element_id: sig.element_id, detected_concept: 'GITHUB', confidence_score: 0.99, action: 'SAFE_AUTOFILL', valueToFill: extractProfileValue(profile, 'GITHUB'), fieldLabel: sig.label_text || 'GitHub URL' });
        continue;
      }
      if (/portfolio|website|personal/i.test(combinedUrl)) {
        results.push({ element_id: sig.element_id, detected_concept: 'PORTFOLIO', confidence_score: 0.99, action: 'SAFE_AUTOFILL', valueToFill: extractProfileValue(profile, 'PORTFOLIO'), fieldLabel: sig.label_text || 'Portfolio URL' });
        continue;
      }
    }

    // FAST PATH D: date input type → DOB
    if (inputType === 'date') {
      const combinedDate = [sig.label_text, sig.aria_label, sig.name, sig.html_id].filter(Boolean).join(' ');
      if (/birth|dob|born/i.test(combinedDate)) {
        results.push({ element_id: sig.element_id, detected_concept: 'DATE_OF_BIRTH', confidence_score: 0.99, action: 'REQUIRES_CONFIRMATION', valueToFill: extractProfileValue(profile, 'DATE_OF_BIRTH'), fieldLabel: sig.label_text || 'Date of Birth' });
        continue;
      }
    }

    // Step 2b: AI semantic match
    const aiItem = aiMatchedMap.get(sig.element_id);
    if (aiItem && aiItem.detected_concept !== 'UNKNOWN' && aiItem.confidence_score >= 0.40) {
      const val = extractProfileValue(profile, aiItem.detected_concept);
      const isSensitive = SENSITIVE_CONCEPTS.has(aiItem.detected_concept);
      results.push({
        element_id: sig.element_id,
        detected_concept: aiItem.detected_concept,
        confidence_score: aiItem.confidence_score,
        action: isSensitive ? 'REQUIRES_CONFIRMATION' : aiItem.action,
        valueToFill: val,
        fieldLabel: sig.label_text || sig.aria_label || sig.placeholder || sig.name || aiItem.detected_concept
      });
      continue;
    }

    // Step 3: Heuristic Pattern Fallback
    const combinedText = [
      sig.autocomplete, sig.label_text, sig.aria_label,
      sig.name, sig.html_id, sig.placeholder, sig.surrounding_text
    ].filter(Boolean).join(' ');

    let matched = false;
    for (const [_, item] of Object.entries(HEURISTIC_PATTERNS)) {
      if (item.regex.test(combinedText)) {
        const val = extractProfileValue(profile, item.concept);
        const isSensitive = SENSITIVE_CONCEPTS.has(item.concept);
        results.push({
          element_id: sig.element_id,
          detected_concept: item.concept,
          confidence_score: 0.92,
          action: isSensitive ? 'REQUIRES_CONFIRMATION' : 'SAFE_AUTOFILL',
          valueToFill: val,
          fieldLabel: sig.label_text || sig.aria_label || sig.placeholder || sig.name || item.concept
        });
        matched = true;
        break;
      }
    }

    if (!matched) {
      results.push({
        element_id: sig.element_id,
        detected_concept: 'UNKNOWN',
        confidence_score: 0.1,
        action: 'UNCERTAIN',
        valueToFill: '',
        fieldLabel: sig.label_text || sig.aria_label || sig.name || 'Unknown Field'
      });
    }
  }

  return results;
}
