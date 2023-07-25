import fs from 'fs/promises';
import path from 'path';

export const saveToFileRecursive = async (filePath: string, text: string): Promise<void> => {
  const resolvedPath = path.resolve(filePath);
  try {
    await fs.mkdir(path.dirname(resolvedPath), { recursive: true });
  } catch (err) {
    if (err.code !== 'EEXIST') throw err;
  }

  await fs.writeFile(resolvedPath, text);
}
export const loadFromFile = async (filePath: string): Promise<string> => {
  try {
    const resolvedPath = path.resolve(filePath);
    return await fs.readFile(resolvedPath, 'utf-8');
  } catch (err) {
    return undefined;
  }
}



