/**
 * 일회성 마이그레이션: 기존 cashbookCategories 문서에 신규 필드 백필
 *
 * 모든 couples/{coupleId}/cashbookCategories/* 문서를 순회해서 다음 필드를 채운다
 * (이미 있으면 건너뜀):
 *   - parentCategoryId: null
 *   - description: ''
 *   - examples: []
 *
 * 사용법:
 *   gcloud auth application-default login
 *   pnpm tsx scripts/migrate-categories-fields.ts --dry-run
 *   pnpm tsx scripts/migrate-categories-fields.ts
 *
 * 에뮬레이터 대상으로 실행하려면 FIRESTORE_EMULATOR_HOST=localhost:8080 환경 변수를 설정.
 */

import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const BATCH_SIZE = 450;
const DRY_RUN = process.argv.includes('--dry-run');
const PROJECT_ID = process.env.GCLOUD_PROJECT ?? 'uandi-55ee4';

const app = initializeApp({
  credential: applicationDefault(),
  projectId: PROJECT_ID,
});
const db = getFirestore(app);

async function main() {
  console.log(DRY_RUN ? '🔍 DRY RUN 모드' : '🚀 실행 모드');
  console.log(`Project: ${PROJECT_ID}`);
  console.log(
    `Firestore: ${process.env.FIRESTORE_EMULATOR_HOST ?? 'production'}\n`
  );

  const snap = await db.collectionGroup('cashbookCategories').get();
  console.log(`총 카테고리 문서: ${snap.size}\n`);

  let migrated = 0;
  let skipped = 0;
  let batch = db.batch();
  let opCount = 0;

  for (const catDoc of snap.docs) {
    const data = catDoc.data();
    const needsParent = data.parentCategoryId === undefined;
    const needsDescription = data.description === undefined;
    const needsExamples = data.examples === undefined;

    if (!needsParent && !needsDescription && !needsExamples) {
      skipped++;
      continue;
    }

    const update: Record<string, unknown> = {};
    if (needsParent) update.parentCategoryId = null;
    if (needsDescription) update.description = '';
    if (needsExamples) update.examples = [];

    if (DRY_RUN) {
      if (migrated < 5) {
        console.log(`  [DRY] ${catDoc.ref.path} ← ${JSON.stringify(update)}`);
      }
    } else {
      batch.update(catDoc.ref, update);
      opCount++;
      if (opCount >= BATCH_SIZE) {
        await batch.commit();
        console.log(`  배치 커밋: ${migrated + 1}개 누적`);
        batch = db.batch();
        opCount = 0;
      }
    }

    migrated++;
  }

  if (!DRY_RUN && opCount > 0) {
    await batch.commit();
  }

  console.log(`\n마이그레이션 ${DRY_RUN ? '대상' : '완료'}: ${migrated}건`);
  console.log(`이미 적용됨(스킵): ${skipped}건`);
}

main().catch((err) => {
  console.error('마이그레이션 실패:', err);
  process.exit(1);
});
