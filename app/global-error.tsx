"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="es">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#0A0E17", color: "#fff", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
        <div style={{ textAlign: "center", maxWidth: "420px" }}>
          <p style={{ fontSize: "11px", letterSpacing: "0.2em", color: "#D4AF37", marginBottom: "16px" }}>
            Error
          </p>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 600, marginBottom: "12px" }}>
            Algo salió mal
          </h1>
          <p style={{ color: "#9ca3af", fontSize: "14px", marginBottom: "24px" }}>
            Ha ocurrido un error. Por favor, recarga la página o vuelve más tarde.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              background: "#D4AF37",
              color: "#0A0E17",
              border: "none",
              borderRadius: "9999px",
              padding: "12px 24px",
              fontWeight: 600,
              cursor: "pointer",
              fontSize: "14px"
            }}
          >
            Intentar de nuevo
          </button>
        </div>
      </body>
    </html>
  );
}
