import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Sheet } from '../../components/sheet';
import { Button } from '../../components/button';
import { CommunityComposer, type CommunityComposerSubmit } from './CommunityComposer';

const meta: Meta<typeof CommunityComposer> = {
  title: 'Community/CommunityComposer',
  component: CommunityComposer,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'overlay-kit Sheet 안에서 사용하는 커뮤니티 글쓰기 폼. RHF + Zod로 본문(1~1000자) 검증, 이미지 1장(image/*, 5MB 이하) 선택. onSubmit/isPending은 caller가 mutation에 연결.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof CommunityComposer>;

function Harness({ isPending = false }: { isPending?: boolean }) {
  const [open, setOpen] = useState(true);
  const [last, setLast] = useState<CommunityComposerSubmit | null>(null);

  return (
    <div className="min-h-[600px] bg-background p-4">
      <Button onClick={() => setOpen(true)}>글쓰기 열기</Button>
      {last ? (
        <p className="mt-4 text-sm text-muted-foreground">
          제출됨: 본문 {last.body.length}자 / 이미지 {last.imageFile ? last.imageFile.name : '없음'}
        </p>
      ) : null}
      <Sheet open={open} onOpenChange={setOpen}>
        <CommunityComposer
          isPending={isPending}
          onSubmit={async (values) => {
            setLast(values);
            // 데모: 약간의 지연 후 닫기
            await new Promise((r) => setTimeout(r, 300));
            setOpen(false);
          }}
        />
      </Sheet>
    </div>
  );
}

export const Default: Story = {
  name: '기본 (빈 본문 → 올리기 비활성)',
  render: () => <Harness />,
};

export const Submitting: Story = {
  name: '제출 중 (올리기 버튼 로딩)',
  render: () => <Harness isPending />,
};
