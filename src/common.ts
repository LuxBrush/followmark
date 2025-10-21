export async function MakeMark() {
  chrome.tabs.query({ active: true, currentWindow: true }, async (foundTabs) => {
    const foundTab = foundTabs[0];
    const { url, title, favIconUrl } = await getInfoFromTab(foundTab);
    const id = generateUniqueId();
    await writeStorage({
      followMarks: {
        [url]: {
          id,
          favIconUrl,
        },
      },
    });
  });
}

export async function writeStorage(items: { followMarks: FollowMarks }): Promise<void>;
export async function writeStorage(items: { followMarkVersion: FollowMarkVersion }): Promise<void>;
export async function writeStorage(items: {
  followMarks: FollowMarks;
  followMarkVersion: FollowMarkVersion;
}): Promise<void>;
export async function writeStorage(items: {
  followMarks?: FollowMarks;
  followMarkVersion?: FollowMarkVersion;
}): Promise<void> {
  console.log(items);
  await chrome.storage.local.set(items);
}

export async function getStorage(key: "followMarks"): Promise<FollowMarks | undefined>;
export async function getStorage(key: "followMarkVersion"): Promise<FollowMarkVersion | undefined>;
export async function getStorage(
  key: "followMarks" | "followMarkVersion",
): Promise<FollowMarks | FollowMarkVersion | undefined> {
  const retrieved = await chrome.storage.local.get(key);
  console.log(retrieved[key]);
  return retrieved[key];
}

/**
 * Generates a unique identifier by combining timestamp and random number
 * @returns {string} A unique identifier in base36 format
 */
export function generateUniqueId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

/**
 * Extracts URL, title and favicon from a Chrome tab
 * @param tab - Chrome tab object to extract info from
 * @returns Object with url, title and favIconUrl (empty strings if unavailable)
 */
async function getInfoFromTab(tab: chrome.tabs.Tab) {
  let url = tab.url;
  if (!url) url = "";
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
