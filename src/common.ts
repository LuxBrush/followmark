import { Check, Get } from "./check.js";

export const Icons = {
  active: { "120": "icons/active.png" },
  inactive: { "120": "icons/inactive.png" },
};

export function notifyMessage(title: string, message: string) {
  chrome.notifications.create({
    type: "basic",
    iconUrl: "icons/active.png",
    title,
    message,
    priority: 2,
  });
}

export class FollowMarkState {
  private followMarkStorage: FollowMarkStorage;
  private followMarkFolderID: string | null = null;

  private constructor(storage: FollowMarkStorage) {
    this.followMarkStorage = storage;

    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === "local") {
        for (let [key, { newValue }] of Object.entries(changes)) {
          (this.followMarkStorage as any)[key] = newValue;
        }
      }
    });
  }

  static async create() {
    const storage = await getStorage();
    return new FollowMarkState(storage);
  }

  async getFollowMarkFolderID() {
    if (this.followMarkFolderID) return this.followMarkFolderID;

    const results = await chrome.bookmarks.search({ title: "followMarks" });
    const folder = results.find((item) => !item.url);

    if (folder) {
      this.followMarkFolderID = folder.id;
    } else {
      const newFolder = await chrome.bookmarks.create({ title: "followMarks" });
      this.followMarkFolderID = newFolder.id;
    }

    return this.followMarkFolderID;
  }

  getMarks(): FollowMarks {
    return this.followMarkStorage.followMarks || {};
  }

  getMark(url: string): Mark | null {
    if (!url || url.trim() === "") {
      notifyMessage("Get FollowMark Error", `Cannot get a FollowMark for an empty or null url: ${url}`);
      return null;
    }
    try {
      const hostname = new URL(url).hostname;
      return this.getMarks()[hostname] ?? null;
    } catch (error) {
      notifyMessage("Get FollowMark Error", `Invalid URL provided to getMark: ${url}`);
      return null;
    }
  }

  getMarkItem(href: string, key?: string): [string, Item] | null {
    try {
      const url = new URL(href);
      const mark = this.getMarks()[url.hostname];

      if (!mark || !mark.items) return null;

      if (key && mark.items[key]) return [key, mark.items[key]];

      const foundItem = Object.entries(mark.items).find(([_, item]) => item.urlString === href);
      return foundItem ?? null;
    } catch (error) {
      console.error(`Error in getting item from href:${href}`, error);
      return null;
    }
  }

  async setMarks(followMarks: FollowMarks) {
    const folderID = await this.getFollowMarkFolderID();

    for (const mark of Object.values(followMarks)) {
      for (const [key, item] of Object.entries(mark.items)) {
        if (!item.bookmarkID) {
          const newBookmark = await chrome.bookmarks.create({
            parentId: folderID,
            title: item.title,
            url: item.urlString,
          });
          mark.items[key].bookmarkID = newBookmark.id;
        }
      }
    }
    this.followMarkStorage.followMarks = { ...this.followMarkStorage.followMarks, ...followMarks };
    await writeStorage(this.followMarkStorage);
  }

  async setMark(hostname: string, mark: Mark) {
    await this.setMarks({ [hostname]: mark });
  }

  async updateMarks(marks: Record<string, Partial<Mark>>) {
    const current = this.getMarks();

    for (const [hostname, partialMark] of Object.entries(marks)) {
      if (current[hostname]) {
        current[hostname] = {
          ...current[hostname],
          ...partialMark,
          items: { ...current[hostname].items, ...partialMark.items },
        };

        if (partialMark.items) {
          for (const key in partialMark.items) {
            const item = current[hostname].items[key];
            if (item.bookmarkID) {
              await chrome.bookmarks.update(item.bookmarkID, { title: item.title, url: item.urlString });
            } else {
              const folderID = await this.getFollowMarkFolderID();
              const newBookmark = await chrome.bookmarks.create({
                parentId: folderID,
                title: item.title,
                url: item.urlString,
              });
              current[hostname].items[key].bookmarkID = newBookmark.id;
            }
          }
        }
      } else {
        notifyMessage("FollowMark Update Error", `Attempted to update non-existent mark for ${hostname}`);
      }
    }

    this.followMarkStorage.followMarks = current;
    await writeStorage(this.followMarkStorage);
  }

  async updateMark(hostname: string, mark: Partial<Mark>) {
    await this.updateMarks({ [hostname]: mark });
  }

  getVersion(): FollowMarkVersion {
    return this.followMarkStorage.followMarkVersion || "0.0.0";
  }

  async setVersion(version: string) {
    this.followMarkStorage.followMarkVersion = version;
    await writeStorage(this.followMarkStorage);
  }

  async checkVersion() {
    const currentVersion = chrome.runtime.getManifest().version as string;
    const storedVersion = this.getVersion();
    const versionElement = Get.elementByID("version");

    if (storedVersion === "0.0.0" || compareVersions(currentVersion, storedVersion)) {
      await this.setVersion(currentVersion);

      if (storedVersion !== "0.0.0") {
        const updateMessageElement = Get.elementByID("update-message");
        updateMessageElement.textContent = "Add-on had been updated!";
        versionElement.parentNode?.insertBefore(updateMessageElement, versionElement.nextSibling);
      }
    }

    versionElement.textContent = `Version: ${this.getVersion()}`;
  }
}

export async function writeStorage(items: FollowMarkStorage): Promise<void> {
  // await chrome.storage.sync.set(items);
  await chrome.storage.local.set(items);
}

export async function getStorage(): Promise<FollowMarkStorage> {
  const sync = await chrome.storage.sync.get();
  if (!Check.isEmpty.object(sync)) {
    return sync;
  }
  const local = await chrome.storage.local.get();
  return local;
}

function compareVersions(currentVersion: string, storedVersion: string) {
  return currentVersion.localeCompare(storedVersion, undefined, { numeric: true }) > 0;
}

export function extractKeyID(title?: string, href?: string) {
  const defaultKey = crypto.randomUUID();
  if (title) {
    if (title.includes("Tapas")) {
      const titleKey = extractTitleKey(title, defaultKey);
      return titleKey;
    }
  }
  if (href) {
    const hrefKey = extractHrefKey(href, defaultKey);
    return hrefKey;
  }
  return defaultKey;
}

function extractTitleKey(title: string, defaultKey: string) {
  const matches = title.match(/Read\s+(.*?)(?:\s*(?:::{1,2}|\|))/);
  if (matches) {
    return sanitizeKey(matches[1]);
  }
  return defaultKey;
}

function extractHrefKey(href: string, defaultKey: string) {
  try {
    const url = new URL(href);

    if (href.includes("webtoons")) {
      const webtoonsMatches = href.match(/webtoons\.com\/.*?\/(?:.*?\/(.*?)\/|.*?\/(.*?)$)/);
      if (webtoonsMatches) {
        return sanitizeKey(webtoonsMatches[1]);
      }
    }

    return sanitizeKey(url.hostname);
  } catch (error) {
    return defaultKey;
  }
}

function sanitizeKey(text: string) {
  const sanitized = text
    .replace(/[^a-zA-Z0-9\s_]/g, "_")
    .trim()
    .replace(/\s+/g, "_")
    .toLowerCase();

  if (!sanitized || /^\d/.test(sanitized)) {
    return `_${sanitized || "key"}`;
  }

  return sanitized;
}
