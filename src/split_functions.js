// src/split_functions.js

import { walk } from "@std/fs/walk";
import * as path from "@std/path";
import { load_ignore_config, should_ignore } from "./utils/ignore_filter.js";
import { extract_named_functions } from "./utils/extract_functions.js";

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
  const { ignore_dirs, ignore_files, ignore_globs, ignore_extensions } =
    await load_ignore_config(ignore_config_path);

  await Deno.mkdir(output_dir, { recursive: true });

  for await (const entry of walk(root_dir, { includeDirs: false })) {
    if (should_ignore(entry, {
      ignore_dirs,
      ignore_files,
      ignore_globs,
      ignore_extensions
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

    const functions = extract_named_functions(source);
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
