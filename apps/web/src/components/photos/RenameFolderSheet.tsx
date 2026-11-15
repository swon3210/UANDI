'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { SheetContent, SheetHeader, SheetTitle, SheetDescription, Input, Button } from '@uandi/ui';

type RenameFolderSheetProps = {
  currentName: string;
  onSubmit: (newName: string) => void;
  isPending?: boolean;
};

export function RenameFolderSheet({ currentName, onSubmit, isPending }: RenameFolderSheetProps) {
  const t = useTranslations('photos');
  const [name, setName] = useState(currentName);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed && trimmed !== currentName) onSubmit(trimmed);
  };

  return (
    <SheetContent side="bottom" className="rounded-t-[20px] max-h-[90vh]">
      <SheetHeader>
        <SheetTitle>{t('folder.rename')}</SheetTitle>
        <SheetDescription className="sr-only">{t('folder.renameDescription')}</SheetDescription>
      </SheetHeader>
      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div>
          <label htmlFor="folder-rename" className="text-sm font-medium">
            {t('folder.nameLabel')}
          </label>
          <Input
            id="folder-rename"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            className="mt-1.5"
          />
        </div>
        <Button
          type="submit"
          className="w-full"
          disabled={!name.trim() || name.trim() === currentName || isPending}
        >
          {isPending ? t('folder.renaming') : t('folder.renameSubmit')}
        </Button>
      </form>
    </SheetContent>
  );
}
