import type { Meta, StoryObj } from '@storybook/react-vite';
import { Sheet } from '@uandi/ui';
import { SavingsForm } from './SavingsForm';

const meta: Meta<typeof SavingsForm> = {
  title: 'Outer/SavingsForm',
  component: SavingsForm,
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <Sheet open>
        <Story />
      </Sheet>
    ),
  ],
  args: {
    defaults: { startDate: '2026-10-26', maturityDate: '2027-10-26', depositDay: 26 },
    onSubmit: (input) => alert(JSON.stringify(input, null, 2)),
    onClose: () => {},
  },
};
export default meta;
type Story = StoryObj<typeof SavingsForm>;

/** 신규 등록 — 캡처 자동 입력 버튼 포함 (1.5초 뒤 mock 값으로 채움) */
export const NewWithImport: Story = {
  args: {
    onImportScreenshot: () =>
      new Promise((resolve) =>
        setTimeout(
          () =>
            resolve({
              name: '우리 첫거래 적금',
              bank: '우리은행',
              interestRate: 4.5,
              depositAmount: 300000,
              depositDay: 10,
            }),
          1500
        )
      ),
  },
};

/** 캡처에서 상품 정보를 못 찾은 경우 */
export const ImportNotFound: Story = {
  args: { onImportScreenshot: () => Promise.resolve(null) },
};

/** 수정 모드 — 삭제 버튼 노출, 캡처 버튼 없음 */
export const Edit: Story = {
  args: {
    initial: {
      name: '쏠편한 정기예금',
      bank: '신한은행',
      productType: 'deposit',
      interestRate: 3.2,
      interestMethod: 'simple',
      startDate: '2026-04-01',
      maturityDate: '2027-04-01',
      depositAmount: 10000000,
      depositCycle: 'monthly',
      depositDay: 1,
      taxType: 'normal',
    },
    onDelete: () => alert('삭제'),
  },
};
