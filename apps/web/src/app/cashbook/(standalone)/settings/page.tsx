'use client';

import { useRouter } from 'next/navigation';
import { useAtomValue } from 'jotai';
import { ChevronLeft } from 'lucide-react';
import { Header, Button, Separator } from '@uandi/ui';
import { userAtom } from '@/stores/auth.store';
import {
  useCashbookDisplaySettings,
  useUpdateCashbookDisplaySettings,
  useCashbookOpacity,
} from '@/hooks/useCashbookDisplaySettings';
import { BackgroundImageUploader } from '@/components/cashbook/BackgroundImageUploader';
import { OpacitySlider } from '@/components/cashbook/OpacitySlider';
import { BottomNav } from '@/components/BottomNav';

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
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => router.back()}
          >
            <ChevronLeft size={20} />
          </Button>
        }
      />

      <main className="flex-1 max-w-md mx-auto w-full px-4 pt-4 pb-20">
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">배경 이미지</h2>
          {uid && (
            <BackgroundImageUploader
              userId={uid}
              currentImageUrl={displaySettings?.backgroundImageUrl ?? null}
              onUploaded={(url) =>
                updateMutation.mutate({ backgroundImageUrl: url })
              }
              onRemoved={() =>
                updateMutation.mutate({ backgroundImageUrl: null })
              }
            />
          )}
        </section>

        <Separator className="my-6" />

        <section className="space-y-3">
          <OpacitySlider value={opacity} onChange={setOpacity} />
        </section>
      </main>

      <BottomNav activeTab="cashbook" />
    </div>
  );
}
