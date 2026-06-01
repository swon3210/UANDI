'use client';

import { useState } from 'react';
import { Button } from '../../components/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/dialog';
import { Label } from '../../components/label';
import { RadioGroup, RadioGroupItem } from '../../components/radio-group';

export type ReportReason = 'spam' | 'inappropriate' | 'copyright' | 'other';

export const REPORT_REASON_LABELS: Record<ReportReason, string> = {
  spam: '스팸',
  inappropriate: '부적절',
  copyright: '저작권',
  other: '기타',
};

const REPORT_REASONS: ReportReason[] = ['spam', 'inappropriate', 'copyright', 'other'];

export type ReportDialogProps = {
  isOpen: boolean;
  onSubmit: (reason: ReportReason) => void;
  onCancel: () => void;
  isPending?: boolean;
  defaultReason?: ReportReason;
};

export function ReportDialog({
  isOpen,
  onSubmit,
  onCancel,
  isPending,
  defaultReason = 'inappropriate',
}: ReportDialogProps) {
  const [reason, setReason] = useState<ReportReason>(defaultReason);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent data-testid="community-report-dialog">
        <DialogHeader>
          <DialogTitle>이 글을 신고할까요?</DialogTitle>
          <DialogDescription>
            관리자가 검토한 후 부적절한 글은 숨김 처리해요. 신고는 익명으로 접수돼요.
          </DialogDescription>
        </DialogHeader>
        <RadioGroup
          value={reason}
          onValueChange={(v) => setReason(v as ReportReason)}
          className="space-y-2 py-2"
        >
          {REPORT_REASONS.map((r) => (
            <div key={r} className="flex items-center gap-2">
              <RadioGroupItem
                id={`report-reason-${r}`}
                value={r}
                aria-label={REPORT_REASON_LABELS[r]}
              />
              <Label htmlFor={`report-reason-${r}`} className="cursor-pointer">
                {REPORT_REASON_LABELS[r]}
              </Label>
            </div>
          ))}
        </RadioGroup>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={isPending}>
            취소
          </Button>
          <Button
            variant="destructive"
            onClick={() => onSubmit(reason)}
            disabled={isPending}
          >
            {isPending ? '제출 중...' : '신고'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
