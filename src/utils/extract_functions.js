// Файл: utils/extract_functions.js
// Извлекает только именованные функции верхнего уровня:
// function foo(...) {...} export function bar(...) {...}
//  Не извлекает:
// стрелочные функции const fn = () => {} — можно добавить, если нужно.
// вложенные функции внутри других функций.


import { parse } from "npm:acorn";
import { simple as walk_simple } from "npm:acorn-walk";

/**
 * Извлекает все функции из JS-кода (export и обычные)
 * @param {string} code - исходный код JS-файла
 * @returns {Array<{name: string, code: string}>} - массив объектов с именем и кодом функции
 */
export function extract_functions(code) {
  const ast = parse(code, { ecmaVersion: "latest", sourceType: "module" });
  const functions = [];

  walk_simple(ast, {
    FunctionDeclaration(node) {
      if (!node.id) return;
      const name = node.id.name;
      const fn_code = code.slice(node.start, node.end);
      functions.push({ name, code: fn_code });
    },
    ExportNamedDeclaration(node) {
      if (node.declaration && node.declaration.type === "FunctionDeclaration") {
        const name = node.declaration.id.name;
        const fn_code = code.slice(node.start, node.end);
        functions.push({ name, code: fn_code });
      }
    }
  });

  return functions;
}
