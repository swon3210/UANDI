import type { Meta, StoryObj } from '@storybook/react';
import { Sheet } from '@uandi/ui';
import { PdfPasswordSheet } from './PdfPasswordSheet';

const meta: Meta<typeof PdfPasswordSheet> = {
  title: 'Cashbook/PdfPasswordSheet',
  component: PdfPasswordSheet,
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <Sheet open>
        <Story />
      </Sheet>
    ),
  ],
  args: {
    fileName: '2026-09 이용내역.pdf',
    onSubmit: (password) => alert(`입력: ${password}`),
    onCancel: () => alert('건너뛰기'),
  },
};

export default meta;
type Story = StoryObj<typeof PdfPasswordSheet>;

/** 첨부 직후 처음 뜨는 상태 */
export const Default: Story = {};

/** 틀린 비밀번호를 넣은 뒤 다시 뜬 상태 */
export const WrongPassword: Story = {
  args: { errorMessage: '비밀번호가 맞지 않아요. 다시 입력해주세요.' },
};

/** 긴 파일명은 설명 줄에서 말줄임된다 */
export const LongFileName: Story = {
  args: { fileName: '2026년_9월_신용카드_이용내역서_최종본_다운로드_버전.pdf' },
};

/** 열기 처리 중 (버튼 비활성) */
export const Submitting: Story = {
  args: { isSubmitting: true },
};
