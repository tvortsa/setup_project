 
import { green, red, yellow } from 'jsr:@std/fmt/colors';
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

export async function showMenuAndGetChoice() {
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

export function displayModuleVersion() {
  console.log('Версия модуля: 0.1.7');
}