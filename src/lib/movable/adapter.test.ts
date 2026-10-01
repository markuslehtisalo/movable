import test from "node:test";
import assert from "node:assert/strict";
import { createLocalAdapter, LOCAL_STORAGE_KEY } from "./local-adapter";
import { DEMO_PROFILE, createFixtureTasks } from "./fixtures";
import { completeProfileSchema } from "./contracts";
import { getNextTasks, isBlocked, rescheduleTasks, shiftDate } from "./selectors";

function memoryStorage() {
  const values = new Map<string, string>();
  return { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); } };
}

test("a local move and completed tasks survive adapter recreation", async () => {
  const storage = memoryStorage();
  const first = createLocalAdapter("local", () => storage);
  first.hydrate();
  const { moveId } = await first.commands.createMove(DEMO_PROFILE, "create");
  await first.commands.generatePlan(moveId, "plan");
  const task = first.getSnapshot().tasks[0];
  await first.commands.setTaskStatus(task.id, "done", "complete");
  const second = createLocalAdapter("local", () => storage);
  second.hydrate();
  assert.equal(second.getSnapshot().move?.id, moveId);
  assert.equal(second.getSnapshot().tasks[0].status, "done");
});

test("generation and chat retries do not duplicate or repeat changes", async () => {
  const adapter = createLocalAdapter("demo");
  const moveId = adapter.getSnapshot().move!.id;
  await adapter.commands.generatePlan(moveId, "plan");
  await adapter.commands.generatePlan(moveId, "plan");
  assert.equal(adapter.getSnapshot().tasks.length, 12);
  const input = "I'm arriving two weeks later, and I've found housing.";
  await adapter.commands.sendMessage(moveId, input, null, "message");
  await adapter.commands.sendMessage(moveId, input, null, "message");
  assert.equal(adapter.getSnapshot().move!.profile.arrivalDate, "2027-01-29");
  assert.equal(adapter.getSnapshot().messages.length, 3);
  assert.equal(adapter.getSnapshot().messages.at(-1)?.receipts.length, 2);
  assert.equal(adapter.getSnapshot().tasks.find((task) => task.key === "find-housing")?.status, "done");
});

test("arrival changes retain completed timing and official deadlines", () => {
  const tasks = createFixtureTasks("test", DEMO_PROFILE);
  tasks[0].status = "done";
  tasks[1].timing.kind = "official";
  const moved = rescheduleTasks(tasks, "2027-02-01");
  assert.equal(moved[0].timing.date, tasks[0].timing.date);
  assert.equal(moved[1].timing.date, tasks[1].timing.date);
  assert.equal(moved[2].timing.date, shiftDate("2027-02-01", -45));
});

test("dependencies determine the next actions and react to reopening", async () => {
  const adapter = createLocalAdapter("demo");
  const tasks = adapter.getSnapshot().tasks;
  const housing = tasks.find((task) => task.key === "find-housing")!;
  const travel = tasks.find((task) => task.key === "travel")!;
  assert.equal(isBlocked(travel, tasks), true);
  await adapter.commands.setTaskStatus(housing.id, "done", "complete");
  assert.equal(isBlocked(travel, adapter.getSnapshot().tasks), false);
  await adapter.commands.setTaskStatus(housing.id, "todo", "reopen");
  assert.equal(isBlocked(travel, adapter.getSnapshot().tasks), true);
  assert.ok(!getNextTasks(adapter.getSnapshot().tasks, 99).some((task) => task.key === "travel"));
});

test("the public example never writes to the personal local workspace", async () => {
  const storage = memoryStorage();
  const local = createLocalAdapter("local", () => storage);
  await local.commands.createMove(DEMO_PROFILE, "local-create");
  const before = storage.getItem(LOCAL_STORAGE_KEY);
  const demo = createLocalAdapter("demo", () => storage);
  demo.hydrate();
  await demo.commands.sendMessage(demo.getSnapshot().move!.id, "two weeks later", null, "example-change");
  demo.commands.resetDemo();
  assert.equal(storage.getItem(LOCAL_STORAGE_KEY), before);
  assert.equal(demo.getSnapshot().move!.profile.arrivalDate, DEMO_PROFILE.arrivalDate);
});

test("live mode refuses mutations instead of silently returning example data", async () => {
  const live = createLocalAdapter("live");
  assert.equal(live.getSnapshot().phase, "error");
  assert.equal(live.getSnapshot().move, null);
  await assert.rejects(live.commands.createMove(DEMO_PROFILE, "create"), /not connected/);
  await assert.rejects(live.commands.extractProfile("hello"), /not connected/);
});

test("invalid saved content is recoverable and does not crash the app", () => {
  const storage = memoryStorage();
  storage.setItem(LOCAL_STORAGE_KEY, "{broken");
  const adapter = createLocalAdapter("local", () => storage);
  adapter.hydrate();
  assert.equal(adapter.getSnapshot().move, null);
  assert.match(adapter.getSnapshot().error!, /could not be restored/);
});

test("a fixed stay requires duration and dates must be real calendar dates", () => {
  assert.equal(completeProfileSchema.safeParse({ ...DEMO_PROFILE, durationMonths: null }).success, false);
  assert.equal(completeProfileSchema.safeParse({ ...DEMO_PROFILE, arrivalDate: "2027-02-30" }).success, false);
});

test("regenerating preserves task identity and completed work", async () => {
  const adapter = createLocalAdapter("demo");
  const before = adapter.getSnapshot().tasks[0];
  await adapter.commands.generatePlan(adapter.getSnapshot().move!.id, "regenerate");
  assert.equal(adapter.getSnapshot().tasks[0].id, before.id);
  assert.equal(adapter.getSnapshot().tasks[0].status, "done");
});
