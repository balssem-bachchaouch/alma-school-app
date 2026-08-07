"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CoursParticulier, CoursCycle, CoursSeance } from "@/lib/types";
import {
  generateSeances, updateCycleSeances, isCycleComplete, formatDateFr, formatDateFrShort,
} from "@/lib/coursUtils";

const MATIERES_OPTIONS = ["Mathématiques", "Français", "Arabe", "Anglais", "Sciences", "Autre"];
const DEVISES = ["DT", "€", "$"];
const JOURS_SHORT = ["LUN", "MAR", "MER", "JEU", "VEN", "SAM", "DIM"];
const JOURS_FULL = ["LUNDI", "MARDI", "MERCREDI", "JEUDI", "VENDREDI", "SAMEDI", "DIMANCHE"];

function todayStr() { return new Date().toISOString().split("T")[0]; }

function dateToJour(d: string): string {
  if (!d) return "";
  return JOURS_FULL[(new Date(d + "T12:00:00").getDay() + 6) % 7];
}

function createFirstCycle(n: number, jours: number[], start: string): CoursCycle {
  return { id: crypto.randomUUID(), numero: 1, seances: generateSeances(jours, n, start), paid: false };
}

function appendCompensation(cycle: CoursCycle, cours: CoursParticulier): CoursCycle {
  const last = cycle.seances[cycle.seances.length - 1]?.datePrevu ?? todayStr();
  const next = new Date(last + "T12:00:00");
  next.setDate(next.getDate() + 1);
  const [s] = generateSeances(cours.jours, 1, next.toISOString().split("T")[0], cycle.seances.length + 1);
  return { ...cycle, seances: [...cycle.seances, s] };
}

// ── Types ─────────────────────────────────────────────────────────────────

type FormState = {
  nom: string; matieres: string[]; montant: string; devise: string;
  seancesParCycle: string; jours: number[]; dateDebut: string;
};
const DEFAULT_FORM: FormState = {
  nom: "", matieres: ["Mathématiques"], montant: "", devise: "DT",
  seancesParCycle: "12", jours: [], dateDebut: todayStr(),
};

type PaymentDialog = { coursId: string; cycleId: string; montant: string; devise: string; date: string; prochaineDate: string };
type NewCycleDialog = { coursId: string; currentCycleId: string; cycleNumero: number; montant: string; devise: string; date: string; prochaineDate: string };
type AddSeanceDialog = { coursId: string; cycleId: string; date: string; statut: "todo" | "done" };
type EditDateDialog = { coursId: string; cycleId: string; seanceId: string; date: string };
type DeleteSeanceDialog = { coursId: string; cycleId: string; seanceId: string; numero: number };
type EditSeanceDialog = { coursId: string; cycleId: string; seanceId: string; date: string; matiere: string };

// ── Sub-components ─────────────────────────────────────────────────────────

function JoursToggle({ jours, onToggle }: { jours: number[]; onToggle: (i: number) => void }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label style={{ color: "#3b0764" }}>Jours du cours</Label>
      <div className="flex gap-1.5 flex-wrap">
        {JOURS_SHORT.map((label, idx) => (
          <button key={idx} type="button" onClick={() => onToggle(idx)}
            className="px-2.5 py-1 rounded-xl text-xs font-bold transition-all active:scale-90"
            style={jours.includes(idx)
              ? { background: "linear-gradient(135deg, #7c3aed, #ec4899)", color: "#fff" }
              : { background: "rgba(124,58,237,0.08)", color: "#6d28d9", border: "1px solid rgba(124,58,237,0.2)" }}>
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

function MatiereToggle({ matieres, onToggle }: { matieres: string[]; onToggle: (m: string) => void }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label style={{ color: "#3b0764" }}>Matières</Label>
      <div className="flex gap-1.5 flex-wrap">
        {MATIERES_OPTIONS.map((m) => (
          <button key={m} type="button" onClick={() => onToggle(m)}
            className="px-2.5 py-1 rounded-xl text-xs font-bold transition-all active:scale-90"
            style={matieres.includes(m)
              ? { background: "linear-gradient(135deg, #7c3aed, #ec4899)", color: "#fff" }
              : { background: "rgba(124,58,237,0.08)", color: "#6d28d9", border: "1px solid rgba(124,58,237,0.2)" }}>
            {m}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────

export default function CoursPage() {
  const [cours, setCours] = useState<CoursParticulier[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [viewCycleIdx, setViewCycleIdx] = useState<Record<string, number>>({});

  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [paymentDialog, setPaymentDialog] = useState<PaymentDialog | null>(null);
  const [newCycleDialog, setNewCycleDialog] = useState<NewCycleDialog | null>(null);
  const [addSeanceDialog, setAddSeanceDialog] = useState<AddSeanceDialog | null>(null);
  const [editDateDialog, setEditDateDialog] = useState<EditDateDialog | null>(null);
  const [deleteSeanceDialog, setDeleteSeanceDialog] = useState<DeleteSeanceDialog | null>(null);
  const [editSeanceDialog, setEditSeanceDialog] = useState<EditSeanceDialog | null>(null);
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);

  useEffect(() => {
    fetch("/api/cours")
      .then(r => {
        if (!r.ok) throw new Error("fetch");
        return r.json() as Promise<CoursParticulier[]>;
      })
      .then(data => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const migrated: CoursParticulier[] = (data as any[]).map((c) => ({
          ...c,
          matieres: Array.isArray(c.matieres) ? c.matieres : typeof c.matiere === "string" ? [c.matiere] : ["Autre"],
          jours: Array.isArray(c.jours) ? c.jours : [],
          dateDebut: typeof c.dateDebut === "string" ? c.dateDebut : todayStr(),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          cycles: (Array.isArray(c.cycles) ? c.cycles : []).map((cy: any, cyIdx: number) => ({
            ...cy,
            numero: typeof cy.numero === "number" ? cy.numero : cyIdx + 1,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            seances: (Array.isArray(cy.seances) ? cy.seances : []).map((s: any, si: number) => ({
              ...s,
              numero: typeof s.numero === "number" ? s.numero : si + 1,
              jour: typeof s.jour === "string" ? s.jour : "",
              datePrevu: typeof s.datePrevu === "string" ? s.datePrevu : typeof s.date === "string" ? s.date : todayStr(),
            })),
          })),
        }));

        const ready = migrated.map(c => {
          if (c.cycles.length === 0) return c;
          const i = c.cycles.length - 1;
          const updated = updateCycleSeances(c.cycles[i], c);
          return { ...c, cycles: [...c.cycles.slice(0, i), updated] };
        });

        setCours(ready);

        // Persist any auto-extended cycles back to the API
        ready.forEach((c, i) => {
          if (JSON.stringify(c.cycles) !== JSON.stringify(migrated[i]?.cycles)) {
            fetch(`/api/cours/${c.id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(c),
            });
          }
        });

        setLoaded(true);
      })
      .catch(() => {
        setError("Impossible de charger les cours");
        setLoaded(true);
      });
  }, []);

  // PUT one cours to the API (fire-and-forget)
  const persist = (c: CoursParticulier) => {
    fetch(`/api/cours/${c.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(c),
    });
  };

  // Update state and persist the changed cours
  const save = (next: CoursParticulier[], changedId: string) => {
    setCours(next);
    const changed = next.find(x => x.id === changedId);
    if (changed) persist(changed);
  };

  const toggleJour = (idx: number) => setForm(f => ({
    ...f, jours: f.jours.includes(idx) ? f.jours.filter(j => j !== idx) : [...f.jours, idx],
  }));
  const toggleMatiere = (m: string) => setForm(f => ({
    ...f, matieres: f.matieres.includes(m) ? f.matieres.filter(x => x !== m) : [...f.matieres, m],
  }));

  // ── Cours CRUD ────────────────────────────────────────────────────────────

  const handleAdd = () => {
    if (!form.nom || !form.montant || form.jours.length === 0) return;
    const n = Math.max(1, parseInt(form.seancesParCycle) || 12);
    const start = form.dateDebut || todayStr();
    const newCours: CoursParticulier = {
      id: crypto.randomUUID(), nom: form.nom,
      matieres: form.matieres.length > 0 ? form.matieres : ["Autre"],
      montant: parseFloat(form.montant), devise: form.devise, seancesParCycle: n,
      jours: [...form.jours].sort((a, b) => a - b), dateDebut: start,
      cycles: [createFirstCycle(n, form.jours, start)],
    };
    setCours(prev => [...prev, newCours]);
    fetch("/api/cours", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newCours),
    });
    setForm(DEFAULT_FORM);
    setAddOpen(false);
  };

  const openEdit = (c: CoursParticulier) => {
    setEditingId(c.id);
    setForm({ nom: c.nom, matieres: c.matieres, montant: String(c.montant), devise: c.devise,
      seancesParCycle: String(c.seancesParCycle), jours: c.jours, dateDebut: c.dateDebut });
    setEditOpen(true);
  };

  const handleEdit = () => {
    if (!editingId || !form.nom || !form.montant || form.jours.length === 0) return;
    const next = cours.map(c => {
      if (c.id !== editingId) return c;
      const newJours = [...form.jours].sort((a, b) => a - b);
      const newSpc = Math.max(1, parseInt(form.seancesParCycle) || 12);
      const cy = c.cycles[c.cycles.length - 1];
      const done = cy.seances.filter(s => s.done);
      const lastDate = done.length > 0 ? done[done.length - 1].datePrevu : (form.dateDebut || c.dateDebut);
      const needed = newSpc - done.length;
      let updatedCy: CoursCycle;
      if (needed > 0) {
        const nd = new Date(lastDate + "T12:00:00");
        if (done.length > 0) nd.setDate(nd.getDate() + 1);
        updatedCy = { ...cy, seances: [...done, ...generateSeances(newJours, needed, nd.toISOString().split("T")[0], done.length + 1)] };
      } else {
        updatedCy = { ...cy, seances: done };
      }
      return { ...c, nom: form.nom, matieres: form.matieres.length > 0 ? form.matieres : c.matieres,
        montant: parseFloat(form.montant), devise: form.devise, seancesParCycle: newSpc,
        jours: newJours, dateDebut: form.dateDebut || c.dateDebut,
        cycles: [...c.cycles.slice(0, -1), updatedCy] };
    });
    save(next, editingId);
    setEditOpen(false); setEditingId(null);
  };

  const handleDelete = (id: string) => {
    setCours(prev => prev.filter(c => c.id !== id));
    fetch(`/api/cours/${id}`, { method: "DELETE" });
    setDeleteConfirmId(null);
    if (expandedId === id) setExpandedId(null);
  };

  // ── Séance toggle + auto-extend ────────────────────────────────────────

  const toggleSeance = (coursId: string, cycleId: string, seanceId: string) => {
    const next = cours.map(c => {
      if (c.id !== coursId) return c;
      return {
        ...c,
        cycles: c.cycles.map(cy => {
          if (cy.id !== cycleId) return cy;
          const toggled = { ...cy, seances: cy.seances.map(s => s.id === seanceId ? { ...s, done: !s.done } : s) };
          const nowUnchecked = toggled.seances.find(s => s.id === seanceId)?.done === false;
          if (nowUnchecked && !isCycleComplete(toggled, c.seancesParCycle)) {
            return appendCompensation(toggled, c);
          }
          return toggled;
        }),
      };
    });
    save(next, coursId);
  };

  // ── New cycle (with payment) ───────────────────────────────────────────

  const openNewCycleDialog = (c: CoursParticulier) => {
    const last = c.cycles[c.cycles.length - 1];
    setNewCycleDialog({ coursId: c.id, currentCycleId: last.id, cycleNumero: last.numero,
      montant: String(c.montant), devise: c.devise, date: todayStr(), prochaineDate: "" });
  };

  const confirmNewCycle = () => {
    if (!newCycleDialog) return;
    const { coursId, currentCycleId, montant, date, prochaineDate } = newCycleDialog;
    const c = cours.find(co => co.id === coursId);
    if (!c) return;
    const lastCycle = c.cycles[c.cycles.length - 1];
    const lastDate = lastCycle.seances.at(-1)?.datePrevu ?? todayStr();
    const nd = new Date(lastDate + "T12:00:00");
    nd.setDate(nd.getDate() + 1);
    const newCycle: CoursCycle = {
      id: crypto.randomUUID(), numero: lastCycle.numero + 1,
      seances: generateSeances(c.jours, c.seancesParCycle, nd.toISOString().split("T")[0]),
      paid: false,
    };
    const next = cours.map(co => {
      if (co.id !== coursId) return co;
      return {
        ...co,
        cycles: [
          ...co.cycles.map(cy => cy.id !== currentCycleId ? cy : {
            ...cy, paid: true, datePaiement: date,
            montantPaye: parseFloat(montant) || co.montant,
            ...(prochaineDate ? { prochaineDate } : {}),
          }),
          newCycle,
        ],
      };
    });
    save(next, coursId);
    setViewCycleIdx(prev => ({ ...prev, [coursId]: c.cycles.length }));
    setNewCycleDialog(null);
  };

  // ── Payment (existing cycle) ───────────────────────────────────────────

  const openPaymentDialog = (c: CoursParticulier, cy: CoursCycle) =>
    setPaymentDialog({ coursId: c.id, cycleId: cy.id, montant: String(c.montant),
      devise: c.devise, date: todayStr(), prochaineDate: "" });

  const confirmPayment = () => {
    if (!paymentDialog) return;
    const { coursId, cycleId, montant, date, prochaineDate } = paymentDialog;
    const next = cours.map(c => {
      if (c.id !== coursId) return c;
      return {
        ...c, cycles: c.cycles.map(cy => cy.id !== cycleId ? cy : {
          ...cy, paid: true, datePaiement: date,
          montantPaye: parseFloat(montant) || c.montant,
          ...(prochaineDate ? { prochaineDate } : {}),
        }),
      };
    });
    save(next, coursId);
    setPaymentDialog(null);
  };

  // ── Add séance manually ────────────────────────────────────────────────

  const addSeance = () => {
    if (!addSeanceDialog?.date) return;
    const { coursId, cycleId, date, statut } = addSeanceDialog;
    const jour = dateToJour(date);
    const next = cours.map(c => {
      if (c.id !== coursId) return c;
      return {
        ...c, cycles: c.cycles.map(cy => {
          if (cy.id !== cycleId) return cy;
          const newS: CoursSeance = { id: crypto.randomUUID(), numero: 0, jour, datePrevu: date, done: statut === "done" };
          const sorted = [...cy.seances, newS].sort((a, b) => a.datePrevu.localeCompare(b.datePrevu));
          const renumbered = sorted.map((s, i) => ({ ...s, numero: i + 1 }));
          return updateCycleSeances({ ...cy, seances: renumbered }, c);
        }),
      };
    });
    save(next, coursId);
    setAddSeanceDialog(null);
  };

  // ── Delete séance ─────────────────────────────────────────────────────

  const deleteSeance = () => {
    if (!deleteSeanceDialog) return;
    const { coursId, cycleId, seanceId } = deleteSeanceDialog;
    const next = cours.map(c => {
      if (c.id !== coursId) return c;
      return {
        ...c, cycles: c.cycles.map(cy => {
          if (cy.id !== cycleId) return cy;
          const filtered = cy.seances
            .filter(s => s.id !== seanceId)
            .map((s, i) => ({ ...s, numero: i + 1 }));
          return updateCycleSeances({ ...cy, seances: filtered }, c);
        }),
      };
    });
    save(next, coursId);
    setDeleteSeanceDialog(null);
  };

  // ── Edit séance (date + matière) ──────────────────────────────────────

  const confirmEditSeance = () => {
    if (!editSeanceDialog?.date) return;
    const { coursId, cycleId, seanceId, date, matiere } = editSeanceDialog;
    const jour = new Date(date + "T12:00:00").toLocaleDateString("fr-FR", { weekday: "long" }).toUpperCase();
    const next = cours.map(c => {
      if (c.id !== coursId) return c;
      return {
        ...c, cycles: c.cycles.map(cy => {
          if (cy.id !== cycleId) return cy;
          const updated = cy.seances
            .map(s => s.id === seanceId ? { ...s, datePrevu: date, jour, ...(matiere ? { matiere } : {}) } : s)
            .sort((a, b) => a.datePrevu.localeCompare(b.datePrevu));
          return { ...cy, seances: updated.map((s, i) => ({ ...s, numero: i + 1 })) };
        }),
      };
    });
    save(next, coursId);
    setEditSeanceDialog(null);
  };

  // ── Edit séance date ───────────────────────────────────────────────────

  const confirmEditDate = () => {
    if (!editDateDialog?.date) return;
    const { coursId, cycleId, seanceId, date } = editDateDialog;
    const jour = dateToJour(date);
    const next = cours.map(c => {
      if (c.id !== coursId) return c;
      return {
        ...c, cycles: c.cycles.map(cy => {
          if (cy.id !== cycleId) return cy;
          const updated = cy.seances.map(s => s.id === seanceId ? { ...s, datePrevu: date, jour } : s)
            .sort((a, b) => a.datePrevu.localeCompare(b.datePrevu));
          return { ...cy, seances: updated.map((s, i) => ({ ...s, numero: i + 1 })) };
        }),
      };
    });
    save(next, coursId);
    setEditDateDialog(null);
  };

  if (!loaded) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="text-4xl mb-3" style={{ animation: "spin 1s linear infinite" }}>⏳</div>
        <p className="text-sm font-semibold" style={{ color: "#6d28d9" }}>Chargement…</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="px-4 pt-16 text-center">
      <div className="text-4xl mb-3">❌</div>
      <p className="font-semibold mb-1" style={{ color: "#3b0764" }}>Erreur de chargement</p>
      <p className="text-sm" style={{ color: "#6d28d9" }}>{error}</p>
    </div>
  );

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="px-4 pt-8 pb-28 max-w-md mx-auto">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-extrabold" style={{ color: "#3b0764" }}>🎓 Cours Particuliers</h1>
        <button onClick={() => { setForm({ ...DEFAULT_FORM, dateDebut: todayStr() }); setAddOpen(true); }}
          className="flex items-center gap-1.5 text-white px-4 py-2 rounded-2xl text-sm font-bold shadow-sm active:scale-95 transition-transform"
          style={{ background: "linear-gradient(135deg, #7c3aed, #ec4899)" }}>
          <Plus size={16} /> Ajouter
        </button>
      </div>
      <p className="text-sm mb-6" style={{ color: "#6d28d9" }}>
        {cours.length === 0 ? "Aucun cours particulier" : `${cours.length} cours suivi${cours.length > 1 ? "s" : ""}`}
      </p>

      {cours.length === 0 && (
        <div className="rounded-3xl p-8 text-center" style={{ background: "#fff", border: "1px solid rgba(139,92,246,0.2)", boxShadow: "0 2px 12px rgba(124,58,237,0.08)" }}>
          <div className="text-4xl mb-3">📚</div>
          <p className="font-semibold text-base mb-1" style={{ color: "#3b0764" }}>Aucun cours particulier</p>
          <p className="text-sm" style={{ color: "#6d28d9" }}>Ajoute un cours pour suivre les séances et paiements</p>
        </div>
      )}

      <div className="flex flex-col gap-4">
        {cours.map(c => {
          const currentIdx = c.cycles.length - 1;
          const currentCycle = c.cycles[currentIdx];
          const doneCount = currentCycle.seances.filter(s => s.done).length;
          const total = c.seancesParCycle;
          const pct = Math.min(100, Math.round((doneCount / total) * 100));
          const complete = isCycleComplete(currentCycle, total);
          const nearEnd = !complete && doneCount >= total - 2;
          const isExpanded = expandedId === c.id;

          const viewedIdx = Math.min(viewCycleIdx[c.id] ?? currentIdx, currentIdx);
          const viewedCycle = c.cycles[viewedIdx] ?? currentCycle;
          const isCurrentView = viewedIdx === currentIdx;

          return (
            <div key={c.id} className="rounded-2xl overflow-hidden" style={{ background: "#fff", border: "1px solid rgba(139,92,246,0.15)", boxShadow: "0 2px 10px rgba(124,58,237,0.07)" }}>

              {/* Banners */}
              {complete && (
                <div className="px-4 py-2.5 flex items-center justify-between gap-2"
                  style={{ background: "rgba(239,68,68,0.07)", borderBottom: "1px solid rgba(239,68,68,0.18)" }}>
                  <span className="text-xs font-bold" style={{ color: "#dc2626" }}>
                    🔔 Cycle {currentCycle.numero} terminé !
                  </span>
                  <button onClick={() => openNewCycleDialog(c)}
                    className="shrink-0 text-xs font-bold px-3 py-1 rounded-xl text-white active:scale-95 transition-transform"
                    style={{ background: "#dc2626" }}>
                    🔄 Démarrer cycle {currentCycle.numero + 1}
                  </button>
                </div>
              )}
              {nearEnd && (
                <div className="px-4 py-1.5" style={{ background: "rgba(245,158,11,0.07)", borderBottom: "1px solid rgba(245,158,11,0.18)" }}>
                  <span className="text-xs font-bold" style={{ color: "#d97706" }}>
                    ⚠️ Plus que {total - doneCount} séance{total - doneCount > 1 ? "s" : ""} !
                  </span>
                </div>
              )}

              {/* Card body */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0 pr-2">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h2 className="font-extrabold text-base leading-tight" style={{ color: "#3b0764" }}>{c.nom}</h2>
                      {c.matieres.map(m => (
                        <span key={m} className="text-xs font-semibold px-2 py-0.5 rounded-full"
                          style={{ background: "rgba(124,58,237,0.1)", color: "#7c3aed" }}>{m}</span>
                      ))}
                    </div>
                    <p className="text-xs font-medium mb-2" style={{ color: "#7c3aed" }}>
                      📅 {c.jours.map(j => JOURS_FULL[j]).join(" · ")}
                    </p>
                    <div className="text-xs font-semibold mb-1.5" style={{ color: "#6d28d9" }}>
                      Cycle {currentCycle.numero} — {doneCount}/{total} effectuées
                    </div>
                    <div className="h-2 rounded-full overflow-hidden mb-2" style={{ background: "rgba(124,58,237,0.1)" }}>
                      <motion.div className="h-full rounded-full" style={{ background: "linear-gradient(90deg, #7c3aed, #ec4899)" }}
                        animate={{ width: `${pct}%` }} transition={{ duration: 0.4 }} />
                    </div>
                    {currentCycle.paid ? (
                      <p className="text-xs font-semibold" style={{ color: "#16a34a" }}>
                        💰 PAYÉ LE : {formatDateFrShort(currentCycle.datePaiement!)} — {currentCycle.montantPaye ?? c.montant} {c.devise}
                      </p>
                    ) : doneCount > 0 && !complete ? (
                      <button onClick={() => openPaymentDialog(c, currentCycle)}
                        className="text-xs font-bold px-3 py-1 rounded-xl text-white active:scale-95 transition-transform"
                        style={{ background: "linear-gradient(135deg, #7c3aed, #ec4899)" }}>
                        💰 Enregistrer le paiement
                      </button>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0">
                    <button onClick={() => openEdit(c)} className="p-2.5 rounded-xl active:scale-90 transition-transform" style={{ color: "#7c3aed" }}><Pencil size={15} /></button>
                    <button onClick={() => setDeleteConfirmId(c.id)} className="p-2.5 rounded-xl active:scale-90 transition-transform text-red-500"><Trash2 size={15} /></button>
                    <button onClick={() => setExpandedId(isExpanded ? null : c.id)} className="p-1.5 rounded-xl active:scale-90 transition-transform" style={{ color: "#7c3aed" }}>
                      <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}><ChevronDown size={18} /></motion.div>
                    </button>
                  </div>
                </div>
              </div>

              {/* Expanded */}
              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div key="exp" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22, ease: "easeInOut" }} style={{ overflow: "hidden" }}>
                    <div className="px-4 pb-24" style={{ borderTop: "1px solid rgba(139,92,246,0.1)" }}>

                      {/* Cycle navigation */}
                      <div className="flex items-center justify-between mt-3 mb-1">
                        <button
                          onClick={() => setViewCycleIdx(p => ({ ...p, [c.id]: Math.max(0, (p[c.id] ?? currentIdx) - 1) }))}
                          disabled={viewedIdx === 0}
                          className="p-1.5 rounded-lg disabled:opacity-25 active:scale-90 transition-transform"
                          style={{ color: "#7c3aed" }}>
                          <ChevronLeft size={16} />
                        </button>
                        <span className="text-xs font-bold" style={{ color: "#3b0764" }}>
                          Cycle {viewedCycle.numero}{isCurrentView ? " (actuel)" : " — lecture seule"}
                        </span>
                        <button
                          onClick={() => setViewCycleIdx(p => ({ ...p, [c.id]: Math.min(currentIdx, (p[c.id] ?? currentIdx) + 1) }))}
                          disabled={viewedIdx === currentIdx}
                          className="p-1.5 rounded-lg disabled:opacity-25 active:scale-90 transition-transform"
                          style={{ color: "#7c3aed" }}>
                          <ChevronRight size={16} />
                        </button>
                      </div>

                      <p className="text-xs font-bold mt-2 mb-2" style={{ color: "#6d28d9" }}>
                        📅 Séances — Cycle {viewedCycle.numero}
                      </p>

                      {/* Table */}
                      <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(139,92,246,0.15)" }}>
                        <div className="grid text-xs font-bold px-3 py-2"
                          style={{ gridTemplateColumns: "2rem 5rem 1fr 1.5rem 1.5rem 2.5rem", background: "rgba(124,58,237,0.06)", color: "#6d28d9", borderBottom: "1px solid rgba(139,92,246,0.15)" }}>
                          <span>N°</span><span>JOUR</span><span>DATE</span><span></span><span></span><span className="text-right">✓</span>
                        </div>

                        {viewedCycle.seances.map((s, rowIdx) => {
                          const isExtra = rowIdx >= c.seancesParCycle;
                          return (
                            <div key={s.id} className="grid items-center px-3 py-2 text-xs"
                              style={{
                                gridTemplateColumns: "2rem 5rem 1fr 1.5rem 1.5rem 2.5rem",
                                background: s.done ? "rgba(134,239,172,0.08)" : isExtra ? "rgba(124,58,237,0.03)" : "#fff",
                                borderTop: rowIdx > 0 ? "1px solid rgba(139,92,246,0.08)" : undefined,
                                borderLeft: isExtra && !s.done ? "3px solid rgba(124,58,237,0.3)" : undefined,
                              }}>
                              <span className="font-bold" style={{ color: s.done ? "#16a34a" : "#3b0764" }}>{s.numero}</span>
                              <span className="font-semibold" style={{ color: s.done ? "#16a34a" : "#3b0764" }}>{s.jour}</span>
                              <button
                                onClick={() => isCurrentView && setEditDateDialog({ coursId: c.id, cycleId: viewedCycle.id, seanceId: s.id, date: s.datePrevu })}
                                className="text-left truncate"
                                style={{ color: s.done ? "#6b7280" : "#3b0764", textDecoration: s.done ? "line-through" : "none", cursor: isCurrentView ? "pointer" : "default" }}>
                                {formatDateFr(s.datePrevu)}
                              </button>
                              <div className="flex justify-center">
                                {!s.done && isCurrentView && (
                                  <button
                                    onClick={() => setEditSeanceDialog({ coursId: c.id, cycleId: viewedCycle.id, seanceId: s.id, date: s.datePrevu, matiere: s.matiere ?? "" })}
                                    className="flex items-center justify-center active:scale-90 transition-transform"
                                    style={{ color: "#7c3aed", opacity: 0.7 }}>
                                    ✏️
                                  </button>
                                )}
                              </div>
                              <div className="flex justify-center">
                                {!s.done && isCurrentView && (
                                  <button
                                    onClick={() => setDeleteSeanceDialog({ coursId: c.id, cycleId: viewedCycle.id, seanceId: s.id, numero: s.numero })}
                                    className="flex items-center justify-center active:scale-90 transition-transform"
                                    style={{ color: "#ef4444", opacity: 0.7 }}>
                                    🗑️
                                  </button>
                                )}
                              </div>
                              <div className="flex justify-end">
                                <button
                                  onClick={() => isCurrentView && toggleSeance(c.id, viewedCycle.id, s.id)}
                                  disabled={!isCurrentView}
                                  className="w-6 h-6 rounded-md flex items-center justify-center transition-all active:scale-90 disabled:opacity-40"
                                  style={s.done ? { background: "linear-gradient(135deg, #7c3aed, #ec4899)" } : { border: "2px solid rgba(124,58,237,0.3)", background: "transparent" }}>
                                  {s.done && (
                                    <svg width="11" height="8" viewBox="0 0 11 8" fill="none">
                                      <path d="M1 4L4 7L10 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                  )}
                                </button>
                              </div>
                            </div>
                          );
                        })}

                        {/* Payment footer */}
                        <div className="px-3 py-2.5"
                          style={{ borderTop: "1px solid rgba(139,92,246,0.15)", background: viewedCycle.paid ? "rgba(134,239,172,0.08)" : "rgba(124,58,237,0.03)" }}>
                          {viewedCycle.paid ? (
                            <span className="text-xs font-semibold" style={{ color: "#16a34a" }}>
                              PAYÉ LE : {formatDateFrShort(viewedCycle.datePaiement!)} — {viewedCycle.montantPaye ?? c.montant} {c.devise} ✅
                            </span>
                          ) : isCurrentView ? (
                            <button onClick={() => openPaymentDialog(c, viewedCycle)}
                              className="text-xs font-bold px-4 py-1.5 rounded-xl text-white w-full active:scale-95 transition-transform"
                              style={{ background: "linear-gradient(135deg, #7c3aed, #ec4899)" }}>
                              💰 Enregistrer le paiement
                            </button>
                          ) : (
                            <span className="text-xs" style={{ color: "#9ca3af" }}>Non payé</span>
                          )}
                        </div>
                      </div>

                      {/* Add séance button */}
                      {isCurrentView && (
                        <button
                          onClick={() => setAddSeanceDialog({ coursId: c.id, cycleId: viewedCycle.id, date: todayStr(), statut: "todo" })}
                          className="mt-2 text-xs font-bold px-3 py-2 rounded-xl w-full active:scale-95 transition-transform"
                          style={{ border: "1.5px dashed rgba(124,58,237,0.3)", color: "#7c3aed", background: "rgba(124,58,237,0.03)" }}>
                          + Ajouter une séance
                        </button>
                      )}

                      {/* Historique */}
                      <p className="text-xs font-bold mt-4 mb-2" style={{ color: "#6d28d9" }}>📋 Historique des cycles</p>
                      <div className="flex flex-col gap-1.5">
                        {c.cycles.map((cy, idx) => {
                          const cyDone = cy.seances.filter(s => s.done).length;
                          const isLast = idx === c.cycles.length - 1;
                          const cyOk = isCycleComplete(cy, c.seancesParCycle);
                          return (
                            <div key={cy.id} className="flex items-start gap-2">
                              <span className="text-sm shrink-0">{cyOk || !isLast ? "✅" : "🔄"}</span>
                              <span className="text-xs" style={{ color: cyOk ? "#16a34a" : "#6d28d9" }}>
                                Cycle {cy.numero}{isLast ? " (actuel)" : ""}
                                {cy.datePaiement ? ` — Payé le ${formatDateFrShort(cy.datePaiement)} — ${cy.montantPaye ?? c.montant} ${c.devise}` : ""}
                                {" — "}{cyDone}/{c.seancesParCycle} séances
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* ══ Add cours dialog ═══════════════════════════════════════════════ */}
      <Dialog open={addOpen} onOpenChange={o => { if (!o) setAddOpen(false); }}>
        <DialogContent className="rounded-3xl mx-4 max-w-sm max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle style={{ color: "#3b0764" }}>Nouveau cours particulier</DialogTitle></DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <Label style={{ color: "#3b0764" }}>Nom</Label>
              <Input className="rounded-2xl" placeholder="Ex: Cours Yasmine" value={form.nom}
                onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} />
            </div>
            <MatiereToggle matieres={form.matieres} onToggle={toggleMatiere} />
            <div className="flex gap-3">
              <div className="flex flex-col gap-1.5 flex-1">
                <Label style={{ color: "#3b0764" }}>Montant par cycle</Label>
                <Input className="rounded-2xl" type="number" placeholder="80" value={form.montant}
                  onChange={e => setForm(f => ({ ...f, montant: e.target.value }))} />
              </div>
              <div className="flex flex-col gap-1.5 w-24">
                <Label style={{ color: "#3b0764" }}>Devise</Label>
                <Select value={form.devise} onValueChange={v => setForm(f => ({ ...f, devise: v ?? f.devise }))}>
                  <SelectTrigger className="rounded-2xl"><SelectValue /></SelectTrigger>
                  <SelectContent>{DEVISES.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label style={{ color: "#3b0764" }}>Séances par cycle</Label>
              <Input className="rounded-2xl" type="number" placeholder="12" value={form.seancesParCycle}
                onChange={e => setForm(f => ({ ...f, seancesParCycle: e.target.value }))} />
            </div>
            <JoursToggle jours={form.jours} onToggle={toggleJour} />
            <div className="flex flex-col gap-1.5">
              <Label style={{ color: "#3b0764" }}>Date de début</Label>
              <Input className="rounded-2xl" type="date" value={form.dateDebut}
                onChange={e => setForm(f => ({ ...f, dateDebut: e.target.value }))} />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <button onClick={() => setAddOpen(false)} className="px-4 py-2 rounded-2xl font-semibold text-sm" style={{ color: "#7c3aed" }}>Annuler</button>
            <button onClick={handleAdd} disabled={!form.nom || !form.montant || form.jours.length === 0}
              className="px-5 py-2 rounded-2xl text-white font-bold text-sm disabled:opacity-40"
              style={{ background: "linear-gradient(135deg, #7c3aed, #ec4899)" }}>Créer</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══ Edit cours dialog ══════════════════════════════════════════════ */}
      <Dialog open={editOpen} onOpenChange={o => { if (!o) { setEditOpen(false); setEditingId(null); } }}>
        <DialogContent className="rounded-3xl mx-4 max-w-sm max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle style={{ color: "#3b0764" }}>Modifier le cours</DialogTitle></DialogHeader>
          <p className="text-xs px-1 pb-1" style={{ color: "#9ca3af" }}>Les séances à venir seront recalculées.</p>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <Label style={{ color: "#3b0764" }}>Nom</Label>
              <Input className="rounded-2xl" value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} />
            </div>
            <MatiereToggle matieres={form.matieres} onToggle={toggleMatiere} />
            <div className="flex gap-3">
              <div className="flex flex-col gap-1.5 flex-1">
                <Label style={{ color: "#3b0764" }}>Montant</Label>
                <Input className="rounded-2xl" type="number" value={form.montant} onChange={e => setForm(f => ({ ...f, montant: e.target.value }))} />
              </div>
              <div className="flex flex-col gap-1.5 w-24">
                <Label style={{ color: "#3b0764" }}>Devise</Label>
                <Select value={form.devise} onValueChange={v => setForm(f => ({ ...f, devise: v ?? f.devise }))}>
                  <SelectTrigger className="rounded-2xl"><SelectValue /></SelectTrigger>
                  <SelectContent>{DEVISES.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label style={{ color: "#3b0764" }}>Séances par cycle</Label>
              <Input className="rounded-2xl" type="number" value={form.seancesParCycle}
                onChange={e => setForm(f => ({ ...f, seancesParCycle: e.target.value }))} />
            </div>
            <JoursToggle jours={form.jours} onToggle={toggleJour} />
            <div className="flex flex-col gap-1.5">
              <Label style={{ color: "#3b0764" }}>Date de début</Label>
              <Input className="rounded-2xl" type="date" value={form.dateDebut}
                onChange={e => setForm(f => ({ ...f, dateDebut: e.target.value }))} />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <button onClick={() => { setEditOpen(false); setEditingId(null); }} className="px-4 py-2 rounded-2xl font-semibold text-sm" style={{ color: "#7c3aed" }}>Annuler</button>
            <button onClick={handleEdit} disabled={!form.nom || !form.montant || form.jours.length === 0}
              className="px-5 py-2 rounded-2xl text-white font-bold text-sm disabled:opacity-40"
              style={{ background: "linear-gradient(135deg, #7c3aed, #ec4899)" }}>Enregistrer</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══ Delete confirm ═════════════════════════════════════════════════ */}
      <Dialog open={deleteConfirmId !== null} onOpenChange={o => { if (!o) setDeleteConfirmId(null); }}>
        <DialogContent className="rounded-3xl mx-4 max-w-sm">
          <DialogHeader><DialogTitle style={{ color: "#3b0764" }}>Supprimer le cours ?</DialogTitle></DialogHeader>
          <p className="text-sm py-2" style={{ color: "#6d28d9" }}>Cette action est irréversible. Tout l&apos;historique sera perdu.</p>
          <DialogFooter className="gap-2">
            <button onClick={() => setDeleteConfirmId(null)} className="px-4 py-2 rounded-2xl font-semibold text-sm" style={{ color: "#7c3aed" }}>Annuler</button>
            <button onClick={() => { if (deleteConfirmId) handleDelete(deleteConfirmId); }}
              className="px-5 py-2 rounded-2xl text-white font-bold text-sm" style={{ background: "#dc2626" }}>Supprimer</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══ Payment dialog (existing cycle) ═══════════════════════════════ */}
      <Dialog open={paymentDialog !== null} onOpenChange={o => { if (!o) setPaymentDialog(null); }}>
        <DialogContent className="rounded-3xl mx-4 max-w-sm">
          <DialogHeader><DialogTitle style={{ color: "#3b0764" }}>💰 Enregistrer le paiement</DialogTitle></DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <Label style={{ color: "#3b0764" }}>Date du paiement</Label>
              <Input className="rounded-2xl" type="date" value={paymentDialog?.date ?? ""}
                onChange={e => { const v = e.target.value; setPaymentDialog(d => d ? { ...d, date: v } : d); }} />
            </div>
            <div className="flex gap-3 items-end">
              <div className="flex flex-col gap-1.5 flex-1">
                <Label style={{ color: "#3b0764" }}>Montant</Label>
                <Input className="rounded-2xl" type="number" value={paymentDialog?.montant ?? ""}
                  onChange={e => { const v = e.target.value; setPaymentDialog(d => d ? { ...d, montant: v } : d); }} />
              </div>
              <span className="pb-2 text-sm font-bold" style={{ color: "#6d28d9" }}>{paymentDialog?.devise ?? ""}</span>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label style={{ color: "#3b0764" }}>Prochaine date prévue <span className="font-normal text-xs" style={{ color: "#9ca3af" }}>(optionnel)</span></Label>
              <Input className="rounded-2xl" type="date" value={paymentDialog?.prochaineDate ?? ""}
                onChange={e => { const v = e.target.value; setPaymentDialog(d => d ? { ...d, prochaineDate: v } : d); }} />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <button onClick={() => setPaymentDialog(null)} className="px-4 py-2 rounded-2xl font-semibold text-sm" style={{ color: "#9ca3af" }}>Plus tard</button>
            <button onClick={confirmPayment} disabled={!paymentDialog?.date || !paymentDialog?.montant}
              className="px-5 py-2 rounded-2xl text-white font-bold text-sm disabled:opacity-40"
              style={{ background: "linear-gradient(135deg, #7c3aed, #ec4899)" }}>Confirmer</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══ New cycle dialog ════════════════════════════════════════════════ */}
      <Dialog open={newCycleDialog !== null} onOpenChange={o => { if (!o) setNewCycleDialog(null); }}>
        <DialogContent className="rounded-3xl mx-4 max-w-sm">
          <DialogHeader>
            <DialogTitle style={{ color: "#3b0764" }}>
              💰 Paiement — Cycle {newCycleDialog ? newCycleDialog.cycleNumero + 1 : ""}
            </DialogTitle>
          </DialogHeader>
          <p className="text-xs pb-1" style={{ color: "#9ca3af" }}>
            Enregistre le paiement du cycle {newCycleDialog?.cycleNumero} pour démarrer le suivant.
          </p>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <Label style={{ color: "#3b0764" }}>Date du paiement</Label>
              <Input className="rounded-2xl" type="date" value={newCycleDialog?.date ?? ""}
                onChange={e => { const v = e.target.value; setNewCycleDialog(d => d ? { ...d, date: v } : d); }} />
            </div>
            <div className="flex gap-3 items-end">
              <div className="flex flex-col gap-1.5 flex-1">
                <Label style={{ color: "#3b0764" }}>Montant</Label>
                <Input className="rounded-2xl" type="number" value={newCycleDialog?.montant ?? ""}
                  onChange={e => { const v = e.target.value; setNewCycleDialog(d => d ? { ...d, montant: v } : d); }} />
              </div>
              <span className="pb-2 text-sm font-bold" style={{ color: "#6d28d9" }}>{newCycleDialog?.devise ?? ""}</span>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label style={{ color: "#3b0764" }}>Prochaine date prévue <span className="font-normal text-xs" style={{ color: "#9ca3af" }}>(optionnel)</span></Label>
              <Input className="rounded-2xl" type="date" value={newCycleDialog?.prochaineDate ?? ""}
                onChange={e => { const v = e.target.value; setNewCycleDialog(d => d ? { ...d, prochaineDate: v } : d); }} />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <button onClick={() => setNewCycleDialog(null)} className="px-4 py-2 rounded-2xl font-semibold text-sm" style={{ color: "#9ca3af" }}>Annuler</button>
            <button onClick={confirmNewCycle} disabled={!newCycleDialog?.date || !newCycleDialog?.montant}
              className="px-5 py-2 rounded-2xl text-white font-bold text-sm disabled:opacity-40"
              style={{ background: "linear-gradient(135deg, #7c3aed, #ec4899)" }}>
              Confirmer et démarrer
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══ Add séance dialog ═══════════════════════════════════════════════ */}
      <Dialog open={addSeanceDialog !== null} onOpenChange={o => { if (!o) setAddSeanceDialog(null); }}>
        <DialogContent className="rounded-3xl mx-4 max-w-xs">
          <DialogHeader><DialogTitle style={{ color: "#3b0764" }}>+ Ajouter une séance</DialogTitle></DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <Label style={{ color: "#3b0764" }}>Date</Label>
              <Input className="rounded-2xl" type="date" value={addSeanceDialog?.date ?? ""}
                onChange={e => { const v = e.target.value; setAddSeanceDialog(d => d ? { ...d, date: v } : d); }} />
            </div>
            {addSeanceDialog?.date && (
              <p className="text-xs font-semibold" style={{ color: "#7c3aed" }}>
                Jour : {dateToJour(addSeanceDialog.date)}
              </p>
            )}
            <div className="flex flex-col gap-1.5">
              <Label style={{ color: "#3b0764" }}>Statut</Label>
              <Select value={addSeanceDialog?.statut ?? "todo"}
                onValueChange={v => setAddSeanceDialog(d => d ? { ...d, statut: v as "todo" | "done" } : d)}>
                <SelectTrigger className="rounded-2xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">À faire</SelectItem>
                  <SelectItem value="done">Déjà effectuée</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <button onClick={() => setAddSeanceDialog(null)} className="px-4 py-2 rounded-2xl font-semibold text-sm" style={{ color: "#7c3aed" }}>Annuler</button>
            <button onClick={addSeance} disabled={!addSeanceDialog?.date}
              className="px-5 py-2 rounded-2xl text-white font-bold text-sm disabled:opacity-40"
              style={{ background: "linear-gradient(135deg, #7c3aed, #ec4899)" }}>Ajouter</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══ Edit séance dialog ═════════════════════════════════════════════ */}
      <Dialog open={editSeanceDialog !== null} onOpenChange={o => { if (!o) setEditSeanceDialog(null); }}>
        <DialogContent className="rounded-3xl mx-4 max-w-xs">
          <DialogHeader><DialogTitle style={{ color: "#3b0764" }}>✏️ Modifier la séance</DialogTitle></DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <Label style={{ color: "#3b0764" }}>Date</Label>
              <Input className="rounded-2xl" type="date" value={editSeanceDialog?.date ?? ""}
                onChange={e => { const v = e.target.value; setEditSeanceDialog(d => d ? { ...d, date: v } : d); }} />
            </div>
            {editSeanceDialog?.date && (
              <p className="text-xs font-semibold" style={{ color: "#7c3aed" }}>
                Jour : {new Date(editSeanceDialog.date + "T12:00:00").toLocaleDateString("fr-FR", { weekday: "long" }).toUpperCase()}
              </p>
            )}
            {(() => {
              const c = cours.find(co => co.id === editSeanceDialog?.coursId);
              if (!c || c.matieres.length <= 1) return null;
              return (
                <div className="flex flex-col gap-1.5">
                  <Label style={{ color: "#3b0764" }}>Matière <span className="font-normal text-xs" style={{ color: "#9ca3af" }}>(optionnel)</span></Label>
                  <Select value={editSeanceDialog?.matiere ?? ""} onValueChange={v => setEditSeanceDialog(d => d ? { ...d, matiere: v ?? "" } : d)}>
                    <SelectTrigger className="rounded-2xl"><SelectValue placeholder="— Choisir —" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">— Aucune —</SelectItem>
                      {c.matieres.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              );
            })()}
          </div>
          <DialogFooter className="gap-2">
            <button onClick={() => setEditSeanceDialog(null)} className="px-4 py-2 rounded-2xl font-semibold text-sm" style={{ color: "#7c3aed" }}>Annuler</button>
            <button onClick={confirmEditSeance} disabled={!editSeanceDialog?.date}
              className="px-5 py-2 rounded-2xl text-white font-bold text-sm disabled:opacity-40"
              style={{ background: "linear-gradient(135deg, #7c3aed, #ec4899)" }}>Sauvegarder</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══ Delete séance confirm ══════════════════════════════════════════ */}
      <Dialog open={deleteSeanceDialog !== null} onOpenChange={o => { if (!o) setDeleteSeanceDialog(null); }}>
        <DialogContent className="rounded-3xl mx-4 max-w-sm">
          <DialogHeader><DialogTitle style={{ color: "#3b0764" }}>Supprimer la séance ?</DialogTitle></DialogHeader>
          <p className="text-sm py-2" style={{ color: "#6d28d9" }}>
            Supprimer la séance {deleteSeanceDialog?.numero} ? Une nouvelle date sera générée si nécessaire.
          </p>
          <DialogFooter className="gap-2">
            <button onClick={() => setDeleteSeanceDialog(null)} className="px-4 py-2 rounded-2xl font-semibold text-sm" style={{ color: "#7c3aed" }}>Annuler</button>
            <button onClick={deleteSeance}
              className="px-5 py-2 rounded-2xl text-white font-bold text-sm" style={{ background: "#dc2626" }}>Supprimer</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══ Edit date dialog ════════════════════════════════════════════════ */}
      <Dialog open={editDateDialog !== null} onOpenChange={o => { if (!o) setEditDateDialog(null); }}>
        <DialogContent className="rounded-3xl mx-4 max-w-xs">
          <DialogHeader><DialogTitle style={{ color: "#3b0764" }}>Modifier la date</DialogTitle></DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <Label style={{ color: "#3b0764" }}>Date</Label>
              <Input className="rounded-2xl" type="date" value={editDateDialog?.date ?? ""}
                onChange={e => { const v = e.target.value; setEditDateDialog(d => d ? { ...d, date: v } : d); }} />
            </div>
            {editDateDialog?.date && (
              <p className="text-xs font-semibold" style={{ color: "#7c3aed" }}>
                Jour : {dateToJour(editDateDialog.date)}
              </p>
            )}
          </div>
          <DialogFooter className="gap-2">
            <button onClick={() => setEditDateDialog(null)} className="px-4 py-2 rounded-2xl font-semibold text-sm" style={{ color: "#7c3aed" }}>Annuler</button>
            <button onClick={confirmEditDate} disabled={!editDateDialog?.date}
              className="px-5 py-2 rounded-2xl text-white font-bold text-sm disabled:opacity-40"
              style={{ background: "linear-gradient(135deg, #7c3aed, #ec4899)" }}>Enregistrer</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
