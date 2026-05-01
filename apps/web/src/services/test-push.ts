import { httpsCallable, type HttpsCallableResult } from 'firebase/functions';
import { getFunctionsAsia } from '@/lib/firebase/config';

export type SendTestPushResult = {
  successCount: number;
  failureCount: number;
  failures: Array<{ index: number; error: string }>;
};

export async function sendTestPush(): Promise<SendTestPushResult> {
  const fn = httpsCallable<void, SendTestPushResult>(getFunctionsAsia(), 'sendTestPush');
  const result: HttpsCallableResult<SendTestPushResult> = await fn();
  return result.data;
}
