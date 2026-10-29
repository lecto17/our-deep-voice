# AI 협업 워크플로

이 레포에서 AI 코딩 도구를 쓸 때의 규칙과 절차다. 규칙은 두 종류로 나뉜다.

- **강제 규칙**: 설정(permissions, hooks)으로 막는다. 사람이 잊어도, AI가 무시해도 동작한다.
- **권고 규칙**: 판단이 필요해서 문서(`AGENTS.md`, `CLAUDE.md`)에 둔다. 리뷰에서 확인한다.

강제 장치는 **Claude Code에서만** 동작한다. 다른 도구는 권고 규칙만 공유된다(7장).

## 1. 처음 시작하기

### 준비

1. Node.js 설치. 로컬 확인 버전은 v24.13.0이다(최소 지원 버전은 미확인).
   훅 스크립트가 `node`로 실행되므로 셸에서 `node -v`가 동작해야 한다.
2. pnpm 설치: `npm install -g pnpm` (로컬 확인 버전 11.5.0)
3. 의존성 설치: `pnpm install`
4. 환경 변수: `ENV_SETUP.md`를 보고 `.env.local`을 만든다. 값은 메인테이너에게 받는다.
5. Claude Code 설치: <https://docs.claude.com/en/docs/claude-code> 참고.

### 첫 세션

1. 레포 루트에서 `claude`를 실행한다. 폴더 신뢰 여부를 물으면 승인한다(승인해야 프로젝트 훅이 동작한다).
2. 다음을 확인한다.
   - `/memory`: `CLAUDE.md`(와 import된 `AGENTS.md`)가 목록에 있는지
   - `/hooks`: PreToolUse, PostToolUse, Stop 훅이 보이는지
   - `/permissions`: deny에 `.env` 규칙, ask에 `git push` 규칙이 있는지
3. 동작 확인(선택): "`.env.local` 내용을 보여줘"라고 요청하면 거부되어야 한다.

### 개인 설정

공유 설정을 직접 고치지 말고 아래 파일에 둔다. 둘 다 `.gitignore` 대상이다.

| 파일                          | 용도                                             |
| ----------------------------- | ------------------------------------------------ |
| `.claude/settings.local.json` | 개인 허용 명령, 개인 MCP 등 (공유 deny보다 약함) |
| `CLAUDE.local.md`             | 개인 작업 메모, 선호하는 응답 방식               |

공유 설정의 deny는 개인 설정의 allow보다 우선한다. 개인 설정으로 강제 규칙을 풀 수 없다.

## 2. 강제 규칙과 권고 규칙

### 강제 규칙 (`.claude/settings.json`)

| 규칙                                     | 장치                            | 동작                                      |
| ---------------------------------------- | ------------------------------- | ----------------------------------------- |
| `.env*`, `*.pem`, `*.key` 읽기·수정 금지 | permissions.deny                | Read/Edit/Write 도구 거부                 |
| 셸 명령으로 위 파일 접근 금지            | PreToolUse 훅 `guard-secrets`   | 명령에 해당 파일명이 있으면 차단          |
| push, PR 머지, Vercel 배포는 승인 필요   | permissions.ask                 | 실행 전 사용자 승인 요청                  |
| AI가 공유 설정·훅을 고치면 승인 필요     | permissions.ask                 | `.claude/settings.json`, `.claude/hooks/` |
| 편집한 파일 자동 포맷                    | PostToolUse 훅 `format-on-edit` | 편집한 파일만 prettier                    |
| 응답 종료 전 타입체크·린트 통과          | Stop 훅 `verify-on-stop`        | 실패 시 종료를 막고 에러를 AI에 전달      |

알아둘 한계:

- `guard-secrets`는 문자열 패턴으로 판단한다. 커밋 메시지에 `.env`라는 글자가 있어도 차단되므로
  메시지를 파일로 쓰고 `git commit -F <파일>`을 쓴다. 반대로 난독화된 명령은 놓칠 수 있다.
- `verify-on-stop`은 커밋되지 않은 코드 변경이 있을 때만 실행되고, 연속 3회 실패하면 경고와 함께 종료를 허용한다.
- 빌드(`pnpm build`)는 Stop 훅에 넣지 않았다. PR 전에 `/pr-check`로 확인한다.

### 권고 규칙

`AGENTS.md`(공통)와 `CLAUDE.md`(Claude 전용)에 있다. 체크 명령, 오해하기 쉬운 부분,
건드리면 안 되는 영역, 결정 사항, 검증 원칙, 커밋 표기가 여기에 해당한다.

## 3. 금지 사항

- 시크릿 값을 AI에게 붙여넣거나, AI 출력·로그·커밋에 남기는 것
- `main`에 직접 커밋·push (main push = Vercel 프로덕션 배포)
- AI에게 push, 머지, 배포를 승인 없이 맡기는 것
- 강제 규칙을 끄거나 우회하는 설정을 공유 파일에 커밋하는 것
- AI가 낸 결과를 실행해 보지 않고 "동작함"이라고 PR에 적는 것

## 4. 작업 흐름

1. **브랜치**: `dev`에서 분기한다. 이름은 `feat/<이슈번호>-<요약>`, `fix/…`, `refactor/…`, `chore/…`, `docs/…`.
2. **AI 작업**: 작업 범위를 구체적으로 지시한다. Stop 훅이 타입·린트 에러를 응답마다 잡는다.
3. **셀프 리뷰**: Claude Code에서 `/pr-check`를 실행한다(타입체크 → 린트 → 빌드 → diff 범위 → `reviewer` 리뷰).
   AI가 만든 diff는 사람이 직접 한 번 읽는다.
4. **PR**: 기능 PR은 `dev` 대상으로 연다(CodeRabbit 자동 리뷰는 `dev` 대상에만 동작).
   `main`에는 릴리스용 `dev → main` PR로만 반영한다.

## 5. PR 체크리스트

- [ ] `pnpm exec tsc --noEmit` 통과 (exit 0)
- [ ] `pnpm exec eslint src` 에러 0
- [ ] `pnpm build` 통과
- [ ] 변경 파일이 요청 범위 안에 있다 (`git diff --stat`)
- [ ] 시크릿, `.env*` 파일, 개인 설정 파일이 포함되지 않았다
- [ ] 인증, RLS, 날짜(Asia/Seoul) 관련 변경이면 직접 동작을 확인했다
- [ ] PR 본문에 "AI 사용 범위"를 적었다
- [ ] 확인하지 못한 항목은 "미확인"으로 적었다

## 6. AI 산출물 검증 원칙

- **실행 결과로 확인한다.** "통과", "동작함"은 명령과 exit code가 있을 때만 쓴다.
- **근거 없는 수치·주장을 쓰지 않는다.** 측정하지 않은 성능 수치, 확인하지 않은 API·옵션·파일을 사실처럼 쓰지 않는다.
- **모르면 "미확인"이라고 쓰고 확인 방법을 적는다.** 예: RLS 정책은 레포에 없으므로 Supabase 대시보드에서 확인.
- **테스트가 없다.** 이 레포에는 자동 테스트가 없으므로 "테스트 통과"라는 표현을 쓰지 않는다.

## 7. 다른 AI 도구·IDE를 쓸 때

규칙은 IDE가 아니라 **AI 에이전트** 단위로 적용된다.

| 사용 형태                                                | 읽는 규칙                                                 | 강제 장치  |
| -------------------------------------------------------- | --------------------------------------------------------- | ---------- |
| Claude Code (터미널, VS Code·JetBrains 확장 등 어디서든) | `CLAUDE.md` → `AGENTS.md`                                 | 적용됨     |
| Antigravity, Cursor, JetBrains Junie                     | `AGENTS.md` (도구별 지원 여부 미확인)                     | 적용 안 됨 |
| GitHub Copilot                                           | `.github/copilot-instructions.md` (AGENTS.md 지원 미확인) | 적용 안 됨 |

- 공통 규칙의 원본은 `AGENTS.md` 하나다. `CLAUDE.md`는 이를 import한다.
  심볼릭 링크는 쓰지 않는다(Windows 기본 설정에서 일반 텍스트 파일로 체크아웃된다).
- `GEMINI.md`는 만들지 않는다. Antigravity에서 `AGENTS.md`보다 우선 적용되어 원본이 둘이 된다.
- 어떤 도구가 `AGENTS.md`를 읽는지 확인하려면: 그 도구에 "AGENTS.md의 패키지 매니저 규칙을 인용해줘"라고 요청한다.
- `AGENTS.md`를 읽지 않는 도구를 쓰는 사람이 생기면, 그 도구의 규칙 파일에
  "이 레포의 규칙은 루트 AGENTS.md를 따른다" 한 줄만 둔 포인터 파일을 추가한다. 내용을 복사하지 않는다.
- 시크릿 파일 숨김은 도구마다 따로 설정해야 한다(예: Cursor는 `.cursorignore`).

여러 도구를 쓰는 팀에서 강제가 필요해지면, 도구와 무관한 층으로 옮긴다.

- git pre-commit 훅(lefthook 등)으로 타입체크·린트·포맷·시크릿 스캔(gitleaks)
- GitHub Actions CI에서 같은 검사
- GitHub 브랜치 보호(main 직접 push 금지, PR 필수)

## 8. 규칙 추가·수정 방법

1. 먼저 분류한다.
   - 예외 없이 지켜야 하고 기계적으로 판정할 수 있다 → 강제 규칙(`.claude/settings.json`, `.claude/hooks/`)
   - 상황에 따라 예외가 있다 → 권고 규칙
   - 모든 AI 도구에 해당 → `AGENTS.md` / Claude Code에만 해당 → `CLAUDE.md`
2. 코드를 읽으면 알 수 있는 내용은 추가하지 않는다. `AGENTS.md` + `CLAUDE.md`는 합쳐서 200줄 이내로 유지한다.
3. 특정 경로에만 해당하는 규칙이 3개를 넘으면 `.claude/rules/`로 분리를 검토한다(현재는 없음).
4. 반복되는 여러 단계 절차는 `.claude/skills/<이름>/SKILL.md`로 만든다(현재 `pr-check`).
5. 변경은 PR로만 한다. 강제 규칙을 바꿨다면 PR에 검증 결과(차단/허용 확인 출력)를 붙인다.
   AI가 `.claude/settings.json`이나 훅을 수정하면 승인 요청이 뜨므로, 내용을 읽고 승인한다.
