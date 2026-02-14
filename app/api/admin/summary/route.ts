import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendiente",
  PAID: "Pagado",
  SHIPPED: "Enviado",
  CANCELLED: "Cancelado"
};

export async function GET() {
  try {
    await requireAdmin();

    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - 13);
    startDate.setHours(0, 0, 0, 0);

    const [
      productsCount,
      ordersCount,
      usersCount,
      latestOrders,
      totalRevenueAgg,
      recentOrders,
      ordersByStatus,
      categoriesWithCount
    ] = await Promise.all([
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
      }),
      prisma.order.aggregate({ _sum: { total: true } }),
      prisma.order.findMany({
        where: { createdAt: { gte: startDate } },
        select: { createdAt: true, total: true }
      }),
      prisma.order.groupBy({
        by: ["status"],
        _count: { id: true }
      }),
      prisma.category.findMany({
        select: {
          name: true,
          id: true,
          _count: { select: { products: true } }
        }
      })
    ]);

    const toLocalDateKey = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

    const dateMap = new Map<string, { orders: number; revenue: number }>();
    for (let d = 0; d < 14; d++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + d);
      const key = toLocalDateKey(date);
      dateMap.set(key, { orders: 0, revenue: 0 });
    }
    for (const order of recentOrders) {
      const key = toLocalDateKey(new Date(order.createdAt));
      const cur = dateMap.get(key);
      if (cur) {
        cur.orders += 1;
        cur.revenue += Number(order.total);
      }
    }
    const ordersOverTime = Array.from(dateMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, { orders, revenue }]) => ({
        date: new Date(date).toLocaleDateString("es", { day: "2-digit", month: "short" }),
        órdenes: orders,
        ingresos: Number(revenue)
      }));

    const ordersByStatusChart = ordersByStatus.map((row) => ({
      name: STATUS_LABELS[row.status] ?? row.status,
      value: row._count.id
    }));

    const productsByCategoryChart = categoriesWithCount.map((c) => ({
      name: c.name,
      value: c._count.products
    }));

    return NextResponse.json({
      productsCount,
      ordersCount,
      usersCount,
      totalRevenue: totalRevenueAgg._sum.total ?? 0,
      latestOrders,
      ordersOverTime,
      ordersByStatus: ordersByStatusChart,
      productsByCategory: productsByCategoryChart
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

