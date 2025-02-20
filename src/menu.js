// src/menu.js
import { Select } from "jsr:@cliffy/prompt@1.0.0-rc.7";

export async function runMenu() {
  const choice = await Select.prompt({
    message: "Выберите действие:",
    options: [
      { name: "Создать структуру на основе setup.toml", value: "1" },
      { name: "Сграбить структуру папки запуска в grab_struct.toml", value: "2" },
      { name: "Удалить все элементы файловой системы по списку в setup.toml", value: "3" },
      { name: "Инфо о модуле", value: "4" },
      { name: "Инфо о версии", value: "5" },
      { name: "Выход", value: "0" },
    ],
  });
//   return parseInt(choice, 10);
return choice;
}

// Пример вызова в главном файле:
// import { runMenu } from "./src/menu.js";
// const choice = await runMenu();