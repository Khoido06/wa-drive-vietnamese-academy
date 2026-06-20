export interface OfflineExamBundle {
  version: number;
  setId: string;
  setName: string;
  examLength: number;
  passCount: number;
  questions: Array<{
    id: string;
    topic: string;
    questionTextVi: string;
    imageUrl?: string | null;
    options: Array<{ id: string; textVi: string }>;
    correctOptionId: string;
    explanationVi: string;
  }>;
}

let cachedBundle: OfflineExamBundle | null = null;

export async function loadOfflineExamBundle(): Promise<OfflineExamBundle | null> {
  if (cachedBundle) return cachedBundle;
  try {
    const res = await fetch("/offline/exam-wa-set-01.json");
    if (!res.ok) return null;
    cachedBundle = (await res.json()) as OfflineExamBundle;
    return cachedBundle;
  } catch {
    return null;
  }
}

export function isOffline(): boolean {
  return typeof navigator !== "undefined" && !navigator.onLine;
}

export async function apiFetchWithOffline<T>(
  path: string,
  options?: RequestInit,
  offlineFallback?: () => T | Promise<T>,
): Promise<T> {
  try {
    const { apiFetch } = await import("./api");
    return await apiFetch<T>(path, options);
  } catch (err) {
    if (offlineFallback && (!navigator.onLine || err instanceof TypeError)) {
      return offlineFallback();
    }
    throw err;
  }
}
