'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Megaphone } from 'lucide-react';
import { EmptyState, Header } from '@uandi/ui';
import { AnnouncementItem } from '@/components/announcements/AnnouncementItem';
import { BackButton } from '@/components/shell/BackButton';
import { ANNOUNCEMENTS } from '@/content/announcements';
import { useAuth } from '@/hooks/useAuth';
import { useMarkAnnouncementSeen } from '@/hooks/useMarkAnnouncementSeen';

/** 공지사항 — 골라 올린 변경 소식 전체 목록(docs/pages/09-announcements.md). */
export default function AnnouncementsPage() {
  // ?from=push 를 읽으므로(useSearchParams) Suspense 경계가 필요하다
  return (
    <Suspense fallback={null}>
      <AnnouncementsContent />
    </Suspense>
  );
}

function AnnouncementsContent() {
  const router = useRouter();
  // 공지 푸시로 들어왔으면 ←는 보던 화면이 아니라 항상 대시보드(docs/pages/10-announcement-push.md)
  const fromPush = useSearchParams().get('from') === 'push';
  const { user } = useAuth();
  const markSeen = useMarkAnnouncementSeen();

  const uid = user?.uid ?? null;
  const lastSeenAnnouncementId = user?.lastSeenAnnouncementId;
  const latestId = ANNOUNCEMENTS[0]?.id ?? null;

  // 목록을 봤으면 대시보드 공지 시트를 띄우지 않는다 — users 문서(외부 시스템)에 기록
  useEffect(() => {
    if (!uid || !latestId || lastSeenAnnouncementId === latestId) return;
    markSeen(uid, latestId);
  }, [uid, latestId, lastSeenAnnouncementId, markSeen]);

  if (!user) return null;

  return (
    <div className="flex min-h-screen flex-col" data-testid="announcements-page">
      <Header
        title="공지사항"
        data-testid="announcements-header"
        leftSlot={<BackButton alwaysFallback={fromPush} />}
      />
      <main className="mx-auto w-full max-w-md px-4 pb-10 pt-6">
        {ANNOUNCEMENTS.length === 0 ? (
          <EmptyState
            icon={<Megaphone size={40} />}
            title="아직 공지가 없어요"
            description="꼭 알려 드릴 소식이 생기면 여기에 남길게요."
          />
        ) : (
          <div className="space-y-3">
            {ANNOUNCEMENTS.map((announcement) => (
              <div key={announcement.id} className="rounded-xl border border-border bg-card p-4">
                <AnnouncementItem
                  announcement={announcement}
                  onLinkClick={(href) => router.push(href)}
                />
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
