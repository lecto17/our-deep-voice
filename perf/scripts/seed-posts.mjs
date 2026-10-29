// 측정 데이터용 게시글을 앱의 실제 작성 화면(/channels/<id>/post)으로 올린다.
// 로그인된 측정 전용 Chrome(9222)을 CDP로 조작한다. 클라이언트 압축 → /api/post → S3 업로드 경로를 그대로 탄다.
// 사용법: node seed-posts.mjs <channelId> <이미지 폴더> [시작 번호=1] [끝 번호=10]
import { readdirSync } from 'node:fs';
import { join } from 'node:path';

const [channelId, imgDir, fromArg = '1', toArg = '10'] = process.argv.slice(2);
const BASE = 'http://localhost:3000';
const images = readdirSync(imgDir).filter((f) => f.endsWith('.jpg')).sort();

const targets = await (await fetch('http://localhost:9222/json')).json();
const tab = targets.find((t) => t.type === 'page' && !t.url.startsWith('chrome://'));
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r));

let id = 0;
const pending = new Map();
const postResponses = [];
ws.addEventListener('message', (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) {
    pending.get(m.id)(m);
    pending.delete(m.id);
  }
  if (m.method === 'Network.responseReceived' && m.params.response.url.endsWith('/api/post')) {
    postResponses.push(m.params.response.status);
  }
});
const send = (method, params = {}) =>
  new Promise((resolve, reject) => {
    const myId = ++id;
    pending.set(myId, (m) => (m.error ? reject(new Error(`${method}: ${m.error.message}`)) : resolve(m.result)));
    ws.send(JSON.stringify({ id: myId, method, params }));
  });
const evaluate = async (expression) =>
  (await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })).result.value;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const waitFor = async (expression, timeoutMs, label) => {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await evaluate(expression).catch(() => false)) return;
    await sleep(300);
  }
  throw new Error(`시간 초과: ${label}`);
};

await send('Network.enable');
await send('Page.enable');

for (let n = Number(fromArg); n <= Number(toArg); n++) {
  const file = join(imgDir, images[n - 1]);
  const before = postResponses.length;
  await send('Page.navigate', { url: `${BASE}/channels/${channelId}/post` });
  await waitFor(`location.pathname.endsWith('/post') && !!document.querySelector('#fileUpload') && !!document.querySelector('textarea')`, 30000, '작성 화면');

  const { root } = await send('DOM.getDocument');
  const { nodeId } = await send('DOM.querySelector', { nodeId: root.nodeId, selector: '#fileUpload' });
  await send('DOM.setFileInputFiles', { nodeId, files: [file] });
  // setFileInputFiles만으로는 React onChange가 호출되지 않아 change 이벤트를 직접 보낸다
  await evaluate(`document.querySelector('#fileUpload').dispatchEvent(new Event('change', { bubbles: true }))`);
  // 클라이언트 WebP 변환이 끝나면 미리보기 이미지가 뜬다
  await waitFor(`!!document.querySelector('img[alt="uploaded image"]')`, 60000, '이미지 변환');

  await evaluate(`document.querySelector('textarea').value = ${JSON.stringify(`성능 측정용 테스트 게시글 ${n}/10`)}`);
  await evaluate(`[...document.querySelectorAll('button')].filter((b) => b.textContent.trim() === '게시글 작성').at(-1).click()`);
  await waitFor(`location.pathname === '/channels/${channelId}'`, 90000, '게시 후 이동');

  const status = postResponses.slice(before).join(',') || '미확인';
  console.log(`${n}/10 ${images[n - 1]} → /api/post ${status}`);
}
ws.close();
