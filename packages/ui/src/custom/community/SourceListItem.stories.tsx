import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { SourceListItem, type SourceListItemSource } from './SourceListItem';

const meta: Meta<typeof SourceListItem> = {
  title: 'Community/SourceListItem',
  component: SourceListItem,
  parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj<typeof SourceListItem>;

const base: SourceListItemSource = {
  id: 's1',
  siteName: '결혼 매거진',
  feedUrl: 'https://example.com/wedding/rss',
  enabled: true,
  lastCrawledAt: '2026-06-02T09:30:00.000Z',
  lastError: null,
};

function Wrapper({ initial }: { initial: SourceListItemSource }) {
  const [source, setSource] = useState(initial);
  return (
    <div className="mx-auto max-w-md">
      <SourceListItem
        source={source}
        onToggle={(enabled) => setSource((s) => ({ ...s, enabled }))}
        onEdit={() => {}}
        onDelete={() => {}}
      />
    </div>
  );
}

export const Enabled: Story = {
  render: () => <Wrapper initial={base} />,
};

export const Disabled: Story = {
  render: () => <Wrapper initial={{ ...base, enabled: false }} />,
};

export const NeverCrawled: Story = {
  render: () => <Wrapper initial={{ ...base, lastCrawledAt: null }} />,
};

export const WithError: Story = {
  render: () => (
    <Wrapper
      initial={{
        ...base,
        lastError: 'Status code 404: 피드를 찾을 수 없습니다',
      }}
    />
  ),
};

export const LongValues: Story = {
  render: () => (
    <Wrapper
      initial={{
        ...base,
        siteName: '아주 긴 출처명이 들어가면 어떻게 잘리는지 확인하는 케이스입니다',
        feedUrl:
          'https://very-long-domain-example.com/some/deeply/nested/path/to/the/feed/endpoint.xml?category=wedding',
      }}
    />
  ),
};
