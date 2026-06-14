import path from 'path';
import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: [
    '../src/**/*.stories.@(ts|tsx)',
    '../../../apps/web/src/**/*.stories.@(ts|tsx)',
  ],
  addons: ['@storybook/addon-essentials', '@storybook/addon-interactions', '@storybook/addon-a11y'],
  // apps/web/public 을 정적 루트로 서빙 — 투어 스크린샷(/tour/*.webp) 등 web 앱 자산을
  // 사용하는 스토리가 Storybook 에서도 동일 경로로 로드되게 한다.
  staticDirs: ['../../../apps/web/public'],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  docs: {
    autodocs: 'tag',
  },
  viteFinal(config) {
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...config.resolve.alias,
      'next/link': path.resolve(__dirname, '__mocks__/next-link.tsx'),
      'next/image': path.resolve(__dirname, '__mocks__/next-image.tsx'),
      'firebase/firestore': path.resolve(__dirname, '__mocks__/firebase-firestore.ts'),
      'dayjs/plugin/isoWeek': path.resolve(__dirname, '__mocks__/dayjs-plugin-stub.ts'),
      'dayjs/plugin/relativeTime': path.resolve(__dirname, '__mocks__/dayjs-plugin-stub.ts'),
      'dayjs/locale/ko': path.resolve(__dirname, '__mocks__/dayjs-plugin-stub.ts'),
      'dayjs': path.resolve(__dirname, '__mocks__/dayjs.ts'),
      '@': path.resolve(__dirname, '../../../apps/web/src'),
    };
    // Next.js uses process.env for env vars — polyfill for Vite/Storybook
    config.define = {
      ...config.define,
      'process.env': JSON.stringify({}),
    };
    return config;
  },
};

export default config;
