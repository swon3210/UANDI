import {
  ref,
  uploadBytes,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { getStorage } from '@/lib/firebase/config';

type UploadOptions = {
  coupleId: string;
  photoId: string;
  file: File;
  onProgress?: (percent: number) => void;
};

export async function uploadPhotoFile({
  coupleId,
  photoId,
  file,
  onProgress,
}: UploadOptions): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'jpg';
  const storagePath = `couples/${coupleId}/photos/${photoId}/original.${ext}`;
  const storageRef = ref(getStorage(), storagePath);

  return new Promise((resolve, reject) => {
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const percent = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        onProgress?.(percent);
      },
      reject,
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref);
        resolve(url);
      }
    );
  });
}

// ── 월 결산 첨부 (영수증·스크린샷) ──

type SettlementAttachmentUploadOptions = {
  coupleId: string;
  monthKey: string; // 'YYYY-MM'
  attachmentId: string;
  file: File;
  onProgress?: (percent: number) => void;
};

export async function uploadSettlementAttachment({
  coupleId,
  monthKey,
  attachmentId,
  file,
  onProgress,
}: SettlementAttachmentUploadOptions): Promise<{ url: string; storagePath: string }> {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
  const storagePath = `couples/${coupleId}/cashbookSettlements/${monthKey}/${attachmentId}.${ext}`;
  const storageRef = ref(getStorage(), storagePath);

  return new Promise((resolve, reject) => {
    const uploadTask = uploadBytesResumable(storageRef, file, { contentType: file.type });

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const percent = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        onProgress?.(percent);
      },
      reject,
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref);
        resolve({ url, storagePath });
      }
    );
  });
}

export async function deleteSettlementAttachment(storagePath: string) {
  await deleteObject(ref(getStorage(), storagePath));
}

// ── 가계부 배경 이미지 ──

type BackgroundUploadOptions = {
  userId: string;
  file: File;
  onProgress?: (percent: number) => void;
};

export async function uploadCashbookBackground({
  userId,
  file,
  onProgress,
}: BackgroundUploadOptions): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'jpg';
  const storagePath = `users/${userId}/inner/cashbook/background.${ext}`;
  const storageRef = ref(getStorage(), storagePath);

  return new Promise((resolve, reject) => {
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const percent = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        onProgress?.(percent);
      },
      reject,
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref);
        resolve(url);
      }
    );
  });
}

export async function deleteCashbookBackground(userId: string, storageUrl?: string) {
  let ext = 'jpg';
  if (storageUrl) {
    const match = storageUrl.match(/background\.(\w+)/);
    if (match) ext = match[1];
  }
  const storagePath = `users/${userId}/inner/cashbook/background.${ext}`;
  const storageRef = ref(getStorage(), storagePath);
  await deleteObject(storageRef);
}

// ── 사진 ──

export async function deletePhotoFile(coupleId: string, photoId: string, storageUrl?: string) {
  // storageUrl에서 확장자 파싱 (예: original.png → png)
  let ext = 'jpg';
  if (storageUrl) {
    const match = storageUrl.match(/original\.(\w+)/);
    if (match) ext = match[1];
  }
  const storagePath = `couples/${coupleId}/photos/${photoId}/original.${ext}`;
  const storageRef = ref(getStorage(), storagePath);
  await deleteObject(storageRef);
}

// ── 커뮤니티 유저 글 이미지 ──

type CommunityImageUploadOptions = {
  uid: string;
  postId: string;
  file: File;
};

export async function uploadCommunityImage({
  uid,
  postId,
  file,
}: CommunityImageUploadOptions): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
  const storagePath = `communityImages/${uid}/${postId}.${ext}`;
  const storageRef = ref(getStorage(), storagePath);
  const result = await uploadBytes(storageRef, file, { contentType: file.type });
  return getDownloadURL(result.ref);
}

export async function deleteCommunityImage({
  uid,
  postId,
  storageUrl,
}: {
  uid: string;
  postId: string;
  storageUrl?: string | null;
}) {
  if (!storageUrl) return;
  // storageUrl에서 확장자 파싱 (예: {postId}.png → png)
  const match = storageUrl.match(new RegExp(`${postId}\\.(\\w+)`));
  const ext = match ? match[1] : 'jpg';
  const storagePath = `communityImages/${uid}/${postId}.${ext}`;
  await deleteObject(ref(getStorage(), storagePath));
}
