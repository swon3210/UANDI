import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { getDb } from '@/lib/firebase/config';
import type {
  RealEstateHolding,
  RealEstateHoldingInput,
  SavingsAccount,
  SavingsAccountInput,
  StockHolding,
  StockHoldingInput,
} from '@/types';

// 재테크 보유 자산(예적금·주식·부동산) — 개인 소유 (sideHustles/{uid} 하위, 본인만 접근).
// 개인 보유 자산은 수십 건을 넘지 않고 합계 계산에 전체가 필요해 커서 페이지네이션 대신 상한만 둔다.
const MAX_ITEMS = 100;

export type OuterAssetCollection = 'savings' | 'stockHoldings' | 'realEstateHoldings';

type AssetMap = {
  savings: { doc: SavingsAccount; input: SavingsAccountInput };
  stockHoldings: { doc: StockHolding; input: StockHoldingInput };
  realEstateHoldings: { doc: RealEstateHolding; input: RealEstateHoldingInput };
};

function assetCol(coupleId: string, uid: string, name: OuterAssetCollection) {
  return collection(getDb(), `couples/${coupleId}/sideHustles/${uid}/${name}`);
}

export async function listOuterAssets<K extends OuterAssetCollection>(
  coupleId: string,
  uid: string,
  name: K
): Promise<AssetMap[K]['doc'][]> {
  const snap = await getDocs(
    query(assetCol(coupleId, uid, name), orderBy('createdAt', 'asc'), limit(MAX_ITEMS))
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as AssetMap[K]['doc']);
}

export async function addOuterAssets<K extends OuterAssetCollection>(
  coupleId: string,
  uid: string,
  name: K,
  inputs: AssetMap[K]['input'][]
): Promise<void> {
  if (inputs.length === 1) {
    await addDoc(assetCol(coupleId, uid, name), {
      ...inputs[0],
      coupleId,
      uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return;
  }
  const batch = writeBatch(getDb());
  for (const input of inputs) {
    batch.set(doc(assetCol(coupleId, uid, name)), {
      ...input,
      coupleId,
      uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
  await batch.commit();
}

export async function updateOuterAsset<K extends OuterAssetCollection>(
  coupleId: string,
  uid: string,
  name: K,
  id: string,
  input: AssetMap[K]['input']
): Promise<void> {
  await updateDoc(doc(assetCol(coupleId, uid, name), id), {
    ...input,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteOuterAsset(
  coupleId: string,
  uid: string,
  name: OuterAssetCollection,
  id: string
): Promise<void> {
  await deleteDoc(doc(assetCol(coupleId, uid, name), id));
}

const META_KEYS = new Set(['id', 'coupleId', 'uid', 'createdAt', 'updatedAt']);

/** 저장 문서 → 폼 입력값 (메타 필드 제거) */
export function toAssetInput<K extends OuterAssetCollection>(
  asset: AssetMap[K]['doc']
): AssetMap[K]['input'] {
  return Object.fromEntries(
    Object.entries(asset).filter(([key]) => !META_KEYS.has(key))
  ) as AssetMap[K]['input'];
}
