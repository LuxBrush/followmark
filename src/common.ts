import { Get } from "./check.js";
export const FollowMarkState = {
  version: "",
};

export async function writeStorage(items: { followMarks: FollowMarks }): Promise<void>;
export async function writeStorage(items: { followMarkVersion: FollowMarkVersion }): Promise<void>;
export async function writeStorage(items: {
  followMarks: FollowMarks;
  followMarkVersion: FollowMarkVersion;
}): Promise<void>;
export async function writeStorage(items: {
  followMarks?: FollowMarks;
  followMarkVersion?: FollowMarkVersion;
}): Promise<void> {
  console.log(items);
  await chrome.storage.local.set(items);
}

export async function getStorage(key: "followMarks"): Promise<FollowMarks | undefined>;
export async function getStorage(key: "followMarkVersion"): Promise<FollowMarkVersion | undefined>;
export async function getStorage(
  key: "followMarks" | "followMarkVersion",
): Promise<FollowMarks | FollowMarkVersion | undefined> {
  const retrieved = await chrome.storage.local.get(key);
  return retrieved[key];
}

export async function checkVersion() {
  const currentVersion = chrome.runtime.getManifest().version as string;
  const storedVersion = await getStorage("followMarkVersion");
  const versionElement = Get.elementByID("version");

  if (!storedVersion || compareVersions(currentVersion, storedVersion)) {
    FollowMarkState.version = currentVersion;
    await writeStorage({ followMarkVersion: currentVersion });

    if (storedVersion) {
      const updateMessage = Get.elementByID("update-message");
      updateMessage.textContent = "Add-on has been updated!";
      versionElement.parentNode?.insertBefore(updateMessage, versionElement.nextSibling);
    }
  } else {
    FollowMarkState.version = storedVersion;
  }

  versionElement.textContent = `Version: ${FollowMarkState.version}`;
}

function compareVersions(currentVersion: string, storedVersion: string) {
  return currentVersion.localeCompare(storedVersion, undefined, { numeric: true }) > 0;
}
