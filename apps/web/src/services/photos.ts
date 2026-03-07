import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { getDb } from '@/lib/firebase/config';
import type { Photo } from '@/types';

export async function getRecentPhotos(coupleId: string, count = 3): Promise<Photo[]> {
  const q = query(
    collection(getDb(), `couples/${coupleId}/photos`),
    orderBy('takenAt', 'desc'),
    limit(count)
  );
  const snap = await getDocs(q);
  return snap.docs.map((doc) => doc.data() as Photo);
}
