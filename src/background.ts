import { FollowMarkState, getStorage, writeStorage } from "./common.js";

const state = await FollowMarkState.create();

chrome.tabs.onUpdated.addListener(async (_, changeInfo, tab) => {
  if (changeInfo.status === "complete") {
    if (!tab.url) return;

    const mark = state.getMark(tab.url);
    if (mark) {
      await chrome.bookmarks.update(mark.bookmarkID, { url: tab.url, title: tab.title });

      // const followMarks = {mark.hostname: {
      //   bookmarkID: mark.bookmarkID,
      //   hostname: mark.hostname,
      //   progress: tab.url,
      //   title: tab.title ?? "",
      //   favIconUrl: mark.favIconUrl,
      // };

      await state.updateMarks({ [mark.hostname]: { progress: tab.url, title: tab.title } });
    }
  }
});

chrome.tabs.onActivated.addListener(async (activateTab) => {
  const tab = await chrome.tabs.get(activateTab.tabId);
  if (!tab.url) return;

  const mark = state.getMark(tab.url);
  if (mark) {
    await chrome.action.setIcon({ path: { "120": "icons/active.png" } });
  } else {
    await chrome.action.setIcon({ path: { "120": "icons/inactive.png" } });
  }
});
