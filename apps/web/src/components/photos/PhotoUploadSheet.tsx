'use client';

import { useState, useRef, useCallback } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ImagePlus, X, Loader2 } from 'lucide-react';
import dayjs from 'dayjs';
import {
  SheetContent,
  SheetHeader,
  SheetTitle,
  Button,
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  Textarea,
  Input,
  Progress,
} from '@uandi/ui';
import { TagInput } from '@/components/photos/TagInput';
import { AiTagSuggestions } from '@/components/photos/AiTagSuggestions';
import { FolderCombobox } from '@/components/photos/FolderCombobox';
import { suggestPhotoTags } from '@/services/ai';
import type { Folder } from '@/types';

const uploadSchema = z.object({
  folderId: z.string().min(1, '폴더를 선택해주세요'),
  takenAt: z.string().min(1),
  tags: z.array(z.string()),
  caption: z.string(),
});

type UploadFormValues = z.infer<typeof uploadSchema>;

type SelectedFile = {
  file: File;
  previewUrl: string;
  width: number;
  height: number;
};

type ProgressInfo = {
  percent: number;
  current: number;
  total: number;
};

type PhotoUploadSheetProps = {
  folders: Folder[];
  tagSuggestions?: string[];
  onCreateFolder?: (name: string) => Promise<string>;
  onSubmit: (
    data: UploadFormValues & { files: SelectedFile[] },
    onProgress: (percent: number, current: number, total: number) => void
  ) => Promise<void>;
};

export function PhotoUploadSheet({
  folders,
  tagSuggestions = [],
  onCreateFolder,
  onSubmit,
}: PhotoUploadSheetProps) {
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState<ProgressInfo>({ percent: 0, current: 0, total: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<UploadFormValues>({
    resolver: zodResolver(uploadSchema),
    defaultValues: {
      folderId: '',
      takenAt: dayjs().format('YYYY-MM-DD'),
      tags: [],
      caption: '',
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        setSelectedFiles((prev) => [
          ...prev,
          { file, previewUrl: url, width: img.naturalWidth, height: img.naturalHeight },
        ]);
      };
      img.src = url;
    });

    // input 초기화 (같은 파일 재선택 가능)
    e.target.value = '';
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => {
      URL.revokeObjectURL(prev[index].previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleProgress = useCallback((percent: number, current: number, total: number) => {
    setProgress({ percent, current, total });
  }, []);

  const handleSubmit = async (data: UploadFormValues) => {
    if (selectedFiles.length === 0 || isUploading) return;
    setIsUploading(true);
    setProgress({ percent: 0, current: 0, total: selectedFiles.length });
    try {
      await onSubmit({ ...data, files: selectedFiles }, handleProgress);
    } finally {
      setIsUploading(false);
    }
  };

  const folderId = useWatch({ control: form.control, name: 'folderId' });
  const isSubmitDisabled = selectedFiles.length === 0 || !folderId || isUploading;

  return (
    <SheetContent side="bottom" className="rounded-t-[20px] max-h-[90vh] overflow-y-auto">
      <SheetHeader>
        <SheetTitle>사진 추가</SheetTitle>
      </SheetHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 px-1 pb-4">
          {/* 이미지 선택 영역 */}
          {selectedFiles.length > 0 && (
            <div className="grid grid-cols-3 gap-1.5">
              {selectedFiles.map((sf, i) => (
                <div key={sf.previewUrl} className="relative aspect-square">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={sf.previewUrl}
                    alt={`선택된 사진 ${i + 1}`}
                    className="w-full h-full object-cover rounded-md"
                  />
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    disabled={isUploading}
                    className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5"
                    aria-label={`사진 ${i + 1} 제거`}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div
            className="flex items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/50 cursor-pointer"
            style={{ minHeight: selectedFiles.length > 0 ? 48 : 160 }}
            onClick={() => !isUploading && fileInputRef.current?.click()}
          >
            <div className="flex items-center gap-2 py-3 text-muted-foreground">
              <ImagePlus size={selectedFiles.length > 0 ? 20 : 32} />
              <span className="text-sm">
                {selectedFiles.length > 0 ? '사진 추가하기' : '사진 선택하기'}
              </span>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              aria-label="사진 파일 선택"
            />
          </div>

          {/* 폴더 선택 */}
          <FormField
            control={form.control}
            name="folderId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  폴더 <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <FolderCombobox
                    folders={folders}
                    value={field.value}
                    onChange={field.onChange}
                    onCreateFolder={onCreateFolder}
                    disabled={isUploading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 촬영일 */}
          <FormField
            control={form.control}
            name="takenAt"
            render={({ field }) => (
              <FormItem>
                <FormLabel>촬영일</FormLabel>
                <FormControl>
                  <Input type="date" {...field} aria-label="촬영일" disabled={isUploading} />
                </FormControl>
              </FormItem>
            )}
          />

          {/* 태그 */}
          <FormField
            control={form.control}
            name="tags"
            render={({ field }) => (
              <FormItem>
                <FormLabel>태그</FormLabel>
                <FormControl>
                  <TagInput
                    value={field.value}
                    onChange={field.onChange}
                    suggestions={tagSuggestions}
                  />
                </FormControl>
                <AiTagSuggestions
                  disabled={selectedFiles.length === 0}
                  existingTags={tagSuggestions ?? []}
                  imageFile={selectedFiles[0]?.file ?? null}
                  suggestFn={suggestPhotoTags}
                  onTagsSelected={(tags) => {
                    const merged = new Set([...field.value, ...tags]);
                    field.onChange(Array.from(merged));
                  }}
                />
              </FormItem>
            )}
          />

          {/* 캡션 */}
          <FormField
            control={form.control}
            name="caption"
            render={({ field }) => (
              <FormItem>
                <FormLabel>캡션 (선택)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="이 순간을 기록해요"
                    {...field}
                    aria-label="캡션"
                    disabled={isUploading}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          {/* 업로드 진행 바 */}
          {isUploading && (
            <div className="space-y-1">
              <Progress value={progress.percent} className="h-2" />
              <p className="text-xs text-muted-foreground text-center">
                {progress.current}/{progress.total}장 업로드 중... {progress.percent}%
              </p>
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitDisabled}
            data-testid="upload-submit-btn"
          >
            {isUploading ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" />
                업로드 중...
              </>
            ) : selectedFiles.length > 0 ? (
              `${selectedFiles.length}장 업로드`
            ) : (
              '업로드'
            )}
          </Button>
        </form>
      </Form>
    </SheetContent>
  );
}
