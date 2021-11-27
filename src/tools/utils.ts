export function compact<T extends Object>(obj: T): T {
  const compacted: T = {} as any;

  for (const key of Object.keys(obj)) {
    if (typeof obj[key] !== 'undefined') {
      compacted[key] = obj[key];
    }
  }

  return compacted;
}
