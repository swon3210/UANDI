import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Timestamp } from 'firebase/firestore';
import { toast } from 'sonner';
import {
  getSettlement,
  addAttachment,
  removeAttachment,
  updateAttachmentMonths,
  completeSettlement,
  redoSettlement,
  monthKeyOf,
} from '@/services/cashbook-settlement';
import { syncAttachments, type AttachmentSyncResult } from '@/services/ai';
import {
  uploadSettlementAttachment,
  deleteSettlementAttachment,
} from '@/lib/firebase/storage';
import type {
  SettlementAttachment,
  SettlementImageKind,
  SettlementReportSnapshot,
} from '@/types';

const QUERY_KEY = 'cashbookSettlement';

export { monthKeyOf };

export function useSettlement(coupleId: string | null, monthKey: string) {
  return useQuery({
    queryKey: [QUERY_KEY, coupleId, monthKey],
    queryFn: () => getSettlement(coupleId!, monthKey),
    enabled: !!coupleId,
  });
}

function genAttachmentId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function useAddSettlementAttachment(coupleId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      year,
      month,
      file,
      kind,
      onProgress,
    }: {
      year: number;
      month: number;
      file: File;
      kind: SettlementImageKind;
      onProgress?: (percent: number) => void;
    }): Promise<SettlementAttachment> => {
      const monthKey = monthKeyOf(year, month);
      const attachmentId = genAttachmentId();
      const { url, storagePath } = await uploadSettlementAttachment({
        coupleId: coupleId!,
        monthKey,
        attachmentId,
        file,
        onProgress,
      });
      const attachment: SettlementAttachment = {
        id: attachmentId,
        storagePath,
        url,
        name: file.name,
        kind,
        createdAt: Timestamp.now(),
      };
      await addAttachment(coupleId!, year, month, attachment);
      return attachment;
    },
    onSuccess: (_a, vars) =>
      qc.invalidateQueries({
        queryKey: [QUERY_KEY, coupleId, monthKeyOf(vars.year, vars.month)],
      }),
    onError: () => toast.error('첨부 업로드에 실패했어요. 다시 시도해주세요.'),
  });
}

export function useRemoveSettlementAttachment(coupleId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      monthKey,
      attachment,
    }: {
      monthKey: string;
      attachment: SettlementAttachment;
    }) => {
      await removeAttachment(coupleId!, monthKey, attachment.id);
      // Storage 객체는 누락돼도 결산 진행을 막지 않도록 무시
      try {
        await deleteSettlementAttachment(attachment.storagePath);
      } catch {
        /* ignore */
      }
    },
    onSuccess: (_d, vars) =>
      qc.invalidateQueries({ queryKey: [QUERY_KEY, coupleId, vars.monthKey] }),
    onError: () => toast.error('첨부 삭제에 실패했어요. 다시 시도해주세요.'),
  });
}

const ANALYZE_KEY = 'cashbookSettlementAnalyze';

/**
 * 첨부 이미지 전체를 한 번에 분석한다(시트 오픈 시 1회 자동 실행).
 * 분석 후 각 첨부의 detectedMonths(거래 월 집합)를 Firestore에 영속하고 결산 쿼리를 무효화한다.
 * gcTime/staleTime 0 + 별도 키 네임스페이스로 결산 쿼리 무효화와 충돌하지 않는다.
 */
export function useAnalyzeAttachments(
  coupleId: string | null,
  monthKey: string,
  attachments: SettlementAttachment[],
  categories: string[]
) {
  const qc = useQueryClient();
  const ids = attachments.map((a) => a.id).join(',');
  return useQuery({
    queryKey: [ANALYZE_KEY, coupleId, monthKey, ids],
    queryFn: async (): Promise<AttachmentSyncResult[]> => {
      const results = await syncAttachments(
        attachments.map((a) => ({
          id: a.id,
          url: a.url,
          kind: a.kind === 'card' ? 'card' : 'account',
        })),
        categories
      );
      const monthsById: Record<string, string[]> = {};
      for (const r of results) monthsById[r.attachmentId] = r.detectedMonths;
      await updateAttachmentMonths(coupleId!, monthKey, monthsById);
      qc.invalidateQueries({ queryKey: [QUERY_KEY, coupleId, monthKey] });
      return results;
    },
    enabled: !!coupleId && attachments.length > 0,
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: false,
    retry: false,
  });
}

export function useCompleteSettlement(coupleId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      year,
      month,
      report,
      attachments,
    }: {
      year: number;
      month: number;
      report: Omit<SettlementReportSnapshot, 'completedAt'>;
      attachments: SettlementAttachment[];
    }) => {
      // 첨부 Storage 객체 일괄 삭제 (각각 무시)
      await Promise.all(
        attachments.map((a) => deleteSettlementAttachment(a.storagePath).catch(() => {}))
      );
      await completeSettlement(coupleId!, year, month, report);
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({
        queryKey: [QUERY_KEY, coupleId, monthKeyOf(vars.year, vars.month)],
      });
      toast.success('결산을 완료했어요');
    },
    onError: () => toast.error('결산 완료에 실패했어요. 다시 시도해주세요.'),
  });
}

export function useRedoSettlement(coupleId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (monthKey: string) => redoSettlement(coupleId!, monthKey),
    onSuccess: (_d, monthKey) =>
      qc.invalidateQueries({ queryKey: [QUERY_KEY, coupleId, monthKey] }),
    onError: () => toast.error('다시 결산하기에 실패했어요. 다시 시도해주세요.'),
  });
}
