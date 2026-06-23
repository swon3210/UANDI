'use client';

import { useState } from 'react';
import { Button, Input } from '@uandi/ui';
import { Sparkles } from 'lucide-react';
import { CategoryHeader } from './RegularAvgInput';
import { MonthlyGrid } from '../MonthlyGrid';
import { formatCurrencyMan } from '@/utils/currency';
import type { CashbookCategory } from '@/types';

type IrregularGridInputProps = {
  category: CashbookCategory;
  /** 길이 12 */
  monthlyAmounts: number[];
  onChange: (next: number[]) => void;
};

export function IrregularGridInput({
  category,
  monthlyAmounts,
  onChange,
}: IrregularGridInputProps) {
  const annual = monthlyAmounts.reduce((s, v) => s + v, 0);
  /**
   * 균등채우기 입력란의 값(숫자만). 그리드 합계(annual)와 독립적으로 관리한다.
   * 그리드 합계를 자동으로 끌어오지 않으므로 "내가 입력한 연 합계"만 분배된다.
   */
  const [spreadInput, setSpreadInput] = useState('');

  const handleSpread = () => {
    const total = Number(spreadInput.replace(/[^\d]/g, ''));
    if (!Number.isFinite(total) || total <= 0) {
      setSpreadInput('');
      return;
    }
    const base = Math.floor(total / 12);
    const remainder = total - base * 12;
    const arr = Array(12).fill(base);
    // 나머지를 1월부터 채워 합계가 정확히 일치하도록
    for (let i = 0; i < remainder; i += 1) arr[i] += 1;
    onChange(arr);
    setSpreadInput('');
  };

  return (
    <div className="space-y-5" data-testid="irregular-grid-input">
      <CategoryHeader category={category} caption="비정기 항목" />

      <section className="rounded-2xl border border-stone-200 bg-white p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="text-[12px] font-medium text-stone-700">균등 채우기</div>
            <p className="text-[11px] leading-relaxed text-stone-500">
              연 합계를 입력하고 버튼을 누르면 12개월에 균등 분배해요.
            </p>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <Input
            type="text"
            inputMode="numeric"
            value={spreadInput === '' ? '' : Number(spreadInput).toLocaleString('ko-KR')}
            data-testid="irregular-spread-input"
            onChange={(e) => {
              setSpreadInput(e.target.value.replace(/[^\d]/g, ''));
            }}
            placeholder="연 합계 입력"
            className="h-10 flex-1 text-right tabular-nums"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            // blur가 click보다 먼저 발화해도 spreadInput은 유지되므로 입력값이 그대로 분배된다.
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleSpread}
            className="gap-1.5"
            data-testid="irregular-spread-apply"
          >
            <Sparkles size={14} />
            채우기
          </Button>
        </div>
      </section>

      <MonthlyGrid
        values={monthlyAmounts}
        onChange={onChange}
        inputTestIdPrefix="irregular-grid-cell"
      />

      <section className="rounded-2xl border border-coral-100 bg-coral-50/60 px-5 py-4">
        <div className="flex items-baseline justify-between">
          <span className="text-[12px] font-medium text-coral-700">연간 합계</span>
          <span
            className="text-[18px] font-bold tabular-nums text-coral-700"
            data-testid="irregular-grid-annual"
          >
            {formatCurrencyMan(annual)}원
          </span>
        </div>
        <p className="mt-1 text-[11px] text-coral-600/80">
          특정 달에만 발생하는 항목이라면 해당 셀에만 금액을 입력하세요.
        </p>
      </section>
    </div>
  );
}
