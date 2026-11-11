import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import type { Locale } from '@/lib/locale';
import { LanguageSettingRow } from './LanguageSettingRow';

const meta: Meta<typeof LanguageSettingRow> = {
  title: 'Settings/LanguageSettingRow',
  component: LanguageSettingRow,
  parameters: {
    layout: 'padded',
  },
  decorators: [
    (Story) => (
      <div className="mx-auto max-w-md">
        <Story />
      </div>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof LanguageSettingRow>;

/** 툴바의 Locale(🌐) 을 바꾸면 행 라벨이 ko/en 으로 바뀐다. 셀렉트 값은 로컬 상태로 유지. */
function Interactive({ initial }: { initial: Locale }) {
  const [value, setValue] = useState<Locale>(initial);
  return <LanguageSettingRow value={value} onChange={setValue} />;
}

export const Korean: Story = {
  render: () => <Interactive initial="ko" />,
};

export const English: Story = {
  render: () => <Interactive initial="en" />,
  globals: { locale: 'en' },
};

export const Disabled: Story = {
  args: {
    value: 'ko',
    onChange: () => {},
    disabled: true,
  },
};
