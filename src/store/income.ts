import type { IncomeEntry, NewIncomeEntry } from "../types";
import { getDb } from "./db";

export function currentMonthPrefix(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export function todayIsoDate(date = new Date()): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function formatAmount(amount: number): string {
  return amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export async function fetchIncomeEntries(): Promise<IncomeEntry[]> {
  const db = await getDb();
  return db.select<IncomeEntry[]>(
    "SELECT * FROM income_entries ORDER BY received_at DESC, id DESC",
  );
}

export async function createIncomeEntry(
  entry: NewIncomeEntry,
): Promise<void> {
  const db = await getDb();
  await db.execute(
    `INSERT INTO income_entries (project_id, amount, source, received_at)
     VALUES ($1, $2, $3, $4)`,
    [entry.project_id, entry.amount, entry.source, entry.received_at],
  );
}

export async function deleteIncomeEntry(id: number): Promise<void> {
  const db = await getDb();
  await db.execute("DELETE FROM income_entries WHERE id = $1", [id]);
}

export async function fetchMonthIncomeTotal(
  monthPrefix = currentMonthPrefix(),
): Promise<number> {
  const db = await getDb();
  const rows = await db.select<{ total: number | null }[]>(
    "SELECT SUM(amount) AS total FROM income_entries WHERE received_at LIKE $1",
    [`${monthPrefix}%`],
  );
  return rows[0]?.total ?? 0;
}
