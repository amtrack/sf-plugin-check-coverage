import { execCmd, TestSession } from "@salesforce/cli-plugins-testkit";
import { expect } from "chai";
import { join } from "node:path";
import { CheckCodeCoverageResult } from "../../../src/commands/coverage/check.js";

let testSession: TestSession;

describe("hello world NUTs", () => {
  before("prepare session", async () => {
    testSession = await TestSession.create({
      project: {
        sourceDir: join(process.cwd(), "test", "fixtures", "sf-project"),
      },
    });
  });

  after(async () => {
    await testSession?.clean();
  });

  it("should succeed for good coverage", () => {
    const output = execCmd<CheckCodeCoverageResult>(
      "coverage check -d coverage-covered --per-file-coverage 75 --json",
      {
        ensureExitCode: 0,
      }
    ).jsonOutput;
    expect(output?.result?.success).to.equal(true);
  });

  it("should succeed when all uncovered and ignored", () => {
    const output = execCmd<CheckCodeCoverageResult>(
      "coverage check -d coverage-uncovered-all --per-file-coverage 75 --ignore-file .sfcoverageignore --json",
      {
        ensureExitCode: 0,
      }
    ).jsonOutput;
    expect(output?.result?.success).to.equal(true);
  });

  it("should fail for insufficient coverage", () => {
    const output = execCmd<CheckCodeCoverageFailureResult>(
      "coverage check -d coverage-uncovered --per-file-coverage 75 --json",
      {
        ensureExitCode: 1,
      }
    ).jsonOutput;
    expect(output?.message).to.match(/Some files have less than.*coverage/);
    expect(output?.data).to.have.property("uncoveredFiles");
    // @ts-ignore
    expect(output?.data?.uncoveredFiles).to.have.lengthOf(1);
  });

  it("should fail when files not found", () => {
    const output = execCmd<CheckCodeCoverageResult>(
      "coverage check -d coverage-missing-file --per-file-coverage 75 --json",
      {
        ensureExitCode: 1,
      }
    ).jsonOutput;
    expect(output?.message).to.match(
      /Could not find source files for.*InvalidClass/
    );
  });
});

type CheckCodeCoverageFailureResult = {
  data: CheckCodeCoverageResult;
};
