import type { Meta, StoryObj } from '@storybook/react';
import { AttachmentThumbnail } from './AttachmentThumbnail';

// 1x1 회색 PNG (썸네일 미리보기용)
const grayPng =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

const meta: Meta<typeof AttachmentThumbnail> = {
  title: 'Cashbook/AttachmentThumbnail',
  component: AttachmentThumbnail,
  parameters: { layout: 'padded' },
  args: {
    index: 0,
    onRemove: () => alert('제거'),
  },
};

export default meta;
type Story = StoryObj<typeof AttachmentThumbnail>;

/** 영수증 이미지 썸네일 */
export const Image: Story = {
  args: { kind: 'image', name: 'receipt.jpg', dataUrl: grayPng },
};

/** PDF 파일 칩 (아이콘 + 파일명) */
export const Pdf: Story = {
  args: { kind: 'pdf', name: '이용내역.pdf', caption: '3페이지' },
};

/** 긴 파일명은 말줄임 처리된다 */
export const PdfLongName: Story = {
  args: { kind: 'pdf', name: '2026년_9월_신용카드_이용내역서_최종본_다운로드.pdf' },
};

/** 이미지·PDF가 섞인 첨부 목록 (AiParseInput 안에서의 배치) */
export const MixedRow: Story = {
  render: () => (
    <div className="flex gap-2 overflow-x-auto py-1">
      <AttachmentThumbnail
        kind="image"
        name="a.jpg"
        dataUrl={grayPng}
        index={0}
        onRemove={() => {}}
      />
      <AttachmentThumbnail
        kind="pdf"
        name="이용내역.pdf"
        caption="12페이지"
        index={1}
        onRemove={() => {}}
      />
      <AttachmentThumbnail
        kind="image"
        name="b.jpg"
        dataUrl={grayPng}
        index={2}
        onRemove={() => {}}
      />
    </div>
  ),
};
