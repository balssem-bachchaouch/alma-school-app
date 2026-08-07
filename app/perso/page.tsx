"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Pencil, Trash2, ChevronLeft } from "lucide-react";
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
import type { TachePerso, Note } from "@/lib/types";
import { getTachesPerso, saveTachesPerso, getNotes, saveNotes } from "@/lib/storage";

const CATEGORIES_TACHE = ["Maison", "Sport", "Loisirs", "Famille", "Autre"];

const CAT_COLORS: Record<string, string> = {
  Maison: "bg-orange-100 text-orange-700",
  Sport: "bg-green-100 text-green-700",
  Loisirs: "bg-blue-100 text-blue-700",
  Famille: "bg-pink-100 text-pink-700",
  Autre: "bg-gray-100 text-gray-700",
};

const NOTE_COLORS = [
  { label: "Blanc",  value: "#ffffff" },
  { label: "Jaune",  value: "#fef9c3" },
  { label: "Rose",   value: "#fce7f3" },
  { label: "Vert",   value: "#dcfce7" },
  { label: "Bleu",   value: "#dbeafe" },
  { label: "Violet", value: "#ede9fe" },
];

const CARD = {
  background: "#ffffff",
  border: "1px solid rgba(139,92,246,0.2)",
  boxShadow: "0 2px 8px rgba(124,58,237,0.08)",
};

type Tab = "taches" | "notes";

const EMPTY_TACHE_FORM = { titre: "", description: "", categorie: "Autre" };
const EMPTY_NOTE_FORM  = { titre: "", contenu: "", couleur: "#fef9c3" };

export default function PersoPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("taches");
  const [loaded, setLoaded] = useState(false);

  // ── TÂCHES ──
  const [taches, setTaches] = useState<TachePerso[]>([]);
  const [openTache, setOpenTache] = useState(false);
  const [editingTache, setEditingTache] = useState<TachePerso | null>(null);
  const [tacheForm, setTacheForm] = useState(EMPTY_TACHE_FORM);

  // ── NOTES ──
  const [notes, setNotes] = useState<Note[]>([]);
  const [openNote, setOpenNote] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [noteForm, setNoteForm] = useState(EMPTY_NOTE_FORM);
  const [viewNote, setViewNote] = useState<Note | null>(null);

  useEffect(() => {
    setTaches(getTachesPerso());
    setNotes(getNotes());
    setLoaded(true);
  }, []);

  // ── tâche handlers ──
  const openAddTache = () => {
    setEditingTache(null);
    setTacheForm(EMPTY_TACHE_FORM);
    setOpenTache(true);
  };

  const openEditTache = (t: TachePerso) => {
    setEditingTache(t);
    setTacheForm({ titre: t.titre, description: t.description ?? "", categorie: t.categorie });
    setOpenTache(true);
  };

  const handleSaveTache = () => {
    if (!tacheForm.titre) return;
    let next: TachePerso[];
    if (editingTache) {
      next = taches.map((t) =>
        t.id === editingTache.id
          ? { ...t, titre: tacheForm.titre, description: tacheForm.description || undefined, categorie: tacheForm.categorie }
          : t
      );
    } else {
      next = [
        ...taches,
        {
          id: crypto.randomUUID(),
          titre: tacheForm.titre,
          description: tacheForm.description || undefined,
          categorie: tacheForm.categorie,
          completed: false,
          createdAt: new Date().toISOString(),
        },
      ];
    }
    setTaches(next);
    saveTachesPerso(next);
    setOpenTache(false);
  };

  const toggleTache = (id: string) => {
    const next = taches.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t));
    setTaches(next);
    saveTachesPerso(next);
  };

  const deleteTache = (id: string) => {
    if (!window.confirm("Supprimer cette tâche ?")) return;
    const next = taches.filter((t) => t.id !== id);
    setTaches(next);
    saveTachesPerso(next);
  };

  const sortedTaches = [...taches].sort((a, b) => {
    if (a.completed === b.completed) return 0;
    return a.completed ? 1 : -1;
  });

  // ── note handlers ──
  const openAddNote = () => {
    setEditingNote(null);
    setNoteForm(EMPTY_NOTE_FORM);
    setOpenNote(true);
  };

  const openEditNote = (n: Note) => {
    setEditingNote(n);
    setNoteForm({ titre: n.titre, contenu: n.contenu, couleur: n.couleur });
    setViewNote(null);
    setOpenNote(true);
  };

  const handleSaveNote = () => {
    if (!noteForm.titre) return;
    const now = new Date().toISOString();
    let next: Note[];
    if (editingNote) {
      next = notes.map((n) =>
        n.id === editingNote.id ? { ...n, ...noteForm, updatedAt: now } : n
      );
    } else {
      next = [{ id: crypto.randomUUID(), ...noteForm, updatedAt: now }, ...notes];
    }
    setNotes(next);
    saveNotes(next);
    setOpenNote(false);
  };

  const deleteNote = (id: string) => {
    if (!window.confirm("Supprimer cette note ?")) return;
    const next = notes.filter((n) => n.id !== id);
    setNotes(next);
    saveNotes(next);
    setViewNote(null);
  };

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "2-digit" });

  if (!loaded) return null;

  return (
    <div className="px-4 pt-6 pb-24 max-w-md mx-auto">

      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-xl active:scale-90 transition-transform"
          style={{ color: "#7c3aed" }}
        >
          <ChevronLeft size={22} />
        </button>
        <h1 className="text-2xl font-extrabold" style={{ color: "#3b0764" }}>✨ Perso</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 mb-6 p-1 rounded-2xl" style={{ background: "#ede9fe" }}>
        {([ ["taches", "✅ Mes Tâches"], ["notes", "📝 Mes Notes"] ] as [Tab, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className="flex-1 py-2 rounded-xl text-sm font-bold transition-all"
            style={
              tab === key
                ? { background: "#ffffff", color: "#7c3aed", boxShadow: "0 1px 4px rgba(124,58,237,0.15)" }
                : { background: "transparent", color: "#6d28d9" }
            }
          >
            {label}
          </button>
        ))}
      </div>

      {/* ══════════════ TAB TÂCHES ══════════════ */}
      {tab === "taches" && (
        <>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: "#3b0764" }}>
              Tâches personnelles
            </h2>
            <button
              onClick={openAddTache}
              className="flex items-center gap-1 text-white px-3 py-1.5 rounded-xl text-xs font-bold active:scale-95 transition-transform"
              style={{ background: "linear-gradient(135deg, #7c3aed, #ec4899)" }}
            >
              + Ajouter
            </button>
          </div>

          {sortedTaches.length === 0 ? (
            <p className="text-center py-12 text-sm" style={{ color: "#6d28d9" }}>
              ✨ Aucune tâche — profites-en !
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              <AnimatePresence>
                {sortedTaches.map((t) => (
                  <motion.div
                    key={t.id}
                    layout
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: t.completed ? 0.5 : 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="rounded-2xl p-4 flex items-start gap-3"
                    style={CARD}
                  >
                    {/* Checkbox */}
                    <button
                      onClick={() => toggleTache(t.id)}
                      className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all active:scale-90"
                      style={
                        t.completed
                          ? { background: "#7c3aed", borderColor: "#7c3aed" }
                          : { borderColor: "rgba(124,58,237,0.35)", background: "transparent" }
                      }
                    >
                      {t.completed && (
                        <svg width="10" height="8" viewBox="0 0 13 10" fill="none">
                          <path d="M1.5 5L5 8.5L11.5 1" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <p
                        className={`font-bold text-sm ${t.completed ? "line-through" : ""}`}
                        style={{ color: "#3b0764" }}
                      >
                        {t.titre}
                      </p>
                      {t.description && (
                        <p className="text-xs mt-0.5" style={{ color: "#6d28d9" }}>{t.description}</p>
                      )}
                      <span className={`mt-1.5 inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${CAT_COLORS[t.categorie] ?? CAT_COLORS["Autre"]}`}>
                        {t.categorie}
                      </span>
                    </div>

                    <div className="flex gap-0.5 flex-shrink-0">
                      <button
                        onClick={() => openEditTache(t)}
                        className="p-1.5 rounded-lg active:scale-90 transition-transform"
                        style={{ color: "#7c3aed" }}
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => deleteTache(t.id)}
                        className="p-1.5 rounded-lg active:scale-90 transition-transform text-red-500"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* Dialog tâche */}
          <Dialog open={openTache} onOpenChange={setOpenTache}>
            <DialogContent className="rounded-3xl mx-4 max-w-sm">
              <DialogHeader>
                <DialogTitle style={{ color: "#3b0764" }}>
                  {editingTache ? "Modifier la tâche" : "Ajouter une tâche"}
                </DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-4 py-2">
                <div className="flex flex-col gap-1.5">
                  <Label style={{ color: "#3b0764" }}>Titre</Label>
                  <Input
                    className="rounded-2xl"
                    placeholder="Ex: Faire le ménage"
                    value={tacheForm.titre}
                    onChange={(e) => setTacheForm((f) => ({ ...f, titre: e.target.value }))}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label style={{ color: "#3b0764" }}>Description (optionnel)</Label>
                  <Input
                    className="rounded-2xl"
                    placeholder="Détails..."
                    value={tacheForm.description}
                    onChange={(e) => setTacheForm((f) => ({ ...f, description: e.target.value }))}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label style={{ color: "#3b0764" }}>Catégorie</Label>
                  <Select
                    value={tacheForm.categorie}
                    onValueChange={(v) => setTacheForm((f) => ({ ...f, categorie: v ?? f.categorie }))}
                  >
                    <SelectTrigger className="rounded-2xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES_TACHE.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter className="gap-2">
                <button
                  onClick={() => setOpenTache(false)}
                  className="px-4 py-2 rounded-2xl font-semibold text-sm"
                  style={{ color: "#7c3aed" }}
                >
                  Annuler
                </button>
                <button
                  onClick={handleSaveTache}
                  disabled={!tacheForm.titre}
                  className="px-5 py-2 rounded-2xl text-white font-bold text-sm disabled:opacity-40"
                  style={{ background: "linear-gradient(135deg, #7c3aed, #ec4899)" }}
                >
                  {editingTache ? "Modifier" : "Ajouter"}
                </button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}

      {/* ══════════════ TAB NOTES ══════════════ */}
      {tab === "notes" && (
        <>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: "#3b0764" }}>
              Mes notes
            </h2>
            <button
              onClick={openAddNote}
              className="flex items-center gap-1 text-white px-3 py-1.5 rounded-xl text-xs font-bold active:scale-95 transition-transform"
              style={{ background: "linear-gradient(135deg, #7c3aed, #ec4899)" }}
            >
              + Nouvelle note
            </button>
          </div>

          {notes.length === 0 ? (
            <p className="text-center py-12 text-sm" style={{ color: "#6d28d9" }}>
              📝 Aucune note — écris quelque chose !
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {notes.map((n) => (
                <div
                  key={n.id}
                  onClick={() => setViewNote(n)}
                  className="rounded-2xl p-3 cursor-pointer active:scale-95 transition-transform"
                  style={{
                    background: n.couleur,
                    border: "1px solid rgba(139,92,246,0.15)",
                    boxShadow: "0 2px 8px rgba(124,58,237,0.08)",
                    minHeight: "110px",
                  }}
                >
                  <p className="font-bold text-sm mb-1 line-clamp-2" style={{ color: "#3b0764" }}>{n.titre}</p>
                  <p className="text-xs line-clamp-3" style={{ color: "#4c1d95", opacity: 0.85 }}>{n.contenu}</p>
                  <p className="text-xs mt-2 text-right" style={{ color: "#6d28d9" }}>{fmtDate(n.updatedAt)}</p>
                </div>
              ))}
            </div>
          )}

          {/* Dialog: view note */}
          <Dialog open={!!viewNote} onOpenChange={(o) => !o && setViewNote(null)}>
            <DialogContent className="rounded-3xl mx-4 max-w-sm">
              {viewNote && (
                <>
                  <DialogHeader>
                    <DialogTitle style={{ color: "#3b0764" }}>{viewNote.titre}</DialogTitle>
                  </DialogHeader>
                  <div className="py-2 max-h-64 overflow-y-auto">
                    <p className="text-sm whitespace-pre-wrap" style={{ color: "#4c1d95" }}>{viewNote.contenu}</p>
                    <p className="text-xs mt-4 text-right" style={{ color: "#6d28d9" }}>
                      Modifiée le {fmtDate(viewNote.updatedAt)}
                    </p>
                  </div>
                  <DialogFooter className="gap-2">
                    <button
                      onClick={() => deleteNote(viewNote.id)}
                      className="px-4 py-2 rounded-2xl font-semibold text-sm text-red-500"
                    >
                      Supprimer
                    </button>
                    <button
                      onClick={() => openEditNote(viewNote)}
                      className="px-5 py-2 rounded-2xl text-white font-bold text-sm"
                      style={{ background: "linear-gradient(135deg, #7c3aed, #ec4899)" }}
                    >
                      ✏️ Modifier
                    </button>
                  </DialogFooter>
                </>
              )}
            </DialogContent>
          </Dialog>

          {/* Dialog: add/edit note form */}
          <Dialog open={openNote} onOpenChange={setOpenNote}>
            <DialogContent className="rounded-3xl mx-4 max-w-sm">
              <DialogHeader>
                <DialogTitle style={{ color: "#3b0764" }}>
                  {editingNote ? "Modifier la note" : "Nouvelle note"}
                </DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-4 py-2">
                <div className="flex flex-col gap-1.5">
                  <Label style={{ color: "#3b0764" }}>Titre</Label>
                  <Input
                    className="rounded-2xl"
                    placeholder="Titre de la note"
                    value={noteForm.titre}
                    onChange={(e) => setNoteForm((f) => ({ ...f, titre: e.target.value }))}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label style={{ color: "#3b0764" }}>Contenu</Label>
                  <textarea
                    rows={5}
                    className="w-full rounded-2xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 resize-none"
                    placeholder="Écris ta note ici..."
                    value={noteForm.contenu}
                    onChange={(e) => setNoteForm((f) => ({ ...f, contenu: e.target.value }))}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label style={{ color: "#3b0764" }}>Couleur</Label>
                  <div className="flex gap-2 flex-wrap">
                    {NOTE_COLORS.map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => setNoteForm((f) => ({ ...f, couleur: c.value }))}
                        className="w-8 h-8 rounded-full transition-all active:scale-90"
                        style={{
                          background: c.value,
                          border: noteForm.couleur === c.value
                            ? "3px solid #7c3aed"
                            : "2px solid rgba(139,92,246,0.3)",
                          transform: noteForm.couleur === c.value ? "scale(1.15)" : "scale(1)",
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter className="gap-2">
                <button
                  onClick={() => setOpenNote(false)}
                  className="px-4 py-2 rounded-2xl font-semibold text-sm"
                  style={{ color: "#7c3aed" }}
                >
                  Annuler
                </button>
                <button
                  onClick={handleSaveNote}
                  disabled={!noteForm.titre}
                  className="px-5 py-2 rounded-2xl text-white font-bold text-sm disabled:opacity-40"
                  style={{ background: "linear-gradient(135deg, #7c3aed, #ec4899)" }}
                >
                  Enregistrer
                </button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}
