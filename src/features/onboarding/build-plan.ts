import type { MovableCommands } from "@/lib/movable/contracts";
import type { BuildAttempt } from "./profile-fields";

/** Record creation before generating, so a failed generation resumes the same move. */
export async function continuePlan(
  attempt: BuildAttempt,
  commands: Pick<MovableCommands, "createMove" | "generatePlan">,
  onCreated: (attempt: BuildAttempt) => void,
  onPhase: (phase: "create" | "generate") => void,
): Promise<void> {
  let current = attempt;
  if (!current.moveId) {
    onPhase("create");
    const { moveId } = await commands.createMove(current.profile, current.createRequestId);
    current = { ...current, moveId };
    onCreated(current);
  }
  onPhase("generate");
  await commands.generatePlan(current.moveId!, current.planRequestId);
}
