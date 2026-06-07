import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useCallback, useEffect, useState } from 'react';
import 'react-native-reanimated';

import { AppSplash } from '@/components/app-splash';
import { SplashReadyContext } from '@/components/splash-ready-context';
import { useColorScheme } from '@/hooks/use-color-scheme';

// 네이티브 스플래시 자동 숨김을 막고, 앱 내부에서 전체화면 스플래시를 직접 제어한다.
SplashScreen.preventAutoHideAsync().catch(() => {});

// WebView 로드가 지연/실패해도 스플래시가 영원히 남지 않도록 하는 안전장치(ms).
const SPLASH_FALLBACK_MS = 6000;

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [appReady, setAppReady] = useState(false);
  const [splashVisible, setSplashVisible] = useState(true);

  const handleAppReady = useCallback(() => setAppReady(true), []);

  // 안전장치: 일정 시간이 지나면 강제로 스플래시를 내린다.
  useEffect(() => {
    const timer = setTimeout(() => setAppReady(true), SPLASH_FALLBACK_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <SplashReadyContext.Provider value={handleAppReady}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        </Stack>
      </SplashReadyContext.Provider>
      {splashVisible && (
        <AppSplash appReady={appReady} onFadeComplete={() => setSplashVisible(false)} />
      )}
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
