// Lighthouse 원본 JSON 여러 개를 읽어 중앙값·최소·최대를 계산한다.
//
// 사용법: node perf/scripts/summarize.mjs <결과 폴더> [<결과 폴더> ...]
//   예) node perf/scripts/summarize.mjs perf/results/f693c2e/mobile/login
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const METRICS = [
  ['score', 'Performance', (r) => r.categories.performance.score * 100, ''],
  ['lcp', 'LCP', (r) => audit(r, 'largest-contentful-paint'), 'ms'],
  ['tbt', 'TBT', (r) => audit(r, 'total-blocking-time'), 'ms'],
  ['cls', 'CLS', (r) => audit(r, 'cumulative-layout-shift'), ''],
  ['fcp', 'FCP', (r) => audit(r, 'first-contentful-paint'), 'ms'],
  ['si', 'Speed Index', (r) => audit(r, 'speed-index'), 'ms'],
  [
    'bytes',
    '총 전송 바이트',
    (r) => audit(r, 'total-byte-weight') / 1024,
    'KiB',
  ],
  [
    'js',
    'JS 전송 크기',
    (r) => bytesByType(r, 'Script').transfer / 1024,
    'KiB',
  ],
  [
    'jsRaw',
    'JS 리소스 크기(압축 해제)',
    (r) => bytesByType(r, 'Script').resource / 1024,
    'KiB',
  ],
  [
    'font',
    '폰트 전송 크기',
    (r) => bytesByType(r, 'Font').transfer / 1024,
    'KiB',
  ],
  [
    'ttfb',
    'TTFB(server-response-time)',
    (r) => audit(r, 'server-response-time'),
    'ms',
  ],
];

function audit(r, id) {
  return r.audits[id]?.numericValue ?? NaN;
}

function bytesByType(r, type) {
  const items = r.audits['network-requests']?.details?.items ?? [];
  return items
    .filter((it) => it.resourceType === type)
    .reduce(
      (acc, it) => ({
        transfer: acc.transfer + (it.transferSize ?? 0),
        resource: acc.resource + (it.resourceSize ?? 0),
      }),
      { transfer: 0, resource: 0 },
    );
}

function median(values) {
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

function fmt(v, unit) {
  if (Number.isNaN(v)) return 'n/a';
  if (unit === '') return v < 1 ? v.toFixed(3) : v.toFixed(0);
  return v.toFixed(unit === 'KiB' ? 1 : 0);
}

for (const dir of process.argv.slice(2)) {
  const files = readdirSync(dir)
    .filter((f) => /^run-\d+\.json$/.test(f))
    .sort();
  const reports = files.map((f) =>
    JSON.parse(readFileSync(join(dir, f), 'utf8')),
  );
  const errors = reports
    .map((r, i) =>
      r.runtimeError ? `${files[i]}: ${r.runtimeError.code}` : null,
    )
    .filter(Boolean);

  console.log(`\n## ${dir} (n=${reports.length})`);
  console.log(
    `최종 URL: ${[...new Set(reports.map((r) => r.finalDisplayedUrl))].join(', ')}`,
  );
  if (errors.length) console.log(`runtimeError: ${errors.join('; ')}`);
  console.log('| 지표 | 중앙값 | 최소 | 최대 | 각 실행 |');
  console.log('| --- | --- | --- | --- | --- |');
  for (const [, name, get, unit] of METRICS) {
    const vals = reports.map(get);
    console.log(
      `| ${name}${unit ? ` (${unit})` : ''} | ${fmt(median(vals), unit)} | ${fmt(Math.min(...vals), unit)} | ${fmt(Math.max(...vals), unit)} | ${vals.map((v) => fmt(v, unit)).join(', ')} |`,
    );
  }
}
