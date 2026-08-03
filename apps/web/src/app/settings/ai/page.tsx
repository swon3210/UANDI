'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import {
  Header,
  Button,
  AnalyzeSpendingPreferences,
  CashflowPredictionPreferences,
  ParseEntriesPreferences,
  DEFAULT_AI_PREFERENCES,
  type AiPreferences,
} from '@uandi/ui';
import { useAuth } from '@/hooks/useAuth';
import { useCashbookCategories } from '@/hooks/useCashbookCategories';
import { useAiPreferences, useSaveAiPreferences } from '@/hooks/useAiPreferences';

export default function AiSettingsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const coupleId = user?.coupleId ?? null;

  const { data: preferences } = useAiPreferences(coupleId);
  const { data: categories } = useCashbookCategories(coupleId);

  const categoryNames = useMemo(
    () => [...new Set((categories ?? []).map((c) => c.name))],
    [categories]
  );

  if (!user) return null;

  return (
    <div className="flex min-h-screen flex-col">
      <Header
        data-testid="ai-settings-header"
        title="AI 설정"
        leftSlot={
          <Button variant="ghost" size="icon" onClick={() => router.back()} aria-label="뒤로가기">
            <ArrowLeft size={20} />
          </Button>
        }
      />
      <main className="max-w-md mx-auto w-full px-4 pt-6 pb-12">
        <p className="mb-6 text-sm text-muted-foreground">
          가계부 AI가 쓰는 프롬프트를 우리 커플에 맞게 조정해요. 끈 기능은 기본 동작을 사용해요.
        </p>
        {preferences ? (
          // 데이터가 채워진 뒤 key 로 마운트 → 초기값을 로컬 상태로 시드(useEffect 없이).
          <AiPreferencesEditor
            key={coupleId ?? 'none'}
            coupleId={coupleId}
            initialPreferences={preferences}
            categories={categoryNames}
          />
        ) : (
          <p className="pt-10 text-center text-sm text-muted-foreground">불러오는 중...</p>
        )}
      </main>
    </div>
  );
}

function AiPreferencesEditor({
  coupleId,
  initialPreferences,
  categories,
}: {
  coupleId: string | null;
  initialPreferences: AiPreferences;
  categories: string[];
}) {
  const [prefs, setPrefs] = useState<AiPreferences>(initialPreferences);
  const saveMutation = useSaveAiPreferences(coupleId);
  const isSaving = saveMutation.isPending;

  return (
    <div className="space-y-8">
      <AnalyzeSpendingPreferences
        value={prefs.analyzeSpending}
        onChange={(analyzeSpending) => setPrefs((p) => ({ ...p, analyzeSpending }))}
        disabled={isSaving}
      />
      <CashflowPredictionPreferences
        value={prefs.cashflowPrediction}
        onChange={(cashflowPrediction) => setPrefs((p) => ({ ...p, cashflowPrediction }))}
        categories={categories}
        disabled={isSaving}
      />
      <ParseEntriesPreferences
        value={prefs.parseEntries}
        onChange={(parseEntries) => setPrefs((p) => ({ ...p, parseEntries }))}
        categories={categories}
        disabled={isSaving}
      />

      <p className="text-xs text-muted-foreground">
        맞춤 설정은 저장한 다음부터 적용돼요. AI 기능은 하루 최대 50회까지 사용할 수 있어요.
      </p>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          className="flex-1"
          data-testid="ai-pref-save"
          onClick={() => saveMutation.mutate(prefs)}
          disabled={isSaving}
        >
          {isSaving ? '저장 중...' : '저장'}
        </Button>
        <Button
          type="button"
          variant="outline"
          data-testid="ai-pref-reset"
          onClick={() => setPrefs(DEFAULT_AI_PREFERENCES)}
          disabled={isSaving}
        >
          기본값으로
        </Button>
      </div>
    </div>
  );
}
