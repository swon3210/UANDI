import type { Meta, StoryObj } from '@storybook/react';
import { Timestamp } from 'firebase/firestore';
import { SettlementAttachmentGallery } from './SettlementAttachmentGallery';
import type { SettlementAttachment } from '@/types';

const swatch = (color: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><rect width='120' height='120' fill='${color}'/></svg>`
  )}`;

const att = (id: string, color: string, name: string): SettlementAttachment => ({
  id,
  storagePath: `couples/c1/cashbookSettlements/2026-06/${id}.png`,
  url: swatch(color),
  name,
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
          att('a1', '#e8837a', '영수증1.png'),
          att('a2', '#4caf86', '카드내역.png'),
          att('a3', '#6366f1', '스크린샷.png'),
        ]}
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
        attachments={[att('a1', '#e8837a', '영수증1.png'), att('a2', '#4caf86', '카드내역.png')]}
        onRemove={() => {}}
        removingId="a2"
      />
    </div>
  ),
};
