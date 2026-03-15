/**
 * 일회성 마이그레이션 스크립트
 *
 * swon3210@gmail.com 유저의 users/{uid}/images 컬렉션 →
 * songwon2019@gmail.com 유저의 couples/{coupleId}/photos 컬렉션으로 복사
 *
 * 사용법:
 *   gcloud auth application-default login
 *   pnpm tsx scripts/migrate-images-to-photos.ts --dry-run
 *   pnpm tsx scripts/migrate-images-to-photos.ts
 */

import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

const SOURCE_EMAIL = 'swon3210@gmail.com';
const TARGET_EMAIL = 'songwon2019@gmail.com';
const BATCH_SIZE = 450;
const DRY_RUN = process.argv.includes('--dry-run');

const app = initializeApp({
  credential: applicationDefault(),
  projectId: 'uandi-55ee4',
});
const db = getFirestore(app);

async function getUserByEmail(email: string) {
  const snap = await db.collection('users').where('email', '==', email).limit(1).get();
  if (snap.empty) throw new Error(`유저를 찾을 수 없습니다: ${email}`);
  return { id: snap.docs[0].id, ...snap.docs[0].data() } as {
    id: string;
    uid: string;
    email: string;
    coupleId: string | null;
  };
}

async function main() {
  console.log(DRY_RUN ? '🔍 DRY RUN 모드\n' : '🚀 실행 모드\n');

  // 1. 유저 조회
  const sourceUser = await getUserByEmail(SOURCE_EMAIL);
  const targetUser = await getUserByEmail(TARGET_EMAIL);

  console.log(`Source: ${sourceUser.email} (uid: ${sourceUser.uid ?? sourceUser.id})`);
  console.log(`Target: ${targetUser.email} (uid: ${targetUser.uid ?? targetUser.id})`);

  const sourceUid = sourceUser.uid ?? sourceUser.id;
  const targetUid = targetUser.uid ?? targetUser.id;
  const coupleId = targetUser.coupleId;

  if (!coupleId) {
    throw new Error(`${TARGET_EMAIL} 유저에 coupleId가 없습니다.`);
  }
  console.log(`CoupleId: ${coupleId}\n`);

  // 2. imageFolders 읽기 (폴더 이름 매핑)
  const imageFoldersSnap = await db.collection(`users/${sourceUid}/imageFolders`).get();
  const folderNameMap = new Map<string, string>();
  imageFoldersSnap.docs.forEach((doc) => {
    const data = doc.data();
    folderNameMap.set(doc.id, data.name ?? doc.id);
  });
  console.log(`imageFolders 수: ${imageFoldersSnap.size}`);
  folderNameMap.forEach((name, id) => console.log(`  - ${id}: "${name}"`));

  // 3. images 전체 읽기
  const imagesSnap = await db.collection(`users/${sourceUid}/images`).get();
  console.log(`\nimages 수: ${imagesSnap.size}\n`);

  if (imagesSnap.empty) {
    console.log('마이그레이션할 이미지가 없습니다.');
    return;
  }

  // 4. 고유 folderId 수집 및 Folder 문서 생성
  const uniqueFolderIds = new Set<string>();
  imagesSnap.docs.forEach((doc) => {
    const data = doc.data();
    const folderId = data.folderId || data.galleryId || '__default__';
    uniqueFolderIds.add(folderId);
  });

  console.log(`생성할 폴더 수: ${uniqueFolderIds.size}`);

  if (!DRY_RUN) {
    const folderBatch = db.batch();
    for (const folderId of uniqueFolderIds) {
      const name =
        folderNameMap.get(folderId) ?? (folderId === '__default__' ? '미분류' : folderId);
      const ref = db.doc(`couples/${coupleId}/folders/${folderId}`);
      folderBatch.set(ref, {
        id: folderId,
        coupleId,
        name,
        createdBy: targetUid,
        createdAt: Timestamp.now(),
      });
      console.log(`  폴더 생성: ${folderId} → "${name}"`);
    }
    await folderBatch.commit();
    console.log('폴더 생성 완료\n');
  } else {
    for (const folderId of uniqueFolderIds) {
      const name =
        folderNameMap.get(folderId) ?? (folderId === '__default__' ? '미분류' : folderId);
      console.log(`  [DRY] 폴더: ${folderId} → "${name}"`);
    }
    console.log('');
  }

  // 5. Photo 문서 생성
  let batch = db.batch();
  let opCount = 0;
  let totalMigrated = 0;

  for (const imageDoc of imagesSnap.docs) {
    const data = imageDoc.data();
    const folderId = data.folderId || data.galleryId || '__default__';

    const photoData = {
      id: imageDoc.id,
      coupleId,
      uploadedBy: targetUid,
      folderId,
      tags: [],
      storageUrl: data.downloadUrl ?? '',
      thumbnailUrl: null,
      caption: '',
      takenAt: data.createdAt ?? Timestamp.now(),
      uploadedAt: data.createdAt ?? Timestamp.now(),
      width: 0,
      height: 0,
    };

    if (DRY_RUN) {
      if (totalMigrated < 3) {
        console.log(`[DRY] Photo: ${imageDoc.id}`);
        console.log(`  fileName: ${data.fileName}`);
        console.log(`  folderId: ${folderId}`);
        console.log(`  storageUrl: ${(data.downloadUrl ?? '').substring(0, 80)}...`);
        console.log('');
      }
    } else {
      const ref = db.doc(`couples/${coupleId}/photos/${imageDoc.id}`);
      batch.set(ref, photoData);
      opCount++;

      if (opCount >= BATCH_SIZE) {
        await batch.commit();
        console.log(`  배치 커밋: ${totalMigrated + opCount}개 완료`);
        batch = db.batch();
        opCount = 0;
      }
    }

    totalMigrated++;
  }

  if (!DRY_RUN && opCount > 0) {
    await batch.commit();
  }

  console.log(`\n총 ${totalMigrated}개 사진 ${DRY_RUN ? '(DRY RUN)' : '마이그레이션 완료'}`);
}

main().catch((err) => {
  console.error('마이그레이션 실패:', err);
  process.exit(1);
});
