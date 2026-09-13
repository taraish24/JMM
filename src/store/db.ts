import Database from "@tauri-apps/plugin-sql";

const DB_PATH = "sqlite:jmm.db";

let dbPromise: Promise<Database> | null = null;

// Every caller must share one load(): the sql plugin takes the pending
// migrations out of its map before running them, so a second concurrent
// load() finds none left and resolves before the schema exists.
export function getDb(): Promise<Database> {
  if (!dbPromise) {
    dbPromise = Database.load(DB_PATH).catch((err) => {
      dbPromise = null;
      throw err;
    });
  }
  return dbPromise;
}
