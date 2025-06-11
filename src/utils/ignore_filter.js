// Файл: utils/ignore_filter.js

// Позволяет загрузить настройки игнорирования из TOML-файла (по умолчанию combined_code_ignore.toml) 
// и проверить, нужно ли исключить файл по: директории, имени файла, шаблону (*.log, combined_code*.txt)
// расширению (.exe, .dll, .jpg и т.д.)

import { dirname, basename, extname } from "jsr:@std/path";
import { parse } from "jsr:@std/toml";
import { exists } from "jsr:@std/fs";

export async function load_ignore_settings(ignore_file = "combined_code_ignore.toml") {
  const default_settings = {
    exclude_dirs: ["node_modules", ".git", ".vscode", "dist", "build"],
    exclude_files: [".env", ".DS_Store"],
    exclude_patterns: ["combined_code*.txt", "*.log", "*.tmp"],
    exclude_extensions: [
      ".exe", ".dll", ".jpg", ".png", ".gif",
      ".mp3", ".mp4", ".zip", ".rar", ".7z",
      ".pdf", ".lock"
    ]
  };

  if (await exists(ignore_file)) {
    const config_text = await Deno.readTextFile(ignore_file);
    const settings = parse(config_text);
    return {
      exclude_dirs: settings.directories?.exclude || default_settings.exclude_dirs,
      exclude_files: settings.files?.exclude || default_settings.exclude_files,
      exclude_patterns: settings.patterns?.exclude || default_settings.exclude_patterns,
      exclude_extensions: settings.extensions?.exclude || default_settings.exclude_extensions
    };
  }

  return default_settings;
}

function match_pattern(file_name, pattern) {
  const regex = new RegExp(`^${pattern.replace(/\./g, "\\.").replace(/\*/g, ".*")}$`, "i");
  return regex.test(file_name);
}

export function should_exclude_file(file_path, settings) {
  const normalized = file_path.replace(/\\/g, "/");
  const file_name = basename(normalized);

  for (const dir of settings.exclude_dirs) {
    if (
      normalized.includes(`/${dir}/`) ||
      normalized.startsWith(`${dir}/`) ||
      normalized === dir ||
      normalized.startsWith(`./${dir}/`)
    ) return true;
  }

  if (settings.exclude_files.includes(file_name)) return true;

  for (const pattern of settings.exclude_patterns) {
    if (match_pattern(file_name, pattern)) return true;
  }

  for (const ext of settings.exclude_extensions) {
    if (normalized.toLowerCase().endsWith(ext.toLowerCase())) return true;
  }

  return false;
}