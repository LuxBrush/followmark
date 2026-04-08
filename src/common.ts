import { Check, Get } from "./check.js";

export class FollowMarkState {
  private followMarkStorage: FollowMarkStorage;

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

  private notifyMessage(title: string, message: string) {
    chrome.notifications.create({
      type: "basic",
      iconUrl: "icons/active.png",
      title,
      message,
      priority: 2,
    });
  }

  static async create() {
    const storage = await getStorage();
    return new FollowMarkState(storage);
  }

  getMarks(): FollowMarks {
    return this.followMarkStorage.followMarks || {};
  }

  getMark(url: string): Mark | null {
    if (!url || url.trim() === "") {
      this.notifyMessage("Get FollowMark Error", `Cannot get a FollowMark for an empty or null url: ${url}`);
      return null;
    }
    try {
      const hostname = new URL(url).hostname;
      return this.getMarks()[hostname] ?? null;
    } catch (error) {
      this.notifyMessage("Get FollowMark Error", `Invalid URL provided to getMark: ${url}`);
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
        current[hostname] = { ...current[hostname], ...partialMark };
      } else {
        this.notifyMessage("FollowMark Update Error", `Attempted to update non-existent mark for ${hostname}`);
      }
    }

    this.followMarkStorage.followMarks = current;
    await writeStorage(this.followMarkStorage);
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
