/** Practical driving test prep progress — local + server sync. */

import { apiFetch, getUserId } from "./api";

export interface ManeuverProgress {
  stepsRead: number;
  quizPassed: boolean;
  practicedInCar: boolean;
}

export interface PracticalProgress {
  maneuvers: Record<string, ManeuverProgress>;
  vehicleChecklist: Record<string, boolean>;
  dayOfTestChecklist: Record<string, boolean>;
  updatedAt: string;
}

const STORAGE_KEY = "wa_practical_progress";

function emptyProgress(): PracticalProgress {
  return {
    maneuvers: {},
    vehicleChecklist: {},
    dayOfTestChecklist: {},
    updatedAt: new Date().toISOString(),
  };
}

export function loadPracticalProgress(): PracticalProgress {
  if (typeof window === "undefined") return emptyProgress();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyProgress();
    return { ...emptyProgress(), ...JSON.parse(raw) } as PracticalProgress;
  } catch {
    return emptyProgress();
  }
}

function saveLocal(progress: PracticalProgress): void {
  progress.updatedAt = new Date().toISOString();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  window.dispatchEvent(new Event("wa-practical-updated"));
}

export function getManeuverProgress(id: string): ManeuverProgress {
  const p = loadPracticalProgress();
  return p.maneuvers[id] ?? { stepsRead: 0, quizPassed: false, practicedInCar: false };
}

export function setStepsRead(maneuverId: string, stepIndex: number): void {
  const p = loadPracticalProgress();
  const m = p.maneuvers[maneuverId] ?? { stepsRead: 0, quizPassed: false, practicedInCar: false };
  m.stepsRead = Math.max(m.stepsRead, stepIndex + 1);
  p.maneuvers[maneuverId] = m;
  saveLocal(p);
  void syncToServer(p);
}

export function setQuizPassed(maneuverId: string): void {
  const p = loadPracticalProgress();
  const m = p.maneuvers[maneuverId] ?? { stepsRead: 0, quizPassed: false, practicedInCar: false };
  m.quizPassed = true;
  p.maneuvers[maneuverId] = m;
  saveLocal(p);
  void syncToServer(p);
}

export function setPracticedInCar(maneuverId: string, value: boolean): void {
  const p = loadPracticalProgress();
  const m = p.maneuvers[maneuverId] ?? { stepsRead: 0, quizPassed: false, practicedInCar: false };
  m.practicedInCar = value;
  p.maneuvers[maneuverId] = m;
  saveLocal(p);
  void syncToServer(p);
}

export function toggleChecklist(
  kind: "vehicleChecklist" | "dayOfTestChecklist",
  id: string,
): void {
  const p = loadPracticalProgress();
  p[kind][id] = !p[kind][id];
  saveLocal(p);
  void syncToServer(p);
}

export function getOverallPercent(maneuverIds: string[], vehicleIds: string[], dayIds: string[]): number {
  const p = loadPracticalProgress();
  let done = 0;
  let total = maneuverIds.length * 3 + vehicleIds.length + dayIds.length;

  for (const id of maneuverIds) {
    const m = p.maneuvers[id];
    if (!m) continue;
    if (m.stepsRead > 0) done++;
    if (m.quizPassed) done++;
    if (m.practicedInCar) done++;
  }
  for (const id of vehicleIds) {
    if (p.vehicleChecklist[id]) done++;
  }
  for (const id of dayIds) {
    if (p.dayOfTestChecklist[id]) done++;
  }
  return total ? Math.round((done / total) * 100) : 0;
}

async function syncToServer(local: PracticalProgress): Promise<void> {
  const userId = getUserId();
  if (!userId) return;
  try {
    const merged = await apiFetch<PracticalProgress>(`/learning/${userId}/practical/sync`, {
      method: "POST",
      body: JSON.stringify(local),
    });
    saveLocal(merged);
  } catch {
    /* offline */
  }
}

export async function pullPracticalFromServer(userId?: string | null): Promise<void> {
  const id = userId ?? getUserId();
  if (!id) return;
  try {
    const merged = await apiFetch<PracticalProgress>(`/learning/${id}/practical/sync`, {
      method: "POST",
      body: JSON.stringify(loadPracticalProgress()),
    });
    saveLocal(merged);
  } catch {
    /* keep local */
  }
}
