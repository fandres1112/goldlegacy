import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  try {
    await requireAdmin();

    const [productsCount, ordersCount, usersCount, latestOrders] = await Promise.all([
      prisma.product.count(),
      prisma.order.count(),
      prisma.user.count(),
      prisma.order.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          items: {
            include: {
              product: true
            }
          },
          user: true
        }
      })
    ]);

    const totalRevenueAgg = await prisma.order.aggregate({
      _sum: {
        total: true
      }
    });

    return NextResponse.json({
      productsCount,
      ordersCount,
      usersCount,
      totalRevenue: totalRevenueAgg._sum.total ?? 0,
      latestOrders
    });
  } catch (error) {
    console.error(error);
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Error al obtener resumen admin" },
      { status: 500 }
    );
  }
}

