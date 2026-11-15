'use client';

import { useTranslations } from 'next-intl';
import { SheetContent, SheetHeader, SheetTitle, SheetDescription, Button } from '@uandi/ui';
import { Pencil, Trash2 } from 'lucide-react';

type FolderMenuSheetProps = {
  onRename: () => void;
  onDelete: () => void;
};

export function FolderMenuSheet({ onRename, onDelete }: FolderMenuSheetProps) {
  const t = useTranslations('photos');
  return (
    <SheetContent side="bottom" className="rounded-t-[20px] max-h-[90vh]">
      <SheetHeader>
        <SheetTitle>{t('folder.menuTitle')}</SheetTitle>
        <SheetDescription className="sr-only">{t('folder.menuDescription')}</SheetDescription>
      </SheetHeader>
      <div className="mt-4 space-y-2">
        <Button variant="ghost" className="w-full justify-start gap-3" onClick={onRename}>
          <Pencil size={20} />
          {t('folder.rename')}
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-destructive hover:text-destructive"
          onClick={onDelete}
        >
          <Trash2 size={20} />
          {t('folder.delete')}
        </Button>
      </div>
    </SheetContent>
  );
}
