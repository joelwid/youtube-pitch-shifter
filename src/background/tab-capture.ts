export interface CapturableTab {
  id: number;
  url?: string;
}

export async function getActiveTab(): Promise<CapturableTab | null> {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const [tab] = tabs;

  if (!tab?.id) return null;

  return {
    id: tab.id,
    url: tab.url
  };
}

export function isYouTubeUrl(url?: string): boolean {
  if (!url) return false;

  try {
    const parsed = new URL(url);
    return (
      parsed.hostname === "www.youtube.com" ||
      parsed.hostname === "youtube.com" ||
      parsed.hostname === "music.youtube.com"
    );
  } catch {
    return false;
  }
}

export async function getTabCaptureStreamId(tabId: number): Promise<string> {
  return new Promise((resolve, reject) => {
    chrome.tabCapture.getMediaStreamId({ targetTabId: tabId }, (streamId) => {
      const error = chrome.runtime.lastError;

      if (error) {
        reject(new Error(error.message));
        return;
      }

      if (!streamId) {
        reject(new Error("Chrome did not return a tab capture stream ID."));
        return;
      }

      resolve(streamId);
    });
  });
}
