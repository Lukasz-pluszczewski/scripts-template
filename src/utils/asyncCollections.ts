type ObjectKey = string | number | symbol;
type ObjectEntry<T> = [string | number, T];

export async function asyncMap<T, U>(array: T[], callback: (value: T, index: number, array: T[]) => Promise<U>): Promise<U[]> {
  const result: U[] = [];
  for (let i = 0; i < array.length; i++) {
    result.push(await callback(array[i], i, array));
  }
  return result;
}

export async function asyncForEach<T>(array: T[], callback: (value: T, index: number, array: T[]) => Promise<void>): Promise<void> {
  for (let i = 0; i < array.length; i++) {
    await callback(array[i], i, array);
  }
}

export async function asyncMapValues<T, U>(object: Record<ObjectKey, T>, callback: (value: T, key: ObjectKey, object: Record<ObjectKey, T>) => Promise<U>): Promise<Record<ObjectKey, U>> {
  const result: Record<ObjectKey, U> = {};
  for (const key in object) {
    if (object.hasOwnProperty(key)) {
      result[key] = await callback(object[key], key, object);
    }
  }
  return result;
}

export async function asyncMapEntries<T, U>(object: Record<ObjectKey, T>, callback: (entry: ObjectEntry<T>, index: number, entries: ObjectEntry<T>[]) => Promise<U>): Promise<U[]> {
  const entries = Object.entries(object);
  return asyncMap(entries, callback);
}

export async function asyncMapKeys<T, U>(object: Record<ObjectKey, T>, callback: (key: ObjectKey, index: number, keys: ObjectKey[]) => Promise<U>): Promise<U[]> {
  const keys = Object.keys(object);
  return asyncMap(keys, callback);
}

export async function asyncForEachValues<T>(object: Record<ObjectKey, T>, callback: (value: T, key: ObjectKey, object: Record<ObjectKey, T>) => Promise<void>): Promise<void> {
  for (const key in object) {
    if (object.hasOwnProperty(key)) {
      await callback(object[key], key, object);
    }
  }
}

export async function asyncForEachEntries<T>(object: Record<ObjectKey, T>, callback: (entry: ObjectEntry<T>, index: number, entries: ObjectEntry<T>[]) => Promise<void>): Promise<void> {
  const entries = Object.entries(object);
  await asyncForEach(entries, callback);
}

export async function asyncForEachKeys<T>(object: Record<ObjectKey, T>, callback: (key: ObjectKey, index: number, keys: ObjectKey[]) => Promise<void>): Promise<void> {
  const keys = Object.keys(object);
  await asyncForEach(keys, callback);
}
