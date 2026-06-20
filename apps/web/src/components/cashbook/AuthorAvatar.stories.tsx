import type { Meta, StoryObj } from '@storybook/react';
import { AuthorAvatar } from './AuthorAvatar';

const meta: Meta<typeof AuthorAvatar> = {
  title: 'Cashbook/AuthorAvatar',
  component: AuthorAvatar,
  decorators: [
    (Story) => (
      <div className="p-4">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof AuthorAvatar>;

export const WithPhoto: Story = {
  args: {
    author: {
      displayName: '지수',
      photoURL: 'https://i.pravatar.cc/100?img=5',
    },
  },
};

export const InitialFallback: Story = {
  args: {
    author: {
      displayName: '현우',
      photoURL: null,
    },
  },
};

export const EnglishName: Story = {
  args: {
    author: {
      displayName: 'jisoo',
      photoURL: null,
    },
  },
};

export const EmptyName: Story = {
  args: {
    author: {
      displayName: '',
      photoURL: null,
    },
  },
};

export const Larger: Story = {
  args: {
    author: {
      displayName: '지수',
      photoURL: null,
    },
    className: 'h-8 w-8 text-sm',
  },
};

/** author가 없으면 아무것도 렌더하지 않는다 (빈 화면). */
export const NoAuthor: Story = {
  args: {
    author: undefined,
  },
};
