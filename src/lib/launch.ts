import { Command } from "@tauri-apps/plugin-shell";
import type { PreferredTool } from "../types";

const SHELL_COMMANDS: Record<PreferredTool, string> = {
  cursor: "launch-cursor",
  claude: "launch-claude",
};

export async function launchInTool(
  tool: PreferredTool,
  path: string,
): Promise<void> {
  await Command.create(SHELL_COMMANDS[tool], [path]).spawn();
}

export function launchErrorMessage(
  tool: PreferredTool,
  err: unknown,
): string {
  const toolName = tool === "cursor" ? "cursor" : "claude";
  const detail =
    err instanceof Error ? err.message : "failed to start process";
  if (/not allowed|scope|denied/i.test(detail)) {
    return `${toolName} is not permitted — check app permissions`;
  }
  if (/not found|enoent|spawn/i.test(detail)) {
    return `${toolName} is not installed or not on PATH`;
  }
  return `${toolName}: ${detail}`;
}
