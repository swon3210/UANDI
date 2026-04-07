import { useState } from 'react';
import { Input } from '@uandi/ui';
import {
  SUB_GROUPS_BY_GROUP,
  SUB_GROUP_LABELS,
} from '@uandi/cashbook-core';
import type {
  CashbookEntryType,
  CashbookCategory,
  CategoryGroup,
  CategorySubGroup,
} from '@uandi/cashbook-core';

type CategorySelectorProps = {
  categories: CashbookCategory[];
  activeType: CashbookEntryType;
  value: string;
  onChange: (v: string) => void;
};

export function CategorySelector({
  categories,
  activeType,
  value,
  onChange,
}: CategorySelectorProps) {
  const [isCustom, setIsCustom] = useState(false);
  const subGroups = SUB_GROUPS_BY_GROUP[activeType as CategoryGroup] ?? [];
  const presetNames = new Set(categories.map((c) => c.name));
  const showCustomInput = isCustom || (value !== '' && !presetNames.has(value));

  return (
    <div className="space-y-2">
      {subGroups.map((sg) => {
        const items = categories.filter((c) => c.subGroup === sg);
        if (items.length === 0) return null;
        return (
          <div key={sg}>
            <div className="mb-1 text-[11px] text-muted-foreground">
              {SUB_GROUP_LABELS[sg as CategorySubGroup]}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {items.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${
                    value === cat.name && !showCustomInput
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-secondary border-border hover:bg-accent'
                  }`}
                  onClick={() => {
                    setIsCustom(false);
                    onChange(cat.name);
                  }}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        );
      })}
      <div>
        <button
          type="button"
          className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${
            showCustomInput
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-secondary border-border hover:bg-accent'
          }`}
          onClick={() => {
            setIsCustom(true);
            onChange('');
          }}
        >
          직접 입력
        </button>
        {showCustomInput && (
          <Input
            className="mt-1.5 text-sm"
            placeholder="카테고리를 입력하세요"
            value={value}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
            autoFocus
          />
        )}
      </div>
    </div>
  );
}
