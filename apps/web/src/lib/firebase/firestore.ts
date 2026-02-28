import { collection } from 'firebase/firestore';
import type { CollectionReference } from 'firebase/firestore';
import { getDb } from './config';
import type { User, Couple } from '@/types';

export { getDb as db };

export const getUsersCol = () => collection(getDb(), 'users') as CollectionReference<User>;
export const getCouplesCol = () => collection(getDb(), 'couples') as CollectionReference<Couple>;
