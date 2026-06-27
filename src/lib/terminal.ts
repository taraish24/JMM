import { Command } from "@tauri-apps/plugin-shell";

export async function openProjectTerminal(path: string): Promise<void> {
  await Command.create("open-terminal", ["--workdir", path]).spawn();
}

export function terminalErrorMessage(err: unknown): string {
  const detail =
    err instanceof Error ? err.message : "failed to open terminal";
  if (/not found|enoent|spawn/i.test(detail)) {
    return "terminal emulator not found — install konsole";
  }
  return detail;
}
