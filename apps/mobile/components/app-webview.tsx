import { useRef, useCallback, useEffect } from 'react';
import { StyleSheet, BackHandler, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Constants from 'expo-constants';
import { WebView, type WebViewNavigation, type WebViewMessageEvent } from 'react-native-webview';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

const UANDI_HOST = 'uandi-web.vercel.app';

const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '';
const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
const GOOGLE_ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;

type AppWebViewProps = {
  path: string;
};

export function AppWebView({ path }: AppWebViewProps) {
  const webViewRef = useRef<WebView>(null);
  const canGoBackRef = useRef(false);

  const [, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: GOOGLE_WEB_CLIENT_ID,
    iosClientId: GOOGLE_IOS_CLIENT_ID,
    androidClientId: GOOGLE_ANDROID_CLIENT_ID,
  });

  // Google OAuth 결과를 WebView에 전달
  useEffect(() => {
    if (!response) return;

    if (response.type === 'success') {
      const idToken = response.params.id_token;
      webViewRef.current?.injectJavaScript(
        `window.__handleNativeGoogleLogin && window.__handleNativeGoogleLogin(${JSON.stringify(idToken)}); true;`,
      );
    } else if (response.type === 'error') {
      const message = response.error?.message ?? 'Unknown error';
      webViewRef.current?.injectJavaScript(
        `window.__handleNativeGoogleLoginError && window.__handleNativeGoogleLoginError(${JSON.stringify(message)}); true;`,
      );
    } else if (response.type === 'dismiss') {
      webViewRef.current?.injectJavaScript(
        `window.__handleNativeGoogleLoginDismiss && window.__handleNativeGoogleLoginDismiss(); true;`,
      );
    }
  }, [response]);

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

  // WebView에서 오는 메시지 처리 (구글 로그인 요청 등)
  const handleMessage = async (event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'GOOGLE_LOGIN') {
        await promptAsync();
      }
    } catch {
      // JSON이 아닌 메시지 무시
    }
  };

  return (
    <WebView
      ref={webViewRef}
      style={styles.container}
      source={{ uri: `https://${UANDI_HOST}${path}` }}
      onNavigationStateChange={handleNavigationStateChange}
      onMessage={handleMessage}
      originWhitelist={['*']}
      userAgent="Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
      javaScriptEnabled
      domStorageEnabled
      thirdPartyCookiesEnabled
      startInLoadingState
      allowsBackForwardNavigationGestures
      sharedCookiesEnabled
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: Constants.statusBarHeight,
  },
});
