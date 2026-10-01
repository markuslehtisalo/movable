import type { MoveProfile, MoveSnapshot, Task } from "./contracts";
import { shiftDate } from "./selectors";

export const EXAMPLE_PROMPT = "I'm a Finnish student moving from Helsinki to Amsterdam on 15 January 2027 for a six-month exchange at the University of Amsterdam.";
export const DEMO_PROFILE: MoveProfile = {
  citizenship: "FI", originCountry: "FI", originCity: "Helsinki",
  destinationCountry: "NL", destinationCity: "Amsterdam", university: "University of Amsterdam",
  studyType: "exchange", arrivalDate: "2027-01-15", stayType: "fixed", durationMonths: 6,
};

type Template = Pick<Task, "key" | "title" | "phase" | "category" | "explanation" | "steps" | "requiredDocuments" | "prerequisiteKeys"> & { offset: number };
const templates: Template[] = [
  { key: "confirm-study", title: "Confirm your exchange details", phase: "before", category: "university", offset: -70, explanation: "Get your university dates and contacts in one place.", steps: ["Check the dates in your acceptance letter.", "Save your international office's contact details."], requiredDocuments: ["Acceptance letter"], prerequisiteKeys: [] },
  { key: "find-housing", title: "Find your place in Amsterdam", phase: "before", category: "housing", offset: -60, explanation: "An address makes it easier to plan the practical parts of your arrival.", steps: ["Review housing information from your host university.", "Check the accommodation, terms, and move-in date before committing."], requiredDocuments: [], prerequisiteKeys: ["confirm-study"] },
  { key: "check-id", title: "Check your travel ID", phase: "before", category: "documents", offset: -45, explanation: "Review the validity of the identification you plan to travel with.", steps: ["Check expiry dates.", "Check official travel guidance for your circumstances."], requiredDocuments: ["Travel ID"], prerequisiteKeys: [] },
  { key: "health-coverage", title: "Review your health coverage", phase: "before", category: "health", offset: -35, explanation: "Find out what your existing coverage includes during your studies.", steps: ["Contact your current provider.", "Review official guidance for students in your situation."], requiredDocuments: ["Coverage information"], prerequisiteKeys: [] },
  { key: "study-paperwork", title: "Prepare your university paperwork", phase: "before", category: "university", offset: -28, explanation: "Check your host university's instructions for exchange enrollment.", steps: ["Read your enrollment instructions.", "List anything your university still needs."], requiredDocuments: ["Acceptance letter", "University instructions"], prerequisiteKeys: ["confirm-study"] },
  { key: "travel", title: "Plan your journey", phase: "before", category: "travel", offset: -21, explanation: "Coordinate your journey with your accommodation and university dates.", steps: ["Confirm when you can move in.", "Plan your route and arrival transport."], requiredDocuments: [], prerequisiteKeys: ["find-housing"] },
  { key: "arrival-folder", title: "Make an arrival checklist", phase: "before", category: "documents", offset: -7, explanation: "Keep the information you will need on arrival easy to find.", steps: ["Save your accommodation address and contact.", "Keep university and travel information accessible."], requiredDocuments: ["Accommodation details", "University contact details"], prerequisiteKeys: [] },
  { key: "move-in", title: "Settle into your accommodation", phase: "arrival", category: "housing", offset: 0, explanation: "Arrange the practical handover of your new place.", steps: ["Confirm the key collection details.", "Review the accommodation's move-in checklist."], requiredDocuments: ["Accommodation agreement"], prerequisiteKeys: ["find-housing"] },
  { key: "registration", title: "Check local registration steps", phase: "arrival", category: "documents", offset: 2, explanation: "Your next step depends on your address, stay, and circumstances. Verify the applicable official guidance.", steps: ["Check the municipality's official student guidance.", "Confirm which steps and documents apply to you."], requiredDocuments: [], prerequisiteKeys: ["find-housing"] },
  { key: "welcome", title: "Get ready for university welcome week", phase: "arrival", category: "university", offset: 3, explanation: "Find your orientation schedule and the people who can help.", steps: ["Check your university's welcome information.", "Save your campus and international office locations."], requiredDocuments: [], prerequisiteKeys: ["confirm-study"] },
  { key: "phone", title: "Review your phone setup", phase: "settling", category: "everyday", offset: 7, explanation: "Check whether your current plan works for the length of your stay.", steps: ["Ask your provider about your planned stay.", "Compare options if you need a different plan."], requiredDocuments: [], prerequisiteKeys: [] },
  { key: "local-travel", title: "Find your everyday route", phase: "settling", category: "travel", offset: 10, explanation: "Make the journey between your new home and campus familiar.", steps: ["Explore your campus route.", "Check current local transport options."], requiredDocuments: [], prerequisiteKeys: ["move-in"] },
];

// Illustrative preparation content, not verified country-specific requirements.
export function createFixtureTasks(moveId: string, profile: MoveProfile): Task[] {
  return templates.map(({ offset, ...template }, priority) => ({
    ...template, id: `${moveId}:${template.key}`, moveId, status: "todo", priority,
    sourceIds: [], timing: { kind: "suggested", date: shiftDate(profile.arrivalDate, offset), offsetDays: offset, explanation: "Suggested preparation timing for this example; not an official deadline." },
  }));
}

export function createDemoSnapshot(): MoveSnapshot {
  const moveId = "example-move";
  const createdAt = "2026-10-01T09:00:00.000Z";
  return {
    mode: "demo", phase: "ready", move: { id: moveId, profile: { ...DEMO_PROFILE }, createdAt, updatedAt: createdAt },
    tasks: createFixtureTasks(moveId, DEMO_PROFILE).map((task) => task.key === "confirm-study" ? { ...task, status: "done" } : task),
    messages: [{ id: "example-welcome", moveId, role: "assistant", createdAt, selectedTaskId: null, receipts: [], draft: null, text: "Welcome to your example move. Try completing a task, or say: I'm arriving two weeks later, and I've already found housing. These are scripted example interactions." }],
    sources: [], error: null,
  };
}
