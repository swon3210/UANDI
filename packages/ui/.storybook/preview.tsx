import type { Preview } from '@storybook/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NextIntlClientProvider } from 'next-intl';
import '../src/globals.css';

// 메시지는 web 앱의 messages/ 를 그대로 쓴다(apps/web/src/i18n/messages.ts 의 네임스페이스와 동일하게 유지).
import koCommon from '../../../apps/web/messages/ko/common.json';
import koMetadata from '../../../apps/web/messages/ko/metadata.json';
import koSettings from '../../../apps/web/messages/ko/settings.json';
import enCommon from '../../../apps/web/messages/en/common.json';
import enMetadata from '../../../apps/web/messages/en/metadata.json';
import enSettings from '../../../apps/web/messages/en/settings.json';

const MESSAGES = {
  ko: { common: koCommon, metadata: koMetadata, settings: koSettings },
  en: { common: enCommon, metadata: enMetadata, settings: enSettings },
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
