'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAtomValue } from 'jotai';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Header, Button, Separator } from '@uandi/ui';
import { userAtom } from '@/stores/auth.store';
import {
  useCashbookDisplaySettings,
  useUpdateCashbookDisplaySettings,
  useCashbookOpacity,
} from '@/hooks/useCashbookDisplaySettings';
import { BackgroundImageUploader } from '@/components/cashbook/BackgroundImageUploader';
import { OpacitySlider } from '@/components/cashbook/OpacitySlider';

export default function CashbookSettingsPage() {
  const router = useRouter();
  const user = useAtomValue(userAtom);
  const uid = user?.uid ?? null;

  const { data: displaySettings } = useCashbookDisplaySettings(uid);
  const updateMutation = useUpdateCashbookDisplaySettings(uid);
  const [opacity, setOpacity] = useCashbookOpacity();

  return (
    <div className="flex min-h-screen flex-col">
      <Header
        title="가계부 설정"
        leftSlot={
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => router.back()}>
            <ChevronLeft size={20} />
          </Button>
        }
      />

      <main className="flex-1 max-w-md mx-auto w-full px-4 pt-4 pb-20">
        <section className="space-y-2">
          <h2 className="text-sm font-medium text-muted-foreground">관리</h2>
          <Link
            href="/inner/cashbook/categories"
            data-testid="settings-link-categories"
            className="flex items-center justify-between rounded-xl border border-border bg-card p-4 text-sm font-medium"
          >
            카테고리 설정
            <ChevronRight size={18} className="text-muted-foreground" />
          </Link>
          <Link
            href="/inner/cashbook/history/weekly/notifications"
            data-testid="settings-link-notifications"
            className="flex items-center justify-between rounded-xl border border-border bg-card p-4 text-sm font-medium"
          >
            알림 설정
            <ChevronRight size={18} className="text-muted-foreground" />
          </Link>
        </section>

        <Separator className="my-6" />

        <section className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">배경 이미지</h2>
          {uid && (
            <BackgroundImageUploader
              userId={uid}
              currentImageUrl={displaySettings?.backgroundImageUrl ?? null}
              onUploaded={(url) => updateMutation.mutate({ backgroundImageUrl: url })}
              onRemoved={() => updateMutation.mutate({ backgroundImageUrl: null })}
            />
          )}
        </section>

        <Separator className="my-6" />

        <section className="space-y-3">
          <OpacitySlider value={opacity} onChange={setOpacity} />
        </section>
      </main>
    </div>
  );
}
