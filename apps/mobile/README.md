# @uandi/mobile

UANDI Expo 모바일 앱. `uandi-web.vercel.app`을 WebView로 감싸고, 푸시 알림 같은 네이티브 기능을 부가한다.

## 개발 시작

```bash
pnpm install
pnpm --filter @uandi/mobile start
```

Expo Router 기반 파일 라우팅을 사용한다.

## 푸시 알림 (FCM) 셋업

모바일 native가 FCM 토큰을 발급해 WebView에 주입하면, 웹의 `NativeFcmBridge` 컴포넌트가 인증된 컨텍스트에서 `users/{uid}/fcmTokens/{tokenId}` 경로에 토큰을 저장한다. 이후 기존 Cloud Functions(`functions/src/notifications/budgetAlert.ts`, `sendTestPush.ts`)가 해당 토큰으로 푸시를 발송한다.

### 1. `google-services.json` 받기

1. Firebase Console → 프로젝트 설정 → Android 앱 등록 (패키지명: `com.swon3210.uandi`)
2. `google-services.json` 다운로드
3. 파일을 `apps/mobile/google-services.json`에 배치 (git ignore 처리됨)

### 2. EAS Build용 secret 등록 (CI/원격 빌드용)

```bash
eas secret:create \
  --scope project \
  --name GOOGLE_SERVICES_JSON \
  --type file \
  --value ./google-services.json
```

### 3. 로컬 실기기 빌드

```bash
cd apps/mobile
npx expo prebuild --platform android --clean
npx expo run:android --device
```

> **중요**: Expo Go에서는 `getDevicePushTokenAsync()`가 동작하지 않아 FCM 토큰을 받을 수 없다. **반드시 dev client 또는 EAS 빌드**로 테스트한다. 에뮬레이터는 Google Play Services가 포함된 이미지(API 24+)에서만 작동한다.

### 4. 토큰 발급 및 발송 테스트

1. 앱 첫 실행 시 Android 13+ 알림 권한 다이얼로그가 뜬다 → "허용"
2. 로그인 후 Firestore Console에서 `users/{uid}/fcmTokens` 컬렉션에 새 doc이 생성됐는지 확인 (`platform: 'android'`, `userAgent: 'UANDI-Mobile/Android'`)
3. Firebase Console → Cloud Messaging → "Send test message"에 발급된 토큰을 입력하고 발송 → 알림 도착 확인
4. 알림 탭 → WebView가 `data.click_action` 경로로 이동하는지 확인

## 디렉토리 구조

```
apps/mobile/
├── app/                # Expo Router 라우트
│   ├── _layout.tsx
│   └── (tabs)/
│       └── index.tsx   # 홈: WebView + FCM 등록
├── components/
│   └── app-webview.tsx # WebView 래퍼 + native ↔ web bridge
├── hooks/
│   └── use-fcm-registration.ts
├── lib/
│   └── fcm.ts          # expo-notifications 토큰 발급/리스너
└── app.json
```

## Native ↔ Web 브릿지

Native가 발급한 FCM 토큰은 다음 globals로 WebView에 주입된다:

```ts
window.__UANDI_NATIVE__ = {
  fcmToken: string;
  platform: 'android' | 'ios';
  userAgent: string;
};
```

- 페이지 로드 직전에 `injectedJavaScriptBeforeContentLoaded`로 1차 주입
- 토큰이 늦게 도착하면 `injectJavaScript` + `uandi:native-ready` 이벤트로 보조 주입

웹의 `NativeFcmBridge`(`apps/web/src/components/NativeFcmBridge.tsx`)가 이 객체를 읽어 `upsertFcmToken`을 호출한다.

## 알림 탭 deeplink 처리

`Notifications.addNotificationResponseReceivedListener`로 알림 응답을 받으면 `data.click_action`을 추출해 WebView의 `window.location.href`를 변경한다 (`apps/mobile/components/app-webview.tsx`).
