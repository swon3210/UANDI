import type { ReactNode } from 'react';
import { ExternalLink } from 'lucide-react';
import { Badge } from '../../components/badge';

export type LinkPostCardProps = {
  title: string;
  /** 짧은 발췌 (저작권 가드레일: 인용 범위만) */
  body: string;
  siteName: string;
  ogImageUrl?: string | null;
  /** 원문 링크 — 우리 서버에 복제하지 않고 그대로 링크아웃한다. */
  url: string;
  timeLabel: string;
  actionSlot?: ReactNode;
};

export function LinkPostCard({
  title,
  body,
  siteName,
  ogImageUrl,
  url,
  timeLabel,
  actionSlot,
}: LinkPostCardProps) {
  return (
    <article
      data-testid="community-post-card"
      data-type="scraped"
      className="space-y-3 rounded-xl border border-border bg-card p-4"
    >
      <div className="flex items-center justify-between gap-2">
        <Badge variant="secondary">{siteName}</Badge>
        {actionSlot}
      </div>
      <h3 className="text-base font-semibold leading-snug text-foreground">{title}</h3>
      {ogImageUrl ? (
        <img
          src={ogImageUrl}
          alt=""
          referrerPolicy="no-referrer"
          loading="lazy"
          className="w-full rounded-lg"
        />
      ) : null}
      {body ? <p className="line-clamp-3 text-sm text-muted-foreground">{body}</p> : null}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{timeLabel}</span>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
        >
          원문 보기 <ExternalLink size={12} />
        </a>
      </div>
    </article>
  );
}
