import Image from 'next/image';
import { Badge, Button, type BadgeProps } from '@uandi/ui';
import type { Announcement, AnnouncementKind } from '@/content/announcements';

const KIND_BADGE: Record<AnnouncementKind, { label: string; variant: BadgeProps['variant'] }> = {
  new: { label: '새 기능', variant: 'default' },
  changed: { label: '바뀌었어요', variant: 'secondary' },
  fixed: { label: '고쳤어요', variant: 'secondary' },
  ended: { label: '종료', variant: 'outline' },
};

/** 'YYYY-MM-DD' → 'YYYY.MM.DD' */
function formatAnnouncementDate(date: string) {
  return date.replaceAll('-', '.');
}

type AnnouncementItemProps = {
  announcement: Announcement;
  /** 바로 가기 버튼을 눌렀을 때. 이동(및 시트 닫기)은 호출 측이 한다 */
  onLinkClick?: (href: string) => void;
};

/** 공지 한 건 — 배지·날짜·제목·본문·바로 가기. 공지 시트와 공지사항 목록이 함께 쓴다. */
export function AnnouncementItem({ announcement, onLinkClick }: AnnouncementItemProps) {
  const { kind, date, title, body, link, image } = announcement;
  const badge = kind ? KIND_BADGE[kind] : null;

  return (
    <article className="space-y-2" data-testid="announcement-item">
      <div className="flex items-center gap-2">
        {badge ? (
          <Badge variant={badge.variant} data-testid="announcement-badge">
            {badge.label}
          </Badge>
        ) : null}
        <time dateTime={date} className="text-xs text-muted-foreground">
          {formatAnnouncementDate(date)}
        </time>
      </div>
      <h3
        className="break-keep text-base font-semibold leading-snug"
        data-testid="announcement-title"
      >
        {title}
      </h3>
      <p className="whitespace-pre-line break-keep text-sm text-muted-foreground">{body}</p>
      {image ? (
        <Image
          src={image.src}
          alt={image.alt}
          width={image.width}
          height={image.height}
          sizes="(max-width: 448px) 100vw, 448px"
          className="w-full rounded-xl border border-border bg-secondary"
          data-testid="announcement-image"
        />
      ) : null}
      {link ? (
        <Button
          variant="outline"
          size="sm"
          data-testid="announcement-link"
          onClick={() => onLinkClick?.(link.href)}
        >
          {link.label}
        </Button>
      ) : null}
    </article>
  );
}
