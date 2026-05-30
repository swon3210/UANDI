import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  where,
  type DocumentSnapshot,
  type QueryConstraint,
} from 'firebase/firestore';
import { getDb } from '@/lib/firebase/config';
import type { CommunityPost } from '@/types';

const COMMUNITY_POSTS = 'communityPosts';
const PAGE_SIZE = 20;

export type CommunityFeedPage = {
  posts: CommunityPost[];
  lastDoc: DocumentSnapshot | null;
};

/**
 * 커뮤니티 피드 1페이지 — 승인된 글만, publishedAt 최신순.
 * 보안 규칙(`status == 'published'`)을 만족시키기 위해 client query는 반드시 where 조건을 포함한다.
 */
export async function getCommunityFeedPage(
  cursor?: DocumentSnapshot
): Promise<CommunityFeedPage> {
  const constraints: QueryConstraint[] = [
    where('status', '==', 'published'),
    orderBy('publishedAt', 'desc'),
    limit(PAGE_SIZE),
  ];
  if (cursor) constraints.push(startAfter(cursor));

  const q = query(collection(getDb(), COMMUNITY_POSTS), ...constraints);
  const snap = await getDocs(q);
  const posts = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as CommunityPost);
  const lastDoc = snap.docs[snap.docs.length - 1] ?? null;

  return { posts, lastDoc };
}
