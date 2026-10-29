#!/usr/bin/env bash
# 피드(채널 홈) 측정 세트: 데이터셋 지문 → simulated 5회 → devtools 5회 → 데이터셋 지문
# 사용법: perf/scripts/run-feed-set.sh <라벨 접두어>
# 전제: 로그인된 측정 전용 Chrome이 LH_PORT(기본 9222)에 떠 있고, 프로덕션 서버가 3000에 떠 있다.
set -euo pipefail
cd "$(dirname "$0")/../.."
PREFIX="${1:?라벨 접두어가 필요합니다}"
CHANNEL=01e952eb-a41d-443d-928c-9eae665931cc
DATE=20261030
export LH_PORT="${LH_PORT:-9222}"
COMMIT="$(git rev-parse --short HEAD)"
DIRTY=""
git diff --quiet HEAD -- src next.config.ts package.json pnpm-lock.yaml tailwind.config.ts postcss.config.mjs || DIRTY="-dirty"
OUT="perf/results/${COMMIT}${DIRTY}/mobile"
mkdir -p "$OUT"

node perf/scripts/dataset-snapshot.mjs "$CHANNEL" "$DATE" "$OUT/${PREFIX}-dataset-before.json"
LH_EXTRA_ARGS="" perf/scripts/measure.sh "${PREFIX}" "/channels/${CHANNEL}?date=${DATE}" 5 mobile
LH_EXTRA_ARGS="--throttling-method=devtools" perf/scripts/measure.sh "${PREFIX}--devtools" "/channels/${CHANNEL}?date=${DATE}" 5 mobile
node perf/scripts/dataset-snapshot.mjs "$CHANNEL" "$DATE" "$OUT/${PREFIX}-dataset-after.json"
echo SET_DONE
