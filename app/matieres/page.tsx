"use client";

import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getMatieres, saveMatieres, type MatiereItem } from "@/lib/storage";

const COULEURS = ["#fb923c", "#60a5fa", "#4ade80", "#a78bfa", "#facc15", "#f472b6", "#34d399", "#f87171", "#94a3b8"];

export default function MatieresPage() {
  const [matieres, setMatieres] = useState<MatiereItem[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ nom: "", emoji: "📚", couleur: "#c4b5fd" });

  useEffect(() => {
    setMatieres(getMatieres());
  }, []);

  const save = (next: MatiereItem[]) => {
    setMatieres(next);
    saveMatieres(next);
  };

  const handleAdd = () => {
    if (!form.nom.trim()) return;
    save([...matieres, { id: crypto.randomUUID(), nom: form.nom.trim(), emoji: form.emoji, couleur: form.couleur }]);
    setForm({ nom: "", emoji: "📚", couleur: "#c4b5fd" });
    setOpen(false);
  };

  const handleDelete = (id: string) => {
    if (!window.confirm("Supprimer cette matière ?")) return;
    save(matieres.filter((m) => m.id !== id));
  };

  return (
    <div className="px-4 pt-8 pb-8 max-w-md mx-auto">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-extrabold" style={{ color: "#3b0764" }}>📚 Matières</h1>
        <button
          onClick={() => setOpen(true)}
          className="px-3 py-2 rounded-2xl text-sm font-bold text-white"
          style={{ background: "linear-gradient(135deg, #7c3aed, #ec4899)" }}
        >
          + Ajouter
        </button>
      </div>
      <p className="text-sm mb-6 font-semibold" style={{ color: "#6d28d9" }}>Personnalise tes matières</p>

      <div className="flex flex-col gap-3">
        {matieres.map((m) => (
          <div
            key={m.id}
            className="rounded-2xl px-4 py-3 flex items-center gap-3"
            style={{ background: "#ffffff", border: "1px solid rgba(139,92,246,0.2)", boxShadow: "0 2px 8px rgba(124,58,237,0.08)" }}
          >
            <span className="text-xl">{m.emoji}</span>
            <span className="font-semibold text-sm flex-1" style={{ color: "#3b0764" }}>{m.nom}</span>
            <div className="w-4 h-4 rounded-full shrink-0" style={{ background: m.couleur }} />
            <button
              onClick={() => handleDelete(m.id)}
              className="p-1.5 rounded-lg active:scale-90 transition-transform text-red-500"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-3xl mx-4 max-w-sm">
          <DialogHeader>
            <DialogTitle style={{ color: "#3b0764" }}>Nouvelle matière</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-2">
            <div className="flex gap-2">
              <div className="flex flex-col gap-1">
                <Label className="text-xs" style={{ color: "#3b0764" }}>Emoji</Label>
                <Input
                  className="rounded-2xl w-20 text-center"
                  value={form.emoji}
                  onChange={(e) => setForm((f) => ({ ...f, emoji: e.target.value }))}
                />
              </div>
              <div className="flex flex-col gap-1 flex-1">
                <Label className="text-xs" style={{ color: "#3b0764" }}>Nom</Label>
                <Input
                  className="rounded-2xl"
                  placeholder="Ex: Informatique"
                  value={form.nom}
                  onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))}
                  onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs" style={{ color: "#3b0764" }}>Couleur</Label>
              <div className="flex gap-2 flex-wrap">
                {COULEURS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setForm((f) => ({ ...f, couleur: c }))}
                    className="w-7 h-7 rounded-full transition-transform active:scale-90"
                    style={{
                      background: c,
                      outline: form.couleur === c ? "2px solid #7c3aed" : "none",
                      outlineOffset: "2px",
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <button
              onClick={handleAdd}
              disabled={!form.nom.trim()}
              className="w-full px-5 py-2.5 rounded-2xl text-white font-bold text-sm disabled:opacity-40"
              style={{ background: "linear-gradient(135deg, #7c3aed, #ec4899)" }}
            >
              + Ajouter
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
