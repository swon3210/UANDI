import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
  type Firestore,
} from 'firebase/firestore';
import type { CashbookPrediction } from '../types';

function predictionsCol(db: Firestore, coupleId: string) {
  return collection(db, `couples/${coupleId}/cashbookPredictions`);
}

/** 날짜 범위의 모든 예측(상태 무관). 캘린더/회고가 클라이언트에서 상태별 분기한다. */
export async function getPredictionsInRange(
  db: Firestore,
  coupleId: string,
  start: Date,
  end: Date
): Promise<CashbookPrediction[]> {
  const q = query(
    predictionsCol(db, coupleId),
    where('date', '>=', Timestamp.fromDate(start)),
    where('date', '<=', Timestamp.fromDate(end)),
    orderBy('date', 'asc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as CashbookPrediction);
}

/** status='predicted'인 미확정 예측만 from(포함) 이후로 조회. (status ASC, date ASC) 복합 인덱스 사용. */
export async function getActivePredictions(
  db: Firestore,
  coupleId: string,
  from: Date
): Promise<CashbookPrediction[]> {
  const q = query(
    predictionsCol(db, coupleId),
    where('status', '==', 'predicted'),
    where('date', '>=', Timestamp.fromDate(from)),
    orderBy('date', 'asc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as CashbookPrediction);
}

export async function addPrediction(
  db: Firestore,
  coupleId: string,
  data: Omit<CashbookPrediction, 'id' | 'coupleId' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const now = Timestamp.now();
  const docRef = await addDoc(predictionsCol(db, coupleId), {
    ...data,
    coupleId,
    createdAt: now,
    updatedAt: now,
  });
  return docRef.id;
}

export async function updatePrediction(
  db: Firestore,
  coupleId: string,
  predictionId: string,
  data: Partial<
    Pick<
      CashbookPrediction,
      | 'status'
      | 'type'
      | 'amount'
      | 'category'
      | 'description'
      | 'date'
      | 'confidence'
      | 'rejectedUntil'
      | 'linkedEntryId'
      | 'promptDismissed'
    >
  >
): Promise<void> {
  const ref = doc(db, `couples/${coupleId}/cashbookPredictions/${predictionId}`);
  await updateDoc(ref, { ...data, updatedAt: Timestamp.now() });
}

export async function deletePrediction(
  db: Firestore,
  coupleId: string,
  predictionId: string
): Promise<void> {
  const ref = doc(db, `couples/${coupleId}/cashbookPredictions/${predictionId}`);
  await deleteDoc(ref);
}

/**
 * 같은 recurrenceKey의 가장 최근 예측 1건을 조회한다.
 * 자동감지(§7-1)가 중복 생성·30일 거절 게이트(SYNC-04)를 판단하는 데 사용.
 */
export async function getPredictionByRecurrenceKey(
  db: Firestore,
  coupleId: string,
  recurrenceKey: string
): Promise<CashbookPrediction | null> {
  const q = query(
    predictionsCol(db, coupleId),
    where('recurrenceKey', '==', recurrenceKey),
    orderBy('date', 'desc'),
    limit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() } as CashbookPrediction;
}
