'use client';

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { SectionTitle } from "@/components/ui/SectionTitle";

function RestablecerForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) setError("Falta el enlace de restablecimiento. Solicita uno nuevo.");
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al restablecer");
      setSuccess(true);
      setTimeout(() => router.push("/iniciar-sesion"), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al restablecer");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="container-page py-12 md:py-16">
        <SectionTitle
          eyebrow="Cuenta"
          title="Restablecer contraseña"
          description="Usa el enlace que te enviamos por email."
        />
        <div className="max-w-md mx-auto mt-10 glass-surface rounded-2xl p-6 border-border text-center">
          <p className="text-foreground-muted mb-4">Falta el enlace de restablecimiento. Solicita uno nuevo desde la página de inicio de sesión.</p>
          <Link href="/olvide-mi-contrasena" className="text-gold hover:text-gold-light font-medium">
            Solicitar nuevo enlace
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="container-page py-12 md:py-16">
        <SectionTitle eyebrow="Cuenta" title="Contraseña actualizada" description="Redirigiendo a inicio de sesión..." />
        <div className="max-w-md mx-auto mt-10 glass-surface rounded-2xl p-6 border-border text-center">
          <p className="text-foreground">Tu contraseña se actualizó correctamente. Ya puedes iniciar sesión.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-page py-12 md:py-16">
      <SectionTitle
        eyebrow="Cuenta"
        title="Nueva contraseña"
        description="Elige una contraseña de al menos 6 caracteres."
      />

      <div className="max-w-md mx-auto mt-10">
        <form onSubmit={handleSubmit} className="glass-surface rounded-2xl p-6 md:p-8 border-border space-y-4">
          <div>
            <label className="block text-xs text-muted mb-1">Nueva contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full rounded-full input-theme border px-4 py-2.5 text-sm outline-none focus:border-gold/80 text-foreground"
              placeholder="••••••••"
            />
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">Confirmar contraseña</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              minLength={6}
              className="w-full rounded-full input-theme border px-4 py-2.5 text-sm outline-none focus:border-gold/80 text-foreground"
              placeholder="••••••••"
            />
          </div>
          {error && <p className="text-sm text-red-300">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3 disabled:opacity-60"
          >
            {loading ? "Guardando..." : "Restablecer contraseña"}
          </button>
          <p className="text-center text-sm text-muted">
            <Link href="/iniciar-sesion" className="text-gold hover:text-gold-light">
              Volver a iniciar sesión
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default function RestablecerContrasenaPage() {
  return (
    <Suspense
      fallback={
        <div className="container-page py-12 md:py-16">
          <SectionTitle eyebrow="Cuenta" title="Restablecer contraseña" description="Cargando..." />
          <div className="max-w-md mx-auto mt-10 h-64 rounded-2xl border border-border bg-background/50 animate-pulse" />
        </div>
      }
    >
      <RestablecerForm />
    </Suspense>
  );
}
