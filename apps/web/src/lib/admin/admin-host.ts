/**
 * 어드민 전용 도메인(예: uandi-admin.vercel.app — docs/pages/06-admin.md).
 * 값이 있으면 그 도메인의 / 가 어드민 화면이 되고, 다른 도메인의 /admin 은 그리로 보낸다.
 * 비어 있으면(로컬·E2E) 어느 도메인에서나 /admin 으로 접근한다.
 */
export const ADMIN_HOST = process.env.NEXT_PUBLIC_ADMIN_HOST ?? '';

/** host 는 포트를 포함한 값(Host 헤더 / location.host). */
export function isAdminHost(host: string | null | undefined): boolean {
  return !!ADMIN_HOST && host === ADMIN_HOST;
}
