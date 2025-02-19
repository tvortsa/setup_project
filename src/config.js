import { parse } from 'jsr:@std/toml';
import { exists } from 'jsr:@std/fs';
import { green, yellow, red } from 'jsr:@std/fmt/colors';

export const configFileName = 'setup.toml';
export const defaultConfigPath = './templates/default.toml';

export async function ensureConfigFile() {
  try {
    if (await exists(configFileName)) {
      const configText = await Deno.readTextFile(configFileName);
      if (!configText.startsWith('#tvr_setup')) {
        console.log(yellow('[WARNING] setup.toml не содержит маркер "#tvr_setup".'));
        await Deno.rename(configFileName, '_setup.toml');
        console.log(yellow('[INFO] setup.toml переименован в _setup.toml.'));
        await createDefaultConfig();
      }
      console.log(green('Файл конфигурации уже существует.'));
      return false;
    } else {
      await createDefaultConfig();
      return true;
    }
  } catch (error) {
    console.error(red(`[ERROR] Ошибка при обработке setup.toml: ${error.message}`));
    throw error;
  }
}

async function createDefaultConfig() {
  const defaultConfig = await Deno.readTextFile(defaultConfigPath);
  await Deno.writeTextFile(configFileName, defaultConfig);
  console.log(green('[INFO] Создан setup.toml с настройками по умолчанию.'));
}

export async function loadConfig() {
  const configText = await Deno.readTextFile(configFileName);
  return parse(configText);
}
