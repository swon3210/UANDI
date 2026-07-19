import { useRef, useCallback, useMemo, useEffect } from 'react';
import { StyleSheet, BackHandler, Platform, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { WebView, type WebViewNavigation, type WebViewMessageEvent } from 'react-native-webview';
import type { FcmTokenInfo } from '@/lib/fcm';
import FloatingBubble from '@/modules/floating-bubble';
import { bubblePicker } from '@/lib/bubble-picker';

const UANDI_HOST = 'uandi-web.vercel.app';
// 딥링크 진입 시 항상 대시보드를 거쳐 목적지로 이동한다(synthetic back stack).
const DASHBOARD_PATH = '/inner';

// 앱 기본 배경색(크림). splash backgroundColor / 웹 --background(#FAFAF8)과 동일하다.
// iOS에서 세이프에어리어(상단 상태바 / 하단 홈 인디케이터) 여백이 기본 검정으로
// 비치지 않도록 WebView를 감싸는 루트 View를 이 색으로 채운다.
const APP_BACKGROUND_COLOR = '#FAFAF8';

// 웹의 <input type=file>(이미지 첨부 등)이 활성화되면 네이티브로 알린다.
// 캡처 단계 리스너라 프로그래매틱 .click()까지 잡혀, 첨부 호출부를 수정하지 않고 모든 첨부 지점을 커버한다.
// 네이티브는 이 신호를 받으면 OS 피커가 뜨는 동안 플로팅 버블을 띄우지 않는다.
const FILE_PICKER_HOOK = `
(function(){
  if (window.__uandiFilePickerHook) return;
  window.__uandiFilePickerHook = true;
  document.addEventListener('click', function(e){
    var t = e.target;
    if (t && t.tagName === 'INPUT' && t.type === 'file' && window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'file-picker-open' }));
    }
  }, true);
})();
`;

// 안드로이드에서만 버블 on/off 상태를 읽는다(웹 설정 토글의 초기값/동기화용). 그 외엔 null.
function readBubbleEnabled(): boolean | null {
  if (Platform.OS !== 'android' || !FloatingBubble) return null;
  try {
    return FloatingBubble.isEnabled();
  } catch {
    return null;
  }
}

// path: 이동할 경로(`/community/123`) 또는 전체 웹 URL.
// viaDashboard: true면 대시보드를 거쳐 이동(커스텀 스킴), false면 직행(FCM 알림 탭).
export type PendingDeeplink = {
  path: string;
  viaDashboard: boolean;
};

type AppWebViewProps = {
  path: string;
  tokenInfo?: FcmTokenInfo | null;
  pendingDeeplink?: PendingDeeplink | null;
  onDeeplinkConsumed?: () => void;
};

function buildBridgePayload(tokenInfo: FcmTokenInfo): string {
  return JSON.stringify({
    fcmToken: tokenInfo.token,
    platform: tokenInfo.platform,
    userAgent: tokenInfo.userAgent,
  });
}

export function AppWebView({
  path,
  tokenInfo,
  pendingDeeplink,
  onDeeplinkConsumed,
}: AppWebViewProps) {
  const webViewRef = useRef<WebView>(null);
  const canGoBackRef = useRef(false);
  // 웹이 통지하는 "오버레이(바텀시트/다이얼로그) 열림" 여부.
  // pushState는 onNavigationStateChange를 발생시키지 않아 canGoBack으로는 더미를 알 수 없으므로,
  // 웹의 postMessage 신호로 오버레이 열림을 추적한다.
  const overlayOpenRef = useRef(false);
  // 대시보드 로드가 끝나면 이동할 최종 목적지. 2단계 이동의 두 번째 단계용.
  const pendingTargetRef = useRef<string | null>(null);
  // 최초 웹 로드 시 스플래시를 단 한 번만 내리기 위한 가드.
  const splashHiddenRef = useRef(false);
  const insets = useSafeAreaInsets();

  // 경로(`/community/123`)면 호스트를 붙이고, 전체 웹 URL이면 그대로 이동한다.
  const navigateWebView = useCallback((target: string) => {
    const url = /^https?:\/\//.test(target) ? target : `https://${UANDI_HOST}${target}`;
    webViewRef.current?.injectJavaScript(`window.location.href = ${JSON.stringify(url)}; true;`);
  }, []);

  // Android 뒤로가기 버튼 처리
  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== 'android') return;

      const onBackPress = () => {
        // 오버레이가 떠 있으면 웹에 위임한다: history.back() → popstate → 웹이 최상단 오버레이를 닫는다.
        // (네이티브 goBack()은 canGoBack 기반이라 pushState 더미를 인지하지 못해 우회된다.)
        if (overlayOpenRef.current && webViewRef.current) {
          webViewRef.current.injectJavaScript('window.history.back(); true;');
          return true;
        }
        if (canGoBackRef.current && webViewRef.current) {
          webViewRef.current.goBack();
          return true;
        }
        return false;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, []),
  );

  const handleNavigationStateChange = (navState: WebViewNavigation) => {
    canGoBackRef.current = navState.canGoBack;
  };

  // 버블 enabled 상태를 __UANDI_NATIVE__에 다시 주입하고 ready 이벤트로 웹 설정 UI에 알린다.
  const reinjectBubbleEnabled = useCallback((enabled: boolean) => {
    webViewRef.current?.injectJavaScript(
      `window.__UANDI_NATIVE__ = window.__UANDI_NATIVE__ || {};` +
        `window.__UANDI_NATIVE__.bubbleEnabled = ${enabled};` +
        `window.dispatchEvent(new Event('uandi:native-ready')); true;`
    );
  }, []);

  // 페이지 로드 직전에 window.__UANDI_NATIVE__를 주입 — full reload 시에도 매번 실행된다.
  const injectedJavaScriptBeforeContentLoaded = useMemo(() => {
    const base = tokenInfo
      ? `window.__UANDI_NATIVE__ = ${buildBridgePayload(tokenInfo)};`
      : 'window.__UANDI_NATIVE__ = window.__UANDI_NATIVE__ || {};';
    const enabled = readBubbleEnabled();
    const bubbleLine = enabled === null ? '' : `window.__UANDI_NATIVE__.bubbleEnabled = ${enabled};`;
    return `${base} ${bubbleLine} ${FILE_PICKER_HOOK} true;`;
  }, [tokenInfo]);

  // 웹 → 네이티브 메시지 처리.
  const handleMessage = useCallback(
    (event: WebViewMessageEvent) => {
      let data: { type?: string; open?: boolean; value?: unknown } | null = null;
      try {
        data = JSON.parse(event.nativeEvent.data);
      } catch {
        return;
      }
      if (!data || typeof data !== 'object') return;

      if (data.type === 'overlay-state') {
        // 웹 오버레이(바텀시트/다이얼로그) 열림 상태 — 뒤로가기 닫기 위임에 사용.
        overlayOpenRef.current = !!data.open;
      } else if (data.type === 'file-picker-open') {
        // 인앱 이미지/파일 피커가 뜬다 → 잠깐 백그라운드로 가도 버블을 띄우지 않는다.
        bubblePicker.markOpen();
      } else if (data.type === 'bubble-set-enabled') {
        // 가계부 설정의 플로팅 버블 토글 → 네이티브 on/off + 상태 재주입.
        const value = Boolean(data.value);
        FloatingBubble?.setEnabled(value);
        reinjectBubbleEnabled(value);
      }
    },
    [reinjectBubbleEnabled]
  );

  // 사용자가 휴지통으로 버블을 끄면(네이티브 이벤트) 웹 설정 토글 상태를 동기화한다.
  useEffect(() => {
    if (Platform.OS !== 'android' || !FloatingBubble) return;
    const sub = FloatingBubble.addListener('onDismiss', () => {
      reinjectBubbleEnabled(false);
    });
    return () => sub.remove();
  }, [reinjectBubbleEnabled]);

  // 토큰이 WebView 로드 이후에 도착하면 다시 주입하고 ready 이벤트로 알린다.
  useEffect(() => {
    if (!tokenInfo) return;
    if (!webViewRef.current) return;
    const payload = buildBridgePayload(tokenInfo);
    webViewRef.current.injectJavaScript(
      `window.__UANDI_NATIVE__ = ${payload}; window.dispatchEvent(new Event('uandi:native-ready')); true;`
    );
  }, [tokenInfo]);

  // 딥링크를 WebView에 반영.
  //  - viaDashboard(커스텀 스킴): 대시보드를 먼저 띄운 뒤(handleLoadEnd) 목적지로 이동.
  //  - 직행(FCM 알림 탭): 목적지로 바로 이동.
  useEffect(() => {
    if (!pendingDeeplink) return;
    if (!webViewRef.current) return;

    const { path: target, viaDashboard } = pendingDeeplink;
    if (viaDashboard && target !== DASHBOARD_PATH) {
      pendingTargetRef.current = target;
      navigateWebView(DASHBOARD_PATH);
    } else {
      pendingTargetRef.current = null;
      navigateWebView(target);
    }
    onDeeplinkConsumed?.();
  }, [pendingDeeplink, onDeeplinkConsumed, navigateWebView]);

  // 최초 웹 로드가 끝나면 네이티브 스플래시를 내린다(단 한 번만).
  // 스플래시 → 웹(분홍색) 로더로 바로 전환되어 초록색 로더가 보이지 않는다.
  const hideSplashOnce = useCallback(() => {
    if (splashHiddenRef.current) return;
    splashHiddenRef.current = true;
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  // 대시보드 로드가 끝나면 대기 중인 목적지로 이동(2단계 이동의 두 번째 단계).
  const handleLoadEnd = useCallback(() => {
    hideSplashOnce();

    const target = pendingTargetRef.current;
    if (!target) return;
    pendingTargetRef.current = null;
    navigateWebView(target);
  }, [hideSplashOnce, navigateWebView]);

  // iOS는 하단을 edge-to-edge로 둔다: 네이티브가 하단을 padding하면 그만큼 크림색 死영역(띠)이
  // 생겨 스크롤 콘텐츠를 가린다. iOS에서는 콘텐츠가 물리적 바닥까지 채우고, 홈 인디케이터 회피는
  // 웹이 --safe-bottom(=env(safe-area-inset-bottom), edge-to-edge면 정상값 보고)으로 고정 하단 바에만
  // 적용한다. Android는 기존 모델 유지(네이티브가 하단 인셋 소유 + 웹은 NativeSafeAreaFix로 --safe-bottom=0).
  const bottomPadding = Platform.OS === 'ios' ? 0 : insets.bottom;

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: bottomPadding }]}>
      <WebView
        ref={webViewRef}
        style={styles.webview}
        source={{ uri: `https://${UANDI_HOST}${path}` }}
        onNavigationStateChange={handleNavigationStateChange}
        onMessage={handleMessage}
        onLoadEnd={handleLoadEnd}
        onError={hideSplashOnce}
        onHttpError={hideSplashOnce}
        originWhitelist={['*']}
        // iOS 는 'wv' 없는 실제 Safari UA 를 써야 구글 로그인(disallowed_useragent) 차단을 피한다.
        // 안드로이드는 기존 UA(wv 포함)를 유지해 회귀를 막는다. WebView 감지는 web 쪽에서
        // window.__UANDI_NATIVE__ / ReactNativeWebView 브리지로 하므로 iOS UA 정리와 무관하게 동작한다.
        userAgent={
          Platform.OS === 'android'
            ? 'Mozilla/5.0 (Linux; Android 13; wv) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36'
            : 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
        }
        javaScriptEnabled
        domStorageEnabled
        thirdPartyCookiesEnabled
        allowsBackForwardNavigationGestures
        sharedCookiesEnabled
        allowsInlineMediaPlayback
        mediaCapturePermissionGrantType="grant"
        injectedJavaScriptBeforeContentLoaded={injectedJavaScriptBeforeContentLoaded}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // 세이프에어리어 여백을 크림색으로 채운다. 상/하단 인셋은 padding 으로 넣어야
    // View 자신의 배경으로 채워진다(margin 은 View 밖이라 배경색이 먹지 않아 검정 띠가 남는다).
    backgroundColor: APP_BACKGROUND_COLOR,
  },
  webview: {
    flex: 1,
    backgroundColor: APP_BACKGROUND_COLOR,
  },
});
