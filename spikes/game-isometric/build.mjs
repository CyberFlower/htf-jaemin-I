#!/usr/bin/env node
// src/index.html의 CSS와 JS를 포함한 단일 index.html을 만듭니다. 외부 의존성이 없습니다.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const source = path.join(here, 'src');
const output = path.join(here, 'index.html');
const read = (file) => fs.readFileSync(path.join(source, file), 'utf8').replace(/\r\n?/g, '\n');

const html = read('index.html')
  .replace('<!doctype html>', '<!doctype html>\n<!-- 생성된 파일입니다. src/를 수정한 뒤 node spikes/game-isometric/build.mjs를 실행하세요. -->')
  .replace(/<link rel="stylesheet" href="([^"]+)">/g, (_, file) =>
    `<style>\n/* src/${file} */\n${read(file)}\n</style>`)
  .replace(/<script src="([^"]+)"><\/script>/g, (_, file) =>
    `<script>\n// src/${file}\n${read(file).replace(/<\/script/gi, '<\\/script')}\n</script>`);

if (process.argv.includes('--check')) {
  if (!fs.existsSync(output) || fs.readFileSync(output, 'utf8') !== html) {
    console.error('index.html이 원본과 다릅니다. node spikes/game-isometric/build.mjs를 실행하세요.');
    process.exitCode = 1;
  } else {
    console.log('game-isometric/index.html이 src/와 일치합니다.');
  }
} else {
  fs.writeFileSync(output, html);
  console.log('game-isometric/index.html 생성 완료 (CSS·JS 포함 단일 파일)');
}
