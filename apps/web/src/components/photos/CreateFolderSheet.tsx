'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { SheetContent, SheetHeader, SheetTitle, SheetDescription, Input, Button } from '@uandi/ui';

type CreateFolderSheetProps = {
  onSubmit: (name: string) => void;
  isPending?: boolean;
};

export function CreateFolderSheet({ onSubmit, isPending }: CreateFolderSheetProps) {
  const t = useTranslations('photos');
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed) onSubmit(trimmed);
  };

  return (
    <SheetContent side="bottom" className="rounded-t-[20px] max-h-[90vh]">
      <SheetHeader>
        <SheetTitle>{t('folder.new')}</SheetTitle>
        <SheetDescription className="sr-only">{t('folder.newDescription')}</SheetDescription>
      </SheetHeader>
      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div>
          <label htmlFor="folder-name" className="text-sm font-medium">
            {t('folder.nameLabel')}
          </label>
          <Input
            id="folder-name"
            placeholder={t('folder.namePlaceholder')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            className="mt-1.5"
          />
        </div>
        <Button type="submit" className="w-full" disabled={!name.trim() || isPending}>
          {isPending ? t('folder.creating') : t('folder.create')}
        </Button>
      </form>
    </SheetContent>
  );
}
