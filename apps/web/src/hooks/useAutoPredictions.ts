'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';
import { Timestamp } from 'firebase/firestore';
import dayjs from 'dayjs';
import { userAtom } from '@/stores/auth.store';
import { useCashbookEntriesInRange } from './useCashbook';
import { getPredictionByRecurrenceKey, addPrediction } from '@/services/predictions';
import { detectRecurringPatterns, buildRecurrenceKey, nextOccurrence } from '@/utils/auto-detect';

const DETECT_MONTHS = 6;

/**
 * §7-1 자동 예측: 가계부 진입 시 1회, 과거 반복 패턴을 감지해 다음 발생일에 auto 예측을 만든다.
 * - 멱등: 같은 recurrenceKey + 같은 타깃 월에 이미 (predicted|confirmed) 예측이 있으면 건너뜀.
 * - 30일 거절 게이트(SYNC-04): rejectedUntil이 미래면 건너뜀.
 * 외부 트리거(페이지 진입)에 반응하는 일회성 동작이라 effect + ref 가드를 쓴다(quickAdd 패턴과 동일).
 */
export function useAutoPredictions(coupleId: string | null) {
  const user = useAtomValue(userAtom);
  const uid = user?.uid ?? '';
  const qc = useQueryClient();

  const range = useMemo(
    () => ({
      from: dayjs().subtract(DETECT_MONTHS, 'month').startOf('month').toDate(),
      to: dayjs().endOf('day').toDate(),
    }),
    []
  );
  const { data: entries } = useCashbookEntriesInRange(coupleId, range.from, range.to);

  const ranRef = useRef(false);
  useEffect(() => {
    if (ranRef.current) return;
    if (!coupleId || !uid || !entries) return;
    ranRef.current = true;

    void (async () => {
      const patterns = detectRecurringPatterns(entries);
      const now = new Date();
      let created = 0;

      for (const pattern of patterns) {
        const key = buildRecurrenceKey(pattern);
        const target = nextOccurrence(pattern.dayOfMonth);
        const existing = await getPredictionByRecurrenceKey(coupleId, key);

        if (existing) {
          // 30일 거절 게이트
          if (existing.rejectedUntil && existing.rejectedUntil.toDate() > now) continue;
          // 같은 타깃 월에 이미 있으면 중복 생성 방지
          const sameMonth = dayjs(existing.date.toDate()).isSame(dayjs(target), 'month');
          if (sameMonth && (existing.status === 'predicted' || existing.status === 'confirmed')) {
            continue;
          }
        }

        await addPrediction(coupleId, {
          createdBy: uid,
          source: 'auto',
          status: 'predicted',
          type: pattern.type,
          amount: pattern.amount,
          category: pattern.category,
          description: '',
          date: Timestamp.fromDate(target),
          recurrenceKey: key,
          confidence: 0.8,
          rejectedUntil: null,
          linkedEntryId: null,
          promptDismissed: false,
        });
        created++;
      }

      if (created > 0) {
        qc.invalidateQueries({ queryKey: ['cashbookPredictions', coupleId] });
      }
    })();
    // 일회성 가드(ranRef)로 충분 — entries 로드 완료 후 1회만 실행
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coupleId, uid, entries]);
}
