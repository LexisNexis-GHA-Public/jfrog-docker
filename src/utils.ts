import * as core from "@actions/core";
import { exec } from "@actions/exec";

export class Utils {
  public static readonly USER_AGENT: string =
    "setup-jfrog-cli-github-action/" + require("../package.json").version;
  public static readonly BUILD_NAME: string = "build-name";
  public static readonly BUILD_NUMBER: string = "build-number";
  public static readonly BUILD_TYPE: string = "build-type";
  public static readonly JFROG_PROJECT: string = "jfrog-project";
  public static readonly DOCKER_IMAGE: string = "docker-image";
  public static readonly DOCKER_IMAGE_TAG: string = "docker-image-tag";
  public static readonly DOCKER_REPO: string = "docker-repo";
  public static readonly BUILD_FAIL_ONSCAN: string = "build-fail-onscan";
  public static readonly PROMOTE_TO_REPO: string = "promote-to-repo";
  public static readonly PROMOTE_SOURCE_REPO: string = "promote-source-repo";

  public static setCliEnv() {
    core.exportVariable(
      "JFROG_CLI_ENV_EXCLUDE",
      "*password*;*secret*;*key*;*token*;JF_ARTIFACTORY_*"
    );
    core.exportVariable("JFROG_CLI_OFFER_CONFIG", "false");
    let buildNameEnv: string = core.getInput(Utils.BUILD_NAME);
    if (buildNameEnv) {
      core.exportVariable("JFROG_CLI_BUILD_NAME", buildNameEnv);
    }
    let buildNumberEnv: string = core.getInput(Utils.BUILD_NUMBER);
    if (buildNumberEnv) {
      core.exportVariable("JFROG_CLI_BUILD_NUMBER", buildNumberEnv);
    }
    let buildProjectEnv: string = core.getInput(Utils.JFROG_PROJECT);
    if (buildProjectEnv) {
      core.exportVariable("JFROG_CLI_BUILD_PROJECT", buildProjectEnv);
    }
    core.exportVariable(
      "JFROG_CLI_BUILD_URL",
      process.env.GITHUB_SERVER_URL +
        "/" +
        process.env.GITHUB_REPOSITORY +
        "/actions/runs/" +
        process.env.GITHUB_RUN_ID
    );
    core.exportVariable("JFROG_CLI_USER_AGENT", Utils.USER_AGENT);
  }

  public static async run() {
    let res: number = 0;
    let args: string[] = [];
    if (core.getInput(Utils.BUILD_TYPE) == "docker-deploy") {
      args = ["rt", "build-collect-env"];
      res = await exec("jfrog", args);

      args = ["rt", "build-add-git"];
      res = await exec("jfrog", args);

      args = [
        "rt",
        "docker-push",
        core.getInput(Utils.DOCKER_IMAGE) +
          ":" +
          core.getInput(Utils.DOCKER_IMAGE_TAG),
        core.getInput(Utils.DOCKER_REPO),
      ];
      res = await exec("jfrog", args);

      args = ["rt", "build-publish"];
      res = await exec("jfrog", args);

      args = [
        "rt",
        "build-scan"
      ];
      res = await exec("jfrog", args);
      await sleep(ms(60000));
      args = [
        "rt",
        "build-scan"
      ];
      res = await exec("jfrog", args);
    }
    if (core.getInput(Utils.BUILD_TYPE) == "promote-docker") {
      args = [
        "rt",
        "docker-promote",
        "--copy",
        "--source-tag=" + core.getInput(Utils.DOCKER_IMAGE_TAG),
        core.getInput(Utils.DOCKER_IMAGE),
        core.getInput(Utils.PROMOTE_SOURCE_REPO),
        core.getInput(Utils.PROMOTE_TO_REPO),
      ];
      res = await exec("jfrog", args);
    }
    if (res !== core.ExitCode.Success) {
      throw new Error("JFrog CLI exited with exit code " + res);
    }
  }
}
