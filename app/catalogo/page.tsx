import { prisma } from "@/lib/prisma";
import { ProductCard } from "@/components/shop/ProductCard";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { FiltersBar } from "@/components/shop/FiltersBar";

type CatalogPageProps = {
  searchParams: {
    [key: string]: string | string[] | undefined;
  };
};

export const revalidate = 60;

export default async function CatalogPage({ searchParams }: CatalogPageProps) {
  const page = Number(searchParams.page ?? "1");
  const pageSize = 12;
  const type = typeof searchParams.type === "string" ? searchParams.type : undefined;

  const where: any = {};

  if (type) {
    where.type = type;
  }

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        category: {
          select: { name: true, slug: true }
        }
      }
    }),
    prisma.product.count({ where })
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="container-page py-12 md:py-16">
      <SectionTitle
        eyebrow="Colección"
        title="Piezas en oro para tu legado diario."
        description="Explora cadenas, anillos, pulseras y más. Cada diseño ha sido pensado para acompañarte con una presencia sutil y elegante."
      />

      <div className="mb-6">
        <FiltersBar />
      </div>

      {items.length === 0 ? (
        <p className="text-muted text-sm">
          Aún no hay productos disponibles en esta categoría. Vuelve pronto o
          explora otra sección.
        </p>
      ) : (
        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {items.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center mt-10 gap-2 text-xs">
          {Array.from({ length: totalPages }).map((_, index) => {
            const p = index + 1;
            const isCurrent = p === page;
            return (
              <a
                key={p}
                href={`?page=${p}${type ? `&type=${type}` : ""}`}
                className={`h-8 w-8 inline-flex items-center justify-center rounded-full border text-xs transition-colors ${
                  isCurrent
                    ? "border-gold bg-gold/10 text-gold"
                    : "border-white/10 text-gray-300 hover:border-gold/60 hover:text-gold"
                }`}
              >
                {p}
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}

