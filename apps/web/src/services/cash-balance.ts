import {
  collection,
  query,
  where,
  getDocs,
  setDoc,
  doc,
  Timestamp,
} from 'firebase/firestore';
import { getDb } from '@/lib/firebase/config';
import type { CashBalance } from '@/types';

function balancesCol(coupleId: string) {
  return collection(getDb(), `couples/${coupleId}/cashBalances`);
}

export async function getCashBalances(
  coupleId: string,
  year: number,
  month: number // 1~12
): Promise<CashBalance[]> {
  const q = query(
    balancesCol(coupleId),
    where('year', '==', year),
    where('month', '==', month)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as CashBalance);
}

export async function upsertCashBalance(
  coupleId: string,
  data: Omit<CashBalance, 'id' | 'updatedAt'>
): Promise<string> {
  const balanceId = `${data.categoryId}-${data.year}-${data.month}`;
  const ref = doc(balancesCol(coupleId), balanceId);
  await setDoc(
    ref,
    {
      id: balanceId,
      coupleId,
      ...data,
      updatedAt: Timestamp.now(),
    },
    { merge: true }
  );
  return balanceId;
}
