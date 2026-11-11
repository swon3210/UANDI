import type { AdminUserRow } from '@/services/admin';

/** 스토리용 프로필 사진(외부 요청 없이 그리는 인라인 SVG). */
const SAMPLE_PHOTO =
  'data:image/svg+xml;utf8,<svg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 40 40%27><rect width=%2740%27 height=%2740%27 fill=%27%23E8837A%27/><circle cx=%2720%27 cy=%2716%27 r=%277%27 fill=%27white%27/><rect x=%279%27 y=%2726%27 width=%2722%27 height=%2712%27 rx=%276%27 fill=%27white%27/></svg>';

/** 스토리용 샘플 사용자(실제 계정 아님). */
export const SAMPLE_ADMIN_USERS: AdminUserRow[] = [
  {
    uid: 'uid-a',
    email: 'minji@example.com',
    displayName: '민지',
    photoURL: SAMPLE_PHOTO,
    createdAt: '2026-09-02T03:00:00.000Z',
    lastActiveAt: '2026-11-10T12:30:00.000Z',
    coupleId: 'couple-1',
    partnerEmail: 'junho@example.com',
    myEntryCount: 142,
    coupleEntryCount: 230,
    lastEntryAt: '2026-11-10T11:00:00.000Z',
    platforms: [
      { name: 'android', lastSeenAt: '2026-11-10T12:30:00.000Z' },
      { name: 'web', lastSeenAt: '2026-10-28T09:00:00.000Z' },
    ],
  },
  {
    uid: 'uid-b',
    email: 'junho@example.com',
    displayName: '준호',
    photoURL: null,
    createdAt: '2026-09-03T08:00:00.000Z',
    lastActiveAt: '2026-11-08T22:10:00.000Z',
    coupleId: 'couple-1',
    partnerEmail: 'minji@example.com',
    myEntryCount: 88,
    coupleEntryCount: 230,
    lastEntryAt: '2026-11-10T11:00:00.000Z',
    platforms: [
      { name: 'ios', lastSeenAt: '2026-11-08T22:10:00.000Z' },
      { name: 'web', lastSeenAt: null },
    ],
  },
  {
    uid: 'uid-c',
    email: 'a-very-long-email-address-for-layout-check@example.com',
    displayName: null,
    photoURL: null,
    createdAt: '2026-10-20T01:00:00.000Z',
    lastActiveAt: '2026-10-20T01:05:00.000Z',
    coupleId: 'couple-2',
    partnerEmail: null,
    myEntryCount: 0,
    coupleEntryCount: 0,
    lastEntryAt: null,
    platforms: [],
  },
  {
    uid: 'uid-d',
    email: 'solo@example.com',
    displayName: '혼자 써보는 사람',
    photoURL: null,
    createdAt: '2026-11-01T05:00:00.000Z',
    lastActiveAt: null,
    coupleId: null,
    partnerEmail: null,
    myEntryCount: 0,
    coupleEntryCount: 0,
    lastEntryAt: null,
    platforms: [{ name: 'web', lastSeenAt: '2026-11-01T05:00:00.000Z' }],
  },
];
