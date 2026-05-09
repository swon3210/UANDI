'use client';

type PlanWizardIntroProps = {
  year: number;
  incomeCount: number;
  expenseCount: number;
  flexCount: number;
};

export function PlanWizardIntro({
  year,
  incomeCount,
  expenseCount,
  flexCount,
}: PlanWizardIntroProps) {
  const total = incomeCount + expenseCount + flexCount;

  return (
    <div className="space-y-5" data-testid="wizard-intro">
      <section className="rounded-2xl bg-gradient-to-br from-coral-400 to-coral-500 p-6 text-white shadow-[0_6px_24px_hsl(4_74%_69%/0.3)]">
        <div className="text-[12px] opacity-85">{year}년 연간 예산</div>
        <h1 className="mt-1 text-[22px] font-extrabold leading-tight">
          한 해 예산을
          <br />
          단계별로 세워볼게요
        </h1>
        <p className="mt-3 text-[13px] leading-relaxed opacity-90">
          수입 → 지출 → Flex 순서로 카테고리별 월 금액을 입력하면
          <br />
          연간 합계와 잉여를 자동으로 보여드려요.
        </p>
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-5">
        <h2 className="text-[14px] font-semibold text-stone-900">진행 흐름</h2>
        <ol className="mt-3 space-y-2.5 text-[13px] text-stone-700">
          <FlowItem
            num={1}
            label={`수입 카테고리 ${incomeCount}개 입력`}
            hint="정기수입은 월 평균 → 12개월 그리드 순서"
          />
          <FlowItem
            num={2}
            label={`지출 카테고리 ${expenseCount}개 입력`}
            hint="고정 지출은 평균 입력, 변동/명절은 그리드 직접"
          />
          <FlowItem
            num={3}
            label={`Flex 카테고리 ${flexCount}개 입력`}
            hint="여행·각자 소비 등 자유 지출"
          />
          <FlowItem num={4} label="검증" hint="수입 ≥ 지출 + Flex 인지 확인" />
          <FlowItem num={5} label="완료" hint="결과 요약 후 메인으로" />
        </ol>
      </section>

      <section className="rounded-2xl border border-stone-200 bg-stone-50 p-5">
        <h2 className="text-[13px] font-semibold text-stone-700">알아두기</h2>
        <ul className="mt-2.5 space-y-1.5 text-[12px] leading-relaxed text-stone-600">
          <li>· 입력은 step마다 즉시 저장되며, 언제든 종료해도 다시 이어서 할 수 있어요.</li>
          <li>· 정기 항목은 평균을 입력한 뒤 12개월 그리드에서 특정 달만 조정할 수 있어요.</li>
          <li>· 비정기 항목은 그리드에서 직접 입력하거나 연 합계를 12등분으로 채워 넣어요.</li>
        </ul>
      </section>

      <p
        className="text-center text-[12px] text-stone-400"
        data-testid="wizard-intro-total"
      >
        총 {total}개 카테고리
      </p>
    </div>
  );
}

function FlowItem({
  num,
  label,
  hint,
}: {
  num: number;
  label: string;
  hint: string;
}) {
  return (
    <li className="flex gap-3">
      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-coral-100 text-[12px] font-bold text-coral-600">
        {num}
      </span>
      <div className="min-w-0">
        <div className="font-semibold text-stone-900">{label}</div>
        <div className="text-[12px] text-stone-500">{hint}</div>
      </div>
    </li>
  );
}
