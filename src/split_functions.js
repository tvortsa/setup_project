import { walk } from "@std/fs/walk";
import * as path from "@std/path";
import { load_ignore_config, should_ignore } from "./utils/ignore_filter.js";
import { extract_named_functions } from "./utils/extract_functions.js";

/**
 * Разбивает функции по отдельным файлам и сохраняет их в указанную директорию.
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

    const source = await Deno.readTextFile(entry.path);
    const functions = extract_named_functions(source);

    for (const func of functions) {
      const rel_path = path.relative(root_dir, entry.path).replace(/[\/\\]/g, "_");
      const file_safe_name = `${rel_path}__${func.name}.js`;
      const target_path = path.join(output_dir, file_safe_name);

      await Deno.writeTextFile(target_path, func.code);
    }
  }

  console.log(`Функции сохранены в папку: ${output_dir}`);
}
