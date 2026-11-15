#!/usr/bin/env node
// 장면 표(projects/<p>/SCENARIO.md 2절)를 읽어 목업 틀 데이터(data/<p>.js)를 만들고,
// 제출 패키지에 남은 빈칸(TODO)을 보여 줍니다. 외부 의존성이 없습니다.
//
//   node spikes/mockup-frame/build.mjs           데이터 생성 + 빈칸 보고
//   node spikes/mockup-frame/build.mjs --check   쓰지 않고 검사만 (어긋나면 종료 코드 1)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..', '..');
const check = process.argv.includes('--check');
const COLUMNS = ['ID', '장면', '차량 상태', '화면', '틀', '한 줄 설명', '요구사항', '심사'];
const OPTIONAL = ['SDK']; // 있으면 읽습니다. 틀에서 S 키로 켜는 SDK 줄에 씁니다
const IMAGE = /\.(png|jpe?g|webp|gif|svg)$/i;
const problems = [];

const posix = (p) => p.split(path.sep).join('/');
const plain = (s) => s
  .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
  .replace(/[`*]/g, '')
  .replace(/<br\s*\/?>/gi, ' ')
  .trim();
const isBlank = (s) => s === '' || s === '—' || s === '-' || /TODO/.test(s);
const filled = (s) => (isBlank(plain(s)) ? '' : plain(s));
const cells = (line) => line.trim().replace(/^\||\|$/g, '').split(/(?<!\\)\|/).map((c) => c.trim());

function sceneTable(lines, file) {
  const start = lines.findIndex((l) => /^##\s.*장면 표/.test(l));
  if (start < 0) { problems.push(`${file}: "장면 표" 절(## … 장면 표)이 없습니다`); return []; }
  const rows = [];
  for (let i = start + 1; i < lines.length && !/^##\s/.test(lines[i]); i++) {
    if (lines[i].trim().startsWith('|')) rows.push(cells(lines[i]));
    else if (rows.length) break;
  }
  if (rows.length < 2) { problems.push(`${file}: 장면 표가 비어 있습니다`); return []; }
  const head = rows[0];
  const missing = COLUMNS.filter((c) => !head.includes(c));
  if (missing.length) { problems.push(`${file}: 장면 표에 열이 없습니다: ${missing.join(', ')}`); return []; }
  const cols = COLUMNS.concat(OPTIONAL.filter((c) => head.includes(c)));
  return rows.slice(2).map((r) => Object.fromEntries(cols.map((c) => [c, r[head.indexOf(c)] ?? ''])));
}

function frameSource(cell, dir, file, id) {
  const link = cell.match(/\[[^\]]*\]\(([^)\s]+)\)/);
  if (!link) {
    if (!isBlank(cell)) problems.push(`${file}: ${id}의 "틀" 칸은 링크([이름](경로)) 또는 TODO여야 합니다`);
    return null;
  }
  const [, target, suffix] = link[1].match(/^([^?#]*)(.*)$/); // ?embed=1#SC-01 같은 뒷부분을 그대로 둡니다
  if (/^[a-z]+:/i.test(target)) { problems.push(`${file}: ${id}의 "틀" 칸에는 저장소 안의 파일만 넣습니다`); return null; }
  const abs = path.resolve(dir, decodeURI(target));
  if (!fs.existsSync(abs)) { problems.push(`${file}: ${id}의 "틀" 파일이 없습니다: ${link[1]}`); return null; }
  return { src: posix(path.relative(here, abs)) + suffix, kind: IMAGE.test(target) ? 'image' : 'html' };
}

function todoBySection(text) {
  const out = [];
  let name = '(머리말)';
  let n = 0;
  for (const line of text.split('\n')) {
    const h = line.match(/^##\s+(.*)/);
    if (h) { if (n) out.push([name, n]); name = plain(h[1]); n = 0; continue; }
    if (line.startsWith('>')) continue; // 안내문과 인용은 세지 않습니다
    n += (line.match(/TODO/g) || []).length;
  }
  if (n) out.push([name, n]);
  return out;
}

// SDK.md의 `코드` 안 API·상수 이름이 근거 문서(dev-environment.md, 프로젝트의 API-ADOPTION.md)에 있는지 봅니다.
// 경고만 하고 실패로 치지 않습니다. 사람이 확인합니다.
function sdkReport(dir) {
  const file = path.join(dir, 'SDK.md');
  if (!fs.existsSync(file)) return null;
  const text = fs.readFileSync(file, 'utf8');
  const sources = [path.join(root, 'docs/contest/dev-environment.md'), path.join(dir, 'API-ADOPTION.md')]
    .filter((f) => fs.existsSync(f)).map((f) => fs.readFileSync(f, 'utf8')).join('\n');
  const names = new Set();
  for (const m of text.matchAll(/`([^`\n]+)`/g)) {
    for (const tok of m[1].split(/[^A-Za-z0-9_.]+/)) {
      const t = tok.replace(/\.+$/, '');
      if (/^(get|set|register|unregister|check|request|add|remove|cancel|change|has|is|on)[A-Z][A-Za-z0-9]*$/.test(t) || /^[A-Z][A-Z0-9]*(_[A-Z0-9]+)+$/.test(t)) names.add(t);
    }
  }
  const unknown = [...names].filter((n) => !sources.includes(n)).sort();
  const todo = text.split('\n').filter((l) => !l.startsWith('>')).join('\n').match(/TODO/g)?.length || 0;
  return { names: names.size, unknown, todo };
}

const projects = fs.readdirSync(path.join(root, 'projects'), { withFileTypes: true })
  .filter((d) => d.isDirectory() && fs.existsSync(path.join(root, 'projects', d.name, 'SCENARIO.md')))
  .map((d) => d.name).sort();

let stale = false;
const report = [];

for (const p of projects) {
  const dir = path.join(root, 'projects', p);
  const file = `projects/${p}/SCENARIO.md`;
  const text = fs.readFileSync(path.join(dir, 'SCENARIO.md'), 'utf8');
  const lines = text.split('\n');
  const title = (lines.find((l) => /^#\s/.test(l)) || '').match(/^#\s+SCENARIO:\s*(.+?)\s*\(`?([A-Z]+)`?\)\s*$/);
  if (!title) problems.push(`${file}: 첫 줄은 "# SCENARIO: 앱 이름 (\`코드\`)" 형식이어야 합니다`);
  const meta = (key) => plain((lines.find((l) => l.startsWith(`- ${key}:`)) || '').replace(`- ${key}:`, ''));
  const spec = meta('화면 규격');
  const size = spec.match(/(\d{3,5})\s*[x×]\s*(\d{3,5})/);
  if (!size) problems.push(`${file}: "- 화면 규격: 1920×1080 (…)" 줄이 필요합니다`);
  const code = title ? title[2] : p.toUpperCase();

  const seen = new Set();
  const scenes = sceneTable(lines, file).map((r) => {
    const id = plain(r.ID);
    if (!/^SC-\d{2}$/.test(id)) problems.push(`${file}: 장면 ID는 SC-01 형식입니다: "${id}"`);
    if (seen.has(id)) problems.push(`${file}: 장면 ID가 겹칩니다: ${id}`);
    seen.add(id);
    if (!lines.some((l) => l.startsWith(`### ${id} `))) problems.push(`${file}: 3절에 "### ${id} …" 상세가 없습니다`);
    const frame = frameSource(r['틀'], dir, file, id);
    // 틀에는 장면 번호, 이름, 차량 상태만 보입니다. 나머지 열은 SCENARIO.md에서 읽습니다.
    return {
      id, title: plain(r['장면']), state: filled(r['차량 상태']), sdk: filled(r['SDK'] || ''),
      src: frame ? frame.src : null, kind: frame ? frame.kind : null,
    };
  });

  const data = {
    code, name: title ? title[1] : p,
    width: size ? Number(size[1]) : 1920, height: size ? Number(size[2]) : 1080,
    source: file, scenes,
  };
  const js = '// 생성된 파일입니다. 손으로 고치지 않습니다.\n'
    + `// 원본: ${file} 2절 장면 표 → node spikes/mockup-frame/build.mjs\n`
    + 'window.MOCKUP_DATA = window.MOCKUP_DATA || {};\n'
    + `window.MOCKUP_DATA[${JSON.stringify(p)}] = ${JSON.stringify(data, null, 2)};\n`;
  const out = path.join(here, 'data', `${p}.js`);
  const old = fs.existsSync(out) ? fs.readFileSync(out, 'utf8') : null;
  if (old !== js) {
    stale = true;
    if (!check) { fs.mkdirSync(path.dirname(out), { recursive: true }); fs.writeFileSync(out, js); }
  }

  const proposal = path.join(dir, 'PROPOSAL.md');
  report.push({
    p, code, scenes,
    scenarioTodo: todoBySection(text),
    proposalTodo: fs.existsSync(proposal) ? todoBySection(fs.readFileSync(proposal, 'utf8')) : null,
    sdk: sdkReport(dir),
  });
}

const index = fs.readFileSync(path.join(here, 'index.html'), 'utf8');
for (const p of projects) {
  if (!index.includes(`data/${p}.js`)) problems.push(`index.html에 <script src="data/${p}.js"></script>를 추가해야 합니다`);
}

const sum = (list) => list.reduce((a, [, n]) => a + n, 0);
console.log('제출 패키지 상태\n');
for (const r of report) {
  const linked = r.scenes.filter((s) => s.src).length;
  console.log(`■ ${r.p} (${r.code})`);
  console.log(`  1) 목업 틀         화면이 연결된 장면 ${linked}/${r.scenes.length}`);
  const open = r.scenes.filter((s) => !s.src).map((s) => s.id);
  if (open.length) console.log(`                     화면 없음: ${open.join(', ')}`);
  console.log(`  2) 시나리오 가이드 TODO ${sum(r.scenarioTodo)}개`);
  for (const [name, n] of r.scenarioTodo) console.log(`                     ${String(n).padStart(2)}  ${name}`);
  if (r.proposalTodo) {
    console.log(`  3) 접수양식 원고   TODO ${sum(r.proposalTodo)}개`);
    for (const [name, n] of r.proposalTodo) console.log(`                     ${String(n).padStart(2)}  ${name}`);
  } else {
    console.log('  3) 접수양식 원고   PROPOSAL.md가 없습니다');
  }
  if (r.sdk) {
    console.log(`  +) SDK 활용 맵     API·상수 이름 ${r.sdk.names}개, TODO ${r.sdk.todo}개`);
    if (r.sdk.unknown.length) console.log(`                     근거 문서에서 못 찾은 이름: ${r.sdk.unknown.join(', ')}`);
  } else {
    console.log('  +) SDK 활용 맵     SDK.md가 없습니다');
  }
  console.log('');
}
if (!projects.length) problems.push('projects/<p>/SCENARIO.md가 하나도 없습니다');
if (check && stale) problems.push('data/*.js가 장면 표와 다릅니다. node spikes/mockup-frame/build.mjs를 실행합니다');
if (!check) console.log(stale ? '틀 데이터를 갱신했습니다: spikes/mockup-frame/data/' : '틀 데이터는 이미 최신입니다.');
if (problems.length) {
  console.log('\n고칠 것');
  for (const m of problems) console.log(`  - ${m}`);
  process.exitCode = 1;
}
