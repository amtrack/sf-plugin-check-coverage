import { readFileSync } from "node:fs";

export async function readLinesFromTextFile(
  ignoreFile: string
): Promise<string[]> {
  try {
    const content = readFileSync(ignoreFile, "utf8");
    return content
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length);
  } catch (e) {
    throw new Error(`Could not text file: ${ignoreFile}`);
  }
}

export async function readJsonFile<T>(file: string): Promise<T> {
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch (e) {
    throw new Error(`Could not read JSON file: ${file}`);
  }
}
