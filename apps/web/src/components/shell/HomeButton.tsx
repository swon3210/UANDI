'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { House } from 'lucide-react';
import { Button } from '@uandi/ui';
import { CASHBOOK_ROOT } from './BackButton';

type HomeButtonProps = {
  /** 이동할 홈. 생략하면 가계부 대시보드 */
  href?: string;
  'data-testid'?: string;
};

/**
 * 헤더 우측 "홈으로" 버튼. 하위 페이지의 기본 출구는 ←(BackButton)지만,
 * 기록이 여러 단계 쌓이는 흐름(예산 위저드)을 지나 도착한 페이지에서는 ←가 대시보드에 닿지 않아
 * 이 버튼을 조건부로 함께 둔다. 현재 기록을 대시보드로 바꾼다(replace).
 */
export function HomeButton({
  href = CASHBOOK_ROOT,
  'data-testid': testId = 'header-home',
}: HomeButtonProps) {
  const t = useTranslations('shell');
  return (
    <Button asChild variant="ghost" size="sm" className="h-8 gap-1 px-2 text-stone-600">
      <Link href={href} replace data-testid={testId}>
        <House size={16} aria-hidden />
        {t('home')}
      </Link>
    </Button>
  );
}
