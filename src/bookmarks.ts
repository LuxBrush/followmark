import { Get } from "./check.js";
import { buildElement } from "./build.js";
import { MakeMark } from "./marks.js";

export async function findBookmark(url: string) {
  return await chrome.bookmarks.search({ url });
}

export async function findBookmarks(hostname: string) {
  return await chrome.bookmarks.search(hostname);
}

export async function findFolders(folderName: string) {
  const results = await chrome.bookmarks.search({ title: folderName });
  return results.filter((item) => !item.url);
}

export function buildBookmarkList(bookmarks: chrome.bookmarks.BookmarkTreeNode[]) {
  const stage = Get.elementByID("stage");

  for (const bookmark of bookmarks) {
    const ul = buildElement("ul", { classList: ["bookmark-list"] }, stage);
    const li = buildElement("li", { classList: ["bookmark-item"] }, ul);
    buildElement(
      "button",
      {
        textContent: bookmark.url,
        classList: ["bookmark-button"],
        onclick: () => {
          MakeMark(bookmark.id);
        },
      },
      li,
    );
  }
}
