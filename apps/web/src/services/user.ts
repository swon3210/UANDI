import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { getDb } from '@/lib/firebase/config';
import type { User } from '@/types';

export async function getUserDocument(uid: string): Promise<User | null> {
  const snap = await getDoc(doc(getDb(), 'users', uid));
  return snap.exists() ? (snap.data() as User) : null;
}

export async function createUserDocument(
  uid: string,
  data: Omit<User, 'uid' | 'createdAt'>
): Promise<void> {
  await setDoc(doc(getDb(), 'users', uid), {
    uid,
    ...data,
    createdAt: serverTimestamp(),
  });
}

export async function updateUserDocument(uid: string, data: Partial<User>): Promise<void> {
  await updateDoc(doc(getDb(), 'users', uid), data);
}
