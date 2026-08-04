'use client';

import { useRef } from 'react';
import { ImagePlus, Trash2, User as UserIcon } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '../../components/avatar';
import { Button } from '../../components/button';
import { Progress } from '../../components/progress';

export type ProfileAvatarUploaderProps = {
  photoURL: string | null;
  /** 사진이 없을 때 이니셜 폴백 및 이미지 alt에 사용. */
  displayName: string;
  /** 파일을 선택하면 호출된다. 압축·업로드는 상위에서 처리한다. */
  onSelectFile: (file: File) => void;
  onRemove: () => void;
  /** 0~100 업로드 진행률. null이면 업로드 중이 아니다. */
  uploadProgress?: number | null;
  disabled?: boolean;
};

/** 프로필 사진 미리보기 + 변경/삭제 버튼. 프레젠테이션 전용. */
export function ProfileAvatarUploader({
  photoURL,
  displayName,
  onSelectFile,
  onRemove,
  uploadProgress = null,
  disabled,
}: ProfileAvatarUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isUploading = uploadProgress !== null;
  const busy = isUploading || !!disabled;
  const initial = displayName.trim().charAt(0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onSelectFile(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <Avatar className="h-24 w-24" data-testid="profile-avatar">
        {photoURL ? <AvatarImage src={photoURL} alt={displayName} /> : null}
        <AvatarFallback className="text-2xl">
          {initial || <UserIcon size={32} />}
        </AvatarFallback>
      </Avatar>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={busy}
          data-testid="profile-avatar-change"
        >
          <ImagePlus size={16} className="mr-1" />
          {photoURL ? '사진 변경' : '사진 등록'}
        </Button>
        {photoURL ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={onRemove}
            disabled={busy}
            data-testid="profile-avatar-remove"
          >
            <Trash2 size={16} className="mr-1" />
            삭제
          </Button>
        ) : null}
      </div>

      {isUploading ? (
        <div className="w-full max-w-[200px] space-y-1" data-testid="profile-avatar-progress">
          <Progress value={uploadProgress} className="h-2" />
          <p className="text-center text-xs text-muted-foreground">
            업로드 중... {uploadProgress}%
          </p>
        </div>
      ) : null}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
        data-testid="profile-avatar-input"
      />
    </div>
  );
}
