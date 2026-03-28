import { Get } from "./check";
export const FollowMarkState = {
  version: "",
};

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

export async function checkVersion() {
  const followMarkVersionTest = await getStorage("followMarkVersion");
  const currentVersion = chrome.runtime.getManifest().version as string;
  if (!followMarkVersionTest) {
    FollowMarkState.version = currentVersion;
    await writeStorage({ followMarkVersion: FollowMarkState.version });
  }
  const versionElement = Get.elementByID("version");
  const storedVersion = followMarkVersionTest;

  let newVersion = false;
  if (storedVersion) {
    FollowMarkState.version = storedVersion;
    newVersion = compareVersions(currentVersion, storedVersion);
  }

  if (storedVersion && newVersion) {
    FollowMarkState.version = currentVersion;
    await writeStorage({ followMarkVersion: FollowMarkState.version });

    const updateMessage = Get.elementByID("update-message");
    updateMessage.textContent = "Add-on has been updated!";
    versionElement.parentNode?.insertBefore(updateMessage, versionElement.nextSibling);
  }

  versionElement.textContent = `Version: ${FollowMarkState.version}`;
}

function compareVersions(currentVersion: string, storedVersion: string) {
  const cVParts = currentVersion.split(".");
  const sVParts = storedVersion.split(".");
  if (cVParts.length !== 3 || sVParts.length !== 3) {
    console.error("Invalid version format:", { currentVersion, storedVersion });
    return false;
  }
  const [cMaj, cMin, cPat] = convertToVersion(cVParts);
  const [sMaj, sMin, sPat] = convertToVersion(sVParts);

  if (cMaj > sMaj) return true;
  if (cMaj < sMaj) return false;
  if (cMin > sMin) return true;
  if (cMin < sMin) return false;

  return cPat > sPat;
}

function convertToVersion(vParts: string[]): Versions {
  const nVParts: Versions = [0, 0, 0];
  nVParts[0] = Number(vParts[0]);
  nVParts[1] = Number(vParts[1]);
  nVParts[2] = Number(vParts[2]);
  return nVParts;
}
