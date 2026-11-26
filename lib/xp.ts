import type { GameStats } from "./types";

export const LEVEL_THRESHOLDS = [0, 100, 250, 500, 850, 1300, 1850, 2500, 3250, 4100, 5100];
export const LEVEL_NAMES = ["Débutant 🌱", "Apprenti 📖", "Élève ✏️", "Studieux 📚", "Brillant ⭐", "Champion 🏆", "Expert 🧠", "Génie 💡", "Prodige 🌟", "Légende 👑", "ALMA Master 🎓"];
export const LEVEL_COLORS = ["#94a3b8","#60a5fa","#34d399","#f59e0b","#f97316","#ec4899","#8b5cf6","#7c3aed","#6d28d9","#f59e0b","#ec4899"];

export const XP_GAINS = {
  devoir_complete: 25,
  tache_complete: 10,
  pomodoro_complete: 15,
  flashcard_created: 5,
  streak_day: 10,
  defi_complete: 50,
};

export function getLevel(xp: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) return i + 1;
  }
  return 1;
}

export function getLevelProgress(xp: number): { level: number; name: string; color: string; pct: number; current: number; needed: number } {
  const level = getLevel(xp);
  const idx = level - 1;
  const start = LEVEL_THRESHOLDS[idx] ?? 0;
  const end = LEVEL_THRESHOLDS[idx + 1] ?? start + 500;
  const current = xp - start;
  const needed = end - start;
  const pct = Math.round((current / needed) * 100);
  return {
    level,
    name: LEVEL_NAMES[idx] ?? "Légende",
    color: LEVEL_COLORS[idx] ?? "#7c3aed",
    pct: Math.min(100, pct),
    current,
    needed,
  };
}

export function addXP(stats: GameStats, amount: number): GameStats {
  return { ...stats, xp: (stats.xp ?? 0) + amount };
}
