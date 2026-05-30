'use client';

import { MessageCircle } from 'lucide-react';
import { EmptyState } from '@uandi/ui';
import { PageHeader } from '@/components/shell/PageHeader';

export default function CommunityFeedPage() {
  return (
    <>
      <PageHeader title="커뮤니티" data-testid="community-header" />
      <main className="mx-auto max-w-md px-4 pb-8 pt-4">
        <div data-testid="community-empty">
          <EmptyState
            icon={<MessageCircle />}
            title="아직 글이 없어요"
            description="신혼부부들의 이야기가 곧 채워질 거예요."
          />
        </div>
      </main>
    </>
  );
}
