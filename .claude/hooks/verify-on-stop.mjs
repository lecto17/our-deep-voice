// Stop: 커밋되지 않은 코드 변경이 있으면 타입체크와 린트(에러만)를 통과해야 응답을 끝낼 수 있다.
// exit 2 = 종료 차단 (stderr가 AI에게 전달되어 수정을 계속함)
// 같은 세션에서 연속 MAX_BLOCKS회 막으면 무한 루프를 피하기 위해 경고만 띄우고 종료를 허용한다.
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';

const MAX_BLOCKS = 3;
const CODE_FILE = /\.(ts|tsx|js|jsx|mjs|cjs)$/;

const input = JSON.parse(readFileSync(0, 'utf8'));
const projectDir = process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd();
const counterFile = path.join(
  os.tmpdir(),
  `claude-verify-on-stop-${input.session_id ?? 'unknown'}.json`,
);

const run = (args) =>
  spawnSync(process.execPath, args, { cwd: projectDir, encoding: 'utf8' });

const status = spawnSync(
  'git',
  ['status', '--porcelain', '--untracked-files=all'],
  { cwd: projectDir, encoding: 'utf8' },
);
const changedCodeFiles = status.stdout
  .split('\n')
  .filter(Boolean)
  .map((line) => line.slice(3).split(' -> ').pop().replace(/^"|"$/g, ''))
  .filter(
    (file) => CODE_FILE.test(file) && existsSync(path.join(projectDir, file)),
  );

if (changedCodeFiles.length === 0) {
  rmSync(counterFile, { force: true });
  process.exit(0);
}

const failures = [];

const tsc = run([
  path.join(projectDir, 'node_modules/typescript/bin/tsc'),
  '--noEmit',
]);
if (tsc.status !== 0) failures.push(['tsc --noEmit', tsc.stdout + tsc.stderr]);

const eslint = run([
  path.join(projectDir, 'node_modules/eslint/bin/eslint.js'),
  '--quiet',
  '--no-warn-ignored',
  ...changedCodeFiles,
]);
if (eslint.status !== 0)
  failures.push(['eslint --quiet', eslint.stdout + eslint.stderr]);

if (failures.length === 0) {
  rmSync(counterFile, { force: true });
  process.exit(0);
}

const blocks =
  (existsSync(counterFile)
    ? JSON.parse(readFileSync(counterFile, 'utf8')).blocks
    : 0) + 1;

if (blocks > MAX_BLOCKS) {
  rmSync(counterFile, { force: true });
  process.stdout.write(
    JSON.stringify({
      systemMessage: `[verify-on-stop] ${MAX_BLOCKS}회 연속 검사 실패로 종료를 허용했습니다. 타입/린트 에러가 남아 있습니다: ${failures.map(([name]) => name).join(', ')}`,
    }),
  );
  process.exit(0);
}

writeFileSync(counterFile, JSON.stringify({ blocks }));
const report = failures
  .map(
    ([name, output]) =>
      `## ${name} 실패\n${output.trim().split('\n').slice(-60).join('\n')}`,
  )
  .join('\n\n');
process.stderr.write(
  `[verify-on-stop] 검사 실패 (${blocks}/${MAX_BLOCKS}). 아래 에러를 고친 뒤 종료하세요.\n\n${report}\n`,
);
process.exit(2);
