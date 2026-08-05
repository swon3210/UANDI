'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft } from 'lucide-react';
import { overlay } from 'overlay-kit';
import { toast } from 'sonner';
import {
  Header,
  Button,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  ProfileAvatarUploader,
} from '@uandi/ui';
import type { User } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { useUpdateProfile } from '@/hooks/useUpdateProfile';
import { uploadProfilePhoto, deleteProfilePhoto } from '@/lib/firebase/storage';
import { ProfileAvatarCropper } from '@/components/settings/ProfileAvatarCropper';

const NAME_MAX = 20;

const formSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(1, '이름을 입력해주세요')
    .max(NAME_MAX, `이름은 ${NAME_MAX}자까지 가능해요`),
});

type FormValues = z.infer<typeof formSchema>;

// 사진 draft — '완료'를 눌러야 실제 업로드/삭제된다.
type PhotoDraft =
  | { kind: 'unchanged' }
  | { kind: 'new'; file: File; previewUrl: string }
  | { kind: 'removed' };

export default function ProfileEditPage() {
  const router = useRouter();
  const { user } = useAuth();

  if (!user) return null;

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
      <main className="max-w-md mx-auto w-full px-4 pt-6 pb-12">
        {/* user가 확정된 뒤 마운트해 폼 기본값을 시드(useEffect 없이). */}
        <ProfileEditor key={user.uid} user={user} />
      </main>
    </div>
  );
}

function ProfileEditor({ user }: { user: User }) {
  const updateProfile = useUpdateProfile();
  const [photoDraft, setPhotoDraft] = useState<PhotoDraft>({ kind: 'unchanged' });
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { displayName: user.displayName },
    mode: 'onChange',
  });

  const effectivePhotoUrl =
    photoDraft.kind === 'new'
      ? photoDraft.previewUrl
      : photoDraft.kind === 'removed'
        ? null
        : user.photoURL;

  const photoDirty = photoDraft.kind !== 'unchanged';
  const saving = updateProfile.isPending || uploadProgress !== null;

  const handleSelectFile = async (file: File) => {
    const src = URL.createObjectURL(file);
    const cropped = await overlay.openAsync<File | null>(({ isOpen, close, unmount }) => (
      <ProfileAvatarCropper
        imageSrc={src}
        isOpen={isOpen}
        onCancel={() => {
          close(null);
          setTimeout(unmount, 300);
        }}
        onCropped={(f) => {
          close(f);
          setTimeout(unmount, 300);
        }}
      />
    ));
    URL.revokeObjectURL(src);
    if (!cropped) return;
    setPhotoDraft((prev) => {
      if (prev.kind === 'new') URL.revokeObjectURL(prev.previewUrl);
      return { kind: 'new', file: cropped, previewUrl: URL.createObjectURL(cropped) };
    });
  };

  const handleRemove = () => {
    setPhotoDraft((prev) => {
      if (prev.kind === 'new') URL.revokeObjectURL(prev.previewUrl);
      return { kind: 'removed' };
    });
  };

  const handleComplete = form.handleSubmit(async ({ displayName }) => {
    try {
      let photoURL = user.photoURL;
      if (photoDraft.kind === 'new') {
        setUploadProgress(0);
        photoURL = await uploadProfilePhoto({
          uid: user.uid,
          file: photoDraft.file,
          onProgress: setUploadProgress,
        });
      } else if (photoDraft.kind === 'removed') {
        await deleteProfilePhoto(user.uid);
        photoURL = null;
      }
      await updateProfile.mutateAsync({ displayName, photoURL });
      if (photoDraft.kind === 'new') URL.revokeObjectURL(photoDraft.previewUrl);
      setPhotoDraft({ kind: 'unchanged' });
      form.reset({ displayName });
    } catch {
      toast.error('저장에 실패했어요. 다시 시도해주세요.');
    } finally {
      setUploadProgress(null);
    }
  });

  const completeDisabled =
    !form.formState.isValid || saving || (!form.formState.isDirty && !photoDirty);

  return (
    <Form {...form}>
      <form onSubmit={handleComplete} className="space-y-8">
        <ProfileAvatarUploader
          photoURL={effectivePhotoUrl}
          displayName={user.displayName}
          onSelectFile={handleSelectFile}
          onRemove={handleRemove}
          uploadProgress={uploadProgress}
          disabled={saving}
        />
        <FormField
          control={form.control}
          name="displayName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>이름</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  data-testid="profile-name-input"
                  placeholder="이름을 입력하세요"
                  maxLength={NAME_MAX}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          className="w-full"
          data-testid="profile-complete"
          disabled={completeDisabled}
        >
          {saving ? '저장하는 중...' : '완료'}
        </Button>
      </form>
    </Form>
  );
}
