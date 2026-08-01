import type { GameStats, Devoir, Badge } from "./types";

export const BADGES_CONFIG = [
  { id: "first_step",    emoji: "🌟", name: "Premier pas",    description: "Valider son 1er devoir" },
  { id: "studious",      emoji: "📚", name: "Studieux",       description: "Valider 10 devoirs au total" },
  { id: "on_fire",       emoji: "🔥", name: "En feu",         description: "Atteindre 5 jours de suite" },
  { id: "unstoppable",   emoji: "💪", name: "Inarrêtable",    description: "10 jours de suite" },
  { id: "perfectionist", emoji: "🎯", name: "Perfectionniste",description: "Tous les devoirs du jour faits" },
  { id: "rich",          emoji: "🪙", name: "Riche",          description: "Accumuler 100 pièces" },
  { id: "versatile",     emoji: "🌈", name: "Polyvalent",     description: "Devoirs dans 5 matières différentes" },
  { id: "organized",     emoji: "🎒", name: "Organisé",       description: "Compléter le cartable 5 fois" },
  { id: "champion",      emoji: "👑", name: "Champion",       description: "Débloquer 5 autres badges" },
  { id: "fast",          emoji: "⚡", name: "Rapide",         description: "Valider 3 devoirs en 1 jour" },
] as const;

export function checkAndUnlockBadges(
  stats: GameStats,
  devoirs: Devoir[],
  currentBadges: Badge[],
  cartableCompletions: number
): { updatedBadges: Badge[]; newlyUnlocked: Badge[] } {
  const today = new Date().toISOString().split("T")[0];
  const todayDevoirs = devoirs.filter((d) => d.dueDate === today);
  const completedToday = todayDevoirs.filter((d) => d.completed);
  const allCompletedMatieres = new Set(devoirs.filter((d) => d.completed).map((d) => d.matiere));

  function isMet(id: string, badges: Badge[]): boolean {
    switch (id) {
      case "first_step":    return stats.totalCompleted >= 1;
      case "studious":      return stats.totalCompleted >= 10;
      case "on_fire":       return stats.streak >= 5;
      case "unstoppable":   return stats.streak >= 10;
      case "perfectionist": return todayDevoirs.length > 0 && completedToday.length === todayDevoirs.length;
      case "rich":          return stats.coins >= 100;
      case "versatile":     return allCompletedMatieres.size >= 5;
      case "organized":     return cartableCompletions >= 5;
      case "fast":          return completedToday.length >= 3;
      case "champion":      return badges.filter((b) => b.id !== "champion" && b.unlocked).length >= 5;
      default:              return false;
    }
  }

  const now = new Date().toISOString();
  const newlyUnlocked: Badge[] = [];

  // First pass: unlock all non-champion badges
  let updatedBadges = currentBadges.map((badge) => {
    if (badge.unlocked || badge.id === "champion") return badge;
    if (isMet(badge.id, currentBadges)) {
      const unlocked = { ...badge, unlocked: true, unlockedAt: now };
      newlyUnlocked.push(unlocked);
      return unlocked;
    }
    return badge;
  });

  // Second pass: check champion with the updated badge list
  const championIdx = updatedBadges.findIndex((b) => b.id === "champion");
  if (championIdx !== -1 && !updatedBadges[championIdx].unlocked && isMet("champion", updatedBadges)) {
    const champion = { ...updatedBadges[championIdx], unlocked: true, unlockedAt: now };
    updatedBadges = [...updatedBadges.slice(0, championIdx), champion, ...updatedBadges.slice(championIdx + 1)];
    newlyUnlocked.push(champion);
  }

  return { updatedBadges, newlyUnlocked };
}
