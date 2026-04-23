import { Check, Get } from "./check.js";

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

  async setMarks(followMarks: FollowMarks) {
    this.followMarkStorage.followMarks = { ...this.followMarkStorage.followMarks, ...followMarks };
    await writeStorage(this.followMarkStorage);
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
      } else {
        notifyMessage("FollowMark Update Error", `Attempted to update non-existent mark for ${hostname}`);
      }
    }

    this.followMarkStorage.followMarks = current;
    await writeStorage(this.followMarkStorage);
  }

  checkMarkItems(hostname: string, url: string) {
    const mark = this.getMarks()[hostname];
    if (!mark) return false;

    const items = mark.items;
    if (Check.isEmpty.object(items)) return false;

    for (const item of Object.values(items)) {
      if (item.urlString === url) return true;
    }

    return false;
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
  if (href.includes("webtoons")) {
    const webtoonsMatches = href.match(/webtoons\.com\/.*?\/(?:.*?\/(.*?)\/|.*?\/(.*?)$)/);
    if (webtoonsMatches) {
      return sanitizeKey(webtoonsMatches[1]);
    }
  }
  const matches = href.match(/\.com\/([^/]+)/);
  if (matches) {
    return sanitizeKey(matches[1]);
  }
  return defaultKey;
}

function sanitizeKey(text: string) {
  return text
    .replace(/[^a-zA-Z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase();
}
