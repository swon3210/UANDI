import type { Meta, StoryObj } from '@storybook/react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './tabs';

const meta: Meta<typeof Tabs> = {
  title: 'Components/Tabs',
  component: Tabs,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '탭 네비게이션 컴포넌트. 선택된 탭은 하단 보더와 primary 색상으로 강조됩니다.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Tabs>;

export const Default: Story = {
  name: '기본 (3탭)',
  render: () => (
    <Tabs defaultValue="all">
      <TabsList className="w-full rounded-none bg-background h-11">
        <TabsTrigger value="all" className="flex-1">
          전체
        </TabsTrigger>
        <TabsTrigger value="folders" className="flex-1">
          폴더
        </TabsTrigger>
        <TabsTrigger value="tags" className="flex-1">
          태그
        </TabsTrigger>
      </TabsList>
      <TabsContent value="all" className="p-4">
        <p className="text-sm text-muted-foreground">전체 사진 목록이 여기에 표시됩니다.</p>
      </TabsContent>
      <TabsContent value="folders" className="p-4">
        <p className="text-sm text-muted-foreground">폴더 목록이 여기에 표시됩니다.</p>
      </TabsContent>
      <TabsContent value="tags" className="p-4">
        <p className="text-sm text-muted-foreground">태그 목록이 여기에 표시됩니다.</p>
      </TabsContent>
    </Tabs>
  ),
};

export const TwoTabs: Story = {
  name: '2탭',
  render: () => (
    <Tabs defaultValue="income">
      <TabsList className="w-full rounded-none bg-background h-11">
        <TabsTrigger value="income" className="flex-1">
          수입
        </TabsTrigger>
        <TabsTrigger value="expense" className="flex-1">
          지출
        </TabsTrigger>
      </TabsList>
      <TabsContent value="income" className="p-4">
        <p className="text-sm text-muted-foreground">수입 내역</p>
      </TabsContent>
      <TabsContent value="expense" className="p-4">
        <p className="text-sm text-muted-foreground">지출 내역</p>
      </TabsContent>
    </Tabs>
  ),
};

export const Disabled: Story = {
  name: '비활성 탭 포함',
  render: () => (
    <Tabs defaultValue="all">
      <TabsList className="w-full rounded-none bg-background h-11">
        <TabsTrigger value="all" className="flex-1">
          전체
        </TabsTrigger>
        <TabsTrigger value="favorites" className="flex-1" disabled>
          즐겨찾기 (준비 중)
        </TabsTrigger>
      </TabsList>
      <TabsContent value="all" className="p-4">
        <p className="text-sm text-muted-foreground">전체 콘텐츠</p>
      </TabsContent>
    </Tabs>
  ),
};
