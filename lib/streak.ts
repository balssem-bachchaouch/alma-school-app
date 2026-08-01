import type { GameStats } from "./types";

export function updateStreak(stats: GameStats): GameStats {
  const today = new Date().toISOString().split("T")[0];
  const last = stats.lastActiveDate;

  if (last === today) return stats;

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yStr = yesterday.toISOString().split("T")[0];

  return {
    ...stats,
    streak: last === yStr ? stats.streak + 1 : 1,
    lastActiveDate: today,
  };
}
