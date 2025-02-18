import { parse, stringify } from "jsr:@std/toml@1.0.2";
import { ensureDir } from "jsr:@std/fs@0.216";
// import { JsrMetadata } from "jsr:@jsr"; //  Не используем JsrMetadata пока, для простоты

const config_file_name = "setup.toml";
const default_config_content = `# Пример файла setup.toml
[folders]
src = ["core", "engine", "webui/webui_bind"]
public = []
config = []
assets = []

[files]
"README.md" = "# Проект создан с помощью setup-module"
"src/core/lifecycle.js" = "// Управление жизненным циклом"
"src/core/state.js" = "// Менеджер состояний"
"src/core/event_bus.js" = "// Реактивность и события"
"src/core/config_loader.js" = "// Загрузка конфигурации"
"src/core/storage.js" = "// Персистентное хранилище"
"src/engine/scene.js" = "// 3D-сцена Orillusion"
"src/engine/ui.js" = "// 2D-интерфейс PIXI.js"
"src/engine/input.js" = "// Управление вводом"
"src/engine/assets.js" = "// Загрузка ресурсов"
"src/webui/webui.js" = "// Управление Deno-webui"
"src/webui/webui_bind/scene_bind.js" = "// Привязка сцены"
"src/webui/webui_bind/ui_bind.js" = "// Привязка UI"
"src/webui/webui_bind/storage_bind.js" = "// Привязка хранилища"
"src/webui/webui_bind/settings_bind.js" = "// Привязка настроек"
"public/index.html" = """<!DOCTYPE html>\n<html>\n<head>\n<title>Scene Editor</title>\n</head>\n<body>\n<script type='module' src='app.js'></script>\n</body>\n</html>"""
"public/app.js" = "console.log('App loaded');"
"config/settings.toml" = "# Настройки редактора"
# "deno.jsonc" = "{ \"tasks\": { \"run\": \"deno run --allow-read --allow-write setup.js\" } }"
`;

const module_version = "0.0.3"; // Задайте версию вашего модуля здесь

async function ensure_config_file() {
  try {
    await Deno.stat(config_file_name);
    console.log(`Файл конфигурации "${config_file_name}" уже существует.`);
    return false;
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      console.log(
        `Файл конфигурации "${config_file_name}" не найден. Создаю файл с настройками по умолчанию.`,
      );
      await Deno.writeTextFile(config_file_name, default_config_content);
      return true;
    } else {
      throw error;
    }
  }
}

async function setup_project(options) {
  console.log("- - - Генерация структуры проекта - - - ");
  await ensure_config_file();
  const { force = false, dry_run = false } = options;
  const config_text = await Deno.readTextFile(config_file_name);
  const config = parse(config_text);

  for (const [base_folder, sub_folders] of Object.entries(config.folders)) {
    await create_folder(base_folder, force, dry_run);
    for (const sub_folder of sub_folders) {
      await create_folder(`${base_folder}/${sub_folder}`, force, dry_run);
    }
  }

  for (const [file_path, content] of Object.entries(config.files || {})) {
    await create_file(file_path, content, force, dry_run);
  }
  console.log("- - - Генерация структуры проекта завершена - - - ");
}

async function remove_project_structure(options) {
  console.log("- - - Удаление структуры проекта - - - ");
  const { dry_run = false, force = false } = options;
  try {
    const config_text = await Deno.readTextFile(config_file_name);
    const config = parse(config_text);

    for (const [base_folder, sub_folders] of Object.entries(config.folders)) {
      for (const sub_folder of sub_folders) {
        await remove_path(`${base_folder}/${sub_folder}`, dry_run, force);
      }
      await remove_path(base_folder, dry_run, force);
    }

    for (const file_path of Object.keys(config.files || {})) {
      await remove_path(file_path, dry_run, force);
    }
    console.log("- - - Удаление структуры проекта завершено - - - ");
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      console.warn(
        `Файл конфигурации "${config_file_name}" не найден. Нечего удалять.`,
      );
    } else {
      console.error(`Ошибка при удалении структуры проекта:`, error);
    }
  }
}

async function display_project_info() {
  console.log("- - - Информация о проекте - - - ");
  try {
    const config_text = await Deno.readTextFile(config_file_name);
    const config = parse(config_text);

    console.log("\n--- Папки проекта ---");
    for (const [base_folder, sub_folders] of Object.entries(config.folders)) {
      console.log(`- ${base_folder}`);
      for (const sub_folder of sub_folders) {
        console.log(`  -- ${sub_folder}`);
      }
    }

    if (config.files) {
      console.log("\n--- Файлы проекта ---");
      for (const file_path of Object.keys(config.files)) {
        console.log(`- ${file_path}`);
      }
    }
    console.log("\n- - - Конец информации о проекте - - - ");
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      console.warn(
        `Файл конфигурации "${config_file_name}" не найден. Информация о проекте недоступна.`,
      );
    } else {
      console.error(`Ошибка при чтении информации о проекте:`, error);
    }
  }
}

async function display_module_version() {
  console.log("- - - Версия модуля - - - ");
  console.log(`Версия модуля: ${module_version}`); // Используем константу module_version
  console.log("- - - Конец версии модуля - - - ");
}

async function create_folder(path, force, dry_run) {
  try {
    if (dry_run) {
      console.log(`[DRY RUN] Would create folder: ${path}`);
    } else {
      await Deno.mkdir(path, { recursive: true });
      console.log(`Created folder: ${path}`);
    }
  } catch (error) {
    if (error instanceof Deno.errors.AlreadyExists && !force) {
      console.warn(`Folder already exists: ${path}`);
    } else {
      console.error(`Error creating folder: ${path}`, error);
    }
  }
}

async function create_file(path, content, force, dry_run) {
  try {
    if (dry_run) {
      console.log(`[DRY RUN] Would create file: ${path}`);
    } else {
      await Deno.writeTextFile(path, content, { create: true });
      console.log(`Created file: ${path}`);
    }
  } catch (error) {
    if (error instanceof Deno.errors.AlreadyExists && !force) {
      console.warn(`File already exists: ${path}`);
    } else {
      console.error(`Error creating file: ${path}`, error);
    }
  }
}

async function remove_path(path, dry_run, force) {
  try {
    const path_stat = await Deno.stat(path);
    if (dry_run) {
      console.log(
        `[DRY RUN] Would remove: ${path} (type: ${
          path_stat.isFile ? "file" : "directory"
        })`,
      );
    } else {
      await Deno.remove(path, { recursive: true });
      console.log(
        `Removed: ${path} (type: ${path_stat.isFile ? "file" : "directory"})`,
      );
    }
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      console.warn(`Path not found, cannot remove: ${path}`);
    } else {
      console.error(`Error removing path: ${path}`, error);
    }
  }
}

async function show_menu_and_get_choice() {
  console.log("\nВыберите действие:");
  console.log("1. Генерация структуры проекта");
  console.log("2. Удаление структуры проекта");
  console.log("3. Вывести информацию о проекте");
  console.log("4. Вывести версию модуля");
  console.log("0. Выход");

  let choice = null;
  while (choice === null) {
    const answer = prompt("Ваш выбор (0-4):");
    if (answer === null) { // Пользователь нажал Ctrl+C или отменил ввод
      choice = "0"; // Считаем как выход
    } else {
      const num = parseInt(answer);
      if (!isNaN(num) && num >= 0 && num <= 4) {
        choice = String(num);
      } else {
        console.log("Неверный ввод. Пожалуйста, выберите число от 0 до 4.");
      }
    }
  }
  return choice;
}

async function main() {
  await ensure_config_file(); // Убеждаемся, что setup.toml существует при запуске

  let continue_running = true;
  while (continue_running) {
    const choice = await show_menu_and_get_choice();

    switch (choice) {
      case "1":
        await setup_project({ force: false, dry_run: false });
        break;
      case "2":
        await remove_project_structure({ dry_run: false, force: false });
        break;
      case "3":
        await display_project_info();
        break;
      case "4":
        await display_module_version();
        break;
      case "0":
        console.log("Выход из программы.");
        continue_running = false;
        break;
      default:
        console.log("Неизвестный выбор."); // Хотя это не должно произойти из-за валидации ввода
    }
    if (continue_running && choice !== "0") {
      const continue_answer = prompt("Выполнить другое действие? (y/N)");
      if (continue_answer && continue_answer.toLowerCase() !== "y") {
        continue_running = false;
      }
    }
  }
}

if (import.meta.main) {
  await main();
}
