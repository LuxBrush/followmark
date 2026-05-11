import { Check } from "./check.js";

export const Icons = {
  active: { "120": "icons/active.png" },
  inactive: { "120": "icons/inactive.png" },
};

export function notifyMessage(title: string, message: string, iconUrl: string = "icons/active.png") {
  chrome.notifications.create({
    type: "basic",
    iconUrl,
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

  getMarkPage(
    href: string,
    title?: string,
    pageKey?: string,
  ): { hostname: string; pageKey: string; page: Page } | null {
    try {
      const url = new URL(href);
      const mark = this.getMarks()[url.hostname];

      if (!mark || !mark.pages) return null;

      if (pageKey && mark.pages[pageKey]) return { hostname: mark.hostname, pageKey, page: mark.pages[pageKey] };

      if (title) {
        const extractedPageKey = extractPageKey(mark.hostname, title, href);

        if (mark.pages[extractedPageKey]) {
          return { hostname: mark.hostname, pageKey: extractedPageKey, page: mark.pages[extractedPageKey] };
        }
      }

      const foundPage = Object.entries(mark.pages).find(([_, page]) => page.urlString === href);
      if (foundPage) {
        return { hostname: mark.hostname, pageKey: foundPage[0], page: foundPage[1] };
      }
      return null;
    } catch (error) {
      console.error(`Error in getting page from href:${href}`, error);
      return null;
    }
  }

  async setMarks(followMarks: FollowMarks) {
    const bookmarkActions: Promise<void>[] = [];
    let folderID: string | null = null;

    for (const mark of Object.values(followMarks)) {
      for (const [key, page] of Object.entries(mark.pages)) {
        if (!page.bookmarkID) {
          if (!folderID) {
            folderID = await this.getFollowMarkFolderID();
          }
          bookmarkActions.push(
            (async () => {
              const newBookmark = await chrome.bookmarks.create({
                parentId: folderID,
                title: page.title,
                url: page.urlString,
              });
              mark.pages[key].bookmarkID = newBookmark.id;
            })(),
          );
        }
      }
    }

    const results = await Promise.allSettled(bookmarkActions);
    results.forEach((result, i) => {
      if (result.status === "rejected") {
        console.error(`Failed to create bookmark ${i}:`, result.reason);
      }
    });

    this.followMarkStorage.followMarks = { ...this.followMarkStorage.followMarks, ...followMarks };
    await writeStorage(this.followMarkStorage);
  }

  async setMark(hostname: string, mark: Mark) {
    await this.setMarks({ [hostname]: mark });
  }

  async updateMarks(marks: Record<string, Partial<Mark>>) {
    const current = this.getMarks();
    const bookmarkActions: Promise<any>[] = [];
    const validEntries = Object.entries(marks).filter(([hostname]) => {
      if (!current[hostname]) {
        notifyMessage("FollowMark Update Error", `Attempted to update non-existent mark for ${hostname}`);
        return false;
      }
      return true;
    });

    if (validEntries.length === 0) return;

    const bookmarkIdCheck = validEntries.some(([_, m]) => {
      m.pages && Object.values(m.pages).some((p) => !p.bookmarkID);
    });

    let folderID = bookmarkIdCheck ? await this.getFollowMarkFolderID() : null;

    for (const [hostname, partialMark] of validEntries) {
      current[hostname] = {
        ...current[hostname],
        ...partialMark,
        pages: { ...current[hostname].pages, ...partialMark.pages },
      };

      if (partialMark.pages) {
        for (const key in partialMark.pages) {
          const page = current[hostname].pages[key];
          if (page.bookmarkID) {
            bookmarkActions.push(
              chrome.bookmarks.update(page.bookmarkID, {
                title: page.title,
                url: page.urlString,
              }),
            );
          } else {
            if (!folderID) {
              folderID = await this.getFollowMarkFolderID();
            }
            bookmarkActions.push(
              (async () => {
                const newBookmark = await chrome.bookmarks.create({
                  parentId: folderID,
                  title: page.title,
                  url: page.urlString,
                });
                page.bookmarkID = newBookmark.id;
              })(),
            );
          }
        }
      }
    }

    const results = await Promise.allSettled(bookmarkActions);
    results.forEach((result, i) => {
      if (result.status === "rejected") {
        console.error(`Failed to update or create bookmark ${i}:`, result.reason);
      }
    });

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

    if (storedVersion === "0.0.0" || compareVersions(currentVersion, storedVersion)) {
      await this.setVersion(currentVersion);

      if (storedVersion !== "0.0.0") {
        notifyMessage("FollowMark Updated", `Add-on has been updated to ${this.getVersion()}`);
        return currentVersion;
      }
      return currentVersion;
    }
    return currentVersion;
  }
}

export async function writeStorage(data: FollowMarkStorage): Promise<void> {
  // await chrome.storage.sync.set(items);
  await chrome.storage.local.set(data);
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

const TAPAS_MATCH = /Read\s+(.*?)(?:\s*(?:::{1,2}|\|))/;
const WEBTOONS_MATCH = /\/[^/]+\/[^/]+\/([^/]+)\//;
const LIST_MATCH = /[?&]list=([^?&]+)/;
const VIDEO_MATCH = /[?&]v=([^?&]+)/;

const extractors: PageKeyExtractor[] = [
  (_hostname, title) => {
    if (!title.includes("Tapas")) return null;
    const matches = title.match(TAPAS_MATCH);
    return matches ? generateHash(matches[1]) : null;
  },
  (_hostname, _title, href) => {
    if (!href.includes("webtoons.com")) return null;
    const matches = href.match(WEBTOONS_MATCH);
    return matches ? generateHash(matches[1]) : null;
  },
  (_hostname, _title, href) => {
    if (!href.includes("youtube.com")) return null;
    const listMatches = href.match(LIST_MATCH);
    if (listMatches) return listMatches[1];

    const videoMatches = href.match(VIDEO_MATCH);
    return videoMatches ? videoMatches[1] : null;
  },
];

export function extractPageKey(hostname: string, title: string, href: string) {
  for (const extractor of extractors) {
    const key = extractor(hostname, title, href);
    if (key !== null) return key;
  }
  return generateHash(hostname);
}

function generateHash(input: string) {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const code = input.charCodeAt(i);
    hash = (hash << 5) - hash + code;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}
