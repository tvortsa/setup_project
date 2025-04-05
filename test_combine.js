import { combine_files } from "./src/combine_files.js";

// Запускаем функцию с явным указанием файла игнора
await combine_files("combined_code_test.txt", ".", "combined_code_ignore.toml");
