# @uandi/settle-mcp — 데스크탑 결산 MCP 서버

은행·카드 거래 내역서로 말랑 가계부를 결산하는 로컬 MCP 서버다. 명세는 `docs/09-settle-mcp.md`.

- 내역서 읽기(PDF → 거래 행)는 **호스트 LLM**(Claude Desktop 등)이 한다. 결정적 파서는 없다.
- 중복 판정·규칙 적용(무시·송금·실명→별칭·적요 정확일치)·가계부 쓰기·되돌리기는 **이 서버의 코드**가 한다.
- 규칙 파일과 스테이징 데이터는 **사용자 PC에만** 남는다. 말랑 가계부 서버는 거래 데이터를 보지 않는다.
  단, 사용자가 쓰는 LLM 제공자는 내역서 적요를 본다.

## 설치·연결

```bash
# 1) 웹앱 /settings/desktop 에서 연결 코드(XXXX-XXXX) 발급
# 2) 코드로 로그인 — 로그인 상태는 OS 키체인에 저장된다
uandi-settle-mcp connect ABCD-2345
uandi-settle-mcp status
```

Claude Desktop 설정(`claude_desktop_config.json`)에 등록:

```json
{
  "mcpServers": {
    "uandi-settle": {
      "command": "npx",
      "args": ["-y", "@uandi/settle-mcp"]
    }
  }
}
```

모노레포 안에서 개발 중이면 `command: "node"`, `args: ["<repo>/apps/settle-mcp/dist/cli.js"]`로 빌드 산출물을 직접 가리킨다.

## 사용

Claude Desktop에 내역서 PDF를 첨부하고 `/settle-statement` 프롬프트(인자: `month`, `sourceKind`)를 쓰면
LLM이 아래 순서로 도구를 호출한다.

| 도구                 | 역할                                                                                   |
| -------------------- | -------------------------------------------------------------------------------------- |
| `stage_transactions` | 읽은 행을 스테이징. 규칙 적용 + 배치 내 중복 제거 + 가계부 기존 내역과 날짜·금액 대조  |
| `list_staged`        | 배치의 행을 상태별로 조회                                                              |
| `set_category`       | 카테고리 지정, pending/transfer/duplicate 상태 전환                                    |
| `save_rule`          | 로컬 규칙 추가·삭제. 커밋 전 배치에 즉시 재적용                                        |
| `commit_batch`       | 커밋 직전 강제 검사(별칭 잔존·무시·카테고리·재대조) 후 Firestore에 쓰기. `dryRun` 지원 |
| `undo_batch`         | 그 배치가 쓴 문서만 삭제 (커밋 후 30일 이내)                                           |

리소스 `uandi://categories`(카테고리 후보)와 `uandi://rules`(규칙 파일)를 LLM이 먼저 읽는다.

## 로컬 파일

| 경로                          | 내용                                                    |
| ----------------------------- | ------------------------------------------------------- |
| `~/.uandi-settle/rules.json`  | 규칙. 사람이 직접 편집해도 된다 (로드 시 zod 검증)      |
| `~/.uandi-settle/staged.json` | 스테이징 행·배치. 임시 파일 → rename으로 원자적 저장    |
| OS 키체인 `uandi-settle`      | Firebase 로그인 상태(리프레시 토큰). 파일로는 안 남긴다 |

환경변수: `UANDI_SETTLE_DIR`(데이터 디렉터리), `UANDI_WEB_URL`, `UANDI_SETTLE_EMULATOR=1`(로컬 에뮬레이터),
`UANDI_EXPOSE_ALIASES=false`(규칙 리소스에서 실명 키를 가림).

## 개발

```bash
pnpm --filter @uandi/settle-mcp test         # 단위 + stdio
pnpm --filter @uandi/settle-mcp typecheck
pnpm --filter @uandi/settle-mcp build        # dist/cli.js (cashbook-core 포함 번들)

# 에뮬레이터 통합 테스트 (별도 터미널에서 에뮬레이터 먼저)
pnpm exec firebase emulators:start --only auth,firestore --project uandi-test
UANDI_SETTLE_E2E=1 pnpm --filter @uandi/settle-mcp test
```
