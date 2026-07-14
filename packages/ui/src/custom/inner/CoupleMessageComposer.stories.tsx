import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Sheet } from '../../components/sheet';
import { Button } from '../../components/button';
import { CoupleMessageComposer } from './CoupleMessageComposer';

const meta: Meta<typeof CoupleMessageComposer> = {
  title: 'Inner/CoupleMessageComposer',
  component: CoupleMessageComposer,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '"서로를 위한 한마디" 작성 UI. 빠른 선택 칩으로 채우거나 직접 입력한 한 줄(최대 30자)을 onSubmit으로 전달한다. overlay-kit Sheet 안에서 사용.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof CoupleMessageComposer>;

function Harness({ initialMessage }: { initialMessage?: string | null }) {
  const [open, setOpen] = useState(true);
  const [saved, setSaved] = useState<string | null>(null);

  return (
    <div className="min-h-[600px] bg-background p-4">
      <Button onClick={() => setOpen(true)}>한마디 열기</Button>
      {saved ? <p className="mt-4 text-sm text-muted-foreground">저장됨: {saved}</p> : null}
      <Sheet open={open} onOpenChange={setOpen}>
        <CoupleMessageComposer
          partnerName="지훈"
          initialMessage={initialMessage}
          onSubmit={(message) => {
            setSaved(message);
            setOpen(false);
          }}
        />
      </Sheet>
    </div>
  );
}

/** 기본 — 빈 상태에서 새로 작성 */
export const Default: Story = {
  name: '기본 (새로 작성)',
  render: () => <Harness />,
};

/** 기존 한마디 수정 */
export const EditExisting: Story = {
  name: '기존 한마디 수정',
  render: () => <Harness initialMessage="먼저 자~" />,
};
