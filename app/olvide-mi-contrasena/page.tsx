'use client';

import { useState } from "react";
import Link from "next/link";
import { SectionTitle } from "@/components/ui/SectionTitle";

export default function OlvideMiContrasenaPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al enviar");
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al procesar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-page py-12 md:py-16">
      <SectionTitle
        eyebrow="Cuenta"
        title="¿Olvidaste tu contraseña?"
        description="Indica tu email y te enviaremos un enlace para restablecerla."
      />

      <div className="max-w-md mx-auto mt-10">
        {sent ? (
          <div className="glass-surface rounded-2xl p-6 md:p-8 border-border text-center">
            <p className="text-foreground mb-4">
              Si el email está registrado, recibirás un enlace para restablecer tu contraseña en unos minutos. Revisa también la carpeta de spam.
            </p>
            <Link href="/iniciar-sesion" className="text-gold hover:text-gold-light font-medium">
              Volver a iniciar sesión
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="glass-surface rounded-2xl p-6 md:p-8 border-border space-y-4">
            <div>
              <label className="block text-xs text-muted mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-full input-theme border px-4 py-2.5 text-sm outline-none focus:border-gold/80 text-foreground"
                placeholder="tu@email.com"
              />
            </div>
            {error && <p className="text-sm text-red-300">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 disabled:opacity-60"
            >
              {loading ? "Enviando..." : "Enviar enlace"}
            </button>
            <p className="text-center text-sm text-muted">
              <Link href="/iniciar-sesion" className="text-gold hover:text-gold-light">
                Volver a iniciar sesión
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
