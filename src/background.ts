import { extractKeyID, FollowMarkState, Icons } from "./common.js";

const stateAwait = FollowMarkState.create();
const { active, inactive } = Icons;

chrome.tabs.onUpdated.addListener(async (_, changeInfo, tab) => {
  const state = await stateAwait;
  if (changeInfo.status === "complete" && tab.url) {
    const mark = state.getMark(tab.url);
    const foundItem = state.getMarkItem(tab.url, tab.title);

    if (mark && foundItem) {
      const [key, item] = foundItem;
      await state.updateMark(mark.hostname, {
        items: {
          [key]: {
            ...item,
            title: tab.title ?? "untitled",
            urlString: tab.url,
          },
        },
      });

      await chrome.action.setIcon({ path: mark.favIconUrl || active });
    } else {
      await chrome.action.setIcon({ path: inactive });
    }
  }
});

chrome.tabs.onActivated.addListener(async (activateTab) => {
  const state = await stateAwait;
  try {
    const tab = await chrome.tabs.get(activateTab.tabId);
    if (!tab.url) return;

    const mark = state.getMark(tab.url);
    if (mark) {
      await chrome.action.setIcon({ path: mark.favIconUrl || active });
    } else {
      await chrome.action.setIcon({ path: inactive });
    }
  } catch (error) {
    console.error("Error updating icon on tab activation", error);
  }
});
