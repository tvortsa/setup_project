// Файл: utils/ignore_filter.js

// Позволяет загрузить настройки игнорирования из TOML-файла (по умолчанию combined_code_ignore.toml) 
// и проверить, нужно ли исключить файл по: директории, имени файла, шаблону (*.log, combined_code*.txt)
// расширению (.exe, .dll, .jpg и т.д.)

import { dirname, basename, extname } from "jsr:@std/path@1.0.8";
import { green, yellow, red } from 'jsr:@std/fmt/colors';
import { parse } from 'jsr:@std/toml';
import { exists } from 'jsr:@std/fs';

/**
 * Загружает настройки исключений из файла combined_code_ignore.toml
 * @param {string} ignore_file - Путь к файлу исключений
 * @returns {Promise<Object>} - Объект с настройками исключений
 */
export async function load_ignore_settings(ignore_file = "combined_code_ignore.toml") {
  const default_settings = {
    directories: { exclude: ["node_modules", ".git", ".vscode", "dist", "build"] },
    files: { exclude: [".env", ".DS_Store"] },
    patterns: { exclude: ["combined_code*.txt", "*.log", "*.tmp"] },
    extensions: { exclude: [
      ".exe", ".dll", ".jpg", ".png", ".gif",
      ".mp3", ".mp4", ".zip", ".rar", ".7z",
      ".pdf", ".lock"
    ] }
  };

  try {
    if (await exists(ignore_file)) {
      const config_text = await Deno.readTextFile(ignore_file);
      const settings = parse(config_text);
      console.log(green(`Загружены настройки исключений из ${ignore_file}`));
      return {
        exclude_dirs: settings.directories?.exclude || default_settings.directories.exclude,
        exclude_files: settings.files?.exclude || default_settings.files.exclude,
        exclude_patterns: settings.patterns?.exclude || default_settings.patterns.exclude,
        exclude_extensions: settings.extensions?.exclude || default_settings.extensions.exclude
      };
    } else {
      console.log(yellow(`Файл ${ignore_file} не найден, используются настройки по умолчанию`));
      return {
        exclude_dirs: default_settings.directories.exclude,
        exclude_files: default_settings.files.exclude,
        exclude_patterns: default_settings.patterns.exclude,
        exclude_extensions: default_settings.extensions.exclude
      };
    }
  } catch (error) {
    console.error(red(`Ошибка при загрузке настроек исключений: ${error.message}`));
    return {
      exclude_dirs: default_settings.directories.exclude,
      exclude_files: default_settings.files.exclude,
      exclude_patterns: default_settings.patterns.exclude,
      exclude_extensions: default_settings.extensions.exclude
    };
  }
}

/**
 * Проверяет, соответствует ли файл шаблону с подстановочными знаками
 * @param {string} file_name - Имя файла для проверки
 * @param {string} pattern - Шаблон с подстановочными знаками (поддерживает только *)
 * @returns {boolean} - true, если файл соответствует шаблону
 */
function match_pattern(file_name, pattern) {
  const regex_pattern = pattern
    .replace(/\./g, '\\.')
    .replace(/\*/g, '.*');
  const regex = new RegExp(`^${regex_pattern}$`, 'i');
  return regex.test(file_name);
}

/**
 * Проверяет, должен ли файл быть исключен на основе настроек
 * @param {string} file_path - Путь к файлу
 * @param {Object} settings - Настройки исключений
 * @returns {boolean} - true, если файл должен быть исключен
 */
export function should_exclude_file(file_path, settings) {
  const { exclude_dirs, exclude_files, exclude_patterns, exclude_extensions } = settings;
  const normalized_path = file_path.replace(/\\/g, '/');
  const file_name = basename(normalized_path);

  for (const dir of exclude_dirs) {
    if (
      normalized_path.includes(`/${dir}/`) ||
      normalized_path.startsWith(`${dir}/`) ||
      normalized_path === dir ||
      normalized_path.startsWith(`./${dir}/`)
    ) {
      console.log(yellow(`Исключен файл ${file_path} (находится в директории ${dir})`));
      return true;
    }
  }

  if (exclude_files.includes(file_name)) {
    console.log(yellow(`Исключен файл ${file_path} (в списке исключённых файлов)`));
    return true;
  }

  for (const pattern of exclude_patterns) {
    if (match_pattern(file_name, pattern)) {
      console.log(yellow(`Исключен файл ${file_path} (соответствует шаблону ${pattern})`));
      return true;
    }
  }

  for (const ext of exclude_extensions) {
    if (normalized_path.toLowerCase().endsWith(ext.toLowerCase())) {
      console.log(yellow(`Исключен файл ${file_path} (имеет исключённое расширение ${ext})`));
      return true;
    }
  }

  return false;
}