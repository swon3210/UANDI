/**
 * 일회성 마이그레이션: 변동 지출·비정기 수입 카테고리에 잘못 붙은 정기 발생(recurrence) 제거
 *
 * 현금흐름 캘린더의 "정기 발생 등록 제안"이 변동 지출(공통/각자)·비정기 수입 카테고리의 반복 패턴에도
 * "정기 지출 등록" 버튼을 보여줬고, 누르면 그 변동 카테고리에 recurrence를 바로 붙였다. 변동 카테고리의
 * 편집 폼에는 정기 발생 섹션이 없어 사용자가 수정·해제할 수 없었고, 캘린더 ◇ 예측과 푸시 알림은 계속
 * 발생했다. (앱은 이제 변동 카테고리 패턴을 "새 고정 지출 카테고리 만들기 + 내역 이동" 흐름으로 안내한다.)
 *
 *   컬렉션                                        처리
 *   ────────────────────────────────────────────  ──────────────────────────────────────────────
 *   couples/*\/cashbookCategories (recurrence)      subGroup이 고정 지출/정기 수입(RECURRENCE_SUBGROUPS)이
 *                                                 아닌데 recurrence가 있으면 `recurrence: null`
 *
 * 닫음 플래그(recurrenceSuggestionDismissed)는 건드리지 않는다. recurrence가 사라지면 패턴이 계속되는
 * 카테고리는 현금흐름 페이지에 올바른 "고정 지출 카테고리 만들기" 제안으로 다시 뜬다.
 *
 * 판정 규칙은 `hasInvalidRecurrence`(packages/cashbook-core)에 있고 단위 테스트로 검증한다.
 * 멱등: 이미 null인 카테고리는 대상이 아니므로 여러 번 실행해도 안전하다.
 *
 * 사용법:
 *   gcloud auth application-default login
 *   pnpm tsx scripts/migrate-remove-variable-recurrence.ts --dry-run
 *   pnpm tsx scripts/migrate-remove-variable-recurrence.ts
 *
 * 옵션:
 *   --dry-run        쓰기 없이 대상만 출력
 *
 * 에뮬레이터 대상: FIRESTORE_EMULATOR_HOST=localhost:8080
 */

import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import {
  hasInvalidRecurrence,
  type RecurrenceCleanupCategory,
} from '../packages/cashbook-core/src/utils/recurrence-cleanup';

const BATCH_SIZE = 450;
const DRY_RUN = process.argv.includes('--dry-run');
const PROJECT_ID = process.env.GCLOUD_PROJECT ?? 'uandi-55ee4';

const app = initializeApp({ credential: applicationDefault(), projectId: PROJECT_ID });
const db = getFirestore(app);

async function main() {
  console.log(DRY_RUN ? '🔍 DRY RUN 모드' : '🚀 실행 모드');
  console.log(`Project: ${PROJECT_ID}`);
  console.log(`Firestore: ${process.env.FIRESTORE_EMULATOR_HOST ?? 'production'}\n`);

  // recurrence 필드가 있는(null 아님) 카테고리만 읽는다 — 전체 스캔 회피.
  const snap = await db.collectionGroup('cashbookCategories').where('recurrence', '!=', null).get();
  console.log(`recurrence가 있는 카테고리: ${snap.size}개`);

  let batch = db.batch();
  let ops = 0;
  let total = 0;

  for (const doc of snap.docs) {
    const x = doc.data();
    const category: RecurrenceCleanupCategory = {
      id: doc.id,
      subGroup: x.subGroup,
      recurrence: x.recurrence ?? null,
    };
    if (!hasInvalidRecurrence(category)) continue;

    total++;
    const coupleId = doc.ref.parent.parent?.id ?? '?';
    console.log(
      `  ${DRY_RUN ? '[DRY] ' : ''}${coupleId} / ${x.group}·${x.subGroup} "${x.name}" ` +
        `(enabled=${x.recurrence?.enabled}, dayOfMonth=${x.recurrence?.dayOfMonth ?? '-'})`
    );
    if (DRY_RUN) continue;

    batch.update(doc.ref, { recurrence: null });
    if (++ops >= BATCH_SIZE) {
      await batch.commit();
      console.log(`  배치 커밋 ${ops}건`);
      batch = db.batch();
      ops = 0;
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
