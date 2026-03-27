import { buildElement } from "./build.js";
import { Get } from "./check.js";
import { FollowMarkState, MakeMark, compareVersions, getStorage, writeStorage } from "./common.js";

async function Main() {
  const mainButton = buildElement("button", { textContent: "Make FollowMark" }, "stage");

  const followMarkVersionTest = await getStorage("followMarkVersion");
  const currentVersion = chrome.runtime.getManifest().version as string;
  if (!followMarkVersionTest) {
    FollowMarkState.version = currentVersion;
    await writeStorage({ followMarkVersion: FollowMarkState.version });
  }
  const versionElement = Get.elementByID("version");
  const storedVersion = followMarkVersionTest;

  let newVersion = false;
  if (storedVersion) {
    FollowMarkState.version = storedVersion;
    newVersion = compareVersions(currentVersion, storedVersion);
  }

  if (storedVersion && newVersion) {
    FollowMarkState.version = currentVersion;
    await writeStorage({ followMarkVersion: FollowMarkState.version });

    const updateMessage = Get.elementByID("update-message");
    updateMessage.textContent = "Add-on has been updated!";
    versionElement.parentNode?.insertBefore(updateMessage, versionElement.nextSibling);
  }

  versionElement.textContent = `Version: ${FollowMarkState.version}`;

  mainButton.onclick = async () => {
    const followMarksTest = await getStorage("followMarks");
    if (!followMarksTest) {
      await MakeMark();
    }
  };
}
Main();
