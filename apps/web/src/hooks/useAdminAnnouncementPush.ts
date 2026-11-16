import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AdminForbiddenError } from '@/services/admin';
import { fetchAnnouncementPushLogs, pushAnnouncement } from '@/services/admin-announcement-push';

// 어드민 공지 푸시 — docs/pages/10-announcement-push.md
const PREVIEW_KEY = 'adminAnnouncementPushPreview';
const LOGS_KEY = 'adminAnnouncementPushLogs';

const retry = (count: number, error: Error) => !(error instanceof AdminForbiddenError) && count < 1;

/** 발송 전 미리보기(dryRun). 공지와 대상이 있을 때만 조회한다. */
export function useAnnouncementPushPreview(announcementId: string | null, uids: string[]) {
  const sorted = [...uids].sort();
  return useQuery({
    queryKey: [PREVIEW_KEY, announcementId, sorted.join(',')],
    queryFn: () => pushAnnouncement(announcementId!, sorted, true),
    enabled: !!announcementId && sorted.length > 0,
    staleTime: 0,
    refetchOnWindowFocus: false,
    retry,
  });
}

/** 보낸 기록 최근 20건 */
export function useAnnouncementPushLogs() {
  return useQuery({
    queryKey: [LOGS_KEY],
    queryFn: fetchAnnouncementPushLogs,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    retry,
  });
}

export function useSendAnnouncementPush() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ announcementId, uids }: { announcementId: string; uids: string[] }) =>
      pushAnnouncement(announcementId, uids, false),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: [PREVIEW_KEY] });
      void queryClient.invalidateQueries({ queryKey: [LOGS_KEY] });
    },
  });
}
