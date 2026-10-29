#!/usr/bin/env bash
# Lighthouse 반복 측정 스크립트
#
# 사용법:
#   perf/scripts/measure.sh <라벨> <경로> [실행 횟수] [폼팩터]
#   예) perf/scripts/measure.sh login /auth/login 5 mobile
#
# 전제:
#   - `pnpm build && pnpm start`로 프로덕션 서버가 BASE_URL(기본 http://localhost:3000)에서 떠 있어야 한다.
#   - 로그인이 필요한 페이지는 로그인된 프로필로 띄운 Chrome에 붙어서 측정한다(LH_PORT).
#     쿠키 헤더(--extra-headers)는 서드파티 요청에도 붙으므로 쓰지 않는다.
#       1) pnpm dev 상태에서 전용 프로필 Chrome으로 로그인
#          Chrome --remote-debugging-port=9222 --user-data-dir=<프로필 경로> http://localhost:3000/auth/login
#       2) Chrome 종료 → pnpm build && pnpm start
#       3) 같은 프로필로 headless 재실행
#          Chrome --headless=new --remote-debugging-port=9222 --user-data-dir=<프로필 경로>
#       4) LH_PORT=9222 perf/scripts/measure.sh <라벨> <경로>
#     로그인이 풀리면 최종 URL이 /auth/login이 되므로 summarize.mjs 출력에서 확인한다.
#
# 결과:
#   perf/results/<커밋>/<폼팩터>/<라벨>/run-N.json  (Lighthouse 원본 JSON)
#   perf/results/<커밋>/<폼팩터>/<라벨>/meta.json   (측정 환경)
set -euo pipefail

LABEL="${1:?라벨이 필요합니다}"
PATHNAME="${2:?경로가 필요합니다}"
RUNS="${3:-5}"
FORM_FACTOR="${4:-mobile}"
BASE_URL="${BASE_URL:-http://localhost:3000}"
LH_VERSION="13.6.0"

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
COMMIT="$(git -C "$ROOT" rev-parse --short HEAD)"
# 앱 코드(src, next.config 등)에 커밋되지 않은 변경이 있으면 결과 폴더에 표시한다
DIRTY=""
if ! git -C "$ROOT" diff --quiet HEAD -- src next.config.ts package.json pnpm-lock.yaml tailwind.config.ts postcss.config.mjs; then
  DIRTY="-dirty"
fi
OUT_DIR="$ROOT/perf/results/${COMMIT}${DIRTY}/${FORM_FACTOR}/${LABEL}"
mkdir -p "$OUT_DIR"

URL="${BASE_URL}${PATHNAME}"

LH_ARGS=(
  --quiet
  --output=json
  --only-categories=performance
)
if [ -n "${LH_PORT:-}" ]; then
  LH_ARGS+=(--port="$LH_PORT")
else
  LH_ARGS+=(--chrome-flags="--headless=new")
fi
if [ "$FORM_FACTOR" = "desktop" ]; then
  LH_ARGS+=(--preset=desktop)
fi
# 진단 실험용 추가 인자 (예: LH_EXTRA_ARGS="--blocked-url-patterns=*pretendard*")
# 공백으로 구분하며, 값 안에 공백은 쓸 수 없다
if [ -n "${LH_EXTRA_ARGS:-}" ]; then
  read -r -a EXTRA_ARGS <<<"$LH_EXTRA_ARGS"
  LH_ARGS+=("${EXTRA_ARGS[@]}")
fi

# 워밍업: 서버 첫 요청 비용(모듈 로딩 등)을 측정에서 제외한다. 집계에는 넣지 않는다.
if [ -n "${LH_PORT:-}" ]; then
  # 로그인 페이지는 curl로는 리다이렉트만 받으므로 Lighthouse 1회로 워밍업한다
  pnpm dlx "lighthouse@${LH_VERSION}" "$URL" "${LH_ARGS[@]}" \
    --output-path="$OUT_DIR/warmup.json"
  echo "warmup 완료: $OUT_DIR/warmup.json"
else
  curl -s -o /dev/null -w "warmup ${URL} -> %{http_code} (%{time_total}s)\n" "$URL"
fi

for i in $(seq 1 "$RUNS"); do
  pnpm dlx "lighthouse@${LH_VERSION}" "$URL" "${LH_ARGS[@]}" \
    --output-path="$OUT_DIR/run-${i}.json"
  echo "run ${i}/${RUNS} 완료: $OUT_DIR/run-${i}.json"
done

cat > "$OUT_DIR/meta.json" <<EOF
{
  "commit": "$(git -C "$ROOT" rev-parse HEAD)",
  "dirty": $([ -n "$DIRTY" ] && echo true || echo false),
  "label": "$LABEL",
  "url": "$URL",
  "runs": $RUNS,
  "formFactor": "$FORM_FACTOR",
  "lighthouse": "$LH_VERSION",
  "chrome": "$("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --version 2>/dev/null || echo unknown)",
  "node": "$(node -v)",
  "machine": "$(sysctl -n machdep.cpu.brand_string 2>/dev/null || uname -m)",
  "chromePort": "${LH_PORT:-}",
  "extraArgs": "${LH_EXTRA_ARGS:-}",
  "measuredAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF
echo "저장 위치: $OUT_DIR"
