import { parse } from "https://deno.land/std@0.224.0/toml/mod.ts";

/**
 * Читает конфиг setup.toml и создает файловую структуру.
 * @param {string} configPath - Путь к setup.toml
 */
export async function createStructureFromConfig(configPath: string) {
    try {
        const configText = await Deno.readTextFile(configPath);
        const config = parse(configText);

        if (config.folders) {
            for (const baseFolder in config.folders) {
                for (const subFolder of config.folders[baseFolder]) {
                    const path = `${baseFolder}/${subFolder}`;
                    await Deno.mkdir(path, { recursive: true });
                    console.log(`?? Создана папка: ${path}`);
                }
            }
        }

        if (config.files) {
            for (const [filePath, content] of Object.entries(config.files)) {
                await Deno.writeTextFile(filePath, String(content));
                console.log(`?? Создан файл: ${filePath}`);
            }
        }

        console.log("\n? Файловая структура успешно создана!");
    } catch (err) {
        console.error("? Ошибка при создании структуры:", err);
    }
}
