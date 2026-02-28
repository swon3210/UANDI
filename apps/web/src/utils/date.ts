import dayjs from 'dayjs';
import 'dayjs/locale/ko';
import type { Timestamp } from 'firebase/firestore';

dayjs.locale('ko');

export function formatDate(date: Date | Timestamp): string {
  const d = 'toDate' in date ? date.toDate() : date;
  return dayjs(d).format('YYYY년 M월 D일');
}

export function formatMonthYear(date: Date): string {
  return dayjs(date).format('YYYY년 M월');
}

export function formatDay(date: Date | Timestamp): string {
  const d = 'toDate' in date ? date.toDate() : date;
  return dayjs(d).format('M월 D일');
}
