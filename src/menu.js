// src/menu.js
import { Select } from "jsr:@cliffy/prompt@1.0.0-rc.7";

// ANSI-коды для управления стилем
// const BLINK_ON = "\x1b[5m"; // Мигание (если терминал поддерживает)
// const BLINK_OFF = "\x1b[25m";
// const RESET = "\x1b[0m";

export async function runMenu() {
  const choice = await Select.prompt({
    message: "Выберите действие:",
    options: [
      { name: "Создать структуру на основе setup.toml", value: "1" },
      { name: "Сграбить структуру папки запуска в grab_struct.toml", value: "2" },
      { name: "Удалить все элементы файловой системы по списку в setup.toml", value: "3" },
      { name: "Инфо о модуле", value: "4" },
      { name: "Инфо о версии", value: "5" },
      { name: "Выход", value: "0" }, // Выход всегда 0
    ],
    // Убираем pointer, так как он не работает как ожидалось
    // Вместо этого используем стандартный указатель cliffy
    // pointer: "\x1b[7m>\x1b[0m ", // Инверсия цветов для курсора
    pointer: "\x1b[1m>\x1b[0m " // для жирного текста
  });
//   return parseInt(choice, 10); // Возвращаем число от 0 до 5
  return choice; // Возвращаем число от 0 до 5
}