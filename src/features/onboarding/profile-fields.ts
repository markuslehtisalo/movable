import { completeProfileSchema, type MoveProfile, type ProfileDraft } from "@/lib/movable/contracts";

export type ProfileFields = Record<keyof MoveProfile, string>;
export type FieldErrors = Partial<Record<keyof MoveProfile, string>>;

export const EMPTY_FIELDS: ProfileFields = {
  citizenship: "", originCountry: "", originCity: "", destinationCountry: "",
  destinationCity: "", university: "", studyType: "", arrivalDate: "",
  stayType: "", durationMonths: "",
};

// ISO 3166-1 alpha-2 values; country names are displayed in English by the browser.
const COUNTRY_CODES = "AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW".split(" ");
const names = new Intl.DisplayNames(["en"], { type: "region" });
export const COUNTRIES = COUNTRY_CODES.map((code) => ({ code, name: names.of(code) ?? code }))
  .sort((a, b) => a.name.localeCompare(b.name, "en"));
export const countryName = (code: string) => COUNTRY_CODES.includes(code) ? names.of(code) ?? code : "";

export function fieldsFromProfile(profile: ProfileDraft): ProfileFields {
  return Object.fromEntries(Object.keys(EMPTY_FIELDS).map((key) => [key, String(profile[key as keyof MoveProfile] ?? "")])) as ProfileFields;
}

const fieldMessages: Record<keyof MoveProfile, string> = {
  citizenship: "Choose your country of citizenship.",
  originCountry: "Choose the country you live in now.",
  originCity: "Enter the city you’re moving from.",
  destinationCountry: "Choose your destination country.",
  destinationCity: "Enter the city you’re moving to.",
  university: "Enter your host university.",
  studyType: "Choose exchange or full degree.",
  arrivalDate: "Enter a valid arrival date.",
  stayType: "Choose a fixed or open-ended stay.",
  durationMonths: "Enter a whole number from 1 to 120 months.",
};

export function validateFields(fields: ProfileFields): { profile: MoveProfile | null; errors: FieldErrors } {
  const result = completeProfileSchema.safeParse({
    ...fields,
    durationMonths: fields.stayType === "open-ended" || !fields.durationMonths.trim()
      ? null : Number(fields.durationMonths),
  });
  const errors: FieldErrors = {};
  if (!result.success) {
    for (const issue of result.error.issues) {
      const key = issue.path[0] as keyof MoveProfile;
      errors[key] = fieldMessages[key];
    }
  }
  for (const key of ["citizenship", "originCountry", "destinationCountry"] as const) {
    if (!COUNTRY_CODES.includes(fields[key])) errors[key] = fieldMessages[key];
  }
  return { profile: result.success && !Object.keys(errors).length ? result.data : null, errors };
}

export type Step = "describe" | "details" | "review";
export type OnboardingDraft = {
  entryDraft: string | null;
  text: string;
  fields: ProfileFields;
  touched: (keyof MoveProfile)[];
  extractedText: string | null;
  step: Step;
};

export type BuildAttempt = {
  profile: MoveProfile;
  createRequestId: string;
  planRequestId: string;
  moveId: string | null;
};

export const DETAILS_KEY = "movable:onboarding-details:v1";

export function restoreDetails(entryDraft: string | null, savedText: string): {
  draft: OnboardingDraft; attempt: BuildAttempt | null;
} {
  const empty: OnboardingDraft = {
    entryDraft, text: entryDraft ?? savedText, fields: { ...EMPTY_FIELDS },
    touched: [], extractedText: null, step: "describe",
  };
  try {
    const raw = window.sessionStorage.getItem(DETAILS_KEY);
    if (!raw) return { draft: empty, attempt: null };
    const saved = JSON.parse(raw);
    const draft = saved.draft;
    // A new marketing prompt starts a new draft. A refresh keeps subsequent edits.
    if (!draft || (entryDraft !== null && draft.entryDraft !== entryDraft)
      || (entryDraft === null && draft.text !== savedText)
      || typeof draft.text !== "string"
      || !["describe", "details", "review"].includes(draft.step)
      || !draft.fields || Object.keys(EMPTY_FIELDS).some((key) => typeof draft.fields[key] !== "string")
      || !Array.isArray(draft.touched) || draft.touched.some((key: string) => !(key in EMPTY_FIELDS))
      || !(draft.extractedText === null || typeof draft.extractedText === "string")) {
      return { draft: empty, attempt: null };
    }
    const attempt = saved.attempt;
    const validAttempt = attempt && completeProfileSchema.safeParse(attempt.profile).success
      && typeof attempt.createRequestId === "string" && typeof attempt.planRequestId === "string"
      && (attempt.moveId === null || typeof attempt.moveId === "string");
    if (draft.step === "review" && !validateFields(draft.fields).profile) draft.step = "details";
    return { draft, attempt: validAttempt ? attempt : null };
  } catch {
    return { draft: empty, attempt: null };
  }
}
