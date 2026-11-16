'use client';

import { Moon } from 'lucide-react';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@uandi/ui';

type AdminPushConfirmDialogProps = {
  isOpen: boolean;
  announcementTitle: string;
  /** 실제로 보낼 인원 */
  count: number;
  /** 21시~8시(KST)면 야간 경고 */
  isNight: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

/** 공지 푸시 발송 전 확인. 대상 수를 크게 보여주고 야간이면 경고한다. */
export function AdminPushConfirmDialog({
  isOpen,
  announcementTitle,
  count,
  isNight,
  onConfirm,
  onCancel,
}: AdminPushConfirmDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent data-testid="admin-push-confirm-dialog">
        <DialogHeader>
          <DialogTitle>{count}명에게 공지 푸시를 보낼까요?</DialogTitle>
          <DialogDescription className="break-keep">「{announcementTitle}」</DialogDescription>
        </DialogHeader>
        {isNight ? (
          <p
            className="flex items-start gap-2 rounded-lg bg-muted p-3 text-sm"
            data-testid="admin-push-night-warning"
          >
            <Moon size={16} className="mt-0.5 shrink-0" aria-hidden />
            지금은 밤 시간이에요. 아침에 보내는 걸 권해요.
          </p>
        ) : null}
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            취소
          </Button>
          <Button onClick={onConfirm} data-testid="admin-push-confirm">
            보내기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
