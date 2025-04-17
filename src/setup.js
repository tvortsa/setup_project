import { load_config } from './config.js';
import { createFolder, createFile } from './utils.js';
import { bold, green } from 'jsr:@std/fmt/colors';

export async function setup_project(options) {
  console.log(bold('- - - Генерация структуры проекта - - - '));
  const config = await load_config();

  for (const [baseFolder, subFolders] of Object.entries(config.folders)) {
    await createFolder(baseFolder, options.force, options.dryRun);
    for (const subFolder of subFolders) {
      await createFolder(`${baseFolder}/${subFolder}`, options.force, options.dryRun);
    }
  }

  for (const [filePath, content] of Object.entries(config.files || {})) {
    await createFile(filePath, content, options.force, options.dryRun);
  }
  console.log(green('- - - Генерация завершена - - - '));
}
