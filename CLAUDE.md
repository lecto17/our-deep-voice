@AGENTS.md

# Claude Code 전용

공통 규칙은 위의 AGENTS.md가 원본이다. 여기에는 Claude Code에만 해당하는 내용만 둔다.

## 강제 장치 (`.claude/settings.json`)

- 시크릿 파일 Read/Edit은 deny, 셸 명령으로 접근하면 `guard-secrets` 훅이 차단한다.
  - 패턴 매칭이라 커밋 메시지나 heredoc 본문에 `.env` 문자열이 있어도 차단된다.
    이 경우 메시지를 파일로 쓰고 `git commit -F <파일>`을 쓴다. 훅을 우회하려고 문자열을 쪼개지 않는다.
- `git push`, `gh pr merge`, `vercel`, `.claude/settings.json`·훅 수정은 사용자 승인이 필요하다.
- 편집한 파일은 prettier로 자동 포맷된다(`format-on-edit` 훅).
- 응답을 끝낼 때 커밋되지 않은 코드 변경이 있으면 `tsc --noEmit`과 변경 파일 eslint(에러만)가 실행된다.
  실패하면 종료가 막히고 에러가 전달된다. 연속 3회 실패하면 경고와 함께 종료가 허용되므로,
  그 경우 남은 에러를 숨기지 말고 사용자에게 보고한다.

## 하네스

- PR을 만들기 전: `/pr-check` 스킬로 타입체크·린트·빌드·diff·리뷰를 한 번에 확인한다.
- 리뷰: `reviewer` 서브에이전트(읽기 전용)에 `git diff` 결과를 넘겨 셀프 리뷰를 받는다.
- 개인 설정은 `.claude/settings.local.json`, 개인 메모는 `CLAUDE.local.md`(둘 다 gitignore).

## 취향 (예외 가능, 강제하지 않음)

- 주석은 주변 코드 밀도에 맞춘다. 한국어 주석을 기본으로 한다.
- 질문이 필요한 결정은 선택지와 추천안을 함께 제시한다.
