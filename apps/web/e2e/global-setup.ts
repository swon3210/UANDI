// E2E 테스트 실행 전 Firebase Emulator 실행 여부 확인
export default async function globalSetup() {
  const endpoints = [
    { name: 'Firebase Auth Emulator', url: 'http://localhost:9099' },
    { name: 'Firebase Firestore Emulator', url: 'http://localhost:8080' },
  ];

  for (const { name, url } of endpoints) {
    try {
      await fetch(url);
    } catch {
      throw new Error(
        `\n\n❌ ${name}(${url})에 연결할 수 없습니다.\n` +
          `   먼저 에뮬레이터를 실행해 주세요:\n\n` +
          `   pnpm emulators\n`
      );
    }
  }
}
