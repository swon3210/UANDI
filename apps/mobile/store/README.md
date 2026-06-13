# Play Console 스토어 등록정보 동기화

Play Console의 스토어 등록정보(앱 이름·설명글·스크린샷 등)를 코드로 관리하고
API로 자동 반영한다. 빌드 제출(`eas submit`)에 쓰는 것과 **동일한 서비스 계정 키**를
사용한다.

스크립트: [`scripts/play-listing.mjs`](../../../scripts/play-listing.mjs)

## 사전 준비

1. `pnpm add -Dw googleapis` (최초 1회)
2. 빌드 제출에 쓰던 서비스 계정 키를 `apps/mobile/play-service-account.json` 에 둔다.
   (또는 `PLAY_SERVICE_ACCOUNT=<경로>` / `--key <경로>` 로 지정)
   - 이 키는 git에 커밋되지 않는다 (`.gitignore` 등록됨).
   - 서비스 계정에 Play Console **"스토어 등록정보 편집"** 권한이 있어야 한다.

## 사용

```bash
# 현재 Play Console 값을 로컬로 내려받기 (텍스트만)
pnpm play:listing:pull

# 로컬 값을 Play Console에 올리기 전 미리보기 (반영 안 됨)
pnpm play:listing:push -- --dry-run

# 실제 반영
pnpm play:listing:push

# 텍스트만 / 스크린샷만 / 특정 언어만
node scripts/play-listing.mjs push --text-only
node scripts/play-listing.mjs push --images-only
node scripts/play-listing.mjs push --lang ko-KR
```

> `pnpm` 으로 플래그를 넘길 때는 `--` 뒤에 붙인다: `pnpm play:listing:push -- --dry-run`

## 디렉토리 규약

```
apps/mobile/store/listings/
  ko-KR/                       # 언어 코드 (Play와 동일: ko-KR, en-US ...)
    title.txt                  # 앱 이름        (최대 30자)
    short-description.txt       # 간단한 설명     (최대 80자)
    full-description.txt        # 자세한 설명     (최대 4000자)
    video.txt                   # 프로모션 영상 URL (선택)
    images/
      phoneScreenshots/         # 1.png, 2.png ... (2~8장, 파일명 숫자순 정렬)
      sevenInchScreenshots/     # 7" 태블릿 (선택)
      tenInchScreenshots/       # 10" 태블릿 (선택)
      featureGraphic/           # 1024x500 1장
      icon/                     # 512x512 1장
```

### 동작 규칙

- **텍스트**: 파일이 없거나 비어 있으면 기존 Play 값을 **덮어쓰지 않는다**.
  글자 수 제한 초과 시 에러로 중단한다.
- **이미지**: 해당 폴더에 파일이 있을 때만 처리한다. 처리 시 그 타입의
  기존 이미지를 모두 지우고 폴더 내용으로 **전부 교체**한다(멱등).
  파일명은 숫자순 정렬(`1.png`, `2.png`, `10.png`)되어 그 순서로 올라간다.
- **이미지 형식**: PNG 또는 JPEG. 폰 스크린샷은 알파 채널 없이 24비트 권장.

### 스크린샷 자동 생성

폰 스크린샷은 Playwright로 웹 앱(= WebView 콘텐츠)을 실제 폰 뷰포트에서 캡처해
`images/phoneScreenshots/` 로 바로 떨군다. 데모 데이터를 시드한 뒤 로그인 상태로 찍는다.

```bash
# 1) 별도 터미널에서 Firebase 에뮬레이터 기동
pnpm emulators
#   ↳ functions 빌드(tsc)에서 막히면 functions 없이 띄워도 캡처엔 충분:
#     pnpm exec firebase emulators:start --only auth,firestore,storage --project uandi-test

# 2) 스크린샷 캡처 (dev 서버는 자동 기동, 포트 3100)
pnpm screenshots            # = pnpm --filter web screenshots
pnpm --filter web screenshots:visible   # 브라우저 띄워서 확인하며

# 3) 캡처된 이미지만 Play에 업로드
pnpm play:listing:push -- --images-only
```

- 캡처 대상 화면과 순서는 `apps/web/e2e/screenshots/listing.screenshots.spec.ts`
  의 `SCREENS` 배열에서 조정한다. 파일명 앞 숫자가 스토어 노출 순서.
  기본 5종: 대시보드 / 가계부 / 현금흐름 / 자산배분 / 커뮤니티.
- 데모 데이터(가계부/현금흐름/자산배분/커뮤니티)는
  `apps/web/e2e/screenshots/seed-demo.ts` 에서 조정한다.
- 출력 규격: 1236×2400 PNG (세로:가로 ≈ 1.94:1 — Play의 2:1 비율 한도 이내).
- dev 서버의 Next.js 배지·온디맨드 컴파일 등은 스크립트가 자동으로 처리한다
  (배지 숨김 + 라우트 사전 컴파일). 별도 설정 불필요.
- **갤러리(사진)** 화면은 실제 이미지 파일이 있어야 썸네일이 보이므로 기본 캡처
  목록에서 제외돼 있다. 필요 시 Storage 에뮬레이터에 샘플 이미지를 올린 뒤 추가한다.

> 캡처는 Firebase 에뮬레이터의 데모 데이터로만 동작한다. 프로덕션 데이터는 쓰지 않는다.

## 주의

- `push` 는 등록정보 변경을 **검토 대기 상태로 제출**할 수 있다(프로덕션 출시 시).
  먼저 `--dry-run` 으로 확인할 것.
- 텍스트 파일은 git으로 버전 관리하는 것을 권장한다(설명글 이력 추적).
