export type Statement = {
  bind(...values: unknown[]): Statement;
  first(): Promise<unknown>;
  all(): Promise<unknown>;
  run(): Promise<unknown>;
};

export type Queryable = {
  prepare(query: string): Statement;
  // One round trip, executed as a single transaction; results keep the
  // statement order.
  batch(statements: Statement[]): Promise<unknown[]>;
};

export const STORED_DATA_ERROR = "Stored data is invalid.";

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const rowText = (row: Record<string, unknown>, key: string): string => {
  const value = row[key];
  if (typeof value !== "string") throw new Error(STORED_DATA_ERROR);
  return value;
};

export const rowNullableText = (row: Record<string, unknown>, key: string): string | null => {
  const value = row[key];
  if (value === null || value === undefined) return null;
  if (typeof value !== "string") throw new Error(STORED_DATA_ERROR);
  return value;
};

export const rowNullableTextOrUndefined = (
  row: Record<string, unknown>,
  key: string,
): string | undefined => rowNullableText(row, key) ?? undefined;

export const rowNumber = (row: Record<string, unknown>, key: string): number => {
  const value = row[key];
  if (typeof value !== "number" || !Number.isFinite(value)) throw new Error(STORED_DATA_ERROR);
  return value;
};

export const rowInteger = (row: Record<string, unknown>, key: string): number => {
  const value = rowNumber(row, key);
  if (!Number.isSafeInteger(value)) throw new Error(STORED_DATA_ERROR);
  return value;
};

export const rowNullableInteger = (row: Record<string, unknown>, key: string): number | null => {
  const value = row[key];
  if (value === null || value === undefined) return null;
  return rowInteger(row, key);
};

export const rowFlag = (row: Record<string, unknown>, key: string): boolean | undefined => {
  const value = row[key];
  if (value === null || value === undefined) return undefined;
  return value === 1 || value === true;
};

export const rowFrom = (value: unknown): Record<string, unknown> => {
  if (!isRecord(value)) throw new Error(STORED_DATA_ERROR);
  return value;
};

export const changesOf = (result: unknown): number => {
  if (!isRecord(result) || !isRecord(result.meta)) return 0;
  const changes = result.meta.changes;
  return typeof changes === "number" ? changes : 0;
};

export const rowsFromResult = (result: unknown): unknown[] => {
  const rows = isRecord(result) ? result.results : null;
  if (!Array.isArray(rows)) throw new Error(STORED_DATA_ERROR);
  return rows;
};

export const parseJson = (text: string): unknown => {
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(STORED_DATA_ERROR);
  }
};

export const nowIso = (): string => new Date().toISOString();
