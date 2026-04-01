import type { Meta, StoryObj } from '@storybook/react';
import { AiTagSuggestions } from './AiTagSuggestions';

const mockSuggestFn = async () => {
  await new Promise((r) => setTimeout(r, 600));
  return { suggestedTags: ['카페', '디저트', '데이트', '라떼', '브런치'] };
};

const mockSuggestFnError = async () => {
  await new Promise((r) => setTimeout(r, 300));
  throw new Error('태그 제안에 실패했습니다');
};

const meta: Meta<typeof AiTagSuggestions> = {
  title: 'Photos/AiTagSuggestions',
  component: AiTagSuggestions,
  decorators: [
    (Story) => (
      <div className="max-w-md p-4">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof AiTagSuggestions>;

const mockImageFile = new File(['mock-image-data'], 'test.jpg', { type: 'image/jpeg' });

export const Enabled: Story = {
  args: {
    disabled: false,
    existingTags: ['여행', '맛집'],
    imageFile: mockImageFile,
    suggestFn: mockSuggestFn,
    onTagsSelected: (tags) => console.log('Selected:', tags),
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    existingTags: [],
    imageFile: null,
    suggestFn: mockSuggestFn,
    onTagsSelected: () => {},
  },
};

export const Error: Story = {
  args: {
    disabled: false,
    existingTags: [],
    imageFile: mockImageFile,
    suggestFn: mockSuggestFnError,
    onTagsSelected: () => {},
  },
};
