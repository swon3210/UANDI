'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { ImagePlus, Trash2 } from 'lucide-react';
import { Button, Progress } from '@uandi/ui';
import {
  uploadCashbookBackground,
  deleteCashbookBackground,
} from '@/lib/firebase/storage';

type BackgroundImageUploaderProps = {
  userId: string;
  currentImageUrl: string | null;
  onUploaded: (url: string) => void;
  onRemoved: () => void;
};

export function BackgroundImageUploader({
  userId,
  currentImageUrl,
  onUploaded,
  onRemoved,
}: BackgroundImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadProgress(0);
      const url = await uploadCashbookBackground({
        userId,
        file,
        onProgress: setUploadProgress,
      });
      onUploaded(url);
    } finally {
      setUploadProgress(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemove = async () => {
    if (!currentImageUrl) return;
    try {
      setIsDeleting(true);
      await deleteCashbookBackground(userId, currentImageUrl);
      onRemoved();
    } finally {
      setIsDeleting(false);
    }
  };

  const isUploading = uploadProgress !== null;

  return (
    <div className="space-y-3">
      {currentImageUrl ? (
        <div className="relative h-40 overflow-hidden rounded-lg">
          <Image
            src={currentImageUrl}
            alt="가계부 배경"
            fill
            className="object-cover"
            sizes="(max-width: 448px) 100vw, 448px"
          />
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/30">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading || isDeleting}
            >
              <ImagePlus size={16} className="mr-1" />
              변경
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleRemove}
              disabled={isUploading || isDeleting}
            >
              <Trash2 size={16} className="mr-1" />
              삭제
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className="flex h-40 w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/25 text-muted-foreground transition-colors hover:border-muted-foreground/50"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          <ImagePlus size={32} />
          <span className="text-sm">배경 이미지 선택</span>
        </button>
      )}

      {isUploading && (
        <div className="space-y-1">
          <Progress value={uploadProgress} className="h-2" />
          <p className="text-xs text-muted-foreground text-center">
            업로드 중... {uploadProgress}%
          </p>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
