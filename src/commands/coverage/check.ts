import { SfError } from "@salesforce/core";
import { Flags, SfCommand } from "@salesforce/sf-plugins-core";
import {
  ClassCoverageExtended,
  PerFileCoverageResult,
  checkPerFileCoverage,
} from "../../per-file-coverage.js";
import {
  TestRunCoverageResult,
  checkTestRunCoverage,
} from "../../test-run-coverage.js";

export type CheckCodeCoverageResult = {
  success: boolean;
  message: string;
  error?: SfError;
  testRunCoverage: number;
  uncoveredFiles?: ClassCoverageExtended[];
};

export class CheckCoverageCommand extends SfCommand<CheckCodeCoverageResult> {
  public static readonly summary =
    "check code coverage of a test run and per file";
  public static readonly examples = [
    "<%= config.bin %> <%= command.id %> --coverage-dir coverage",
    "<%= config.bin %> <%= command.id %> --coverage-dir coverage --test-run-coverage 90",
    "<%= config.bin %> <%= command.id %> --coverage-dir coverage --per-file-coverage 90",
    "<%= config.bin %> <%= command.id %> --coverage-dir coverage --ignore-file .sfcoverageignore",
  ];

  public static readonly requiresProject = true;

  public static readonly flags = {
    "coverage-dir": Flags.directory({
      char: "d",
      summary: "Directory in which the test result files are stored.",
      description:
        "see `--output-dir` flag of `sf apex run test` and `sf apex get test`",
      required: true,
      exists: true,
    }),
    "test-run-coverage": Flags.integer({
      summary: "The minimum required coverage of the test run in percent.",
      env: "SF_TEST_RUN_COVERAGE_THRESHOLD",
      required: true,
      default: 75,
    }),
    "per-file-coverage": Flags.integer({
      summary: "The minimum required coverage per file in percent.",
      env: "SF_PER_FILE_COVERAGE_THRESHOLD",
    }),
    "ignore-file": Flags.file({
      char: "i",
      summary:
        "File containing one line per file for which per-file coverage should be ignored.",
      description:
        "Example line of this file: force-app/main/default/classes/CommunityController.cls",
    }),
  };

  public async run(): Promise<CheckCodeCoverageResult> {
    const { flags } = await this.parse(CheckCoverageCommand);
    const testRunCoverageResult = await checkTestRunCoverage(
      flags["coverage-dir"],
      flags["test-run-coverage"]
    );
    let perFileCoverageResult: PerFileCoverageResult | undefined;
    if (flags["per-file-coverage"] && flags["per-file-coverage"] > 0) {
      perFileCoverageResult = await checkPerFileCoverage(
        flags["coverage-dir"],
        this.project.getPackageDirectories().map((pkgDir) => pkgDir.path),
        flags["per-file-coverage"],
        flags["ignore-file"]
      );
    }
    if (perFileCoverageResult?.uncovered?.length) {
      this.styledHeader(
        `Files with coverage less than ${flags["per-file-coverage"]}%`
      );
      this.table(perFileCoverageResult.uncovered, {
        file: {},
        coveredPercent: {
          header: "%",
        },
        comment: {
          get: (row) => (row.ignored ? "ignored" : ""),
        },
      });
    }
    const result = mergeResults(testRunCoverageResult, perFileCoverageResult);
    if (result.error) {
      throw result.error;
    }
    this.log(result.message);
    return result;
  }
}

function mergeResults(
  testRunCoverageResult: TestRunCoverageResult,
  perFileCoverageResult?: PerFileCoverageResult
): CheckCodeCoverageResult {
  const success =
    testRunCoverageResult.success &&
    (!!perFileCoverageResult ?? perFileCoverageResult?.success);
  const message = [
    testRunCoverageResult?.message,
    perFileCoverageResult?.message,
  ]
    .filter(Boolean)
    .join(" & ");
  const errors = [
    ...(testRunCoverageResult?.error ? [testRunCoverageResult?.error] : []),
    ...(perFileCoverageResult?.error ? [perFileCoverageResult?.error] : []),
  ];
  const error = mergeErrors(errors);
  return {
    success,
    message,
    error,
    testRunCoverage: testRunCoverageResult.coverage,
    uncoveredFiles: perFileCoverageResult?.uncovered,
  };
}

function mergeErrors(errors: SfError[]): SfError | undefined {
  if (errors.length) {
    return new SfError(
      errors.map((e) => e?.message).join(" & "),
      "Code Coverage Error",
      errors
        .map((e) => e?.actions ?? [])
        .flat()
        .filter(Boolean)
    ).setData(
      Object.assign({}, ...errors.filter((e) => e?.data).map((e) => e?.data))
    );
  }
}
