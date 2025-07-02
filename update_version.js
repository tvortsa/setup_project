// update_version.js
const files = [
  {
    path: "deno.jsonc",
    regex: /(["']?version["']?\s*:\s*")([0-9]+\.[0-9]+\.[0-9]+)("[^\n]*,?)/,
  },
  {
    path: "jsr.json",
    regex: /(["']?version["']?\s*:\s*")([0-9]+\.[0-9]+\.[0-9]+)("[^\n]*,?)/,
  },
  {
    path: "src/utils.js",
    regex: /(export\s+const\s+MODULE_VERSION\s*=\s*")([0-9]+\.[0-9]+\.[0-9]+)(";)/,
  },
];

const isDown = Deno.args.includes("--down");

function changeVersion(ver) {
  const parts = ver.split('.').map(Number);
  if (isDown) {
    parts[2] = Math.max(0, parts[2] - 1);
  } else {
    parts[2] += 1;
  }
  return parts.join('.');
}

let newVersion = null;

for (const { path, regex } of files) {
  let text;
  try {
    text = await Deno.readTextFile(path);
  } catch {
    console.error(`Файл не найден: ${path}`);
    continue;
  }
  const match = text.match(regex);
  if (!match) {
    console.error(`Версия не найдена в ${path}`);
    continue;
  }
  if (!newVersion) newVersion = changeVersion(match[2]);
  text = text.replace(regex, `$1${newVersion}$3`);
  await Deno.writeTextFile(path, text);
  console.log(`Обновлено ${path} → версия ${newVersion}`);
}