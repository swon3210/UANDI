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

type CreateFolderSheetProps = {
  onSubmit: (name: string) => void;
  isPending?: boolean;
};

export function CreateFolderSheet({ onSubmit, isPending }: CreateFolderSheetProps) {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed) onSubmit(trimmed);
  };

  return (
    <SheetContent side="bottom" className="rounded-t-[20px] max-h-[90vh]">
      <SheetHeader>
        <SheetTitle>새 폴더</SheetTitle>
        <SheetDescription className="sr-only">새 폴더를 만듭니다</SheetDescription>
      </SheetHeader>
      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div>
          <label htmlFor="folder-name" className="text-sm font-medium">
            폴더 이름
          </label>
          <Input
            id="folder-name"
            placeholder="예: 제주도 여행"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            className="mt-1.5"
          />
        </div>
        <Button type="submit" className="w-full" disabled={!name.trim() || isPending}>
          {isPending ? '만드는 중...' : '만들기'}
        </Button>
      </form>
    </SheetContent>
  );
}
