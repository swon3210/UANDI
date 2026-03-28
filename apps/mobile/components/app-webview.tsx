import { useRef, useCallback } from 'react';
import { StyleSheet, BackHandler, Platform, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { WebView, type WebViewNavigation } from 'react-native-webview';

const UANDI_HOST = 'uandi-web.vercel.app';

type AppWebViewProps = {
  path: string;
};

export function AppWebView({ path }: AppWebViewProps) {
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
