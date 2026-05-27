import { useRef, useCallback, useMemo, useEffect } from 'react';
import { StyleSheet, BackHandler, Platform, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { WebView, type WebViewNavigation } from 'react-native-webview';
import type { FcmTokenInfo } from '@/lib/fcm';

const UANDI_HOST = 'uandi-web.vercel.app';

type AppWebViewProps = {
  path: string;
  tokenInfo?: FcmTokenInfo | null;
  pendingDeeplink?: string | null;
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
  const insets = useSafeAreaInsets();

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

  // 알림 탭으로 들어온 deeplink를 WebView에 반영.
  useEffect(() => {
    if (!pendingDeeplink) return;
    if (!webViewRef.current) return;
    const url = `https://${UANDI_HOST}${pendingDeeplink}`;
    webViewRef.current.injectJavaScript(
      `window.location.href = ${JSON.stringify(url)}; true;`
    );
    onDeeplinkConsumed?.();
  }, [pendingDeeplink, onDeeplinkConsumed]);

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <WebView
        ref={webViewRef}
        style={styles.webview}
        source={{ uri: `https://${UANDI_HOST}${path}` }}
        onNavigationStateChange={handleNavigationStateChange}
        originWhitelist={['*']}
        userAgent="Mozilla/5.0 (Linux; Android 13; wv) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
        javaScriptEnabled
        domStorageEnabled
        thirdPartyCookiesEnabled
        startInLoadingState
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
