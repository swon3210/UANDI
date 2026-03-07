import type { Meta, StoryObj } from '@storybook/react';
import { Loader2, Plus, ArrowRight } from 'lucide-react';
import { Button } from './button';

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'],
      description: '버튼 변형',
    },
    size: {
      control: 'select',
      options: ['default', 'sm', 'lg', 'icon'],
      description: '버튼 사이즈',
    },
    disabled: {
      control: 'boolean',
      description: '비활성 상태',
    },
    asChild: {
      control: 'boolean',
      description: 'Radix Slot으로 자식 요소에 버튼 스타일 위임',
    },
  },
  parameters: {
    docs: {
      description: {
        component:
          '**UANDI 버튼 컴포넌트.** shadcn/ui 기반 버튼으로, 6가지 변형(variant)과 4가지 사이즈를 지원합니다.\n\n' +
          '기본 버튼은 코랄(primary) 색상이며, `asChild` prop으로 다른 요소를 버튼처럼 렌더링할 수 있습니다.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

// ── 기본 ─────────────────────────────────────────────────────────────────────

export const Default: Story = {
  name: '기본',
  args: {
    children: '버튼',
  },
};

// ── 모든 변형 ────────────────────────────────────────────────────────────────

export const AllVariants: Story = {
  name: '모든 변형',
  render: () => (
    <div
      style={{
        padding: '40px 48px',
        backgroundColor: '#FAFAF8',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
      }}
    >
      {(
        [
          { variant: 'default', label: 'Default (Primary)' },
          { variant: 'destructive', label: 'Destructive' },
          { variant: 'outline', label: 'Outline' },
          { variant: 'secondary', label: 'Secondary' },
          { variant: 'ghost', label: 'Ghost' },
          { variant: 'link', label: 'Link' },
        ] as const
      ).map(({ variant, label }) => (
        <div key={variant} style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ width: '120px' }}>
            <Button variant={variant}>버튼</Button>
          </div>
          <span style={{ fontSize: '12px', color: '#706C67' }}>{label}</span>
        </div>
      ))}
    </div>
  ),
};

// ── 모든 사이즈 ──────────────────────────────────────────────────────────────

export const AllSizes: Story = {
  name: '모든 사이즈',
  render: () => (
    <div
      style={{
        padding: '40px 48px',
        backgroundColor: '#FAFAF8',
        display: 'flex',
        alignItems: 'flex-end',
        gap: '16px',
      }}
    >
      {(
        [
          { size: 'sm', label: 'SM (h-9)' },
          { size: 'default', label: 'Default (h-10)' },
          { size: 'lg', label: 'LG (h-11)' },
        ] as const
      ).map(({ size, label }) => (
        <div
          key={size}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}
        >
          <Button size={size}>버튼</Button>
          <span style={{ fontSize: '10px', color: '#908B85' }}>{label}</span>
        </div>
      ))}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
        <Button size="icon">
          <Plus />
        </Button>
        <span style={{ fontSize: '10px', color: '#908B85' }}>Icon (h-10 w-10)</span>
      </div>
    </div>
  ),
};

// ── 아이콘 포함 ──────────────────────────────────────────────────────────────

export const WithIcon: Story = {
  name: '아이콘 포함',
  render: () => (
    <div
      style={{
        padding: '40px 48px',
        backgroundColor: '#FAFAF8',
        display: 'flex',
        gap: '16px',
      }}
    >
      <Button>
        <Plus />
        추가하기
      </Button>
      <Button variant="outline">
        다음
        <ArrowRight />
      </Button>
    </div>
  ),
};

// ── 로딩 상태 ────────────────────────────────────────────────────────────────

export const Loading: Story = {
  name: '로딩 상태',
  render: () => (
    <div
      style={{
        padding: '40px 48px',
        backgroundColor: '#FAFAF8',
        display: 'flex',
        gap: '16px',
      }}
    >
      <Button disabled>
        <Loader2 className="animate-spin" />
        처리 중...
      </Button>
      <Button variant="outline" disabled>
        <Loader2 className="animate-spin" />
        로딩 중...
      </Button>
    </div>
  ),
};

// ── 비활성 상태 ──────────────────────────────────────────────────────────────

export const Disabled: Story = {
  name: '비활성 상태',
  args: {
    children: '비활성 버튼',
    disabled: true,
  },
};

// ── 전체 너비 ────────────────────────────────────────────────────────────────

export const FullWidth: Story = {
  name: '전체 너비',
  decorators: [
    (Story) => (
      <div style={{ padding: '40px 48px', backgroundColor: '#FAFAF8', maxWidth: '390px' }}>
        <Story />
      </div>
    ),
  ],
  args: {
    children: '전체 너비 버튼',
    className: 'w-full',
  },
};
