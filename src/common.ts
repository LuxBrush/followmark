import { Get } from "./check.js";
export const FollowMarkState = {
  version: "",
};

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
  return retrieved[key];
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

export async function checkVersion() {
  const currentVersion = chrome.runtime.getManifest().version as string;
  const storedVersion = await getStorage("followMarkVersion");
  const versionElement = Get.elementByID("version");

  if (!storedVersion || compareVersions(currentVersion, storedVersion)) {
    FollowMarkState.version = currentVersion;
    await writeStorage({ followMarkVersion: currentVersion });

    if (storedVersion) {
      const updateMessage = Get.elementByID("update-message");
      updateMessage.textContent = "Add-on has been updated!";
      versionElement.parentNode?.insertBefore(updateMessage, versionElement.nextSibling);
    }
  } else {
    FollowMarkState.version = storedVersion;
  }

  versionElement.textContent = `Version: ${FollowMarkState.version}`;
}

function compareVersions(currentVersion: string, storedVersion: string) {
  return currentVersion.localeCompare(storedVersion, undefined, { numeric: true }) > 0;
}
