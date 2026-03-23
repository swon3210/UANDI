import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
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
