// 측정 대상 피드의 데이터셋 지문을 남긴다. before/after가 같은 데이터로 측정됐는지 비교하는 용도.
// 로그인된 측정 전용 Chrome(LH_PORT, 기본 9222)의 localhost 탭에서 /api/posts를 GET으로만 조회한다.
//
// 사용법: node perf/scripts/dataset-snapshot.mjs <channelId> <YYYYMMDD> [저장 경로]
import { writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const [channelId, date, outPath] = process.argv.slice(2);
const port = process.env.LH_PORT || '9222';

const targets = await (await fetch(`http://localhost:${port}/json`)).json();
const tab = targets.find(
  (t) => t.type === 'page' && t.url.startsWith('http://localhost:3000'),
);
if (!tab) throw new Error('localhost:3000 탭이 없습니다');

const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r));

// 이미지 URL과 본문은 남기지 않고 개수·식별자만 남긴다
const expression = `(async () => {
  const pages = [];
  for (let page = 0; ; page++) {
    const res = await fetch('/api/posts?channelId=${channelId}&date=${date}&page=' + page + '&limit=10');
    const items = await res.json();
    if (!items.length) break;
    pages.push(items.map((p) => ({
      id: p.id,
      hasImage: !!p.imageKey,
      commentCount: p.commentCount ?? 0,
      reactionCount: (p.reactions ?? []).reduce((a, r) => a + (r.count ?? 0), 0),
    })));
  }
  return pages;
})()`;

const value = await new Promise((resolve) => {
  ws.addEventListener('message', (e) => {
    const m = JSON.parse(e.data);
    if (m.id === 1) resolve(m.result?.result?.value);
  });
  ws.send(
    JSON.stringify({
      id: 1,
      method: 'Runtime.evaluate',
      params: { expression, awaitPromise: true, returnByValue: true },
    }),
  );
});
ws.close();

const snapshot = {
  channelId,
  date,
  pages: value.length,
  posts: value.flat().length,
  postsWithImage: value.flat().filter((p) => p.hasImage).length,
  fingerprint: createHash('sha256')
    .update(JSON.stringify(value))
    .digest('hex')
    .slice(0, 16),
  takenAt: new Date().toISOString(),
};
console.log(JSON.stringify(snapshot));
if (outPath) writeFileSync(outPath, JSON.stringify(snapshot, null, 2) + '\n');
