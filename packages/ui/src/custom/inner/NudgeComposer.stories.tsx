import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Sheet } from '../../components/sheet';
import { Button } from '../../components/button';
import { NudgeComposer } from './NudgeComposer';

const meta: Meta<typeof NudgeComposer> = {
  title: 'Inner/NudgeComposer',
  component: NudgeComposer,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '가계부 입력 요청 "콕 찌르기" 작성 UI. 프리셋 중 택1 또는 직접 입력한 한 줄을 onSubmit으로 전달한다. 이미 보낸 미응답 요청이 있으면 disabled로 버튼을 잠근다. overlay-kit Sheet 안에서 사용.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof NudgeComposer>;

function Harness({
  isPending = false,
  disabled = false,
  disabledReason,
}: {
  isPending?: boolean;
  disabled?: boolean;
  disabledReason?: string;
}) {
  const [open, setOpen] = useState(true);
  const [last, setLast] = useState<string | null>(null);

  return (
    <div className="min-h-[600px] bg-background p-4">
      <Button onClick={() => setOpen(true)}>콕 찌르기 열기</Button>
      {last ? (
        <p className="mt-4 text-sm text-muted-foreground">보낸 문구: &ldquo;{last}&rdquo;</p>
      ) : null}
      <Sheet open={open} onOpenChange={setOpen}>
        <NudgeComposer
          partnerName="지송"
          isPending={isPending}
          disabled={disabled}
          disabledReason={disabledReason}
          onSubmit={async (message) => {
            setLast(message);
            await new Promise((r) => setTimeout(r, 300));
            setOpen(false);
          }}
        />
      </Sheet>
    </div>
  );
}

export const Default: Story = {
  name: '기본 (프리셋 선택)',
  render: () => <Harness />,
};

export const Sending: Story = {
  name: '보내는 중 (버튼 로딩)',
  render: () => <Harness isPending />,
};

export const AlreadyPending: Story = {
  name: '이미 요청 보냄 (비활성)',
  render: () => (
    <Harness disabled disabledReason="이미 입력 요청을 보냈어요. 파트너가 확인하면 다시 보낼 수 있어요." />
  ),
};
