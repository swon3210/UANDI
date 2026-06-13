import { redirect } from 'next/navigation';

/** 우리집 공간 루트 — 가계부 탭(대시보드)으로 보낸다. 하단탭에 별도 홈 탭은 없다. */
export default function InnerHomePage() {
  redirect('/inner/cashbook');
}
