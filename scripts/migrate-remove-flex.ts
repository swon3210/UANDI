/**
 * 일회성 마이그레이션: Flex 카테고리 폐지 → 변동 지출로 이관
 *
 * Flex(`type: 'flex'`, `group: 'flex'`, `joint_flex` / `personal_flex`)는 코드에서 제거된다.
 * 이 스크립트는 Firestore에 남아 있는 Flex 데이터를 지출(expense)로 옮긴다.
 *
 *   컬렉션                                             처리
 *   ─────────────────────────────────────────────────  ──────────────────────────────────────────
 *   couples/*\/cashbookEntries        (type)           'flex' → 'expense'
 *   couples/*\/cashbookPredictions    (type)           'flex' → 'expense'
 *   couples/*\/cashbookCategories     (group/subGroup) 'flex' → 'expense',
 *                                                      joint_flex → variable_common,
 *                                                      personal_flex → variable_personal
 *                                                      (같은 부모·서브그룹에 동명 카테고리가 있으면
 *                                                       이름 뒤에 ' (Flex)'를 붙여 충돌 회피 — 내역은
 *                                                       카테고리를 이름 문자열로 참조하므로 내역의
 *                                                       category도 함께 바꾼다)
 *   couples/*\/annualPlans/*\/items   (group/subGroup) 카테고리와 동일 매핑
 *   couples/*\/annualPlans/*\/revisions (totals)       expense += flex, flex 키 삭제
 *   couples/*\/cashbookSettlements                     문서 전체 삭제 (+ 첨부 Storage 파일 best-effort 삭제)
 *
 * 멱등: 이미 이관된 문서는 매칭되지 않으므로 여러 번 실행해도 안전하다.
 * 코드 배포 전·후로 한 번씩 돌려 배포 사이에 생긴 Flex 데이터까지 정리한다.
 *
 * 사용법:
 *   gcloud auth application-default login
 *   pnpm tsx scripts/migrate-remove-flex.ts --dry-run
 *   pnpm tsx scripts/migrate-remove-flex.ts
 *
 * 옵션:
 *   --dry-run        쓰기 없이 대상만 출력
 *   --keep-storage   결산 첨부 Storage 파일은 지우지 않음
 *
 * 에뮬레이터 대상: FIRESTORE_EMULATOR_HOST=localhost:8080 (Storage: FIREBASE_STORAGE_EMULATOR_HOST)
 * Storage 버킷: STORAGE_BUCKET 환경 변수 (기본 `${PROJECT_ID}.firebasestorage.app`)
 */

import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore, type DocumentReference, type WriteBatch } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

const BATCH_SIZE = 450;
const DRY_RUN = process.argv.includes('--dry-run');
const KEEP_STORAGE = process.argv.includes('--keep-storage');
const PROJECT_ID = process.env.GCLOUD_PROJECT ?? 'uandi-55ee4';
const STORAGE_BUCKET = process.env.STORAGE_BUCKET ?? `${PROJECT_ID}.firebasestorage.app`;

const SUB_GROUP_MAP: Record<string, string> = {
  joint_flex: 'variable_common',
  personal_flex: 'variable_personal',
};

const app = initializeApp({
  credential: applicationDefault(),
  projectId: PROJECT_ID,
  storageBucket: STORAGE_BUCKET,
});
const db = getFirestore(app);

// ── 배치 쓰기 헬퍼 ────────────────────────────────────────────────────────────

class Writer {
  private batch: WriteBatch = db.batch();
  private ops = 0;
  private previewCount = 0;
  constructor(private readonly label: string) {}

  async update(ref: DocumentReference, data: Record<string, unknown>) {
    if (DRY_RUN) {
      if (this.previewCount++ < 5) console.log(`  [DRY] ${ref.path} ← ${JSON.stringify(data)}`);
      return;
    }
    this.batch.update(ref, data);
    await this.tick();
  }

  async delete(ref: DocumentReference) {
    if (DRY_RUN) {
      if (this.previewCount++ < 5) console.log(`  [DRY] DELETE ${ref.path}`);
      return;
    }
    this.batch.delete(ref);
    await this.tick();
  }

  private async tick() {
    this.ops++;
    if (this.ops >= BATCH_SIZE) {
      await this.batch.commit();
      console.log(`  [${this.label}] 배치 커밋 ${this.ops}건`);
      this.batch = db.batch();
      this.ops = 0;
    }
  }

  async flush() {
    if (!DRY_RUN && this.ops > 0) {
      await this.batch.commit();
      this.ops = 0;
    }
  }
}

// ── 1. 카테고리 (이름 충돌 처리 포함) ───────────────────────────────────────────

type RenamedCategory = { coupleId: string; from: string; to: string };

async function migrateCategories(): Promise<RenamedCategory[]> {
  console.log('\n■ cashbookCategories');
  const snap = await db.collectionGroup('cashbookCategories').where('group', '==', 'flex').get();
  console.log(`  Flex 카테고리: ${snap.size}건`);
  if (snap.empty) return [];

  const writer = new Writer('categories');
  const renamed: RenamedCategory[] = [];

  // 커플별로 묶어서 동명 충돌 검사
  const byCouple = new Map<string, typeof snap.docs>();
  for (const d of snap.docs) {
    const coupleId = d.ref.parent.parent!.id;
    const list = byCouple.get(coupleId) ?? [];
    list.push(d);
    byCouple.set(coupleId, list);
  }

  for (const [coupleId, flexDocs] of byCouple) {
    const existing = await db
      .collection(`couples/${coupleId}/cashbookCategories`)
      .where('group', '==', 'expense')
      .get();
    const taken = new Set(
      existing.docs.map((d) => {
        const x = d.data();
        return `${x.parentCategoryId ?? 'root'}|${x.subGroup}|${x.name}`;
      })
    );

    for (const d of flexDocs) {
      const data = d.data();
      const subGroup = SUB_GROUP_MAP[data.subGroup] ?? 'variable_common';
      let name: string = data.name;
      const key = () => `${data.parentCategoryId ?? 'root'}|${subGroup}|${name}`;
      if (taken.has(key())) {
        const next = `${name} (Flex)`;
        renamed.push({ coupleId, from: name, to: next });
        console.log(`  ⚠ 이름 충돌: ${coupleId} "${name}" → "${next}"`);
        name = next;
      }
      taken.add(key());

      const update: Record<string, unknown> = { group: 'expense', subGroup };
      if (name !== data.name) update.name = name;
      await writer.update(d.ref, update);
    }
  }

  await writer.flush();
  console.log(`  이관 ${DRY_RUN ? '대상' : '완료'}: ${snap.size}건, 이름 변경 ${renamed.length}건`);
  return renamed;
}

// ── 2. 내역 / 예측 (type 필드) ──────────────────────────────────────────────────

async function migrateTypeField(collectionId: string, renamed: RenamedCategory[]) {
  console.log(`\n■ ${collectionId}`);
  const snap = await db.collectionGroup(collectionId).where('type', '==', 'flex').get();
  console.log(`  Flex ${collectionId}: ${snap.size}건`);
  if (snap.empty) return;

  const renameMap = new Map(renamed.map((r) => [`${r.coupleId}|${r.from}`, r.to]));
  const writer = new Writer(collectionId);
  let renamedCount = 0;

  for (const d of snap.docs) {
    const coupleId = d.ref.parent.parent!.id;
    const update: Record<string, unknown> = { type: 'expense' };
    const to = renameMap.get(`${coupleId}|${d.data().category}`);
    if (to) {
      update.category = to;
      renamedCount++;
    }
    await writer.update(d.ref, update);
  }

  await writer.flush();
  console.log(
    `  이관 ${DRY_RUN ? '대상' : '완료'}: ${snap.size}건 (카테고리명 변경 ${renamedCount}건)`
  );
}

// ── 3. 연간 계획 항목 / 리비전 ─────────────────────────────────────────────────

async function migrateAnnualPlanItems() {
  console.log('\n■ annualPlans/*/items');
  const snap = await db.collectionGroup('items').where('group', '==', 'flex').get();
  // collectionGroup('items')는 다른 경로의 items도 잡을 수 있으므로 annualPlans 하위만 필터
  const docs = snap.docs.filter((d) => d.ref.path.includes('/annualPlans/'));
  console.log(`  Flex 항목: ${docs.length}건`);
  if (docs.length === 0) return;

  const writer = new Writer('items');
  for (const d of docs) {
    const data = d.data();
    await writer.update(d.ref, {
      group: 'expense',
      subGroup: SUB_GROUP_MAP[data.subGroup] ?? 'variable_common',
    });
  }
  await writer.flush();
  console.log(`  이관 ${DRY_RUN ? '대상' : '완료'}: ${docs.length}건`);
}

async function migrateAnnualPlanRevisions() {
  console.log('\n■ annualPlans/*/revisions (totals)');
  const snap = await db.collectionGroup('revisions').get();
  const docs = snap.docs.filter((d) => d.ref.path.includes('/annualPlans/'));
  const writer = new Writer('revisions');
  let count = 0;

  for (const d of docs) {
    const totals = d.data().totals as
      | { before?: Record<string, number>; after?: Record<string, number> }
      | undefined;
    if (!totals) continue;
    const hasFlex = totals.before?.flex !== undefined || totals.after?.flex !== undefined;
    if (!hasFlex) continue;

    const fold = (t?: Record<string, number>) => {
      if (!t) return t;
      const { flex = 0, ...rest } = t;
      return { ...rest, expense: (rest.expense ?? 0) + flex };
    };
    await writer.update(d.ref, {
      totals: { before: fold(totals.before), after: fold(totals.after) },
    });
    count++;
  }

  await writer.flush();
  console.log(`  리비전 전체 ${docs.length}건 중 이관 ${DRY_RUN ? '대상' : '완료'}: ${count}건`);
}

// ── 4. 결산 삭제 ────────────────────────────────────────────────────────────────

async function deleteSettlements() {
  console.log('\n■ cashbookSettlements (전체 삭제)');
  const snap = await db.collectionGroup('cashbookSettlements').get();
  console.log(`  결산 문서: ${snap.size}건`);
  if (snap.empty) return;

  const storagePaths: string[] = [];
  for (const d of snap.docs) {
    const attachments = (d.data().attachments ?? []) as { storagePath?: string }[];
    for (const a of attachments) if (a.storagePath) storagePaths.push(a.storagePath);
  }

  const writer = new Writer('settlements');
  for (const d of snap.docs) await writer.delete(d.ref);
  await writer.flush();
  console.log(`  삭제 ${DRY_RUN ? '대상' : '완료'}: ${snap.size}건`);

  if (storagePaths.length === 0) return;
  console.log(`  첨부 Storage 파일: ${storagePaths.length}건 (${STORAGE_BUCKET})`);
  if (KEEP_STORAGE || DRY_RUN) {
    console.log(`  ${KEEP_STORAGE ? '--keep-storage' : 'DRY RUN'} — Storage 파일은 건너뜀`);
    return;
  }
  const bucket = getStorage(app).bucket();
  let deleted = 0;
  for (const p of storagePaths) {
    try {
      await bucket.file(p).delete({ ignoreNotFound: true });
      deleted++;
    } catch (err) {
      console.warn(`  ⚠ Storage 삭제 실패 ${p}:`, (err as Error).message);
    }
  }
  console.log(`  Storage 삭제 완료: ${deleted}/${storagePaths.length}건`);
}

// ── main ────────────────────────────────────────────────────────────────────────

async function main() {
  console.log(DRY_RUN ? '🔍 DRY RUN 모드' : '🚀 실행 모드');
  console.log(`Project: ${PROJECT_ID}`);
  console.log(`Firestore: ${process.env.FIRESTORE_EMULATOR_HOST ?? 'production'}`);

  const renamed = await migrateCategories();
  await migrateTypeField('cashbookEntries', renamed);
  await migrateTypeField('cashbookPredictions', renamed);
  await migrateAnnualPlanItems();
  await migrateAnnualPlanRevisions();
  await deleteSettlements();

  console.log(`\n✅ ${DRY_RUN ? 'DRY RUN 종료' : '마이그레이션 완료'}`);
}

main().catch((err) => {
  console.error('마이그레이션 실패:', err);
  process.exit(1);
});
