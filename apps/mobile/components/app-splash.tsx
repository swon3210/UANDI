import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import * as SplashScreen from 'expo-splash-screen';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

// 디자인 핸드오프의 풀스크린 스플래시. 네이티브 스플래시(안드로이드 12+는 작은 중앙
// 아이콘으로만 표시됨)를 대신해 화면 전체를 채운다.
const SPLASH_IMAGE = require('@/assets/images/splash.png');

type AppSplashProps = {
  /** 앱 콘텐츠(WebView) 로드가 끝나면 true로 바뀐다. */
  appReady: boolean;
  /** 페이드아웃이 끝나 오버레이를 제거해도 될 때 호출된다. */
  onFadeComplete: () => void;
};

export function AppSplash({ appReady, onFadeComplete }: AppSplashProps) {
  const opacity = useSharedValue(1);

  // 외부 시스템(네이티브 스플래시) 동기화: 전체화면 이미지가 그려진 뒤 네이티브
  // 스플래시를 내려, 작은 아이콘 → 풀스크린 전환이 같은 배경색 위에서 매끄럽게 이어진다.
  const handleImageLoad = () => {
    SplashScreen.hideAsync().catch(() => {});
  };

  // 외부 시스템(reanimated 애니메이션) 동기화: appReady가 되면 페이드아웃 후 언마운트.
  useEffect(() => {
    if (!appReady) return;
    opacity.value = withTiming(0, { duration: 300 }, (finished) => {
      if (finished) runOnJS(onFadeComplete)();
    });
  }, [appReady, opacity, onFadeComplete]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, styles.container, animatedStyle]}
    >
      <Image
        source={SPLASH_IMAGE}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        onLoad={handleImageLoad}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FAFAF8',
    zIndex: 999,
  },
});
