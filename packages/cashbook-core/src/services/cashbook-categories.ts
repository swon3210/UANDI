import {
  collection,
  query,
  where,
  orderBy,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
  writeBatch,
  type Firestore,
} from 'firebase/firestore';
import type { CashbookCategory } from '../types';
import { DEFAULT_CATEGORIES } from '../constants/default-categories';

function categoriesCol(db: Firestore, coupleId: string) {
  return collection(db, `couples/${coupleId}/cashbookCategories`);
}

export async function getCategories(db: Firestore, coupleId: string): Promise<CashbookCategory[]> {
  const q = query(categoriesCol(db, coupleId), orderBy('group'), orderBy('sortOrder'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as CashbookCategory);
}

async function getCategoryById(
  db: Firestore,
  coupleId: string,
  categoryId: string
): Promise<CashbookCategory | null> {
  const ref = doc(db, `couples/${coupleId}/cashbookCategories/${categoryId}`);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as CashbookCategory;
}

async function getChildCategories(
  db: Firestore,
  coupleId: string,
  parentCategoryId: string
): Promise<CashbookCategory[]> {
  const q = query(categoriesCol(db, coupleId), where('parentCategoryId', '==', parentCategoryId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as CashbookCategory);
}

async function findSiblingByName(
  db: Firestore,
  coupleId: string,
  parentCategoryId: string | null,
  name: string,
  group: CashbookCategory['group'],
  subGroup: CashbookCategory['subGroup']
): Promise<CashbookCategory | null> {
  const q = query(
    categoriesCol(db, coupleId),
    where('parentCategoryId', '==', parentCategoryId),
    where('name', '==', name)
  );
  const snap = await getDocs(q);
  for (const d of snap.docs) {
    const c = { id: d.id, ...d.data() } as CashbookCategory;
    // 부모끼리는 같은 group + subGroup 안에서만 충돌, 자식끼리는 같은 부모 안에서만 충돌
    if (parentCategoryId !== null) return c;
    if (c.group === group && c.subGroup === subGroup) return c;
  }
  return null;
}

export async function addCategory(
  db: Firestore,
  coupleId: string,
  data: Omit<CashbookCategory, 'id' | 'coupleId' | 'createdAt'>
): Promise<string> {
  const parentCategoryId = data.parentCategoryId ?? null;

  if (parentCategoryId !== null) {
    const parent = await getCategoryById(db, coupleId, parentCategoryId);
    if (!parent) {
      throw new Error('부모 카테고리를 찾을 수 없습니다');
    }
    if (parent.parentCategoryId !== null) {
      throw new Error('자식 카테고리 아래에는 카테고리를 추가할 수 없습니다');
    }
    if (parent.group !== data.group || parent.subGroup !== data.subGroup) {
      throw new Error('자식 카테고리는 부모와 동일한 group/subGroup이어야 합니다');
    }
  }

  const sibling = await findSiblingByName(
    db,
    coupleId,
    parentCategoryId,
    data.name,
    data.group,
    data.subGroup
  );
  if (sibling) {
    throw new Error('같은 위치에 이미 동일한 이름의 카테고리가 있습니다');
  }

  const docRef = await addDoc(categoriesCol(db, coupleId), {
    ...data,
    parentCategoryId,
    description: data.description ?? '',
    examples: data.examples ?? [],
    coupleId,
    createdAt: Timestamp.now(),
  });
  return docRef.id;
}

export async function updateCategory(
  db: Firestore,
  coupleId: string,
  categoryId: string,
  data: Partial<
    Pick<
      CashbookCategory,
      | 'name'
      | 'icon'
      | 'color'
      | 'subGroup'
      | 'sortOrder'
      | 'description'
      | 'examples'
      | 'recurrence'
      | 'recurrenceSuggestionDismissed'
    >
  >
): Promise<void> {
  if (data.name !== undefined || data.subGroup !== undefined) {
    const current = await getCategoryById(db, coupleId, categoryId);
    if (!current) throw new Error('카테고리를 찾을 수 없습니다');

    const nextName = data.name ?? current.name;
    const nextSubGroup = data.subGroup ?? current.subGroup;
    const sibling = await findSiblingByName(
      db,
      coupleId,
      current.parentCategoryId,
      nextName,
      current.group,
      nextSubGroup
    );
    if (sibling && sibling.id !== categoryId) {
      throw new Error('같은 위치에 이미 동일한 이름의 카테고리가 있습니다');
    }
  }

  const ref = doc(db, `couples/${coupleId}/cashbookCategories/${categoryId}`);
  await updateDoc(ref, data);
}

export async function deleteCategory(
  db: Firestore,
  coupleId: string,
  categoryId: string
): Promise<void> {
  const children = await getChildCategories(db, coupleId, categoryId);

  if (children.length === 0) {
    const ref = doc(db, `couples/${coupleId}/cashbookCategories/${categoryId}`);
    await deleteDoc(ref);
    return;
  }

  const batch = writeBatch(db);
  for (const child of children) {
    batch.delete(doc(db, `couples/${coupleId}/cashbookCategories/${child.id}`));
  }
  batch.delete(doc(db, `couples/${coupleId}/cashbookCategories/${categoryId}`));
  await batch.commit();
}

export async function initDefaultCategories(db: Firestore, coupleId: string): Promise<void> {
  const batch = writeBatch(db);

  for (const cat of DEFAULT_CATEGORIES) {
    const ref = doc(categoriesCol(db, coupleId));
    batch.set(ref, {
      ...cat,
      coupleId,
      isDefault: true,
      parentCategoryId: null,
      createdAt: Timestamp.now(),
    });
  }

  await batch.commit();
}
