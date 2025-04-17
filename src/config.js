import { parse } from 'jsr:@std/toml';
import { exists } from 'jsr:@std/fs';
import { green, yellow, red } from 'jsr:@std/fmt/colors';

export const config_file_name = 'setup.toml';
export const default_config_path = './templates/default.toml';

export async function ensure_config_file() {
  try {
    if (await exists(config_file_name)) {
      const configText = await Deno.readTextFile(config_file_name);
      if (!configText.startsWith('#tvr_setup')) {
        console.log(yellow('[WARNING] setup.toml не содержит маркер "#tvr_setup".'));
        await Deno.rename(config_file_name, '_setup.toml');
        console.log(yellow('[INFO] setup.toml переименован в _setup.toml.'));
        await create_default_config();
      }
      console.log(green('Файл конфигурации уже существует.'));
      return false;
    } else {
      await create_default_config();
      return true;
    }
  } catch (error) {
    console.error(red(`[ERROR] Ошибка при обработке setup.toml: ${error.message}`));
    throw error;
  }
}

async function create_default_config() {
  try {
    const defaultConfig = await Deno.readTextFile(default_config_path);
    await Deno.writeTextFile(config_file_name, defaultConfig);
    console.log(green('[INFO] Создан setup.toml с настройками по умолчанию.'));
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      console.error(red(`[ERROR] Файл настроек по умолчанию (${default_config_path}) не найден.`));
      console.log(yellow('[WARNING] Приложение продолжит работу без файла настроек по умолчанию.'));
      // You might want to create an empty setup.toml here or use a fallback
      await Deno.writeTextFile(config_file_name, "#tvr_setup\n# Empty default config");
      console.log(green('[INFO] Создан пустой setup.toml.'));
    } else {
      console.error(red(`[ERROR] Ошибка при создании файла настроек по умолчанию: ${error.message}`));
      throw error;
    }
  }
}

export async function load_config() {
  const configText = await Deno.readTextFile(config_file_name);
  return parse(configText);
}
