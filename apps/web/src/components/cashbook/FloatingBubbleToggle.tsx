'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { Switch } from '@uandi/ui';

/**
 * 안드로이드 플로팅 버블 on/off 토글. 모바일 네이티브(WebView) 안에서만 보인다.
 * 상태의 단일 소스는 네이티브(SharedPreferences)이며, window.__UANDI_NATIVE__.bubbleEnabled로 주입된다.
 * 토글 시 ReactNativeWebView.postMessage로 네이티브에 알리고, 네이티브가 재주입하면 'uandi:native-ready'로 동기화한다.
 * (예: 버블을 휴지통으로 끄면 여기 토글도 자동으로 꺼진 상태가 된다.)
 */
export function FloatingBubbleToggle() {
  const t = useTranslations('cashbook.notifications.bubble');
  const [isAndroidNative, setIsAndroidNative] = useState(false);
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    const read = () => {
      const bridge = window.__UANDI_NATIVE__;
      setIsAndroidNative(bridge?.platform === 'android');
      if (typeof bridge?.bubbleEnabled === 'boolean') setEnabled(bridge.bubbleEnabled);
    };
    read();
    window.addEventListener('uandi:native-ready', read);
    return () => window.removeEventListener('uandi:native-ready', read);
  }, []);

  if (!isAndroidNative) return null;

  const handleChange = (value: boolean) => {
    setEnabled(value);
    window.ReactNativeWebView?.postMessage(JSON.stringify({ type: 'bubble-set-enabled', value }));
  };

  return (
    <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
      <div className="pr-4">
        <p className="text-sm font-medium">{t('title')}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{t('description')}</p>
      </div>
      <Switch checked={enabled} onCheckedChange={handleChange} aria-label={t('aria')} />
    </div>
  );
}
