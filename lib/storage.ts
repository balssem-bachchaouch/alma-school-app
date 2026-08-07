import type { Devoir, PlanningSlot, CartableItem, GameStats, Badge, CoursParticulier, TachePerso, Note } from "./types";
import { BADGES_CONFIG } from "./badges";

export function get<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw !== null ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function set<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore quota errors
  }
}

function todayStr() {
  return new Date().toISOString().split("T")[0];
}
function tomorrowStr() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
}

function initialDevoirs(): Devoir[] {
  return [
    { id: "d1", matiere: "Mathématiques", titre: "Exercices page 45", dueDate: todayStr(), duree: "30 min", completed: false },
    { id: "d2", matiere: "Français", titre: "Rédaction sur les vacances", dueDate: todayStr(), duree: "45 min", completed: false },
    { id: "d3", matiere: "Arabe", titre: "Apprendre vocabulaire leçon 3", dueDate: todayStr(), duree: "20 min", completed: false },
    { id: "d4", matiere: "Sciences", titre: "Schéma de la cellule", dueDate: tomorrowStr(), duree: "40 min", completed: false },
    { id: "d5", matiere: "Anglais", titre: "Verbes irréguliers", dueDate: tomorrowStr(), duree: "25 min", completed: false },
  ];
}

function initialSlots(): PlanningSlot[] {
  return [
    { id: "p1", titre: "École", categorie: "École", day: 0, startTime: "08:00", endTime: "12:00", colorClass: "bg-blue-100 text-blue-700 border-blue-200" },
    { id: "p2", titre: "École", categorie: "École", day: 1, startTime: "08:00", endTime: "12:00", colorClass: "bg-blue-100 text-blue-700 border-blue-200" },
    { id: "p3", titre: "École", categorie: "École", day: 2, startTime: "08:00", endTime: "12:00", colorClass: "bg-blue-100 text-blue-700 border-blue-200" },
    { id: "p4", titre: "École", categorie: "École", day: 3, startTime: "08:00", endTime: "12:00", colorClass: "bg-blue-100 text-blue-700 border-blue-200" },
    { id: "p5", titre: "École", categorie: "École", day: 4, startTime: "08:00", endTime: "12:00", colorClass: "bg-blue-100 text-blue-700 border-blue-200" },
    { id: "p6", titre: "Cours d'arabe", categorie: "Cours particulier", day: 0, startTime: "14:00", endTime: "16:00", colorClass: "bg-orange-100 text-orange-700 border-orange-200" },
    { id: "p7", titre: "Cours d'arabe", categorie: "Cours particulier", day: 2, startTime: "14:00", endTime: "16:00", colorClass: "bg-orange-100 text-orange-700 border-orange-200" },
    { id: "p8", titre: "Karaté", categorie: "Activité", day: 1, startTime: "17:00", endTime: "18:30", colorClass: "bg-violet-100 text-violet-700 border-violet-200" },
  ];
}

function initialCartable(): CartableItem[] {
  return [
    { id: "c1", label: "Livre de maths", categorie: "École" },
    { id: "c2", label: "Cahier de français", categorie: "École" },
    { id: "c3", label: "Trousse", categorie: "École" },
    { id: "c4", label: "Gourde", categorie: "École" },
    { id: "c5", label: "Agenda", categorie: "École" },
  ];
}

export function getDevoirs(): Devoir[] {
  const stored = get<Devoir[] | null>("alma_devoirs", null);
  if (!stored) {
    const initial = initialDevoirs();
    set("alma_devoirs", initial);
    return initial;
  }
  return stored;
}
export function saveDevoirs(d: Devoir[]) { set("alma_devoirs", d); }

export function getPlanningSlots(): PlanningSlot[] {
  const stored = get<PlanningSlot[] | null>("alma_planning", null);
  if (!stored) {
    const initial = initialSlots();
    set("alma_planning", initial);
    return initial;
  }
  return stored;
}
export function savePlanningSlots(s: PlanningSlot[]) { set("alma_planning", s); }

export function getCartableItems(): CartableItem[] {
  const stored = get<CartableItem[] | null>("alma_cartable_items", null);
  if (!stored) {
    const initial = initialCartable();
    set("alma_cartable_items", initial);
    return initial;
  }
  return stored;
}
export function saveCartableItems(i: CartableItem[]) { set("alma_cartable_items", i); }

const GAME_STATS_KEY = "alma_game_stats";
const DEFAULT_STATS: GameStats = { coins: 0, totalCompleted: 0, lastActiveDate: "", streak: 0 };

export function getGameStats(): GameStats {
  return get<GameStats>(GAME_STATS_KEY, DEFAULT_STATS);
}

export function saveGameStats(stats: GameStats): void {
  set(GAME_STATS_KEY, stats);
}

export function addCoins(amount: number): void {
  const stats = getGameStats();
  saveGameStats({ ...stats, coins: stats.coins + amount });
}

export function removeCoins(amount: number): void {
  const stats = getGameStats();
  saveGameStats({ ...stats, coins: Math.max(0, stats.coins - amount) });
}

const BADGES_KEY = "alma_badges";

function initialBadges(): Badge[] {
  return BADGES_CONFIG.map((b) => ({ ...b, unlocked: false }));
}

export function getBadges(): Badge[] {
  const stored = get<Badge[] | null>(BADGES_KEY, null);
  if (!stored || stored.length === 0 || typeof stored[0]?.unlocked !== "boolean") {
    const initial = initialBadges();
    set(BADGES_KEY, initial);
    return initial;
  }
  const ids = new Set(stored.map((b) => b.id));
  const missing = BADGES_CONFIG.filter((c) => !ids.has(c.id)).map((c) => ({ ...c, unlocked: false }));
  if (missing.length > 0) {
    const merged = [...stored, ...missing];
    set(BADGES_KEY, merged);
    return merged;
  }
  return stored;
}

export function saveBadges(badges: Badge[]): void {
  set(BADGES_KEY, badges);
}

export function getCours(): CoursParticulier[] {
  return get<CoursParticulier[]>("alma_cours", []);
}

export function saveCours(cours: CoursParticulier[]): void {
  set("alma_cours", cours);
}

const DEFAULT_SELECTION = { date: "", selectedIds: [] as string[] };
const DEFAULT_CHECKED = { date: "", checkedIds: [] as string[] };

export function getCartableSelection(): { date: string; selectedIds: string[] } {
  return get("alma_cartable_selection", DEFAULT_SELECTION);
}

export function saveCartableSelection(data: { date: string; selectedIds: string[] }): void {
  set("alma_cartable_selection", data);
}

export function getCartableChecked(): { date: string; checkedIds: string[] } {
  return get("alma_cartable_checked", DEFAULT_CHECKED);
}

export function saveCartableChecked(data: { date: string; checkedIds: string[] }): void {
  set("alma_cartable_checked", data);
}

export function getTachesPerso(): TachePerso[] {
  return get<TachePerso[]>("alma_taches_perso", []);
}

export function saveTachesPerso(taches: TachePerso[]): void {
  set("alma_taches_perso", taches);
}

export function getNotes(): Note[] {
  return get<Note[]>("alma_notes", []);
}

export function saveNotes(notes: Note[]): void {
  set("alma_notes", notes);
}
