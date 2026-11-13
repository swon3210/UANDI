'use client';

import { useEffect } from 'react';
import dayjs from 'dayjs';
import 'dayjs/locale/ko';
import type { Locale } from '@/lib/locale';

/**
 * 서버가 정한 로케일을 전역 상태를 가진 외부 라이브러리(dayjs)에 동기화한다.
 * dayjs 는 모듈 전역 로케일을 쓰므로 React 상태로 표현할 수 없어 useEffect 가 맞다.
 * 서버 렌더에서는 utils/date.ts 가 'ko' 로 초기화한 값이 쓰인다.
 */
export function LocaleSync({ locale }: { locale: Locale }) {
  useEffect(() => {
    dayjs.locale(locale);
  }, [locale]);

  return null;
}
