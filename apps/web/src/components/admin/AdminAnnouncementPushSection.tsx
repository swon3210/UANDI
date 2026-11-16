'use client';

import { useState } from 'react';
import { overlay } from 'overlay-kit';
import { toast } from 'sonner';
import { ANNOUNCEMENTS } from '@/content/announcements';
import {
  useAnnouncementPushLogs,
  useAnnouncementPushPreview,
  useSendAnnouncementPush,
} from '@/hooks/useAdminAnnouncementPush';
import { isNightInKst } from '@/services/admin-announcement-push';
import { AdminAnnouncementPushPanel } from './AdminAnnouncementPushPanel';
import { AdminPushConfirmDialog } from './AdminPushConfirmDialog';

type AdminAnnouncementPushSectionProps = {
  /** 사용자 탭에서 고른 대상 */
  selectedUids: string[];
  onGoUsers: () => void;
};

/** 「공지 푸시」 탭 — 미리보기·발송·기록을 불러와 패널에 넘긴다(docs/pages/10-announcement-push.md). */
export function AdminAnnouncementPushSection({
  selectedUids,
  onGoUsers,
}: AdminAnnouncementPushSectionProps) {
  const [announcementId, setAnnouncementId] = useState<string | null>(null);
  const preview = useAnnouncementPushPreview(announcementId, selectedUids);
  const logs = useAnnouncementPushLogs();
  const send = useSendAnnouncementPush();

  const announcement = ANNOUNCEMENTS.find((a) => a.id === announcementId) ?? null;

  const handleSend = async () => {
    const eligible = preview.data?.eligibleCount ?? 0;
    if (!announcement || eligible === 0) return;
    const confirmed = await overlay.openAsync<boolean>(({ isOpen, close, unmount }) => (
      <AdminPushConfirmDialog
        isOpen={isOpen}
        announcementTitle={announcement.title}
        count={eligible}
        isNight={isNightInKst()}
        onConfirm={() => {
          close(true);
          setTimeout(unmount, 300);
        }}
        onCancel={() => {
          close(false);
          setTimeout(unmount, 300);
        }}
      />
    ));
    if (!confirmed) return;

    try {
      const result = await send.mutateAsync({
        announcementId: announcement.id,
        uids: selectedUids,
      });
      const failed = result.failureCount ?? 0;
      toast.success(
        `${result.sentUserCount ?? 0}명에게 보냈어요${failed > 0 ? ` · 기기 ${failed}대 실패` : ''}`
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '보내지 못했어요');
    }
  };

  return (
    <AdminAnnouncementPushPanel
      announcements={ANNOUNCEMENTS}
      announcementId={announcementId}
      onAnnouncementChange={setAnnouncementId}
      selectedCount={selectedUids.length}
      onGoUsers={onGoUsers}
      preview={preview.data ?? null}
      previewLoading={preview.isFetching}
      previewError={preview.error ? preview.error.message : null}
      sending={send.isPending}
      onSend={() => void handleSend()}
      logs={logs.data}
      logsLoading={logs.isLoading}
    />
  );
}
