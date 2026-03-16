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
  type DocumentSnapshot,
} from 'firebase/firestore';
import { getDb } from '@/lib/firebase/config';
import type { Folder } from '@/types';

function foldersCol(coupleId: string) {
  return collection(getDb(), `couples/${coupleId}/folders`);
}

const FOLDER_PAGE_SIZE = 20;

export type FolderPage = {
  folders: Folder[];
  lastDoc: DocumentSnapshot | null;
};

export async function getFolders(
  coupleId: string,
  cursor?: DocumentSnapshot
): Promise<FolderPage> {
  const q = cursor
    ? query(foldersCol(coupleId), orderBy('createdAt', 'desc'), startAfter(cursor), limit(FOLDER_PAGE_SIZE))
    : query(foldersCol(coupleId), orderBy('createdAt', 'desc'), limit(FOLDER_PAGE_SIZE));
  const snap = await getDocs(q);
  const folders = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Folder);
  const lastDoc = snap.docs[snap.docs.length - 1] ?? null;

  return { folders, lastDoc };
}

/** 전체 폴더 목록 (업로드 시트 등에서 사용) */
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

export async function createFolder(coupleId: string, name: string, userId: string): Promise<string> {
  const ref = await addDoc(foldersCol(coupleId), {
    coupleId,
    name,
    createdBy: userId,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function renameFolder(coupleId: string, folderId: string, newName: string): Promise<void> {
  await updateDoc(doc(getDb(), `couples/${coupleId}/folders/${folderId}`), { name: newName });
}

export async function deleteFolder(coupleId: string, folderId: string): Promise<void> {
  // 폴더 내 사진 수 확인
  const photosQuery = query(
    collection(getDb(), `couples/${coupleId}/photos`),
    where('folderId', '==', folderId)
  );
  const countSnap = await getCountFromServer(photosQuery);
  if (countSnap.data().count > 0) {
    throw new Error('사진을 먼저 다른 폴더로 이동해주세요');
  }
  await deleteDoc(doc(getDb(), `couples/${coupleId}/folders/${folderId}`));
}

export async function getFolderPhotoCount(coupleId: string, folderId: string): Promise<number> {
  const q = query(
    collection(getDb(), `couples/${coupleId}/photos`),
    where('folderId', '==', folderId)
  );
  const snap = await getCountFromServer(q);
  return snap.data().count;
}
