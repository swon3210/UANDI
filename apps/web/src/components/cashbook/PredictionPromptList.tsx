'use client';

import { PredictionPromptBox, type PredictionPromptView } from './PredictionPromptBox';

type PredictionPromptListProps = {
  prompts: PredictionPromptView[];
  onConfirm: (prompt: PredictionPromptView) => void;
  onReject: (prompt: PredictionPromptView) => void;
  onEdit: (prompt: PredictionPromptView) => void;
};

/** 가계부 내역 화면에 끼워 넣는 예측 프롬프트 묶음(해당 날짜의 미확정 예측들). */
export function PredictionPromptList({
  prompts,
  onConfirm,
  onReject,
  onEdit,
}: PredictionPromptListProps) {
  if (prompts.length === 0) return null;

  return (
    <div className="space-y-2" data-testid="prediction-prompt-list">
      {prompts.map((prompt) => (
        <PredictionPromptBox
          key={prompt.id}
          prompt={prompt}
          onConfirm={() => onConfirm(prompt)}
          onReject={() => onReject(prompt)}
          onEdit={() => onEdit(prompt)}
        />
      ))}
    </div>
  );
}
