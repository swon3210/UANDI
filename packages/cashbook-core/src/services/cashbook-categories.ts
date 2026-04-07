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
  type Firestore,
} from 'firebase/firestore';
import type { CashbookCategory } from '../types.js';
import { DEFAULT_CATEGORIES } from '../constants/default-categories.js';

function categoriesCol(db: Firestore, coupleId: string) {
  return collection(db, `couples/${coupleId}/cashbookCategories`);
}

export async function getCategories(
  db: Firestore,
  coupleId: string
): Promise<CashbookCategory[]> {
  const q = query(categoriesCol(db, coupleId), orderBy('group'), orderBy('sortOrder'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as CashbookCategory);
}

export async function addCategory(
  db: Firestore,
  coupleId: string,
  data: Omit<CashbookCategory, 'id' | 'coupleId' | 'createdAt'>
): Promise<string> {
  const docRef = await addDoc(categoriesCol(db, coupleId), {
    ...data,
    coupleId,
    createdAt: Timestamp.now(),
  });
  return docRef.id;
}

export async function updateCategory(
  db: Firestore,
  coupleId: string,
  categoryId: string,
  data: Partial<Pick<CashbookCategory, 'name' | 'icon' | 'color' | 'subGroup' | 'sortOrder'>>
): Promise<void> {
  const ref = doc(db, `couples/${coupleId}/cashbookCategories/${categoryId}`);
  await updateDoc(ref, data);
}

export async function deleteCategory(
  db: Firestore,
  coupleId: string,
  categoryId: string
): Promise<void> {
  const ref = doc(db, `couples/${coupleId}/cashbookCategories/${categoryId}`);
  await deleteDoc(ref);
}

export async function initDefaultCategories(
  db: Firestore,
  coupleId: string
): Promise<void> {
  const batch = writeBatch(db);

  for (const cat of DEFAULT_CATEGORIES) {
    const ref = doc(categoriesCol(db, coupleId));
    batch.set(ref, {
      ...cat,
      coupleId,
      isDefault: true,
      createdAt: Timestamp.now(),
    });
  }

  await batch.commit();
}
