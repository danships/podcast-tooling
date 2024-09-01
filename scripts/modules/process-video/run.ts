import { exec } from "node:child_process";
import shellEscape from "shell-escape";
import { debugLogger } from "./logger";

export async function runShellCommand(command: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const escapedCommand = shellEscape(command);
    debugLogger("Running command:", escapedCommand);
    exec(escapedCommand, (error, stdout, stderr) => {
      debugLogger("Command:", escapedCommand, stdout, stderr);
      if (error) {
        reject(error);
      } else {
        resolve(stdout);
      }
    });
  });
}
