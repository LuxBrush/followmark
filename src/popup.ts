import { buildElement } from "./build.js";
import { checkVersion } from "./common.js";
import { MakeMark } from "./marks.js";

async function Main() {
  await checkVersion();

  const mainButton = buildElement("button", { textContent: "Make FollowMark" }, "stage");
  mainButton.onclick = async () => {
    await MakeMark();
  };
}
Main();
