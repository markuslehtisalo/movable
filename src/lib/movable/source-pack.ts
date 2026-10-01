import type { MoveProfile, Source, Task } from "./contracts";
import { createFixtureTasks } from "./fixtures";

// These short summaries were checked against the linked official pages on 2026-10-01.
// They establish starting points, not a complete legal review of an individual's move.
const sources: Source[] = [
  { id: "uva-exchange", organization: "University of Amsterdam", title: "Incoming exchange students",
    url: "https://www.uva.nl/en/education/exchange/exchange.html",
    excerpt: "UvA directs incoming exchange students to faculty exchange information, a practical checklist, orientation, an academic calendar and international office contacts.",
    applicability: "Incoming University of Amsterdam exchange students; faculty-specific instructions still need checking.", reviewStatus: "reviewed", reviewedAt: "2026-10-01" },
  { id: "uva-housing", organization: "University of Amsterdam", title: "International student housing",
    url: "https://student.uva.nl/en/categories/international-student-housing",
    excerpt: "UvA recommends researching accommodation early and planning a housing search. Its own rooms are limited and are not available to every international student.",
    applicability: "UvA international students looking for accommodation; no room or eligibility is guaranteed.", reviewStatus: "reviewed", reviewedAt: "2026-10-01" },
  { id: "amsterdam-registration", organization: "City of Amsterdam", title: "Moving from abroad: registration",
    url: "https://www.amsterdam.nl/en/civil-affairs/first-registration/",
    excerpt: "The City says people moving to Amsterdam from abroad for more than four months must register. Its page has separate student guidance and document instructions; check the current process for your circumstances.",
    applicability: "People living in Amsterdam after moving from abroad; the process depends on the length and circumstances of the stay.", reviewStatus: "reviewed", reviewedAt: "2026-10-01" },
  { id: "uva-insurance", organization: "University of Amsterdam", title: "Insurance for students",
    url: "https://student.uva.nl/en/information/insurance",
    excerpt: "UvA says students need adequate health coverage and links to guidance for international students. Liability and household contents insurance are discussed separately. The appropriate coverage needs individual checking.",
    applicability: "UvA students; citizenship, work and existing insurance can affect the appropriate coverage.", reviewStatus: "reviewed", reviewedAt: "2026-10-01" },
];

export function sourcesForProfile(profile: MoveProfile): Source[] {
  const uva = /^(university of amsterdam|universiteit van amsterdam|uva)$/i.test(profile.university.trim());
  return sources.filter((source) => uva || !source.id.startsWith("uva-"));
}

export function liveTaskTemplates(moveId: string, profile: MoveProfile): Task[] {
  const available = new Set(sourcesForProfile(profile).map((source) => source.id));
  const mapping: Record<string, string[]> = {
    "confirm-study": ["uva-exchange"], "study-paperwork": ["uva-exchange"], welcome: ["uva-exchange"],
    "find-housing": ["uva-housing"], "health-coverage": ["uva-insurance"], registration: ["amsterdam-registration"],
  };
  return createFixtureTasks(moveId, profile).map((task) => ({ ...task,
    sourceIds: (mapping[task.key] ?? []).filter((id) => available.has(id)),
    timing: { ...task.timing, explanation: "Suggested preparation date relative to your arrival, not an official deadline. Check linked guidance for applicable requirements." },
  }));
}
