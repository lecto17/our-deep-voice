// 공개 레포에 올리기 전에 Lighthouse 원본 JSON에서 사용자 콘텐츠를 지운다.
// 측정 지표·요청 타이밍·감사 결과는 그대로 두고, 아래만 바꾼다.
//   - 화면 캡처: final-screenshot, screenshot-thumbnails의 details, 최상위 fullPageScreenshot 삭제
//   - 2KB가 넘는 data:image 문자열(캡처류) 삭제
//   - S3 객체 경로(업로드 원본 파일명 포함)를 해시로 대체. 같은 객체는 같은 해시가 되어 요청 대응 관계는 유지된다
//   - --terms 파일의 문자열(닉네임, 사용자 id 등)을 해시로 대체. 가릴 값이 레포에 남지 않도록 파일은 레포 밖에 둔다
//
// 사용법: node perf/scripts/sanitize-results.mjs [--terms <레포 밖 파일>] <폴더> [<폴더> ...]
//   (하위 *.json을 제자리에서 수정. terms 파일은 한 줄에 하나씩, 빈 줄은 무시)
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';

const S3_HOST = 'our-diary.s3.ap-northeast-2.amazonaws.com';
const hash = (s) => createHash('sha256').update(s).digest('hex').slice(0, 10);

// 원문(https://host/key)과 URL 인코딩(https%3A%2F%2Fhost%2Fkey) 두 형태를 모두 처리한다
const RAW = new RegExp(
  `(https?://${S3_HOST.replaceAll('.', '\\.')}/)([^"\\s?&)]+)`,
  'g',
);
const ENCODED = new RegExp(
  `(https?%3A%2F%2F${S3_HOST.replaceAll('.', '\\.')}%2F)([^"\\s&)]+)`,
  'gi',
);
const maskKey = (key, decode) => {
  const plain = decode ? decodeURIComponent(key) : key;
  const ext = plain.match(/\.(jpe?g|png|webp|gif|heic)$/i)?.[0] ?? '';
  return `masked-${hash(plain)}${ext}`;
};

const args = process.argv.slice(2);
const termsIdx = args.indexOf('--terms');
const terms =
  termsIdx === -1
    ? []
    : readFileSync(args.splice(termsIdx, 2)[1], 'utf8')
        .split('\n')
        .map((t) => t.trim())
        .filter(Boolean);
// URL에 들어간 경우도 가리도록 인코딩 형태까지 함께 치환한다
const termPairs = terms.flatMap((t) => {
  const masked = `masked-${hash(t)}`;
  return [...new Set([t, encodeURIComponent(t)])].map((form) => [form, masked]);
});

function sanitizeString(s) {
  if (s.startsWith('data:image/') && s.length > 2048)
    return '[removed: image data]';
  for (const [form, masked] of termPairs) s = s.replaceAll(form, masked);
  return s
    .replace(RAW, (_, prefix, key) => prefix + maskKey(key, false))
    .replace(
      ENCODED,
      (_, prefix, key) => prefix + encodeURIComponent(maskKey(key, true)),
    );
}

function walk(value) {
  if (typeof value === 'string') return sanitizeString(value);
  if (Array.isArray(value)) return value.map(walk);
  if (value && typeof value === 'object') {
    for (const k of Object.keys(value)) value[k] = walk(value[k]);
  }
  return value;
}

function sanitizeReport(r) {
  for (const id of ['final-screenshot', 'screenshot-thumbnails']) {
    if (r.audits?.[id]?.details) delete r.audits[id].details;
  }
  delete r.fullPageScreenshot;
  return walk(r);
}

let count = 0;
const visit = (dir) => {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) visit(p);
    else if (name.endsWith('.json')) {
      const json = JSON.parse(readFileSync(p, 'utf8'));
      // Lighthouse 결과만 화면 캡처를 지우고, meta/dataset 파일은 문자열 치환만 한다
      const out = json.lighthouseVersion ? sanitizeReport(json) : walk(json);
      writeFileSync(p, JSON.stringify(out) + '\n');
      count += 1;
    }
  }
};
for (const dir of args) visit(dir);
console.log(`정리한 파일: ${count}개`);
