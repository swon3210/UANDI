'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@uandi/ui';

type AiTagSuggestionsProps = {
  disabled: boolean;
  existingTags: string[];
  imageFile: File | null;
  suggestFn: (
    imageBase64: string,
    existingTags: string[]
  ) => Promise<{ suggestedTags: string[] }>;
  onTagsSelected: (tags: string[]) => void;
};

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function AiTagSuggestions({
  disabled,
  existingTags,
  imageFile,
  suggestFn,
  onTagsSelected,
}: AiTagSuggestionsProps) {
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());

  const mutation = useMutation({
    mutationFn: async () => {
      if (!imageFile) throw new Error('이미지를 선택해주세요');
      const base64 = await fileToBase64(imageFile);
      return suggestFn(base64, existingTags);
    },
    onSuccess: () => {
      setSelectedTags(new Set());
    },
  });

  const suggestions = mutation.data?.suggestedTags ?? [];

  const toggleTag = (tag: string) => {
    const next = new Set(selectedTags);
    if (next.has(tag)) {
      next.delete(tag);
    } else {
      next.add(tag);
    }
    setSelectedTags(next);
    onTagsSelected(Array.from(next));
  };

  return (
    <div className="space-y-2">
      <Button
        type="button"
        data-testid="ai-suggest-tags-btn"
        variant="outline"
        size="sm"
        onClick={() => mutation.mutate()}
        disabled={disabled || mutation.isPending}
        className="gap-1.5"
      >
        {mutation.isPending ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <Sparkles size={14} />
        )}
        AI 태그 제안
      </Button>

      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {suggestions.map((tag) => (
            <button
              key={tag}
              type="button"
              data-testid="ai-suggested-tag"
              onClick={() => toggleTag(tag)}
              className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                selectedTags.has(tag)
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-secondary border-border hover:bg-accent'
              }`}
            >
              #{tag}
            </button>
          ))}
        </div>
      )}

      {mutation.error && (
        <p className="text-xs text-destructive">
          {mutation.error.message || '태그 제안에 실패했습니다'}
        </p>
      )}
    </div>
  );
}
