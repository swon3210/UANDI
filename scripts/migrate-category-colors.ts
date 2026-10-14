/**
 * 일회성 마이그레이션: 카테고리 색상 재배정
 *
 * 예전 기본 카테고리는 지출 전부가 코랄(#D8635A), 수입이 세이지(#4CAF86/#63C39F) 한두 색을
 * 공유했다. 그래서 대시보드는 카테고리 색 대신 순위별 팔레트를 덮어써 그렸고, 카테고리 설정의
 * 색과 대시보드·필터의 색이 서로 달랐다. 이제 모든 화면이 카테고리에 저장된 색을 그대로 쓰므로
 * 기존 데이터의 공용 색을 카테고리별로 구분되는 색으로 바꾼다.
 *
 *   컬렉션                             처리
 *   ─────────────────────────────────  ─────────────────────────────────────────────────────
 *   couples/*\/cashbookCategories (color)  예전 공용 색(LEGACY_CATEGORY_COLORS)인 카테고리만
 *                                      - 기본 카테고리 → 새 기본 색 (DEFAULT_CATEGORIES)
 *                                      - 직접 추가한 상위 → 같은 탭에서 안 쓰인 팔레트 색
 *                                      - 상위와 같은 색이던 하위 → 상위의 새 색
 *                                      사용자가 고른 다른 색은 그대로 둔다.
 *
 * 배정 규칙은 `planCategoryColorMigration`(packages/cashbook-core)에 있고 단위 테스트로 검증한다.
 * 멱등: 이미 바뀐 카테고리는 공용 색이 아니므로 여러 번 실행해도 안전하다.
 *
 * 사용법:
 *   gcloud auth application-default login
 *   pnpm tsx scripts/migrate-category-colors.ts --dry-run
 *   pnpm tsx scripts/migrate-category-colors.ts
 *
 * 옵션:
 *   --dry-run        쓰기 없이 대상만 출력
 *
 * 에뮬레이터 대상: FIRESTORE_EMULATOR_HOST=localhost:8080
 */

import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import {
  planCategoryColorMigration,
  type ColorMigrationCategory,
} from '../packages/cashbook-core/src/utils/category-color-migration';

const BATCH_SIZE = 450;
const DRY_RUN = process.argv.includes('--dry-run');
const PROJECT_ID = process.env.GCLOUD_PROJECT ?? 'uandi-55ee4';

const app = initializeApp({ credential: applicationDefault(), projectId: PROJECT_ID });
const db = getFirestore(app);

async function main() {
  console.log(DRY_RUN ? '🔍 DRY RUN 모드' : '🚀 실행 모드');
  console.log(`Project: ${PROJECT_ID}`);
  console.log(`Firestore: ${process.env.FIRESTORE_EMULATOR_HOST ?? 'production'}`);

  const coupleRefs = await db.collection('couples').listDocuments();
  console.log(`커플: ${coupleRefs.length}쌍`);

  let batch = db.batch();
  let ops = 0;
  let total = 0;
  let previewCount = 0;

  for (const coupleRef of coupleRefs) {
    // 커플당 카테고리는 수십 개 수준이라 한 번에 읽는다 (커플 하위 컬렉션 한정)
    const snap = await coupleRef.collection('cashbookCategories').get();
    if (snap.empty) continue;

    const categories: ColorMigrationCategory[] = snap.docs.map((d) => {
      const x = d.data();
      return {
        id: d.id,
        group: x.group,
        subGroup: x.subGroup,
        name: x.name,
        color: x.color ?? '',
        parentCategoryId: x.parentCategoryId ?? null,
        sortOrder: x.sortOrder ?? 0,
      };
    });
    const updates = planCategoryColorMigration(categories);
    if (updates.size === 0) continue;

    total += updates.size;
    console.log(`  ${coupleRef.id}: ${updates.size}개`);
    const byId = new Map(categories.map((c) => [c.id, c]));
    for (const [id, color] of updates) {
      const ref = coupleRef.collection('cashbookCategories').doc(id);
      if (DRY_RUN) {
        if (previewCount++ < 30) {
          const c = byId.get(id);
          console.log(`    [DRY] ${c?.group}/${c?.name}: ${c?.color} → ${color}`);
        }
        continue;
      }
      batch.update(ref, { color });
      if (++ops >= BATCH_SIZE) {
        await batch.commit();
        console.log(`  배치 커밋 ${ops}건`);
        batch = db.batch();
        ops = 0;
      }
    }
  }

  if (!DRY_RUN && ops > 0) await batch.commit();
  console.log(`\n대상 카테고리: ${total}개`);
  console.log(`✅ ${DRY_RUN ? 'DRY RUN 종료' : '마이그레이션 완료'}`);
}

main().catch((err) => {
  console.error('마이그레이션 실패:', err);
  process.exit(1);
});
