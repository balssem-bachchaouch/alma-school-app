export const MATIERES = [
  { value: "Mathématiques", bg: "bg-orange-50", badge: "bg-orange-100 text-orange-700", dot: "bg-orange-400" },
  { value: "Français", bg: "bg-blue-50", badge: "bg-blue-100 text-blue-700", dot: "bg-blue-400" },
  { value: "Arabe", bg: "bg-green-50", badge: "bg-green-100 text-green-700", dot: "bg-green-400" },
  { value: "Sciences", bg: "bg-violet-50", badge: "bg-violet-100 text-violet-700", dot: "bg-violet-400" },
  { value: "Anglais", bg: "bg-yellow-50", badge: "bg-yellow-100 text-yellow-700", dot: "bg-yellow-400" },
  { value: "Histoire-Géo", bg: "bg-pink-50", badge: "bg-pink-100 text-pink-700", dot: "bg-pink-400" },
  { value: "Éducation Physique", bg: "bg-red-50", badge: "bg-red-100 text-red-700", dot: "bg-red-400" },
  { value: "Arts Plastiques", bg: "bg-fuchsia-50", badge: "bg-fuchsia-100 text-fuchsia-700", dot: "bg-fuchsia-400" },
];

export const getMatiereConfig = (matiere: string) =>
  MATIERES.find((m) => m.value === matiere) ?? {
    bg: "bg-gray-50",
    badge: "bg-gray-100 text-gray-700",
    dot: "bg-gray-400",
  };

export const DUREES = ["15 min", "30 min", "45 min", "1h", "2h"];

export const SLOT_COLORS = [
  { key: "blue",   classes: "bg-blue-900/40 text-blue-200 border-blue-500/30",     dot: "bg-blue-400" },
  { key: "orange", classes: "bg-orange-900/40 text-orange-200 border-orange-500/30", dot: "bg-orange-400" },
  { key: "violet", classes: "bg-violet-900/40 text-violet-200 border-violet-500/30", dot: "bg-violet-400" },
  { key: "green",  classes: "bg-green-900/40 text-green-200 border-green-500/30",   dot: "bg-green-400" },
  { key: "pink",   classes: "bg-pink-900/40 text-pink-200 border-pink-500/30",     dot: "bg-pink-400" },
  { key: "yellow", classes: "bg-yellow-900/40 text-yellow-200 border-yellow-500/30", dot: "bg-yellow-400" },
];

export const CATEGORIES_PLANNING = ["École", "Cours particulier", "Activité", "Devoirs"];
export const CATEGORIES_CARTABLE = ["École", "Activité", "Cours"];
export const DAYS_FULL = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
