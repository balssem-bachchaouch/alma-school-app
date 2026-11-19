export interface BoutiqueItem {
  id: string;
  emoji: string;
  name: string;
  description: string;
  cost: number;
  category: "titre" | "deco" | "theme" | "bonus";
  preview?: string; // emoji or short text shown when active
}

export const BOUTIQUE_ITEMS: BoutiqueItem[] = [
  // Titres (affichés sous le nom sur l'accueil)
  { id: "titre_super",   emoji: "⭐", name: "Super Élève",    description: "Titre affiché sur ta page d'accueil",         cost: 30,  category: "titre",  preview: "⭐ Super Élève" },
  { id: "titre_genie",   emoji: "🧠", name: "Génie",          description: "Pour les cracks qui carburent !",              cost: 60,  category: "titre",  preview: "🧠 Génie" },
  { id: "titre_star",    emoji: "🌟", name: "Star de l'École", description: "Le titre le plus brillant",                   cost: 100, category: "titre",  preview: "🌟 Star de l'École" },
  { id: "titre_champ",   emoji: "🏆", name: "Champion",       description: "Réservé aux vrais champions !",                cost: 200, category: "titre",  preview: "🏆 Champion" },

  // Décorations (avatar / accueil)
  { id: "deco_rainbow",  emoji: "🌈", name: "Cadre Arc-en-ciel", description: "Bordure colorée autour de ton avatar",     cost: 50,  category: "deco",   preview: "rainbow" },
  { id: "deco_gold",     emoji: "✨", name: "Cadre Doré",        description: "Bordure dorée scintillante",               cost: 120, category: "deco",   preview: "gold" },
  { id: "deco_hearts",   emoji: "💖", name: "Cœurs Partout",     description: "Des cœurs flottants sur l'accueil",        cost: 80,  category: "deco",   preview: "hearts" },

  // Thèmes hero card
  { id: "theme_sunset",  emoji: "🌅", name: "Thème Coucher de Soleil", description: "Fond orange et rose sur l'accueil",   cost: 70,  category: "theme",  preview: "sunset" },
  { id: "theme_ocean",   emoji: "🌊", name: "Thème Océan",             description: "Fond bleu profond apaisante",         cost: 70,  category: "theme",  preview: "ocean" },
  { id: "theme_galaxy",  emoji: "🌌", name: "Thème Galaxie",           description: "Fond violet cosmique avec étoiles",   cost: 150, category: "theme",  preview: "galaxy" },

  // Bonus
  { id: "bonus_x2",      emoji: "⚡", name: "Multiplicateur ×2", description: "Gagne 20🪙 par devoir pendant 1 jour",    cost: 40,  category: "bonus" },
];

const KEY = "alma_boutique_owned";

export function getOwnedItems(): string[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function buyItem(itemId: string): void {
  try {
    const owned = getOwnedItems();
    if (!owned.includes(itemId)) {
      localStorage.setItem(KEY, JSON.stringify([...owned, itemId]));
    }
  } catch {}
}

export function getActiveTitle(): string | null {
  try {
    return localStorage.getItem("alma_boutique_title") ?? null;
  } catch {
    return null;
  }
}

export function setActiveTitle(preview: string | null): void {
  try {
    if (preview) localStorage.setItem("alma_boutique_title", preview);
    else localStorage.removeItem("alma_boutique_title");
  } catch {}
}

export function getActiveDeco(): string | null {
  try {
    return localStorage.getItem("alma_boutique_deco") ?? null;
  } catch {
    return null;
  }
}

export function setActiveDeco(preview: string | null): void {
  try {
    if (preview) localStorage.setItem("alma_boutique_deco", preview);
    else localStorage.removeItem("alma_boutique_deco");
  } catch {}
}

export function getActiveTheme(): string | null {
  try {
    return localStorage.getItem("alma_boutique_theme") ?? null;
  } catch {
    return null;
  }
}

export function setActiveTheme(preview: string | null): void {
  try {
    if (preview) localStorage.setItem("alma_boutique_theme", preview);
    else localStorage.removeItem("alma_boutique_theme");
  } catch {}
}

export const HERO_GRADIENTS: Record<string, string> = {
  sunset:  "linear-gradient(135deg, #f97316, #ec4899, #f59e0b)",
  ocean:   "linear-gradient(135deg, #0ea5e9, #6366f1, #0d9488)",
  galaxy:  "linear-gradient(135deg, #1e1b4b, #7c3aed, #c026d3)",
  default: "linear-gradient(135deg, #7c3aed, #a855f7, #ec4899)",
};
