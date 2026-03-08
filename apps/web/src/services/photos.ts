import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  where,
  startAfter,
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
  cursor?: DocumentSnapshot
): Promise<PhotoPage> {
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

export async function getPhotosByTag(
  coupleId: string,
  tagName: string,
  cursor?: DocumentSnapshot
): Promise<PhotoPage> {
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

export async function getAllTags(coupleId: string): Promise<{ name: string; count: number }[]> {
  const q = query(photosCol(coupleId));
  const snap = await getDocs(q);
  const tagMap = new Map<string, number>();

  snap.docs.forEach((d) => {
    const photo = d.data() as Photo;
    photo.tags?.forEach((tag) => {
      tagMap.set(tag, (tagMap.get(tag) ?? 0) + 1);
    });
  });

  return Array.from(tagMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}
