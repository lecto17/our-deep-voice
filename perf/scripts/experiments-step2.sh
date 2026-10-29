#!/usr/bin/env bash
# 2단계 차단 실험 (앱 코드 변경 없음). 커밋 f693c2e 빌드 + 로그인 headless Chrome(9222)
set -euo pipefail
cd /Users/toun28/project/our-deep-voice
export LH_PORT=9222
HOME_PATH="/channels/01e952eb-a41d-443d-928c-9eae665931cc?date=20261030"
FONT="--blocked-url-patterns=*pretendard*"
AVATAR="--blocked-url-patterns=https://our-diary.s3.ap-northeast-2.amazonaws.com/*"
DEVTOOLS="--throttling-method=devtools"

LH_EXTRA_ARGS="" perf/scripts/measure.sh channel-home--rerun "$HOME_PATH" 5 mobile
LH_EXTRA_ARGS="$FONT" perf/scripts/measure.sh channel-home--exp-block-font "$HOME_PATH" 5 mobile
LH_EXTRA_ARGS="$AVATAR" perf/scripts/measure.sh channel-home--exp-block-avatar "$HOME_PATH" 5 mobile
LH_EXTRA_ARGS="$FONT $AVATAR" perf/scripts/measure.sh channel-home--exp-block-both "$HOME_PATH" 5 mobile
LH_EXTRA_ARGS="$FONT" perf/scripts/measure.sh channels--exp-block-font /channels 5 mobile
LH_EXTRA_ARGS="$DEVTOOLS" perf/scripts/measure.sh channel-home--devtools "$HOME_PATH" 3 mobile
LH_EXTRA_ARGS="$DEVTOOLS $FONT $AVATAR" perf/scripts/measure.sh channel-home--devtools-exp-block-both "$HOME_PATH" 3 mobile
echo ALL_DONE
# 위 devtools 2세트는 서버의 Supabase 호출 ECONNRESET(500)으로 중단되어 아래로 재실행했다
# LH_EXTRA_ARGS="$DEVTOOLS" perf/scripts/measure.sh channel-home--devtools "$HOME_PATH" 3 mobile
# LH_EXTRA_ARGS="$DEVTOOLS $FONT $AVATAR" perf/scripts/measure.sh channel-home--devtools-exp-block-both "$HOME_PATH" 3 mobile
# LH_EXTRA_ARGS="$DEVTOOLS $FONT" perf/scripts/measure.sh channel-home--devtools-exp-block-font "$HOME_PATH" 3 mobile
