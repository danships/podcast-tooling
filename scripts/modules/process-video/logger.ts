import { environment } from "./environment";

export function logger(...args: any[]) {
  console.log.apply(null, args);
}

export function debugLogger(...args: any[]) {
  if (!environment.DEBUG) {
    return;
  }
  console.log.apply(null, args);
}
