import { readFileSync, writeFileSync } from 'node:fs';
const root = new URL('../', import.meta.url);
let html = readFileSync(new URL('src/index.html', root), 'utf8');
for (const name of ['style.css', 'vehicle.css', 'touch.css']) {
  html = html.replace(`<link rel="stylesheet" href="${name}">`, () => '<style>' + readFileSync(new URL('src/' + name, root), 'utf8') + '</style>');
}
for (const name of ['core.js', 'app.js', 'display.js']) {
  html = html.replace(`<script src="${name}"></script>`, () => '<script>' + readFileSync(new URL('src/' + name, root), 'utf8') + '</script>');
}
writeFileSync(new URL('journey-demo.html', root), html);
console.log('Built journey-demo.html');
