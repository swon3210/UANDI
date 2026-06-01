import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { ReportDialog, type ReportReason } from './ReportDialog';

const meta: Meta<typeof ReportDialog> = {
  title: 'Community/ReportDialog',
  component: ReportDialog,
  parameters: { layout: 'centered' },
};

export default meta;
type Story = StoryObj<typeof ReportDialog>;

function Wrapper({ isPending }: { isPending?: boolean }) {
  const [isOpen, setIsOpen] = useState(true);
  const [submitted, setSubmitted] = useState<ReportReason | null>(null);
  return (
    <div className="flex flex-col items-center gap-3">
      {!isOpen ? (
        <button
          type="button"
          onClick={() => {
            setSubmitted(null);
            setIsOpen(true);
          }}
          className="rounded-md border px-3 py-1 text-sm"
        >
          다이얼로그 열기
        </button>
      ) : null}
      {submitted ? (
        <p className="text-xs text-muted-foreground">제출됨: {submitted}</p>
      ) : null}
      <ReportDialog
        isOpen={isOpen}
        isPending={isPending}
        onCancel={() => setIsOpen(false)}
        onSubmit={(reason) => {
          setSubmitted(reason);
          setIsOpen(false);
        }}
      />
    </div>
  );
}

export const Default: Story = {
  render: () => <Wrapper />,
};

export const Pending: Story = {
  render: () => <Wrapper isPending />,
};
