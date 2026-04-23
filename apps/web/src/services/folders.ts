import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  orderBy,
  where,
  limit,
  startAfter,
  serverTimestamp,
  getCountFromServer,
  documentId,
  type DocumentSnapshot,
} from 'firebase/firestore';
import { getDb } from '@/lib/firebase/config';
import { deletePhotoFile } from '@/lib/firebase/storage';
import { MAX_FOLDER_DEPTH, type Folder, type Photo } from '@/types';
import { deletePhotoDoc } from '@/services/photos';

function foldersCol(coupleId: string) {
  return collection(getDb(), `couples/${coupleId}/folders`);
}

function photosCol(coupleId: string) {
  return collection(getDb(), `couples/${coupleId}/photos`);
}

const FOLDER_PAGE_SIZE = 20;
const PHOTO_DELETE_CONCURRENCY = 5;

export type FolderPage = {
  folders: Folder[];
  lastDoc: DocumentSnapshot | null;
};

export async function getFoldersByParent(
  coupleId: string,
  parentFolderId: string | null,
  cursor?: DocumentSnapshot
): Promise<FolderPage> {
  const constraints = [
    where('parentFolderId', '==', parentFolderId),
    orderBy('createdAt', 'desc'),
    limit(FOLDER_PAGE_SIZE),
  ];
  const q = cursor
    ? query(foldersCol(coupleId), ...constraints, startAfter(cursor))
    : query(foldersCol(coupleId), ...constraints);
  const snap = await getDocs(q);
  const folders = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Folder);
  const lastDoc = snap.docs[snap.docs.length - 1] ?? null;
  return { folders, lastDoc };
}

/** 전체 폴더 목록 (Combobox 등 클라이언트 인덱싱용) */
export async function getAllFolders(coupleId: string): Promise<Folder[]> {
  const q = query(foldersCol(coupleId), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Folder);
}

export async function getFolder(coupleId: string, folderId: string): Promise<Folder | null> {
  const snap = await getDoc(doc(getDb(), `couples/${coupleId}/folders/${folderId}`));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Folder;
}

/** 폴더의 조상(루트→부모 순서)을 반환 */
export async function getFolderAncestors(
  coupleId: string,
  folder: Folder
): Promise<Folder[]> {
  if (folder.path.length === 0) return [];
  // path는 최대 4개 → in 쿼리 한 번으로 처리 가능
  const q = query(foldersCol(coupleId), where(documentId(), 'in', folder.path));
  const snap = await getDocs(q);
  const byId = new Map<string, Folder>();
  snap.docs.forEach((d) => {
    byId.set(d.id, { id: d.id, ...d.data() } as Folder);
  });
  return folder.path
    .map((id) => byId.get(id))
    .filter((f): f is Folder => f != null);
}

export async function createFolder(
  coupleId: string,
  name: string,
  userId: string,
  parentFolderId: string | null = null
): Promise<string> {
  let depth = 0;
  let path: string[] = [];

  if (parentFolderId) {
    const parent = await getFolder(coupleId, parentFolderId);
    if (!parent) {
      throw new Error('상위 폴더를 찾을 수 없어요');
    }
    depth = parent.depth + 1;
    if (depth > MAX_FOLDER_DEPTH) {
      throw new Error('폴더는 최대 5단계까지 만들 수 있어요');
    }
    path = [...parent.path, parent.id];
  }

  const ref = await addDoc(foldersCol(coupleId), {
    coupleId,
    name,
    createdBy: userId,
    createdAt: serverTimestamp(),
    parentFolderId,
    depth,
    path,
  });
  return ref.id;
}

export async function renameFolder(
  coupleId: string,
  folderId: string,
  newName: string
): Promise<void> {
  await updateDoc(doc(getDb(), `couples/${coupleId}/folders/${folderId}`), { name: newName });
}

/** 특정 폴더의 하위(재귀) 폴더 전체 */
async function getDescendantFolders(coupleId: string, folderId: string): Promise<Folder[]> {
  const q = query(foldersCol(coupleId), where('path', 'array-contains', folderId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Folder);
}

/** 폴더 id 목록에 속한 사진 전부 */
async function getPhotosInFolders(coupleId: string, folderIds: string[]): Promise<Photo[]> {
  if (folderIds.length === 0) return [];
  // Firestore in 연산자는 30개 제한 → 30개씩 청크 분할
  const photos: Photo[] = [];
  const chunkSize = 30;
  for (let i = 0; i < folderIds.length; i += chunkSize) {
    const chunk = folderIds.slice(i, i + chunkSize);
    const q = query(photosCol(coupleId), where('folderId', 'in', chunk));
    const snap = await getDocs(q);
    snap.docs.forEach((d) => photos.push({ id: d.id, ...d.data() } as Photo));
  }
  return photos;
}

/** 동시성 제한된 병렬 처리 */
async function runWithConcurrency<T>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<void>
): Promise<void> {
  let i = 0;
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (i < items.length) {
      const idx = i++;
      await fn(items[idx]);
    }
  });
  await Promise.all(workers);
}

/** 폴더와 그 하위(재귀)를 모두 삭제. 사진은 Storage 파일까지 제거. */
export async function deleteFolder(coupleId: string, folderId: string): Promise<void> {
  const target = await getFolder(coupleId, folderId);
  if (!target) return;

  const descendants = await getDescendantFolders(coupleId, folderId);
  const allFolders = [target, ...descendants];
  const allFolderIds = allFolders.map((f) => f.id);

  const photos = await getPhotosInFolders(coupleId, allFolderIds);

  // 1) 사진 삭제 (Storage + Firestore + 태그 카운트)
  await runWithConcurrency(photos, PHOTO_DELETE_CONCURRENCY, async (photo) => {
    try {
      await deletePhotoFile(coupleId, photo.id, photo.storageUrl);
    } catch {
      // Storage 파일이 없을 수 있음
    }
    await deletePhotoDoc(coupleId, photo.id);
  });

  // 2) 폴더 삭제: 깊은 곳부터 → 루트 (depth 내림차순)
  const sorted = [...allFolders].sort((a, b) => b.depth - a.depth);
  for (const folder of sorted) {
    await deleteDoc(doc(getDb(), `couples/${coupleId}/folders/${folder.id}`));
  }
}

export async function getFolderPhotoCount(coupleId: string, folderId: string): Promise<number> {
  const q = query(photosCol(coupleId), where('folderId', '==', folderId));
  const snap = await getCountFromServer(q);
  return snap.data().count;
}

/** 삭제 확인용: 하위 폴더 수와 사진(자기+하위 전체) 수 */
export async function countFolderDescendants(
  coupleId: string,
  folderId: string
): Promise<{ folders: number; photos: number }> {
  const descendants = await getDescendantFolders(coupleId, folderId);
  const allFolderIds = [folderId, ...descendants.map((f) => f.id)];
  const photos = await getPhotosInFolders(coupleId, allFolderIds);
  return { folders: descendants.length, photos: photos.length };
}
