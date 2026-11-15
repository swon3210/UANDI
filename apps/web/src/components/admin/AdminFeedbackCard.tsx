'use client';

import dayjs from 'dayjs';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@uandi/ui';
import type { AdminFeedbackItem } from '@/services/admin-feedback';
import type { FeedbackStatus, FeedbackType } from '@/types';

export const FEEDBACK_TYPE_LABELS: Record<FeedbackType, string> = {
  bug: '버그',
  idea: '의견',
  other: '기타',
};

export const FEEDBACK_STATUS_LABELS: Record<FeedbackStatus, string> = {
  new: '신규',
  checked: '확인',
  resolved: '해결',
};

const TYPE_BADGE_VARIANT: Record<FeedbackType, 'destructive' | 'default' | 'secondary'> = {
  bug: 'destructive',
  idea: 'default',
  other: 'secondary',
};

const PLATFORM_LABELS: Record<string, string> = { android: 'Android', ios: 'iOS', web: '웹' };

export type AdminFeedbackCardProps = {
  item: AdminFeedbackItem;
  onStatusChange: (status: FeedbackStatus) => void;
  statusPending?: boolean;
};

/** 어드민 피드백 탭의 한 건(docs/pages/07-feedback.md 「어드민」). */
export function AdminFeedbackCard({ item, onStatusChange, statusPending }: AdminFeedbackCardProps) {
  const { author, context } = item;
  const name = author.displayName || author.email || author.uid;
  const showContact = item.contactEmail && item.contactEmail !== author.email;

  return (
    <article
      data-testid="admin-feedback-card"
      className="space-y-3 rounded-xl border border-border bg-card p-4"
    >
      <header className="flex flex-wrap items-center gap-2">
        <Badge variant={TYPE_BADGE_VARIANT[item.type]}>{FEEDBACK_TYPE_LABELS[item.type]}</Badge>
        <span className="text-xs tabular-nums text-muted-foreground">
          {item.createdAt ? dayjs(item.createdAt).format('YYYY.MM.DD HH:mm') : '-'}
        </span>
        <div className="ml-auto w-24">
          <Select
            value={item.status}
            onValueChange={(v) => onStatusChange(v as FeedbackStatus)}
            disabled={statusPending}
          >
            <SelectTrigger data-testid="admin-feedback-status" className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(FEEDBACK_STATUS_LABELS) as FeedbackStatus[]).map((s) => (
                <SelectItem key={s} value={s}>
                  {FEEDBACK_STATUS_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </header>

      <div className="flex items-center gap-2">
        <Avatar className="h-8 w-8">
          {author.photoURL ? <AvatarImage src={author.photoURL} alt="" /> : null}
          <AvatarFallback className="text-xs">{name.slice(0, 1)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 text-sm">
          <p className="truncate font-medium">{author.displayName || '이름 없음'}</p>
          <p className="truncate text-xs text-muted-foreground">
            {author.email ?? '탈퇴한 사용자'}
          </p>
        </div>
      </div>

      {showContact ? (
        <p className="text-xs">
          <span className="text-muted-foreground">답장 이메일 </span>
          <span className="font-medium">{item.contactEmail}</span>
        </p>
      ) : null}

      <p className="whitespace-pre-wrap break-words text-sm">{item.content}</p>

      {item.screenshotUrl ? (
        <a href={item.screenshotUrl} target="_blank" rel="noreferrer" className="inline-block">
          <img
            src={item.screenshotUrl}
            alt="첨부 스크린샷"
            className="h-32 w-32 rounded-lg border border-border object-cover"
          />
        </a>
      ) : null}

      <div className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
        <Badge variant="secondary">{PLATFORM_LABELS[context.platform] ?? context.platform}</Badge>
        {context.appVersion ? <Badge variant="outline">{context.appVersion}</Badge> : null}
        {context.previousPath ? <span>직전 화면 {context.previousPath}</span> : null}
      </div>

      <details className="text-xs text-muted-foreground">
        <summary className="cursor-pointer select-none">기기 정보</summary>
        <p className="mt-1 break-all">{context.userAgent}</p>
        <p>화면 {context.viewport}</p>
      </details>
    </article>
  );
}
