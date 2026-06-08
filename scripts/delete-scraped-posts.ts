/**
 * 일회성 정리: 스크래핑(type=='scraped') 커뮤니티 글 전체 삭제
 *
 * OG 이미지 해석 로직 변경 전에 수집된 글들은 source.ogImageUrl이 null로 남아 있다.
 * 이 글들을 모두 지우고 "지금 수집"으로 재크롤하면 새 로직(RSS media + og:image 폴백)으로
 * 이미지가 다시 채워진다.
 *
 * ⚠️ 주의:
 *   - status=='published'(이미 승인된) 글도 함께 지워진다 → 재크롤 후 어드민에서 재승인 필요.
 *   - RSS 피드에서 이미 밀려난 오래된 글은 재크롤해도 다시 생성되지 않는다(영구 삭제).
 *   - reports 서브컬렉션이 있으면 함께 정리한다.
 *
 * 안전장치: 기본은 DRY RUN(건수만 출력). --execute 플래그가 있어야 실제로 삭제한다.
 *
 * 사용법:
 *   # 프로덕션 (건수 확인)
 *   gcloud auth application-default login
 *   pnpm tsx scripts/delete-scraped-posts.ts
 *   # 프로덕션 (실제 삭제)
 *   pnpm tsx scripts/delete-scraped-posts.ts --execute
 *
 *   # 에뮬레이터 대상
 *   FIRESTORE_EMULATOR_HOST=localhost:8080 GCLOUD_PROJECT=uandi-test \
 *     pnpm tsx scripts/delete-scraped-posts.ts --execute
 */

import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore, type Query } from 'firebase-admin/firestore';

const BATCH_SIZE = 450;
const EXECUTE = process.argv.includes('--execute');
const PROJECT_ID = process.env.GCLOUD_PROJECT ?? 'uandi-55ee4';

const app = initializeApp({
  credential: applicationDefault(),
  projectId: PROJECT_ID,
});
const db = getFirestore(app);

// reports 서브컬렉션까지 지운다(있을 때만).
async function deleteReports(postRef: FirebaseFirestore.DocumentReference): Promise<number> {
  const reports = await postRef.collection('reports').get();
  if (reports.empty) return 0;
  let batch = db.batch();
  let n = 0;
  for (const r of reports.docs) {
    batch.delete(r.ref);
    if (++n % BATCH_SIZE === 0) {
      await batch.commit();
      batch = db.batch();
    }
  }
  if (n % BATCH_SIZE !== 0) await batch.commit();
  return n;
}

async function main() {
  console.log(EXECUTE ? '🚀 실행 모드 (실제 삭제)' : '🔍 DRY RUN 모드 (건수만 출력)');
  console.log(`Project: ${PROJECT_ID}`);
  console.log(`Firestore: ${process.env.FIRESTORE_EMULATOR_HOST ?? 'production'}\n`);

  // 필터 쿼리 — 전체 컬렉션 스캔이 아니라 type=='scraped'만 읽는다.
  const query: Query = db.collection('communityPosts').where('type', '==', 'scraped');
  const snap = await query.get();

  // 상태별 분포 — 잃게 될 승인 글 수를 명확히 보여준다.
  const byStatus: Record<string, number> = {};
  for (const doc of snap.docs) {
    const status = (doc.data().status as string) ?? 'unknown';
    byStatus[status] = (byStatus[status] ?? 0) + 1;
  }

  console.log(`스크래핑 글 총: ${snap.size}건`);
  for (const [status, count] of Object.entries(byStatus)) {
    const note = status === 'published' ? '  ← 승인 글: 재크롤 후 재승인 필요' : '';
    console.log(`  - ${status}: ${count}건${note}`);
  }
  console.log('');

  if (snap.empty) {
    console.log('삭제할 글이 없습니다.');
    return;
  }

  if (!EXECUTE) {
    console.log(
      'DRY RUN이므로 삭제하지 않았습니다. 실제 삭제하려면 --execute 플래그를 추가하세요.'
    );
    return;
  }

  let deleted = 0;
  let reportsDeleted = 0;
  let batch = db.batch();
  let opCount = 0;

  for (const doc of snap.docs) {
    // 서브컬렉션은 문서 삭제로 자동 제거되지 않으므로 먼저 정리한다.
    reportsDeleted += await deleteReports(doc.ref);

    batch.delete(doc.ref);
    opCount++;
    deleted++;

    if (opCount >= BATCH_SIZE) {
      await batch.commit();
      console.log(`  배치 커밋: ${deleted}건 누적`);
      batch = db.batch();
      opCount = 0;
    }
  }

  if (opCount > 0) await batch.commit();

  console.log(`\n삭제 완료: ${deleted}건 (reports ${reportsDeleted}건 포함)`);
  console.log('다음 단계: 어드민 /community/admin → "소스 관리" → "지금 수집"으로 재크롤하세요.');
}

main().catch((err) => {
  console.error('삭제 실패:', err);
  process.exit(1);
});
