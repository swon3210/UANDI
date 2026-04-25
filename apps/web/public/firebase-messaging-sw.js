// FCM 백그라운드 메시지 처리용 service worker.
// firebase-messaging은 service worker 내에서 ES module을 사용할 수 없어 compat SDK를 사용한다.

importScripts('https://www.gstatic.com/firebasejs/11.3.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.3.1/firebase-messaging-compat.js');

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// firebaseConfig는 클라이언트가 ?config=... 쿼리 파라미터로 등록할 때 전달.
// service worker는 .env에 직접 접근할 수 없으므로 등록 시점에 받아야 한다.
const params = new URLSearchParams(self.location.search);
const firebaseConfig = {
  apiKey: params.get('apiKey') ?? '',
  authDomain: params.get('authDomain') ?? '',
  projectId: params.get('projectId') ?? '',
  storageBucket: params.get('storageBucket') ?? '',
  messagingSenderId: params.get('messagingSenderId') ?? '',
  appId: params.get('appId') ?? '',
};

if (firebaseConfig.apiKey) {
  firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    const title = payload.notification?.title ?? 'UANDI 가계부';
    const body = payload.notification?.body ?? '';
    const click_action = payload.data?.click_action ?? '/cashbook/history/monthly';

    self.registration.showNotification(title, {
      body,
      data: { click_action },
    });
  });
}

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.click_action ?? '/cashbook/history/monthly';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if (client.url.includes(url) && 'focus' in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});
