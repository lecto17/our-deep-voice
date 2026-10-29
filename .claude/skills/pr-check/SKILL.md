---
name: pr-check
description: PR을 만들기 전 검증 절차. 타입체크, 린트, 빌드, 앱 코드 diff 범위, 읽기 전용 리뷰를 실행하고 실제 출력과 exit code로 결과를 보고한다. "PR 준비", "PR 전에 확인", "/pr-check" 요청 시 사용.
---

# PR 전 검증

각 단계의 **실제 명령, exit code, 출력 요약**을 기록한다. 실행하지 않은 단계는 "미실행"으로 적는다.
실패한 단계가 있으면 고치고 해당 단계부터 다시 실행한다. 결과를 꾸미거나 생략하지 않는다.

## 절차

1. 기준 브랜치 확인: `git fetch origin` 후 비교 기준을 정한다(기본 `origin/main`, dev 대상 PR이면 `origin/dev`).
2. 타입체크: `pnpm exec tsc --noEmit`
3. 린트: `pnpm exec eslint src` (경고는 개수만, 에러는 전부 보고)
4. 빌드: `pnpm build`
5. 변경 범위: `git diff --stat <기준>...HEAD`
   - 요청 범위 밖 파일, `src/` 대규모 포맷 변경, lockfile 변경이 있으면 이유를 적는다.
6. 리뷰: `git diff <기준>...HEAD` 결과와 변경 의도를 `reviewer` 서브에이전트에 넘긴다.
   높음 심각도 발견 사항은 고치거나 사용자에게 판단을 요청한다.
7. 아래 형식으로 보고한다.

## 보고 형식

```
| 단계 | 명령 | exit | 결과 |
|---|---|---|---|
| 타입체크 | pnpm exec tsc --noEmit | 0 | 에러 없음 |
...

리뷰: 높음 n / 중간 n / 낮음 n / 미확인 n

PR 체크리스트 (docs/ai-workflow.md 기준)
- [ ] ...
```
