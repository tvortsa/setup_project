// src/generate_template.js
import { Select } from "jsr:@cliffy/prompt@1.0.0-rc.7";
import { join, dirname, basename } from "jsr:@std/path";
import { existsSync } from "jsr:@std/fs@0.224.0";

const base_dir = Deno.cwd();

/** Рекурсивно ищет все .json шаблоны в папке шаблонов */
async function scanTemplatesFolder(folderPath) {
  const templates = [];
  for await (const entry of Deno.readDir(folderPath)) {
    if (
      entry.isFile &&
      (entry.name.endsWith(".json") || entry.name.endsWith(".jsonc"))
    ) {
      const fullPath = join(folderPath, entry.name);
      try {
        const text = await Deno.readTextFile(fullPath);
        let template;
        try {
          // jsonc - удалим однострочные комментарии // ... (если надо)
          const withoutComments = text.replace(/\/\/.*$/gm, "");
          template = JSON.parse(withoutComments);
        } catch {
          template = JSON.parse(text);
        }
        templates.push({
          name: basename(
            entry.name,
            entry.name.endsWith(".jsonc") ? ".jsonc" : ".json"
          ),
          description: template.description ?? "(Без описания)",
          path: fullPath,
          templateData: template,
        });
      } catch (e) {
        // Просто игнорируем битые/непарсящиеся файлы
        console.warn(
          "Не удалось прочитать/распарсить шаблон",
          entry.name,
          e.message
        );
      }
    }
  }
  return templates;
}

export async function generateProjectFromTemplate() {
  const template_dir = join(base_dir, "src", "templates", "modules");

  console.log("Папка текущего проекта:", base_dir);

  if (!existsSync(template_dir)) {
    console.log("Нет папки шаблонов:", template_dir);
    return;
  }

  // 1. Найдём шаблоны
  const templates = await scanTemplatesFolder(template_dir);
  if (!templates.length) {
    console.log("Нет шаблонов :(");
    return;
  }

  // 2. Показываем меню выбора
  const choice = await Select.prompt({
    message: "Выберите шаблон проекта:",
    options: templates.map((t) => ({
      name: `${t.name} — ${t.description}`,
      value: t,
    })),
    pointer: "\x1b[1m>\x1b[0m ",
  });

  const template = choice.templateData; // Это сам содержимое шаблона

  if (!Array.isArray(template.files)) {
    console.log("Шаблон не содержит поле files!");
    return;
  }

  // 3. Генерируем файлы
  for (const f of template.files) {
    await Deno.mkdir(dirname(f.path), { recursive: "literal" > true }).catch(
      () => {}
    );

    // Если есть контент — создаём файл

    if ("content" in f) {
      await Deno.writeTextFile(f.path, f.content);

      console.log(`Создан файл: ${f.path}`);
    } else {
      // Создаём саму папку, если это папка, а не файл

      await Deno.mkdir(f.path, { recursive: true }).catch(() => {});

      console.log(`Создана папка: ${f.path}`);
    }

    console.log("Проект сгенерирован по шаблону!");
  }
}
