import { dateSchema, type MoveProfile, type Task } from "./contracts";

export function shiftDate(date: string, days: number): string {
  dateSchema.parse(date);
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

export function formatDate(date: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric", month: "short", year: "numeric", timeZone: "UTC",
  }).format(new Date(`${date}T12:00:00Z`));
}

export function daysUntil(date: string, today = new Date().toISOString().slice(0, 10)): number {
  return Math.round((Date.parse(`${date}T12:00:00Z`) - Date.parse(`${today}T12:00:00Z`)) / 86_400_000);
}

export function getBlockedBy(task: Task, tasks: Task[]): Task[] {
  return tasks.filter((candidate) => task.prerequisiteKeys.includes(candidate.key) && candidate.status !== "done");
}

export function isBlocked(task: Task, tasks: Task[]): boolean {
  return task.prerequisiteKeys.some((key) => !tasks.some((candidate) => candidate.key === key && candidate.status === "done"));
}

export function getNextTasks(tasks: Task[], limit = 3): Task[] {
  return tasks.filter((task) => task.status === "todo" && !isBlocked(task, tasks))
    .sort((a, b) => (a.timing.date ?? "9999").localeCompare(b.timing.date ?? "9999") || a.priority - b.priority)
    .slice(0, limit);
}

export function getProgress(tasks: Task[]) {
  const completed = tasks.filter((task) => task.status === "done").length;
  return { completed, total: tasks.length, percent: tasks.length ? Math.round(completed / tasks.length * 100) : 0 };
}

export function rescheduleTasks(tasks: Task[], arrivalDate: string): Task[] {
  return tasks.map((task) => task.status === "done" || task.timing.kind !== "suggested" || task.timing.offsetDays === null
    ? task
    : { ...task, timing: { ...task.timing, date: shiftDate(arrivalDate, task.timing.offsetDays) } });
}

export function isSupportedProfile(profile: Partial<MoveProfile>): boolean {
  return profile.citizenship === "FI" && profile.originCountry === "FI" &&
    profile.destinationCountry === "NL" && profile.destinationCity?.toLowerCase() === "amsterdam" &&
    profile.studyType === "exchange" && profile.stayType === "fixed";
}
