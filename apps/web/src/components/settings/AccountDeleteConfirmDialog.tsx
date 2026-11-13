'use client';

import { useTranslations } from 'next-intl';
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
  const t = useTranslations('settings.deleteAccount');
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent data-testid="delete-account-dialog">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isPending}
            data-testid="delete-account-cancel"
          >
            {t('cancel')}
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isPending}
            data-testid="delete-account-confirm"
          >
            {isPending ? t('pending') : t('confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
