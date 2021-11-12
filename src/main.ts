import * as core from "@actions/core";
import { Utils } from "./utils";

async function main() {
  try {
    core.startGroup("JFrog Build");
    Utils.setCliEnv();
    await Utils.run();
  } catch (error) {
    core.setFailed(new Error("JFrog CLI exited with exit code " + error));
  } finally {
    core.endGroup();
  }
}

main();
