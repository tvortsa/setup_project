import { walk } from "jsr:/@std/fs@^1.0.13/walk";
import { dirname, basename, extname, join } from "jsr:@std/path@1.0.8";
import { green, yellow, red } from 'jsr:@std/fmt/colors';
import { parse } from 'jsr:@std/toml';
import { exists } from 'jsr:@std/fs';

/**
 * Загружает настройки исключений из файла combined_code_ignore.toml
 * 
 * @param {string} ignore_file - Путь к файлу исключений
 * @returns {Promise<Object>} - Объект с настройками исключений
 */
async function load_ignore_settings(ignore_file = "combined_code_ignore.toml") {
  const default_settings = {
    directories: { exclude: ["node_modules", ".git", ".vscode", "dist", "build"] },
    files: { exclude: [".env", ".DS_Store"] },
    patterns: { exclude: ["combined_code*.txt", "*.log", "*.tmp"] },
    extensions: { exclude: [".exe", ".dll", ".jpg", ".png", ".gif", ".mp3", ".mp4", ".zip", ".rar", ".7z", ".pdf", ".lock"] }
  };

  try {
    if (await exists(ignore_file)) {
      const config_text = await Deno.readTextFile(ignore_file);
      const settings = parse(config_text);
      console.log(green(`Загружены настройки исключений из ${ignore_file}`));
      return {
        exclude_dirs: settings.directories?.exclude || default_settings.directories.exclude,
        exclude_files: settings.files?.exclude || default_settings.files.exclude,
        exclude_patterns: settings.patterns?.exclude || default_settings.patterns.exclude,
        exclude_extensions: settings.extensions?.exclude || default_settings.extensions.exclude
      };
    } else {
      console.log(yellow(`Файл ${ignore_file} не найден, используются настройки по умолчанию`));
      return {
        exclude_dirs: default_settings.directories.exclude,
        exclude_files: default_settings.files.exclude,
        exclude_patterns: default_settings.patterns.exclude,
        exclude_extensions: default_settings.extensions.exclude
      };
    }
  } catch (error) {
    console.error(red(`Ошибка при загрузке настроек исключений: ${error.message}`));
    return {
      exclude_dirs: default_settings.directories.exclude,
      exclude_files: default_settings.files.exclude,
      exclude_patterns: default_settings.patterns.exclude,
      exclude_extensions: default_settings.extensions.exclude
    };
  }
}

/**
 * Проверяет, соответствует ли файл шаблону с подстановочными знаками
 * 
 * @param {string} file_name - Имя файла для проверки
 * @param {string} pattern - Шаблон с подстановочными знаками (поддерживает только *)
 * @returns {boolean} - true, если файл соответствует шаблону
 */
function match_pattern(file_name, pattern) {
  // Преобразуем шаблон в регулярное выражение
  const regex_pattern = pattern
    .replace(/\./g, '\\.') // Экранируем точки
    .replace(/\*/g, '.*');  // Заменяем * на .* (любые символы)
  
  const regex = new RegExp(`^${regex_pattern}$`, 'i');
  return regex.test(file_name);
}

/**
 * Проверяет, должен ли файл быть исключен на основе настроек
 * 
 * @param {string} file_path - Путь к файлу
 * @param {Object} settings - Настройки исключений
 * @returns {boolean} - true, если файл должен быть исключен
 */
function should_exclude_file(file_path, settings) {
  const { exclude_dirs, exclude_files, exclude_patterns, exclude_extensions } = settings;
  const normalized_path = file_path.replace(/\\/g, '/');
  const file_name = basename(normalized_path);
  
  // Проверяем, находится ли файл в исключенной директории
  for (const dir of exclude_dirs) {
    // Проверяем разные варианты вхождения директории в путь
    if (
      normalized_path.includes(`/${dir}/`) || // внутри пути
      normalized_path.startsWith(`${dir}/`) || // в начале пути
      normalized_path === dir || // сам путь равен директории
      normalized_path.startsWith(`./${dir}/`) // относительный путь
    ) {
      console.log(yellow(`Исключен файл ${file_path} (находится в директории ${dir})`));
      return true;
    }
  }
  
  // Проверяем, соответствует ли имя файла списку исключений
  if (exclude_files.includes(file_name)) {
    console.log(yellow(`Исключен файл ${file_path} (в списке исключенных файлов)`));
    return true;
  }
  
  // Проверяем, соответствует ли файл шаблонам
  for (const pattern of exclude_patterns) {
    if (match_pattern(file_name, pattern)) {
      console.log(yellow(`Исключен файл ${file_path} (соответствует шаблону ${pattern})`));
      return true;
    }
  }
  
  // Проверяем расширение файла
  for (const ext of exclude_extensions) {
    if (normalized_path.toLowerCase().endsWith(ext.toLowerCase())) {
      console.log(yellow(`Исключен файл ${file_path} (имеет исключенное расширение ${ext})`));
      return true;
    }
  }
  
  return false;
}

/**
 * Генерирует уникальное имя файла с инкрементальной версией
 * 
 * @param {string} file_path - Исходный путь к файлу
 * @returns {Promise<string>} - Уникальный путь к файлу
 */
async function generate_unique_filename(file_path) {
  // Разбиваем путь на компоненты
  const dir = dirname(file_path);
  const file_name = basename(file_path, extname(file_path));
  const ext = extname(file_path);
  
  // Проверяем, существует ли файл
  if (!await exists(file_path)) {
    return file_path;
  }
  
  // Ищем номер версии в имени файла
  const version_match = file_name.match(/-(\d+)$/);
  let base_name = file_name;
  let version = 1;
  
  if (version_match) {
    // Если номер версии уже есть, увеличиваем его
    base_name = file_name.substring(0, version_match.index);
    version = parseInt(version_match[1], 10) + 1;
  }
  
  // Генерируем новое имя файла
  let new_file_path;
  do {
    const version_str = version.toString().padStart(2, '0');
    new_file_path = join(dir, `${base_name}-${version_str}${ext}`);
    version++;
  } while (await exists(new_file_path));
  
  return new_file_path;
}

/**
 * Рекурсивно читает все файлы в указанной директории и её поддиректориях,
 * объединяя их содержимое в один файл с маркерами начала каждого файла.
 * 
 * @param {string} output_file - Имя выходного файла
 * @param {string} dir - Директория для сканирования (по умолчанию текущая)
 * @param {string} ignore_file - Путь к файлу с настройками исключений
 * @returns {Promise<void>}
 */
export async function combine_files(
  output_file = "combined_code.txt", 
  dir = ".",
  ignore_file = "combined_code_ignore.toml"
) {
  let file_count = 0;
  let error_count = 0;
  let skipped_count = 0;
  
  console.log(green(`Начинаю сканирование директории: ${dir}`));
  
  try {
    // Загружаем настройки исключений
    const settings = await load_ignore_settings(ignore_file);
    
    // Создаем уникальное имя файла, если файл уже существует
    const unique_output_file = await generate_unique_filename(output_file);
    if (unique_output_file !== output_file) {
      console.log(yellow(`Файл ${output_file} уже существует, будет создан файл ${unique_output_file}`));
      output_file = unique_output_file;
    }
    
    // Создаем директорию для выходного файла, если она не существует
    await Deno.mkdir(dirname(output_file), { recursive: true }).catch(() => {});
    
    // Открываем файл для записи
    const file = await Deno.open(output_file, { write: true, create: true, truncate: true });
    
    // Включаем подробный вывод для отладки
    const verbose = true;
    
    // Рекурсивно обходим все файлы и директории
    for await (const entry of walk(dir, { includeDirs: false, includeFiles: true, followSymlinks: false })) {
      // Проверяем, должен ли файл быть исключен
      if (should_exclude_file(entry.path, settings)) {
        skipped_count++;
        continue;
      }
      
      try {
        // Читаем содержимое файла
        const content = await Deno.readTextFile(entry.path);
        
        // Создаем маркер начала файла
        const marker = `\n\n${"=".repeat(80)}\n// FILE: ${entry.path}\n${"=".repeat(80)}\n\n`;
        
        // Записываем маркер и содержимое файла
        await file.write(new TextEncoder().encode(marker + content));
        
        file_count++;
        
        // Выводим прогресс каждые 10 файлов
        if (file_count % 10 === 0) {
          console.log(green(`Обработано файлов: ${file_count}`));
        }
      } catch (error) {
        console.error(yellow(`Ошибка при чтении файла ${entry.path}: ${error.message}`));
        error_count++;
      }
    }
    
    // Закрываем файл
    file.close();
    
    console.log(green(`\nГотово! Обработано файлов: ${file_count}`));
    console.log(green(`Пропущено файлов: ${skipped_count}`));
    if (error_count > 0) {
      console.log(yellow(`Количество ошибок: ${error_count}`));
    }
    console.log(green(`Результат сохранен в файл: ${output_file}`));
  } catch (error) {
    console.error(red(`Произошла ошибка: ${error.message}`));
    throw error;
  }
}

export default combine_files;
