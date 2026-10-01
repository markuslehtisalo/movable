import { z } from "zod";

export const dateSchema = z.iso.date();
export const profileSchema = z.object({
  citizenship: z.string().length(2),
  originCountry: z.string().length(2),
  originCity: z.string().trim().min(1),
  destinationCountry: z.string().length(2),
  destinationCity: z.string().trim().min(1),
  university: z.string().trim().min(1),
  studyType: z.enum(["exchange", "degree"]),
  arrivalDate: dateSchema,
  stayType: z.enum(["fixed", "open-ended"]),
  durationMonths: z.number().int().positive().max(120).nullable(),
});
export const completeProfileSchema = profileSchema.refine(
  (profile) => profile.stayType !== "fixed" || profile.durationMonths !== null,
  { message: "Enter the length of your stay.", path: ["durationMonths"] },
);
export const profileDraftSchema = profileSchema.partial();
export type MoveProfile = z.infer<typeof profileSchema>;
export type ProfileDraft = z.infer<typeof profileDraftSchema>;
export type RuntimeMode = "local" | "demo" | "live";

export const taskSchema = z.object({
  id: z.string(),
  key: z.string(),
  moveId: z.string(),
  title: z.string(),
  phase: z.enum(["before", "arrival", "settling"]),
  category: z.enum(["university", "housing", "documents", "health", "travel", "everyday"]),
  status: z.enum(["todo", "done"]),
  priority: z.number(),
  explanation: z.string(),
  steps: z.array(z.string()),
  requiredDocuments: z.array(z.string()),
  prerequisiteKeys: z.array(z.string()),
  timing: z.object({
    kind: z.enum(["official", "suggested", "none"]),
    date: dateSchema.nullable(),
    offsetDays: z.number().int().nullable(),
    explanation: z.string(),
  }),
  sourceIds: z.array(z.string()),
});
export type Task = z.infer<typeof taskSchema>;
export type TaskStatus = Task["status"];
export type TaskPhase = Task["phase"];

export const sourceSchema = z.object({
  id: z.string(),
  organization: z.string(),
  title: z.string(),
  url: z.url(),
  excerpt: z.string(),
  applicability: z.string(),
  reviewStatus: z.enum(["unreviewed", "reviewed"]),
  reviewedAt: dateSchema.nullable(),
});
export type Source = z.infer<typeof sourceSchema>;

export const receiptSchema = z.object({
  id: z.string(),
  type: z.enum(["profile_updated", "task_updated"]),
  targetId: z.string(),
  label: z.string(),
  before: z.string(),
  after: z.string(),
});
export type ActionReceipt = z.infer<typeof receiptSchema>;

export const messageSchema = z.object({
  id: z.string(),
  moveId: z.string(),
  role: z.enum(["user", "assistant"]),
  text: z.string(),
  createdAt: z.string(),
  selectedTaskId: z.string().nullable(),
  receipts: z.array(receiptSchema),
  draft: z.object({ subject: z.string(), body: z.string() }).nullable(),
});
export type Message = z.infer<typeof messageSchema>;

export const moveSchema = z.object({
  id: z.string(),
  profile: completeProfileSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Move = z.infer<typeof moveSchema>;

export const snapshotSchema = z.object({
  mode: z.enum(["local", "demo", "live"]),
  phase: z.enum(["loading", "empty", "generating", "ready", "error"]),
  move: moveSchema.nullable(),
  tasks: z.array(taskSchema),
  messages: z.array(messageSchema),
  sources: z.array(sourceSchema),
  error: z.string().nullable(),
});
export type MoveSnapshot = z.infer<typeof snapshotSchema>;

export interface MovableCommands {
  extractProfile(text: string): Promise<ProfileDraft>;
  createMove(profile: MoveProfile, requestId: string): Promise<{ moveId: string }>;
  generatePlan(moveId: string, requestId: string): Promise<void>;
  updateProfile(moveId: string, patch: ProfileDraft, requestId: string): Promise<ActionReceipt[]>;
  setTaskStatus(taskId: string, status: TaskStatus, requestId: string): Promise<ActionReceipt>;
  sendMessage(moveId: string, text: string, selectedTaskId: string | null, requestId: string): Promise<void>;
  resetDemo(): void;
}

export interface MovableAdapter {
  getSnapshot(): MoveSnapshot;
  getServerSnapshot(): MoveSnapshot;
  subscribe(listener: () => void): () => void;
  hydrate(): void;
  commands: MovableCommands;
}

export const PHASE_LABELS: Record<TaskPhase, string> = {
  before: "Before you leave",
  arrival: "First days",
  settling: "Settling in",
};
export const PHASE_ORDER: TaskPhase[] = ["before", "arrival", "settling"];
