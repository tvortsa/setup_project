import { parse } from "https://deno.land/std@0.224.0/toml/mod.ts";

/**
 * ��⠥� ���䨣 setup.toml � ᮧ���� 䠩����� ��������.
 * @param {string} configPath - ���� � setup.toml
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
                    console.log(`?? ������� �����: ${path}`);
                }
            }
        }

        if (config.files) {
            for (const [filePath, content] of Object.entries(config.files)) {
                await Deno.writeTextFile(filePath, String(content));
                console.log(`?? ������ 䠩�: ${filePath}`);
            }
        }

        console.log("\n? �������� ������� �ᯥ譮 ᮧ����!");
    } catch (err) {
        console.error("? �訡�� �� ᮧ����� ��������:", err);
    }
}
