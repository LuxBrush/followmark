import { FollowMarkState } from "./common.js";

const stateAwait = FollowMarkState.create();

chrome.tabs.onUpdated.addListener(async (_, changeInfo, tab) => {
  const state = await stateAwait;
  if (changeInfo.status === "complete") {
    if (!tab.url) return;

    const mark = state.getMark(tab.url);
    if (mark) {
      await chrome.bookmarks.update(mark.bookmarkID, { url: tab.url, title: tab.title });
      await state.updateMarks({ [mark.hostname]: { progress: tab.url, title: tab.title } });
    }
  }
});

chrome.tabs.onActivated.addListener(async (activateTab) => {
  const state = await stateAwait;
  const tab = await chrome.tabs.get(activateTab.tabId);
  if (!tab.url) return;

  const mark = state.getMark(tab.url);
  if (mark) {
    await chrome.action.setIcon({ path: mark.favIconUrl || { "120": "icons/active.png" } });
  } else {
    await chrome.action.setIcon({ path: { "120": "icons/inactive.png" } });
  }
});
