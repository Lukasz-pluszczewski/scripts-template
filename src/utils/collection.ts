export const pick = <T, K extends keyof T>(obj: T, keys: K[]): { [P in K]: T[P] } => {
    const result: Partial<{ [P in K]: T[P] }> = {};
    for (const key of keys) {
        result[key] = obj[key];
    }
    return result as { [P in K]: T[P] };
}
