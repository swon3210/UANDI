'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Textarea,
} from '@uandi/ui';
import { TagInput } from '@/components/photos/TagInput';
import type { Folder, Photo } from '@/types';

const editSchema = z.object({
  folderId: z.string().min(1),
  tags: z.array(z.string()),
  caption: z.string(),
});

type EditFormValues = z.infer<typeof editSchema>;

type PhotoEditSheetProps = {
  photo: Photo;
  folders: Folder[];
  tagSuggestions?: string[];
  isPending: boolean;
  onSubmit: (data: EditFormValues) => void;
};

export function PhotoEditSheet({
  photo,
  folders,
  tagSuggestions = [],
  isPending,
  onSubmit,
}: PhotoEditSheetProps) {
  const form = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      folderId: photo.folderId,
      tags: photo.tags ?? [],
      caption: photo.caption ?? '',
    },
  });

  return (
    <SheetContent side="bottom" className="rounded-t-[20px] max-h-[90vh] overflow-y-auto">
      <SheetHeader>
        <SheetTitle>사진 편집</SheetTitle>
      </SheetHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 px-1 pb-4">
          {/* 폴더 변경 */}
          <FormField
            control={form.control}
            name="folderId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>폴더</FormLabel>
                <FormControl>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger aria-label="폴더">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {folders.map((f) => (
                        <SelectItem key={f.id} value={f.id}>
                          {f.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
              </FormItem>
            )}
          />

          {/* 캡션 */}
          <FormField
            control={form.control}
            name="caption"
            render={({ field }) => (
              <FormItem>
                <FormLabel>캡션</FormLabel>
                <FormControl>
                  <Textarea {...field} aria-label="캡션" />
                </FormControl>
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={isPending}>
            저장
          </Button>
        </form>
      </Form>
    </SheetContent>
  );
}
