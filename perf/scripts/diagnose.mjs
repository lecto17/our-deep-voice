// Lighthouse 원본 JSON 한 개에서 진단 항목(LCP 요소, 렌더 차단, TBT 원인, 리소스 비중 등)을 뽑는다.
//
// 사용법: node perf/scripts/diagnose.mjs <run-N.json>
import { readFileSync } from 'node:fs';

const r = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const a = (id) => r.audits[id];
const kib = (b) => `${(b / 1024).toFixed(1)} KiB`;

console.log(
  `# ${r.finalDisplayedUrl} (${r.configSettings.formFactor}, ${r.configSettings.throttlingMethod})`,
);

// LCP 요소와 단계별 시간 (Lighthouse 13: lcp-breakdown-insight, 관측값 기준)
const lcpBlocks = a('lcp-breakdown-insight')?.details?.items ?? [];
for (const block of lcpBlocks) {
  if (block.type === 'node') {
    console.log(
      `LCP 요소: ${block.selector} | ${JSON.stringify(block.nodeLabel)}`,
    );
  }
  for (const it of block.items ?? []) {
    console.log(`  ${it.label}: ${Math.round(it.duration)} ms`);
  }
}

// 리소스 종류별 전송량
const reqs = a('network-requests')?.details?.items ?? [];
const byType = {};
for (const it of reqs) {
  const t = it.resourceType ?? 'Other';
  byType[t] ??= { n: 0, transfer: 0 };
  byType[t].n += 1;
  byType[t].transfer += it.transferSize ?? 0;
}
console.log('\n리소스 종류별 전송량:');
for (const [t, v] of Object.entries(byType).sort(
  (x, y) => y[1].transfer - x[1].transfer,
)) {
  console.log(`  ${t}: ${v.n}개, ${kib(v.transfer)}`);
}

console.log('\n요청 목록(전송량 순):');
for (const it of [...reqs].sort(
  (x, y) => (y.transferSize ?? 0) - (x.transferSize ?? 0),
)) {
  console.log(
    `  ${kib(it.transferSize ?? 0).padStart(12)} | ${it.resourceType} | prio=${it.priority} | ${Math.round(it.networkRequestTime ?? 0)}→${Math.round(it.networkEndTime ?? 0)} ms | ${it.url}`,
  );
}

const show = (id, fields) => {
  const au = a(id);
  if (!au) return console.log(`\n[${id}] 없음`);
  console.log(`\n[${id}] score=${au.score} ${au.displayValue ?? ''}`);
  for (const it of au.details?.items ?? []) {
    console.log(
      `  ${fields.map((f) => `${f}=${typeof it[f] === 'object' ? JSON.stringify(it[f]) : it[f]}`).join(' | ')}`,
    );
  }
};

// Lighthouse 13은 insight 감사(-insight)로 이름이 바뀐 항목이 있어 둘 다 시도한다
show('render-blocking-insight', ['url', 'totalBytes', 'wastedMs']);
show('render-blocking-resources', ['url', 'totalBytes', 'wastedMs']);
show('font-display-insight', ['url', 'wastedMs']);
show('bootup-time', ['url', 'total', 'scripting', 'scriptParseCompile']);
show('mainthread-work-breakdown', ['groupLabel', 'duration']);
show('long-tasks', ['url', 'startTime', 'duration']);
show('unused-javascript', ['url', 'totalBytes', 'wastedBytes']);
show('third-parties-insight', ['entity', 'transferSize', 'mainThreadTime']);
show('third-party-summary', ['entity', 'transferSize', 'blockingTime']);
show('network-dependency-tree-insight', []);

const chains = a('network-dependency-tree-insight')?.details;
if (chains) console.log(JSON.stringify(chains, null, 1).slice(0, 3000));
