import type { CoursSeance, CoursCycle, CoursParticulier } from "./types";

const JOURS_LABELS = ["LUNDI", "MARDI", "MERCREDI", "JEUDI", "VENDREDI", "SAMEDI", "DIMANCHE"];

function jsToJours(jsDay: number): number {
  return (jsDay + 6) % 7;
}

export function generateSeances(
  jours: number[],
  count: number,
  startDate: string,
  startNumero: number = 1
): CoursSeance[] {
  const result: CoursSeance[] = [];
  const current = new Date(startDate + "T12:00:00");
  let numero = startNumero;

  while (result.length < count) {
    const idx = jsToJours(current.getDay());
    if (jours.includes(idx)) {
      result.push({
        id: crypto.randomUUID(),
        numero,
        jour: JOURS_LABELS[idx],
        datePrevu: current.toISOString().split("T")[0],
        done: false,
      });
      numero++;
    }
    current.setDate(current.getDate() + 1);
  }

  return result;
}

export function updateCycleSeances(
  cycle: CoursCycle,
  cours: CoursParticulier
): CoursCycle {
  const doneCount = cycle.seances.filter((s) => s.done).length;
  const undoneCount = cycle.seances.filter((s) => !s.done).length;

  // Only generate new séances when there are no pending ones left and cycle isn't done
  if (undoneCount > 0 || doneCount >= cours.seancesParCycle) return cycle;

  // Cap total séances at seancesParCycle * 2
  if (cycle.seances.length >= cours.seancesParCycle * 2) return cycle;

  const toGenerate = Math.min(
    cours.seancesParCycle - doneCount,
    cours.seancesParCycle * 2 - cycle.seances.length
  );

  const lastSeance = cycle.seances[cycle.seances.length - 1];
  const lastDate = new Date(lastSeance.datePrevu + "T12:00:00");
  lastDate.setDate(lastDate.getDate() + 1);

  const newSeances = generateSeances(
    cours.jours,
    toGenerate,
    lastDate.toISOString().split("T")[0],
    cycle.seances.length + 1
  );

  return { ...cycle, seances: [...cycle.seances, ...newSeances] };
}

export function isCycleComplete(cycle: CoursCycle, seancesParCycle: number): boolean {
  return cycle.seances.filter((s) => s.done).length >= seancesParCycle;
}

export function formatDateFr(dateStr: string): string {
  const MOIS = [
    "JANVIER", "FÉVRIER", "MARS", "AVRIL", "MAI", "JUIN",
    "JUILLET", "AOÛT", "SEPTEMBRE", "OCTOBRE", "NOVEMBRE", "DÉCEMBRE",
  ];
  const d = new Date(dateStr + "T12:00:00");
  return `${d.getDate()} ${MOIS[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatDateFrShort(dateStr: string): string {
  const MOIS = [
    "Jan", "Fév", "Mar", "Avr", "Mai", "Juin",
    "Juil", "Août", "Sep", "Oct", "Nov", "Déc",
  ];
  const d = new Date(dateStr + "T12:00:00");
  return `${d.getDate()} ${MOIS[d.getMonth()]} ${d.getFullYear()}`;
}
