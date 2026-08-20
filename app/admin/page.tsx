"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Trash2, Pencil } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

const EMPTY_FORM = { name: "", email: "", password: "", role: "user" };

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState<User | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editForm, setEditForm] = useState({ name: "", role: "user" });
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "loading") return;
    if (!session || session.user.role !== "admin") {
      router.replace("/");
      return;
    }
    fetchUsers();
  }, [session, status, router]);

  const fetchUsers = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/users");
    if (res.ok) setUsers(await res.json());
    setLoading(false);
  };

  const handleCreate = async () => {
    setError("");
    if (!form.name || !form.email || !form.password) {
      setError("Tous les champs sont requis");
      return;
    }
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      const d = await res.json();
      setError(d.error ?? "Erreur");
      return;
    }
    const created = await res.json();
    setUsers((prev) => [...prev, created]);
    setForm(EMPTY_FORM);
    setOpenCreate(false);
  };

  const handleEdit = async () => {
    if (!openEdit) return;
    const res = await fetch(`/api/admin/users/${openEdit.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    if (!res.ok) return;
    const updated = await res.json();
    setUsers((prev) => prev.map((u) => (u.id === updated.id ? { ...u, ...updated } : u)));
    setOpenEdit(null);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Supprimer cet utilisateur ?")) return;
    const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    if (res.ok) setUsers((prev) => prev.filter((u) => u.id !== id));
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-sm font-semibold" style={{ color: "#7c3aed" }}>Chargement…</p>
      </div>
    );
  }

  const adminCount = users.filter((u) => u.role === "admin").length;
  const userCount = users.filter((u) => u.role !== "admin").length;

  return (
    <div className="px-4 pt-8 pb-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-extrabold mb-1" style={{ color: "#3b0764" }}>🛡️ Admin</h1>
      <p className="text-sm mb-6 font-semibold" style={{ color: "#6d28d9" }}>Gestion des utilisateurs</p>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: "Total", value: users.length, emoji: "👥" },
          { label: "Admins", value: adminCount, emoji: "🛡️" },
          { label: "Utilisateurs", value: userCount, emoji: "👤" },
        ].map(({ label, value, emoji }) => (
          <div
            key={label}
            className="rounded-2xl p-4 text-center"
            style={{ background: "#ffffff", border: "1px solid rgba(139,92,246,0.2)", boxShadow: "0 2px 8px rgba(124,58,237,0.08)" }}
          >
            <div className="text-2xl mb-1">{emoji}</div>
            <div className="text-xl font-extrabold" style={{ color: "#3b0764" }}>{value}</div>
            <div className="text-xs font-semibold" style={{ color: "#6d28d9" }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Users table */}
      <div
        className="rounded-3xl overflow-hidden mb-4"
        style={{ border: "1px solid rgba(139,92,246,0.2)", boxShadow: "0 2px 12px rgba(124,58,237,0.1)" }}
      >
        <div className="px-4 py-3 flex items-center justify-between" style={{ background: "rgba(124,58,237,0.06)", borderBottom: "1px solid rgba(139,92,246,0.15)" }}>
          <span className="font-bold text-sm" style={{ color: "#3b0764" }}>Utilisateurs</span>
          <button
            onClick={() => { setForm(EMPTY_FORM); setError(""); setOpenCreate(true); }}
            className="px-3 py-1.5 rounded-xl text-xs font-bold text-white"
            style={{ background: "linear-gradient(135deg, #7c3aed, #ec4899)" }}
          >
            + Ajouter
          </button>
        </div>
        <div className="divide-y" style={{ borderColor: "rgba(139,92,246,0.08)" }}>
          {users.map((u) => (
            <div key={u.id} className="px-4 py-3 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate" style={{ color: "#3b0764" }}>{u.name}</p>
                <p className="text-xs truncate" style={{ color: "#6d28d9" }}>{u.email}</p>
              </div>
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-full shrink-0"
                style={
                  u.role === "admin"
                    ? { background: "rgba(124,58,237,0.12)", color: "#7c3aed" }
                    : { background: "rgba(100,116,139,0.1)", color: "#64748b" }
                }
              >
                {u.role}
              </span>
              <button
                onClick={() => { setOpenEdit(u); setEditForm({ name: u.name, role: u.role }); }}
                className="p-1.5 rounded-lg active:scale-90 transition-transform"
                style={{ color: "#7c3aed" }}
              >
                <Pencil size={14} />
              </button>
              {u.id !== session?.user.id && (
                <button
                  onClick={() => handleDelete(u.id)}
                  className="p-1.5 rounded-lg active:scale-90 transition-transform text-red-500"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Create dialog */}
      <Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <DialogContent className="rounded-3xl mx-4 max-w-sm">
          <DialogHeader>
            <DialogTitle style={{ color: "#3b0764" }}>Nouvel utilisateur</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-2">
            <div className="flex flex-col gap-1">
              <Label className="text-xs" style={{ color: "#3b0764" }}>Prénom</Label>
              <Input className="rounded-2xl" placeholder="ALMA" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs" style={{ color: "#3b0764" }}>Email</Label>
              <Input className="rounded-2xl" type="email" placeholder="test@local.dev" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs" style={{ color: "#3b0764" }}>Mot de passe</Label>
              <Input className="rounded-2xl" type="password" placeholder="Min. 8 caractères" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs" style={{ color: "#3b0764" }}>Rôle</Label>
              <Select value={form.role} onValueChange={(v) => setForm((f) => ({ ...f, role: v ?? f.role }))}>
                <SelectTrigger className="rounded-2xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">user</SelectItem>
                  <SelectItem value="admin">admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
          <DialogFooter>
            <button onClick={handleCreate} className="w-full px-5 py-2.5 rounded-2xl text-white font-bold text-sm" style={{ background: "linear-gradient(135deg, #7c3aed, #ec4899)" }}>
              Créer
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!openEdit} onOpenChange={(o) => !o && setOpenEdit(null)}>
        <DialogContent className="rounded-3xl mx-4 max-w-sm">
          <DialogHeader>
            <DialogTitle style={{ color: "#3b0764" }}>Modifier {openEdit?.name}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-2">
            <div className="flex flex-col gap-1">
              <Label className="text-xs" style={{ color: "#3b0764" }}>Prénom</Label>
              <Input className="rounded-2xl" value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs" style={{ color: "#3b0764" }}>Rôle</Label>
              <Select value={editForm.role} onValueChange={(v) => setEditForm((f) => ({ ...f, role: v ?? f.role }))}>
                <SelectTrigger className="rounded-2xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">user</SelectItem>
                  <SelectItem value="admin">admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <button onClick={handleEdit} className="w-full px-5 py-2.5 rounded-2xl text-white font-bold text-sm" style={{ background: "linear-gradient(135deg, #7c3aed, #ec4899)" }}>
              Enregistrer
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
