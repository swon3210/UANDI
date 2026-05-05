'use client';

import { Search } from 'lucide-react';
import {
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@uandi/ui';

export type SortOption = 'latest' | 'oldest' | 'name';

type FolderToolbarProps = {
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  sortBy: SortOption;
  onSortByChange: (value: SortOption) => void;
  searchTestId?: string;
  sortTestId?: string;
  searchPlaceholder?: string;
  searchAriaLabel?: string;
  sortAriaLabel?: string;
};

export function FolderToolbar({
  searchQuery,
  onSearchQueryChange,
  sortBy,
  onSortByChange,
  searchTestId = 'folder-search-input',
  sortTestId = 'folder-sort-select',
  searchPlaceholder = '폴더 검색',
  searchAriaLabel = '폴더 검색',
  sortAriaLabel = '폴더 정렬',
}: FolderToolbarProps) {
  return (
    <div className="flex items-center gap-2 px-4 py-2">
      <div className="relative flex-1 min-w-0">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
        />
        <Input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchQueryChange(e.target.value)}
          placeholder={searchPlaceholder}
          aria-label={searchAriaLabel}
          data-testid={searchTestId}
          className="pl-9"
        />
      </div>
      <Select value={sortBy} onValueChange={(value) => onSortByChange(value as SortOption)}>
        <SelectTrigger
          className="w-[112px] shrink-0"
          aria-label={sortAriaLabel}
          data-testid={sortTestId}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="latest">최신순</SelectItem>
          <SelectItem value="oldest">오래된순</SelectItem>
          <SelectItem value="name">글자순</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
