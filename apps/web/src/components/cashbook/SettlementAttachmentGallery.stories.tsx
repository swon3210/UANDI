import type { Meta, StoryObj } from '@storybook/react';
import { Timestamp } from 'firebase/firestore';
import { SettlementAttachmentGallery } from './SettlementAttachmentGallery';
import type { SettlementAttachment, SettlementImageKind } from '@/types';

const swatch = (color: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><rect width='120' height='120' fill='${color}'/></svg>`
  )}`;

const att = (
  id: string,
  color: string,
  name: string,
  kind?: SettlementImageKind
): SettlementAttachment => ({
  id,
  storagePath: `couples/c1/cashbookSettlements/2026-06/${id}.png`,
  url: swatch(color),
  name,
  kind,
  createdAt: Timestamp.fromDate(new Date('2026-06-15')),
});

const meta: Meta<typeof SettlementAttachmentGallery> = {
  title: 'Cashbook/SettlementAttachmentGallery',
  component: SettlementAttachmentGallery,
  parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj<typeof SettlementAttachmentGallery>;

export const WithAttachments: Story = {
  render: () => (
    <div className="mx-auto max-w-md">
      <SettlementAttachmentGallery
        attachments={[
          att('a1', '#e8837a', '통장내역1.png', 'account'),
          att('a2', '#4caf86', '카드내역1.png', 'card'),
          att('a3', '#6366f1', '통장내역2.png', 'account'),
          att('a4', '#f59e0b', '카드내역2.png', 'card'),
        ]}
        onRemove={() => {}}
      />
    </div>
  ),
};

// 계좌 첨부만 있는 경우 (카드 섹션은 표시되지 않음)
export const AccountOnly: Story = {
  render: () => (
    <div className="mx-auto max-w-md">
      <SettlementAttachmentGallery
        attachments={[
          att('a1', '#e8837a', '통장내역1.png', 'account'),
          att('a2', '#6366f1', '통장내역2.png', 'account'),
        ]}
        onRemove={() => {}}
      />
    </div>
  ),
};

// 구버전 데이터 (kind 없음 → 계좌로 취급)
export const LegacyNoKind: Story = {
  render: () => (
    <div className="mx-auto max-w-md">
      <SettlementAttachmentGallery
        attachments={[att('a1', '#e8837a', '영수증1.png'), att('a2', '#4caf86', '스크린샷.png')]}
        onRemove={() => {}}
      />
    </div>
  ),
};

export const Empty: Story = {
  render: () => (
    <div className="mx-auto max-w-md">
      <SettlementAttachmentGallery attachments={[]} onRemove={() => {}} />
    </div>
  ),
};

export const Removing: Story = {
  render: () => (
    <div className="mx-auto max-w-md">
      <SettlementAttachmentGallery
        attachments={[
          att('a1', '#e8837a', '통장내역.png', 'account'),
          att('a2', '#4caf86', '카드내역.png', 'card'),
        ]}
        onRemove={() => {}}
        removingId="a2"
      />
    </div>
  ),
};
