use tauri_plugin_sql::{Migration, MigrationKind};

#[tauri::command]
fn get_system_uptime() -> String {
    #[cfg(target_os = "linux")]
    {
        if let Ok(content) = std::fs::read_to_string("/proc/uptime") {
            let secs = content
                .split_whitespace()
                .next()
                .and_then(|s| s.parse::<f64>().ok())
                .unwrap_or(0.0) as u64;
            let days = secs / 86400;
            let hours = (secs % 86400) / 3600;
            let mins = (secs % 3600) / 60;
            return format!("{days}d {hours}h {mins}m");
        }
    }

    #[cfg(target_os = "macos")]
    {
        if let Ok(output) = std::process::Command::new("sysctl")
            .args(["-n", "kern.boottime"])
            .output()
        {
            let text = String::from_utf8_lossy(&output.stdout);
            if let Some(secs_str) = text.split(',').nth(0).and_then(|s| s.split('=').nth(1)) {
                if let Ok(boot_secs) = secs_str.trim().parse::<i64>() {
                    let now = std::time::SystemTime::now()
                        .duration_since(std::time::UNIX_EPOCH)
                        .map(|d| d.as_secs() as i64)
                        .unwrap_or(0);
                    let elapsed = (now - boot_secs).max(0) as u64;
                    let days = elapsed / 86400;
                    let hours = (elapsed % 86400) / 3600;
                    let mins = (elapsed % 3600) / 60;
                    return format!("{days}d {hours}h {mins}m");
                }
            }
        }
    }

    #[cfg(target_os = "windows")]
    {
        // Fallback for Windows — uptime via WMI would need extra deps
    }

    "—".to_string()
}

#[tauri::command]
fn path_exists(path: String) -> bool {
    std::path::Path::new(&path).exists()
}

const PRE_COMMIT_HOOK: &str = r#"#!/bin/sh
# JMM pre-commit hook — refreshes STATUS.md metadata before each commit

STATUS_FILE="STATUS.md"
[ -f "$STATUS_FILE" ] || exit 0

BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
TODAY=$(date -I 2>/dev/null || date +%Y-%m-%d)

if grep -q '^\*\*Updated:\*\*' "$STATUS_FILE"; then
  sed -i "s/^\*\*Updated:\*\*.*/**Updated:** $TODAY/" "$STATUS_FILE"
else
  printf '\n**Updated:** %s\n' "$TODAY" >> "$STATUS_FILE"
fi

if grep -q '^\*\*Branch:\*\*' "$STATUS_FILE"; then
  sed -i "s/^\*\*Branch:\*\*.*/**Branch:** $BRANCH/" "$STATUS_FILE"
else
  printf '**Branch:** %s\n' "$BRANCH" >> "$STATUS_FILE"
fi

git add "$STATUS_FILE" 2>/dev/null || true
exit 0
"#;

const MILESTONES_TEMPLATE: &str = "# Milestones

## Upcoming
- [ ] Define first milestone

## Done
";

#[tauri::command]
fn setup_project(path: String) -> Result<(), String> {
    let project = std::path::Path::new(&path);

    let milestones = project.join("MILESTONES.md");
    if !milestones.exists() {
        std::fs::write(&milestones, MILESTONES_TEMPLATE).map_err(|e| e.to_string())?;
    }

    let hooks_dir = project.join(".git").join("hooks");
    if hooks_dir.exists() {
        let hook_path = hooks_dir.join("pre-commit");
        std::fs::write(&hook_path, PRE_COMMIT_HOOK).map_err(|e| e.to_string())?;

        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            let mut perms = std::fs::metadata(&hook_path)
                .map_err(|e| e.to_string())?
                .permissions();
            perms.set_mode(0o755);
            std::fs::set_permissions(&hook_path, perms).map_err(|e| e.to_string())?;
        }
    }

    Ok(())
}

#[tauri::command]
fn get_git_last_commit_date(path: String) -> Option<String> {
    let output = std::process::Command::new("git")
        .args(["-C", &path, "log", "-1", "--format=%ci"])
        .output()
        .ok()?;

    if !output.status.success() {
        return None;
    }

    let date = String::from_utf8_lossy(&output.stdout).trim().to_string();
    if date.is_empty() {
        None
    } else {
        Some(date)
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let migrations = vec![Migration {
        version: 1,
        description: "create projects table",
        sql: "CREATE TABLE IF NOT EXISTS projects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            path TEXT NOT NULL UNIQUE,
            tech_stack TEXT NOT NULL DEFAULT '[]',
            progress INTEGER NOT NULL DEFAULT 0,
            last_commit_date TEXT,
            status TEXT NOT NULL DEFAULT 'active',
            preferred_tool TEXT
        )",
        kind: MigrationKind::Up,
    }];

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:jmm.db", migrations)
                .build(),
        )
        .invoke_handler(tauri::generate_handler![
            get_system_uptime,
            path_exists,
            setup_project,
            get_git_last_commit_date
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
