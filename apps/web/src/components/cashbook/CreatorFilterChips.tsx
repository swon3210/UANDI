'use client';

import { Check } from 'lucide-react';
import { cn } from '@uandi/ui';
import { AuthorAvatar } from './AuthorAvatar';

export type FilterMember = {
  uid: string;
  displayName: string;
  photoURL: string | null;
};

type CreatorFilterChipsProps = {
  members: FilterMember[];
  /** 선택된 작성자 uid. 빈 배열 = 전체(무필터). */
  value: string[];
  onToggle: (uid: string) => void;
};

/**
 * 내역 작성자(커플 멤버)를 아바타+이름 칩으로 다중선택한다. 빈 배열 = 전체.
 * 멤버가 2명 미만이면(솔로 커플 등) 구분할 대상이 없으므로 아무것도 렌더하지 않는다.
 */
export function CreatorFilterChips({ members, value, onToggle }: CreatorFilterChipsProps) {
  if (members.length < 2) return null;

  return (
    <div className="flex flex-wrap gap-1.5" data-testid="filter-creator-chips">
      {members.map((member) => {
        const selected = value.includes(member.uid);
        return (
          <button
            key={member.uid}
            type="button"
            data-testid={`filter-creator-${member.uid}`}
            aria-pressed={selected}
            onClick={() => onToggle(member.uid)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border py-1 pl-1 pr-3 text-sm transition-colors',
              selected
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-secondary text-foreground hover:bg-accent'
            )}
          >
            <AuthorAvatar
              author={{ displayName: member.displayName, photoURL: member.photoURL }}
              className="h-6 w-6"
            />
            <span className="max-w-[8rem] truncate">{member.displayName}</span>
            {selected && <Check size={14} aria-hidden />}
          </button>
        );
      })}
    </div>
  );
}
