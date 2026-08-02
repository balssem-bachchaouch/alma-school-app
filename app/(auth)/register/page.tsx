"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Erreur lors de l'inscription");
      return;
    }

    router.push("/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div
        className="w-full max-w-sm rounded-3xl p-8"
        style={{
          background: "#ffffff",
          border: "1px solid rgba(124,58,237,0.25)",
          boxShadow: "0 8px 32px rgba(124,58,237,0.18)",
        }}
      >
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">✨</div>
          <h1 className="text-2xl font-extrabold" style={{ color: "#3b0764" }}>Créer un compte</h1>
          <p className="text-sm mt-1" style={{ color: "#6d28d9" }}>
            Rejoins l&apos;aventure ALMA 🚀
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold" style={{ color: "#3b0764" }}>
              Prénom
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="ALMA"
              className="rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-violet-400"
              style={{
                background: "#f5f3ff",
                border: "1px solid rgba(124,58,237,0.25)",
                color: "#3b0764",
              }}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold" style={{ color: "#3b0764" }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="test@local.dev"
              className="rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-violet-400"
              style={{
                background: "#f5f3ff",
                border: "1px solid rgba(124,58,237,0.25)",
                color: "#3b0764",
              }}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold" style={{ color: "#3b0764" }}>
              Mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              placeholder="Min. 8 caractères"
              className="rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-violet-400"
              style={{
                background: "#f5f3ff",
                border: "1px solid rgba(124,58,237,0.25)",
                color: "#3b0764",
              }}
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 py-3 rounded-2xl text-white font-bold text-sm disabled:opacity-50 active:scale-95 transition-transform"
            style={{ background: "linear-gradient(135deg, #7c3aed, #ec4899)" }}
          >
            {loading ? "Création…" : "Créer mon compte"}
          </button>
        </form>

        <p className="text-center text-sm mt-6" style={{ color: "#6d28d9" }}>
          Déjà un compte ?{" "}
          <Link href="/login" className="font-bold underline" style={{ color: "#7c3aed" }}>
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
