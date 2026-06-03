import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Sheet } from '../../components/sheet';
import { SourceForm, type SourceFormSubmit } from './SourceForm';

const meta: Meta<typeof SourceForm> = {
  title: 'Community/SourceForm',
  component: SourceForm,
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj<typeof SourceForm>;

function Wrapper(props: Partial<React.ComponentProps<typeof SourceForm>>) {
  const [submitted, setSubmitted] = useState<SourceFormSubmit | null>(null);
  return (
    <div className="p-4">
      {submitted ? (
        <p className="mb-2 text-xs text-muted-foreground">
          제출됨: {submitted.siteName} · {submitted.feedUrl}
        </p>
      ) : null}
      <Sheet open>
        <SourceForm onSubmit={(v) => setSubmitted(v)} {...props} />
      </Sheet>
    </div>
  );
}

export const Create: Story = {
  render: () => <Wrapper />,
};

export const Edit: Story = {
  render: () => (
    <Wrapper
      mode="edit"
      initialSiteName="결혼 매거진"
      initialFeedUrl="https://example.com/wedding/rss"
    />
  ),
};

export const Pending: Story = {
  render: () => <Wrapper isPending />,
};

export const WithDiscover: Story = {
  render: () => (
    <Wrapper
      onDiscover={async (pageUrl) => {
        // 데모용 mock: 입력 origin + /rss를 피드로 가정
        await new Promise((r) => setTimeout(r, 600));
        try {
          const origin = new URL(pageUrl).origin;
          return { feedUrl: `${origin}/rss`, siteName: '자동 탐지된 블로그' };
        } catch {
          return null;
        }
      }}
    />
  ),
};
