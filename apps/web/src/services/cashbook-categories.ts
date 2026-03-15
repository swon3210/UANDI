import {
  collection,
  query,
  orderBy,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import { getDb } from '@/lib/firebase/config';
import type { CashbookCategory } from '@/types';
import { DEFAULT_CATEGORIES } from '@/constants/default-categories';

function categoriesCol(coupleId: string) {
  return collection(getDb(), `couples/${coupleId}/cashbookCategories`);
}

export async function getCategories(coupleId: string): Promise<CashbookCategory[]> {
  const q = query(categoriesCol(coupleId), orderBy('group'), orderBy('sortOrder'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as CashbookCategory);
}

export async function addCategory(
  coupleId: string,
  data: Omit<CashbookCategory, 'id' | 'coupleId' | 'createdAt'>
): Promise<string> {
  const docRef = await addDoc(categoriesCol(coupleId), {
    ...data,
    coupleId,
    createdAt: Timestamp.now(),
  });
  return docRef.id;
}

export async function updateCategory(
  coupleId: string,
  categoryId: string,
  data: Partial<Pick<CashbookCategory, 'name' | 'icon' | 'color' | 'subGroup' | 'sortOrder'>>
): Promise<void> {
  const ref = doc(getDb(), `couples/${coupleId}/cashbookCategories/${categoryId}`);
  await updateDoc(ref, data);
}

export async function deleteCategory(coupleId: string, categoryId: string): Promise<void> {
  const ref = doc(getDb(), `couples/${coupleId}/cashbookCategories/${categoryId}`);
  await deleteDoc(ref);
}

export async function initDefaultCategories(coupleId: string): Promise<void> {
  const db = getDb();
  const batch = writeBatch(db);

  for (const cat of DEFAULT_CATEGORIES) {
    const ref = doc(categoriesCol(coupleId));
    batch.set(ref, {
      ...cat,
      coupleId,
      isDefault: true,
      createdAt: Timestamp.now(),
    });
  }

  await batch.commit();
}
