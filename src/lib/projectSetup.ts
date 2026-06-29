import { invoke } from "@tauri-apps/api/core";

export async function setupNewProject(projectPath: string): Promise<void> {
  await invoke("setup_project", { path: projectPath });
}
