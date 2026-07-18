# iOS 푸시 알림 설정 (FCM · 수동 콘솔 체크리스트)

말랑 가계부 iOS 앱이 **기존 FCM 백엔드 그대로** 푸시를 받도록 하는 설정 절차다.
코드(이 PR)만으로는 동작하지 않으며, 아래 **콘솔 수동 작업**을 마쳐야 iOS 푸시가 온다.

## 배경

- `apps/mobile`은 `uandi-web.vercel.app`를 띄우는 단일 WebView 래퍼다.
- 백엔드(`functions/`, firebase-admin)는 **FCM registration token**으로
  `messaging.sendEachForMulticast()` 발송한다 → iOS도 **FCM 토큰**이 있어야 한다.
- iOS의 `expo-notifications`는 원시 APNs 토큰만 주므로 FCM 발송과 호환되지 않는다.
  그래서 `@react-native-firebase/messaging`으로 APNs 등록 후 **FCM 토큰**을 받는다
  (`apps/mobile/lib/fcm.ts`). 받은 토큰은 Android와 동일하게
  `window.__UANDI_NATIVE__.fcmToken` → 웹 `NativeFcmBridge` → `users/{uid}/fcmTokens`에 저장된다.
- **백엔드/토큰 스토어/타입(`FcmTokenPlatform='ios'`) 변경은 없다.** 발송 경로는 그대로 재사용된다.

---

## 1. Apple Developer — APNs Auth Key(.p8) 생성

1. https://developer.apple.com/account → **Certificates, Identifiers & Profiles → Keys**
2. **＋** → 이름 입력 → **Apple Push Notifications service (APNs)** 체크 → Continue → Register
3. **`.p8` 파일 다운로드(1회만 가능)** 하고 다음을 기록:
   - **Key ID** (예: `ABC123DEFG`)
   - **Team ID** (우상단 멤버십, 예: `XXXXXXXXXX`)
4. **Identifiers → App ID `com.swon3210.uandi`** 에 **Push Notifications** capability가
   켜져 있는지 확인(EAS 빌드가 자동으로 켜주지만 미리 확인 권장).

> 이 `.p8` 하나로 sandbox/production 양쪽 APNs 환경을 모두 커버한다(토큰 기반 인증).

---

## 2. Firebase Console(uandi-55ee4) — iOS 앱 등록 + APNs 키 업로드

1. https://console.firebase.google.com/project/uandi-55ee4/settings/general
2. **앱 추가 → iOS** → **번들 ID: `com.swon3210.uandi`** 등록
3. **`GoogleService-Info.plist` 다운로드**
4. **Project Settings → Cloud Messaging → Apple app configuration → APNs Authentication Key → Upload**
   - 1번에서 받은 `.p8` + **Key ID** + **Team ID** 입력

---

## 3. plist를 repo에 연결 (google-services.json과 동일 패턴)

`GoogleService-Info.plist`는 **gitignore 대상**이라 커밋하지 않고 심볼릭 링크로 관리한다.

1. 2번에서 받은 파일을 **원본 repo**에 둔다:
   `/Users/jinsong/Documents/Github/UANDI/apps/mobile/GoogleService-Info.plist`
2. 워크스페이스에서 심볼릭 링크 생성:
   ```bash
   sh scripts/setup-env.sh
   ```
   → `apps/mobile/GoogleService-Info.plist` 링크가 생성된다(`app.json`의
   `ios.googleServicesFile: "./GoogleService-Info.plist"`가 이를 참조).

---

## 4. EAS — 클라우드 빌드용 file 환경변수 등록

클라우드 빌드는 gitignore된 plist를 못 읽으므로 **file 타입 env**로 주입한다
(Android `GOOGLE_SERVICES_JSON`과 동일한 방식, `app.config.js`가 `GOOGLE_SERVICES_PLIST`를 우선 사용).

```bash
cd apps/mobile
eas env:create --name GOOGLE_SERVICES_PLIST --type file \
  --value ./GoogleService-Info.plist --environment production --visibility secret
# 내부 테스트(preview) 빌드도 쓸 거면 동일하게:
eas env:create --name GOOGLE_SERVICES_PLIST --type file \
  --value ./GoogleService-Info.plist --environment preview --visibility secret
```

---

## 5. 빌드 & 제출 (production → TestFlight)

- `app.json`의 `expo.version`은 이 PR에서 **1.3.1 → 1.4.0**으로 올렸다
  (기능 추가 = minor, `.claude/rules/mobile-version-bump.md`).
- 빌드 전 브랜치가 `origin/main` 최신인지, `apps/mobile` 변경이 모두 커밋됐는지 확인
  (`.claude/rules/mobile-assets-commit-before-build.md`).

```bash
cd apps/mobile
eas build --platform ios --profile production --auto-submit
```

- `eas.json`의 `submit.production.ios`(ASC API 키)가 이미 채워져 있어 빌드+제출이 한 번에 된다.
- versionCode(빌드 번호)는 `appVersionSource: remote` + `autoIncrement`로 EAS가 자동 증가.

---

## 6. TestFlight 검증

> **푸시는 실기기에서만 동작**(시뮬레이터는 APNs 불가). 반드시 TestFlight로 확인.

1. TestFlight에서 새 빌드 설치, 앱 실행 → **알림 권한 허용**.
2. 앱이 웹뷰를 로드하고 로그인된 상태에서 잠시 대기
   → `lib/fcm.ts`가 FCM 토큰을 받아 웹으로 주입 → `users/{uid}/fcmTokens/{hash}`에
   `platform: "ios"` 문서가 생성되는지 Firestore에서 확인.
3. 테스트 푸시 발송(둘 중 하나):
   - 앱 내 테스트 알림 트리거(`functions/src/notifications/sendTestPush.ts` 경로), 또는
   - Firebase Console → Cloud Messaging → **테스트 메시지 전송**에 위 iOS FCM 토큰 입력.
4. **알림 수신 확인**(백그라운드/종료 상태에서 배너 표시).
5. 알림 **탭 → 딥링크 이동** 확인(`data.click_action` 경로로 이동).

### 검증 시 체크포인트 / 알려진 리스크

- **탭→딥링크**: 탭 핸들러는 `expo-notifications`의
  `addNotificationResponseReceivedListener`(`hooks/use-fcm-registration.ts`)가 처리한다.
  RNFirebase messaging과 공존 시 iOS UNUserNotificationCenter delegate 처리 순서 때문에
  탭 이벤트가 안 잡힐 가능성이 있다. 배너 수신은 되는데 탭 이동만 안 되면,
  `firebase.json`에 `messaging_ios_auto_register_for_remote_messages`/AppDelegate proxy
  설정을 조정해 재검증한다(수신 자체가 1차 목표라 배너까지는 이 설정과 무관하게 동작).
- **네이티브 빌드**: RNFirebase + Expo SDK 54 + New Architecture + `useFrameworks: static`
  조합은 iOS 컴파일이 까다로울 수 있다. `expo-build-properties`의
  `forceStaticLinking: ["RNFBApp","RNFBMessaging"]`로 non-modular header 이슈를 예방했고
  로컬 `expo prebuild`(iOS/Android)는 성공을 확인했으나, **실제 Xcode 컴파일은 EAS 빌드로만
  최종 검증**된다. 빌드 실패 시 로그의 non-modular header/framework 에러를 우선 확인.
- **dev-client 로컬 푸시 테스트**가 필요하면 `app.json`의
  `ios.entitlements.aps-environment`를 임시로 `"development"`로 바꿔야 한다
  (TestFlight/App Store 빌드는 `"production"`이 맞다).
