import { walk } from "jsr:@std/fs/walk";
import { dirname } from "jsr:@std/path";
import { green, yellow, red } from 'jsr:@std/fmt/colors';
import { parse } from 'jsr:@std/toml';
import { exists } from 'jsr:@std/fs';

/**
 * Загружает настройки исключений из файла combined_code_ignore.toml
 * 
 * @param {string} ignoreFile - Путь к файлу исключений
 * @returns {Promise<Object>} - Объект с настройками исключений
 */
async function loadIgnoreSettings(ignoreFile = "combined_code_ignore.toml") {
  const defaultSettings = {
    directories: { exclude: ["node_modules", ".git", ".vscode", "dist", "build"] },
    files: { exclude: [".env", ".DS_Store", "combined_code.txt"] },
    extensions: { exclude: [".exe", ".dll", ".jpg", ".png", ".gif", ".mp3", ".mp4", ".zip", ".rar", ".7z", ".pdf", ".lock"] }
  };

  try {
    if (await exists(ignoreFile)) {
      const configText = await Deno.readTextFile(ignoreFile);
      const settings = parse(configText);
      console.log(green(`Загружены настройки исключений из ${ignoreFile}`));
      return {
        excludeDirs: settings.directories?.exclude || defaultSettings.directories.exclude,
        excludeFiles: settings.files?.exclude || defaultSettings.files.exclude,
        excludeExtensions: settings.extensions?.exclude || defaultSettings.extensions.exclude
      };
    } else {
      console.log(yellow(`Файл ${ignoreFile} не найден, используются настройки по умолчанию`));
      return {
        excludeDirs: defaultSettings.directories.exclude,
        excludeFiles: defaultSettings.files.exclude,
        excludeExtensions: defaultSettings.extensions.exclude
      };
    }
  } catch (error) {
    console.error(red(`Ошибка при загрузке настроек исключений: ${error.message}`));
    return {
      excludeDirs: defaultSettings.directories.exclude,
      excludeFiles: defaultSettings.files.exclude,
      excludeExtensions: defaultSettings.extensions.exclude
    };
  }
}

/**
 * Рекурсивно читает все файлы в указанной директории и её поддиректориях,
 * объединяя их содержимое в один файл с маркерами начала каждого файла.
 * 
 * @param {string} outputFile - Имя выходного файла
 * @param {string} dir - Директория для сканирования (по умолчанию текущая)
 * @param {string} ignoreFile - Путь к файлу с настройками исключений
 * @returns {Promise<void>}
 */
export async function combineFiles(
  outputFile = "combined_code.txt", 
  dir = ".",
  ignoreFile = "combined_code_ignore.toml"
) {
  let fileCount = 0;
  let errorCount = 0;
  let skippedCount = 0;
  
  console.log(green(`Начинаю сканирование директории: ${dir}`));
  
  try {
    // Загружаем настройки исключений
    const { excludeDirs, excludeFiles, excludeExtensions } = await loadIgnoreSettings(ignoreFile);
    
    // Создаем директорию для выходного файла, если она не существует
    await Deno.mkdir(dirname(outputFile), { recursive: true }).catch(() => {});
    
    // Открываем файл для записи
    const file = await Deno.open(outputFile, { write: true, create: true, truncate: true });
    
    // Рекурсивно обходим все файлы и директории
    for await (const entry of walk(dir, { includeDirs: false, includeFiles: true, followSymlinks: false })) {
      // Получаем имя файла без пути
      const fileName = entry.path.split(/[\/\\]/).pop();
      
      // Пропускаем файлы из списка исключений
      if (excludeFiles.includes(fileName)) {
        skippedCount++;
        continue;
      }
      
      // Пропускаем файлы с исключенными расширениями
      if (excludeExtensions.some(ext => entry.path.toLowerCase().endsWith(ext.toLowerCase()))) {
        skippedCount++;
        continue;
      }
      
      // Пропускаем файлы в исключенных директориях
      if (excludeDirs.some(dir => 
        entry.path.includes(`/${dir}/`) || 
        entry.path.includes(`\\${dir}\\`) || 
        entry.path.startsWith(`./${dir}/`) || 
        entry.path.startsWith(`.\\${dir}\\`)
      )) {
        skippedCount++;
        continue;
      }
      
      try {
        // Читаем содержимое файла
        const content = await Deno.readTextFile(entry.path);
        
        // Создаем маркер начала файла
        const marker = `\n\n${"=".repeat(80)}\n// FILE: ${entry.path}\n${"=".repeat(80)}\n\n`;
        
        // Записываем маркер и содержимое файла
        await file.write(new TextEncoder().encode(marker + content));
        
        fileCount++;
        
        // Выводим прогресс каждые 10 файлов
        if (fileCount % 10 === 0) {
          console.log(green(`Обработано файлов: ${fileCount}`));
        }
      } catch (error) {
        console.error(yellow(`Ошибка при чтении файла ${entry.path}: ${error.message}`));
        errorCount++;
      }
    }
    
    // Закрываем файл
    file.close();
    
    console.log(green(`\nГотово! Обработано файлов: ${fileCount}`));
    console.log(green(`Пропущено файлов: ${skippedCount}`));
    if (errorCount > 0) {
      console.log(yellow(`Количество ошибок: ${errorCount}`));
    }
    console.log(green(`Результат сохранен в файл: ${outputFile}`));
  } catch (error) {
    console.error(red(`Произошла ошибка: ${error.message}`));
    throw error;
  }
}

export default combineFiles;
