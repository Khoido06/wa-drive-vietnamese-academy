export type StateCode = "WA" | "CA" | "TX" | "FL";

export const STATE_CODES: StateCode[] = ["WA", "CA", "TX", "FL"];

const DEFAULT_PATHS: Record<StateCode, string> = {
  WA: "./docs/driver-guide-vi.pdf",
  CA: "./docs/states/ca-driver-guide-vi.md",
  TX: "./docs/states/tx-driver-guide-vi.md",
  FL: "./docs/states/fl-driver-guide-vi.md",
};

const ENV_KEYS: Record<StateCode, string> = {
  WA: "WA_DRIVER_GUIDE_PDF_PATH",
  CA: "CA_DRIVER_GUIDE_PATH",
  TX: "TX_DRIVER_GUIDE_PATH",
  FL: "FL_DRIVER_GUIDE_PATH",
};

export function resolveStateDocumentPath(
  stateCode: string,
  explicitPath?: string,
): string {
  const code = stateCode.toUpperCase() as StateCode;
  if (explicitPath) return explicitPath;
  if (code in ENV_KEYS) {
    const envVal = process.env[ENV_KEYS[code as StateCode]];
    if (envVal) return envVal;
  }
  if (code in DEFAULT_PATHS) return DEFAULT_PATHS[code as StateCode];
  return DEFAULT_PATHS.WA;
}

export function isTextDocument(path: string): boolean {
  return /\.(md|txt)$/i.test(path);
}
