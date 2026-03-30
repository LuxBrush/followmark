import { buildElement } from "./build.js";
import { MakeMark, checkVersion, getStorage } from "./common.js";

async function Main() {
  await checkVersion();

  const mainButton = buildElement("button", { textContent: "Make FollowMark" }, "stage");
  mainButton.onclick = async () => {
    await MakeMark();
  };
}
Main();
