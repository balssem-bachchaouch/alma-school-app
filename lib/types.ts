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

export interface CoursSeance {
  id: string;
  numero: number;
  jour: string;       // "LUNDI", "MARDI" etc
  datePrevu: string;  // ISO date, auto-generated
  done: boolean;
}

export interface CoursCycle {
  id: string;
  numero: number;
  seances: CoursSeance[];
  datePaiement?: string;
  montantPaye?: number;
  paid: boolean;
}

export interface CoursParticulier {
  id: string;
  nom: string;
  matieres: string[];
  montant: number;
  devise: string;
  seancesParCycle: number;
  jours: number[];       // 0=Lun...6=Dim
  dateDebut: string;     // start date
  cycles: CoursCycle[];
}
