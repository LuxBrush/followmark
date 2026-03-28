import { buildElement } from "./build.js";
import { MakeMark, checkVersion, getStorage, writeStorage } from "./common.js";

async function Main() {
  const mainButton = buildElement("button", { textContent: "Make FollowMark" }, "stage");

  mainButton.onclick = async () => {
    const followMarksTest = await getStorage("followMarks");
    if (!followMarksTest) {
      await MakeMark();
    }
  };

  await checkVersion();
}
Main();
