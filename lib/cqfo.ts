// CQFO (Client Questionnaire Fill Out) question set.
// Source: "Master Response Guide" doc — spec mirrored in the planning vault
// (07 CQFO Questionnaire.md). Order and wording follow the guide.

export type Field = {
  key: string;
  label: string;
  placeholder?: string;
  multiline?: boolean;
};

export type Step =
  | { kind: "intro"; id: "intro" }
  | { kind: "choice"; id: string; title: string; options: string[]; required?: boolean }
  | { kind: "text"; id: string; title: string; placeholder?: string; multiline?: boolean; inputType?: string; required?: boolean; hint?: string }
  | { kind: "fields"; id: string; title: string; fields: Field[]; required?: boolean }
  | { kind: "yesno"; id: string; title: string; followUp?: { label: string; multiline?: boolean }; hint?: string; required?: boolean }
  | { kind: "range"; id: string; title: string; unit: string; noteLabel?: string; required?: boolean }
  | { kind: "repeat"; id: string; title: string; fields: Field[]; min: number; max: number; itemLabel: string; hint?: string }
  | { kind: "outro"; id: "outro" };

const refFields: Field[] = [
  { key: "name", label: "Full name" },
  { key: "relationship", label: "Relationship" },
  { key: "company", label: "Company name" },
  { key: "title", label: "Job title" },
  { key: "address", label: "Company address" },
  { key: "phone", label: "Phone number" },
  { key: "email", label: "Email" },
];

export const CQFO_STEPS: Step[] = [
  { kind: "intro", id: "intro" },

  // Section A — Personal Information
  { kind: "choice", id: "title", title: "What is your title?", options: ["Mr", "Miss", "Mrs", "Ms", "Mx", "Dr", "Professor"], required: true },
  { kind: "text", id: "full_name", title: "What is your full name?", hint: "The name to appear on job applications.", required: true },
  {
    kind: "fields", id: "address", title: "What is your address?", required: true,
    fields: [
      { key: "street", label: "Street address" },
      { key: "city", label: "City" },
      { key: "county", label: "County" },
      { key: "state", label: "State" },
      { key: "zip", label: "Zip code" },
    ],
  },
  { kind: "text", id: "phone", title: "What is your contact number?", inputType: "tel", required: true },
  { kind: "choice", id: "gender", title: "What is your gender?", options: ["Male", "Female", "Other"] },
  { kind: "text", id: "dob", title: "What is your date of birth?", inputType: "date", required: true },
  { kind: "text", id: "ethnicity", title: "What is your ethnicity?" },
  { kind: "text", id: "race", title: "What is your race?" },
  { kind: "yesno", id: "disabilities", title: "Do you have any disabilities?", followUp: { label: "Please describe your disabilities.", multiline: true } },
  { kind: "text", id: "veteran", title: "What is your veteran status?" },
  { kind: "choice", id: "travel", title: "What percentage of travel is acceptable to you?", options: ["Less than 10%", "Less than 25%", "Less than 50%", "Less than 75%", "Up to 100%"], required: true },
  { kind: "yesno", id: "geo_prefs", title: "Do you have any geographical preferences?", followUp: { label: "Please list them.", multiline: true } },
  { kind: "yesno", id: "relocate_usa", title: "Are you willing to relocate within the USA?", required: true },
  { kind: "yesno", id: "relocate_abroad", title: "Are you willing to relocate outside the USA?", required: true },
  { kind: "yesno", id: "evenings_weekends", title: "Are you able to work evenings and weekends?", required: true },
  {
    kind: "repeat", id: "languages", title: "Are you fluent in any languages other than English?",
    fields: [{ key: "language", label: "Language" }, { key: "fluency", label: "Fluency" }],
    min: 0, max: 6, itemLabel: "Language", hint: "Skip if English only.",
  },
  { kind: "yesno", id: "us_citizen", title: "Are you a U.S. citizen?", followUp: { label: "If you have additional citizenships, please list them." }, required: true },
  { kind: "yesno", id: "other_citizenship", title: "Are you a citizen of another country, or do you hold permanent residency status?", followUp: { label: "Please specify the type of visa you currently hold and the country." }, required: true },
  { kind: "range", id: "salary", title: "What is your expected base salary per year?", unit: "USD", noteLabel: "Additional notes for the hiring manager regarding salary negotiations (optional)", required: true },

  // Section B — Professional Information
  { kind: "yesno", id: "work_auth", title: "Are you legally authorized to work in the USA?", required: true },
  { kind: "yesno", id: "sponsorship", title: "Will you now, or in the future, require the company's sponsorship for an immigration-related employment benefit?", followUp: { label: "Please specify the type of visa you currently hold or are applying for." }, required: true },
  { kind: "repeat", id: "references", title: "Please provide three professional references.", fields: refFields, min: 3, max: 3, itemLabel: "Reference", hint: "All three references are mandatory." },
  {
    kind: "repeat", id: "licenses", title: "Do you hold any licenses or certifications?",
    fields: [
      { key: "name", label: "License / certification name" },
      { key: "number", label: "License number" },
      { key: "issuer", label: "Issuing organization" },
      { key: "achieved", label: "Date achieved (MMM/DD/YYYY)" },
      { key: "expires", label: "Expiration date (MMM/DD/YYYY)" },
    ],
    min: 0, max: 6, itemLabel: "License", hint: "Skip if none.",
  },
  {
    kind: "repeat", id: "education", title: "Please provide your education details.",
    fields: [
      { key: "degree", label: "Degree type", placeholder: "Associate, Bachelor, Master…" },
      { key: "school", label: "College / university name" },
      { key: "school_address", label: "College / university address" },
      { key: "major", label: "Major" },
      { key: "minor", label: "Minor" },
      { key: "timeframe", label: "Timeframe", placeholder: "MMM/YYYY to MMM/YYYY" },
      { key: "gpa", label: "GPA" },
    ],
    min: 1, max: 4, itemLabel: "Degree", hint: "At least one entry is mandatory.",
  },
  {
    kind: "yesno", id: "gov_employment", title: "Within the last three years, have you been employed by a government entity in the USA?",
    hint: "Federal, state, or local, such as federal agencies, public universities, state Medicaid, cities, counties, public hospitals, police or sheriff departments.",
    followUp: { label: "Please provide specific information.", multiline: true }, required: true,
  },
  { kind: "yesno", id: "non_compete", title: "Are you subject to any non-compete, non-solicitation, invention assignment, confidentiality, or similar agreement with a current or former employer?", followUp: { label: "Please provide specific information.", multiline: true }, required: true },
  { kind: "yesno", id: "convictions", title: "Have you ever been convicted of, pled guilty or no contest to, or received deferred adjudication for a felony or misdemeanor?", hint: "Other than minor traffic offenses punishable only by fine.", followUp: { label: "Please provide specific information.", multiline: true }, required: true },
  {
    kind: "repeat", id: "interview_slots", title: "Please list 2-3 dates and time ranges when you could do an interview.",
    fields: [{ key: "date", label: "Date" }, { key: "time", label: "Time range" }],
    min: 2, max: 3, itemLabel: "Slot",
  },
  { kind: "text", id: "leaving_reason", title: "What is your reason for leaving your most recent job?", multiline: true, required: true },

  { kind: "outro", id: "outro" },
];

export type Answers = Record<string, unknown>;

export function isStepComplete(step: Step, answers: Answers): boolean {
  const v = answers[step.id];
  switch (step.kind) {
    case "intro":
    case "outro":
      return true;
    case "choice":
    case "text":
      return !step.required || (typeof v === "string" && v.trim().length > 0);
    case "fields": {
      if (!step.required) return true;
      const obj = (v ?? {}) as Record<string, string>;
      return step.fields.every((f) => (obj[f.key] ?? "").trim().length > 0);
    }
    case "yesno": {
      const obj = (v ?? {}) as { answer?: string };
      return !step.required || obj.answer === "yes" || obj.answer === "no";
    }
    case "range": {
      const obj = (v ?? {}) as { from?: string; to?: string };
      return !step.required || (!!obj.from?.trim() && !!obj.to?.trim());
    }
    case "repeat": {
      const rows = (v ?? []) as Record<string, string>[];
      const filled = rows.filter((r) => Object.values(r).some((x) => (x ?? "").trim().length > 0));
      if (step.min === 0) return true;
      // every required row must have all fields non-empty
      return filled.length >= step.min && filled.slice(0, step.min).every((r) => step.fields.every((f) => (r[f.key] ?? "").trim().length > 0));
    }
  }
}
