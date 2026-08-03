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
import type { CoursParticulier, CoursCycle, CoursSeance } from "@/lib/types";
import { getCours, saveCours } from "@/lib/storage";

const MATIERES = ["Mathématiques", "Français", "Arabe", "Anglais", "Autre"];
const DEVISES = ["DT", "€", "$"];
const JOURS_SHORT = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const JOURS_FULL = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function jsToJours(jsDay: number): number {
  return (jsDay + 6) % 7;
}

function mostRecentFixedDay(jours: number[]): string {
  if (!jours || jours.length === 0) return todayStr();
  const now = new Date();
  for (let i = 0; i <= 6; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    if (jours.includes(jsToJours(d.getDay()))) {
      return d.toISOString().split("T")[0];
    }
  }
  return todayStr();
}

function createCycle(seancesParCycle: number, dateDebut: string): CoursCycle {
  const seances: CoursSeance[] = Array.from({ length: seancesParCycle }, (_, i) => ({
    id: crypto.randomUUID(),
    numero: i + 1,
    done: false,
  }));
  return { id: crypto.randomUUID(), dateDebut, paid: false, seances };
}

// ── Types ──────────────────────────────────────────────────────────────────

type FormState = {
  nom: string;
  matiere: string;
  montant: string;
  devise: string;
  seancesParCycle: string;
  jours: number[];
};

const DEFAULT_FORM: FormState = {
  nom: "",
  matiere: "Mathématiques",
  montant: "",
  devise: "DT",
  seancesParCycle: "12",
  jours: [],
};

type SeanceDialogState = {
  coursId: string;
  cycleId: string;
  seanceId: string;
  date: string;
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
                  ? { background: "linear-gradient(135deg, #7c3aed, #ec4899)", color: "#ffffff" }
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

// ── Page ───────────────────────────────────────────────────────────────────

export default function CoursPage() {
  const [cours, setCours] = useState<CoursParticulier[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [seanceDialog, setSeanceDialog] = useState<SeanceDialogState | null>(null);
  const [paymentDialog, setPaymentDialog] = useState<PaymentDialogState | null>(null);

  useEffect(() => {
    setCours(getCours());
    setLoaded(true);
  }, []);

  const save = (next: CoursParticulier[]) => {
    setCours(next);
    saveCours(next);
  };

  const toggleJour = (idx: number) => {
    setForm((f) => ({
      ...f,
      jours: f.jours.includes(idx) ? f.jours.filter((j) => j !== idx) : [...f.jours, idx],
    }));
  };

  // ── Cours CRUD ─────────────────────────────────────────────────────────

  const handleAdd = () => {
    if (!form.nom || !form.montant) return;
    const seancesN = Math.max(1, parseInt(form.seancesParCycle) || 12);
    const today = todayStr();
    const firstCycle = createCycle(seancesN, today);
    const newCours: CoursParticulier = {
      id: crypto.randomUUID(),
      nom: form.nom,
      matiere: form.matiere,
      montant: parseFloat(form.montant),
      devise: form.devise,
      seancesParCycle: seancesN,
      jours: form.jours,
      cycles: [firstCycle],
    };
    save([...cours, newCours]);
    setForm(DEFAULT_FORM);
    setAddOpen(false);
    setPaymentDialog({
      coursId: newCours.id,
      cycleId: firstCycle.id,
      montant: String(newCours.montant),
      devise: newCours.devise,
      date: today,
      prochaineDate: "",
    });
  };

  const openEdit = (c: CoursParticulier) => {
    setEditingId(c.id);
    setForm({
      nom: c.nom,
      matiere: c.matiere,
      montant: String(c.montant),
      devise: c.devise,
      seancesParCycle: String(c.seancesParCycle),
      jours: Array.isArray(c.jours) ? c.jours : [],
    });
    setEditOpen(true);
  };

  const handleEdit = () => {
    if (!editingId || !form.nom || !form.montant) return;
    save(
      cours.map((c) =>
        c.id === editingId
          ? {
              ...c,
              nom: form.nom,
              matiere: form.matiere,
              montant: parseFloat(form.montant),
              devise: form.devise,
              jours: form.jours,
            }
          : c
      )
    );
    setEditOpen(false);
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    save(cours.filter((c) => c.id !== id));
    setDeleteConfirmId(null);
    if (expandedId === id) setExpandedId(null);
  };

  // ── Cycle / payment ────────────────────────────────────────────────────

  const handleNewCycleWithPayment = (coursId: string) => {
    const c = cours.find((co) => co.id === coursId);
    if (!c) return;
    const today = todayStr();
    const newCycle = createCycle(c.seancesParCycle, today);
    save(
      cours.map((co) => {
        if (co.id !== coursId) return co;
        const updatedCycles = co.cycles.map((cy, i) =>
          i === co.cycles.length - 1 ? { ...cy, paid: true } : cy
        );
        return { ...co, cycles: [...updatedCycles, newCycle] };
      })
    );
    setPaymentDialog({
      coursId,
      cycleId: newCycle.id,
      montant: String(c.montant),
      devise: c.devise,
      date: today,
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

  // ── Séances ────────────────────────────────────────────────────────────

  const applySeance = (
    coursId: string,
    cycleId: string,
    seanceId: string,
    done: boolean,
    date?: string
  ) => {
    save(
      cours.map((c) => {
        if (c.id !== coursId) return c;
        return {
          ...c,
          cycles: c.cycles.map((cy) => {
            if (cy.id !== cycleId) return cy;
            return {
              ...cy,
              seances: cy.seances.map((s) => {
                if (s.id !== seanceId) return s;
                return { ...s, done, date: done ? (date ?? todayStr()) : undefined };
              }),
            };
          }),
        };
      })
    );
  };

  const handleSeanceClick = (c: CoursParticulier, cycleId: string, seanceId: string) => {
    const seance = c.cycles
      .find((cy) => cy.id === cycleId)
      ?.seances.find((s) => s.id === seanceId);
    if (!seance) return;
    if (seance.done) {
      applySeance(c.id, cycleId, seanceId, false);
    } else {
      setSeanceDialog({
        coursId: c.id,
        cycleId,
        seanceId,
        date: mostRecentFixedDay(Array.isArray(c.jours) ? c.jours : []),
      });
    }
  };

  const confirmSeance = () => {
    if (!seanceDialog) return;
    applySeance(
      seanceDialog.coursId,
      seanceDialog.cycleId,
      seanceDialog.seanceId,
      true,
      seanceDialog.date
    );
    setSeanceDialog(null);
  };

  if (!loaded) return null;

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="px-4 pt-8 pb-4 max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-extrabold" style={{ color: "#3b0764" }}>
          🎓 Cours Particuliers
        </h1>
        <button
          onClick={() => setAddOpen(true)}
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
          const seancesDone = currentCycle.seances.filter((s) => s.done).length;
          const total = currentCycle.seances.length;
          const pct = total > 0 ? Math.round((seancesDone / total) * 100) : 0;
          const remaining = total - seancesDone;
          const isComplete = seancesDone === total;
          const isExpanded = expandedId === c.id;
          const jours = Array.isArray(c.jours) ? c.jours : [];
          // Orange: ≤2 séances left and not complete
          const showOrange = !isComplete && remaining > 0 && remaining <= 2;

          return (
            <div
              key={c.id}
              className="rounded-3xl overflow-hidden"
              style={{
                background: "#ffffff",
                border: "1px solid rgba(139,92,246,0.2)",
                boxShadow: "0 2px 12px rgba(124,58,237,0.08)",
              }}
            >
              {/* ── Top banners ── */}
              {isComplete ? (
                <div
                  className="px-4 py-2.5 flex items-center justify-between gap-2"
                  style={{
                    background: "rgba(239,68,68,0.08)",
                    borderBottom: "1px solid rgba(239,68,68,0.2)",
                  }}
                >
                  <span className="text-sm font-bold" style={{ color: "#dc2626" }}>
                    🔔 Cycle terminé — Payer {c.montant} {c.devise} !
                  </span>
                  <button
                    onClick={() => handleNewCycleWithPayment(c.id)}
                    className="shrink-0 text-xs font-bold px-2.5 py-1 rounded-xl text-white active:scale-95 transition-transform"
                    style={{ background: "#dc2626" }}
                  >
                    Nouveau cycle +
                  </button>
                </div>
              ) : showOrange ? (
                <div
                  className="px-4 py-2"
                  style={{
                    background: "rgba(245,158,11,0.08)",
                    borderBottom: "1px solid rgba(245,158,11,0.2)",
                  }}
                >
                  <span className="text-xs font-bold" style={{ color: "#d97706" }}>
                    ⚠️ Plus que {remaining} séance{remaining > 1 ? "s" : ""} avant le paiement !
                  </span>
                </div>
              ) : null}

              {/* ── Card body ── */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h2 className="font-extrabold text-base" style={{ color: "#3b0764" }}>
                        {c.nom}
                      </h2>
                      <span
                        className="text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: "rgba(124,58,237,0.1)", color: "#7c3aed" }}
                      >
                        {c.matiere}
                      </span>
                    </div>
                    {jours.length > 0 && (
                      <p className="text-xs font-medium mb-1" style={{ color: "#7c3aed" }}>
                        📅 {jours.map((j) => JOURS_FULL[j]).join(" · ")}
                      </p>
                    )}
                    <div className="text-xs font-semibold" style={{ color: "#6d28d9" }}>
                      Cycle {c.cycles.length} — {c.montant} {c.devise}
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5 ml-2 shrink-0">
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

                {/* Progress bar */}
                <div className="mb-2">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs font-semibold" style={{ color: "#3b0764" }}>
                      Séance {seancesDone}/{total}
                    </span>
                    <span className="text-xs font-bold" style={{ color: "#7c3aed" }}>
                      {pct}%
                    </span>
                  </div>
                  <div
                    className="h-2.5 rounded-full overflow-hidden"
                    style={{ background: "rgba(124,58,237,0.1)" }}
                  >
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: "linear-gradient(90deg, #7c3aed, #ec4899)" }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>

                {/* Payment info */}
                {currentCycle.datePaiement && (
                  <p className="text-xs font-semibold mt-1.5" style={{ color: "#16a34a" }}>
                    💰 Payé le {formatDate(currentCycle.datePaiement)} —{" "}
                    {currentCycle.montantPaye ?? c.montant} {c.devise}
                  </p>
                )}
                {currentCycle.prochaineDate && (
                  <p className="text-xs font-semibold mt-1" style={{ color: "#7c3aed" }}>
                    📅 Prochain paiement prévu : {formatDate(currentCycle.prochaineDate)}
                  </p>
                )}
              </div>

              {/* ── Expanded detail ── */}
              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    key="detail"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    style={{ overflow: "hidden" }}
                  >
                    <div
                      className="px-4 pb-4"
                      style={{ borderTop: "1px solid rgba(139,92,246,0.1)" }}
                    >
                      <p className="text-xs font-bold mt-3 mb-2" style={{ color: "#6d28d9" }}>
                        Séances — Cycle {c.cycles.length}
                      </p>
                      <div className="flex flex-col gap-1">
                        {currentCycle.seances.map((s) => (
                          <button
                            key={s.id}
                            onClick={() => handleSeanceClick(c, currentCycle.id, s.id)}
                            className="flex items-center gap-3 py-1.5 px-1 rounded-xl text-left active:scale-95 transition-transform"
                          >
                            <span className="text-base leading-none">
                              {s.done ? "✅" : "⬜"}
                            </span>
                            <span
                              className="text-sm font-semibold flex-1"
                              style={{ color: s.done ? "#16a34a" : "#3b0764" }}
                            >
                              Séance {s.numero}
                              {s.date && (
                                <span
                                  className="font-normal text-xs ml-1.5"
                                  style={{ color: "#6d28d9" }}
                                >
                                  — {formatDate(s.date)}
                                </span>
                              )}
                            </span>
                          </button>
                        ))}
                      </div>

                      {/* Payment history */}
                      <div className="mt-4">
                        <p className="text-xs font-bold mb-2" style={{ color: "#6d28d9" }}>
                          📋 Historique des paiements
                        </p>
                        <div className="flex flex-col gap-1.5">
                          {c.cycles.map((cy, idx) => {
                            const cycleDone = cy.seances.filter((s) => s.done).length;
                            const cycleComplete = cycleDone === cy.seances.length;
                            const isLast = idx === c.cycles.length - 1;
                            return (
                              <div key={cy.id} className="flex items-start gap-2">
                                <span className="text-sm shrink-0">
                                  {cycleComplete || !isLast ? "✅" : "🔄"}
                                </span>
                                <span
                                  className="text-xs"
                                  style={{ color: cycleComplete || !isLast ? "#16a34a" : "#6d28d9" }}
                                >
                                  Cycle {idx + 1}
                                  {cy.datePaiement
                                    ? ` — Payé le ${formatDate(cy.datePaiement)} — ${cy.montantPaye ?? c.montant} ${c.devise}`
                                    : " — Non payé"}
                                  {" — "}
                                  {cycleDone}/{cy.seances.length} séances
                                  {isLast && !cycleComplete ? " 🔄" : ""}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* ══ Add Dialog ══════════════════════════════════════════════════════ */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
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
            <div className="flex flex-col gap-1.5">
              <Label style={{ color: "#3b0764" }}>Matière</Label>
              <Select
                value={form.matiere}
                onValueChange={(v) => setForm((f) => ({ ...f, matiere: v ?? f.matiere }))}
              >
                <SelectTrigger className="rounded-2xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MATIERES.map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-3">
              <div className="flex flex-col gap-1.5 flex-1">
                <Label style={{ color: "#3b0764" }}>Montant</Label>
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
          </div>
          <DialogFooter className="gap-2">
            <button
              onClick={() => { setAddOpen(false); setForm(DEFAULT_FORM); }}
              className="px-4 py-2 rounded-2xl font-semibold text-sm"
              style={{ color: "#7c3aed" }}
            >
              Annuler
            </button>
            <button
              onClick={handleAdd}
              disabled={!form.nom || !form.montant}
              className="px-5 py-2 rounded-2xl text-white font-bold text-sm disabled:opacity-40"
              style={{ background: "linear-gradient(135deg, #7c3aed, #ec4899)" }}
            >
              Créer
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══ Edit Dialog ═════════════════════════════════════════════════════ */}
      <Dialog
        open={editOpen}
        onOpenChange={(open) => { if (!open) { setEditOpen(false); setEditingId(null); } }}
      >
        <DialogContent className="rounded-3xl mx-4 max-w-sm max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle style={{ color: "#3b0764" }}>Modifier le cours</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <Label style={{ color: "#3b0764" }}>Nom</Label>
              <Input
                className="rounded-2xl"
                value={form.nom}
                onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label style={{ color: "#3b0764" }}>Matière</Label>
              <Select
                value={form.matiere}
                onValueChange={(v) => setForm((f) => ({ ...f, matiere: v ?? f.matiere }))}
              >
                <SelectTrigger className="rounded-2xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MATIERES.map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
            <JoursToggle jours={form.jours} onToggle={toggleJour} />
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
              disabled={!form.nom || !form.montant}
              className="px-5 py-2 rounded-2xl text-white font-bold text-sm disabled:opacity-40"
              style={{ background: "linear-gradient(135deg, #7c3aed, #ec4899)" }}
            >
              Enregistrer
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══ Delete confirm ══════════════════════════════════════════════════ */}
      <Dialog
        open={deleteConfirmId !== null}
        onOpenChange={(open) => { if (!open) setDeleteConfirmId(null); }}
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

      {/* ══ Séance date dialog ══════════════════════════════════════════════ */}
      <Dialog
        open={seanceDialog !== null}
        onOpenChange={(open) => { if (!open) setSeanceDialog(null); }}
      >
        <DialogContent className="rounded-3xl mx-4 max-w-xs">
          <DialogHeader>
            <DialogTitle style={{ color: "#3b0764" }}>Date de la séance</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-2">
            <Label style={{ color: "#3b0764" }}>Date</Label>
            <Input
              className="rounded-2xl"
              type="date"
              value={seanceDialog?.date ?? ""}
              onChange={(e) => {
                const val = e.target.value;
                setSeanceDialog((d) => (d ? { ...d, date: val } : d));
              }}
            />
          </div>
          <DialogFooter className="gap-2">
            <button
              onClick={() => setSeanceDialog(null)}
              className="px-4 py-2 rounded-2xl font-semibold text-sm"
              style={{ color: "#7c3aed" }}
            >
              Annuler
            </button>
            <button
              onClick={confirmSeance}
              disabled={!seanceDialog?.date}
              className="px-5 py-2 rounded-2xl text-white font-bold text-sm disabled:opacity-40"
              style={{ background: "linear-gradient(135deg, #7c3aed, #ec4899)" }}
            >
              Confirmer ✅
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══ Payment dialog ══════════════════════════════════════════════════ */}
      <Dialog
        open={paymentDialog !== null}
        onOpenChange={(open) => { if (!open) setPaymentDialog(null); }}
      >
        <DialogContent className="rounded-3xl mx-4 max-w-sm">
          <DialogHeader>
            <DialogTitle style={{ color: "#3b0764" }}>💰 Paiement début de cycle</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <Label style={{ color: "#3b0764" }}>Date du paiement</Label>
              <Input
                className="rounded-2xl"
                type="date"
                value={paymentDialog?.date ?? ""}
                onChange={(e) => {
                  const val = e.target.value;
                  setPaymentDialog((d) => (d ? { ...d, date: val } : d));
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
                    const val = e.target.value;
                    setPaymentDialog((d) => (d ? { ...d, montant: val } : d));
                  }}
                />
              </div>
              <span
                className="pb-2 text-sm font-bold"
                style={{ color: "#6d28d9" }}
              >
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
                  const val = e.target.value;
                  setPaymentDialog((d) => (d ? { ...d, prochaineDate: val } : d));
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
              Confirmer le paiement
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
