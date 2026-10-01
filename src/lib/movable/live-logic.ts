import { z } from "zod";
import {
  completeProfileSchema, profileDraftSchema, profileSchema, taskSchema,
  type ActionReceipt, type MoveProfile, type ProfileDraft, type Task,
} from "./contracts";
import { isSupportedProfile, rescheduleTasks } from "./selectors";

// Structured outputs require every key. Null means that the user did not supply it.
export const extractionSchema = z.object({
  citizenship: profileSchema.shape.citizenship.nullable(),
  originCountry: profileSchema.shape.originCountry.nullable(),
  originCity: profileSchema.shape.originCity.nullable(),
  destinationCountry: profileSchema.shape.destinationCountry.nullable(),
  destinationCity: profileSchema.shape.destinationCity.nullable(),
  university: profileSchema.shape.university.nullable(),
  studyType: profileSchema.shape.studyType.nullable(),
  arrivalDate: profileSchema.shape.arrivalDate.nullable(),
  stayType: profileSchema.shape.stayType.nullable(),
  durationMonths: profileSchema.shape.durationMonths,
});
export const planSchema = z.object({
  tasks: z.array(z.object({
    key: z.string(), explanation: z.string().min(1).max(700),
    steps: z.array(z.string().min(1).max(350)).min(1).max(5),
  })).min(1).max(20),
});
export const changeSchema = z.object({
  arrivalDate: profileSchema.shape.arrivalDate.nullable(),
  taskUpdates: z.array(z.object({ taskId: z.string(), status: z.enum(["todo", "done"]) })).max(20),
});
export const answerSchema = z.object({
  text: z.string().min(1).max(6000),
  draft: z.object({ subject: z.string().max(200), body: z.string().max(5000) }).nullable(),
});
export type PlanContent = z.infer<typeof planSchema>;
export type PlanChanges = z.infer<typeof changeSchema>;

export function extractedDraft(value: z.infer<typeof extractionSchema>): ProfileDraft {
  return profileDraftSchema.parse(Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== null)));
}

export function validatedProfile(input: unknown): MoveProfile {
  const profile = completeProfileSchema.parse(input);
  for (const value of Object.values(profile)) {
    if (typeof value === "string" && value.length > 250) throw new Error("Keep each profile field under 250 characters.");
  }
  if (!isSupportedProfile(profile)) throw new Error("This prototype currently covers Finnish exchange students moving from Finland to Amsterdam for a fixed stay.");
  return profile;
}

/** The model may personalize preparation wording, but not invent IDs, dates or requirements. */
export function personalizeTasks(base: Task[], content: PlanContent): Task[] {
  const parsed = planSchema.parse(content);
  const byKey = new Map(parsed.tasks.map((task) => [task.key, task]));
  if (byKey.size !== base.length || parsed.tasks.length !== base.length || base.some((task) => !byKey.has(task.key))) {
    throw new Error("The generated plan was incomplete. Retry to prepare all your tasks.");
  }
  return base.map((task) => taskSchema.parse({ ...task, ...byKey.get(task.key) }));
}

export function changeProfile(moveId: string, profile: MoveProfile, tasks: Task[], input: ProfileDraft, requestId: string) {
  const patch = profileDraftSchema.parse(input);
  const next = validatedProfile({ ...profile, ...patch });
  const receipts: ActionReceipt[] = Object.entries(patch)
    .filter(([key, value]) => value !== undefined && profile[key as keyof MoveProfile] !== value)
    .map(([key, value]) => ({ id: `${requestId}:profile:${key}`, type: "profile_updated", targetId: moveId,
      label: key, before: String(profile[key as keyof MoveProfile] ?? ""), after: String(value ?? "") }));
  return { profile: next, tasks: rescheduleTasks(tasks, next.arrivalDate), receipts };
}

export function applyPlanChanges(moveId: string, profile: MoveProfile, tasks: Task[], input: PlanChanges, requestId: string) {
  const changes = changeSchema.parse(input);
  if (new Set(changes.taskUpdates.map((task) => task.taskId)).size !== changes.taskUpdates.length) {
    throw new Error("The assistant proposed conflicting task updates. Please retry.");
  }
  if (changes.taskUpdates.some((update) => !tasks.some((task) => task.id === update.taskId))) {
    throw new Error("The assistant referred to a task outside this move. No changes were saved.");
  }
  const next = changeProfile(moveId, profile, tasks, changes.arrivalDate ? { arrivalDate: changes.arrivalDate } : {}, requestId);
  next.tasks = next.tasks.map((task) => {
    const update = changes.taskUpdates.find((candidate) => candidate.taskId === task.id);
    if (!update || update.status === task.status) return task;
    next.receipts.push({ id: `${requestId}:task:${task.key}`, type: "task_updated", targetId: task.id,
      label: task.title, before: task.status, after: update.status });
    return { ...task, status: update.status };
  });
  return next;
}
