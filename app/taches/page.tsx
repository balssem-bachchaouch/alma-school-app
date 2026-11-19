"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, Trash2, ChevronDown, ChevronUp, ArrowRight, ArrowLeft } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Tache, SousTache } from "@/lib/types";
import HelpButton from "@/components/HelpButton";

const TACHES_GUIDE = [
  {
    emoji: "📋",
    title: "Tableau Kanban",
    items: [
      "Le tableau a 3 colonnes : À faire → En cours → Terminé.",
      "Clique sur une colonne en haut pour la sélectionner.",
      "Clique sur → pour passer une tâche à la colonne suivante.",
    ],
  },
  {
    emoji: "✅",
    title: "Créer une tâche",
    items: [
      "Clique sur \"+ Nouvelle\" ou sur \"+\" dans une colonne.",
      "Renseigne le titre, la priorité et le type.",
    ],
  },
  {
    emoji: "📋",
    title: "Sous-tâches",
    items: [
      "Clique sur une carte pour voir ses sous-tâches.",
      "La barre de progression indique l'avancement.",
    ],
  },
];

const STATUTS = ["À faire", "En cours", "Terminé"] as const;
type Statut = typeof STATUTS[number];
const PRIORITES = ["Basse", "Moyenne", "Haute"] as const;
const TYPES = ["Perso", "École", "Étude"] as const;

const COLUMN_CONFIG: Record<Statut, { emoji: string; color: string; bg: string; light: string; gradient: string }> = {
  "À faire":  { emoji: "📋", color: "#6366f1", bg: "#eef2ff", light: "#e0e7ff", gradient: "linear-gradient(135deg,#6366f1,#8b5cf6)" },
  "En cours": { emoji: "⚡", color: "#f59e0b", bg: "#fffbeb", light: "#fef3c7", gradient: "linear-gradient(135deg,#f59e0b,#f97316)" },
  "Terminé":  { emoji: "🎉", color: "#10b981", bg: "#f0fdf4", light: "#d1fae5", gradient: "linear-gradient(135deg,#10b981,#059669)" },
};

const PRIORITE_CONFIG: Record<string, { color: string; bg: string; dot: string }> = {
  Basse:   { color: "#10b981", bg: "#d1fae5", dot: "#10b981" },
  Moyenne: { color: "#f59e0b", bg: "#fef3c7", dot: "#f59e0b" },
  Haute:   { color: "#ef4444", bg: "#fee2e2", dot: "#ef4444" },
};

const TYPE_CONFIG: Record<string, { color: string; bg: string }> = {
  Perso:  { color: "#3b82f6", bg: "#dbeafe" },
  École:  { color: "#7c3aed", bg: "#ede9fe" },
  Étude:  { color: "#14b8a6", bg: "#ccfbf1" },
};

const EMPTY_FORM = {
  titre: "", description: "", statut: "À faire" as string,
  priorite: "Moyenne", type: "Perso", dueDate: "",
  sousTaches: [] as SousTache[],
};

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
};

const cardVariants = {
  hidden: { opacity: 0, y: 18, scale: 0.95 },
  visible: (i: number) => ({
    opacity: 1, y: 0, scale: 1,
    transition: { type: "spring" as const, stiffness: 300, damping: 24, delay: i * 0.06 },
  }),
  exit: { opacity: 0, scale: 0.9, transition: { duration: 0.15 } },
};

export default function TachesPage() {
  const [taches, setTaches] = useState<Tache[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Tache | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [newSousTache, setNewSousTache] = useState("");
  const [activeCol, setActiveCol] = useState<Statut>("À faire");
  const [direction, setDirection] = useState(1);
  const [filterType, setFilterType] = useState("Tout");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [celebration, setCelebration] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/taches").then(r => r.ok ? r.json() : []).then(setTaches).finally(() => setLoading(false));
  }, []);

  const switchCol = (col: Statut) => {
    const cur = STATUTS.indexOf(activeCol);
    const nxt = STATUTS.indexOf(col);
    setDirection(nxt >= cur ? 1 : -1);
    setActiveCol(col);
  };

  const openAdd = (statut?: string) => {
    setEditing(null);
    setForm({ ...EMPTY_FORM, statut: statut ?? activeCol });
    setNewSousTache("");
    setOpen(true);
  };

  const openEdit = (t: Tache) => {
    setEditing(t);
    setForm({ titre: t.titre, description: t.description ?? "", statut: t.statut, priorite: t.priorite, type: t.type, dueDate: t.dueDate ?? "", sousTaches: [...t.sousTaches] });
    setNewSousTache("");
    setOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.titre.trim()) return;
    if (editing) {
      const r = await fetch(`/api/taches/${editing.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (r.ok) { const u: Tache = await r.json(); setTaches(p => p.map(t => t.id === editing.id ? u : t)); }
    } else {
      const r = await fetch("/api/taches", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (r.ok) { const c: Tache = await r.json(); setTaches(p => [c, ...p]); }
    }
    setOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Supprimer cette tâche ?")) return;
    const r = await fetch(`/api/taches/${id}`, { method: "DELETE" });
    if (r.ok) setTaches(p => p.filter(t => t.id !== id));
  };

  const moveToCol = async (t: Tache, target: Statut) => {
    const updated = { ...t, statut: target };
    const r = await fetch(`/api/taches/${t.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(updated) });
    if (r.ok) {
      setTaches(p => p.map(x => x.id === t.id ? { ...x, statut: target } : x));
      if (target === "Terminé") {
        setCelebration(t.id);
        setTimeout(() => setCelebration(null), 1600);
      }
    }
  };

  const toggleSousTache = async (tache: Tache, stId: string) => {
    const newST = tache.sousTaches.map(s => s.id === stId ? { ...s, done: !s.done } : s);
    const r = await fetch(`/api/taches/${tache.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...tache, sousTaches: newST }) });
    if (r.ok) setTaches(p => p.map(x => x.id === tache.id ? { ...x, sousTaches: newST } : x));
  };

  const colCards = (col: Statut) => taches.filter(t => t.statut === col && (filterType === "Tout" || t.type === filterType));
  const counts: Record<Statut, number> = { "À faire": taches.filter(t => t.statut === "À faire").length, "En cours": taches.filter(t => t.statut === "En cours").length, "Terminé": taches.filter(t => t.statut === "Terminé").length };

  const cards = colCards(activeCol);
  const colCfg = COLUMN_CONFIG[activeCol];
  const prevCol = STATUTS[STATUTS.indexOf(activeCol) - 1] as Statut | undefined;
  const nextCol = STATUTS[STATUTS.indexOf(activeCol) + 1] as Statut | undefined;

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="pt-6 pb-28 max-w-2xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between px-4 mb-5">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-extrabold" style={{ color: "#3b0764" }}>📋 Kanban</h1>
          <HelpButton pageTitle="Tâches" sections={TACHES_GUIDE} />
        </div>
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={() => openAdd()}
          className="flex items-center gap-1.5 text-white px-4 py-2 rounded-2xl text-sm font-bold shadow-sm"
          style={{ background: "linear-gradient(135deg, #7c3aed, #ec4899)" }}
        >
          <Plus size={16} /> Nouvelle
        </motion.button>
      </div>

      {/* Kanban column tabs */}
      <div className="px-4 mb-5">
        <div className="grid grid-cols-3 gap-2">
          {STATUTS.map(col => {
            const cfg = COLUMN_CONFIG[col];
            const active = col === activeCol;
            return (
              <motion.button
                key={col}
                whileTap={{ scale: 0.94 }}
                onClick={() => switchCol(col)}
                className="rounded-2xl p-3 flex flex-col gap-0.5 text-left transition-all"
                style={active ? {
                  background: cfg.gradient,
                  boxShadow: `0 6px 20px ${cfg.color}40`,
                  transform: "translateY(-2px)",
                } : {
                  background: cfg.bg,
                  border: `1.5px solid ${cfg.color}30`,
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-lg">{cfg.emoji}</span>
                  <span className="text-lg font-extrabold" style={{ color: active ? "#fff" : cfg.color }}>
                    {counts[col]}
                  </span>
                </div>
                <span className="text-xs font-extrabold leading-tight" style={{ color: active ? "#fff" : cfg.color }}>
                  {col}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Type filter */}
      <div className="flex gap-2 px-4 mb-4 overflow-x-auto pb-1">
        {(["Tout", ...TYPES] as string[]).map(tp => {
          const cfg = TYPE_CONFIG[tp as keyof typeof TYPE_CONFIG];
          const active = filterType === tp;
          return (
            <button key={tp} onClick={() => setFilterType(tp)}
              className="flex-shrink-0 px-3 py-1 rounded-full text-xs font-bold transition-all"
              style={active
                ? { background: cfg?.color ?? "#7c3aed", color: "#fff" }
                : { background: cfg?.bg ?? "rgba(124,58,237,0.08)", color: cfg?.color ?? "#6d28d9" }
              }
            >
              {tp}
            </button>
          );
        })}
      </div>

      {/* Column header with add button */}
      <div className="px-4 flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ background: colCfg.gradient }} />
          <span className="text-sm font-extrabold" style={{ color: colCfg.color }}>
            {activeCol} · {cards.length} tâche{cards.length !== 1 ? "s" : ""}
          </span>
        </div>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => openAdd(activeCol)}
          className="w-7 h-7 rounded-xl flex items-center justify-center text-white"
          style={{ background: colCfg.gradient }}
        >
          <Plus size={14} />
        </motion.button>
      </div>

      {/* Cards area with slide animation */}
      {loading ? (
        <div className="flex justify-center items-center gap-2 py-14">
          {["📋", "✅", "⚡"].map((e, i) => (
            <motion.span key={i} className="text-2xl"
              animate={{ y: [0, -14, 0] }}
              transition={{ duration: 0.7, delay: i * 0.18, repeat: Infinity, ease: "easeInOut" }}>
              {e}
            </motion.span>
          ))}
        </div>
      ) : (
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={activeCol}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="px-4"
          >
            {cards.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 260 }}
                className="rounded-3xl py-12 text-center"
                style={{ background: colCfg.bg, border: `1px dashed ${colCfg.color}50` }}
              >
                <motion.p className="text-4xl mb-3"
                  animate={{ rotate: [0, -10, 10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                >
                  {colCfg.emoji}
                </motion.p>
                <p className="text-sm font-bold" style={{ color: colCfg.color }}>
                  {activeCol === "À faire" ? "Aucune tâche à faire 🎉"
                    : activeCol === "En cours" ? "Rien en cours"
                    : "Rien de terminé encore"}
                </p>
                <motion.button
                  whileTap={{ scale: 0.93 }}
                  onClick={() => openAdd(activeCol)}
                  className="mt-4 px-4 py-2 rounded-2xl text-xs font-bold text-white"
                  style={{ background: colCfg.gradient }}
                >
                  + Ajouter une tâche
                </motion.button>
              </motion.div>
            ) : (
              <div className="flex flex-col gap-3">
                <AnimatePresence>
                  {cards.map((t, i) => {
                    const pCfg = PRIORITE_CONFIG[t.priorite] ?? PRIORITE_CONFIG.Moyenne;
                    const tCfg = TYPE_CONFIG[t.type] ?? TYPE_CONFIG.Perso;
                    const done = t.statut === "Terminé";
                    const isExp = expanded.has(t.id);
                    const stTotal = t.sousTaches.length;
                    const stDone = t.sousTaches.filter(s => s.done).length;
                    const stPct = stTotal > 0 ? Math.round(stDone / stTotal * 100) : 0;
                    const overdue = !done && t.dueDate && t.dueDate < today;

                    return (
                      <motion.div
                        key={t.id}
                        custom={i}
                        variants={cardVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        layout
                        className="rounded-3xl overflow-hidden relative"
                        style={{
                          background: done ? "#f9f7ff" : "#ffffff",
                          border: `1px solid ${done ? "rgba(16,185,129,0.2)" : "rgba(139,92,246,0.15)"}`,
                          boxShadow: "0 2px 16px rgba(124,58,237,0.07)",
                        }}
                      >
                        {/* Top accent bar (priority color) */}
                        <div className="h-1" style={{ background: pCfg.dot, opacity: done ? 0.3 : 1 }} />

                        {/* Celebration toast */}
                        <AnimatePresence>
                          {celebration === t.id && (
                            <motion.div
                              className="absolute inset-0 flex items-center justify-center z-20 rounded-3xl pointer-events-none"
                              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            >
                              <motion.span
                                initial={{ scale: 0 }} animate={{ scale: [0, 1.4, 1] }}
                                transition={{ type: "spring", stiffness: 300 }}
                                className="text-3xl"
                              >🎉</motion.span>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        <div className="p-4">
                          {/* Row 1: title + actions */}
                          <div className="flex items-start gap-2 mb-2.5">
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-sm leading-snug"
                                style={{ color: done ? "#9ca3af" : "#3b0764", textDecoration: done ? "line-through" : "none" }}>
                                {t.titre}
                              </p>
                              {t.description && (
                                <p className="text-xs mt-0.5 line-clamp-2 leading-relaxed" style={{ color: "#6d28d9" }}>
                                  {t.description}
                                </p>
                              )}
                            </div>
                            <div className="flex gap-1 flex-shrink-0">
                              <motion.button whileTap={{ scale: 0.85 }} onClick={() => openEdit(t)}
                                className="p-1.5 rounded-xl" style={{ color: "#a78bfa", background: "rgba(139,92,246,0.08)" }}>
                                <Pencil size={12} />
                              </motion.button>
                              <motion.button whileTap={{ scale: 0.85 }} onClick={() => handleDelete(t.id)}
                                className="p-1.5 rounded-xl" style={{ color: "#fca5a5", background: "rgba(239,68,68,0.06)" }}>
                                <Trash2 size={12} />
                              </motion.button>
                            </div>
                          </div>

                          {/* Row 2: badges */}
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                              style={{ background: pCfg.bg, color: pCfg.color }}>
                              {t.priorite}
                            </span>
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                              style={{ background: tCfg.bg, color: tCfg.color }}>
                              {t.type}
                            </span>
                            {t.dueDate && (
                              <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                                style={overdue ? { background: "#fee2e2", color: "#dc2626" } : { background: "#f3f4f6", color: "#6b7280" }}>
                                {overdue ? "⚠️ " : "📅 "}
                                {new Date(t.dueDate + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                              </span>
                            )}
                          </div>

                          {/* Sous-tâches progress */}
                          {stTotal > 0 && (
                            <div className="mb-3">
                              <button
                                onClick={() => setExpanded(p => { const s = new Set(p); s.has(t.id) ? s.delete(t.id) : s.add(t.id); return s; })}
                                className="flex items-center justify-between w-full"
                              >
                                <span className="text-xs font-semibold flex items-center gap-1" style={{ color: "#8b5cf6" }}>
                                  {isExp ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                                  {stDone}/{stTotal} sous-tâches
                                </span>
                                <span className="text-xs font-bold" style={{ color: stPct === 100 ? "#10b981" : "#f59e0b" }}>{stPct}%</span>
                              </button>
                              {/* Progress bar */}
                              <div className="mt-1.5 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(139,92,246,0.1)" }}>
                                <motion.div
                                  className="h-full rounded-full"
                                  style={{ background: stPct === 100 ? "#10b981" : "linear-gradient(90deg,#7c3aed,#ec4899)" }}
                                  initial={{ width: 0 }}
                                  animate={{ width: `${stPct}%` }}
                                  transition={{ duration: 0.5, ease: "easeOut" }}
                                />
                              </div>
                              <AnimatePresence>
                                {isExp && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                                    className="overflow-hidden"
                                  >
                                    <div className="pt-2 flex flex-col gap-1">
                                      {t.sousTaches.map(st => (
                                        <button key={st.id} onClick={() => toggleSousTache(t, st.id)}
                                          className="flex items-center gap-2 text-left w-full">
                                          <motion.div
                                            whileTap={{ scale: 0.75 }}
                                            className="w-3.5 h-3.5 rounded border flex-shrink-0 flex items-center justify-center transition-colors"
                                            style={{ borderColor: st.done ? "#10b981" : "#d1d5db", background: st.done ? "#10b981" : "transparent" }}
                                          >
                                            {st.done && <span className="text-white" style={{ fontSize: 8 }}>✓</span>}
                                          </motion.div>
                                          <span className="text-xs" style={{ color: st.done ? "#9ca3af" : "#3b0764", textDecoration: st.done ? "line-through" : "none" }}>
                                            {st.titre}
                                          </span>
                                        </button>
                                      ))}
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          )}

                          {/* Move between columns */}
                          <div className="flex items-center gap-2">
                            {prevCol && (
                              <motion.button
                                whileTap={{ scale: 0.88 }}
                                onClick={() => moveToCol(t, prevCol)}
                                className="flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-xl flex-1"
                                style={{ background: COLUMN_CONFIG[prevCol].bg, color: COLUMN_CONFIG[prevCol].color }}
                              >
                                <ArrowLeft size={12} />
                                {prevCol}
                              </motion.button>
                            )}
                            {nextCol && (
                              <motion.button
                                whileTap={{ scale: 0.88 }}
                                onClick={() => moveToCol(t, nextCol)}
                                className="flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-xl flex-1 justify-end"
                                style={{ background: COLUMN_CONFIG[nextCol].bg, color: COLUMN_CONFIG[nextCol].color }}
                              >
                                {nextCol}
                                <ArrowRight size={12} />
                              </motion.button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      )}

      {/* Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-3xl mx-4 max-w-sm max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle style={{ color: "#3b0764" }}>
              {editing ? "Modifier la tâche" : "Nouvelle tâche"}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <Label style={{ color: "#3b0764" }}>Titre</Label>
              <Input className="rounded-2xl" placeholder="ex. Faire mes devoirs de maths"
                value={form.titre} onChange={e => setForm(f => ({ ...f, titre: e.target.value }))} />
            </div>
            <div className="flex gap-3">
              <div className="flex flex-col gap-1.5 flex-1">
                <Label style={{ color: "#3b0764" }}>Colonne</Label>
                <Select value={form.statut} onValueChange={v => setForm(f => ({ ...f, statut: v ?? f.statut }))}>
                  <SelectTrigger className="rounded-2xl"><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5 flex-1">
                <Label style={{ color: "#3b0764" }}>Priorité</Label>
                <Select value={form.priorite} onValueChange={v => setForm(f => ({ ...f, priorite: v ?? f.priorite }))}>
                  <SelectTrigger className="rounded-2xl"><SelectValue /></SelectTrigger>
                  <SelectContent>{PRIORITES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label style={{ color: "#3b0764" }}>Type</Label>
              <div className="flex gap-2">
                {TYPES.map(tp => {
                  const cfg = TYPE_CONFIG[tp];
                  return (
                    <button key={tp} type="button" onClick={() => setForm(f => ({ ...f, type: tp }))}
                      className="flex-1 py-2 rounded-2xl text-xs font-bold transition-all"
                      style={form.type === tp ? { background: cfg.color, color: "#fff" } : { background: cfg.bg, color: cfg.color }}>
                      {tp}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label style={{ color: "#3b0764" }}>Date d&apos;échéance <span className="font-normal text-xs text-gray-400">(facultatif)</span></Label>
              <Input type="date" className="rounded-2xl" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label style={{ color: "#3b0764" }}>Description <span className="font-normal text-xs text-gray-400">(facultatif)</span></Label>
              <textarea className="rounded-2xl border px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-400"
                style={{ borderColor: "rgba(139,92,246,0.3)", minHeight: 72, color: "#3b0764" }}
                placeholder="Détails..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label style={{ color: "#3b0764" }}>Sous-tâches <span className="font-normal text-xs text-gray-400">(facultatif)</span></Label>
              <div className="flex gap-2">
                <Input className="rounded-2xl flex-1" placeholder="Ajouter une étape..."
                  value={newSousTache} onChange={e => setNewSousTache(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); if (newSousTache.trim()) { setForm(f => ({ ...f, sousTaches: [...f.sousTaches, { id: crypto.randomUUID(), titre: newSousTache.trim(), done: false }] })); setNewSousTache(""); } } }} />
                <button type="button" onClick={() => { if (newSousTache.trim()) { setForm(f => ({ ...f, sousTaches: [...f.sousTaches, { id: crypto.randomUUID(), titre: newSousTache.trim(), done: false }] })); setNewSousTache(""); } }}
                  className="w-9 h-9 rounded-2xl flex items-center justify-center text-white flex-shrink-0"
                  style={{ background: "linear-gradient(135deg,#7c3aed,#ec4899)" }}>
                  <Plus size={16} />
                </button>
              </div>
              {form.sousTaches.length > 0 && (
                <div className="flex flex-col gap-1 mt-1">
                  {form.sousTaches.map((st, idx) => (
                    <div key={st.id} className="flex items-center gap-2 px-2 py-1 rounded-xl" style={{ background: "#f5f3ff" }}>
                      <span className="text-xs flex-1" style={{ color: "#3b0764" }}>{st.titre}</span>
                      <button type="button" onClick={() => setForm(f => ({ ...f, sousTaches: f.sousTaches.filter((_, i) => i !== idx) }))} className="text-red-400 text-xs">✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter className="gap-2">
            {editing && (
              <button onClick={async () => { if (!window.confirm("Supprimer ?")) return; setOpen(false); await fetch(`/api/taches/${editing.id}`, { method: "DELETE" }); setTaches(p => p.filter(t => t.id !== editing.id)); }}
                className="px-4 py-2 rounded-2xl font-semibold text-sm mr-auto" style={{ color: "#ef4444" }}>
                Supprimer
              </button>
            )}
            <button onClick={() => setOpen(false)} className="px-4 py-2 rounded-2xl font-semibold text-sm" style={{ color: "#7c3aed" }}>Annuler</button>
            <button onClick={handleSubmit} disabled={!form.titre.trim()}
              className="px-5 py-2 rounded-2xl text-white font-bold text-sm disabled:opacity-40"
              style={{ background: "linear-gradient(135deg,#7c3aed,#ec4899)" }}>
              {editing ? "Modifier" : "Ajouter"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
