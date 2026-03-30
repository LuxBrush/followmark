import { getStorage, writeStorage } from "./common.js";

export async function MakeMark() {
  const [foundTab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const { url, title, favIconUrl } = await getInfoFromTab(foundTab);
  const { hostname, pathname } = url;
  const followMarks = (await getStorage("followMarks")) || {};

  followMarks[hostname] = {
    hostname,
    progress: pathname,
    title,
    favIconUrl,
  };

  await writeStorage({ followMarks });
}

/**
 * Extracts URL, title and favicon from a Chrome tab
 * @param tab - Chrome tab object to extract info from
 * @returns Object with url, title and favIconUrl (empty strings if unavailable)
 */
async function getInfoFromTab(tab: chrome.tabs.Tab) {
  let stringUrl = tab.url;
  if (!stringUrl) stringUrl = "";
  const url = new URL(stringUrl);
  let title = tab.title;
  if (!title) title = "";
  let favIconUrl = tab.favIconUrl;
  if (!favIconUrl) favIconUrl = "";
  if (favIconUrl.startsWith("data:")) {
    const tabId = tab.id;
    if (!tabId) {
      favIconUrl = "";
      return { url, title, favIconUrl };
    }
    // If favIconUrl is a data URL, try to get the favicon from the page's head
    try {
      const results = await chrome.scripting.executeScript({
        target: { tabId },
        func: () => {
          const link = document.querySelector('link[rel*="icon"]') as HTMLAnchorElement | null;
          return link ? link.href : "";
        },
      });

      if (results && results[0]?.result) {
        favIconUrl = results[0].result as string;
      }
    } catch (error) {
      console.error("Failed to fetch favicon:", error);
    }
  }

  return { url, title, favIconUrl };
}
