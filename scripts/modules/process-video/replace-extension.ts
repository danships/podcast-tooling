export function replaceExtension(filePath: string, extension: string) {
  const parts = filePath.split(".");
  parts.pop();
  const filename = parts.join(".");
  return `${filename}.${extension}`;
}
