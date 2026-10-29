// PreToolUse(Bash): .env 계열·키 파일을 다루는 셸 명령을 차단한다.
// permissions.deny의 Read(...) 규칙은 Read 도구에만 적용되므로
// cat/grep/sed/cp 등 셸 명령으로 우회하는 경로를 여기서 막는다.
// exit 2 = 도구 호출 차단 (stderr가 AI에게 전달됨)
import { readFileSync } from 'node:fs';

const input = JSON.parse(readFileSync(0, 'utf8'));
const command = input?.tool_input?.command ?? '';

const SECRET_PATTERNS = [
  // .env, .env.local, .env.production ... (.env.example은 허용, process.env 같은 코드는 제외)
  /(^|[^\w.-])\.env(?!\.example(?![\w.-]))(\.[\w.-]+)?(?![\w-])/,
  // 인증서·개인키 파일
  /[\w-]\.(pem|key)(?![\w-])/,
];

const hit = SECRET_PATTERNS.find((pattern) => pattern.test(command));
if (hit) {
  process.stderr.write(
    '[guard-secrets] 시크릿 파일(.env*, *.pem, *.key)을 다루는 명령은 차단됩니다. ' +
      '환경 변수 이름이 필요하면 ENV_SETUP.md를 참고하고, 값이 필요하면 사용자에게 요청하세요.\n',
  );
  process.exit(2);
}
