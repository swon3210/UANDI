export async function applyPageOpacityToActiveTab(opacity: number): Promise<void> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (v: number) => {
        document.documentElement.style.setProperty('opacity', String(v), 'important');
      },
      args: [opacity],
    });
  } catch {
    // chrome:// 등 주입 불가 페이지는 무시
  }
}
