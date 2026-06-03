import { onSchedule } from 'firebase-functions/v2/scheduler';
import { logger } from 'firebase-functions/v2';

// 커뮤니티 크롤 스케줄 트리거.
// 실제 크롤 구현은 web의 /api/community/crawl(runCrawl) 단일 소스에 있다.
// 이 함수는 6시간마다 그 엔드포인트를 공유 시크릿으로 호출하는 얇은 트리거다.
//
// 필요한 환경변수 (배포 시 functions config로 설정):
//   COMMUNITY_WEB_BASE_URL   — 배포된 web 앱의 베이스 URL (예: https://uandi.app)
//   CRAWL_TRIGGER_SECRET     — web의 동명 env와 동일한 시크릿 (x-crawl-secret 헤더로 전달)

export const crawlCommunityFeeds = onSchedule(
  {
    schedule: 'every 6 hours',
    region: 'asia-northeast3',
    timeoutSeconds: 540,
    secrets: ['CRAWL_TRIGGER_SECRET'],
  },
  async () => {
    const baseUrl = process.env.COMMUNITY_WEB_BASE_URL;
    const secret = process.env.CRAWL_TRIGGER_SECRET;
    if (!baseUrl || !secret) {
      logger.error('crawlCommunityFeeds: COMMUNITY_WEB_BASE_URL/CRAWL_TRIGGER_SECRET 미설정');
      return;
    }

    const res = await fetch(`${baseUrl}/api/community/crawl`, {
      method: 'POST',
      headers: { 'x-crawl-secret': secret },
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      logger.error('crawlCommunityFeeds: 크롤 엔드포인트 실패', { status: res.status, text });
      return;
    }

    const summary = (await res.json().catch(() => ({}))) as { created?: number; skipped?: number };
    logger.info('crawlCommunityFeeds 완료', summary);
  }
);
