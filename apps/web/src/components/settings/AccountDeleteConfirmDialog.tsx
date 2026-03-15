'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
} from '@uandi/ui';

type AccountDeleteConfirmDialogProps = {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
};

export function AccountDeleteConfirmDialog({
  isOpen,
  onConfirm,
  onCancel,
  isPending,
}: AccountDeleteConfirmDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent data-testid="delete-account-dialog">
        <DialogHeader>
          <DialogTitle>회원탈퇴</DialogTitle>
          <DialogDescription>
            탈퇴하면 계정이 영구 삭제됩니다. 커플 공간의 데이터는 파트너에게 유지됩니다. 이 작업은
            되돌릴 수 없습니다.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isPending}
            data-testid="delete-account-cancel"
          >
            취소
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isPending}
            data-testid="delete-account-confirm"
          >
            {isPending ? '처리 중...' : '탈퇴하기'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
