import { SfError } from "@salesforce/core";
import { join } from "node:path";
import { readJsonFile, readLinesFromTextFile } from "./cli.js";

export type TestRunCoverageResult = {
  coverage: number;
  success: boolean;
  message: string;
  error?: SfError;
};

type CoverageJson = {
  summary: {
    testRunCoverage: string;
    orgWideCoverage: string;
  };
};

export async function checkTestRunCoverage(
  coverageDirectory: string,
  threshold: number
): Promise<TestRunCoverageResult> {
  const testRunIdFile = join(coverageDirectory, "test-run-id.txt");
  const testRunId = (await readLinesFromTextFile(testRunIdFile))?.[0];
  const testResultFile = join(
    coverageDirectory,
    `test-result-${testRunId}.json`
  );
  const testResult = await readJsonFile<CoverageJson>(testResultFile);
  const coverage = parseCoverageFromString(
    testResult?.summary?.testRunCoverage
    // testResult?.summary?.orgWideCoverage
  );
  const success = coverage >= threshold;
  return {
    coverage,
    success,
    message: `Test run coverage: ${coverage}%`,
    error: !success
      ? new SfError(
          `Insufficient test run coverage: ${coverage}% (expected ${threshold}%)`
        )
      : undefined,
  };
}

export function parseCoverageFromString(percentage: string): number {
  const n = Number(percentage.replace("%", "").trim());
  if (isNaN(n)) {
    throw new Error(`Could not parse number from percentage: ${percentage}`);
  }
  return n;
}
