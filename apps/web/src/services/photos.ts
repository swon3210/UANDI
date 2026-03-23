import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  getDoc,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  where,
  startAfter,
  serverTimestamp,
  Timestamp,
  writeBatch,
  getCountFromServer,
  increment,
  deleteField,
  type DocumentSnapshot,
  type QueryConstraint,
} from 'firebase/firestore';
import { getDb } from '@/lib/firebase/config';
import type { Photo } from '@/types';

function photosCol(coupleId: string) {
  return collection(getDb(), `couples/${coupleId}/photos`);
}

/** 태그 카운트 요약 문서 참조 */
function tagCountsRef(coupleId: string) {
  return doc(getDb(), `couples/${coupleId}/meta/tagCounts`);
}

/** 태그 카운트 증감 (delta: +1 또는 -1) */
async function adjustTagCounts(coupleId: string, tags: string[], delta: 1 | -1) {
  if (tags.length === 0) return;
  const ref = tagCountsRef(coupleId);
  const updates: Record<string, ReturnType<typeof increment> | ReturnType<typeof deleteField>> = {};
  tags.forEach((tag) => {
    updates[tag] = increment(delta);
  });
  await setDoc(ref, updates, { merge: true });
}

/** 0 이하인 태그 카운트 정리 */
async function cleanupZeroTags(coupleId: string) {
  const ref = tagCountsRef(coupleId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const data = snap.data() as Record<string, number>;
  const toDelete: Record<string, ReturnType<typeof deleteField>> = {};
  Object.entries(data).forEach(([tag, count]) => {
    if (count <= 0) toDelete[tag] = deleteField();
  });
  if (Object.keys(toDelete).length > 0) {
    await updateDoc(ref, toDelete);
  }
}

export type PhotoPage = {
  photos: Photo[];
  lastDoc: DocumentSnapshot | null;
};

const PAGE_SIZE = 20;

export async function getRecentPhotos(coupleId: string, count = 3): Promise<Photo[]> {
  const q = query(photosCol(coupleId), orderBy('takenAt', 'desc'), limit(count));
  const snap = await getDocs(q);
  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Photo);
}

export async function getPhotos(coupleId: string, cursor?: DocumentSnapshot): Promise<PhotoPage> {
  const constraints: QueryConstraint[] = [orderBy('takenAt', 'desc'), limit(PAGE_SIZE)];
  if (cursor) constraints.push(startAfter(cursor));

  const q = query(photosCol(coupleId), ...constraints);
  const snap = await getDocs(q);
  const photos = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Photo);
  const lastDoc = snap.docs[snap.docs.length - 1] ?? null;

  return { photos, lastDoc };
}

export async function getPhotosByFolder(
  coupleId: string,
  folderId: string,
  cursor?: DocumentSnapshot
): Promise<PhotoPage> {
  // 복합 인덱스: folderId ASC + takenAt DESC (firestore.indexes.json)
  const constraints: QueryConstraint[] = [
    where('folderId', '==', folderId),
    orderBy('takenAt', 'desc'),
    limit(PAGE_SIZE),
  ];
  if (cursor) constraints.push(startAfter(cursor));

  const q = query(photosCol(coupleId), ...constraints);
  const snap = await getDocs(q);
  const photos = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Photo);
  const lastDoc = snap.docs[snap.docs.length - 1] ?? null;

  return { photos, lastDoc };
}

/** 폴더 내 전체 사진 (슬라이드쇼용) */
export async function getAllPhotosByFolder(coupleId: string, folderId: string): Promise<Photo[]> {
  const q = query(
    photosCol(coupleId),
    where('folderId', '==', folderId),
    orderBy('takenAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Photo);
}

export async function getPhotosByTag(
  coupleId: string,
  tagName: string,
  cursor?: DocumentSnapshot
): Promise<PhotoPage> {
  // 복합 인덱스: tags array-contains + takenAt DESC (firestore.indexes.json)
  const constraints: QueryConstraint[] = [
    where('tags', 'array-contains', tagName),
    orderBy('takenAt', 'desc'),
    limit(PAGE_SIZE),
  ];
  if (cursor) constraints.push(startAfter(cursor));

  const q = query(photosCol(coupleId), ...constraints);
  const snap = await getDocs(q);
  const photos = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Photo);
  const lastDoc = snap.docs[snap.docs.length - 1] ?? null;

  return { photos, lastDoc };
}

/** 태그별 전체 사진 (슬라이드쇼용) */
export async function getAllPhotosByTag(coupleId: string, tagName: string): Promise<Photo[]> {
  const q = query(
    photosCol(coupleId),
    where('tags', 'array-contains', tagName),
    orderBy('takenAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Photo);
}

// --- 단건 조회 ---

export async function getPhoto(coupleId: string, photoId: string): Promise<Photo | null> {
  const docRef = doc(getDb(), `couples/${coupleId}/photos/${photoId}`);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Photo;
}

// --- 생성 ---

export type AddPhotoInput = {
  coupleId: string;
  uploadedBy: string;
  folderId: string;
  tags: string[];
  storageUrl: string;
  caption: string;
  takenAt: Date;
  width: number;
  height: number;
};

export async function addPhoto(input: AddPhotoInput): Promise<string> {
  const docRef = doc(collection(getDb(), `couples/${input.coupleId}/photos`));
  const data = {
    id: docRef.id,
    coupleId: input.coupleId,
    uploadedBy: input.uploadedBy,
    folderId: input.folderId,
    tags: input.tags,
    storageUrl: input.storageUrl,
    thumbnailUrl: null,
    caption: input.caption,
    takenAt: Timestamp.fromDate(input.takenAt),
    uploadedAt: serverTimestamp(),
    width: input.width,
    height: input.height,
  };
  await setDoc(docRef, data);
  await adjustTagCounts(input.coupleId, input.tags, 1);
  return docRef.id;
}

// --- 수정 ---

export type UpdatePhotoInput = {
  folderId?: string;
  tags?: string[];
  caption?: string;
};

export async function updatePhoto(
  coupleId: string,
  photoId: string,
  updates: UpdatePhotoInput
): Promise<void> {
  const docRef = doc(getDb(), `couples/${coupleId}/photos/${photoId}`);

  if (updates.tags) {
    const snap = await getDoc(docRef);
    const oldTags: string[] = (snap.data() as Photo)?.tags ?? [];
    const newTags = updates.tags;
    const removed = oldTags.filter((t) => !newTags.includes(t));
    const added = newTags.filter((t) => !oldTags.includes(t));

    await updateDoc(docRef, updates);
    await adjustTagCounts(coupleId, removed, -1);
    await adjustTagCounts(coupleId, added, 1);
    if (removed.length > 0) await cleanupZeroTags(coupleId);
  } else {
    await updateDoc(docRef, updates);
  }
}

// --- 삭제 ---

export async function deletePhotoDoc(coupleId: string, photoId: string): Promise<void> {
  const docRef = doc(getDb(), `couples/${coupleId}/photos/${photoId}`);
  const snap = await getDoc(docRef);
  const tags: string[] = (snap.data() as Photo)?.tags ?? [];

  await deleteDoc(docRef);
  await adjustTagCounts(coupleId, tags, -1);
  if (tags.length > 0) await cleanupZeroTags(coupleId);
}

// --- 일괄 이동 ---

export async function movePhotosToFolder(
  coupleId: string,
  photoIds: string[],
  targetFolderId: string
): Promise<void> {
  const db = getDb();
  const batch = writeBatch(db);
  photoIds.forEach((photoId) => {
    const ref = doc(db, `couples/${coupleId}/photos/${photoId}`);
    batch.update(ref, { folderId: targetFolderId });
  });
  await batch.commit();
}

// --- 사진 통계 (태그 집계 + 폴더별 사진 수 + 커버 URL) ---

export type PhotoStats = {
  tags: { name: string; count: number }[];
  folderCounts: Record<string, number>;
  folderCovers: Record<string, string>;
};

export async function getPhotoStats(coupleId: string): Promise<PhotoStats> {
  // 요약 문서 1개만 읽어서 태그 카운트 반환
  const snap = await getDoc(tagCountsRef(coupleId));
  const data = snap.exists() ? (snap.data() as Record<string, number>) : {};

  const tags = Object.entries(data)
    .filter(([, count]) => count > 0)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  return { tags, folderCounts: {}, folderCovers: {} };
}

// --- 개별 폴더 통계 (사진 수 + 커버) ---

export type FolderStat = {
  count: number;
  coverUrl: string | null;
};

export async function getFolderStat(coupleId: string, folderId: string): Promise<FolderStat> {
  const countQuery = query(photosCol(coupleId), where('folderId', '==', folderId));
  const coverQuery = query(photosCol(coupleId), where('folderId', '==', folderId), limit(1));

  const [countSnap, coverSnap] = await Promise.all([
    getCountFromServer(countQuery),
    getDocs(coverQuery),
  ]);

  const coverPhoto = coverSnap.docs[0]?.data() as Photo | undefined;

  return {
    count: countSnap.data().count,
    coverUrl: coverPhoto?.storageUrl ?? null,
  };
}
