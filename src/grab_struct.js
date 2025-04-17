import { walk } from "@std/fs/walk";

async function grab_structure(outputFile = "grab_struct.toml", dir = ".") {
  const structure = { folders: {}, files: {} };

  for await (const entry of walk(dir, { includeDirs: true, includeFiles: true, followSymlinks: false })) {
    const parts = entry.path.split("/");
    if (parts.some(part => part.startsWith("."))) continue; // Игнорируем скрытые папки и файлы

    const parentDir = parts.slice(0, -1).join("/") || "root";

    if (entry.isDirectory) {
      if (!structure.folders[parentDir]) structure.folders[parentDir] = [];
      structure.folders[parentDir].push(entry.name);
    } else {
      structure.files[entry.path] = `""`;
    }
  }

  let tomlContent = "# Grabbed project structure\n\n[folders]\n";
  for (const [folder, subfolders] of Object.entries(structure.folders)) {
    tomlContent += `"${folder}" = [${subfolders.map(f => `"${f}"`).join(", ")}]\n`;
  }

  tomlContent += "\n[files]\n";
  for (const file of Object.keys(structure.files)) {
    tomlContent += `"${file}" = ""\n`;
  }

  await Deno.writeTextFile(outputFile, tomlContent);
  console.log(`Проектная структура сохранена в ${outputFile}`);
}

export default grab_structure;
