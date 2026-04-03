import { getStorage, writeStorage } from "./common.js";
import { getMark } from "./marks.js";

chrome.tabs.onUpdated.addListener(async (_, changeInfo, tab) => {
  if (changeInfo.status === "complete") {
    if (!tab.url) return;

    const mark = await getMark(tab.url);
    if (mark) {
      await chrome.bookmarks.update(mark.bookmarkID, { url: tab.url, title: tab.title });

      const followMarks = await getStorage("followMarks");
      if (followMarks) {
        followMarks[mark.hostname] = {
          bookmarkID: mark.bookmarkID,
          hostname: mark.hostname,
          progress: tab.url,
          title: tab.title ?? "",
          favIconUrl: mark.favIconUrl,
        };

        await writeStorage({ followMarks });
      }
    }
  }
});

chrome.tabs.onActivated.addListener(async (activateTab) => {
  const tab = await chrome.tabs.get(activateTab.tabId);
  if (!tab.url) return;
  const mark = await getMark(tab.url);
  if (mark) {
    console.log(mark.title);
  }
});
