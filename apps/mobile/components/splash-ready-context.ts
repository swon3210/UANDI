import { createContext, useContext } from 'react';

/**
 * 첫 화면(WebView) 로드가 끝났음을 루트 레이아웃의 전체화면 스플래시에 알리는 콜백.
 * Provider는 app/_layout.tsx에서 제공한다.
 */
export const SplashReadyContext = createContext<() => void>(() => {});

export const useSplashReady = () => useContext(SplashReadyContext);
