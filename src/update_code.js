// update_code.js

/**
 * Чтение /updates/:
* Скрипт читает все .js файлы в папке ./updates/.
* Парсинг пути:
* Первая строка (//src/logger) указывает, куда записать файл.
* Сравнение и обновление:
* Если файл существует:
* Новые импорты добавляются в начало, если их нет в старом файле.
* Новые функции добавляются, существующие заменяются по имени (function имя()).
* Если файла нет, создаётся новый.
* Логи: Выводит [CREATE] или [UPDATE] для каждого файла.
* Пример обновления
* Файл в updates/example.js:
* javascript
* //src/logger/log_info.js
* import { something } from "somewhere";
* 
* function log_info(message) {
*   console.log(`[INFO] Updated: ${message}`);
* }
* 
* function new_feature() {
*   console.log("New!");
* }
* Если src/logger/log_info.js уже есть:
* Добавит новый импорт (если его нет).
* Заменит log_info на обновлённую версию.
* Добавит new_feature в конец.
* Если нет — создаст файл как есть..
 */
export async function update_code() {
    const updates_dir = "updates";
    try {
      for await (const entry of Deno.readDir(updates_dir)) {
        if (!entry.isFile || !entry.name.endsWith(".js")) continue;
  
        const file_path = `${updates_dir}/${entry.name}`;
        const new_content = await Deno.readTextFile(file_path);
        const lines = new_content.split("\n");
  
        // Парсим путь из первой строки (комментарий)
        const target_path = lines[0].startsWith("//") ? lines[0].slice(2).trim() : null;
        if (!target_path) {
          console.log(`[SKIP] No target path in ${file_path}`);
          continue;
        }
  
        const target_file = target_path.endsWith(".js") ? target_path : `${target_path}.js`;
        let existing_content = "";
        try {
          existing_content = await Deno.readTextFile(target_file);
        } catch (e) {
          // Если файла нет, создаём новый
          await Deno.writeTextFile(target_file, new_content);
          console.log(`[CREATE] ${target_file}`);
          continue;
        }
  
        // Разделяем на импорты и функции
        const new_lines = lines.slice(1); // Без комментария
        const new_imports = new_lines.filter(line => line.trim().startsWith("import"));
        const new_functions = new_lines.filter(line => !line.trim().startsWith("import") && line.trim());
  
        const old_lines = existing_content.split("\n");
        const old_imports = old_lines.filter(line => line.trim().startsWith("import"));
        const old_functions = old_lines.filter(line => !line.trim().startsWith("import") && line.trim());
  
        // Сравниваем и обновляем импорты
        const combined_imports = [...old_imports];
        for (const imp of new_imports) {
          if (!combined_imports.some(existing => existing.trim() === imp.trim())) {
            combined_imports.push(imp);
          }
        }
  
        // Сравниваем и обновляем функции
        const combined_functions = [...old_functions];
        for (const new_func of new_functions) {
          const new_func_name = new_func.match(/function\s+(\w+)/)?.[1];
          if (!new_func_name) continue;
  
          const old_func_idx = combined_functions.findIndex(line => line.match(/function\s+(\w+)/)?.[1] === new_func_name);
          if (old_func_idx >= 0) {
            // Заменяем существующую функцию
            combined_functions[old_func_idx] = new_func;
          } else {
            // Добавляем новую функцию
            combined_functions.push(new_func);
          }
        }
  
        // Собираем обновлённый код
        const updated_content = [...combined_imports, "", ...combined_functions].join("\n");
        await Deno.writeTextFile(target_file, updated_content);
        console.log(`[UPDATE] ${target_file}`);
      }
    } catch (e) {
      console.error("[ERROR]", e.message);
    }
  }