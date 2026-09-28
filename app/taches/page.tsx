"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, ChevronDown, ChevronUp } from "lucide-react";
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
import type { Tache, SousTache } from "@/lib/types";
import HelpButton from "@/components/HelpButton";

const TACHES_GUIDE = [
  {
    emoji: "✅",
    title: "Créer une tâche",
    items: [
      "Cliquer sur \"+ Nouvelle\" en haut à droite.",
      "Renseigner le titre, le statut, la priorité et le type (Perso / École / Étude).",
      "Ajouter une date d'échéance, une description et des sous-tâches si besoin.",
    ],
  },
  {
    emoji: "🔄",
    title: "Changer le statut",
    items: [
      "Cliquer sur le cercle à gauche d'une tâche pour passer : À faire → En cours → Terminé.",
      "Une tâche terminée apparaît barrée et légèrement grisée.",
      "Filtrer par statut avec les boutons en haut de page.",
    ],
  },
  {
    emoji: "📋",
    title: "Sous-tâches",
    items: [
      "Cliquer sur \"Sous-tâches X/Y\" pour dérouler la liste.",
      "Cocher chaque sous-tâche individuellement.",
      "Les sous-tâches sont gérées depuis le dialog de modification.",
    ],
  },
  {
    emoji: "🎨",
    title: "Filtrer et organiser",
    items: [
      "Filtrer par statut (ligne du haut) ou par type (Perso / École / Étude).",
      "La priorité est indiquée par un badge coloré : vert = Basse, orange = Moyenne, rouge = Haute.",
    ],
  },
];

const STATUTS = ["À faire", "En cours", "Terminé"] as const;
const PRIORITES = ["Basse", "Moyenne", "Haute"] as const;
const TYPES = ["Perso", "École", "Étude"] as const;

const PRIORITE_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  Basse:   { color: "#10b981", bg: "#d1fae5", label: "Basse" },
  Moyenne: { color: "#f59e0b", bg: "#fef3c7", label: "Moyenne" },
  Haute:   { color: "#ef4444", bg: "#fee2e2", label: "Haute" },
};

const TYPE_CONFIG: Record<string, { color: string; bg: string }> = {
  Perso:  { color: "#3b82f6", bg: "#dbeafe" },
  École:  { color: "#7c3aed", bg: "#ede9fe" },
  Étude:  { color: "#14b8a6", bg: "#ccfbf1" },
};

const STATUT_CONFIG: Record<string, { color: string; bg: string }> = {
  "À faire":  { color: "#6b7280", bg: "#f3f4f6" },
  "En cours": { color: "#f59e0b", bg: "#fef3c7" },
  "Terminé":  { color: "#10b981", bg: "#d1fae5" },
};

const EMPTY_FORM = {
  titre: "",
  description: "",
  statut: "À faire",
  priorite: "Moyenne",
  type: "Perso",
  dueDate: "",
  sousTaches: [] as SousTache[],
};

export default function TachesPage() {
  const [taches, setTaches] = useState<Tache[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Tache | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [newSousTache, setNewSousTache] = useState("");
  const [filterStatut, setFilterStatut] = useState("Tout");
  const [filterType, setFilterType] = useState("Tout");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const load = async () => {
    setLoading(true);
    const r = await fetch("/api/taches");
    if (r.ok) setTaches(await r.json());
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setNewSousTache("");
    setOpen(true);
  };

  const openEdit = (t: Tache) => {
    setEditing(t);
    setForm({
      titre: t.titre,
      description: t.description ?? "",
      statut: t.statut,
      priorite: t.priorite,
      type: t.type,
      dueDate: t.dueDate ?? "",
      sousTaches: [...t.sousTaches],
    });
    setNewSousTache("");
    setOpen(true);
  };

  const addSousTache = () => {
    if (!newSousTache.trim()) return;
    setForm(f => ({
      ...f,
      sousTaches: [...f.sousTaches, { id: crypto.randomUUID(), titre: newSousTache.trim(), done: false }],
    }));
    setNewSousTache("");
  };

  const handleSubmit = async () => {
    if (!form.titre.trim()) return;
    const payload = { ...form, sousTaches: form.sousTaches };

    if (editing) {
      const r = await fetch(`/api/taches/${editing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (r.ok) {
        const updated: Tache = await r.json();
        setTaches(prev => prev.map(t => t.id === editing.id ? updated : t));
      }
    } else {
      const r = await fetch("/api/taches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (r.ok) {
        const created: Tache = await r.json();
        setTaches(prev => [created, ...prev]);
      }
    }
    setOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Supprimer cette tâche ?")) return;
    const r = await fetch(`/api/taches/${id}`, { method: "DELETE" });
    if (r.ok) setTaches(prev => prev.filter(t => t.id !== id));
  };

  const toggleStatut = async (t: Tache) => {
    const next = t.statut === "Terminé" ? "À faire" : t.statut === "À faire" ? "En cours" : "Terminé";
    const updated = { ...t, statut: next };
    const r = await fetch(`/api/taches/${t.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated),
    });
    if (r.ok) setTaches(prev => prev.map(x => x.id === t.id ? { ...x, statut: next } : x));
  };

  const toggleSousTache = async (tache: Tache, stId: string) => {
    const newST = tache.sousTaches.map(s => s.id === stId ? { ...s, done: !s.done } : s);
    const r = await fetch(`/api/taches/${tache.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...tache, sousTaches: newST }),
    });
    if (r.ok) setTaches(prev => prev.map(x => x.id === tache.id ? { ...x, sousTaches: newST } : x));
  };

  const filtered = taches.filter(t => {
    if (filterStatut !== "Tout" && t.statut !== filterStatut) return false;
    if (filterType !== "Tout" && t.type !== filterType) return false;
    return true;
  });

  const counts: Record<string, number> = {
    Tout: taches.length,
    "À faire": taches.filter(t => t.statut === "À faire").length,
    "En cours": taches.filter(t => t.statut === "En cours").length,
    Terminé: taches.filter(t => t.statut === "Terminé").length,
  };

  const toggleExpanded = (id: string) =>
    setExpanded(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });

  return (
    <div className="px-4 pt-8 pb-24 max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-extrabold" style={{ color: "#3b0764" }}>✅ Mes Tâches</h1>
          <HelpButton pageTitle="Tâches" sections={TACHES_GUIDE} />
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 text-white px-4 py-2 rounded-2xl text-sm font-bold shadow-sm active:scale-95 transition-transform"
          style={{ background: "linear-gradient(135deg, #7c3aed, #ec4899)" }}
        >
          <Plus size={16} />
          Nouvelle
        </button>
      </div>

      {/* Filtres statut */}
      <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
        {(["Tout", ...STATUTS] as string[]).map(s => (
          <button
            key={s}
            onClick={() => setFilterStatut(s)}
            className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all"
            style={filterStatut === s
              ? { background: "#7c3aed", color: "#fff" }
              : { background: "rgba(124,58,237,0.08)", color: "#6d28d9" }
            }
          >
            {s} <span className="opacity-70">({counts[s] ?? 0})</span>
          </button>
        ))}
      </div>

      {/* Filtres type */}
      <div className="flex gap-2 mb-5">
        {(["Tout", ...TYPES] as string[]).map(tp => {
          const cfg = TYPE_CONFIG[tp];
          const active = filterType === tp;
          return (
            <button
              key={tp}
              onClick={() => setFilterType(tp)}
              className="flex-shrink-0 px-3 py-1 rounded-full text-xs font-semibold transition-all"
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

      {/* Liste */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 rounded-full border-4 border-violet-200 border-t-violet-600 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-4xl mb-3">📋</p>
          <p className="text-sm font-semibold" style={{ color: "rgba(109,40,217,0.5)" }}>
            Aucune tâche
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map(t => {
            const pCfg = PRIORITE_CONFIG[t.priorite] ?? PRIORITE_CONFIG.Moyenne;
            const tCfg = TYPE_CONFIG[t.type] ?? TYPE_CONFIG.Perso;
            const sCfg = STATUT_CONFIG[t.statut] ?? STATUT_CONFIG["À faire"];
            const done = t.statut === "Terminé";
            const isExp = expanded.has(t.id);
            const stDone = t.sousTaches.filter(s => s.done).length;

            return (
              <div
                key={t.id}
                className="rounded-3xl p-4"
                style={{
                  background: done ? "#f9f7ff" : "#ffffff",
                  border: `1px solid rgba(139,92,246,${done ? "0.1" : "0.2"})`,
                  boxShadow: "0 2px 12px rgba(124,58,237,0.07)",
                  opacity: done ? 0.75 : 1,
                }}
              >
                <div className="flex items-start gap-3">
                  {/* Checkbox statut cyclique */}
                  <button
                    onClick={() => toggleStatut(t)}
                    className="mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all"
                    style={{
                      borderColor: sCfg.color,
                      background: done ? sCfg.color : "transparent",
                    }}
                  >
                    {done && <span className="text-white text-xs">✓</span>}
                    {t.statut === "En cours" && (
                      <div className="w-2 h-2 rounded-full" style={{ background: sCfg.color }} />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span
                        className="font-bold text-sm leading-tight"
                        style={{
                          color: "#3b0764",
                          textDecoration: done ? "line-through" : "none",
                        }}
                      >
                        {t.titre}
                      </span>
                      <div className="flex gap-1 flex-shrink-0">
                        <button
                          onClick={() => openEdit(t)}
                          className="p-1.5 rounded-xl"
                          style={{ color: "#7c3aed" }}
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => handleDelete(t.id)}
                          className="p-1.5 rounded-xl text-red-400"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    {/* Badges */}
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      <span
                        className="text-xs font-bold px-2 py-0.5 rounded-full"
                        style={{ background: pCfg.bg, color: pCfg.color }}
                      >
                        {pCfg.label}
                      </span>
                      <span
                        className="text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: tCfg.bg, color: tCfg.color }}
                      >
                        {t.type}
                      </span>
                      <span
                        className="text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: sCfg.bg, color: sCfg.color }}
                      >
                        {t.statut}
                      </span>
                      {t.dueDate && (
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#f3f4f6", color: "#6b7280" }}>
                          📅 {new Date(t.dueDate).toLocaleDateString("fr-FR")}
                        </span>
                      )}
                    </div>

                    {t.description && (
                      <p className="text-xs mb-2 leading-relaxed" style={{ color: "#6d28d9" }}>
                        {t.description}
                      </p>
                    )}

                    {/* Sous-tâches */}
                    {t.sousTaches.length > 0 && (
                      <div>
                        <button
                          onClick={() => toggleExpanded(t.id)}
                          className="flex items-center gap-1 text-xs font-semibold mb-1.5"
                          style={{ color: "#8b5cf6" }}
                        >
                          {isExp ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                          Sous-tâches {stDone}/{t.sousTaches.length}
                        </button>
                        {isExp && (
                          <div className="flex flex-col gap-1 pl-1">
                            {t.sousTaches.map(st => (
                              <button
                                key={st.id}
                                onClick={() => toggleSousTache(t, st.id)}
                                className="flex items-center gap-2 text-left"
                              >
                                <div
                                  className="w-3.5 h-3.5 rounded border flex-shrink-0 flex items-center justify-center"
                                  style={{
                                    borderColor: st.done ? "#10b981" : "#d1d5db",
                                    background: st.done ? "#10b981" : "transparent",
                                  }}
                                >
                                  {st.done && <span className="text-white" style={{ fontSize: 8 }}>✓</span>}
                                </div>
                                <span
                                  className="text-xs"
                                  style={{
                                    color: st.done ? "#9ca3af" : "#3b0764",
                                    textDecoration: st.done ? "line-through" : "none",
                                  }}
                                >
                                  {st.titre}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Dialog ajout/modification */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-3xl mx-4 max-w-sm max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle style={{ color: "#3b0764" }}>
              {editing ? "Modifier la tâche" : "Nouvelle tâche"}
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-2">
            {/* Titre */}
            <div className="flex flex-col gap-1.5">
              <Label style={{ color: "#3b0764" }}>Titre</Label>
              <Input
                className="rounded-2xl"
                placeholder="ex. Confirmer le traiteur"
                value={form.titre}
                onChange={e => setForm(f => ({ ...f, titre: e.target.value }))}
              />
            </div>

            {/* Statut + Priorité */}
            <div className="flex gap-3">
              <div className="flex flex-col gap-1.5 flex-1">
                <Label style={{ color: "#3b0764" }}>Statut</Label>
                <Select value={form.statut} onValueChange={v => setForm(f => ({ ...f, statut: v ?? f.statut }))}>
                  <SelectTrigger className="rounded-2xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5 flex-1">
                <Label style={{ color: "#3b0764" }}>Priorité</Label>
                <Select value={form.priorite} onValueChange={v => setForm(f => ({ ...f, priorite: v ?? f.priorite }))}>
                  <SelectTrigger className="rounded-2xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Type */}
            <div className="flex flex-col gap-1.5">
              <Label style={{ color: "#3b0764" }}>Type</Label>
              <div className="flex gap-2">
                {TYPES.map(tp => {
                  const cfg = TYPE_CONFIG[tp];
                  const active = form.type === tp;
                  return (
                    <button
                      key={tp}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, type: tp }))}
                      className="flex-1 py-2 rounded-2xl text-xs font-bold transition-all"
                      style={active
                        ? { background: cfg.color, color: "#fff" }
                        : { background: cfg.bg, color: cfg.color }
                      }
                    >
                      {tp}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Date d'échéance */}
            <div className="flex flex-col gap-1.5">
              <Label style={{ color: "#3b0764" }}>Date d&apos;échéance <span className="font-normal text-xs text-gray-400">(facultatif)</span></Label>
              <Input
                type="date"
                className="rounded-2xl"
                value={form.dueDate}
                onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
              />
            </div>

            {/* Description */}
            <div className="flex flex-col gap-1.5">
              <Label style={{ color: "#3b0764" }}>Description <span className="font-normal text-xs text-gray-400">(facultatif)</span></Label>
              <textarea
                className="rounded-2xl border px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-400"
                style={{ borderColor: "rgba(139,92,246,0.3)", minHeight: 72, color: "#3b0764" }}
                placeholder="Détails, contexte..."
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              />
            </div>

            {/* Sous-tâches */}
            <div className="flex flex-col gap-1.5">
              <Label style={{ color: "#3b0764" }}>Sous-tâches <span className="font-normal text-xs text-gray-400">(facultatif)</span></Label>
              <div className="flex gap-2">
                <Input
                  className="rounded-2xl flex-1"
                  placeholder="Ajouter une sous-tâche..."
                  value={newSousTache}
                  onChange={e => setNewSousTache(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addSousTache())}
                />
                <button
                  type="button"
                  onClick={addSousTache}
                  className="w-9 h-9 rounded-2xl flex items-center justify-center text-white font-bold flex-shrink-0"
                  style={{ background: "linear-gradient(135deg, #7c3aed, #ec4899)" }}
                >
                  <Plus size={16} />
                </button>
              </div>
              {form.sousTaches.length > 0 && (
                <div className="flex flex-col gap-1 mt-1">
                  {form.sousTaches.map((st, idx) => (
                    <div key={st.id} className="flex items-center gap-2 px-2 py-1 rounded-xl" style={{ background: "#f5f3ff" }}>
                      <span className="text-xs flex-1" style={{ color: "#3b0764" }}>{st.titre}</span>
                      <button
                        type="button"
                        onClick={() => setForm(f => ({ ...f, sousTaches: f.sousTaches.filter((_, i) => i !== idx) }))}
                        className="text-red-400 text-xs"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2">
            {editing && (
              <button
                onClick={async () => {
                  if (!window.confirm("Supprimer cette tâche ?")) return;
                  setOpen(false);
                  await fetch(`/api/taches/${editing.id}`, { method: "DELETE" });
                  setTaches(prev => prev.filter(t => t.id !== editing.id));
                }}
                className="px-4 py-2 rounded-2xl font-semibold text-sm mr-auto"
                style={{ color: "#ef4444" }}
              >
                Supprimer
              </button>
            )}
            <button
              onClick={() => setOpen(false)}
              className="px-4 py-2 rounded-2xl font-semibold text-sm"
              style={{ color: "#7c3aed" }}
            >
              Annuler
            </button>
            <button
              onClick={handleSubmit}
              disabled={!form.titre.trim()}
              className="px-5 py-2 rounded-2xl text-white font-bold text-sm disabled:opacity-40"
              style={{ background: "linear-gradient(135deg, #7c3aed, #ec4899)" }}
            >
              {editing ? "Modifier" : "Ajouter la tâche"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
