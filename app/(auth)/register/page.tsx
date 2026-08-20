import Link from "next/link";

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div
        className="w-full max-w-sm rounded-3xl p-8 text-center"
        style={{
          background: "#ffffff",
          border: "1px solid rgba(124,58,237,0.25)",
          boxShadow: "0 8px 32px rgba(124,58,237,0.18)",
        }}
      >
        <div className="text-5xl mb-4">🔒</div>
        <h1 className="text-2xl font-extrabold mb-2" style={{ color: "#3b0764" }}>
          Inscriptions fermées
        </h1>
        <p className="text-sm mb-6" style={{ color: "#6d28d9" }}>
          Les inscriptions sont désactivées. Contacte l&apos;administrateur pour obtenir un accès.
        </p>
        <Link
          href="/login"
          className="inline-block px-6 py-3 rounded-2xl text-white font-bold text-sm"
          style={{ background: "linear-gradient(135deg, #7c3aed, #ec4899)" }}
        >
          Se connecter
        </Link>
      </div>
    </div>
  );
}
