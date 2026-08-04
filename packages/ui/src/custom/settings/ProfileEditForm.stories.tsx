import type { Meta, StoryObj } from '@storybook/react';
import { ProfileEditForm } from './ProfileEditForm';

const meta: Meta<typeof ProfileEditForm> = {
  title: 'Settings/프로필/이름 편집 폼',
  component: ProfileEditForm,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          '프로필 이름(displayName) 편집 폼. React Hook Form + Zod. 값이 바뀌기 전까지(=dirty ' +
          '아님) 저장 버튼은 비활성화된다. 저장은 onSubmit으로 위임하는 프레젠테이션 컴포넌트.',
      },
    },
  },
  args: {
    onSubmit: (values) => console.log('submit', values),
  },
  decorators: [
    (Story) => (
      <div className="w-[360px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ProfileEditForm>;

export const Default: Story = {
  name: '기본',
  args: { initialDisplayName: '김민지' },
};

export const EmptyName: Story = {
  name: '빈 이름 (검증 에러 유도)',
  args: { initialDisplayName: '' },
};

export const LongName: Story = {
  name: '긴 이름',
  args: { initialDisplayName: '아주아주아주기이이인이름을가진사람' },
};

export const Submitting: Story = {
  name: '저장 중',
  args: { initialDisplayName: '김민지', isSubmitting: true },
};
