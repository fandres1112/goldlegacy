import { prisma } from "@/lib/prisma";
import { ProductCard } from "@/components/shop/ProductCard";
import { SectionTitle } from "@/components/ui/SectionTitle";
import Link from "next/link";
import Image from "next/image";

export const revalidate = 60;

export default async function HomePage() {
  const featured = await prisma.product.findMany({
    where: { isFeatured: true },
    orderBy: { createdAt: "desc" },
    take: 8,
    include: {
      category: {
        select: { name: true, slug: true }
      }
    }
  });

  return (
    <div>
      {/* ——— HERO ——— */}
      <section className="relative min-h-[92vh] flex flex-col justify-center overflow-hidden border-b border-white/[0.06] bg-black">
        <div className="absolute inset-0 w-full h-full">
          <Image
            src="/hero-bg-full.png"
            alt=""
            fill
            className="object-cover object-center"
            sizes="100vw"
            priority
          />
        </div>
        {/* Capa oscura sobre el fondo del hero */}
        <div className="absolute inset-0 bg-black/50 pointer-events-none" aria-hidden />
        <div
          className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_20%,_rgba(212,175,55,0.2),_transparent_55%)] animate-gold-glow"
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_70%_60%,_rgba(212,175,55,0.1),_transparent_50%)] animate-gold-glow-strong"
          style={{ animationDelay: "1s" }}
          aria-hidden
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 from-0% via-black/35 via-45% to-transparent to-100% pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_80%_at_25%_50%,_black/55%,_transparent_65%)] pointer-events-none" />

        <div className="container-page relative z-10 py-20 md:py-28">
          <div className="max-w-4xl">
            <p
              className="text-[11px] uppercase tracking-[0.35em] text-gold/90 mb-8 animate-in opacity-0"
              style={{ animation: "fadeIn 0.8s ease-out 0.2s forwards" }}
            >
              Nueva colección · 2026
            </p>
            <h1
              className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl tracking-tight leading-[1.08] mb-8 animate-in opacity-0"
              style={{ animation: "fadeIn 0.8s ease-out 0.4s forwards" }}
            >
              Oro minimalista
              <br />
              para un{" "}
              <span className="relative inline-block">
                <span className="bg-gradient-to-r from-gold via-gold-light to-gold bg-clip-text text-transparent">
                  legado
                </span>
                <span
                  className="absolute -inset-2 bg-gradient-to-r from-gold/25 via-gold/50 to-gold/25 blur-2xl -z-10 animate-gold-glow rounded-full"
                  aria-hidden
                />
              </span>{" "}
              eterno.
            </h1>
            <p
              className="text-white text-base md:text-lg max-w-xl leading-relaxed mb-10 animate-in opacity-0"
              style={{ animation: "fadeIn 0.8s ease-out 0.6s forwards" }}
            >
              Gold Legacy nace desde una tradición familiar hecha joya
              <br />
              Piezas en oro diseñadas con líneas puras, proporciones precisas y una presencia sutilmente poderosa.
            </p>
            <div
              className="flex flex-wrap gap-4 animate-in opacity-0"
              style={{ animation: "fadeIn 0.8s ease-out 0.8s forwards" }}
            >
              <Link
                href="/catalogo"
                className="btn-primary inline-flex items-center gap-2"
              >
                Ver catálogo completo
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
              <Link href="/sobre-nosotros" className="btn-outline">
                Conoce la historia
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ——— DESTACADOS ——— */}
      <section className="border-b border-white/[0.06]">
        <div className="container-page py-20 md:py-28">
          <SectionTitle
            eyebrow="Selección"
            title="Piezas destacadas"
            description="Algunas de nuestras joyas más queridas. Oro que acompaña cada día con elegancia discreta."
            align="center"
          />
          {featured.length > 0 ? (
            <div className="flex flex-wrap justify-center gap-6 md:gap-8">
              {featured.map((product, i) => (
                <div
                  key={product.id}
                  className="w-full sm:w-[280px] lg:w-[260px] animate-in opacity-0"
                  style={{ animation: `fadeIn 0.6s ease-out ${0.2 + i * 0.1}s forwards` }}
                >
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted text-sm mb-6">
                Próximamente nuevas piezas. Mientras tanto, explora el catálogo.
              </p>
              <Link href="/catalogo" className="btn-outline">
                Ver catálogo
              </Link>
            </div>
          )}
          <div className="mt-14 text-center">
            <Link
              href="/catalogo"
              className="text-sm text-gold/90 hover:text-gold transition-colors inline-flex items-center gap-2"
            >
              Ver toda la colección
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ——— FRASE ——— */}
      <section className="border-b border-white/[0.06] bg-gradient-to-b from-surface/50 to-background">
        <div className="container-page py-16 md:py-24">
          <div className="max-w-2xl mx-auto text-center">
            <p className="font-display text-2xl sm:text-3xl md:text-4xl text-white/90 leading-snug tracking-tight">
              Tradición familiar hecha joya.
            </p>
            <div className="mt-8 h-px w-16 mx-auto bg-gradient-to-r from-transparent via-gold/60 to-transparent" />
            <p className="mt-6 text-muted text-sm max-w-md mx-auto">
              Cada pieza Gold Legacy está pensada para perdurar: diseño atemporal,
              materiales nobles y un cuidado artesanal que se nota al primer contacto.
            </p>
          </div>
        </div>
      </section>

      {/* ——— CTA FINAL ——— */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_100%,_rgba(212,175,55,0.08),_transparent_70%)]" aria-hidden />
        <div className="container-page relative z-10 py-20 md:py-28 text-center">
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl text-white tracking-tight mb-4">
            Tu legado empieza aquí
          </h2>
          <p className="text-white/60 text-sm md:text-base max-w-md mx-auto mb-8">
            Descubre piezas en oro que te acompañarán por años. Envíos a todo el país.
          </p>
          <Link href="/catalogo" className="btn-primary inline-flex items-center gap-2">
            Explorar colección
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </section>
    </div>
  );
}
