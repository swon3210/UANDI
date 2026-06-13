import { useRef, useCallback, useMemo, useEffect } from 'react';
import { StyleSheet, BackHandler, Platform, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import * as SplashScreen from 'expo-splash-screen';
import { WebView, type WebViewNavigation } from 'react-native-webview';
import type { FcmTokenInfo } from '@/lib/fcm';

const UANDI_HOST = 'uandi-web.vercel.app';
// 딥링크 진입 시 항상 대시보드를 거쳐 목적지로 이동한다(synthetic back stack).
const DASHBOARD_PATH = '/inner';

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

  // 페이지 로드 직전에 window.__UANDI_NATIVE__를 주입 — full reload 시에도 매번 실행된다.
  const injectedJavaScriptBeforeContentLoaded = useMemo(() => {
    if (!tokenInfo) {
      return 'window.__UANDI_NATIVE__ = window.__UANDI_NATIVE__ || {}; true;';
    }
    return `window.__UANDI_NATIVE__ = ${buildBridgePayload(tokenInfo)}; true;`;
  }, [tokenInfo]);

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

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <WebView
        ref={webViewRef}
        style={styles.webview}
        source={{ uri: `https://${UANDI_HOST}${path}` }}
        onNavigationStateChange={handleNavigationStateChange}
        onLoadEnd={handleLoadEnd}
        onError={hideSplashOnce}
        onHttpError={hideSplashOnce}
        originWhitelist={['*']}
        userAgent="Mozilla/5.0 (Linux; Android 13; wv) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
        javaScriptEnabled
        domStorageEnabled
        thirdPartyCookiesEnabled
        allowsBackForwardNavigationGestures
        sharedCookiesEnabled
        injectedJavaScriptBeforeContentLoaded={injectedJavaScriptBeforeContentLoaded}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: Constants.statusBarHeight,
  },
  webview: {
    flex: 1,
  },
});
