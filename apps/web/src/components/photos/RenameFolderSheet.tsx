'use client';

import { useState } from 'react';
import {
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  Input,
  Button,
} from '@uandi/ui';

type RenameFolderSheetProps = {
  currentName: string;
  onSubmit: (newName: string) => void;
  isPending?: boolean;
};

export function RenameFolderSheet({ currentName, onSubmit, isPending }: RenameFolderSheetProps) {
  const [name, setName] = useState(currentName);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed && trimmed !== currentName) onSubmit(trimmed);
  };

  return (
    <SheetContent side="bottom" className="rounded-t-[20px] max-h-[90vh]">
      <SheetHeader>
        <SheetTitle>이름 변경</SheetTitle>
        <SheetDescription className="sr-only">폴더 이름을 변경합니다</SheetDescription>
      </SheetHeader>
      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div>
          <label htmlFor="folder-rename" className="text-sm font-medium">
            폴더 이름
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
          {isPending ? '변경 중...' : '변경하기'}
        </Button>
      </form>
    </SheetContent>
  );
}
