import assert from "node:assert/strict";
import { test } from "node:test";
import { createLocalAdapter } from "@/lib/movable/local-adapter";
import { DEMO_PROFILE, EXAMPLE_PROMPT } from "@/lib/movable/fixtures";
import { continuePlan } from "./build-plan";
import { DETAILS_KEY, EMPTY_FIELDS, fieldsFromProfile, restoreDetails, validateFields, type BuildAttempt } from "./profile-fields";

test("incomplete details stay missing instead of inheriting example facts", () => {
  const result = validateFields({ ...EMPTY_FIELDS, originCity: "Turku" });
  assert.equal(result.profile, null);
  assert.ok(result.errors.citizenship);
  assert.ok(result.errors.arrivalDate);
  assert.ok(result.errors.university);
});

test("limited extraction leaves unspecified citizenship, dates, and university empty", async () => {
  const adapter = createLocalAdapter("local");
  const fields = fieldsFromProfile(await adapter.commands.extractProfile("I’m moving to Amsterdam."));
  assert.equal(fields.destinationCity, "Amsterdam");
  assert.equal(fields.destinationCountry, "NL");
  assert.equal(fields.citizenship, "");
  assert.equal(fields.originCountry, "");
  assert.equal(fields.arrivalDate, "");
  assert.equal(fields.university, "");
  assert.equal(fields.durationMonths, "");
});

test("confirmation uses edited values and requires a fixed duration", () => {
  const fields = { ...fieldsFromProfile(DEMO_PROFILE), originCity: "  Turku  ", university: "A different host university", durationMonths: "9" };
  assert.deepEqual(validateFields(fields).profile, { ...DEMO_PROFILE, originCity: "Turku", university: "A different host university", durationMonths: 9 });
  assert.ok(validateFields({ ...fields, durationMonths: "" }).errors.durationMonths);
  assert.ok(validateFields({ ...fields, durationMonths: "2.5" }).errors.durationMonths);
  assert.equal(validateFields({ ...fields, stayType: "open-ended", durationMonths: "9" }).profile?.durationMonths, null);
});

test("a plan retry reuses the created move, request ID and confirmed corrections", async () => {
  const adapter = createLocalAdapter("local", () => ({ getItem: () => null, setItem: () => {} }));
  let current: BuildAttempt = {
    profile: { ...DEMO_PROFILE, originCity: "Turku", arrivalDate: "2027-02-01", durationMonths: 9 },
    createRequestId: "create-once", planRequestId: "generate-once", moveId: null,
  };
  let creates = 0;
  let generates = 0;
  const ids: string[] = [];
  const commands = {
    createMove: async (...args: Parameters<typeof adapter.commands.createMove>) => {
      creates += 1;
      return adapter.commands.createMove(...args);
    },
    generatePlan: async (moveId: string, requestId: string) => {
      ids.push(requestId);
      generates += 1;
      if (generates === 1) throw new Error("Simulated interruption");
      return adapter.commands.generatePlan(moveId, requestId);
    },
  };
  const remember = (attempt: BuildAttempt) => { current = attempt; };
  await assert.rejects(continuePlan(current, commands, remember, () => {}), /interruption/);
  const createdId = current.moveId;
  assert.ok(createdId);
  await continuePlan(current, commands, remember, () => {});
  assert.equal(creates, 1);
  assert.deepEqual(ids, ["generate-once", "generate-once"]);
  assert.equal(adapter.getSnapshot().move?.id, createdId);
  assert.equal(adapter.getSnapshot().move?.profile.originCity, "Turku");
  assert.equal(adapter.getSnapshot().move?.profile.durationMonths, 9);
  assert.equal(adapter.getSnapshot().phase, "ready");
  assert.ok(adapter.getSnapshot().tasks.length);
});

test("a lost creation response can be retried without replacing completed work", async () => {
  const adapter = createLocalAdapter("local", () => ({ getItem: () => null, setItem: () => {} }));
  const attempt: BuildAttempt = { profile: DEMO_PROFILE, createRequestId: "create", planRequestId: "plan", moveId: null };
  const { moveId } = await adapter.commands.createMove(DEMO_PROFILE, "create");
  await adapter.commands.generatePlan(moveId, "initial-plan");
  const task = adapter.getSnapshot().tasks[0];
  await adapter.commands.setTaskStatus(task.id, "done", "completed");
  await continuePlan(attempt, adapter.commands, () => {}, () => {});
  assert.equal(adapter.getSnapshot().move?.id, moveId);
  assert.equal(adapter.getSnapshot().tasks.find((item) => item.id === task.id)?.status, "done");
});

test("refresh keeps edited text and fields while a new incoming draft starts fresh", () => {
  const values = new Map<string, string>();
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  Object.defineProperty(globalThis, "window", { configurable: true, value: { sessionStorage: { getItem: (key: string) => values.get(key) ?? null } } });
  try {
    const draft = {
      entryDraft: EXAMPLE_PROMPT, text: "My edited description", fields: { ...fieldsFromProfile(DEMO_PROFILE), originCity: "Turku" },
      touched: ["originCity"], extractedText: EXAMPLE_PROMPT, step: "details",
    };
    values.set(DETAILS_KEY, JSON.stringify({ draft, attempt: null }));
    assert.deepEqual(restoreDetails(EXAMPLE_PROMPT, draft.text).draft, draft);
    assert.deepEqual(restoreDetails(null, draft.text).draft, draft);
    const attempt: BuildAttempt = { profile: DEMO_PROFILE, createRequestId: "saved-create", planRequestId: "saved-plan", moveId: "saved-move" };
    values.set(DETAILS_KEY, JSON.stringify({ draft, attempt }));
    assert.deepEqual(restoreDetails(null, draft.text).attempt, attempt);
    const newDraft = restoreDetails("A different move", draft.text).draft;
    assert.equal(newDraft.text, "A different move");
    assert.deepEqual(newDraft.fields, EMPTY_FIELDS);
    values.set(DETAILS_KEY, "invalid JSON");
    assert.equal(restoreDetails(null, "Saved marketing description").draft.text, "Saved marketing description");
  } finally {
    if (previousWindow) Object.defineProperty(globalThis, "window", previousWindow);
    else Reflect.deleteProperty(globalThis, "window");
  }
});
