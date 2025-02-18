import { parse } from "jsr:@std/toml@1.0.2";
import { ensureDir, exists, expandGlob } from "jsr:@std/fs@1.0.2";
import { bold, green, red, yellow } from "jsr:@std/fmt/colors";

const DEFAULT_TOML = `[project]
name = "MyProject"
version = "1.0.0"
template = "default"

[folders]
src = ["core", "engine", "webui/webui_bind"]
public = []
config = []
assets = []

[files]
"src/core/lifecycle.js" = "// Управление жизненным циклом\n"
"src/core/state.js" = "// Менеджер состояний\n"
"src/core/event_bus.js" = "// Реактивность и события\n"
"src/core/config_loader.js" = "// Загрузка конфигурации\n"
"src/core/storage.js" = "// Персистентное хранилище\n"
"src/engine/scene.js" = "// 3D-сцена Orillusion\n"
"src/engine/ui.js" = "// 2D-интерфейс PIXI.js\n"
"src/engine/input.js" = "// Управление вводом\n"
"src/engine/assets.js" = "// Загрузка ресурсов\n"
"src/webui/webui.js" = "// Управление Deno-webui\n"
"src/webui/webui_bind/scene_bind.js" = "// Привязка сцены\n"
"src/webui/webui_bind/ui_bind.js" = "// Привязка UI\n"
"src/webui/webui_bind/storage_bind.js" = "// Привязка хранилища\n"
"src/webui/webui_bind/settings_bind.js" = "// Привязка настроек\n"
"public/index.html" = "<!DOCTYPE html>\n<html>\n<head>\n<title>Scene Editor</title>\n</head>\n<body>\n<script type='module' src='app.js'></script>\n</body>\n</html>\n"
"public/app.js" = "console.log('App loaded');\n"
"config/settings.toml" = "# Настройки редактора\n"
# "deno.jsonc" = "{ \"tasks\": { \"run\": \"deno run --allow-read --allow-write setup.js\" } }\n"
"README.md" = "# Scene Editor\n\nПроект редактора сцен.\n"`;

async function loadConfig() {
  const configPath = "setup.toml";
  if (!(await exists(configPath))) {
    console.log(yellow("[WARNING] setup.toml not found, creating default."));
    await Deno.writeTextFile(configPath, DEFAULT_TOML);
  }
  const tomlContent = await Deno.readTextFile(configPath);
  return parse(tomlContent);
}

async function setupProject() {
  const config = await loadConfig();
  console.log(green("[INFO] Setting up project:"), bold(config.project.name));

  for (const file of config.files.create || []) {
    await ensureDir(file.substring(0, file.lastIndexOf("/")));
    await Deno.writeTextFile(file, "");
    console.log(green("[CREATED]"), file);
  }

  for (const file of config.files.delete || []) {
    if (await exists(file)) {
      await Deno.remove(file, { recursive: true });
      console.log(red("[DELETED]"), file);
    }
  }
}

async function main() {
  console.log(bold("Welcome to tvr_setup!"));
  console.log("1: Setup Project\n2: Show Info\n3: Exit");
  const choice = prompt("Choose an option:");

  switch (choice) {
    case "1":
      await setupProject();
      break;
    case "2":
      console.log(yellow("tvr_setup - Project Setup Tool v0.0.2"));
      break;
    default:
      console.log("Exiting...");
  }
}

if (import.meta.main) {
  main();
}
