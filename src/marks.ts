import { buildBookmarkList, findBookmark, findBookmarks } from "./bookmarks.js";
import { extractPageKey, FollowMarkState, notifyMessage } from "./common.js";

/**
 * Creates or updates a follow mark for the currently active tab.
 * Extracts tab information and saves it to local storage.
 * @returns Promise resolving to true if mark was created/updated, false otherwise
 */
export async function MakeMark(state: FollowMarkState, bookmarkID?: string) {
  const { url, title, favIconUrl } = await getInfoFromActiveTab();
  const { hostname, href } = url;
  const pageKey = extractPageKey(hostname, title, href);

  if (bookmarkID) {
    await markFromBookmark(state, bookmarkID, favIconUrl);
    return true;
  }

  const foundBookmark = await findBookmark(href);
  if (foundBookmark.length > 0) {
    if (foundBookmark.length > 1) {
      buildBookmarkList(state, foundBookmark);
      return false;
    }

    const bookmarkMark: Mark = {
      hostname,
      pages: {
        [pageKey]: {
          bookmarkID: foundBookmark[0].id,
          title,
          urlString: href,
          favIconUrl,
        },
      },
    };

    const mark = state.getMark(href);
    if (mark) {
      if (!state.getMarkPage(href)) {
        await state.updateMark(hostname, bookmarkMark);
        notifyMessage("FollowMark Updated", `Mark updated for bookmark: ${title}`, favIconUrl);
        return true;
      }
      notifyMessage("Already Followed", `This page is already being followed: ${title}`, favIconUrl);
      return true;
    }

    await state.setMark(hostname, bookmarkMark);
    notifyMessage("FollowMark Added", `Mark added for bookmark: ${title}`, favIconUrl);
    return true;
  }

  const bookmarks = await findBookmarks(hostname);
  if (bookmarks.length > 0) {
    const mark = state.getMark(href);
    if (mark) {
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
        return true;
      }
    }
    buildBookmarkList(state, bookmarks);
    return false;
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
  return true;
}

export function getInfoFromBookmark(bookmark: chrome.bookmarks.BookmarkTreeNode) {
  const { url, title } = bookmark;
  if (!url) {
    notifyMessage("No URL in bookmark", "No URL in bookmark, this might be a folder.");
    return null;
  }
  const bookmarkUrl = new URL(url);
  const { hostname, href } = bookmarkUrl;
  const bookmarkKey = extractPageKey(hostname, title, href);
  return { urlString: href, hostname, title, bookmarkKey };
}

/**
 * Extracts URL, title and favicon from a Chrome tab
 * @param tab - Chrome tab object to extract info from
 * @returns Object with url, title and favIconUrl
 */
async function getInfoFromActiveTab() {
  const tab = await getActiveTab();
  const url = getURL(tab.url);

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
 * @param urlString - The URL string to parse.
 * @returns The parsed URL object or about:blank if invalid.
 */
function getURL(urlString: string | undefined) {
  if (!urlString) {
    throw new Error("Url string is undefined or null");
  }
  const url = new URL(urlString);

  return url;
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
  const url = getURL(tab.url);
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

export async function markFromBookmark(state: FollowMarkState, bookmarkID: string, favIconUrl: string) {
  const bookmarks = await chrome.bookmarks.get(bookmarkID);
  if (bookmarks.length === 0) {
    notifyMessage("Bookmark not found", `Bookmark for ID: ${bookmarkID} was not found`);
    return;
  }

  const [bookmark] = bookmarks;
  const bookmarkInfo = getInfoFromBookmark(bookmark);
  if (bookmarkInfo) {
    const { urlString, hostname, title, bookmarkKey } = bookmarkInfo;
    const bookmarkMark: Mark = {
      hostname,
      pages: {
        [bookmarkKey]: {
          bookmarkID,
          title,
          urlString,
          favIconUrl,
        },
      },
    };

    const mark = state.getMark(urlString);
    if (mark) {
      const foundPageInfo = state.getMarkPage(urlString, undefined, bookmarkKey);
      if (!foundPageInfo) {
        await state.updateMark(hostname, bookmarkMark);
        notifyMessage("FollowMark Updated", `Mark page added for: ${hostname} Page: ${title}`, favIconUrl);
        return;
      }
      if (foundPageInfo.page.bookmarkID !== bookmarkID) {
        const foundBookmark = await findBookmark(urlString);
        const match = foundBookmark.find((bookmark) => bookmark.id === foundPageInfo.page.bookmarkID);
        if (!match) {
          await state.updateMark(hostname, bookmarkMark);
          notifyMessage("FollowMark Updated", `Mark update for: ${title}`, favIconUrl);
          return;
        }
        return;
      }
      return;
    }

    await state.setMark(hostname, bookmarkMark);
    notifyMessage("FollowMark Added", `New Mark added for: ${title}`, favIconUrl);
  }
}
