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
import type { AdminUserRow } from '@/services/admin';
import { isNightInKst } from '@/services/admin-announcement-push';
import { AdminAnnouncementPushPanel } from './AdminAnnouncementPushPanel';
import { AdminPushConfirmDialog } from './AdminPushConfirmDialog';
import { AdminUserPickerDialog } from './AdminUserPickerDialog';

type AdminAnnouncementPushSectionProps = {
  /** 어드민 사용자 목록(대상 고르기 다이얼로그에 쓴다) */
  users: AdminUserRow[];
};

/** 「공지 푸시」 탭 — 대상 고르기·미리보기·발송·기록(docs/pages/10-announcement-push.md). */
export function AdminAnnouncementPushSection({ users }: AdminAnnouncementPushSectionProps) {
  const [announcementId, setAnnouncementId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  // 목록이 새로고침돼 없어진 사용자는 대상에서 뺀다
  const selectedUids = users.map((u) => u.uid).filter((uid) => selected.has(uid));

  const preview = useAnnouncementPushPreview(announcementId, selectedUids);
  const logs = useAnnouncementPushLogs();
  const send = useSendAnnouncementPush();

  const announcement = ANNOUNCEMENTS.find((a) => a.id === announcementId) ?? null;

  const handlePickUsers = async () => {
    const picked = await overlay.openAsync<Set<string> | null>(({ isOpen, close, unmount }) => (
      <AdminUserPickerDialog
        isOpen={isOpen}
        users={users}
        initialSelectedUids={new Set(selectedUids)}
        onConfirm={(uids) => {
          close(uids);
          setTimeout(unmount, 300);
        }}
        onCancel={() => {
          close(null);
          setTimeout(unmount, 300);
        }}
      />
    ));
    if (picked) setSelected(picked);
  };

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
      onPickUsers={() => void handlePickUsers()}
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
