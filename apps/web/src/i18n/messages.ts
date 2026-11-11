import type { Locale } from '@/lib/locale';

/**
 * 로케일별 메시지 로더. `apps/web/messages/{locale}/{namespace}.json` 을 네임스페이스별로 합친다.
 *
 * - 네임스페이스를 추가하면 여기 목록과 ko/en 두 파일을 함께 만든다.
 *   (`node scripts/check-message-parity.mjs` 가 ko/en 파일·키 불일치를 잡는다)
 * - 컴포넌트에서는 `useTranslations('settings')` 처럼 네임스페이스로 접근한다.
 */
export const MESSAGE_NAMESPACES = ['common', 'metadata', 'settings'] as const;
export type MessageNamespace = (typeof MESSAGE_NAMESPACES)[number];

export type Messages = Record<MessageNamespace, Record<string, unknown>>;

export async function loadMessages(locale: Locale): Promise<Messages> {
  const entries = await Promise.all(
    MESSAGE_NAMESPACES.map(async (ns) => {
      const mod = await import(`../../messages/${locale}/${ns}.json`);
      return [ns, mod.default] as const;
    })
  );
  return Object.fromEntries(entries) as Messages;
}
