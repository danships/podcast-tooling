export async function inParallel(tasks: Array<Promise<unknown>>) {
  return await Promise.all(tasks);
}
