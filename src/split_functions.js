// src/split_functions.js

import { walk } from "@std/fs/walk";
import * as path from "jsr:@std/path@1.0.8";
import { load_ignore_settings, should_exclude_file } from "./utils/ignore_filter.js";
import { extract_functions } from "./utils/extract_functions.js";

/**
 * Разбивает все именованные функции из исходников проекта на отдельные файлы.
 *
 * @param {Object} options
 * @param {string} [options.root_dir="."] - Корневая директория проекта
 * @param {string} [options.output_dir="./__functions"] - Куда сохранять пофункциональные файлы
 * @param {string} [options.ignore_config_path="./combined_code_ignore.toml"] - TOML с путями/расширениями/глобами для исключения
 */
export async function split_functions_into_files({
  root_dir = ".",
  output_dir = "./__functions",
  ignore_config_path = "./combined_code_ignore.toml"
} = {}) {
  // Проверка наличия TOML-файла
  try {
    await Deno.stat(ignore_config_path);
  } catch (e) {
    if (e instanceof Deno.errors.NotFound) {
      console.error(`Файл ignore_config_path не найден: ${ignore_config_path}`);
      return;
    } else {
      throw e;
    }
  }

  const { exclude_dirs, exclude_files, exclude_patterns, exclude_extensions } =
    await load_ignore_settings(ignore_config_path);

  await Deno.mkdir(output_dir, { recursive: true });

  // --- Определяем имя проекта ---
  let project_name = null;
  // 1. Аргумент командной строки
  const project_arg = Deno.args.find((arg) => arg.startsWith("--project-name="));
  if (project_arg) {
    project_name = project_arg.split("=")[1];
  } else {
    // 2. deno.jsonc
    try {
      const config_text = await Deno.readTextFile(path.join(root_dir, "deno.jsonc"));
      const json_text = config_text.replace(/\/\/.*$/gm, "");
      const config = JSON.parse(json_text);
      if (config && config.name) project_name = config.name;
    } catch (_e) {
      // ignore
    }
    // 3. Имя папки
    if (!project_name) {
      project_name = path.basename(path.resolve(root_dir));
    }
  }

  // --- Сохраняем project_name в __functions/__project_meta.json ---
  const meta_path = path.join(output_dir, "__project_meta.json");
  await Deno.writeTextFile(meta_path, JSON.stringify({ project: project_name }, null, 2));

  for await (const entry of walk(root_dir, { includeDirs: false })) {
    if (should_exclude_file(entry.path, {
      exclude_dirs,
      exclude_files,
      exclude_patterns,
      exclude_extensions
    })) {
      continue;
    }

    const ext = path.extname(entry.path);
    if (![".js", ".ts", ".jsx", ".tsx", ".mjs"].includes(ext)) continue;

    let source;
    try {
      source = await Deno.readTextFile(entry.path);
    } catch (_) {
      console.warn(`Не удалось прочитать файл: ${entry.path}`);
      continue;
    }

    const functions = extract_functions(source);
    if (functions.length === 0) continue;

    const rel_path = path.relative(root_dir, entry.path)
      .replace(/[\/\\]/g, "_")
      .replace(/\.[jt]sx?$/, "");

    for (const func of functions) {
      const file_safe_name = `${rel_path}__${func.name}.js`;
      const target_path = path.join(output_dir, file_safe_name);
      await Deno.writeTextFile(target_path, func.code);
    }
  }

  console.log(`\n✅ Функции сохранены в папку: ${output_dir}`);
}
