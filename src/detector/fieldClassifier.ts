// src/detector/fieldClassifier.ts
/**
 * Very simple rule‑based classifier that maps a set of collected signals
 * to one of a handful of canonical field concepts.
 *
 * In a real implementation this would be more extensive and possibly
 * data‑driven, but for the MVP we cover the most common cases.
 */
export type FieldConcept = 'NAME' | 'EMAIL' | 'PHONE' | 'UNKNOWN';

// Lists of keywords for each concept (lower‑case)
const conceptKeywords: Record<FieldConcept, string[]> = {
  NAME: ['name', 'full name', 'candidate_full_name', 'applicantname', 'first name', 'last name'],
  EMAIL: ['email', 'e‑mail', 'mail'],
  PHONE: ['phone', 'telephone', 'mobile', 'contact number', 'cell'],
  UNKNOWN: []
};

export function classifyField({ signals }: { signals: string[] }): FieldConcept {
  // Flatten signals into one string for simple substring matching
  const combined = signals.join(' ');
  for (const [concept, keywords] of Object.entries(conceptKeywords) as [FieldConcept, string[]][]) {
    for (const kw of keywords) {
      if (combined.includes(kw)) {
        return concept;
      }
    }
  }
  return 'UNKNOWN';
}
