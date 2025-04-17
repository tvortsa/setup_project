import { load_config } from './config.js';
import { bold, cyan } from 'jsr:@std/fmt/colors';

export async function display_project_info() {
  console.log(bold('- - - Информация о проекте - - - '));
  const config = await load_config();

  console.log('--- Папки ---');
  for (const [baseFolder, subFolders] of Object.entries(config.folders)) {
    console.log(cyan(`- ${baseFolder}`));
    for (const subFolder of subFolders) {
      console.log(`  -- ${subFolder}`);
    }
  }

  if (config.files) {
    console.log('--- Файлы ---');
    for (const filePath of Object.keys(config.files)) {
      console.log(`- ${filePath}`);
    }
  }
}
