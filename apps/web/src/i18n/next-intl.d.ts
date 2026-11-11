import type { Locale } from '@/lib/locale';
import type common from '../../messages/ko/common.json';
import type metadata from '../../messages/ko/metadata.json';
import type settings from '../../messages/ko/settings.json';
import type shell from '../../messages/ko/shell.json';
import type landing from '../../messages/ko/landing.json';
import type onboarding from '../../messages/ko/onboarding.json';
import type tour from '../../messages/ko/tour.json';
import type pwa from '../../messages/ko/pwa.json';
import type ui from '../../messages/ko/ui.json';
import type dashboard from '../../messages/ko/dashboard.json';

/**
 * next-intl 타입 보강 — `useLocale()`/`getLocale()` 이 Locale 유니온을 돌려주고,
 * `useTranslations('settings')` 의 키가 ko 메시지 파일 기준으로 타입 검사된다.
 * 네임스페이스를 추가하면 messages.ts 의 MESSAGE_NAMESPACES 와 여기 Messages 를 함께 갱신한다.
 */
declare module 'next-intl' {
  interface AppConfig {
    Locale: Locale;
    Messages: {
      common: typeof common;
      metadata: typeof metadata;
      settings: typeof settings;
      shell: typeof shell;
      landing: typeof landing;
      onboarding: typeof onboarding;
      tour: typeof tour;
      pwa: typeof pwa;
      ui: typeof ui;
      dashboard: typeof dashboard;
    };
  }
}
