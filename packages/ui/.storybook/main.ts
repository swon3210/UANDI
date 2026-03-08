import path from 'path';
import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: [
    '../src/**/*.stories.@(ts|tsx)',
    '../../../apps/web/src/**/*.stories.@(ts|tsx)',
  ],
  addons: ['@storybook/addon-essentials', '@storybook/addon-interactions', '@storybook/addon-a11y'],
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
      '@': path.resolve(__dirname, '../../../apps/web/src'),
    };
    return config;
  },
};

export default config;
