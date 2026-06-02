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
  updateDoc,
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
    editedAt: null,
    reportCount: 0,
    author: input.author,
    imageUrl,
  });

  return postId;
}

export type UpdateCommunityPostInput = {
  post: CommunityPost;
  body: string;
  /** 새로 첨부/교체한 이미지. 없으면 기존 유지(또는 imageRemoved로 제거). */
  imageFile?: File | null;
  /** 새 파일 없이 기존 이미지를 제거할 때 true. */
  imageRemoved?: boolean;
};

/**
 * 본인 글 수정 — 본문/이미지/수정시각만 변경한다.
 * 규칙(firestore.rules)이 변경 키를 body/imageUrl/editedAt로만 한정하므로
 * status·reportCount·author 등은 절대 함께 보내지 않는다.
 * 이미지: 교체 시 새 파일 업로드(같은 경로 덮어쓰기, ext 다르면 구 객체 정리),
 * 제거 시 Storage 객체 삭제 후 imageUrl=null.
 */
export async function updateCommunityPost(input: UpdateCommunityPostInput): Promise<void> {
  const { post, body, imageFile, imageRemoved } = input;
  const uid = post.author?.uid;

  let imageUrl: string | null | undefined = undefined; // undefined면 imageUrl 미변경

  if (imageFile && uid) {
    const newUrl = await uploadCommunityImage({ uid, postId: post.id, file: imageFile });
    // 확장자가 달라 구 객체가 남는 경우 정리(best-effort)
    if (post.imageUrl && post.imageUrl !== newUrl) {
      try {
        await deleteCommunityImage({ uid, postId: post.id, storageUrl: post.imageUrl });
      } catch {
        // 이미 없거나 새 파일이 덮어썼을 수 있음 — 무시.
      }
    }
    imageUrl = newUrl;
  } else if (imageRemoved && uid) {
    if (post.imageUrl) {
      try {
        await deleteCommunityImage({ uid, postId: post.id, storageUrl: post.imageUrl });
      } catch {
        // Storage 객체가 이미 없을 수 있음 — 무시.
      }
    }
    imageUrl = null;
  }

  await updateDoc(doc(getDb(), COMMUNITY_POSTS, post.id), {
    body,
    editedAt: serverTimestamp(),
    ...(imageUrl !== undefined ? { imageUrl } : {}),
  });
}

export type CommunityReportReason = 'spam' | 'inappropriate' | 'copyright' | 'other';

/**
 * 신고 제출 — `communityPosts/{postId}/reports/{uid}` 에 본인 uid 문서 1개 생성.
 * 문서 id == uid이므로 같은 유저의 두 번째 신고는 setDoc(merge=false)에서도 같은 doc을 덮어쓰게 된다.
 * Firestore rule은 `update`를 deny하므로 두 번째 시도는 PERMISSION_DENIED를 던진다 — 호출자가 이를 잡아 안내.
 */
export async function reportCommunityPost(input: {
  postId: string;
  uid: string;
  reason: CommunityReportReason;
}): Promise<void> {
  const ref = doc(getDb(), COMMUNITY_POSTS, input.postId, 'reports', input.uid);
  await setDoc(ref, {
    reason: input.reason,
    createdAt: serverTimestamp(),
  });
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
