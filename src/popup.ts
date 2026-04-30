import { buildElement } from "./build.js";
import { Get } from "./check.js";
import { FollowMarkState } from "./common.js";
import { MakeMark } from "./marks.js";

async function Main() {
  const state = await FollowMarkState.create();
  const currentVersion = await state.checkVersion();

  const mainButton = buildElement("button", { textContent: "Make FollowMark" }, "stage");
  mainButton.onclick = async () => {
    await MakeMark(state);
    window.close();
  };

  const version = Get.elementByID("version");
  version.textContent = `Version: ${currentVersion}`;
}
Main();
