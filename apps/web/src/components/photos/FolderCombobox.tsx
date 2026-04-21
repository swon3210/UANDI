'use client';

import { useId, useMemo, useState } from 'react';
import { ChevronDown, Check, Plus, Loader2 } from 'lucide-react';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
  cn,
} from '@uandi/ui';
import type { Folder } from '@/types';

type FolderComboboxProps = {
  folders: Folder[];
  value: string;
  onChange: (folderId: string) => void;
  onCreateFolder?: (name: string) => Promise<string>;
  disabled?: boolean;
  placeholder?: string;
  ariaLabel?: string;
};

export function FolderCombobox({
  folders,
  value,
  onChange,
  onCreateFolder,
  disabled,
  placeholder = '폴더 선택',
  ariaLabel = '폴더',
}: FolderComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [justCreated, setJustCreated] = useState<{ id: string; name: string } | null>(null);
  const listId = useId();

  const selected = folders.find((f) => f.id === value);
  const pendingName = justCreated && justCreated.id === value ? justCreated.name : null;
  const displayName = selected?.name ?? pendingName;

  const trimmed = query.trim();
  const hasExactMatch = useMemo(
    () => folders.some((f) => f.name.trim().toLowerCase() === trimmed.toLowerCase()),
    [folders, trimmed]
  );
  const showCreateOption = !!onCreateFolder && trimmed.length > 0 && !hasExactMatch;

  const handleCreate = async () => {
    if (!onCreateFolder || !trimmed || isCreating) return;
    setIsCreating(true);
    try {
      const newId = await onCreateFolder(trimmed);
      setJustCreated({ id: newId, name: trimmed });
      onChange(newId);
      setQuery('');
      setOpen(false);
    } finally {
      setIsCreating(false);
    }
  };

  const handleSelect = (folderId: string) => {
    onChange(folderId);
    setQuery('');
    setOpen(false);
    setJustCreated(null);
  };

  return (
    <Popover open={open} onOpenChange={(next) => !isCreating && setOpen(next)}>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-label={ariaLabel}
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-controls={listId}
          disabled={disabled}
          data-testid="folder-combobox-trigger"
          className={cn(
            'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background',
            'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            !displayName && 'text-muted-foreground'
          )}
        >
          <span className="truncate text-left">{displayName ?? placeholder}</span>
          <ChevronDown size={16} className="ml-2 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={6}
        className="p-0 border-border/60 shadow-lg shadow-black/5"
        style={{ width: 'var(--radix-popover-trigger-width)' }}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <Command
          shouldFilter
          filter={(itemValue: string, search: string) => {
            if (itemValue.startsWith('__create__')) return 0;
            return itemValue.toLowerCase().includes(search.toLowerCase()) ? 1 : 0;
          }}
        >
          <CommandInput
            placeholder="폴더 검색 또는 새로 만들기"
            value={query}
            onValueChange={setQuery}
            data-testid="folder-combobox-input"
          />
          <CommandList id={listId}>
            {folders.length > 0 && (
              <CommandGroup>
                {folders.map((folder) => (
                  <CommandItem
                    key={folder.id}
                    value={folder.name}
                    onSelect={() => handleSelect(folder.id)}
                    data-testid={`folder-combobox-item-${folder.id}`}
                  >
                    <Check
                      size={16}
                      className={cn(
                        'mr-2 shrink-0',
                        value === folder.id ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <span className="truncate">{folder.name}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {!showCreateOption && (
              <CommandEmpty>
                {onCreateFolder
                  ? '폴더 이름을 입력하면 새로 만들 수 있어요'
                  : '일치하는 폴더가 없어요'}
              </CommandEmpty>
            )}
            {showCreateOption && (
              <>
                {folders.length > 0 && <CommandSeparator />}
                <CommandGroup forceMount>
                  <CommandItem
                    value={`__create__${trimmed}`}
                    onSelect={handleCreate}
                    disabled={isCreating}
                    forceMount
                    data-testid="folder-combobox-create"
                  >
                    {isCreating ? (
                      <Loader2 size={16} className="mr-2 shrink-0 animate-spin" />
                    ) : (
                      <Plus size={16} className="mr-2 shrink-0" />
                    )}
                    <span className="truncate">
                      {isCreating ? '만드는 중…' : `'${trimmed}' 폴더 만들기`}
                    </span>
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
