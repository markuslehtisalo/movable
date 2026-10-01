import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";

const runId = randomUUID();
const identity = (name) => ({ subject: `${runId}-${name}`, issuer: "https://movable-smoke.invalid", tokenIdentifier: `https://movable-smoke.invalid|${runId}-${name}` });
const alice = identity("alice");
const bob = identity("bob");
function run(name, args, user) {
  const command = ["exec", "convex", "run", name, JSON.stringify(args)];
  if (user) command.push("--identity", JSON.stringify(user));
  const output = execFileSync("pnpm", command, { encoding: "utf8", timeout: 180000, stdio: ["ignore", "pipe", "pipe"] }).trim();
  return output ? JSON.parse(output) : null;
}
const profile = { citizenship: "FI", originCountry: "FI", originCity: "Helsinki", destinationCountry: "NL", destinationCity: "Amsterdam", university: "University of Amsterdam", studyType: "exchange", arrivalDate: "2027-01-15", stayType: "fixed", durationMonths: 6 };
try {
  assert.throws(() => run("workspace:snapshot", {}));
  console.log("PASS anonymous access rejected");
  const created = run("workspace:createMove", { profile, requestId: "create" }, alice);
  assert.deepEqual(run("workspace:createMove", { profile, requestId: "create" }, alice), created);
  assert.equal(run("workspace:snapshot", {}, bob).move, null);
  assert.throws(() => run("workspace:updateProfile", { moveId: created.moveId, patch: { arrivalDate: "2027-02-01" }, requestId: "foreign" }, bob));
  console.log("PASS move creation retry and owner isolation");
  const extracted = run("ai:extractProfile", { text: "I'm a Finnish student moving from Helsinki to Amsterdam on 15 January 2027 for a six-month exchange at the University of Amsterdam.", requestId: "extract" }, alice);
  assert.equal(extracted.citizenship, "FI");
  assert.equal(extracted.arrivalDate, "2027-01-15");
  console.log("PASS live OpenAI profile extraction");
  run("ai:generatePlan", { moveId: created.moveId, requestId: "plan" }, alice);
  const planned = run("workspace:snapshot", {}, alice);
  assert.equal(planned.tasks.length, 12);
  assert.equal(planned.sources.length, 4);
  const first = planned.tasks[0];
  run("workspace:setTaskStatus", { taskId: first.id, status: "done", requestId: "complete" }, alice);
  assert.throws(() => run("workspace:setTaskStatus", { taskId: first.id, status: "done", requestId: "foreign-task" }, bob));
  console.log("PASS live personalized plan, sources and task ownership");
  const chat = { moveId: created.moveId, text: "I'm arriving two weeks later, and I've already found housing.", selectedTaskId: null, requestId: "chat" };
  run("ai:sendMessage", chat, alice);
  run("ai:sendMessage", chat, alice);
  run("ai:generatePlan", { moveId: created.moveId, requestId: "plan" }, alice);
  const changed = run("workspace:snapshot", {}, alice);
  assert.equal(changed.move.profile.arrivalDate, "2027-01-29");
  assert.equal(changed.tasks.find((task) => task.key === "find-housing").status, "done");
  assert.equal(changed.tasks.find((task) => task.id === first.id).status, "done");
  assert.equal(changed.tasks.find((task) => task.id === first.id).timing.date, first.timing.date);
  assert.equal(changed.messages.length, 2);
  assert.equal(changed.messages[1].receipts.length, 2);
  assert.equal(run("workspace:snapshot", {}, bob).move, null);
  console.log("PASS live conversation changes, retry idempotency and saved progress");
  run("ai:sendMessage", { moveId: created.moveId, text: "Draft a short message to my university international office asking whether arriving on my new arrival date affects orientation. Do not change my plan.", selectedTaskId: null, requestId: "draft" }, alice);
  const drafted = run("workspace:snapshot", {}, alice);
  assert.ok(drafted.messages.at(-1).draft?.body);
  assert.equal(drafted.messages.at(-1).receipts.length, 0);
  console.log("PASS university message draft, with no external sending");
} catch (error) {
  console.error(error.stderr?.toString() || error.message);
  process.exitCode = 1;
} finally {
  for (const user of [alice, bob]) {
    try { run("maintenance:removeSmokeData", { owner: user.tokenIdentifier }); }
    catch { console.error(`Cleanup needed for test identity ${user.tokenIdentifier}`); process.exitCode = 1; }
  }
}
