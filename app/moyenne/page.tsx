"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2 } from "lucide-react";
import { getNotesMatiere, saveNotesMatiere } from "@/lib/storage";
import type { NoteMatiere } from "@/lib/types";

const MATIERES_DEFAULT = ["Mathématiques", "Français", "Arabe", "Sciences", "Anglais", "Histoire-Géo"];
const MAT_COLORS: Record<string, { color: string; bg: string }> = {
  "Mathématiques": { color: "#f97316", bg: "#fff7ed" },
  "Français":      { color: "#3b82f6", bg: "#eff6ff" },
  "Arabe":         { color: "#10b981", bg: "#f0fdf4" },
  "Sciences":      { color: "#8b5cf6", bg: "#f5f3ff" },
  "Anglais":       { color: "#eab308", bg: "#fefce8" },
  "Histoire-Géo":  { color: "#ec4899", bg: "#fdf2f8" },
  "Autre":         { color: "#6b7280", bg: "#f9fafb" },
};

function avg(notes: { valeur: number; coeff: number }[]): number | null {
  if (!notes.length) return null;
  const totalCoeff = notes.reduce((s, n) => s + n.coeff, 0);
  if (totalCoeff === 0) return null;
  const weighted = notes.reduce((s, n) => s + n.valeur * n.coeff, 0);
  return Math.round((weighted / totalCoeff) * 100) / 100;
}

function moyenneGlobale(matieres: NoteMatiere[]): number | null {
  const all = matieres.flatMap(m => m.notes);
  return avg(all);
}

function mention(m: number): { text: string; color: string } {
  if (m >= 16) return { text: "Très bien 🌟", color: "#10b981" };
  if (m >= 14) return { text: "Bien ⭐", color: "#3b82f6" };
  if (m >= 12) return { text: "Assez bien 👍", color: "#f59e0b" };
  if (m >= 10) return { text: "Passable 😊", color: "#f97316" };
  return { text: "À améliorer 💪", color: "#ef4444" };
}

export default function MoyennePage() {
  const [matieres, setMatieres] = useState<NoteMatiere[]>([]);
  const [newNote, setNewNote] = useState<Record<string, { valeur: string; coeff: string; label: string }>>({});
  const [expanded, setExpanded] = useState<Set<string>>(new Set(["Mathématiques"]));
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    const stored = getNotesMatiere();
    if (stored.length === 0) {
      const initial = MATIERES_DEFAULT.map(m => ({ matiere: m, notes: [] }));
      setMatieres(initial);
      saveNotesMatiere(initial);
    } else {
      setMatieres(stored);
    }
  }, []);

  const save = (updated: NoteMatiere[]) => { setMatieres(updated); saveNotesMatiere(updated); };

  const addNote = (matiere: string) => {
    const n = newNote[matiere];
    if (!n?.valeur || isNaN(parseFloat(n.valeur))) return;
    const val = Math.min(20, Math.max(0, parseFloat(n.valeur)));
    const coeff = n.coeff ? parseFloat(n.coeff) : 1;
    const updated = matieres.map(m =>
      m.matiere === matiere
        ? { ...m, notes: [...m.notes, { valeur: val, coeff, label: n.label || `Note ${m.notes.length + 1}` }] }
        : m
    );
    save(updated);
    setNewNote(prev => ({ ...prev, [matiere]: { valeur: "", coeff: "1", label: "" } }));
  };

  const deleteNote = (matiere: string, idx: number) => {
    const updated = matieres.map(m =>
      m.matiere === matiere ? { ...m, notes: m.notes.filter((_, i) => i !== idx) } : m
    );
    save(updated);
  };

  const toggleExpand = (m: string) =>
    setExpanded(p => { const s = new Set(p); s.has(m) ? s.delete(m) : s.add(m); return s; });

  const globalAvg = moyenneGlobale(matieres);

  return (
    <div className="pt-6 pb-28 px-4 max-w-md mx-auto">
      <h1 className="text-2xl font-extrabold mb-1" style={{ color: "#3b0764" }}>📊 Mes Moyennes</h1>
      <p className="text-sm mb-5" style={{ color: "#8b5cf6" }}>Calcule ta moyenne par matière et générale</p>

      {/* Global average hero */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="rounded-3xl p-5 mb-5 text-center relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #7c3aed, #ec4899)", boxShadow: "0 8px 32px rgba(124,58,237,0.3)" }}>
        <p className="text-xs font-bold uppercase tracking-widest text-white/70 mb-1">Moyenne générale</p>
        <motion.p key={globalAvg ?? "none"} initial={{ scale: 1.2 }} animate={{ scale: 1 }}
          className="text-5xl font-extrabold text-white mb-1">
          {globalAvg !== null ? globalAvg.toFixed(2) : "—"}
          {globalAvg !== null && <span className="text-2xl">/20</span>}
        </motion.p>
        {globalAvg !== null && (
          <p className="text-sm font-bold text-white/90">{mention(globalAvg).text}</p>
        )}
      </motion.div>

      {/* Per matiere */}
      <div className="flex flex-col gap-3">
        {matieres.map((m, mi) => {
          const cfg = MAT_COLORS[m.matiere] ?? { color: "#6b7280", bg: "#f9fafb" };
          const mAvg = avg(m.notes);
          const isExp = expanded.has(m.matiere);
          const form = newNote[m.matiere] ?? { valeur: "", coeff: "1", label: "" };
          const men = mAvg !== null ? mention(mAvg) : null;

          return (
            <motion.div key={m.matiere}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: mi * 0.05, type: "spring", stiffness: 280 }}
              className="rounded-3xl overflow-hidden"
              style={{ background: "#fff", border: `1.5px solid ${cfg.color}20`, boxShadow: "0 2px 12px rgba(124,58,237,0.06)" }}>
              {/* Header */}
              <button onClick={() => toggleExpand(m.matiere)} className="w-full p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-2xl flex items-center justify-center font-extrabold text-white text-sm"
                    style={{ background: cfg.color }}>
                    {mAvg !== null ? mAvg.toFixed(1) : "—"}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-extrabold" style={{ color: "#3b0764" }}>{m.matiere}</p>
                    <p className="text-xs" style={{ color: cfg.color }}>
                      {m.notes.length} note{m.notes.length !== 1 ? "s" : ""}{men ? ` · ${men.text}` : ""}
                    </p>
                  </div>
                </div>
                <span style={{ color: "#9ca3af" }}>{isExp ? "▲" : "▼"}</span>
              </button>

              {isExp && (
                <div className="px-4 pb-4 flex flex-col gap-2">
                  {/* Notes list */}
                  {m.notes.map((note, ni) => (
                    <div key={ni} className="flex items-center justify-between py-1.5 px-2 rounded-xl"
                      style={{ background: cfg.bg }}>
                      <span className="text-xs font-semibold" style={{ color: "#3b0764" }}>{note.label}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-extrabold" style={{ color: cfg.color }}>{note.valeur}/20</span>
                        <span className="text-xs" style={{ color: "#9ca3af" }}>×{note.coeff}</span>
                        <button onClick={() => deleteNote(m.matiere, ni)} className="text-red-300 text-xs">✕</button>
                      </div>
                    </div>
                  ))}

                  {/* Add note form */}
                  <div className="flex gap-2 mt-1">
                    <input placeholder="Libellé" value={form.label}
                      onChange={e => setNewNote(p => ({ ...p, [m.matiere]: { ...form, label: e.target.value } }))}
                      className="flex-1 rounded-xl border px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-violet-300"
                      style={{ borderColor: `${cfg.color}30` }} />
                    <input placeholder="Note" type="number" min={0} max={20} step={0.5} value={form.valeur}
                      onChange={e => setNewNote(p => ({ ...p, [m.matiere]: { ...form, valeur: e.target.value } }))}
                      className="w-16 rounded-xl border px-2 py-1.5 text-xs text-center focus:outline-none focus:ring-2 focus:ring-violet-300"
                      style={{ borderColor: `${cfg.color}30` }} />
                    <input placeholder="Coeff" type="number" min={0.5} max={9} step={0.5} value={form.coeff}
                      onChange={e => setNewNote(p => ({ ...p, [m.matiere]: { ...form, coeff: e.target.value } }))}
                      className="w-14 rounded-xl border px-2 py-1.5 text-xs text-center focus:outline-none focus:ring-2 focus:ring-violet-300"
                      style={{ borderColor: `${cfg.color}30` }} />
                    <motion.button whileTap={{ scale: 0.88 }} onClick={() => addNote(m.matiere)}
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-white flex-shrink-0"
                      style={{ background: cfg.color }}>
                      <Plus size={14} />
                    </motion.button>
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Print tip */}
      <div className="mt-5 rounded-2xl p-3 text-center" style={{ background: "rgba(139,92,246,0.06)" }}>
        <p className="text-xs" style={{ color: "#8b5cf6" }}>💡 Les notes sont sauvegardées automatiquement</p>
      </div>
    </div>
  );
}
