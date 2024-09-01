import fs from "node:fs/promises";
import { promisify } from "util";
import { logger } from "./logger";

const delay = promisify(setTimeout);

export async function waitForFile(filePath: string) {
  while (true) {
    try {
      await fs.access(filePath);
      logger(filePath, "found");
      return;
    } catch {
      logger(
        `File not found at ${filePath}, waiting for it to be created, retrying in 3 seconds`
      );
      await delay(3000);
    }
  }
}
