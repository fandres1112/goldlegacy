import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border mt-16">
      <div className="container-page py-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 text-sm text-muted">
        <div>
          <p className="font-display text-base text-foreground mb-1">
            Gold Legacy
          </p>
          <p className="text-[11px] uppercase tracking-[0.25em] text-gold-light mb-1">
            Tradición familiar hecha joya
          </p>
          <p className="max-w-md">
            Joyería en oro minimalista diseñada para acompañar tus momentos más
            importantes con elegancia atemporal.
          </p>
        </div>
        <div className="flex gap-8">
          <div className="space-y-1">
            <p className="text-foreground font-medium">Colección</p>
            <Link href="/catalogo" className="block hover:text-gold-light">
              Ver catálogo
            </Link>
          </div>
          <div className="space-y-1">
            <p className="text-foreground font-medium">Marca</p>
            <Link href="/sobre-nosotros" className="block hover:text-gold-light">
              Sobre nosotros
            </Link>
          </div>
        </div>
      </div>
      <div className="border-t border-border py-4">
        <div className="container-page flex items-center justify-between text-[11px] text-foreground-muted">
          <span>© {new Date().getFullYear()} Gold Legacy. Todos los derechos reservados.</span>
          <span>Diseñado para una experiencia de lujo minimalista.</span>
        </div>
      </div>
    </footer>
  );
}

