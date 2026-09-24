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
  emoji?: string;
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
  matiere?: string;
}

export interface CoursCycle {
  id: string;
  numero: number;
  seances: CoursSeance[];
  datePaiement?: string;
  montantPaye?: number;
  prochaineDate?: string;
  paid: boolean;
}

export interface Matiere {
  id: string;
  nom: string;
  emoji: string;
  couleur: string;
}

export interface JourCours {
  day: number;        // 0=Lun...6=Dim
  startTime: string;  // "09:00"
  endTime: string;    // "11:00"
}

export interface CoursParticulier {
  id: string;
  nom: string;
  matieres: string[];
  montant: number;
  devise: string;
  seancesParCycle: number;
  jours: JourCours[];
  dateDebut: string;
  cycles: CoursCycle[];
}

export interface TachePerso {
  id: string;
  titre: string;
  description?: string;
  categorie: string;
  completed: boolean;
  createdAt: string;
}

export interface Note {
  id: string;
  titre: string;
  contenu: string;
  couleur: string;
  updatedAt: string;
}
