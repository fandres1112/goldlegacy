'use client';

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { SectionTitle } from "@/components/ui/SectionTitle";

const GOOGLE_ERROR_MESSAGES: Record<string, string> = {
  google_denied: "Cancelaste el acceso con Google.",
  google_not_configured: "Inicio con Google no está configurado.",
  invalid_callback: "Respuesta inválida de Google.",
  invalid_state: "Sesión de seguridad expirada. Intenta de nuevo.",
  google_token: "Error al conectar con Google. Intenta más tarde.",
  google_userinfo: "No se pudo obtener tu información de Google.",
  no_email: "Tu cuenta de Google no comparte el email."
};

function IniciarSesionForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });

  useEffect(() => {
    const err = searchParams.get("error");
    if (err && GOOGLE_ERROR_MESSAGES[err]) {
      setError(GOOGLE_ERROR_MESSAGES[err]);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Credenciales inválidas");
      }
      if (data.user?.role === "ADMIN") {
        router.push("/admin");
      } else {
        router.push("/");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-page py-12 md:py-16">
      <SectionTitle
        eyebrow="Cuenta"
        title="Iniciar sesión"
        description="Accede a tu cuenta para ver tus pedidos y gestionar tu experiencia."
      />

      <div className="max-w-md mx-auto mt-10">
        <form onSubmit={handleSubmit} className="glass-surface rounded-2xl p-6 md:p-8 border-border space-y-4">
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
            <label className="block text-xs text-muted mb-1">Contraseña</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
              required
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
            {loading ? "Entrando..." : "Entrar"}
          </button>

          <div className="relative my-6">
            <span className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </span>
            <span className="relative flex justify-center text-xs text-foreground-muted">
              o continúa con
            </span>
          </div>

          <Link
            href="/api/auth/google"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-full border border-border bg-background hover:bg-foreground/5 transition-colors text-sm font-medium"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continuar con Google
          </Link>

          <p className="text-center text-sm text-muted">
            ¿No tienes cuenta?{" "}
            <Link href="/registro" className="text-gold hover:text-gold-light">
              Crear cuenta
            </Link>
          </p>
          <p className="text-center text-xs text-muted">
            <Link href="/admin" className="text-foreground-muted hover:text-gold">
              Panel de administración
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default function IniciarSesionPage() {
  return (
    <Suspense fallback={
      <div className="container-page py-12 md:py-16">
        <SectionTitle eyebrow="Cuenta" title="Iniciar sesión" description="Accede a tu cuenta." />
        <div className="max-w-md mx-auto mt-10 h-64 rounded-2xl border border-border bg-background/50 animate-pulse" />
      </div>
    }>
      <IniciarSesionForm />
    </Suspense>
  );
}
