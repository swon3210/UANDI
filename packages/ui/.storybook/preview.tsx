import type { Preview } from '@storybook/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NextIntlClientProvider } from 'next-intl';
import '../src/globals.css';

// 메시지는 web 앱의 messages/ 를 그대로 쓴다(apps/web/src/i18n/messages.ts 의 네임스페이스와 동일하게 유지).
import koCommon from '../../../apps/web/messages/ko/common.json';
import koMetadata from '../../../apps/web/messages/ko/metadata.json';
import koSettings from '../../../apps/web/messages/ko/settings.json';
import koShell from '../../../apps/web/messages/ko/shell.json';
import koLanding from '../../../apps/web/messages/ko/landing.json';
import koOnboarding from '../../../apps/web/messages/ko/onboarding.json';
import koTour from '../../../apps/web/messages/ko/tour.json';
import koPwa from '../../../apps/web/messages/ko/pwa.json';
import koUi from '../../../apps/web/messages/ko/ui.json';
import koDashboard from '../../../apps/web/messages/ko/dashboard.json';
import koCashbook from '../../../apps/web/messages/ko/cashbook.json';
import enCommon from '../../../apps/web/messages/en/common.json';
import enMetadata from '../../../apps/web/messages/en/metadata.json';
import enSettings from '../../../apps/web/messages/en/settings.json';
import enShell from '../../../apps/web/messages/en/shell.json';
import enLanding from '../../../apps/web/messages/en/landing.json';
import enOnboarding from '../../../apps/web/messages/en/onboarding.json';
import enTour from '../../../apps/web/messages/en/tour.json';
import enPwa from '../../../apps/web/messages/en/pwa.json';
import enUi from '../../../apps/web/messages/en/ui.json';
import enDashboard from '../../../apps/web/messages/en/dashboard.json';
import enCashbook from '../../../apps/web/messages/en/cashbook.json';

const MESSAGES = {
  ko: {
    common: koCommon,
    metadata: koMetadata,
    settings: koSettings,
    shell: koShell,
    landing: koLanding,
    onboarding: koOnboarding,
    tour: koTour,
    pwa: koPwa,
    ui: koUi,
    dashboard: koDashboard,
    cashbook: koCashbook,
  },
  en: {
    common: enCommon,
    metadata: enMetadata,
    settings: enSettings,
    shell: enShell,
    landing: enLanding,
    onboarding: enOnboarding,
    tour: enTour,
    pwa: enPwa,
    ui: enUi,
    dashboard: enDashboard,
    cashbook: enCashbook,
  },
} as const;

type StorybookLocale = keyof typeof MESSAGES;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false, refetchOnWindowFocus: false },
    mutations: { retry: false },
  },
});

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
  globalTypes: {
    locale: {
      description: '표시 언어 (next-intl)',
      toolbar: {
        title: 'Locale',
        icon: 'globe',
        items: [
          { value: 'ko', title: '한국어' },
          { value: 'en', title: 'English' },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    locale: 'ko',
  },
  decorators: [
    (Story, context) => {
      const locale = (context.globals.locale as StorybookLocale) ?? 'ko';
      return (
        <NextIntlClientProvider locale={locale} messages={MESSAGES[locale]}>
          <QueryClientProvider client={queryClient}>
            <Story />
          </QueryClientProvider>
        </NextIntlClientProvider>
      );
    },
  ],
};

export default preview;
