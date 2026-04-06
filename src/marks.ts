import { buildBookmarkList, findBookmark, findBookmarks, findFolders } from "./bookmarks.js";
import { Get } from "./check.js";
import { getStorage, writeStorage } from "./common.js";

/**
 * Creates or updates a follow mark for the currently active tab.
 * Extracts tab information and saves it to local storage.
 * @returns Promise void
 */
export async function MakeMark(bookmarkID?: string) {
  const [foundTab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const followMarks = (await getStorage("followMarks")) || {};
  const info = await getInfoFromTab(foundTab);

  if (info.url.protocol === "about:") {
    Get.elementByID("update-message").textContent = "Cannot create a mark for this tab.";
    return;
  }

  const { url, title, favIconUrl } = info;
  const { hostname, href } = url;

  if (bookmarkID) {
    const [bookmark] = await chrome.bookmarks.get(bookmarkID);
    const bookmarkUrl = new URL(bookmark.url ? bookmark.url : "");
    followMarks[bookmarkUrl.hostname] = {
      bookmarkID: bookmark.id,
      hostname: bookmarkUrl.hostname,
      progress: bookmark.url ? bookmark.url : "",
      title: bookmark.title,
      favIconUrl,
    };

    await writeStorage({ followMarks });
    return;
  }

  const bookmark = await findBookmark(href);
  if (bookmark.length > 0) {
    if (bookmark.length > 1) {
      buildBookmarkList(bookmark);
      return;
    }
    followMarks[hostname] = {
      bookmarkID: bookmark[0].id,
      hostname,
      progress: href,
      title,
      favIconUrl,
    };

    await writeStorage({ followMarks });
    return;
  }

  const bookmarks = await findBookmarks(hostname);
  if (bookmarks.length > 0) {
    buildBookmarkList(bookmarks);
    return;
  }

  let folderID = "";
  const folders = await findFolders("followMarks");
  if (folders.length === 0) {
    const folder = await chrome.bookmarks.create({ title: "followMarks" });
    folderID = folder.id;
  } else {
    folderID = folders[0].id;
  }
  const newBookmark = await chrome.bookmarks.create({ parentId: folderID, url: href });

  followMarks[hostname] = {
    bookmarkID: newBookmark.id,
    hostname,
    progress: href,
    title,
    favIconUrl,
  };

  await writeStorage({ followMarks });
}

/**
 * Retrieves a follow mark for a given URL's hostname.
 * @param url - The URL to check for a follow mark.
 * @returns The mark object or null if not found.
 */
export async function getMark(url: string) {
  const hostname = new URL(url).hostname;
  const followMarks = await getStorage("followMarks");
  return followMarks?.[hostname] ?? null;
}

/**
 * Extracts URL, title and favicon from a Chrome tab
 * @param tab - Chrome tab object to extract info from
 * @returns Object with url, title and favIconUrl
 */
async function getInfoFromTab(tab: chrome.tabs.Tab) {
  const url = getURL(tab);

  const title = tab.title ?? "";

  const favIconUrl = await getFavIcon(tab);

  return { url, title, favIconUrl };
}

/**
 * Extracts the URL from a Chrome tab.
 * @param tab - The Chrome tab object.
 * @returns The parsed URL object or about:blank if invalid.
 */
function getURL(tab: chrome.tabs.Tab) {
  let stringURL = tab.url ?? "";

  try {
    const url = new URL(stringURL);

    return url;
  } catch (error) {
    console.error("Url is malformed or an empty string:", stringURL);
    return new URL("about:blank");
  }
}

/**
 * Retrieves the favicon URL for a tab, attempting to find the icon from the page content if necessary.
 * @param tab - The Chrome tab object.
 * @returns The favicon URL or a default icon path.
 */
async function getFavIcon(tab: chrome.tabs.Tab) {
  const defaultIcon = "/icons/inactive.png";
  const favIconUrl = tab.favIconUrl ?? defaultIcon;
  // If favIconUrl is a data URL, try to get the favicon from the page's head
  if (favIconUrl.startsWith("data:")) {
    const tabId = tab.id;
    if (!tabId) return defaultIcon;

    try {
      const results = await chrome.scripting.executeScript({
        target: { tabId },
        func: () => {
          const link = document.querySelector('link[rel*="icon"]') as HTMLLinkElement | null;
          return link ? link.href : "";
        },
      });

      if (results && results[0]?.result) {
        return results[0].result as string;
      }
    } catch (error) {
      console.error("Failed to fetch favicon:", error);
      return defaultIcon;
    }
  }

  return favIconUrl;
}
