# Play Console 출시노트 동기화

릴리스의 **출시노트**("이 버전의 새로운 기능")를 코드로 관리하고 API로 반영한다.
빌드 제출(`eas submit`) · 등록정보 동기화(`play-listing.mjs`)에 쓰는 것과 **동일한
서비스 계정 키**를 사용한다.

> 스토어 등록정보(앱 이름·설명·스크린샷)는 [`../README.md`](../README.md)(`play-listing.mjs`)가
> 담당한다. 출시노트는 트랙·버전별로 따로 관리되는 **별개 영역**이다.

스크립트: [`scripts/play-release-notes.mjs`](../../../../scripts/play-release-notes.mjs)

## 사전 준비

1. `pnpm add -Dw googleapis` (최초 1회, listing 스크립트와 공용)
2. 빌드 제출에 쓰던 서비스 계정 키를 `apps/mobile/play-service-account.json` 에 둔다.
   (또는 `PLAY_SERVICE_ACCOUNT=<경로>` / `--key <경로>`)
   - git 에 커밋되지 않는다. 서비스 계정에 Play Console **"출시 관리"** 권한이 있어야 한다.
     (eas submit 에 쓰던 키라면 이미 권한이 있다.)

## 사용

```bash
# 현재 트랙(기본 production) 릴리스의 출시노트 내려받기
pnpm play:notes:pull

# 특정 트랙/버전 지정해서 내려받기
node scripts/play-release-notes.mjs pull --track production --version-code 17

# 올리기 전 미리보기 (반영 안 됨)
pnpm play:notes:push -- --dry-run

# 실제 반영
pnpm play:notes:push

# 트랙/버전/언어 지정
node scripts/play-release-notes.mjs push --track production --version-code 17 --lang ko-KR
```

> `pnpm` 으로 플래그를 넘길 때는 `--` 뒤에 붙인다: `pnpm play:notes:push -- --dry-run`

## 디렉토리 규약

```
apps/mobile/store/release-notes/
  ko-KR.txt   한국어 출시노트 (최대 500자)
  en-US.txt   (선택) 언어 파일을 추가하면 함께 처리
```

## 동작 규칙

- **언어 병합**: 파일이 있는 언어만 그 텍스트로 교체하고, 파일이 없는 언어의 기존
  Play 값은 건드리지 않는다.
- **글자 수**: 언어당 500자 초과 시 에러로 중단한다.
- **대상 릴리스**: 기본 트랙은 `production`. 트랙에 릴리스가 여럿이면
  `--version-code <N>` 으로 지정하고, 미지정 시 versionCode 가 가장 높은 릴리스를 쓴다.
- **버전 이력**: 출시노트는 매 버전 갱신되므로, 과거 노트는 git 히스토리로 추적한다
  (파일은 항상 "다음에 낼 릴리스"의 노트를 담는다).

## 주의 — 프로덕션 심사 타이밍

- 출시노트는 **선택 항목**이다. 비어 있어도 심사가 반려되거나 막히지 않는다.
- Play 편집 세션은 동시에 하나만 깔끔히 커밋된다. **콘솔에서 릴리스를 편집 중**일 때
  스크립트를 돌리면 `editConflict` 가 날 수 있다. 권장 순서:
  **① 릴리스 생성 → ② 노트 push(또는 콘솔 입력) → ③ 심사 제출.**
- 트랙별로 분리된다. 테스트 트랙 노트는 프로덕션으로 자동 복사되지 않는다.
