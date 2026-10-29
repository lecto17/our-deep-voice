// PostToolUse(Edit|Write|MultiEdit): 방금 편집한 파일 하나만 prettier로 포맷한다.
// 레포 전체 포맷은 하지 않는다(기존 코드에 포맷 diff가 섞이지 않도록).
// 실패해도 작업을 막지 않는다 (exit 1 = 사용자에게 경고만 표시).
import { existsSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const input = JSON.parse(readFileSync(0, 'utf8'));
const projectDir = process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd();
const filePath = input?.tool_input?.file_path;

const FORMAT_EXTENSIONS = /\.(ts|tsx|js|jsx|mjs|cjs|css|json|md)$/;
const SKIP =
  /(^|[\\/])(node_modules|\.next)[\\/]|(pnpm-lock\.yaml|package-lock\.json)$/;

if (!filePath || !FORMAT_EXTENSIONS.test(filePath) || SKIP.test(filePath)) {
  process.exit(0);
}

const relative = path.relative(projectDir, path.resolve(projectDir, filePath));
if (relative.startsWith('..') || path.isAbsolute(relative)) process.exit(0);

const prettierBin = path.join(
  projectDir,
  'node_modules/prettier/bin/prettier.cjs',
);
if (!existsSync(prettierBin)) {
  process.stderr.write(
    '[format-on-edit] prettier가 없습니다. `pnpm install`을 실행하세요.\n',
  );
  process.exit(1);
}

const result = spawnSync(
  process.execPath,
  [prettierBin, '--write', '--log-level', 'error', relative],
  { cwd: projectDir, encoding: 'utf8' },
);

if (result.status !== 0) {
  process.stderr.write(
    `[format-on-edit] prettier 실패: ${relative}\n${result.stderr}`,
  );
  process.exit(1);
}
