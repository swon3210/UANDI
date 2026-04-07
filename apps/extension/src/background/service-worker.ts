// Chrome Extension Background Service Worker
// 팝업에서 인증을 처리하므로 서비스 워커는 최소 기능만 유지

chrome.runtime.onInstalled.addListener(() => {
  console.log('UANDI 가계부 확장 프로그램이 설치되었습니다.');
});
