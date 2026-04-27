import { buildBookmarkList, findBookmark, findBookmarks } from "./bookmarks.js";
import { extractKeyID, FollowMarkState, notifyMessage } from "./common.js";

/**
 * Creates or updates a follow mark for the currently active tab.
 * Extracts tab information and saves it to local storage.
 * @returns Promise void
 */
export async function MakeMark(state: FollowMarkState, bookmarkID?: string) {
  const info = await getInfoFromActiveTab();

  if (info.url.protocol === "about:") {
    notifyMessage("Cannot create Mark", "Cannot create a mark for this tab.");
    return;
  }

  const { url, title, favIconUrl } = info;
  const { hostname, href } = url;
  const itemID = extractKeyID(title, href);

  if (bookmarkID) {
    const bookmarks = await chrome.bookmarks.get(bookmarkID);
    if (bookmarks.length === 0) {
      notifyMessage("Bookmark not found", `Bookmark for ID: ${bookmarkID} was not found.`);
      return;
    }
    const [bookmark] = bookmarks;
    if (!bookmark.url) {
      notifyMessage("Cannot create Mark", "Cannot create a mark for this bookmark.");
      return;
    }
    const bookmarkUrl = new URL(bookmark.url);
    const bookmarkKey = extractKeyID(bookmark.title, bookmarkUrl.href);

    await state.setMark(bookmarkUrl.hostname, {
      hostname: bookmarkUrl.hostname,
      favIconUrl: favIconUrl,
      items: { [bookmarkKey]: { bookmarkID, title: bookmark.title, urlString: bookmarkUrl.href } },
    });
    notifyMessage("FollowMark Added", `Mark added for bookmark: ${bookmark.title}`);
    return;
  }

  const bookmark = await findBookmark(href);
  if (bookmark.length > 0) {
    if (bookmark.length > 1) {
      buildBookmarkList(state, bookmark);
      return;
    }

    await state.setMark(hostname, {
      hostname,
      favIconUrl,
      items: {
        [itemID]: {
          bookmarkID: bookmark[0].id,
          title,
          urlString: href,
        },
      },
    });
    notifyMessage("FollowMark Added", `Mark added for bookmark: ${title}`);
    return;
  }

  const bookmarks = await findBookmarks(hostname);
  if (bookmarks.length > 0) {
    if (!state.checkMarkItems(hostname, href)) {
      await state.updateMark(hostname, {
        hostname,
        favIconUrl,
        items: { [itemID]: { bookmarkID: "", title, urlString: href } },
      });
      notifyMessage("FollowMark Item Added", `Mark item added for: ${hostname} - ${title}`);
      return;
    }
    buildBookmarkList(state, bookmarks);
    return;
  }

  await state.setMark(hostname, {
    hostname,
    favIconUrl,
    items: { [itemID]: { bookmarkID: "", title, urlString: href } },
  });
  notifyMessage("FollowMark Added", `New mark added for: ${title}`);
}

/**
 * Extracts URL, title and favicon from a Chrome tab
 * @param tab - Chrome tab object to extract info from
 * @returns Object with url, title and favIconUrl
 */
async function getInfoFromActiveTab() {
  const tab = await getActiveTab();
  const url = getURL(tab);

  const title = tab.title ?? "";

  const favIconUrl = await getFavIcon(tab);

  return { url, title, favIconUrl };
}

async function getActiveTab() {
  const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return activeTab;
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
  const url = getURL(tab);
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
      } else {
        return `${url.protocol}//${url.hostname}/favicon.ico`;
      }
    } catch (error) {
      console.error("Failed to fetch favicon:", error);
      return defaultIcon;
    }
  }

  return favIconUrl;
}
