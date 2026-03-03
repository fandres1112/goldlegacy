'use client';

import { useEffect, useState } from "react";
import { SlidersHorizontal } from "lucide-react";

type AdminUser = {
  id: string;
  name: string | null;
  email: string;
  role: string;
};

export default function AdminSettingsPage() {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [mpEnabled, setMpEnabled] = useState(false);
  const [loadingMp, setLoadingMp] = useState(true);
  const [savingMp, setSavingMp] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        setUser(data.user ?? null);
      } catch {
        setUser(null);
      } finally {
        setLoadingUser(false);
      }
    };
    loadUser();
  }, []);

  useEffect(() => {
    if (!user || user.role !== "ADMIN") return;
    const load = async () => {
      setLoadingMp(true);
      try {
        const res = await fetch("/api/admin/settings/payments", { credentials: "include" });
        const data = await res.json();
        if (res.ok) {
          setMpEnabled(Boolean(data.enabled));
        } else {
          setError(data.error ?? "No se pudo cargar la configuración de pagos.");
        }
      } catch {
        setError("No se pudo cargar la configuración de pagos.");
      } finally {
        setLoadingMp(false);
      }
    };
    load();
  }, [user]);

  const handleToggleMp = async () => {
    setSavingMp(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/settings/payments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ enabled: !mpEnabled })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "No se pudo actualizar la configuración.");
      }
      setMpEnabled(Boolean(data.enabled));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error inesperado al guardar.");
    } finally {
      setSavingMp(false);
    }
  };

  if (loadingUser) {
    return (
      <div className="container-page py-12 md:py-16 text-sm text-muted">
        Verificando sesión...
      </div>
    );
  }

  if (!user || user.role !== "ADMIN") {
    return (
      <div className="container-page py-16 md:py-20 max-w-md">
        <h1 className="heading-section mb-2">Configuración</h1>
        <p className="text-muted text-sm mb-6">
          Debes iniciar sesión con una cuenta de administrador para acceder a la configuración.
        </p>
      </div>
    );
  }

  return (
    <div className="container-page py-12 md:py-16 max-w-3xl">
      <div className="mb-8">
        <h1 className="heading-section text-2xl sm:text-3xl flex items-center gap-2">
          <SlidersHorizontal className="h-7 w-7 text-gold" />
          Configuración
        </h1>
        <p className="text-muted text-sm mt-1">
          Ajusta opciones globales de la tienda como la pasarela de pagos.
        </p>
      </div>

      <div className="space-y-6">
        <section className="glass-surface rounded-2xl border border-border p-6">
          <h2 className="text-sm font-semibold mb-1">Pagos con Mercado Pago</h2>
          <p className="text-xs text-muted mb-4">
            Controla si el checkout redirige a Mercado Pago o solo crea la orden interna marcada como pendiente de pago.
          </p>

          {loadingMp ? (
            <p className="text-xs text-muted">Cargando configuración...</p>
          ) : (
            <div className="flex items-center justify-between gap-4">
              <div className="text-xs text-muted">
                <p>
                  Estado actual:{" "}
                  <span className={mpEnabled ? "text-gold" : "text-red-300"}>
                    {mpEnabled ? "Pagos activados" : "Solo pedidos internos (sin cobro automático)"}
                  </span>
                </p>
              </div>
              <button
                type="button"
                onClick={handleToggleMp}
                disabled={savingMp}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs border border-border bg-foreground/5 hover:bg-foreground/10 transition disabled:opacity-60"
              >
                {savingMp ? "Guardando..." : mpEnabled ? "Desactivar pagos" : "Activar pagos"}
              </button>
            </div>
          )}

          {error && (
            <p className="text-xs text-red-300 mt-3">
              {error}
            </p>
          )}

          <p className="text-[11px] text-muted mt-4">
            Nota: aunque los pagos estén activados, se necesita un <strong>Access Token válido</strong> de Mercado Pago en las variables de entorno para que la pasarela funcione.
          </p>
        </section>
      </div>
    </div>
  );
}

