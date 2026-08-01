"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { loginAction } from "@/app/actions/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const err = await loginAction(email, password);
    setLoading(false);
    if (err) {
      setError(err);
    } else {
      router.push("/");
      router.refresh();
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "var(--space-bg)" }}
    >
      <div
        className="w-full max-w-sm rounded-3xl p-8"
        style={{
          background: "var(--space-card)",
          border: "1px solid var(--space-card-border)",
        }}
      >
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🐱</div>
          <h1 className="text-2xl font-extrabold text-white">Connexion</h1>
          <p className="text-sm mt-1" style={{ color: "#a78bfa" }}>
            Bienvenue sur ALMA 🚀
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold" style={{ color: "#e9d5ff" }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="alma@test.com"
              className="rounded-2xl px-4 py-3 text-white text-sm outline-none focus:ring-2 focus:ring-violet-500"
              style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(139,92,246,0.3)" }}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold" style={{ color: "#e9d5ff" }}>
              Mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="rounded-2xl px-4 py-3 text-white text-sm outline-none focus:ring-2 focus:ring-violet-500"
              style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(139,92,246,0.3)" }}
            />
          </div>

          {error && (
            <p className="text-sm text-red-400 text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 py-3 rounded-2xl text-white font-bold text-sm disabled:opacity-50 active:scale-95 transition-transform"
            style={{ background: "linear-gradient(135deg, #8b5cf6, #ec4899)" }}
          >
            {loading ? "Connexion…" : "Se connecter"}
          </button>
        </form>

        <p className="text-center text-sm mt-6" style={{ color: "#a78bfa" }}>
          Pas encore de compte ?{" "}
          <Link href="/register" className="font-bold text-white underline">
            S&apos;inscrire
          </Link>
        </p>
      </div>
    </div>
  );
}
