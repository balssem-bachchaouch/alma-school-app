"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, ChevronLeft, ChevronRight, RotateCcw, Eye } from "lucide-react";
import { getFlashcards, saveFlashcards, getGameStats, saveGameStats } from "@/lib/storage";
import { addXP, XP_GAINS } from "@/lib/xp";
import type { Flashcard } from "@/lib/types";

const MATIERES = ["Mathématiques", "Français", "Arabe", "Sciences", "Anglais", "Histoire-Géo", "Autre"];
const MAT_COLORS: Record<string, string> = {
  "Mathématiques": "#f97316", "Français": "#3b82f6", "Arabe": "#10b981",
  "Sciences": "#8b5cf6", "Anglais": "#eab308", "Histoire-Géo": "#ec4899", "Autre": "#6b7280",
};

type View = "list" | "study";

export default function FlashcardsPage() {
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [view, setView] = useState<View>("list");
  const [studyCards, setStudyCards] = useState<Flashcard[]>([]);
  const [studyIdx, setStudyIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ matiere: "Mathématiques", front: "", back: "" });
  const [filterMat, setFilterMat] = useState("Tout");
  const [toast, setToast] = useState<string | null>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    setCards(getFlashcards());
  }, []);

  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(null), 2000); };

  const addCard = () => {
    if (!form.front.trim() || !form.back.trim()) return;
    const newCard: Flashcard = { id: crypto.randomUUID(), ...form, known: false, createdAt: new Date().toISOString() };
    const updated = [newCard, ...cards];
    setCards(updated);
    saveFlashcards(updated);
    const stats = addXP(getGameStats(), XP_GAINS.flashcard_created);
    saveGameStats(stats);
    setForm(f => ({ ...f, front: "", back: "" }));
    setShowAdd(false);
    showToast("🃏 Carte ajoutée ! +5 XP");
  };

  const deleteCard = (id: string) => {
    const updated = cards.filter(c => c.id !== id);
    setCards(updated);
    saveFlashcards(updated);
  };

  const startStudy = (filtered: Flashcard[]) => {
    const shuffled = [...filtered].sort(() => Math.random() - 0.5);
    setStudyCards(shuffled);
    setStudyIdx(0);
    setFlipped(false);
    setView("study");
  };

  const markKnown = (known: boolean) => {
    const card = studyCards[studyIdx];
    const updated = cards.map(c => c.id === card.id ? { ...c, known } : c);
    setCards(updated);
    saveFlashcards(updated);
    if (studyIdx < studyCards.length - 1) {
      setStudyIdx(i => i + 1);
      setFlipped(false);
    } else {
      showToast("🎉 Session terminée !");
      setView("list");
    }
  };

  const filtered = filterMat === "Tout" ? cards : cards.filter(c => c.matiere === filterMat);
  const knownCount = cards.filter(c => c.known).length;

  if (view === "study" && studyCards.length > 0) {
    const card = studyCards[studyIdx];
    const color = MAT_COLORS[card.matiere] ?? "#7c3aed";

    return (
      <div className="pt-6 pb-28 px-4 max-w-sm mx-auto flex flex-col items-center">
        <div className="flex items-center justify-between w-full mb-6">
          <button onClick={() => setView("list")} className="text-sm font-bold px-3 py-1.5 rounded-xl"
            style={{ background: "rgba(124,58,237,0.1)", color: "#7c3aed" }}>
            ← Retour
          </button>
          <span className="text-sm font-bold" style={{ color: "#6b7280" }}>
            {studyIdx + 1}/{studyCards.length}
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full h-2 rounded-full mb-6" style={{ background: "rgba(139,92,246,0.1)" }}>
          <motion.div className="h-full rounded-full" style={{ background: color }}
            animate={{ width: `${((studyIdx + 1) / studyCards.length) * 100}%` }}
            transition={{ duration: 0.3 }} />
        </div>

        <span className="text-xs font-bold px-3 py-1 rounded-full mb-4"
          style={{ background: color + "20", color }}>
          {card.matiere}
        </span>

        {/* Flip card */}
        <div className="relative w-full" style={{ height: 220, perspective: 800 }}
          onClick={() => setFlipped(f => !f)}>
          <motion.div className="absolute inset-0" style={{ transformStyle: "preserve-3d" }}
            animate={{ rotateY: flipped ? 180 : 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}>
            {/* Front */}
            <div className="absolute inset-0 rounded-3xl flex flex-col items-center justify-center p-6 cursor-pointer"
              style={{ background: "#fff", border: `2px solid ${color}30`, backfaceVisibility: "hidden",
                boxShadow: `0 8px 32px ${color}20` }}>
              <span className="text-xs font-bold mb-3 uppercase tracking-widest" style={{ color }}>Question</span>
              <p className="text-center text-lg font-bold" style={{ color: "#3b0764" }}>{card.front}</p>
              <p className="text-xs mt-4" style={{ color: "#9ca3af" }}>Tape pour révéler</p>
            </div>
            {/* Back */}
            <div className="absolute inset-0 rounded-3xl flex flex-col items-center justify-center p-6 cursor-pointer"
              style={{ background: color + "10", border: `2px solid ${color}40`, backfaceVisibility: "hidden",
                transform: "rotateY(180deg)", boxShadow: `0 8px 32px ${color}30` }}>
              <span className="text-xs font-bold mb-3 uppercase tracking-widest" style={{ color }}>Réponse</span>
              <p className="text-center text-lg font-bold" style={{ color: "#3b0764" }}>{card.back}</p>
            </div>
          </motion.div>
        </div>

        <p className="text-xs mt-3 mb-6" style={{ color: "#9ca3af" }}>
          {flipped ? "Est-ce que tu savais ?" : "Tape la carte pour voir la réponse"}
        </p>

        {flipped && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3 w-full">
            <motion.button whileTap={{ scale: 0.92 }} onClick={() => markKnown(false)}
              className="flex-1 py-3 rounded-2xl text-sm font-bold"
              style={{ background: "rgba(239,68,68,0.1)", color: "#dc2626" }}>
              😕 À revoir
            </motion.button>
            <motion.button whileTap={{ scale: 0.92 }} onClick={() => markKnown(true)}
              className="flex-1 py-3 rounded-2xl text-sm font-bold text-white"
              style={{ background: "linear-gradient(135deg,#10b981,#059669)" }}>
              ✅ Je sais !
            </motion.button>
          </motion.div>
        )}
      </div>
    );
  }

  return (
    <div className="pt-6 pb-28 px-4 max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-extrabold" style={{ color: "#3b0764" }}>🃏 Flashcards</h1>
          <p className="text-xs mt-0.5" style={{ color: "#8b5cf6" }}>{knownCount}/{cards.length} cartes maîtrisées</p>
        </div>
        <motion.button whileTap={{ scale: 0.92 }} onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 text-white px-4 py-2 rounded-2xl text-sm font-bold shadow-sm"
          style={{ background: "linear-gradient(135deg, #7c3aed, #ec4899)" }}>
          <Plus size={15} /> Créer
        </motion.button>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-2 mb-5">
        {[
          { v: cards.length, l: "Total", c: "#7c3aed" },
          { v: knownCount, l: "Maîtrisées", c: "#10b981" },
          { v: cards.length - knownCount, l: "À revoir", c: "#f59e0b" },
        ].map(s => (
          <div key={s.l} className="rounded-2xl p-3 text-center" style={{ background: s.c + "12" }}>
            <p className="text-xl font-extrabold" style={{ color: s.c }}>{s.v}</p>
            <p className="text-xs" style={{ color: s.c }}>{s.l}</p>
          </div>
        ))}
      </div>

      {/* Filter + study button */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {["Tout", ...MATIERES].map(m => (
          <button key={m} onClick={() => setFilterMat(m)}
            className="flex-shrink-0 px-3 py-1 rounded-full text-xs font-bold transition-all"
            style={filterMat === m
              ? { background: MAT_COLORS[m] ?? "#7c3aed", color: "#fff" }
              : { background: (MAT_COLORS[m] ?? "#7c3aed") + "15", color: MAT_COLORS[m] ?? "#7c3aed" }
            }>{m}</button>
        ))}
      </div>

      {filtered.length > 0 && (
        <motion.button whileTap={{ scale: 0.96 }} onClick={() => startStudy(filtered)}
          className="w-full py-3 rounded-2xl text-white font-bold text-sm mb-4 flex items-center justify-center gap-2"
          style={{ background: "linear-gradient(135deg, #7c3aed, #ec4899)" }}>
          <Eye size={16} /> Réviser {filtered.length} carte{filtered.length > 1 ? "s" : ""}
        </motion.button>
      )}

      {/* Cards list */}
      {filtered.length === 0 ? (
        <div className="text-center py-14">
          <p className="text-4xl mb-3">🃏</p>
          <p className="font-bold text-sm" style={{ color: "#6b7280" }}>Aucune carte</p>
          <p className="text-xs" style={{ color: "#9ca3af" }}>Crée ta première flashcard !</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((card, i) => {
            const color = MAT_COLORS[card.matiere] ?? "#7c3aed";
            return (
              <motion.div key={card.id}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, type: "spring", stiffness: 280 }}
                className="rounded-3xl p-4"
                style={{ background: "#fff", border: `1.5px solid ${color}20`, boxShadow: "0 2px 12px rgba(124,58,237,0.06)" }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: color + "15", color }}>
                        {card.matiere}
                      </span>
                      {card.known && <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: "#d1fae5", color: "#10b981" }}>✓ Su</span>}
                    </div>
                    <p className="text-sm font-bold" style={{ color: "#3b0764" }}>{card.front}</p>
                    <p className="text-xs mt-1" style={{ color: "#8b5cf6" }}>{card.back}</p>
                  </div>
                  <button onClick={() => deleteCard(card.id)} className="p-1.5 rounded-xl flex-shrink-0"
                    style={{ color: "#fca5a5", background: "rgba(239,68,68,0.06)" }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Add card dialog */}
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center"
            style={{ background: "rgba(0,0,0,0.4)" }}
            onClick={e => { if (e.target === e.currentTarget) setShowAdd(false); }}>
            <motion.div initial={{ y: 60 }} animate={{ y: 0 }} exit={{ y: 60 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              className="w-full max-w-md rounded-t-3xl p-6"
              style={{ background: "#fff" }}>
              <h2 className="text-lg font-extrabold mb-4" style={{ color: "#3b0764" }}>🃏 Nouvelle flashcard</h2>
              <div className="flex flex-col gap-3">
                <div>
                  <label className="text-xs font-bold block mb-1" style={{ color: "#3b0764" }}>Matière</label>
                  <div className="flex gap-1.5 flex-wrap">
                    {MATIERES.map(m => {
                      const c = MAT_COLORS[m] ?? "#7c3aed";
                      return (
                        <button key={m} onClick={() => setForm(f => ({ ...f, matiere: m }))}
                          className="px-2.5 py-1 rounded-xl text-xs font-bold transition-all"
                          style={form.matiere === m ? { background: c, color: "#fff" } : { background: c + "15", color: c }}>
                          {m}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold block mb-1" style={{ color: "#3b0764" }}>Question (recto)</label>
                  <input className="w-full rounded-2xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                    style={{ borderColor: "rgba(139,92,246,0.3)" }}
                    placeholder="ex. Qu'est-ce que la photosynthèse ?"
                    value={form.front} onChange={e => setForm(f => ({ ...f, front: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs font-bold block mb-1" style={{ color: "#3b0764" }}>Réponse (verso)</label>
                  <textarea className="w-full rounded-2xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 resize-none"
                    style={{ borderColor: "rgba(139,92,246,0.3)", minHeight: 72 }}
                    placeholder="ex. Processus par lequel les plantes produisent de l'énergie..."
                    value={form.back} onChange={e => setForm(f => ({ ...f, back: e.target.value }))} />
                </div>
                <div className="flex gap-2 mt-1">
                  <button onClick={() => setShowAdd(false)}
                    className="flex-1 py-2.5 rounded-2xl font-semibold text-sm" style={{ color: "#7c3aed" }}>
                    Annuler
                  </button>
                  <motion.button whileTap={{ scale: 0.94 }} onClick={addCard}
                    disabled={!form.front.trim() || !form.back.trim()}
                    className="flex-1 py-2.5 rounded-2xl text-white font-bold text-sm disabled:opacity-40"
                    style={{ background: "linear-gradient(135deg,#7c3aed,#ec4899)" }}>
                    Ajouter
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 26 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl text-sm font-bold text-white whitespace-nowrap"
            style={{ background: "linear-gradient(135deg, #7c3aed, #ec4899)" }}>
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
