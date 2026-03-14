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
  type DocumentSnapshot,
  type QueryConstraint,
} from 'firebase/firestore';
import { getDb } from '@/lib/firebase/config';
import type { Photo } from '@/types';

function photosCol(coupleId: string) {
  return collection(getDb(), `couples/${coupleId}/photos`);
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

export async function getPhotos(
  coupleId: string,
  cursor?: DocumentSnapshot
): Promise<PhotoPage> {
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
  _cursor?: DocumentSnapshot
): Promise<PhotoPage> {
  // where + orderBy(다른 필드)는 복합 인덱스 필요 → where만 사용 후 클라이언트 정렬
  const q = query(photosCol(coupleId), where('folderId', '==', folderId));
  const snap = await getDocs(q);
  const photos = snap.docs
    .map((d) => ({ id: d.id, ...d.data() }) as Photo)
    .sort((a, b) => {
      const aTime = a.takenAt && 'toMillis' in a.takenAt ? a.takenAt.toMillis() : 0;
      const bTime = b.takenAt && 'toMillis' in b.takenAt ? b.takenAt.toMillis() : 0;
      return bTime - aTime;
    });

  return { photos, lastDoc: null };
}

export async function getPhotosByTag(
  coupleId: string,
  tagName: string,
  _cursor?: DocumentSnapshot
): Promise<PhotoPage> {
  // where(array-contains) + orderBy(다른 필드)는 복합 인덱스 필요 → where만 사용 후 클라이언트 정렬
  const q = query(photosCol(coupleId), where('tags', 'array-contains', tagName));
  const snap = await getDocs(q);
  const photos = snap.docs
    .map((d) => ({ id: d.id, ...d.data() }) as Photo)
    .sort((a, b) => {
      const aTime = a.takenAt && 'toMillis' in a.takenAt ? a.takenAt.toMillis() : 0;
      const bTime = b.takenAt && 'toMillis' in b.takenAt ? b.takenAt.toMillis() : 0;
      return bTime - aTime;
    });

  return { photos, lastDoc: null };
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
  await updateDoc(docRef, updates);
}

// --- 삭제 ---

export async function deletePhotoDoc(coupleId: string, photoId: string): Promise<void> {
  const docRef = doc(getDb(), `couples/${coupleId}/photos/${photoId}`);
  await deleteDoc(docRef);
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
  // orderBy('takenAt', 'desc')로 최신 사진부터 → 첫 번째 매칭이 각 폴더 커버
  const q = query(photosCol(coupleId), orderBy('takenAt', 'desc'));
  const snap = await getDocs(q);

  const tagMap = new Map<string, number>();
  const folderCounts: Record<string, number> = {};
  const folderCovers: Record<string, string> = {};

  snap.docs.forEach((d) => {
    const photo = d.data() as Photo;

    // 태그 집계
    if (Array.isArray(photo.tags)) {
      photo.tags.forEach((tag) => {
        tagMap.set(tag, (tagMap.get(tag) ?? 0) + 1);
      });
    }

    // 폴더별 사진 수 + 커버 (최신 사진)
    if (photo.folderId) {
      folderCounts[photo.folderId] = (folderCounts[photo.folderId] ?? 0) + 1;
      if (!folderCovers[photo.folderId] && photo.storageUrl) {
        folderCovers[photo.folderId] = photo.storageUrl;
      }
    }
  });

  const tags = Array.from(tagMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  return { tags, folderCounts, folderCovers };
}
