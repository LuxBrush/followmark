import { buildElement } from "./build.js";
import { FollowMarkState } from "./common.js";
import { MakeMark } from "./marks.js";

async function Main() {
  const state = await FollowMarkState.create();
  state.checkVersion();

  const mainButton = buildElement("button", { textContent: "Make FollowMark" }, "stage");
  mainButton.onclick = async () => {
    await MakeMark(state);
    window.close();
  };
}
Main();
