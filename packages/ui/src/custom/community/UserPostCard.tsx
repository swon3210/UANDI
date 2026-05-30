import type { ReactNode } from 'react';
import { PostAuthor, type PostAuthorProps } from './PostAuthor';

export type UserPostCardProps = {
  author: PostAuthorProps;
  body: string;
  imageUrl?: string | null;
  /** [⋯] 액션 메뉴 슬롯 (Phase 3/4에서 ReportMenu/삭제 주입) */
  actionSlot?: ReactNode;
};

export function UserPostCard({ author, body, imageUrl, actionSlot }: UserPostCardProps) {
  return (
    <article
      data-testid="community-post-card"
      data-type="user"
      className="space-y-3 rounded-xl border border-border bg-card p-4"
    >
      <div className="flex items-start justify-between gap-2">
        <PostAuthor {...author} />
        {actionSlot}
      </div>
      <p className="whitespace-pre-wrap text-sm text-foreground">{body}</p>
      {imageUrl ? (
        <img
          src={imageUrl}
          alt=""
          referrerPolicy="no-referrer"
          loading="lazy"
          className="w-full rounded-lg"
        />
      ) : null}
    </article>
  );
}
