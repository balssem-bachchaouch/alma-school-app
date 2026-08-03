"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CoursParticulier, CoursCycle } from "@/lib/types";
import { getCours, saveCours } from "@/lib/storage";
import {
  generateSeances,
  updateCycleSeances,
  isCycleComplete,
  formatDateFr,
  formatDateFrShort,
} from "@/lib/coursUtils";

// ── Constants ──────────────────────────────────────────────────────────────

const MATIERES_OPTIONS = [
  "Mathématiques", "Français", "Arabe", "Anglais", "Sciences", "Autre",
];
const DEVISES = ["DT", "€", "$"];
const JOURS_SHORT = ["LUN", "MAR", "MER", "JEU", "VEN", "SAM", "DIM"];
const JOURS_FULL = ["LUNDI", "MARDI", "MERCREDI", "JEUDI", "VENDREDI", "SAMEDI", "DIMANCHE"];

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

function createFirstCycle(
  seancesParCycle: number,
  jours: number[],
  dateDebut: string
): CoursCycle {
  return {
    id: crypto.randomUUID(),
    numero: 1,
    seances: generateSeances(jours, seancesParCycle, dateDebut),
    paid: false,
  };
}

// ── Form types ─────────────────────────────────────────────────────────────

type FormState = {
  nom: string;
  matieres: string[];
  montant: string;
  devise: string;
  seancesParCycle: string;
  jours: number[];
  dateDebut: string;
};

const DEFAULT_FORM: FormState = {
  nom: "",
  matieres: ["Mathématiques"],
  montant: "",
  devise: "DT",
  seancesParCycle: "12",
  jours: [],
  dateDebut: todayStr(),
};

type PaymentDialogState = {
  coursId: string;
  cycleId: string;
  montant: string;
  devise: string;
  date: string;
  prochaineDate: string;
};

// ── Sub-components ─────────────────────────────────────────────────────────

function JoursToggle({
  jours,
  onToggle,
}: {
  jours: number[];
  onToggle: (idx: number) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label style={{ color: "#3b0764" }}>Jours du cours</Label>
      <div className="flex gap-1.5 flex-wrap">
        {JOURS_SHORT.map((label, idx) => {
          const selected = jours.includes(idx);
          return (
            <button
              key={idx}
              type="button"
              onClick={() => onToggle(idx)}
              className="px-2.5 py-1 rounded-xl text-xs font-bold transition-all active:scale-90"
              style={
                selected
                  ? { background: "linear-gradient(135deg, #7c3aed, #ec4899)", color: "#fff" }
                  : {
                      background: "rgba(124,58,237,0.08)",
                      color: "#6d28d9",
                      border: "1px solid rgba(124,58,237,0.2)",
                    }
              }
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function MatiereToggle({
  matieres,
  onToggle,
}: {
  matieres: string[];
  onToggle: (m: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label style={{ color: "#3b0764" }}>Matières</Label>
      <div className="flex gap-1.5 flex-wrap">
        {MATIERES_OPTIONS.map((m) => {
          const selected = matieres.includes(m);
          return (
            <button
              key={m}
              type="button"
              onClick={() => onToggle(m)}
              className="px-2.5 py-1 rounded-xl text-xs font-bold transition-all active:scale-90"
              style={
                selected
                  ? { background: "linear-gradient(135deg, #7c3aed, #ec4899)", color: "#fff" }
                  : {
                      background: "rgba(124,58,237,0.08)",
                      color: "#6d28d9",
                      border: "1px solid rgba(124,58,237,0.2)",
                    }
              }
            >
              {m}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function CoursPage() {
  const [cours, setCours] = useState<CoursParticulier[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Dialogs
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [paymentDialog, setPaymentDialog] = useState<PaymentDialogState | null>(null);

  const [form, setForm] = useState<FormState>(DEFAULT_FORM);

  useEffect(() => {
    // Migrate old schema (matiere: string → matieres: string[], missing jours/dateDebut, etc.)
    const raw = getCours() as any[]; // eslint-disable-line @typescript-eslint/no-explicit-any
    const migrated: CoursParticulier[] = raw.map((c) => ({
      ...c,
      matieres: Array.isArray(c.matieres)
        ? c.matieres
        : typeof c.matiere === "string"
        ? [c.matiere]
        : ["Autre"],
      jours: Array.isArray(c.jours) ? c.jours : [],
      dateDebut: typeof c.dateDebut === "string" ? c.dateDebut : todayStr(),
      cycles: (Array.isArray(c.cycles) ? c.cycles : []).map(
        (cy: any, cyIdx: number) => ({ // eslint-disable-line @typescript-eslint/no-explicit-any
          ...cy,
          numero: typeof cy.numero === "number" ? cy.numero : cyIdx + 1,
          seances: (Array.isArray(cy.seances) ? cy.seances : []).map(
            (s: any, si: number) => ({ // eslint-disable-line @typescript-eslint/no-explicit-any
              ...s,
              numero: typeof s.numero === "number" ? s.numero : si + 1,
              jour: typeof s.jour === "string" ? s.jour : "",
              datePrevu:
                typeof s.datePrevu === "string"
                  ? s.datePrevu
                  : typeof s.date === "string"
                  ? s.date
                  : todayStr(),
            })
          ),
        })
      ),
    }));
    setCours(migrated);
    saveCours(migrated);
    setLoaded(true);
  }, []);

  const save = (next: CoursParticulier[]) => {
    setCours(next);
    saveCours(next);
  };

  const toggleJour = (idx: number) =>
    setForm((f) => ({
      ...f,
      jours: f.jours.includes(idx) ? f.jours.filter((j) => j !== idx) : [...f.jours, idx],
    }));

  const toggleMatiere = (m: string) =>
    setForm((f) => ({
      ...f,
      matieres: f.matieres.includes(m)
        ? f.matieres.filter((x) => x !== m)
        : [...f.matieres, m],
    }));

  // ── CRUD ────────────────────────────────────────────────────────────────

  const handleAdd = () => {
    if (!form.nom || !form.montant || form.jours.length === 0) return;
    const seancesN = Math.max(1, parseInt(form.seancesParCycle) || 12);
    const newCours: CoursParticulier = {
      id: crypto.randomUUID(),
      nom: form.nom,
      matieres: form.matieres.length > 0 ? form.matieres : ["Autre"],
      montant: parseFloat(form.montant),
      devise: form.devise,
      seancesParCycle: seancesN,
      jours: [...form.jours].sort((a, b) => a - b),
      dateDebut: form.dateDebut || todayStr(),
      cycles: [createFirstCycle(seancesN, form.jours, form.dateDebut || todayStr())],
    };
    save([...cours, newCours]);
    setForm(DEFAULT_FORM);
    setAddOpen(false);
  };

  const openEdit = (c: CoursParticulier) => {
    setEditingId(c.id);
    setForm({
      nom: c.nom,
      matieres: c.matieres,
      montant: String(c.montant),
      devise: c.devise,
      seancesParCycle: String(c.seancesParCycle),
      jours: c.jours,
      dateDebut: c.dateDebut,
    });
    setEditOpen(true);
  };

  const handleEdit = () => {
    if (!editingId || !form.nom || !form.montant || form.jours.length === 0) return;
    save(
      cours.map((c) => {
        if (c.id !== editingId) return c;
        const newJours = [...form.jours].sort((a, b) => a - b);
        const newSeancesPerCycle = Math.max(1, parseInt(form.seancesParCycle) || 12);

        // Keep done séances, regenerate undone from after the last done séance
        const currentCycle = c.cycles[c.cycles.length - 1];
        const doneSeances = currentCycle.seances.filter((s) => s.done);
        const lastDoneDate =
          doneSeances.length > 0
            ? doneSeances[doneSeances.length - 1].datePrevu
            : (form.dateDebut || c.dateDebut);

        const needed = newSeancesPerCycle - doneSeances.length;
        let updatedCycle: CoursCycle;
        if (needed > 0) {
          const nextDay = new Date(lastDoneDate + "T12:00:00");
          if (doneSeances.length > 0) nextDay.setDate(nextDay.getDate() + 1);
          const regen = generateSeances(
            newJours,
            needed,
            nextDay.toISOString().split("T")[0],
            doneSeances.length + 1
          );
          updatedCycle = { ...currentCycle, seances: [...doneSeances, ...regen] };
        } else {
          updatedCycle = { ...currentCycle, seances: doneSeances };
        }

        return {
          ...c,
          nom: form.nom,
          matieres: form.matieres.length > 0 ? form.matieres : c.matieres,
          montant: parseFloat(form.montant),
          devise: form.devise,
          seancesParCycle: newSeancesPerCycle,
          jours: newJours,
          dateDebut: form.dateDebut || c.dateDebut,
          cycles: [...c.cycles.slice(0, -1), updatedCycle],
        };
      })
    );
    setEditOpen(false);
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    save(cours.filter((c) => c.id !== id));
    setDeleteConfirmId(null);
    if (expandedId === id) setExpandedId(null);
  };

  // ── Séance toggle ────────────────────────────────────────────────────────

  const toggleSeance = (coursId: string, cycleId: string, seanceId: string) => {
    save(
      cours.map((c) => {
        if (c.id !== coursId) return c;
        return {
          ...c,
          cycles: c.cycles.map((cy) => {
            if (cy.id !== cycleId) return cy;
            const toggled = {
              ...cy,
              seances: cy.seances.map((s) =>
                s.id === seanceId ? { ...s, done: !s.done } : s
              ),
            };
            // Unchecking: ensure enough undone séances remain in the cycle
            const wasUnchecked = toggled.seances.find((s) => s.id === seanceId)?.done === false;
            return wasUnchecked ? updateCycleSeances(toggled, c) : toggled;
          }),
        };
      })
    );
  };

  // ── New cycle ────────────────────────────────────────────────────────────

  const startNewCycle = (coursId: string) => {
    save(
      cours.map((c) => {
        if (c.id !== coursId) return c;
        const lastDate = c.cycles[c.cycles.length - 1].seances.at(-1)?.datePrevu ?? todayStr();
        const nextDay = new Date(lastDate + "T12:00:00");
        nextDay.setDate(nextDay.getDate() + 1);
        const newCycle: CoursCycle = {
          id: crypto.randomUUID(),
          numero: c.cycles.length + 1,
          seances: generateSeances(
            c.jours,
            c.seancesParCycle,
            nextDay.toISOString().split("T")[0]
          ),
          paid: false,
        };
        return { ...c, cycles: [...c.cycles, newCycle] };
      })
    );
  };

  // ── Payment ──────────────────────────────────────────────────────────────

  const openPaymentDialog = (c: CoursParticulier, cy: CoursCycle) => {
    setPaymentDialog({
      coursId: c.id,
      cycleId: cy.id,
      montant: String(c.montant),
      devise: c.devise,
      date: todayStr(),
      prochaineDate: "",
    });
  };

  const confirmPayment = () => {
    if (!paymentDialog) return;
    const { coursId, cycleId, montant, date, prochaineDate } = paymentDialog;
    save(
      cours.map((c) => {
        if (c.id !== coursId) return c;
        return {
          ...c,
          cycles: c.cycles.map((cy) => {
            if (cy.id !== cycleId) return cy;
            return {
              ...cy,
              paid: true,
              datePaiement: date,
              montantPaye: parseFloat(montant) || c.montant,
              ...(prochaineDate ? { prochaineDate } : {}),
            };
          }),
        };
      })
    );
    setPaymentDialog(null);
  };

  if (!loaded) return null;

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="px-4 pt-8 pb-28 max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-extrabold" style={{ color: "#3b0764" }}>
          🎓 Cours Particuliers
        </h1>
        <button
          onClick={() => { setForm({ ...DEFAULT_FORM, dateDebut: todayStr() }); setAddOpen(true); }}
          className="flex items-center gap-1.5 text-white px-4 py-2 rounded-2xl text-sm font-bold shadow-sm active:scale-95 transition-transform"
          style={{ background: "linear-gradient(135deg, #7c3aed, #ec4899)" }}
        >
          <Plus size={16} />
          Ajouter
        </button>
      </div>
      <p className="text-sm mb-6" style={{ color: "#6d28d9" }}>
        {cours.length === 0
          ? "Aucun cours particulier"
          : `${cours.length} cours suivi${cours.length > 1 ? "s" : ""}`}
      </p>

      {/* Empty state */}
      {cours.length === 0 && (
        <div
          className="rounded-3xl p-8 text-center"
          style={{
            background: "#ffffff",
            border: "1px solid rgba(139,92,246,0.2)",
            boxShadow: "0 2px 12px rgba(124,58,237,0.08)",
          }}
        >
          <div className="text-4xl mb-3">📚</div>
          <p className="font-semibold text-base mb-1" style={{ color: "#3b0764" }}>
            Aucun cours particulier
          </p>
          <p className="text-sm" style={{ color: "#6d28d9" }}>
            Ajoute un cours pour suivre les séances et paiements
          </p>
        </div>
      )}

      {/* Cours list */}
      <div className="flex flex-col gap-4">
        {cours.map((c) => {
          const currentCycle = c.cycles[c.cycles.length - 1];
          const doneCount = currentCycle.seances.filter((s) => s.done).length;
          const total = c.seancesParCycle;
          const pct = Math.min(100, Math.round((doneCount / total) * 100));
          const complete = isCycleComplete(currentCycle, total);
          const nearEnd = !complete && doneCount >= total - 2;
          const isExpanded = expandedId === c.id;

          return (
            <div
              key={c.id}
              className="rounded-2xl overflow-hidden"
              style={{
                background: "#ffffff",
                border: "1px solid rgba(139,92,246,0.15)",
                boxShadow: "0 2px 10px rgba(124,58,237,0.07)",
              }}
            >
              {/* ── Banners ── */}
              {complete && !currentCycle.paid && (
                <div
                  className="px-4 py-2.5 flex items-center justify-between gap-2"
                  style={{
                    background: "rgba(239,68,68,0.07)",
                    borderBottom: "1px solid rgba(239,68,68,0.18)",
                  }}
                >
                  <span className="text-xs font-bold" style={{ color: "#dc2626" }}>
                    🔔 Paiement dû — {c.montant} {c.devise} !
                  </span>
                  <button
                    onClick={() => startNewCycle(c.id)}
                    className="shrink-0 text-xs font-bold px-3 py-1 rounded-xl text-white active:scale-95 transition-transform"
                    style={{ background: "#dc2626" }}
                  >
                    Nouveau cycle
                  </button>
                </div>
              )}
              {nearEnd && (
                <div
                  className="px-4 py-1.5"
                  style={{
                    background: "rgba(245,158,11,0.07)",
                    borderBottom: "1px solid rgba(245,158,11,0.18)",
                  }}
                >
                  <span className="text-xs font-bold" style={{ color: "#d97706" }}>
                    ⚠️ Plus que {total - doneCount} séance{total - doneCount > 1 ? "s" : ""} !
                  </span>
                </div>
              )}

              {/* ── Card body ── */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0 pr-2">
                    {/* Nom + matières */}
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h2 className="font-extrabold text-base leading-tight" style={{ color: "#3b0764" }}>
                        {c.nom}
                      </h2>
                      {c.matieres.map((m) => (
                        <span
                          key={m}
                          className="text-xs font-semibold px-2 py-0.5 rounded-full"
                          style={{ background: "rgba(124,58,237,0.1)", color: "#7c3aed" }}
                        >
                          {m}
                        </span>
                      ))}
                    </div>
                    {/* Days */}
                    <p className="text-xs font-medium mb-2" style={{ color: "#7c3aed" }}>
                      📅 {c.jours.map((j) => JOURS_FULL[j]).join(" · ")}
                    </p>
                    {/* Cycle progress */}
                    <div className="text-xs font-semibold mb-1.5" style={{ color: "#6d28d9" }}>
                      Cycle {currentCycle.numero} — {doneCount}/{total} effectuées
                    </div>
                    <div
                      className="h-2 rounded-full overflow-hidden mb-2"
                      style={{ background: "rgba(124,58,237,0.1)" }}
                    >
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: "linear-gradient(90deg, #7c3aed, #ec4899)" }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.4 }}
                      />
                    </div>
                    {/* Payment row */}
                    {currentCycle.paid ? (
                      <p className="text-xs font-semibold" style={{ color: "#16a34a" }}>
                        💰 PAYÉ LE : {formatDateFrShort(currentCycle.datePaiement!)} —{" "}
                        {currentCycle.montantPaye ?? c.montant} {c.devise}
                      </p>
                    ) : doneCount > 0 ? (
                      <button
                        onClick={() => openPaymentDialog(c, currentCycle)}
                        className="text-xs font-bold px-3 py-1 rounded-xl text-white active:scale-95 transition-transform"
                        style={{ background: "linear-gradient(135deg, #7c3aed, #ec4899)" }}
                      >
                        💰 Enregistrer le paiement
                      </button>
                    ) : null}
                  </div>
                  {/* Actions */}
                  <div className="flex items-center gap-0.5 shrink-0">
                    <button
                      onClick={() => openEdit(c)}
                      className="p-1.5 rounded-xl active:scale-90 transition-transform"
                      style={{ color: "#7c3aed" }}
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(c.id)}
                      className="p-1.5 rounded-xl active:scale-90 transition-transform text-red-500"
                    >
                      <Trash2 size={15} />
                    </button>
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : c.id)}
                      className="p-1.5 rounded-xl active:scale-90 transition-transform"
                      style={{ color: "#7c3aed" }}
                    >
                      <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronDown size={18} />
                      </motion.div>
                    </button>
                  </div>
                </div>
              </div>

              {/* ── Expanded ── */}
              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    key="exp"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22, ease: "easeInOut" }}
                    style={{ overflow: "hidden" }}
                  >
                    <div
                      className="px-4 pb-4"
                      style={{ borderTop: "1px solid rgba(139,92,246,0.1)" }}
                    >
                      {/* Table header */}
                      <p className="text-xs font-bold mt-3 mb-2" style={{ color: "#6d28d9" }}>
                        📅 Séances — Cycle {currentCycle.numero}
                      </p>

                      {/* Séances table */}
                      <div
                        className="rounded-xl overflow-hidden"
                        style={{ border: "1px solid rgba(139,92,246,0.15)" }}
                      >
                        {/* Table head */}
                        <div
                          className="grid text-xs font-bold px-3 py-2"
                          style={{
                            gridTemplateColumns: "2rem 5rem 1fr 3rem",
                            background: "rgba(124,58,237,0.06)",
                            color: "#6d28d9",
                            borderBottom: "1px solid rgba(139,92,246,0.15)",
                          }}
                        >
                          <span>N°</span>
                          <span>JOUR</span>
                          <span>DATE</span>
                          <span className="text-right">✓</span>
                        </div>

                        {/* Rows */}
                        {currentCycle.seances.map((s, rowIdx) => {
                          const isExtra = rowIdx >= c.seancesParCycle;
                          return (
                            <div
                              key={s.id}
                              className="grid items-center px-3 py-2 text-xs"
                              style={{
                                gridTemplateColumns: "2rem 5rem 1fr 3rem",
                                background: s.done
                                  ? "rgba(134,239,172,0.08)"
                                  : isExtra
                                  ? "rgba(124,58,237,0.03)"
                                  : "#ffffff",
                                borderTop:
                                  rowIdx > 0 ? "1px solid rgba(139,92,246,0.08)" : undefined,
                                borderLeft:
                                  isExtra && !s.done
                                    ? "3px solid rgba(124,58,237,0.3)"
                                    : undefined,
                              }}
                            >
                              <span
                                className="font-bold"
                                style={{ color: s.done ? "#16a34a" : "#3b0764" }}
                              >
                                {s.numero}
                              </span>
                              <span
                                className="font-semibold uppercase"
                                style={{ color: s.done ? "#16a34a" : "#3b0764" }}
                              >
                                {s.jour}
                              </span>
                              <span
                                style={{
                                  color: s.done ? "#6b7280" : "#3b0764",
                                  textDecoration: s.done ? "line-through" : "none",
                                }}
                              >
                                {formatDateFr(s.datePrevu)}
                              </span>
                              <div className="flex justify-end">
                                <button
                                  onClick={() => toggleSeance(c.id, currentCycle.id, s.id)}
                                  className="w-6 h-6 rounded-md flex items-center justify-center transition-all active:scale-90"
                                  style={
                                    s.done
                                      ? {
                                          background:
                                            "linear-gradient(135deg, #7c3aed, #ec4899)",
                                        }
                                      : {
                                          border: "2px solid rgba(124,58,237,0.3)",
                                          background: "transparent",
                                        }
                                  }
                                >
                                  {s.done && (
                                    <svg width="11" height="8" viewBox="0 0 11 8" fill="none">
                                      <path
                                        d="M1 4L4 7L10 1"
                                        stroke="white"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      />
                                    </svg>
                                  )}
                                </button>
                              </div>
                            </div>
                          );
                        })}

                        {/* Payment footer row */}
                        <div
                          className="px-3 py-2.5 flex items-center justify-between"
                          style={{
                            borderTop: "1px solid rgba(139,92,246,0.15)",
                            background: currentCycle.paid
                              ? "rgba(134,239,172,0.08)"
                              : "rgba(124,58,237,0.03)",
                          }}
                        >
                          {currentCycle.paid ? (
                            <span className="text-xs font-semibold" style={{ color: "#16a34a" }}>
                              PAYÉ LE : {formatDateFrShort(currentCycle.datePaiement!)} —{" "}
                              {currentCycle.montantPaye ?? c.montant} {c.devise} ✅
                            </span>
                          ) : (
                            <button
                              onClick={() => openPaymentDialog(c, currentCycle)}
                              className="text-xs font-bold px-4 py-1.5 rounded-xl text-white w-full active:scale-95 transition-transform"
                              style={{ background: "linear-gradient(135deg, #7c3aed, #ec4899)" }}
                            >
                              💰 Enregistrer le paiement
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Historique */}
                      <p className="text-xs font-bold mt-4 mb-2" style={{ color: "#6d28d9" }}>
                        📋 Historique des cycles
                      </p>
                      <div className="flex flex-col gap-1.5">
                        {c.cycles.map((cy, idx) => {
                          const cyDone = cy.seances.filter((s) => s.done).length;
                          const isLast = idx === c.cycles.length - 1;
                          const cyComplete = isCycleComplete(cy, c.seancesParCycle);
                          return (
                            <div key={cy.id} className="flex items-start gap-2">
                              <span className="text-sm shrink-0">
                                {cyComplete || !isLast ? "✅" : "🔄"}
                              </span>
                              <span
                                className="text-xs"
                                style={{ color: cyComplete ? "#16a34a" : "#6d28d9" }}
                              >
                                Cycle {cy.numero}
                                {isLast ? " (actuel)" : ""}
                                {cy.datePaiement
                                  ? ` — Payé le ${formatDateFrShort(cy.datePaiement)} — ${cy.montantPaye ?? c.montant} ${c.devise}`
                                  : ""}
                                {" — "}
                                {cyDone}/{c.seancesParCycle} séances
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

      {/* ══ Add Dialog ═════════════════════════════════════════════════════ */}
      <Dialog open={addOpen} onOpenChange={(o) => { if (!o) setAddOpen(false); }}>
        <DialogContent className="rounded-3xl mx-4 max-w-sm max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle style={{ color: "#3b0764" }}>Nouveau cours particulier</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <Label style={{ color: "#3b0764" }}>Nom</Label>
              <Input
                className="rounded-2xl"
                placeholder="Ex: Cours Yasmine"
                value={form.nom}
                onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))}
              />
            </div>
            <MatiereToggle matieres={form.matieres} onToggle={toggleMatiere} />
            <div className="flex gap-3">
              <div className="flex flex-col gap-1.5 flex-1">
                <Label style={{ color: "#3b0764" }}>Montant par cycle</Label>
                <Input
                  className="rounded-2xl"
                  type="number"
                  placeholder="80"
                  value={form.montant}
                  onChange={(e) => setForm((f) => ({ ...f, montant: e.target.value }))}
                />
              </div>
              <div className="flex flex-col gap-1.5 w-24">
                <Label style={{ color: "#3b0764" }}>Devise</Label>
                <Select
                  value={form.devise}
                  onValueChange={(v) => setForm((f) => ({ ...f, devise: v ?? f.devise }))}
                >
                  <SelectTrigger className="rounded-2xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DEVISES.map((d) => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label style={{ color: "#3b0764" }}>Séances par cycle</Label>
              <Input
                className="rounded-2xl"
                type="number"
                placeholder="12"
                value={form.seancesParCycle}
                onChange={(e) => setForm((f) => ({ ...f, seancesParCycle: e.target.value }))}
              />
            </div>
            <JoursToggle jours={form.jours} onToggle={toggleJour} />
            <div className="flex flex-col gap-1.5">
              <Label style={{ color: "#3b0764" }}>Date de début</Label>
              <Input
                className="rounded-2xl"
                type="date"
                value={form.dateDebut}
                onChange={(e) => setForm((f) => ({ ...f, dateDebut: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <button
              onClick={() => setAddOpen(false)}
              className="px-4 py-2 rounded-2xl font-semibold text-sm"
              style={{ color: "#7c3aed" }}
            >
              Annuler
            </button>
            <button
              onClick={handleAdd}
              disabled={!form.nom || !form.montant || form.jours.length === 0}
              className="px-5 py-2 rounded-2xl text-white font-bold text-sm disabled:opacity-40"
              style={{ background: "linear-gradient(135deg, #7c3aed, #ec4899)" }}
            >
              Créer
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══ Edit Dialog ════════════════════════════════════════════════════ */}
      <Dialog
        open={editOpen}
        onOpenChange={(o) => { if (!o) { setEditOpen(false); setEditingId(null); } }}
      >
        <DialogContent className="rounded-3xl mx-4 max-w-sm max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle style={{ color: "#3b0764" }}>Modifier le cours</DialogTitle>
          </DialogHeader>
          <p className="text-xs px-1 pb-1" style={{ color: "#9ca3af" }}>
            Les séances à venir seront recalculées.
          </p>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <Label style={{ color: "#3b0764" }}>Nom</Label>
              <Input
                className="rounded-2xl"
                value={form.nom}
                onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))}
              />
            </div>
            <MatiereToggle matieres={form.matieres} onToggle={toggleMatiere} />
            <div className="flex gap-3">
              <div className="flex flex-col gap-1.5 flex-1">
                <Label style={{ color: "#3b0764" }}>Montant</Label>
                <Input
                  className="rounded-2xl"
                  type="number"
                  value={form.montant}
                  onChange={(e) => setForm((f) => ({ ...f, montant: e.target.value }))}
                />
              </div>
              <div className="flex flex-col gap-1.5 w-24">
                <Label style={{ color: "#3b0764" }}>Devise</Label>
                <Select
                  value={form.devise}
                  onValueChange={(v) => setForm((f) => ({ ...f, devise: v ?? f.devise }))}
                >
                  <SelectTrigger className="rounded-2xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DEVISES.map((d) => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label style={{ color: "#3b0764" }}>Séances par cycle</Label>
              <Input
                className="rounded-2xl"
                type="number"
                value={form.seancesParCycle}
                onChange={(e) => setForm((f) => ({ ...f, seancesParCycle: e.target.value }))}
              />
            </div>
            <JoursToggle jours={form.jours} onToggle={toggleJour} />
            <div className="flex flex-col gap-1.5">
              <Label style={{ color: "#3b0764" }}>Date de début</Label>
              <Input
                className="rounded-2xl"
                type="date"
                value={form.dateDebut}
                onChange={(e) => setForm((f) => ({ ...f, dateDebut: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <button
              onClick={() => { setEditOpen(false); setEditingId(null); }}
              className="px-4 py-2 rounded-2xl font-semibold text-sm"
              style={{ color: "#7c3aed" }}
            >
              Annuler
            </button>
            <button
              onClick={handleEdit}
              disabled={!form.nom || !form.montant || form.jours.length === 0}
              className="px-5 py-2 rounded-2xl text-white font-bold text-sm disabled:opacity-40"
              style={{ background: "linear-gradient(135deg, #7c3aed, #ec4899)" }}
            >
              Enregistrer
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══ Delete confirm ════════════════════════════════════════════════ */}
      <Dialog
        open={deleteConfirmId !== null}
        onOpenChange={(o) => { if (!o) setDeleteConfirmId(null); }}
      >
        <DialogContent className="rounded-3xl mx-4 max-w-sm">
          <DialogHeader>
            <DialogTitle style={{ color: "#3b0764" }}>Supprimer le cours ?</DialogTitle>
          </DialogHeader>
          <p className="text-sm py-2" style={{ color: "#6d28d9" }}>
            Cette action est irréversible. Tout l&apos;historique sera perdu.
          </p>
          <DialogFooter className="gap-2">
            <button
              onClick={() => setDeleteConfirmId(null)}
              className="px-4 py-2 rounded-2xl font-semibold text-sm"
              style={{ color: "#7c3aed" }}
            >
              Annuler
            </button>
            <button
              onClick={() => { if (deleteConfirmId) handleDelete(deleteConfirmId); }}
              className="px-5 py-2 rounded-2xl text-white font-bold text-sm"
              style={{ background: "#dc2626" }}
            >
              Supprimer
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══ Payment dialog ════════════════════════════════════════════════ */}
      <Dialog
        open={paymentDialog !== null}
        onOpenChange={(o) => { if (!o) setPaymentDialog(null); }}
      >
        <DialogContent className="rounded-3xl mx-4 max-w-sm">
          <DialogHeader>
            <DialogTitle style={{ color: "#3b0764" }}>💰 Enregistrer le paiement</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <Label style={{ color: "#3b0764" }}>Date du paiement</Label>
              <Input
                className="rounded-2xl"
                type="date"
                value={paymentDialog?.date ?? ""}
                onChange={(e) => {
                  const v = e.target.value;
                  setPaymentDialog((d) => (d ? { ...d, date: v } : d));
                }}
              />
            </div>
            <div className="flex gap-3 items-end">
              <div className="flex flex-col gap-1.5 flex-1">
                <Label style={{ color: "#3b0764" }}>Montant</Label>
                <Input
                  className="rounded-2xl"
                  type="number"
                  value={paymentDialog?.montant ?? ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    setPaymentDialog((d) => (d ? { ...d, montant: v } : d));
                  }}
                />
              </div>
              <span className="pb-2 text-sm font-bold" style={{ color: "#6d28d9" }}>
                {paymentDialog?.devise ?? ""}
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label style={{ color: "#3b0764" }}>
                Prochaine date prévue{" "}
                <span className="font-normal text-xs" style={{ color: "#9ca3af" }}>
                  (optionnel)
                </span>
              </Label>
              <Input
                className="rounded-2xl"
                type="date"
                value={paymentDialog?.prochaineDate ?? ""}
                onChange={(e) => {
                  const v = e.target.value;
                  setPaymentDialog((d) => (d ? { ...d, prochaineDate: v } : d));
                }}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <button
              onClick={() => setPaymentDialog(null)}
              className="px-4 py-2 rounded-2xl font-semibold text-sm"
              style={{ color: "#9ca3af" }}
            >
              Plus tard
            </button>
            <button
              onClick={confirmPayment}
              disabled={!paymentDialog?.date || !paymentDialog?.montant}
              className="px-5 py-2 rounded-2xl text-white font-bold text-sm disabled:opacity-40"
              style={{ background: "linear-gradient(135deg, #7c3aed, #ec4899)" }}
            >
              Confirmer
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
