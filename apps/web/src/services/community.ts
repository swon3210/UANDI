import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  startAfter,
  where,
  type DocumentSnapshot,
  type QueryConstraint,
} from 'firebase/firestore';
import { getDb } from '@/lib/firebase/config';
import { uploadCommunityImage, deleteCommunityImage } from '@/lib/firebase/storage';
import type { CommunityPost, CommunityPostAuthor } from '@/types';

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

export async function getCommunityPost(postId: string): Promise<CommunityPost | null> {
  const snap = await getDoc(doc(getDb(), COMMUNITY_POSTS, postId));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as CommunityPost) : null;
}

export type CreateCommunityPostInput = {
  body: string;
  imageFile?: File | null;
  author: CommunityPostAuthor;
};

/**
 * 유저 글 생성 — Storage 이미지 업로드(선택) → Firestore 문서 생성.
 * 규칙(firestore.rules)이 요구하는 필드 형태를 그대로 맞춘다:
 *   type='user', status='published', author.uid==auth.uid, reportCount=0, source 없음.
 */
export async function createCommunityPost(input: CreateCommunityPostInput): Promise<string> {
  const ref = doc(collection(getDb(), COMMUNITY_POSTS));
  const postId = ref.id;

  let imageUrl: string | null = null;
  if (input.imageFile) {
    imageUrl = await uploadCommunityImage({
      uid: input.author.uid,
      postId,
      file: input.imageFile,
    });
  }

  await setDoc(ref, {
    id: postId,
    type: 'user',
    status: 'published',
    title: '',
    body: input.body,
    createdAt: serverTimestamp(),
    publishedAt: serverTimestamp(),
    reportCount: 0,
    author: input.author,
    imageUrl,
  });

  return postId;
}

/** 본인 글 삭제 — Firestore 문서 삭제 + (있으면) Storage 이미지 삭제. */
export async function deleteCommunityPost(post: CommunityPost): Promise<void> {
  await deleteDoc(doc(getDb(), COMMUNITY_POSTS, post.id));
  if (post.imageUrl && post.author?.uid) {
    try {
      await deleteCommunityImage({
        uid: post.author.uid,
        postId: post.id,
        storageUrl: post.imageUrl,
      });
    } catch {
      // Storage 객체가 이미 없을 수 있음 — 무시.
    }
  }
}
