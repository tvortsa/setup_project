import { green, red, yellow } from 'jsr:@std/fmt/colors';
import { dirname, join, fromFileUrl  } from 'jsr:@std/path';

export async function createFolder(path, force, dryRun) {
  try {
    if (dryRun) {
      console.log(`[DRY RUN] Would create folder: ${path}`);
    } else {
      await Deno.mkdir(path, { recursive: true });
      console.log(green(`Created folder: ${path}`));
    }
  } catch (error) {
    console.error(red(`Error creating folder: ${path}`), error);
  }
}

export async function createFile(path, content, force, dryRun) {
  if (dryRun) {
    console.log(`[DRY RUN] Would create file: ${path}`);
  } else {
    await Deno.writeTextFile(path, content);
    console.log(green(`Created file: ${path}`));
  }
}

export async function removePath(path, dryRun, force) {
  if (dryRun) {
    console.log(`[DRY RUN] Would remove: ${path}`);
  } else {
    await Deno.remove(path, { recursive: true });
    console.log(red(`Removed: ${path}`));
  }
}

// не используется
export async function show_menu_and_get_choice() {
  console.log(yellow('Выберите действие:'));
  console.log('1. Создать структуру проекта');
  console.log('2. Скопировать структуру текущей папки');
  console.log('3. Удалить структуру проекта');
  console.log('4. Показать информацию о проекте');
  console.log('5. Показать версию модуля');
  console.log('0. Выйти');

  const buf = new Uint8Array(1024);
  const n = await Deno.stdin.read(buf);
  return n ? new TextDecoder().decode(buf.subarray(0, n)).trim() : '';
}

export async function display_module_version() {
  try {
    const current_dir_url = dirname(import.meta.url);
    const current_dir = fromFileUrl(current_dir_url); // Convert to file path
    const jsr_file_path = join(current_dir, '..', 'jsr.json');
    const jsrFileContent = await Deno.readTextFile(jsr_file_path);
    const jsrData = JSON.parse(jsrFileContent);
    const version = jsrData.version;
    console.log(green(`[INFO] Версия модуля: ${version}`));
  } catch (error) {
    console.error(`[ERROR] Не удалось получить версию модуля: ${error.message}`);
  }
}
