# AGENTS.md

AI 코딩 도구(Claude Code, Antigravity, Cursor 등)가 공통으로 따르는 규칙의 원본이다.
코드를 읽으면 알 수 있는 내용(폴더 구조 등)은 적지 않는다. 사람용 안내는 `docs/ai-workflow.md`.

## 체크 명령 (패키지 매니저: pnpm)

| 목적      | 명령                                | 비고                                                              |
| --------- | ----------------------------------- | ----------------------------------------------------------------- |
| 타입체크  | `pnpm exec tsc --noEmit`            | 수 초 내 완료                                                     |
| 린트      | `pnpm exec eslint <파일 또는 src>`  | `pnpm lint`(`next lint`)는 Next 15.5에서 deprecated라 쓰지 않는다 |
| 포맷      | `pnpm exec prettier --check <파일>` | 레포 전체 포맷 금지(아래 결정 사항 참고)                          |
| 빌드      | `pnpm build`                        | 타입·린트 검사 포함. 로컬 env가 있을 때 약 20초                   |
| 테스트    | 없음                                | 테스트 러너가 없다. "테스트 통과"라고 보고하지 않는다             |
| 개발 서버 | `pnpm dev`                          | Turbopack                                                         |

- npm/yarn으로 설치하지 않는다. `package-lock.json`이 남아 있지만 갱신 대상이 아니다.
- 의존성 추가·삭제는 사용자 승인 후에만 한다.

## 오해하기 쉬운 부분

- **인증은 Supabase Auth다.** 루트의 `auth.ts`는 전체 주석 처리, `middleware.ts`는 빈 함수다.
  `next-auth`는 의존성과 `SessionProvider`(채널 레이아웃)에만 남아 있다.
  서버에서 사용자 확인은 `src/actions/action.ts`의 `getAuthenticatedUser`를 쓴다.
- **DB 스키마와 RLS 정책은 레포에 없다.** Supabase 대시보드에만 있다.
  쿼리가 RLS에 막힐지 코드만으로 판단할 수 없으므로, 확인하지 못했으면 "미확인"으로 보고한다.
- **날짜 경계는 Asia/Seoul 기준이다.** 날짜별 게시글, 무드 집계, S3 업로드 경로가 모두 KST 자정 기준이다.
  `new Date()`를 UTC 날짜로 그대로 자르지 않는다.
- **환경 변수는 `ENV_SETUP.md`에 적힌 것보다 많다.** 서버 전용 키(Supabase service role, AWS)가 존재한다.
  서버 전용 키를 `NEXT_PUBLIC_` 변수나 클라이언트 컴포넌트에서 쓰지 않는다.
- `NEXT_PUBLIC_APP_URL`은 `next.config.ts`에서 NODE_ENV에 따라 계산된다.
- `styled-components`는 의존성에만 있고 사용처가 없다. 스타일은 Tailwind와 디자인 토큰을 쓴다.
- `middleware.ts` 주석의 "Next.js 16"은 사실과 다르다. 실제 버전은 15.5.9.

## 건드리면 안 되는 영역

- `.env*`, `*.pem`, `*.key`: 읽기·출력·복사·수정 금지. 값이 필요하면 사용자에게 요청한다.
- `main` 브랜치: 직접 커밋·push 금지. **main push는 Vercel 프로덕션 배포로 바로 이어진다.**
- 배포(`vercel` CLI), PR 머지, force push: 사용자가 명시적으로 지시할 때만.
- 요청 범위 밖의 대규모 리팩터링·포맷 변경·의존성 업그레이드.

## 이 레포의 결정 사항

- 패키지 매니저는 pnpm.
- 포맷은 `.prettierrc` 기준. 단, 기존 코드의 일부는 아직 이 규칙대로 포맷되어 있지 않다.
  수정하는 파일만 포맷하고, 레포 전체 포맷은 별도 PR로만 한다.
- 데이터 페칭은 SWR을 쓴다(react-query 전환은 미결정 이슈). 새 라이브러리를 섞지 않는다.
- 커밋 메시지는 `type: 한국어 요약` 형식. type은 `feat`, `fix`, `refactor`, `design`, `chore`, `docs`.
- PR 리뷰: CodeRabbit이 `dev` 대상 PR을 자동 리뷰한다(`.coderabbit.yaml`).

## 작업 원칙

- 변경 전에 관련 코드를 읽고, 기존 패턴과 이름 짓기를 따른다.
- 작업이 끝나면 타입체크와 린트를 실행해 결과를 확인한다. PR 전에는 빌드까지 확인한다.
- 앱 동작을 바꾸지 않는 작업(문서, 설정)에서 `src/` 변경이 생기면 안 된다.

## 검증 원칙 (AI 산출물)

- 실행해서 확인한 것만 "통과", "동작함"이라고 쓴다. 명령과 exit code를 근거로 남긴다.
- 실행하지 않은 것, 확인할 수 없는 것은 "미확인"으로 쓰고 확인 방법을 적는다.
- 측정하지 않은 수치(성능 개선율, 커버리지 등)를 만들지 않는다.
- 존재를 확인하지 않은 파일, 함수, 옵션, 라이브러리 API를 사실처럼 쓰지 않는다.

## AI 작업 커밋 표기

- 제목은 위 형식을 그대로 쓰고 `[AI]` 같은 접두어는 붙이지 않는다.
- AI가 변경의 상당 부분을 작성했다면 본문 끝에 트레일러를 붙인다.
  - `Co-Authored-By: <도구/모델명> <noreply 주소>`, 주소가 없으면 `Assisted-by: <도구명>`.
- PR 본문에 "AI 사용 범위"를 한 줄로 적는다.
