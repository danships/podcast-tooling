import fs from "fs/promises";
import { logger } from "./logger";

export async function ifNotExists(
  filePath: string,
  callback: () => Promise<void>
) {
  try {
    await fs.access(filePath);
    logger(`File ${filePath} already exists, skipping`);
  } catch (error) {
    await callback();
  }
}
