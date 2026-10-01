import test from "node:test";
import assert from "node:assert/strict";
import { DEMO_PROFILE, createFixtureTasks } from "./fixtures";
import { applyPlanChanges, extractedDraft, extractionSchema, personalizeTasks } from "./live-logic";
import { shiftDate } from "./selectors";
import { sourcesForProfile } from "./source-pack";

test("live assistant changes preserve completed tasks and reschedule only suggestions", () => {
  const tasks = createFixtureTasks("move", DEMO_PROFILE);
  tasks[0].status = "done";
  tasks[2].timing.kind = "official";
  const result = applyPlanChanges("move", DEMO_PROFILE, tasks, { arrivalDate: "2027-01-29", taskUpdates: [{ taskId: tasks[1].id, status: "done" }] }, "request");
  assert.equal(result.profile.arrivalDate, "2027-01-29");
  assert.equal(result.tasks[0].status, "done");
  assert.equal(result.tasks[0].timing.date, tasks[0].timing.date);
  assert.equal(result.tasks[2].timing.date, tasks[2].timing.date);
  assert.equal(result.tasks[3].timing.date, shiftDate("2027-01-29", -35));
  assert.equal(result.tasks[1].status, "done");
  assert.equal(result.receipts.length, 2);
  assert.equal(tasks[1].status, "todo");
});
test("live assistant rejects foreign and conflicting task updates before applying anything", () => {
  const tasks = createFixtureTasks("move", DEMO_PROFILE);
  assert.throws(() => applyPlanChanges("move", DEMO_PROFILE, tasks, { arrivalDate: "2027-01-29", taskUpdates: [{ taskId: "other-user:task", status: "done" }] }, "request"), /outside this move/);
  assert.throws(() => applyPlanChanges("move", DEMO_PROFILE, tasks, { arrivalDate: null, taskUpdates: [{ taskId: tasks[0].id, status: "done" }, { taskId: tasks[0].id, status: "todo" }] }, "request"), /conflicting/);
});
test("generated plans cannot replace dates, task identity, sources or dependencies", () => {
  const tasks = createFixtureTasks("move", DEMO_PROFILE);
  const content = { tasks: tasks.map((task) => ({ key: task.key, explanation: "Personalized preparation", steps: ["Check your instructions"] })) };
  const result = personalizeTasks(tasks, content);
  assert.deepEqual(result.map((task) => [task.id, task.timing, task.prerequisiteKeys]), tasks.map((task) => [task.id, task.timing, task.prerequisiteKeys]));
  assert.throws(() => personalizeTasks(tasks, { tasks: content.tasks.slice(1) }), /incomplete/);
  assert.throws(() => personalizeTasks(tasks, { tasks: [...content.tasks.slice(1), content.tasks[1]] }), /incomplete/);
});
test("unknown extraction fields remain absent and UvA sources are not applied to other universities", () => {
  const empty = Object.fromEntries(Object.keys(extractionSchema.shape).map((key) => [key, null]));
  assert.deepEqual(extractedDraft(extractionSchema.parse({ ...empty, citizenship: "FI" })), { citizenship: "FI" });
  assert.equal(sourcesForProfile(DEMO_PROFILE).length, 4);
  assert.deepEqual(sourcesForProfile({ ...DEMO_PROFILE, university: "Another university" }).map((source) => source.id), ["amsterdam-registration"]);
});
