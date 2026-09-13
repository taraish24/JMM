import type { NewProject, Project, ProjectRow } from "../types";
import { getDb } from "./db";

// The sql plugin rejects with a plain string, so `instanceof Error` misses it.
export function describeProjectWriteError(
  err: unknown,
  fallback: string,
): string {
  const message = err instanceof Error ? err.message : String(err ?? "");
  if (message.includes("UNIQUE") && message.includes("path")) {
    return "Another project already uses that path";
  }
  return message || fallback;
}

function rowToProject(row: ProjectRow): Project {
  let tech_stack: string[] = [];
  try {
    tech_stack = JSON.parse(row.tech_stack);
  } catch {
    tech_stack = [];
  }

  return {
    id: row.id,
    name: row.name,
    path: row.path,
    tech_stack,
    progress: row.progress,
    last_commit_date: row.last_commit_date,
    status: row.status,
    preferred_tool: row.preferred_tool,
  };
}

export async function fetchProjects(): Promise<Project[]> {
  const db = await getDb();
  const rows = await db.select<ProjectRow[]>(
    "SELECT * FROM projects ORDER BY status = 'active' DESC, name ASC",
  );
  return rows.map(rowToProject);
}

export async function createProject(project: NewProject): Promise<Project> {
  const db = await getDb();
  const result = await db.execute(
    `INSERT INTO projects (name, path, tech_stack, progress, last_commit_date, status)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [
      project.name,
      project.path,
      JSON.stringify(project.tech_stack),
      project.progress,
      project.last_commit_date ?? null,
      project.status,
    ],
  );

  const id = result.lastInsertId;
  const rows = await db.select<ProjectRow[]>(
    "SELECT * FROM projects WHERE id = $1",
    [id],
  );

  return rowToProject(rows[0]);
}

export async function updateProject(
  id: number,
  updates: Partial<
    Pick<
      Project,
      | "name"
      | "path"
      | "tech_stack"
      | "progress"
      | "status"
      | "last_commit_date"
      | "preferred_tool"
    >
  >,
): Promise<void> {
  const db = await getDb();
  const fields: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (updates.name !== undefined) {
    fields.push(`name = $${paramIndex++}`);
    values.push(updates.name);
  }
  if (updates.path !== undefined) {
    fields.push(`path = $${paramIndex++}`);
    values.push(updates.path);
  }
  if (updates.tech_stack !== undefined) {
    fields.push(`tech_stack = $${paramIndex++}`);
    values.push(JSON.stringify(updates.tech_stack));
  }
  if (updates.progress !== undefined) {
    fields.push(`progress = $${paramIndex++}`);
    values.push(updates.progress);
  }
  if (updates.status !== undefined) {
    fields.push(`status = $${paramIndex++}`);
    values.push(updates.status);
  }
  if (updates.last_commit_date !== undefined) {
    fields.push(`last_commit_date = $${paramIndex++}`);
    values.push(updates.last_commit_date);
  }
  if (updates.preferred_tool !== undefined) {
    fields.push(`preferred_tool = $${paramIndex++}`);
    values.push(updates.preferred_tool);
  }

  if (fields.length === 0) return;

  values.push(id);
  await db.execute(
    `UPDATE projects SET ${fields.join(", ")} WHERE id = $${paramIndex}`,
    values,
  );
}

export async function deleteProject(id: number): Promise<void> {
  const db = await getDb();
  await db.execute("DELETE FROM projects WHERE id = $1", [id]);
}
