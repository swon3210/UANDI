import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { FolderToolbar, type SortOption } from './FolderToolbar';

const meta: Meta<typeof FolderToolbar> = {
  title: 'Photos/FolderToolbar',
  component: FolderToolbar,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '폴더 탭 상단 툴바. 폴더 제목 검색 입력, 정렬(최신순/오래된순/글자순) Select, 새 폴더 버튼을 담는다. 모든 상태는 controlled 방식으로 부모에서 전달.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: '480px', margin: '0 auto' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof FolderToolbar>;

function InteractiveTemplate(args: {
  initialSearch?: string;
  initialSort?: SortOption;
}) {
  const [searchQuery, setSearchQuery] = useState(args.initialSearch ?? '');
  const [sortBy, setSortBy] = useState<SortOption>(args.initialSort ?? 'name');
  return (
    <FolderToolbar
      searchQuery={searchQuery}
      onSearchQueryChange={setSearchQuery}
      sortBy={sortBy}
      onSortByChange={setSortBy}
      onCreateFolder={() => alert('새 폴더 만들기')}
    />
  );
}

export const Default: Story = {
  name: '기본 (글자순, 검색어 없음)',
  render: () => <InteractiveTemplate />,
};

export const WithSearchQuery: Story = {
  name: '검색어 입력 상태',
  render: () => <InteractiveTemplate initialSearch="제주" />,
};

export const SortByLatest: Story = {
  name: '최신순 정렬 선택',
  render: () => <InteractiveTemplate initialSort="latest" />,
};
