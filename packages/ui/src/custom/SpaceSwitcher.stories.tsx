import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { SpaceSwitcher, type Space } from './SpaceSwitcher';
import { Header } from './Header';

const meta: Meta<typeof SpaceSwitcher> = {
  title: 'Custom/SpaceSwitcher',
  component: SpaceSwitcher,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'AppShell 상단에서 우리집(`/inner`) ↔ 재테크(`/outer`) 두 공간을 전환합니다. 현재 공간은 라벨 + 아이콘으로 표시되고, 클릭하면 두 공간을 보여주는 드롭다운이 열립니다. 재테크 공간에서는 상위 root에 `data-space="outer"`가 적용되어 primary 색이 indigo로 자동 전환됩니다.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof SpaceSwitcher>;

export const InnerActive: Story = {
  name: '우리집 활성',
  args: {
    currentSpace: 'inner',
    onSpaceChange: () => {},
  },
};

export const OuterActive: Story = {
  name: '재테크 활성 (indigo 톤)',
  decorators: [
    (Story) => (
      <div data-space="outer" className="p-8">
        <Story />
      </div>
    ),
  ],
  args: {
    currentSpace: 'outer',
    onSpaceChange: () => {},
  },
};

export const Interactive: Story = {
  name: '인터랙티브 (공간 전환)',
  parameters: {
    layout: 'fullscreen',
  },
  render: () => {
    function InteractiveExample() {
      const [space, setSpace] = useState<Space>('inner');
      return (
        <div data-space={space} className="min-h-[200px] bg-background">
          <Header
            title={space === 'inner' ? '우리집' : '재테크'}
            leftSlot={<SpaceSwitcher currentSpace={space} onSpaceChange={setSpace} />}
          />
          <div className="p-6 text-sm text-muted-foreground">
            현재 공간:{' '}
            <span className="font-semibold text-primary">
              {space === 'inner' ? '우리집' : '재테크'}
            </span>
            <p className="mt-2">
              상단의 공간 라벨을 클릭해 전환해보세요. Primary 색이 자동으로 바뀝니다.
            </p>
          </div>
        </div>
      );
    }
    return <InteractiveExample />;
  },
};

export const InHeader: Story = {
  name: '헤더 좌측에 배치',
  parameters: {
    layout: 'fullscreen',
  },
  render: () => (
    <Header
      title="가계부"
      leftSlot={<SpaceSwitcher currentSpace="inner" onSpaceChange={() => {}} />}
    />
  ),
};
