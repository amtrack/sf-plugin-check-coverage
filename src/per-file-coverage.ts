import { SfError } from "@salesforce/core";
import {
  ComponentSet,
  MetadataMember,
} from "@salesforce/source-deploy-retrieve";
import { join } from "node:path";
import { readJsonFile, readLinesFromTextFile } from "./cli.js";

export type PerFileCoverageResult = {
  uncovered: ClassCoverageExtended[];
  success: boolean;
  message: string;
  error?: SfError;
};

export async function checkPerFileCoverage(
  coverageDirectory: string,
  packageDirectories: string[],
  threshold: number,
  ignoreFile?: string
): Promise<PerFileCoverageResult> {
  let coverageInfos = [];
  const coverageFile = join(coverageDirectory, "test-result-codecoverage.json");

  try {
    coverageInfos = await readJsonFile<ClassCoverage[]>(coverageFile);
  } catch (e) {
    throw new Error(`Could not read coverage file: ${coverageFile}`);
  }
  const filtered = getOnlyUncovered(coverageInfos, threshold);
  const componentSet = await ComponentSet.fromSource({
    fsPaths: packageDirectories,
    include: new ComponentSet(
      filtered.map(getMetadataMemberFromTestResultEntry)
    ),
  });
  const uncoveredWithFiles = addFiles(filtered, componentSet);
  const ignoredFiles = ignoreFile
    ? await readLinesFromTextFile(ignoreFile)
    : [];
  const uncovered = addIgnoreInfo(uncoveredWithFiles, ignoredFiles);
  const insufficientlyCoveredFiles = uncovered.sort(
    (a, b) => b.coveredPercent - a.coveredPercent
  );
  const success = !insufficientlyCoveredFiles.some((entry) => !entry.ignored);
  return {
    uncovered: insufficientlyCoveredFiles,
    success,
    message: `All files are covered more than ${threshold}% or ignored explicitly`,
    error: !success
      ? new SfError(
          `Some files have less than ${threshold}% coverage`,
          "COVERAGE_ERROR",
          [
            "Please improve the coverage of the files above or ignore them using the --ignore-file flag:",
          ]
        ).setData({ uncoveredFiles: insufficientlyCoveredFiles })
      : undefined,
  };
}

export type ClassCoverage = {
  id: string;
  name: string;
  coveredPercent: number;
};

export type ClassCoverageExtended = ClassCoverage & {
  file: string;
  ignored: boolean;
};

export function getOnlyUncovered(
  coverageInfos: ClassCoverage[],
  threshold: number
): ClassCoverage[] {
  return coverageInfos.filter(
    (apexClassCoverage) => apexClassCoverage.coveredPercent < threshold
  );
}

export function addIgnoreInfo(
  coverageInfos: Omit<ClassCoverageExtended, "ignored">[],
  ignoredFiles: string[]
): ClassCoverageExtended[] {
  return coverageInfos.map((coverageInfo) => ({
    ...coverageInfo,
    ignored: ignoredFiles.includes(coverageInfo.file),
  }));
}

export function addFiles(
  coverageInfos: ClassCoverage[],
  componentSet: ComponentSet
): Omit<ClassCoverageExtended, "ignored">[] {
  return coverageInfos.map((coverageInfo) => {
    const metadataMember = getMetadataMemberFromTestResultEntry(coverageInfo);
    const componentFiles =
      componentSet.getComponentFilenamesByNameAndType(metadataMember);
    if (!componentFiles.length) {
      throw new Error(
        `Could not find source files for id=${coverageInfo.id} name=${coverageInfo.name}`
      );
    }
    return {
      ...coverageInfo,
      file: componentFiles[0],
    };
  });
}

export function getMetadataMemberFromTestResultEntry(
  testResultEntry: ClassCoverage
): MetadataMember {
  if (testResultEntry.id.startsWith("01p")) {
    return {
      type: "ApexClass",
      fullName: testResultEntry.name,
    };
  } else if (testResultEntry.id.startsWith("01q")) {
    return {
      type: "ApexTrigger",
      fullName: testResultEntry.name,
    };
  }
  throw new Error(
    `Could not determine MetadataMember from Test Result Entry: id=${testResultEntry.id} name=${testResultEntry.name}`
  );
}
