import { loadConfig } from './config.js';
import { removePath } from './utils.js';
import { bold, red } from 'jsr:@std/fmt/colors';

export async function removeProjectStructure(options) {
  console.log(bold('- - - Удаление структуры проекта - - - '));
  try {
    const config = await loadConfig();

    for (const [baseFolder, subFolders] of Object.entries(config.folders)) {
      for (const subFolder of subFolders) {
        await removePath(`${baseFolder}/${subFolder}`, options.dryRun, options.force);
      }
      await removePath(baseFolder, options.dryRun, options.force);
    }

    for (const filePath of Object.keys(config.files || {})) {
      await removePath(filePath, options.dryRun, options.force);
    }
    console.log(red('- - - Удаление завершено - - - '));
  } catch (error) {
    console.error('Ошибка при удалении структуры:', error);
  }
}
