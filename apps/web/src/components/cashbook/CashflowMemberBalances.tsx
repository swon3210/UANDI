'use client';

import { cn } from '@uandi/ui';
import { AuthorAvatar } from './AuthorAvatar';
import { formatCurrency } from '@/utils/currency';
import type { CashflowMember } from '@/utils/cashflow';

type CashflowMemberBalancesProps = {
  members: CashflowMember[];
  /** uid→잔액. 없는 uid는 0으로 본다. */
  balanceByUid: Record<string, number>;
  /** 촘촘한(카드 하단용) 배치. 기본은 살짝 여유 있는 배치. */
  dense?: boolean;
  className?: string;
};

/**
 * 커플 각자의 예상 잔액을 아바타+이름+금액 칩으로 나란히 보여준다.
 * 합계 잔액을 보조 설명하는 용도로 카드·히어로 카드 하단에 재사용한다.
 * 멤버가 2명 미만이면(개인/미연결) 사람별 표기가 무의미하므로 렌더하지 않는다.
 */
export function CashflowMemberBalances({
  members,
  balanceByUid,
  dense = false,
  className,
}: CashflowMemberBalancesProps) {
  if (members.length < 2) return null;

  return (
    <div className={cn('grid grid-cols-2 gap-2', className)} data-testid="cashflow-member-balances">
      {members.map((m) => {
        const balance = balanceByUid[m.uid] ?? 0;
        const negative = balance < 0;
        return (
          <div
            key={m.uid}
            data-testid="cashflow-member-balance"
            data-uid={m.uid}
            className={cn(
              'flex items-center gap-2 rounded-lg border border-border/60 bg-background/60 px-2.5',
              dense ? 'py-1.5' : 'py-2'
            )}
          >
            <AuthorAvatar author={{ displayName: m.displayName, photoURL: m.photoURL }} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[11px] leading-tight text-muted-foreground">
                {m.displayName}
              </p>
              <p
                className={cn(
                  'truncate text-sm font-semibold leading-tight tabular-nums',
                  negative ? 'text-expense' : 'text-foreground'
                )}
              >
                {formatCurrency(balance)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
