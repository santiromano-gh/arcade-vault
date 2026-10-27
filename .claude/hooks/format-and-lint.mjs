// Hook PostToolUse de Claude Code: elimina las líneas en blanco del código,
// corrige con ESLint y formatea con Prettier cada archivo creado o editado
// dentro de Arcade Vault.
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { extname, isAbsolute, relative, resolve, sep } from "node:path";
import ts from "typescript";

const EXT_PRETTIER = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".json", ".css", ".md"]);
const EXT_ESLINT = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs"]);
// Markdown queda fuera: las líneas en blanco separan párrafos y bloques.
const EXT_SIN_LINEAS_EN_BLANCO = new Set([...EXT_ESLINT, ".css"]);
const DIRS_IGNORADOS = ["node_modules", ".next", ".claude"];

const proyecto = resolve(process.env.CLAUDE_PROJECT_DIR ?? process.cwd());

function leerStdin() {
  return new Promise((resolver) => {
    let datos = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (trozo) => (datos += trozo));
    process.stdin.on("end", () => resolver(datos));
  });
}

// Se ejecuta el binario de node_modules con el propio node, sin shell,
// para que las rutas con espacios funcionen igual en Windows y Unix.
const BINARIOS = {
  prettier: "node_modules/prettier/bin/prettier.cjs",
  eslint: "node_modules/eslint/bin/eslint.js",
};

function ejecutar(herramienta, args) {
  return spawnSync(process.execPath, [resolve(proyecto, BINARIOS[herramienta]), ...args], {
    cwd: proyecto,
    encoding: "utf8",
  });
}

// Rangos [inicio, fin) de los template literals: sus saltos de línea forman
// parte del valor del string y no deben tocarse.
function rangosDeTemplates(codigo, ext) {
  const tipo = ext === ".tsx" || ext === ".jsx" ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const fuente = ts.createSourceFile("archivo" + ext, codigo, ts.ScriptTarget.Latest, false, tipo);
  const rangos = [];
  const visitar = (nodo) => {
    if (ts.isTemplateLiteralToken(nodo)) rangos.push([nodo.getStart(fuente), nodo.end]);
    ts.forEachChild(nodo, visitar);
  };
  visitar(fuente);
  return rangos;
}

function eliminarLineasEnBlanco(archivo, ext) {
  const codigo = readFileSync(archivo, "utf8");
  const rangos = EXT_ESLINT.has(ext) ? rangosDeTemplates(codigo, ext) : [];
  const dentroDeTemplate = (pos) => rangos.some(([inicio, fin]) => pos > inicio && pos < fin);
  let posicion = 0;
  const lineas = codigo.split("\n").filter((linea) => {
    const inicio = posicion;
    posicion += linea.length + 1;
    return linea.trim() !== "" || dentroDeTemplate(inicio);
  });
  const resultado = lineas.join("\n") + "\n";
  if (resultado !== codigo) writeFileSync(archivo, resultado);
}

const entrada = JSON.parse((await leerStdin()).replace(/^﻿/, "") || "{}");
const ruta = entrada.tool_input?.file_path;
if (!ruta) process.exit(0);

const archivo = resolve(ruta);
const relativa = relative(proyecto, archivo);
const fueraDelProyecto = relativa.startsWith("..") || isAbsolute(relativa);
const enDirIgnorado = relativa.split(sep).some((parte) => DIRS_IGNORADOS.includes(parte));
if (fueraDelProyecto || enDirIgnorado || !existsSync(archivo)) process.exit(0);

const ext = extname(archivo).toLowerCase();

if (EXT_SIN_LINEAS_EN_BLANCO.has(ext)) eliminarLineasEnBlanco(archivo, ext);

// ESLint primero y Prettier al final, para que el formato guardado sea el de Prettier.
if (EXT_ESLINT.has(ext)) {
  const eslint = ejecutar("eslint", ["--fix", archivo]);
  if (eslint.status !== 0) {
    console.error(`ESLint encontró errores en ${relativa}:\n${eslint.stdout}${eslint.stderr}`);
    process.exit(2);
  }
}

if (EXT_PRETTIER.has(ext)) {
  const prettier = ejecutar("prettier", ["--write", archivo]);
  if (prettier.status !== 0) {
    console.error(`Prettier falló en ${relativa}:\n${prettier.stderr || prettier.stdout}`);
    process.exit(2);
  }
}
