import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from './firebase-admin';
import {
  aiPreferencesSchema,
  DEFAULT_STORED_AI_PREFERENCES,
  type StoredAiPreferences,
} from './preferences';

// couples/{coupleId}/meta/aiPreferences 요약 문서 1개. (rate-limit.ts 의 meta/aiUsage 와 동일 패턴)
// 읽기·쓰기 모두 서버(Admin SDK)에서만 하고, 저장 전/후로 Zod 검증·정규화한다.

function docRef(coupleId: string) {
  return adminDb().collection('couples').doc(coupleId).collection('meta').doc('aiPreferences');
}

/** 커플의 AI 맞춤화 설정을 읽는다. 문서가 없거나 파손됐으면 기본값. */
export async function getAiPreferences(coupleId: string): Promise<StoredAiPreferences> {
  const snap = await docRef(coupleId).get();
  if (!snap.exists) return DEFAULT_STORED_AI_PREFERENCES;
  // 읽기 시에도 방어적으로 재검증(스키마 밖 값/오염 무시).
  const parsed = aiPreferencesSchema.safeParse(snap.data());
  return parsed.success ? parsed.data : DEFAULT_STORED_AI_PREFERENCES;
}

/** 검증·정규화된 설정을 저장한다. updatedBy/updatedAt 메타를 함께 기록한다. */
export async function saveAiPreferences(
  coupleId: string,
  uid: string,
  preferences: StoredAiPreferences
): Promise<StoredAiPreferences> {
  await docRef(coupleId).set({
    ...preferences,
    updatedByUid: uid,
    updatedAt: FieldValue.serverTimestamp(),
  });
  return preferences;
}
