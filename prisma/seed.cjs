const { PrismaClient, ProductType, UserRole } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("admin1234", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@goldlegacy.com" },
    update: {},
    create: {
      email: "admin@goldlegacy.com",
      name: "Administrador GoldLegacy",
      passwordHash,
      role: UserRole.ADMIN
    }
  });

  console.log("Admin creado:", admin.email);

  const categories = await prisma.category.createMany({
    data: [
      { name: "Cadenas", slug: "cadenas" },
      { name: "Anillos", slug: "anillos" },
      { name: "Pulseras", slug: "pulseras" },
      { name: "Aretes", slug: "aretes" },
      { name: "Dijes", slug: "dijes" }
    ],
    skipDuplicates: true
  });

  console.log("Categorías creadas:", categories.count);

  const cadenasCategory = await prisma.category.findUnique({
    where: { slug: "cadenas" }
  });

  const anillosCategory = await prisma.category.findUnique({
    where: { slug: "anillos" }
  });

  const pulserasCategory = await prisma.category.findUnique({
    where: { slug: "pulseras" }
  });

  if (!cadenasCategory || !anillosCategory || !pulserasCategory) {
    throw new Error("No se pudieron encontrar las categorías base para seed.");
  }

  // Usar upsert para cada producto (actualiza si existe, crea si no)
  await prisma.product.upsert({
    where: { slug: "cadena-goldlegacy-essential-3mm" },
    update: {},
    create: {
      name: "Cadena GoldLegacy Essential 3mm",
      slug: "cadena-goldlegacy-essential-3mm",
      description:
        "Cadena minimalista en oro 18k con diseño de eslabón fino. Ideal para uso diario con un toque de lujo discreto.",
      price: 189.99,
      material: "Oro 18k",
      type: ProductType.CHAIN,
      images: [
        "https://images.unsplash.com/photo-1611107683227-e9060eccd846?auto=format&fit=crop&w=1600&q=80",
        "https://images.unsplash.com/photo-1703034390242-1174e133db0a?auto=format&fit=crop&w=1600&q=80"
      ],
      stock: 15,
      isFeatured: true,
      categoryId: cadenasCategory.id
    }
  });

  await prisma.product.upsert({
    where: { slug: "anillo-signature-goldlegacy" },
    update: {},
    create: {
      name: "Anillo Signature GoldLegacy",
      slug: "anillo-signature-goldlegacy",
      description:
        "Anillo en oro 18k con acabado espejo y perfil limpio. Diseñado para quienes buscan un statement minimalista.",
      price: 229.0,
      material: "Oro 18k",
      type: ProductType.RING,
      images: [
        "https://images.unsplash.com/photo-1689367436629-1d288f1e23b6?auto=format&fit=crop&w=1600&q=80",
        "https://images.unsplash.com/photo-1655707063092-5c4509de41b8?auto=format&fit=crop&w=1600&q=80"
      ],
      stock: 10,
      isFeatured: true,
      categoryId: anillosCategory.id
    }
  });

  await prisma.product.upsert({
    where: { slug: "pulsera-goldlegacy-woven" },
    update: {},
    create: {
      name: "Pulsera GoldLegacy Woven",
      slug: "pulsera-goldlegacy-woven",
      description:
        "Pulsera tejida en oro 18k con textura orgánica y tacto cómodo. Diseñada para acompañarte todos los días.",
      price: 159.9,
      material: "Oro 18k",
      type: ProductType.BRACELET,
      images: [
        "https://images.unsplash.com/photo-1633810543462-77c4a3b13f07?auto=format&fit=crop&w=1600&q=80",
        "https://images.unsplash.com/photo-1602173574767-37ac01994b2a?auto=format&fit=crop&w=1600&q=80"
      ],
      stock: 20,
      isFeatured: false,
      categoryId: pulserasCategory.id
    }
  });

  console.log("Productos seed creados/actualizados.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

