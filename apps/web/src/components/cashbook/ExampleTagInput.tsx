'use client';

import {
  forwardRef,
  useState,
  type ComponentProps,
  type KeyboardEvent,
} from 'react';
import { X } from 'lucide-react';
import { Input } from '@uandi/ui';

export const EXAMPLES_MAX = 8;

type ExampleChipListProps = {
  value: string[];
  onRemove: (item: string) => void;
};

export function ExampleChipList({ value, onRemove }: ExampleChipListProps) {
  if (value.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {value.map((item) => (
        <span
          key={item}
          data-testid={`example-chip-${item}`}
          className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs"
        >
          {item}
          <button
            type="button"
            aria-label={`${item} 제거`}
            className="text-muted-foreground hover:text-foreground"
            onClick={() => onRemove(item)}
          >
            <X size={12} />
          </button>
        </span>
      ))}
    </div>
  );
}

type ExampleTagInputProps = {
  value: string[];
  onAdd: (item: string) => void;
  onRemoveLast: () => void;
} & Omit<
  ComponentProps<'input'>,
  'value' | 'onChange' | 'onKeyDown' | 'onBlur' | 'ref'
>;

export const ExampleTagInput = forwardRef<HTMLInputElement, ExampleTagInputProps>(
  function ExampleTagInput(
    {
      value,
      onAdd,
      onRemoveLast,
      placeholder = '예시 추가 후 Enter',
      disabled,
      ...rest
    },
    ref
  ) {
    const [draft, setDraft] = useState('');
    const reachedMax = value.length >= EXAMPLES_MAX;

    const handleAdd = () => {
      const trimmed = draft.trim();
      if (!trimmed) return;
      if (trimmed.length > 20) return;
      if (value.includes(trimmed)) {
        setDraft('');
        return;
      }
      if (reachedMax) return;
      onAdd(trimmed);
      setDraft('');
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleAdd();
        return;
      }
      if (e.key === 'Backspace' && draft === '' && value.length > 0) {
        e.preventDefault();
        onRemoveLast();
      }
    };

    return (
      <Input
        {...rest}
        ref={ref}
        value={draft}
        placeholder={reachedMax ? `최대 ${EXAMPLES_MAX}개까지` : placeholder}
        disabled={disabled || reachedMax}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleAdd}
      />
    );
  }
);
