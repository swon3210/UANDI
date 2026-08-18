import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  startAfter,
  Timestamp,
  updateDoc,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { getDb, getStorage } from './firebase';

export const DIARY_COLLECTION = 'diaryEntries';
export const DIARY_PAGE_SIZE = 10;

/** 일기를 쓰고 고칠 수 있는 계정. Firestore 보안 규칙의 값과 반드시 같아야 한다. */
export const DIARY_OWNER_EMAIL = process.env.NEXT_PUBLIC_DIARY_OWNER_EMAIL ?? 'swon3210@gmail.com';

export type DiaryEntry = {
  id: string;
  title: string;
  /** Tiptap이 만든 HTML. 주인만 쓸 수 있으므로 그대로 렌더링한다. */
  contentHtml: string;
  excerpt: string;
  coverImageUrl: string | null;
  authorUid: string;
  /** ISO 문자열. serverTimestamp가 아직 확정되지 않은 순간에는 null. */
  createdAt: string | null;
  updatedAt: string | null;
};

export type DiaryEntryInput = {
  title: string;
  contentHtml: string;
  coverImageUrl: string | null;
};

export type DiaryCursor = QueryDocumentSnapshot<DocumentData>;

function toIso(value: unknown): string | null {
  return value instanceof Timestamp ? value.toDate().toISOString() : null;
}

function toEntry(snapshot: QueryDocumentSnapshot<DocumentData>): DiaryEntry {
  const data = snapshot.data();
  return {
    id: snapshot.id,
    title: typeof data.title === 'string' ? data.title : '',
    contentHtml: typeof data.contentHtml === 'string' ? data.contentHtml : '',
    excerpt: typeof data.excerpt === 'string' ? data.excerpt : '',
    coverImageUrl: typeof data.coverImageUrl === 'string' ? data.coverImageUrl : null,
    authorUid: typeof data.authorUid === 'string' ? data.authorUid : '',
    createdAt: toIso(data.createdAt),
    updatedAt: toIso(data.updatedAt),
  };
}

/** 본문 HTML에서 목록 카드에 쓸 한 줄 요약을 뽑는다. */
export function buildExcerpt(contentHtml: string, maxLength = 140): string {
  const text = contentHtml
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
  return text.length > maxLength ? `${text.slice(0, maxLength)}…` : text;
}

/**
 * 목록 조회. 커서 기반 페이지네이션(CLAUDE.md — 전체 스캔 금지)이라
 * 한 번에 DIARY_PAGE_SIZE개까지만 읽는다.
 * 보안 규칙상 list는 주인만 가능하다 — 링크를 받은 사람은 단건(get)만 읽는다.
 */
export async function listDiaryEntries(
  cursor?: DiaryCursor | null
): Promise<{ entries: DiaryEntry[]; cursor: DiaryCursor | null; hasMore: boolean }> {
  const snapshot = await getDocs(
    query(
      collection(getDb(), DIARY_COLLECTION),
      orderBy('createdAt', 'desc'),
      ...(cursor ? [startAfter(cursor)] : []),
      // 다음 페이지가 있는지 알기 위해 한 개 더 읽는다.
      limit(DIARY_PAGE_SIZE + 1)
    )
  );

  const hasMore = snapshot.docs.length > DIARY_PAGE_SIZE;
  const docs = hasMore ? snapshot.docs.slice(0, DIARY_PAGE_SIZE) : snapshot.docs;

  return {
    entries: docs.map(toEntry),
    cursor: docs.at(-1) ?? null,
    hasMore,
  };
}

export async function getDiaryEntry(id: string): Promise<DiaryEntry | null> {
  const snapshot = await getDoc(doc(getDb(), DIARY_COLLECTION, id));
  if (!snapshot.exists()) return null;
  return toEntry(snapshot as QueryDocumentSnapshot<DocumentData>);
}

export async function createDiaryEntry(input: DiaryEntryInput, authorUid: string): Promise<string> {
  const created = await addDoc(collection(getDb(), DIARY_COLLECTION), {
    title: input.title,
    contentHtml: input.contentHtml,
    excerpt: buildExcerpt(input.contentHtml),
    coverImageUrl: input.coverImageUrl,
    authorUid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return created.id;
}

export async function updateDiaryEntry(id: string, input: DiaryEntryInput): Promise<void> {
  await updateDoc(doc(getDb(), DIARY_COLLECTION, id), {
    title: input.title,
    contentHtml: input.contentHtml,
    excerpt: buildExcerpt(input.contentHtml),
    coverImageUrl: input.coverImageUrl,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteDiaryEntry(id: string): Promise<void> {
  await deleteDoc(doc(getDb(), DIARY_COLLECTION, id));
}

/** 본문·커버 이미지를 Storage(diary/{uid}/...)에 올리고 공개 URL을 돌려준다. */
export async function uploadDiaryImage(file: File, uid: string): Promise<string> {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `diary/${uid}/${Date.now()}-${safeName}`;
  const storageRef = ref(getStorage(), path);
  await uploadBytes(storageRef, file, { contentType: file.type });
  return getDownloadURL(storageRef);
}
