import { buildBookmarkList, findBookmark, findBookmarks } from "./bookmarks.js";
import { extractPageKey, FollowMarkState, notifyMessage } from "./common.js";

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
  const pageKey = extractPageKey(hostname, title, href);

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
    const bookmarkKey = extractPageKey(bookmarkUrl.hostname, bookmark.title, bookmarkUrl.href);

    await state.setMark(bookmarkUrl.hostname, {
      hostname: bookmarkUrl.hostname,
      pages: {
        [bookmarkKey]: {
          bookmarkID,
          title: bookmark.title,
          urlString: bookmarkUrl.href,
          favIconUrl,
        },
      },
    });
    notifyMessage("FollowMark Added", `Mark added for bookmark: ${bookmark.title}`, favIconUrl);
    return;
  }

  const foundBookmark = await findBookmark(href);
  if (foundBookmark.length > 0) {
    if (foundBookmark.length > 1) {
      buildBookmarkList(state, foundBookmark);
      return;
    }
    const [bookmark] = foundBookmark;
    const foundBookmarkID = bookmark.id;

    if (state.getMarkPage(href)) {
      await state.updateMark(hostname, {
        hostname,
        pages: {
          [pageKey]: {
            bookmarkID: foundBookmarkID,
            title,
            urlString: href,
            favIconUrl,
          },
        },
      });

      notifyMessage("FollowMark Updated", `Mark updated for bookmark: ${title}`, favIconUrl);
      return;
    }

    await state.setMark(hostname, {
      hostname,
      pages: {
        [pageKey]: {
          bookmarkID: foundBookmarkID,
          title,
          urlString: href,
          favIconUrl,
        },
      },
    });
    notifyMessage("FollowMark Added", `Mark added for bookmark: ${title}`, favIconUrl);
    return;
  }

  const bookmarks = await findBookmarks(hostname);
  if (bookmarks.length > 0) {
    const foundPage = state.getMarkPage(href);
    if (!foundPage) {
      await state.updateMark(hostname, {
        hostname,
        pages: {
          [pageKey]: {
            bookmarkID: "",
            title,
            urlString: href,
            favIconUrl,
          },
        },
      });
      notifyMessage("FollowMark Page Added", `Mark page added for: ${hostname} Page: ${title}`, favIconUrl);
      return;
    }
    buildBookmarkList(state, bookmarks);
    return;
  }

  await state.setMark(hostname, {
    hostname,
    pages: {
      [pageKey]: {
        bookmarkID: "",
        title,
        urlString: href,
        favIconUrl,
      },
    },
  });
  notifyMessage("FollowMark Added", `New mark added for: ${title}`, favIconUrl);
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

function getOgImage() {
  const ogImage = document.querySelector('meta[property="og:image"]');
  return ogImage ? ogImage.getAttribute("content") || "" : "";
}

function getIcon() {
  const link = document.querySelector('link[rel*="icon"]') as HTMLLinkElement | null;
  return link ? link.href : "";
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

    let func = getIcon;
    if (url.hostname.includes("tapas") || url.hostname.includes("webtoons")) {
      func = getOgImage;
    }

    try {
      const results = await chrome.scripting.executeScript({
        target: { tabId },
        func,
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
