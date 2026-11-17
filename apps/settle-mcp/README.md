# @uandi/settle-mcp — 데스크탑 결산 MCP 서버

은행·카드 거래 내역서로 말랑 가계부를 결산하는 로컬 MCP 서버다. 명세는 `docs/09-settle-mcp.md`.

거래를 안전하게 넣는 것만이 아니라, **쓰는 사람이 자기 기준을 세우고 다음 달에 재사용하도록 돕는** 것이 목표다.

- 내역서 읽기(PDF → 거래 행)는 **호스트 LLM**(Claude Desktop 등)이 한다. 결정적 파서는 없다.
- 중복 판정·규칙 적용·가계부 쓰기·되돌리기·제안·회고는 **이 서버의 코드**가 한다. 서버는 제안까지만 하고 자동으로 규칙을 만들지 않는다.
- 규칙 파일과 스테이징 데이터는 **사용자 PC에만** 남는다. 말랑 가계부 서버는 거래 데이터를 보지 않는다.
  단, 사용자가 쓰는 LLM 제공자는 내역서 적요를 본다.

## 세 겹 — 원칙 · 기준 · 학습 루프

| 겹                 | 누가 가지는가 | 어디에                                                                         |
| ------------------ | ------------- | ------------------------------------------------------------------------------ |
| **원칙** 여섯 줄   | 서버          | `src/resources/principles.ko.md` → `uandi://principles`. 사용자는 바꿀 수 없다 |
| **기준**(playbook) | 사용자(커플)  | `~/.uandi-settle/rules.json` v2 — 사람 말 기준 + 기계 규칙(이유 포함)          |
| **학습 루프**      | 서버 + LLM    | 결정 로그 → "규칙으로 올릴까요?" 제안 → 승격 → 회고                            |

원칙 여섯 줄: ① 나중의 우리를 위해 쓴다 ② 같은 돈은 한 번만 적는다 ③ 우리 안에서 오간 돈은 쓴 돈이 아니다 ④ 한 가게는 한 칸에 ⑤ 두 번 같은 고민을 했으면 규칙으로 만든다 ⑥ 원칙은 서버가 지키고, 기준은 우리가 정한다. 기준이 원칙과 어긋나면 서버는 알려 주되 막지 않는다.

## 설치·연결

```bash
# 1) 웹앱 /settings/desktop 에서 연결 코드(XXXX-XXXX) 발급
# 2) 코드로 로그인 — 로그인 상태는 OS 키체인에 저장된다
uandi-settle-mcp connect ABCD-2345
uandi-settle-mcp status
```

Claude Desktop 설정(`~/Library/Application Support/Claude/claude_desktop_config.json`)에 등록한다.
아직 npm에 배포하지 않았으므로 `npx @uandi/settle-mcp`는 동작하지 않는다 — 모노레포에서 빌드한 `dist/cli.js`를 직접 가리킨다.

```json
{
  "mcpServers": {
    "uandi-settle": {
      "command": "/opt/homebrew/bin/node",
      "args": ["<repo>/apps/settle-mcp/dist/cli.js"]
    }
  }
}
```

`command`는 `which node`의 절대 경로를 쓴다(Claude Desktop은 셸 PATH를 물려받지 않는다). 설정 후 Claude Desktop을 완전히 종료(⌘Q)하고 다시 연다.
터미널에서 `connect`/`status`를 실행할 때도 `node dist/cli.js connect …`처럼 직접 호출한다.

## 사용

### 월 결산 — `/settle-statement` (인자: `month`, `sourceKind`)

Claude Desktop에 내역서 PDF를 첨부하고 프롬프트를 쓰면 LLM이 이 순서로 움직인다.

1. **기준 복습** — 원칙 여섯 줄 제목과 지난번 기준 요약. **첫 결산이면 인터뷰 4문**(카드대금 처리, 서로의 이름, 남에게 보낸 돈, 현금·환불)을 먼저 하고 답을 기준·규칙으로 저장한다.
2. **읽기 → `stage_transactions`** — 규칙 적용, 배치 내 중복 제거, 가계부 기존 내역과 날짜·금액 대조.
3. **결과 표** — 경고(같은 내역서를 두 번 넣었는지) → 주의 목록(금액 큰 순, "지난달엔 X로 하셨어요" 비고) → 제안(규칙으로 올릴 결정, 같은 적요 다른 카테고리, 규칙 없는 큰 금액) → 겹친 규칙.
4. **결정** — `set_category`. 같은 결정이 두 번 쌓이면 "앞으로도 이렇게 할까요?" → `save_rule {kind:"promote"}`. 사용자가 말한 기준은 `principle`로, 규칙에는 항상 **왜**(rationale)를 남긴다.
5. **커밋** — `commit_batch {dryRun:true}`로 건수와 회고를 확인한 뒤 커밋.
6. **회고** — "규칙 r건 / 추정 l건 / 손으로 u건, 새 규칙 m개", 남은 승격 후보, 규칙 없는 큰 금액, `undo_batch` 안내.

### 기준 점검 — `/settle-playbook` (인자 없음)

내역서 없이 `review_playbook`으로 말로만 있는 기준, 승격 후보, 일관되지 않은 적요, 겹치는 규칙, 이유 없는 규칙, 60일 넘게 안 쓴 규칙, 원칙과 어긋난 규칙을 하나씩 정리한다. "인터뷰 다시"라고 하면 다음 결산 때 다시 묻는다.

### 도구

| 도구                 | 역할                                                                                                                                                                             |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `stage_transactions` | 읽은 행을 스테이징. 규칙 적용 + 배치 내 중복 제거 + 기존 내역 대조. 응답에 `suggestions`·`conflicts`·`warnings`·`playbookDigest`                                                 |
| `list_staged`        | 배치의 행을 상태별로 조회                                                                                                                                                        |
| `set_category`       | 카테고리 지정, pending/transfer/duplicate 상태 전환. 카테고리 결정을 로그에 쌓아 2회째에 `promotable`을 돌려준다                                                                 |
| `save_rule`          | 기준·규칙 저장. `exactCategory`/`categoryRule`(contains·regex·evenIfTransfer)/`promote`/`principle`/`interview`/`alias`/`ignore`/`transfer`/`remove`. 원칙 충돌은 `warnings`로만 |
| `commit_batch`       | 커밋 직전 강제 검사(별칭 잔존·무시·카테고리·재대조) 후 Firestore에 쓰기. `dryRun` 지원. 응답에 `retrospective`                                                                   |
| `undo_batch`         | 그 배치가 쓴 문서만 삭제 (커밋 후 30일 이내)                                                                                                                                     |
| `review_playbook`    | 읽기 전용 기준 점검. `focus`로 항목을 좁힐 수 있다                                                                                                                               |

### 리소스

| URI                  | 내용                                                         |
| -------------------- | ------------------------------------------------------------ |
| `uandi://principles` | 원칙 여섯 줄 전문(markdown). 사용자와 LLM이 같은 글을 읽는다 |
| `uandi://interview`  | 첫 결산 인터뷰 질문 4개와 답 형식(`answerShape`)             |
| `uandi://rules`      | 규칙 파일 v2 전체(기준·규칙·별칭·우리·결정 로그·인터뷰 상태) |
| `uandi://categories` | 로그인 커플의 카테고리 목록 — LLM이 고를 수 있는 유일한 후보 |

> Claude Code 호스트는 이 서버의 리소스를 노출하지 않는 문제가 있다(2026-10). 프롬프트는 그 경우 `review_playbook`의 `digest`·`principles`로 대신하도록 안내한다.

## 로컬 파일

| 경로                                | 내용                                                                               |
| ----------------------------------- | ---------------------------------------------------------------------------------- |
| `~/.uandi-settle/rules.json`        | 기준·규칙 v2. 사람이 직접 편집해도 된다(로드 시 zod 검증). v1 파일은 자동 승격된다 |
| `~/.uandi-settle/rules.v1.bak.json` | v1에서 승격했을 때 남는 원본 백업(한 번만)                                         |
| `~/.uandi-settle/staged.json`       | 스테이징 행·배치. 임시 파일 → rename으로 원자적 저장                               |
| OS 키체인 `uandi-settle`            | Firebase 로그인 상태(리프레시 토큰). 파일로는 안 남긴다                            |

`rules.json` v2의 뼈대: `principles`(사람 말 기준) · `categoryRules`(exact → contains → regex, 각각 `rationale`·`hits`·`examples`·`conflictsWith`) · `ignore` · `transfer` · `aliases`(실명→별칭) · `insiders`(우리 — 적요에 보이면 송금) · `decisions`(결정 로그) · `interview`.
PC를 바꾸면 이 파일을 직접 복사한다(동기화 없음 — 실명이 서버로 가지 않게).

환경변수: `UANDI_SETTLE_DIR`(데이터 디렉터리), `UANDI_WEB_URL`, `UANDI_SETTLE_EMULATOR=1`(로컬 에뮬레이터),
`UANDI_EXPOSE_ALIASES=false`(규칙 리소스·`review_playbook`에서 실명을 `<실명 N>`으로 가림).

## 개발

```bash
pnpm --filter @uandi/settle-mcp test         # 단위 + stdio
pnpm --filter @uandi/settle-mcp typecheck
pnpm --filter @uandi/settle-mcp build        # dist/cli.js (cashbook-core 포함 번들) + dist/principles.ko.md

# 에뮬레이터 통합 테스트 (별도 터미널에서 에뮬레이터 먼저). 두 달 연속 결산 시나리오 포함
pnpm exec firebase emulators:start --only auth,firestore --project uandi-test
UANDI_SETTLE_E2E=1 pnpm --filter @uandi/settle-mcp test
```

원칙 문서(`src/resources/principles.ko.md`)의 번호·제목은 `src/core/principles.ts`와 일치해야 하며 테스트가 이를 검사한다. 원칙을 바꾸는 것은 릴리스다.
