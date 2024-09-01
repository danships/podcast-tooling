export function appendFilename(
  filePath: string,
  append: string,
  updatedExtension?: string
): string {
  const parts = filePath.split(".");
  const extension = parts.pop();
  const filename = parts.join(".");
  return `${filename}${append}.${updatedExtension ?? extension}`;
}
