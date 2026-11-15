import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { FeedbackForm, type FeedbackFormSubmit } from './FeedbackForm';

const meta: Meta<typeof FeedbackForm> = {
  title: 'Settings/FeedbackForm',
  component: FeedbackForm,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '의견 보내기 폼(/settings/feedback). RHF + Zod로 유형(필수)·내용(10~2000자)·연락 이메일(선택) 검증, 스크린샷 1장(image/*, 20MB 이하). 기기 정보 수집·업로드는 앱이 onSubmit에서 처리.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof FeedbackForm>;

function Harness(props: Partial<React.ComponentProps<typeof FeedbackForm>>) {
  const [last, setLast] = useState<FeedbackFormSubmit | null>(null);
  return (
    <div className="mx-auto max-w-md bg-background p-4">
      <FeedbackForm defaultEmail="minji@example.com" onSubmit={setLast} {...props} />
      {last ? (
        <pre className="mt-6 whitespace-pre-wrap rounded-lg bg-muted p-3 text-xs">
          {JSON.stringify({ ...last, screenshot: last.screenshot?.name ?? null }, null, 2)}
        </pre>
      ) : null}
    </div>
  );
}

/** 처음 진입한 상태. 보내기를 누르면 유형·내용 오류가 보인다. */
export const 기본: Story = { render: () => <Harness /> };

/** 버그를 고르면 내용 placeholder가 재현 방법 안내로 바뀐다. */
export const 버그_선택: Story = {
  render: () => <Harness initialValues={{ type: 'bug' }} />,
};

/** 로그인 이메일이 없는 계정(애플 비공개 이메일 등) — 이메일 칸이 비어 있다. */
export const 이메일_없음: Story = { render: () => <Harness defaultEmail="" /> };

/** 내용이 거의 2000자에 가까운 경우 글자 수 표시. */
export const 긴_내용: Story = {
  render: () => (
    <Harness
      initialValues={{ type: 'idea', content: '월간 리포트를 메일로 받고 싶어요. '.repeat(100) }}
    />
  ),
};

/** 제출 중 — 입력과 버튼이 비활성. */
export const 보내는_중: Story = {
  render: () => (
    <Harness isPending initialValues={{ type: 'bug', content: '저장 버튼이 눌리지 않아요' }} />
  ),
};
