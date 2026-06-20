'use client';

import { Avatar, AvatarImage, AvatarFallback, cn } from '@uandi/ui';

export type EntryAuthor = {
  displayName: string;
  photoURL: string | null;
};

type AuthorAvatarProps = {
  author?: EntryAuthor;
  /** 아바타 크기 등 추가 클래스. 기본은 작은 사이즈(h-5 w-5). */
  className?: string;
};

/**
 * 가계부 내역 작성자를 작은 아바타로 표시한다.
 * 프로필 사진이 있으면 사진을, 없으면 displayName 첫 글자를 폴백으로 보여준다.
 * (커플 2인 구분이 핵심이라 폴백을 'U' 고정이 아닌 이니셜로 둔다.)
 * author가 없으면 아무것도 렌더하지 않는다.
 */
export function AuthorAvatar({ author, className }: AuthorAvatarProps) {
  if (!author) return null;

  const initial = author.displayName.trim().charAt(0).toUpperCase() || 'U';

  return (
    <Avatar
      className={cn('h-5 w-5', className)}
      data-testid="entry-author-avatar"
      title={author.displayName}
    >
      <AvatarImage src={author.photoURL ?? undefined} alt={author.displayName} />
      <AvatarFallback className="text-[10px]">{initial}</AvatarFallback>
    </Avatar>
  );
}
