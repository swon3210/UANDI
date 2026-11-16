'use client';

import dayjs from 'dayjs';
import { Send, Users } from 'lucide-react';
import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
} from '@uandi/ui';
import type { Announcement } from '@/content/announcements';
import type {
  AnnouncementPushCounts,
  AnnouncementPushLog,
} from '@/services/admin-announcement-push';

const COUNT_ROWS: { key: keyof AnnouncementPushCounts; label: string; testId: string }[] = [
  { key: 'targetCount', label: '대상', testId: 'target' },
  { key: 'alreadySentCount', label: '이미 보냄', testId: 'already-sent' },
  { key: 'optedOutCount', label: '공지 알림 끔', testId: 'opted-out' },
  { key: 'noTokenCount', label: '기기 없음', testId: 'no-token' },
];

export type AdminAnnouncementPushPanelProps = {
  announcements: Announcement[];
  announcementId: string | null;
  onAnnouncementChange: (id: string) => void;
  /** 사용자 탭에서 고른 인원 */
  selectedCount: number;
  onGoUsers: () => void;
  /** 서버 미리보기(dryRun). 공지·대상이 없으면 null */
  preview: AnnouncementPushCounts | null;
  previewLoading: boolean;
  previewError?: string | null;
  sending: boolean;
  onSend: () => void;
  logs: AnnouncementPushLog[] | undefined;
  logsLoading: boolean;
};

/** 어드민 「공지 푸시」 탭 본문 — 공지 고르기 · 대상 · 미리보기 · 보내기 · 보낸 기록. */
export function AdminAnnouncementPushPanel({
  announcements,
  announcementId,
  onAnnouncementChange,
  selectedCount,
  onGoUsers,
  preview,
  previewLoading,
  previewError,
  sending,
  onSend,
  logs,
  logsLoading,
}: AdminAnnouncementPushPanelProps) {
  const announcement = announcements.find((a) => a.id === announcementId) ?? null;
  const eligible = preview?.eligibleCount ?? 0;
  const canSend = !!announcement && selectedCount > 0 && !previewLoading && eligible > 0;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <section className="space-y-5 rounded-xl border border-border bg-card p-4">
        <p className="text-xs text-muted-foreground">
          버그 수정·기능 변경 같은 정보성 공지만 보내요. 이벤트·홍보 같은 광고성 내용은 보내지
          마세요.
        </p>

        {/* 1. 공지 */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">공지</h3>
          <Select value={announcementId ?? ''} onValueChange={onAnnouncementChange}>
            <SelectTrigger aria-label="보낼 공지" data-testid="admin-push-announcement">
              <SelectValue placeholder="보낼 공지를 골라 주세요" />
            </SelectTrigger>
            <SelectContent>
              {announcements.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.title} · {a.date.replaceAll('-', '.')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {announcement ? (
            <div
              className="rounded-lg bg-muted p-3 text-sm"
              data-testid="admin-push-message"
              aria-label="푸시 미리보기"
            >
              <p className="font-semibold break-keep">{announcement.title}</p>
              <p className="text-muted-foreground break-keep">{announcement.body.split('\n')[0]}</p>
            </div>
          ) : null}
        </div>

        {/* 2. 대상 */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">대상</h3>
          {selectedCount > 0 ? (
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm">사용자 탭에서 고른 {selectedCount}명</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={onGoUsers}
                data-testid="admin-push-go-users"
              >
                바꾸기
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2 rounded-lg border border-dashed border-border p-3">
              <p className="text-sm text-muted-foreground">사용자 탭에서 대상을 골라 주세요</p>
              <Button
                variant="outline"
                size="sm"
                className="gap-1"
                onClick={onGoUsers}
                data-testid="admin-push-go-users"
              >
                <Users size={14} aria-hidden />
                사용자 탭으로
              </Button>
            </div>
          )}
        </div>

        {/* 3. 미리보기 */}
        {announcement && selectedCount > 0 ? (
          <div className="space-y-2" data-testid="admin-push-preview">
            <h3 className="text-sm font-semibold">확인</h3>
            {previewError ? (
              <p className="text-sm text-destructive">{previewError}</p>
            ) : previewLoading || !preview ? (
              <Skeleton className="h-28 w-full" />
            ) : (
              <dl className="divide-y divide-border rounded-lg border border-border text-sm">
                {COUNT_ROWS.map(({ key, label, testId }) => (
                  <div key={key} className="flex items-center justify-between px-3 py-2">
                    <dt className="text-muted-foreground">
                      {label}
                      {key !== 'targetCount' ? ' (제외)' : ''}
                    </dt>
                    <dd className="tabular-nums" data-testid={`admin-push-count-${testId}`}>
                      {preview[key]}
                    </dd>
                  </div>
                ))}
                <div className="flex items-center justify-between px-3 py-2 font-semibold">
                  <dt>보낼 수 있음</dt>
                  <dd className="tabular-nums" data-testid="admin-push-count-eligible">
                    {preview.eligibleCount}
                  </dd>
                </div>
              </dl>
            )}
          </div>
        ) : null}

        {/* 4. 보내기 */}
        <Button
          className="w-full gap-2"
          disabled={!canSend || sending}
          onClick={onSend}
          data-testid="admin-push-send"
        >
          <Send size={16} aria-hidden />
          {sending ? '보내는 중…' : `${eligible}명에게 보내기`}
        </Button>
      </section>

      {/* 5. 보낸 기록 */}
      <section className="space-y-3" data-testid="admin-push-history">
        <h3 className="text-sm font-semibold">보낸 기록</h3>
        {logsLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : !logs || logs.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            아직 보낸 공지 푸시가 없어요
          </p>
        ) : (
          <ul className="divide-y divide-border rounded-xl border border-border bg-card">
            {logs.map((log) => (
              <li key={log.id} className="space-y-1 px-4 py-3" data-testid="admin-push-log">
                <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                  <time className="tabular-nums">
                    {log.createdAt ? dayjs(log.createdAt).format('YYYY.MM.DD HH:mm') : '-'}
                  </time>
                  <span className="truncate">{log.sentByEmail}</span>
                </div>
                <p className="text-sm font-medium break-keep">{log.announcementTitle}</p>
                <p className="text-xs text-muted-foreground tabular-nums">
                  {log.sentUserCount}명 받음 / 대상 {log.targetCount}명
                  {log.failureCount > 0 ? ` · 기기 ${log.failureCount}대 실패` : ''}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
