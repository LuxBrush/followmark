import { buildElement } from "./build.js";
import { MakeMark, getStorage, writeStorage } from "./common.js";

async function Main() {
  const mainButton = buildElement("button", {}, "stage");
  mainButton.textContent = "Make FallowMark";

  mainButton.onclick = async () => {
    const followMarkVersionTest = await getStorage("followMarkVersion");
    if (!followMarkVersionTest) {
      const version = await chrome.runtime.getManifest().version;
      await writeStorage({ followMarkVersion: version });
    }
    const followMarksTest = await getStorage("followMarks");
    if (!followMarksTest) {
      await MakeMark();
    }
  };
}
Main();
