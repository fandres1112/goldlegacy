'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SectionTitle } from "@/components/ui/SectionTitle";

export default function RegistroPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
    name: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email.trim(),
          password: form.password,
          name: form.name.trim() || undefined
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "No se pudo crear la cuenta");
      }
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al registrarse");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-page py-12 md:py-16">
      <SectionTitle
        eyebrow="Cuenta"
        title="Crear cuenta"
        description="Regístrate para hacer seguimiento a tus pedidos y disfrutar de una experiencia personalizada."
      />

      <div className="max-w-md mx-auto mt-10">
        <form onSubmit={handleSubmit} className="glass-surface rounded-2xl p-6 md:p-8 border-border space-y-4">
          <div>
            <label className="block text-xs text-muted mb-1">Nombre (opcional)</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              className="w-full rounded-full input-theme border px-4 py-2.5 text-sm outline-none focus:border-gold/80 text-foreground"
              placeholder="Tu nombre"
            />
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              required
              className="w-full rounded-full input-theme border px-4 py-2.5 text-sm outline-none focus:border-gold/80 text-foreground"
              placeholder="tu@email.com"
            />
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">Contraseña (mín. 6 caracteres)</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
              required
              minLength={6}
              className="w-full rounded-full input-theme border px-4 py-2.5 text-sm outline-none focus:border-gold/80 text-foreground"
              placeholder="••••••••"
            />
          </div>
          {error && (
            <p className="text-sm text-red-300">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3 disabled:opacity-60"
          >
            {loading ? "Creando cuenta..." : "Crear cuenta"}
          </button>
          <p className="text-center text-sm text-muted">
            ¿Ya tienes cuenta?{" "}
            <Link href="/iniciar-sesion" className="text-gold hover:text-gold-light">
              Iniciar sesión
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
