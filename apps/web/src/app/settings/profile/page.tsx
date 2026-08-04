'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { Header, Button, ProfileAvatarUploader, ProfileEditForm } from '@uandi/ui';
import { useAuth } from '@/hooks/useAuth';
import { useUpdateProfile } from '@/hooks/useUpdateProfile';
import { uploadProfilePhoto, deleteProfilePhoto } from '@/lib/firebase/storage';
import { compressImage } from '@/utils/image-compress';

// 큰 사진만 압축한다(작은 파일은 그대로 업로드). usePhotos와 동일한 기준.
const COMPRESS_THRESHOLD = 1.5 * 1024 * 1024;

export default function ProfileEditPage() {
  const router = useRouter();
  const { user } = useAuth();
  const updateProfile = useUpdateProfile();
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  if (!user) return null;

  const handleSelectFile = async (file: File) => {
    try {
      setUploadProgress(0);
      const toUpload = file.size > COMPRESS_THRESHOLD ? await compressImage(file) : file;
      const url = await uploadProfilePhoto({
        uid: user.uid,
        file: toUpload,
        onProgress: setUploadProgress,
      });
      updateProfile.mutate({ photoURL: url });
    } catch {
      toast.error('사진 업로드에 실패했어요. 다시 시도해주세요.');
    } finally {
      setUploadProgress(null);
    }
  };

  const handleRemove = async () => {
    await deleteProfilePhoto(user.uid);
    updateProfile.mutate({ photoURL: null });
  };

  const handleNameSubmit = (values: { displayName: string }) => {
    updateProfile.mutate({ displayName: values.displayName });
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header
        data-testid="profile-edit-header"
        title="프로필 편집"
        leftSlot={
          <Button variant="ghost" size="icon" onClick={() => router.back()} aria-label="뒤로가기">
            <ArrowLeft size={20} />
          </Button>
        }
      />
      <main className="max-w-md mx-auto w-full px-4 pt-6 pb-12 space-y-8">
        <ProfileAvatarUploader
          photoURL={user.photoURL}
          displayName={user.displayName}
          onSelectFile={handleSelectFile}
          onRemove={handleRemove}
          uploadProgress={uploadProgress}
          disabled={updateProfile.isPending}
        />
        <ProfileEditForm
          key={user.uid}
          initialDisplayName={user.displayName}
          onSubmit={handleNameSubmit}
          isSubmitting={updateProfile.isPending}
        />
      </main>
    </div>
  );
}
