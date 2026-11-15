'use client';

import { useTranslations } from 'next-intl';
import { useId, useMemo, useState, type UIEvent } from 'react';
import { ChevronDown, Check, Plus, Loader2 } from 'lucide-react';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  Command,
  CommandInput,
  CommandList,
  CommandGroup,
  CommandItem,
  CommandSeparator,
  cn,
} from '@uandi/ui';
import type { Folder } from '@/types';

const INITIAL_VISIBLE = 20;
const LOAD_MORE_CHUNK = 20;
const SCROLL_LOAD_MORE_THRESHOLD = 120;

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
  placeholder: placeholderProp,
  ariaLabel: ariaLabelProp,
}: FolderComboboxProps) {
  const t = useTranslations('photos.combobox');
  const placeholder = placeholderProp ?? t('placeholder');
  const ariaLabel = ariaLabelProp ?? t('aria');
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);
  const [isCreating, setIsCreating] = useState(false);
  const [justCreated, setJustCreated] = useState<{ id: string; name: string } | null>(null);
  const listId = useId();

  const selected = folders.find((f) => f.id === value);
  const pendingName = justCreated && justCreated.id === value ? justCreated.name : null;
  const displayName = selected?.name ?? pendingName;

  const trimmed = query.trim();
  const folderMap = useMemo(() => {
    const m = new Map<string, Folder>();
    for (const f of folders) m.set(f.id, f);
    return m;
  }, [folders]);
  const resolvePathHint = (folder: Folder): string | null => {
    if (!folder.path || folder.path.length === 0) return null;
    const names = folder.path.map((id) => folderMap.get(id)?.name).filter(Boolean) as string[];
    if (names.length === 0) return null;
    return names.join(' / ');
  };
  const filtered = useMemo(() => {
    if (!trimmed) return folders;
    const q = trimmed.toLowerCase();
    return folders.filter((f) => f.name.toLowerCase().includes(q));
  }, [folders, trimmed]);
  const hasExactMatch = useMemo(
    () => folders.some((f) => f.name.trim().toLowerCase() === trimmed.toLowerCase()),
    [folders, trimmed]
  );
  const showCreateOption = !!onCreateFolder && trimmed.length > 0 && !hasExactMatch;

  const visible = filtered.slice(0, visibleCount);
  const hasMore = filtered.length > visible.length;
  const showEmptyMessage = filtered.length === 0 && !showCreateOption;

  const handleQueryChange = (next: string) => {
    setQuery(next);
    setVisibleCount(INITIAL_VISIBLE);
  };

  const handleListScroll = (e: UIEvent<HTMLDivElement>) => {
    if (!hasMore) return;
    const el = e.currentTarget;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < SCROLL_LOAD_MORE_THRESHOLD) {
      setVisibleCount((c) => c + LOAD_MORE_CHUNK);
    }
  };

  const handleOpenChange = (next: boolean) => {
    if (isCreating) return;
    setOpen(next);
    if (!next) {
      setVisibleCount(INITIAL_VISIBLE);
    }
  };

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
    <Popover open={open} onOpenChange={handleOpenChange} modal>
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
        collisionPadding={12}
        className="p-0 border-border/60 shadow-lg shadow-black/5"
        style={{ width: 'var(--radix-popover-trigger-width)' }}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <Command shouldFilter={false} disablePointerSelection>
          <CommandInput
            placeholder={t('search')}
            value={query}
            onValueChange={handleQueryChange}
            data-testid="folder-combobox-input"
          />
          <CommandList
            id={listId}
            style={{ maxHeight: 'min(300px, 60vh)' }}
            onScroll={handleListScroll}
          >
            {visible.length > 0 && (
              <CommandGroup>
                {visible.map((folder) => {
                  const pathHint = trimmed.length > 0 ? resolvePathHint(folder) : null;
                  return (
                    <CommandItem
                      key={folder.id}
                      value={folder.id}
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
                      <div className="flex min-w-0 flex-col">
                        <span className="truncate">{folder.name}</span>
                        {pathHint && (
                          <span className="truncate text-xs text-muted-foreground">{pathHint}</span>
                        )}
                      </div>
                    </CommandItem>
                  );
                })}
                {hasMore && (
                  <div
                    className="py-2 text-center text-xs text-muted-foreground"
                    data-testid="folder-combobox-more"
                  >
                    {t('more', { count: filtered.length - visible.length })}
                  </div>
                )}
              </CommandGroup>
            )}
            {showEmptyMessage && (
              <div className="py-6 text-center text-sm text-muted-foreground">
                {onCreateFolder ? t('canCreate') : t('noMatch')}
              </div>
            )}
            {showCreateOption && (
              <>
                {visible.length > 0 && <CommandSeparator />}
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
                      {isCreating ? t('creating') : t('create', { name: trimmed })}
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
