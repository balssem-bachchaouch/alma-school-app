export interface Devoir {
  id: string;
  matiere: string;
  titre: string;
  dueDate: string;
  duree: string;
  completed: boolean;
}

export interface PlanningSlot {
  id: string;
  titre: string;
  categorie: string;
  day: number; // 0=Lundi … 6=Dimanche
  startTime: string;
  endTime: string;
  colorClass: string;
}

export interface CartableItem {
  id: string;
  label: string;
  categorie: string;
}

export interface GameStats {
  coins: number;
  totalCompleted: number;
  lastActiveDate: string;
  streak: number;
}

export interface Badge {
  id: string;
  emoji: string;
  name: string;
  description: string;
  unlocked: boolean;
  unlockedAt?: string;
}
