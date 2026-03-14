import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { TagInput } from './TagInput';

const meta: Meta<typeof TagInput> = {
  title: 'Photos/TagInput',
  component: TagInput,
  decorators: [
    (Story) => (
      <div className="max-w-sm p-4">
        <Story />
      </div>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof TagInput>;

function TagInputWithState({
  initialTags = [],
  suggestions = [],
}: {
  initialTags?: string[];
  suggestions?: string[];
}) {
  const [tags, setTags] = useState(initialTags);
  return <TagInput value={tags} onChange={setTags} suggestions={suggestions} />;
}

export const Empty: Story = {
  render: () => <TagInputWithState />,
};

export const WithTags: Story = {
  render: () => <TagInputWithState initialTags={['벚꽃', '바다', '카페']} />,
};

export const WithSuggestions: Story = {
  render: () => (
    <TagInputWithState
      initialTags={['벚꽃']}
      suggestions={['벚꽃', '바다', '카페', '여행', '맛집', '산책']}
    />
  ),
};

export const ManyTags: Story = {
  render: () => (
    <TagInputWithState
      initialTags={[
        '벚꽃',
        '바다',
        '카페',
        '여행',
        '맛집',
        '산책',
        '일상',
        '데이트',
      ]}
    />
  ),
};
