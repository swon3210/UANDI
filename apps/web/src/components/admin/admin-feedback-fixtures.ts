import type { AdminFeedbackItem } from '@/services/admin-feedback';

// 스토리용 샘플 이미지(작은 SVG 데이터 URL)
const SCREENSHOT =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='390' height='844'><rect width='390' height='844' fill='%23f4ede8'/><rect x='20' y='80' width='350' height='120' rx='16' fill='%23E8837A'/><text x='40' y='150' font-size='28' fill='white'>저장이 안 돼요</text></svg>";

const base: Omit<AdminFeedbackItem, 'id' | 'type' | 'content'> = {
  status: 'new',
  contactEmail: 'minji@example.com',
  createdAt: '2026-11-14T09:12:00.000Z',
  author: {
    uid: 'u1',
    email: 'minji@example.com',
    displayName: '민지',
    photoURL: null,
  },
  screenshotUrl: null,
  context: {
    platform: 'android',
    userAgent:
      'Mozilla/5.0 (Linux; Android 14; SM-S921N Build/UP1A.231005.007; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/131.0.6778.135 Mobile Safari/537.36',
    appVersion: 'c1964146',
    previousPath: '/inner/cashbook/history',
    viewport: '412x915',
  },
};

export const FEEDBACK_BUG_WITH_SCREENSHOT: AdminFeedbackItem = {
  ...base,
  id: 'fb1',
  type: 'bug',
  content: '내역 화면에서 저장 버튼을 누르면 아무 반응이 없어요.\n두 번 눌러도 마찬가지예요.',
  screenshotUrl: SCREENSHOT,
};

export const FEEDBACK_IDEA_NO_SCREENSHOT: AdminFeedbackItem = {
  ...base,
  id: 'fb2',
  type: 'idea',
  status: 'checked',
  content: '월간 리포트를 메일로 받고 싶어요',
  createdAt: '2026-11-13T21:40:00.000Z',
  context: { ...base.context, platform: 'web', appVersion: null, previousPath: null },
};

export const FEEDBACK_LONG_CONTENT: AdminFeedbackItem = {
  ...base,
  id: 'fb3',
  type: 'other',
  status: 'resolved',
  content: '앱을 잘 쓰고 있어요. '.repeat(80),
  createdAt: '2026-11-12T08:00:00.000Z',
};

export const FEEDBACK_DIFFERENT_CONTACT: AdminFeedbackItem = {
  ...base,
  id: 'fb4',
  type: 'bug',
  content: '애플 로그인 후 이름이 비어 있어요',
  contactEmail: 'real-me@example.com',
  author: {
    uid: 'u2',
    email: 'abc123@privaterelay.appleid.com',
    displayName: '',
    photoURL: null,
  },
  context: { ...base.context, platform: 'ios' },
};

export const SAMPLE_ADMIN_FEEDBACK: AdminFeedbackItem[] = [
  FEEDBACK_BUG_WITH_SCREENSHOT,
  FEEDBACK_DIFFERENT_CONTACT,
  FEEDBACK_IDEA_NO_SCREENSHOT,
  FEEDBACK_LONG_CONTENT,
];
