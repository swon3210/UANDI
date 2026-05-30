import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getDb } from '@/lib/firebase/config';
import type { AssetAllocationInput, AssetAllocationRatio } from '@/types';

// 재테크 자산 배분 목표 비율 — 개인 소유 (sideHustles/{uid} 하위, 본인만 접근)
function assetAllocationDoc(coupleId: string, uid: string) {
  return doc(getDb(), `couples/${coupleId}/sideHustles/${uid}/config/assetAllocation`);
}

export async function getAssetAllocation(
  coupleId: string,
  uid: string
): Promise<AssetAllocationRatio | null> {
  const snap = await getDoc(assetAllocationDoc(coupleId, uid));
  if (!snap.exists()) return null;
  return snap.data() as AssetAllocationRatio;
}

export async function updateAssetAllocation(
  coupleId: string,
  uid: string,
  data: AssetAllocationInput
): Promise<void> {
  await setDoc(
    assetAllocationDoc(coupleId, uid),
    {
      ...data,
      uid,
      coupleId,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}
