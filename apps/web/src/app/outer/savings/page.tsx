'use client';

import { useAtomValue } from 'jotai';
import { overlay } from 'overlay-kit';
import dayjs from 'dayjs';
import { PiggyBank, Plus } from 'lucide-react';
import { Button, EmptyState, Sheet } from '@uandi/ui';
import { userAtom } from '@/stores/auth.store';
import { PageHeader } from '@/components/shell/PageHeader';
import { MascotLoader } from '@/components/MascotLoader';
import { SavingsAccountCard } from '@/components/outer/SavingsAccountCard';
import { SavingsForm, type SavingsFormValues } from '@/components/outer/SavingsForm';
import { SavingsSummaryCard } from '@/components/outer/SavingsSummaryCard';
import { useOuterAssetMutations, useOuterAssets } from '@/hooks/useOuterAssets';
import { parseSavingsScreenshot } from '@/services/investment-api';
import { toAssetInput } from '@/services/outer-assets';
import { compressAndEncode } from '@/utils/image-compress';
import { projectSavings } from '@/utils/savings';
import type { SavingsAccount } from '@/types';

/** 캡처 파싱 결과 → 폼 값. 만기일이 없으면 가입일 + 기간(개월)으로 채운다. */
async function importSavingsScreenshot(file: File): Promise<Partial<SavingsFormValues> | null> {
  const { dataUrl } = await compressAndEncode(file);
  const { isSavingsProduct, product } = await parseSavingsScreenshot(dataUrl);
  if (!isSavingsProduct) return null;

  const values: Partial<SavingsFormValues> = {
    productType: product.productType,
    interestMethod: product.interestMethod,
    depositCycle: product.depositCycle,
    taxType: product.taxType,
  };
  if (product.name) values.name = product.name;
  if (product.bank) values.bank = product.bank;
  if (product.interestRate !== null) values.interestRate = product.interestRate;
  if (product.depositAmount !== null) values.depositAmount = Math.round(product.depositAmount);
  if (product.depositDay !== null) values.depositDay = product.depositDay;

  const start = product.startDate ?? dayjs().format('YYYY-MM-DD');
  values.startDate = start;
  if (product.maturityDate) values.maturityDate = product.maturityDate;
  else if (product.termMonths) {
    values.maturityDate = dayjs(start).add(product.termMonths, 'month').format('YYYY-MM-DD');
  }
  if (product.depositDay === null && product.depositCycle === 'monthly') {
    values.depositDay = dayjs(start).date();
  }
  return values;
}

export default function OuterSavingsPage() {
  const user = useAtomValue(userAtom);
  const uid = user?.uid ?? null;
  const coupleId = user?.coupleId ?? null;

  const { data: accounts, isLoading } = useOuterAssets(coupleId, uid, 'savings');
  const { add, update, remove } = useOuterAssetMutations(coupleId, uid, 'savings');

  const items = (accounts ?? [])
    .map((account) => ({ account, projection: projectSavings(account) }))
    // 진행 중 → 만기 순, 진행 중끼리는 만기 임박 순
    .sort((a, b) =>
      a.projection.isMatured !== b.projection.isMatured
        ? a.projection.isMatured
          ? 1
          : -1
        : a.projection.daysToMaturity - b.projection.daysToMaturity
    );
  const active = items.filter((i) => !i.projection.isMatured);
  const summary = {
    currentPrincipal: active.reduce((s, i) => s + i.projection.currentPrincipal, 0),
    maturityAmount: active.reduce((s, i) => s + i.projection.maturityAmount, 0),
  };

  const openForm = (account?: SavingsAccount) => {
    const today = dayjs();
    overlay.open(({ isOpen, close, unmount }) => (
      <Sheet open={isOpen} onOpenChange={(open) => !open && close()}>
        <SavingsForm
          initial={account ? toAssetInput<'savings'>(account) : undefined}
          defaults={{
            startDate: today.format('YYYY-MM-DD'),
            maturityDate: today.add(12, 'month').format('YYYY-MM-DD'),
            depositDay: today.date(),
          }}
          onImportScreenshot={account ? undefined : importSavingsScreenshot}
          onSubmit={(input) =>
            account ? update.mutate({ id: account.id, input }) : add.mutate([input])
          }
          onDelete={account ? () => remove.mutate(account.id) : undefined}
          onClose={() => {
            close();
            setTimeout(unmount, 300);
          }}
        />
      </Sheet>
    ));
  };

  return (
    <>
      <PageHeader
        data-testid="outer-savings-header"
        title="예적금"
        rightSlot={
          <Button
            variant="ghost"
            size="icon"
            aria-label="예적금 등록"
            data-testid="savings-add-button"
            onClick={() => openForm()}
          >
            <Plus className="h-5 w-5" />
          </Button>
        }
      />
      <main className="mx-auto max-w-md space-y-4 px-4 pb-20 pt-4">
        {isLoading || !uid || !coupleId ? (
          <MascotLoader fullScreen />
        ) : items.length === 0 ? (
          <EmptyState
            icon={<PiggyBank size={48} />}
            title="예적금을 등록해 보세요"
            description="상품 설명 화면을 캡처해 올리면 만기·이율·입금액을 자동으로 채워드려요. 자동이체 주기대로 원금이 쌓이고 만기 예상 금액도 계산해요."
            action={
              <Button onClick={() => openForm()} data-testid="savings-empty-add">
                예적금 등록하기
              </Button>
            }
          />
        ) : (
          <>
            <SavingsSummaryCard
              currentPrincipal={summary.currentPrincipal}
              maturityAmount={summary.maturityAmount}
              activeCount={active.length}
            />
            <div className="space-y-3">
              {items.map(({ account, projection }) => (
                <SavingsAccountCard
                  key={account.id}
                  account={account}
                  projection={projection}
                  onClick={() => openForm(account)}
                />
              ))}
            </div>
          </>
        )}
      </main>
    </>
  );
}
