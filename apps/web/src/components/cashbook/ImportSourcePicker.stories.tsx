import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { ImportSourcePicker } from './ImportSourcePicker';
import type { ImportSource } from './import-types';

const meta: Meta<typeof ImportSourcePicker> = {
  title: 'Cashbook/Import/ImportSourcePicker',
  component: ImportSourcePicker,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          '지난 내역 가져오기 1단계의 통장/카드 선택. 선택값은 파싱 요청의 imageKind가 되고, 선택별 안내 한 줄이 아래에 붙는다.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="w-[343px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ImportSourcePicker>;

function Controlled({ initial }: { initial: ImportSource }) {
  const [value, setValue] = useState<ImportSource>(initial);
  return <ImportSourcePicker value={value} onChange={setValue} />;
}

export const Card: Story = {
  name: '카드 내역 (기본)',
  render: () => <Controlled initial="card" />,
};
export const Account: Story = { name: '통장 내역', render: () => <Controlled initial="account" /> };
