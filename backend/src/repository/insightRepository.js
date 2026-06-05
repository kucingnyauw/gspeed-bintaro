import prisma from "#app/database.js";
import CacheManager from "#shared/utils/cache.js";
import redis from "#lib/redis.js";


const shortCache = new CacheManager("insight:short");
const mediumCache = new CacheManager("insight:medium"); 
const longCache = new CacheManager("insight:long"); 

const TTL = {
  SHORT: 5 * 60, 
  MEDIUM: 10 * 60, 
  LONG: 30 * 60, 
};

/**
 * Helper: cache wrapper dengan auto-invalidate pattern
 */
async function cached(cacheInstance, key, ttl, fetcher) {
  const cached = await cacheInstance.get(key);
  if (cached !== null) return cached;

  const data = await fetcher();
  await cacheInstance.set(key, data, ttl);
  return data;
}

class InsightRepository {
  // ============================================================================
  // MEKANIK
  // ============================================================================

  /** @param {string} mechanicId @returns {Promise<Array>} */
  async getMechanicActiveJobs(mechanicId) {
    // REAL-TIME - no cache (status bisa berubah setiap saat)
    return prisma.mechanicAssignment
      .findMany({
        where: {
          mechanicId,
          endAt: null,
          orderItem: {
            order: {
              status: { in: ["QUEUED", "IN_PROGRESS"] },
              deletedAt: null,
            },
          },
        },
        select: {
          startAt: true,
          orderItem: {
            select: {
              productNameSnapshot: true,
              order: {
                select: {
                  orderNumber: true,
                  status: true,
                  createdAt: true,
                  vehicle: { select: { plateNumber: true } },
                },
              },
            },
          },
        },
        orderBy: { createdAt: "asc" },
      })
      .then((r) =>
        r.map((i) => ({
          orderNumber: i.orderItem.order.orderNumber,
          service: i.orderItem.productNameSnapshot,
          status: i.orderItem.order.status,
          plateNumber:
            i.orderItem.order.vehicle?.plateNumber || "Belum terdaftar",
          startAt: i.startAt,
          createdAt: i.orderItem.order.createdAt,
        }))
      );
  }

  /** @param {string} mechanicId @returns {Promise<Object>} */
  async getMechanicPerformanceSummary(mechanicId) {
    return cached(
      shortCache,
      `mechanic:perf:${mechanicId}`,
      TTL.SHORT,
      async () => {
        const now = new Date();
        const startDay = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate()
        );
        const startWeek = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() - now.getDay()
        );
        const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const [today, week, month] = await Promise.all([
          prisma.mechanicAssignment.count({
            where: {
              mechanicId,
              endAt: { gte: startDay, not: null },
              orderItem: {
                order: {
                  status: { in: ["COMPLETED", "CLOSED"] },
                  deletedAt: null,
                },
              },
            },
          }),
          prisma.mechanicAssignment.count({
            where: {
              mechanicId,
              endAt: { gte: startWeek, not: null },
              orderItem: {
                order: {
                  status: { in: ["COMPLETED", "CLOSED"] },
                  deletedAt: null,
                },
              },
            },
          }),
          prisma.$queryRaw`
          SELECT 
            COUNT(ma."id")::int as count, 
            COALESCE(SUM(oi."subtotal"), 0)::bigint as earnings
          FROM "MechanicAssignment" ma
          INNER JOIN "OrderItem" oi ON ma."orderItemId" = oi."id"
          INNER JOIN "Order" o ON oi."orderId" = o."id"
          WHERE ma."mechanicId" = ${mechanicId}
            AND ma."endAt" >= ${startMonth}
            AND o."status" IN ('COMPLETED','CLOSED')
            AND o."deletedAt" IS NULL
        `,
        ]);

        return {
          todayCompleted: today,
          weekCompleted: week,
          monthCompleted: Number(month[0].count),
          monthEarnings: Number(month[0].earnings),
        };
      }
    );
  }

  /** @param {string} mechanicId @param {number} [days=7] @returns {Promise<Array>} */
  async getMechanicDailyHistory(mechanicId, days = 7) {
    return cached(
      mediumCache,
      `mechanic:daily:${mechanicId}:${days}`,
      TTL.MEDIUM,
      async () => {
        const since = new Date(Date.now() - days * 86400000);
        const raw = await prisma.$queryRaw`
        SELECT 
          DATE(ma."endAt") as date, 
          COUNT(ma."id")::int as completed, 
          COALESCE(SUM(oi."subtotal"), 0)::bigint as earnings
        FROM "MechanicAssignment" ma
        INNER JOIN "OrderItem" oi ON ma."orderItemId" = oi."id"
        INNER JOIN "Order" o ON oi."orderId" = o."id"
        WHERE ma."mechanicId" = ${mechanicId}
          AND ma."endAt" >= ${since}
          AND o."status" IN ('COMPLETED','CLOSED')
          AND o."deletedAt" IS NULL
        GROUP BY DATE(ma."endAt")
        ORDER BY date ASC
      `;
        return raw.map((r) => ({
          date: r.date,
          completed: Number(r.completed),
          earnings: Number(r.earnings),
        }));
      }
    );
  }

  /** @param {string} mechanicId @returns {Promise<Object>} */
  async getMechanicSpeedStats(mechanicId) {
    return cached(
      mediumCache,
      `mechanic:speed:${mechanicId}`,
      TTL.MEDIUM,
      async () => {
        const raw = await prisma.$queryRaw`
        SELECT 
          COUNT(ma."id")::int as total,
          ROUND(AVG(EXTRACT(EPOCH FROM (ma."endAt" - ma."startAt")) / 60))::int as avg,
          ROUND(MIN(EXTRACT(EPOCH FROM (ma."endAt" - ma."startAt")) / 60))::int as min,
          ROUND(MAX(EXTRACT(EPOCH FROM (ma."endAt" - ma."startAt")) / 60))::int as max
        FROM "MechanicAssignment" ma
        WHERE ma."mechanicId" = ${mechanicId}
          AND ma."endAt" IS NOT NULL
          AND ma."startAt" IS NOT NULL
      `;
        return {
          totalJobs: Number(raw[0].total),
          avgTimeMinutes: Number(raw[0].avg) || 0,
          fastestMinutes: Number(raw[0].min) || 0,
          slowestMinutes: Number(raw[0].max) || 0,
        };
      }
    );
  }

  /** @param {string} mechanicId @returns {Promise<Array>} */
  async getMechanicTopServices(mechanicId) {
    return cached(
      mediumCache,
      `mechanic:topservices:${mechanicId}`,
      TTL.MEDIUM,
      async () => {
        const raw = await prisma.$queryRaw`
        SELECT 
          oi."productNameSnapshot" as "serviceName", 
          COUNT(ma."id")::int as count
        FROM "MechanicAssignment" ma
        INNER JOIN "OrderItem" oi ON ma."orderItemId" = oi."id"
        WHERE ma."mechanicId" = ${mechanicId}
        GROUP BY oi."productNameSnapshot"
        ORDER BY count DESC
        LIMIT 5
      `;
        return raw.map((r) => ({
          serviceName: r.serviceName,
          count: Number(r.count),
        }));
      }
    );
  }

  /** @param {string} mechanicId @returns {Promise<Array>} */
  async getMechanicPendingJobs(mechanicId) {
    // REAL-TIME - no cache
    return prisma.mechanicAssignment
      .findMany({
        where: {
          mechanicId,
          endAt: null,
          orderItem: { order: { status: "QUEUED", deletedAt: null } },
        },
        select: {
          orderItem: {
            select: {
              productNameSnapshot: true,
              order: {
                select: {
                  orderNumber: true,
                  createdAt: true,
                  vehicle: { select: { plateNumber: true } },
                },
              },
            },
          },
        },
        orderBy: { createdAt: "asc" },
      })
      .then((r) =>
        r.map((i) => ({
          orderNumber: i.orderItem.order.orderNumber,
          service: i.orderItem.productNameSnapshot,
          createdAt: i.orderItem.order.createdAt,
          plateNumber:
            i.orderItem.order.vehicle?.plateNumber || "Belum terdaftar",
        }))
      );
  }

  /** @param {string} mechanicId @param {number} [days=30] @returns {Promise<Object>} */
  async getMechanicEarningsBreakdown(mechanicId, days = 30) {
    return cached(
      mediumCache,
      `mechanic:earnings:${mechanicId}:${days}`,
      TTL.MEDIUM,
      async () => {
        const since = new Date(Date.now() - days * 86400000);
        const raw = await prisma.$queryRaw`
        SELECT 
          DATE(ma."endAt") as date,
          COUNT(ma."id")::int as jobs,
          COALESCE(SUM(oi."subtotal"), 0)::bigint as earnings
        FROM "MechanicAssignment" ma
        INNER JOIN "OrderItem" oi ON ma."orderItemId" = oi."id"
        INNER JOIN "Order" o ON oi."orderId" = o."id"
        WHERE ma."mechanicId" = ${mechanicId}
          AND ma."endAt" >= ${since}
          AND o."status" IN ('COMPLETED','CLOSED')
          AND o."deletedAt" IS NULL
        GROUP BY DATE(ma."endAt")
        ORDER BY date DESC
      `;

        const totalEarnings = raw.reduce((s, r) => s + Number(r.earnings), 0);

        return {
          totalEarnings,
          avgPerDay: raw.length ? Math.round(totalEarnings / raw.length) : 0,
          daily: raw.map((r) => ({
            date: r.date,
            jobs: Number(r.jobs),
            earnings: Number(r.earnings),
          })),
        };
      }
    );
  }

  /** @param {string} mechanicId @returns {Promise<Object>} */
  async getMechanicEfficiencyRank(mechanicId) {
    return cached(
      mediumCache,
      `mechanic:rank:${mechanicId}`,
      TTL.MEDIUM,
      async () => {
        const raw = await prisma.$queryRaw`
        WITH mech_stats AS (
          SELECT 
            ma."mechanicId",
            COUNT(ma."id")::int as total_jobs,
            ROUND(AVG(EXTRACT(EPOCH FROM (ma."endAt" - ma."startAt")) / 60))::int as avg_minutes
          FROM "MechanicAssignment" ma
          WHERE ma."endAt" IS NOT NULL AND ma."startAt" IS NOT NULL
          GROUP BY ma."mechanicId"
          HAVING COUNT(ma."id") >= 5
        ),
        ranked AS (
          SELECT 
            ms.*,
            u."fullName",
            RANK() OVER (ORDER BY ms.avg_minutes ASC) as "rank",
            COUNT(*) OVER ()::int as "totalMechanics"
          FROM mech_stats ms
          INNER JOIN "User" u ON ms."mechanicId" = u."id"
        )
        SELECT * FROM ranked WHERE "mechanicId" = ${mechanicId}
      `;
        if (!raw.length)
          return { rank: null, totalMechanics: 0, avgMinutes: 0, totalJobs: 0 };
        return {
          rank: Number(raw[0].rank),
          totalMechanics: Number(raw[0].totalMechanics),
          avgMinutes: Number(raw[0].avg_minutes),
          totalJobs: Number(raw[0].total_jobs),
          mechanicName: raw[0].fullName,
        };
      }
    );
  }

  /** @param {string} mechanicId @param {number} [days=30] @returns {Promise<Object>} */
  async getMechanicWeeklyTrend(mechanicId, days = 30) {
    return cached(
      mediumCache,
      `mechanic:trend:${mechanicId}:${days}`,
      TTL.MEDIUM,
      async () => {
        const since = new Date(Date.now() - days * 86400000);
        const raw = await prisma.$queryRaw`
        SELECT 
          DATE_TRUNC('week', ma."endAt")::date as week_start,
          COUNT(ma."id")::int as jobs,
          COALESCE(SUM(oi."subtotal"), 0)::bigint as earnings
        FROM "MechanicAssignment" ma
        INNER JOIN "OrderItem" oi ON ma."orderItemId" = oi."id"
        INNER JOIN "Order" o ON oi."orderId" = o."id"
        WHERE ma."mechanicId" = ${mechanicId}
          AND ma."endAt" >= ${since}
          AND o."status" IN ('COMPLETED','CLOSED')
          AND o."deletedAt" IS NULL
        GROUP BY week_start
        ORDER BY week_start ASC
      `;
        const jobs = raw.map((r) => Number(r.jobs));
        const trend =
          jobs.length >= 2
            ? Math.round(
                ((jobs[jobs.length - 1] - jobs[0]) / Math.max(jobs[0], 1)) * 100
              )
            : 0;
        return {
          trend,
          direction: trend > 0 ? "up" : trend < 0 ? "down" : "stable",
          weekly: raw.map((r) => ({
            weekStart: r.week_start,
            jobs: Number(r.jobs),
            earnings: Number(r.earnings),
          })),
        };
      }
    );
  }

  // ============================================================================
  // KASIR
  // ============================================================================

  /** @param {string} cashierId @returns {Promise<Object>} */
  async getCashierTodaySummary(cashierId) {
    return cached(
      shortCache,
      `cashier:today:${cashierId}`,
      TTL.SHORT,
      async () => {
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        const end = new Date();
        end.setHours(23, 59, 59, 999);

        const [orderAgg, paymentAgg] = await Promise.all([
          prisma.order.aggregate({
            where: {
              cashierId,
              createdAt: { gte: start, lte: end },
              status: { in: ["COMPLETED", "CLOSED"] },
              deletedAt: null,
            },
            _sum: { total: true },
            _count: true,
          }),
          prisma.$queryRaw`
          SELECT 
            COALESCE(SUM(CASE WHEN p."method" = 'CASH' THEN p."amountPaid" ELSE 0 END), 0)::bigint as cash,
            COALESCE(SUM(CASE WHEN p."method" = 'QRIS' THEN p."amountPaid" ELSE 0 END), 0)::bigint as qris
          FROM "Payment" p
          INNER JOIN "Order" o ON p."orderId" = o."id"
          WHERE o."cashierId" = ${cashierId}
            AND o."createdAt" >= ${start}
            AND o."createdAt" <= ${end}
            AND o."deletedAt" IS NULL
        `,
        ]);

        return {
          todaySales: Number(orderAgg._sum.total || 0),
          todayOrders: orderAgg._count,
          todayCashAmount: Number(paymentAgg[0].cash),
          todayQrisAmount: Number(paymentAgg[0].qris),
        };
      }
    );
  }

  /** @param {string} cashierId @returns {Promise<Object>} */
  async getCashierActiveShift(cashierId) {
    // REAL-TIME - no cache (shift status bisa berubah)
    const shift = await prisma.shift.findFirst({
      where: { cashierId, status: "OPEN" },
      select: {
        id: true,
        startingCash: true,
        cashSales: true,
        cashIn: true,
        cashOut: true,
        openedAt: true,
        _count: { select: { orders: true } },
      },
    });

    if (!shift) {
      return {
        activeShift: null,
        shiftSales: 0,
        shiftExpenses: 0,
        shiftNetCash: null,
      };
    }

    const expenses = await prisma.expense.aggregate({
      where: { shiftId: shift.id },
      _sum: { amount: true },
    });

    return {
      activeShift: shift,
      shiftSales: shift.cashSales,
      shiftExpenses: Number(expenses._sum.amount || 0),
      shiftNetCash: shift.cashSales - Number(expenses._sum.amount || 0),
    };
  }

  /** @param {string} cashierId @returns {Promise<Array>} */
  async getCashierPendingOrders(cashierId) {
    return cached(
      shortCache,
      `cashier:pending:${cashierId}`,
      TTL.SHORT,
      async () => {
        return prisma.order
          .groupBy({
            by: ["status"],
            where: {
              cashierId,
              status: { in: ["DRAFT", "QUEUED", "IN_PROGRESS"] },
              deletedAt: null,
            },
            _count: { id: true },
          })
          .then((r) =>
            r.map((i) => ({ status: i.status, count: i._count.id }))
          );
      }
    );
  }

  /** @param {string} cashierId @param {number} [days=7] @returns {Promise<Array>} */
  async getCashierDailyHistory(cashierId, days = 7) {
    return cached(
      mediumCache,
      `cashier:daily:${cashierId}:${days}`,
      TTL.MEDIUM,
      async () => {
        const since = new Date(Date.now() - days * 86400000);
        const raw = await prisma.$queryRaw`
        SELECT 
          DATE("createdAt") as date, 
          COUNT("id")::int as orders, 
          COALESCE(SUM("total"), 0)::bigint as sales
        FROM "Order"
        WHERE "cashierId" = ${cashierId}
          AND "createdAt" >= ${since}
          AND "status" IN ('COMPLETED','CLOSED')
          AND "deletedAt" IS NULL
        GROUP BY DATE("createdAt")
        ORDER BY date ASC
      `;
        return raw.map((r) => ({
          date: r.date,
          orders: Number(r.orders),
          sales: Number(r.sales),
        }));
      }
    );
  }

  /** @param {string} cashierId @returns {Promise<Object>} */
  async getCashierCustomerStats(cashierId) {
    return cached(
      shortCache,
      `cashier:customer:${cashierId}`,
      TTL.SHORT,
      async () => {
        const start = new Date();
        start.setHours(0, 0, 0, 0);

        const [total, newToday, top] = await Promise.all([
          prisma.$queryRaw`
          SELECT COUNT(DISTINCT "customerId")::int as count
          FROM "Order"
          WHERE "cashierId" = ${cashierId}
            AND "deletedAt" IS NULL
            AND "customerId" IS NOT NULL
        `,
          prisma.$queryRaw`
          SELECT COUNT(DISTINCT "customerId")::int as count
          FROM "Order"
          WHERE "cashierId" = ${cashierId}
            AND "createdAt" >= ${start}
            AND "deletedAt" IS NULL
            AND "customerId" IS NOT NULL
        `,
          prisma.order.groupBy({
            by: ["customerId"],
            where: {
              cashierId,
              status: { in: ["COMPLETED", "CLOSED"] },
              deletedAt: null,
            },
            _sum: { total: true },
            orderBy: { _sum: { total: "desc" } },
            take: 1,
          }),
        ]);

        let topCustomer = null;
        if (top.length && top[0].customerId) {
          const cust = await prisma.customer.findUnique({
            where: { id: top[0].customerId },
            select: { name: true, phone: true },
          });
          topCustomer = {
            name: cust?.name || "Unknown",
            total: Number(top[0]._sum.total || 0),
          };
        }

        return {
          totalCustomers: Number(total[0].count),
          newToday: Number(newToday[0].count),
          topCustomer,
        };
      }
    );
  }

  /** @param {string} cashierId @returns {Promise<Object>} */
  async getCashierShiftHistory(cashierId) {
    return cached(
      mediumCache,
      `cashier:shifts:${cashierId}`,
      TTL.MEDIUM,
      async () => {
        const shifts = await prisma.shift.findMany({
          where: { cashierId, status: "CLOSED" },
          select: {
            openedAt: true,
            closedAt: true,
            startingCash: true,
            endingCash: true,
            cashSales: true,
            discrepancy: true,
          },
          orderBy: { closedAt: "desc" },
          take: 10,
        });

        const avgDiscrepancy = shifts.length
          ? Math.round(
              shifts.reduce((s, sh) => s + sh.discrepancy, 0) / shifts.length
            )
          : 0;

        return {
          totalShifts: shifts.length,
          avgDiscrepancy,
          lastShifts: shifts,
        };
      }
    );
  }

  /** @param {string} cashierId @returns {Promise<Array>} */
  async getCashierRecentTransactions(cashierId) {
    return cached(
      shortCache,
      `cashier:recent:${cashierId}`,
      TTL.SHORT,
      async () => {
        return prisma.order
          .findMany({
            where: { cashierId, deletedAt: null },
            select: {
              orderNumber: true,
              total: true,
              status: true,
              createdAt: true,
              customer: { select: { name: true } },
              payment: { select: { method: true, amountPaid: true } },
            },
            orderBy: { createdAt: "desc" },
            take: 20,
          })
          .then((r) =>
            r.map((i) => ({
              orderNumber: i.orderNumber,
              total: i.total,
              status: i.status,
              customer: i.customer?.name || "Umum",
              method: i.payment?.method || null,
              createdAt: i.createdAt,
            }))
          );
      }
    );
  }

  /** @param {string} cashierId @returns {Promise<Object>} */
  async getCashierComparisonStats(cashierId) {
    return cached(
      shortCache,
      `cashier:compare:${cashierId}`,
      TTL.SHORT,
      async () => {
        const now = new Date();
        const startDay = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate()
        );
        const yesterday = new Date(startDay.getTime() - 86400000);

        const [todayAgg, yesterdayAgg, rankRaw] = await Promise.all([
          prisma.order.aggregate({
            where: {
              cashierId,
              createdAt: { gte: startDay },
              status: { in: ["COMPLETED", "CLOSED"] },
              deletedAt: null,
            },
            _sum: { total: true },
            _count: true,
          }),
          prisma.order.aggregate({
            where: {
              cashierId,
              createdAt: { gte: yesterday, lt: startDay },
              status: { in: ["COMPLETED", "CLOSED"] },
              deletedAt: null,
            },
            _sum: { total: true },
            _count: true,
          }),
          prisma.$queryRaw`
          WITH today_ranks AS (
            SELECT 
              o."cashierId",
              SUM(o."total")::bigint as sales,
              RANK() OVER (ORDER BY SUM(o."total") DESC) as "rank"
            FROM "Order" o
            WHERE o."createdAt" >= ${startDay}
              AND o."status" IN ('COMPLETED','CLOSED')
              AND o."deletedAt" IS NULL
              AND o."cashierId" IS NOT NULL
            GROUP BY o."cashierId"
          )
          SELECT "rank" FROM today_ranks WHERE "cashierId" = ${cashierId}
        `,
        ]);

        const todaySales = Number(todayAgg._sum.total || 0);
        const yesterdaySales = Number(yesterdayAgg._sum.total || 0);

        return {
          todaySales,
          todayOrders: todayAgg._count,
          yesterdaySales,
          yesterdayOrders: yesterdayAgg._count,
          salesChange: yesterdaySales
            ? Math.round(((todaySales - yesterdaySales) / yesterdaySales) * 100)
            : 0,
          rank: rankRaw.length ? Number(rankRaw[0].rank) : null,
        };
      }
    );
  }

  // ============================================================================
  // ADMIN - DASHBOARD & OVERVIEW
  // ============================================================================

  /** @returns {Promise<Object>} */
  async getAdminDashboardSnapshot() {
    return cached(shortCache, `admin:dashboard`, TTL.SHORT, async () => {
      const now = new Date();
      const startDay = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      );
      const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const [daily, monthly, mechanics, shifts, lowStock] = await Promise.all([
        prisma.order.aggregate({
          where: {
            createdAt: { gte: startDay },
            status: { in: ["COMPLETED", "CLOSED"] },
            deletedAt: null,
          },
          _sum: { total: true },
        }),
        prisma.order.aggregate({
          where: {
            createdAt: { gte: startMonth },
            status: { in: ["COMPLETED", "CLOSED"] },
            deletedAt: null,
          },
          _sum: { total: true },
        }),
        prisma.mechanicAssignment
          .groupBy({ by: ["mechanicId"], where: { endAt: null }, _count: true })
          .then((r) => r.length),
        prisma.shift.count({ where: { status: "OPEN" } }),
        prisma.product.count({
          where: { type: "SPAREPART", isActive: true, stock: { lte: 5 } },
        }),
      ]);

      return {
        dailyRevenue: Number(daily._sum.total || 0),
        monthlyRevenue: Number(monthly._sum.total || 0),
        activeMechanics: mechanics,
        openShifts: shifts,
        lowStockItems: lowStock,
      };
    });
  }

  /** @returns {Promise<Object>} */
  async getAdminTodaySummary() {
    return cached(shortCache, `admin:today`, TTL.SHORT, async () => {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date();
      end.setHours(23, 59, 59, 999);

      const [agg, top] = await Promise.all([
        prisma.order.aggregate({
          where: {
            createdAt: { gte: start, lte: end },
            status: { in: ["COMPLETED", "CLOSED"] },
            deletedAt: null,
          },
          _sum: { total: true },
          _count: true,
          _avg: { total: true },
        }),
        prisma.$queryRaw`
          SELECT 
            oi."productNameSnapshot" as name, 
            SUM(oi."quantity")::int as qty
          FROM "OrderItem" oi
          INNER JOIN "Order" o ON oi."orderId" = o."id"
          WHERE o."createdAt" >= ${start}
            AND o."createdAt" <= ${end}
            AND o."deletedAt" IS NULL
          GROUP BY oi."productNameSnapshot"
          ORDER BY qty DESC
          LIMIT 1
        `,
      ]);

      return {
        totalRevenue: Number(agg._sum.total || 0),
        totalOrders: agg._count,
        avgOrderValue: Math.round(agg._avg.total || 0),
        topProduct: top[0]?.name || null,
      };
    });
  }

  /** @param {number} [days=30] @returns {Promise<Array>} */
  async getAdminCashierPerformance(days = 30) {
    return cached(
      mediumCache,
      `admin:cashiers:${days}`,
      TTL.MEDIUM,
      async () => {
        const since = new Date(Date.now() - days * 86400000);
        const raw = await prisma.$queryRaw`
        SELECT 
          u."fullName" as "cashierName", 
          COUNT(s."id")::int as "shiftCount", 
          COALESCE(SUM(s."cashSales"), 0)::bigint as "totalSales",
          ROUND(AVG(s."discrepancy"))::int as "avgDiscrepancy"
        FROM "Shift" s
        INNER JOIN "User" u ON s."cashierId" = u."id"
        WHERE s."openedAt" >= ${since}
        GROUP BY u."fullName"
        ORDER BY "totalSales" DESC
      `;
        return raw.map((r) => ({
          cashierName: r.cashierName,
          shiftCount: Number(r.shiftCount),
          totalSales: Number(r.totalSales),
          avgDiscrepancy: Number(r.avgDiscrepancy) || 0,
        }));
      }
    );
  }

  /** @param {number} [days=30] @returns {Promise<Array>} */
  async getAdminMechanicComparison(days = 30) {
    return cached(
      mediumCache,
      `admin:mechanics:${days}`,
      TTL.MEDIUM,
      async () => {
        const since = new Date(Date.now() - days * 86400000);
        const raw = await prisma.$queryRaw`
        SELECT 
          u."fullName" as "mechanicName", 
          COUNT(ma."id")::int as "totalJobs",
          COUNT(CASE WHEN ma."endAt" IS NOT NULL AND o."status" IN ('COMPLETED','CLOSED') AND o."deletedAt" IS NULL THEN 1 END)::int as "completedJobs",
          CASE 
            WHEN COUNT(ma."id") > 0 
            THEN ROUND((COUNT(CASE WHEN ma."endAt" IS NOT NULL AND o."status" IN ('COMPLETED','CLOSED') AND o."deletedAt" IS NULL THEN 1 END)::float / COUNT(ma."id") * 100))
            ELSE 0 
          END as "completionRate",
          COALESCE(SUM(CASE WHEN ma."endAt" IS NOT NULL AND o."status" IN ('COMPLETED','CLOSED') AND o."deletedAt" IS NULL THEN oi."subtotal" ELSE 0 END), 0)::bigint as "totalEarnings"
        FROM "User" u
        LEFT JOIN "MechanicAssignment" ma ON u."id" = ma."mechanicId"
        LEFT JOIN "OrderItem" oi ON ma."orderItemId" = oi."id"
        LEFT JOIN "Order" o ON oi."orderId" = o."id"
        WHERE u."role" = 'MECHANIC'
          AND ma."createdAt" >= ${since}
        GROUP BY u."fullName"
        ORDER BY "totalEarnings" DESC
      `;
        return raw.map((r) => ({
          mechanicName: r.mechanicName,
          totalJobs: Number(r.totalJobs),
          completedJobs: Number(r.completedJobs),
          completionRate: Number(r.completionRate) || 0,
          totalEarnings: Number(r.totalEarnings),
        }));
      }
    );
  }

  /** @returns {Promise<Object>} */
  async getAdminExpenseOverview() {
    return cached(mediumCache, `admin:expenses`, TTL.MEDIUM, async () => {
      const now = new Date();
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

      const [thisExp, lastExp, top] = await Promise.all([
        prisma.expense.aggregate({
          where: { date: { gte: thisMonth, lt: nextMonth } },
          _sum: { amount: true },
        }),
        prisma.expense.aggregate({
          where: { date: { gte: lastMonth, lt: thisMonth } },
          _sum: { amount: true },
        }),
        prisma.expense.groupBy({
          by: ["category"],
          where: { date: { gte: thisMonth, lt: nextMonth } },
          _sum: { amount: true },
          orderBy: { _sum: { amount: "desc" } },
          take: 1,
        }),
      ]);

      const thisAmount = Number(thisExp._sum.amount || 0);
      const lastAmount = Number(lastExp._sum.amount || 0);

      return {
        totalExpenses: thisAmount,
        topCategory: top[0]?.category || null,
        expenseGrowth: lastAmount
          ? Math.round(((thisAmount - lastAmount) / lastAmount) * 10000) / 100
          : 0,
      };
    });
  }

  /** @param {number} [days=30] @returns {Promise<Array>} */
  async getAdminOrderStatusDistribution(days = 30) {
    return cached(
      mediumCache,
      `admin:orderstatus:${days}`,
      TTL.MEDIUM,
      async () => {
        const since = new Date(Date.now() - days * 86400000);
        const raw = await prisma.$queryRaw`
        SELECT "status", COUNT("id")::int as count
        FROM "Order"
        WHERE "createdAt" >= ${since}
          AND "deletedAt" IS NULL
        GROUP BY "status"
        ORDER BY count DESC
      `;
        const total = raw.reduce((s, r) => s + Number(r.count), 0);
        return raw.map((r) => ({
          status: r.status,
          count: Number(r.count),
          pct: total ? Math.round((Number(r.count) / total) * 10000) / 100 : 0,
        }));
      }
    );
  }

  /** @returns {Promise<Object>} */
  async getAdminInventoryHealth() {
    return cached(mediumCache, `admin:inventory`, TTL.MEDIUM, async () => {
      const since90 = new Date(Date.now() - 90 * 86400000);
      const [stockValue, dead, turnover, top] = await Promise.all([
        prisma.$queryRaw`
          SELECT COALESCE(SUM("stock" * "cost"), 0)::bigint as val
          FROM "Product"
          WHERE "type" = 'SPAREPART' AND "isActive" = true
        `,
        prisma.$queryRaw`
          SELECT COALESCE(SUM(p."stock" * p."cost"), 0)::bigint as val
          FROM "Product" p
          WHERE p."type" = 'SPAREPART'
            AND p."isActive" = true
            AND p."stock" > 0
            AND NOT EXISTS (
              SELECT 1 FROM "StockMovement" sm
              WHERE sm."productId" = p."id"
                AND sm."type" = 'OUT'
                AND sm."createdAt" >= ${since90}
            )
        `,
        prisma.$queryRaw`
          SELECT 
            ROUND(COALESCE(SUM(sm."quantity"), 0) / NULLIF(SUM(p."stock"), 0) * 100) / 100 as rate
          FROM "Product" p
          LEFT JOIN "StockMovement" sm ON p."id" = sm."productId"
            AND sm."type" = 'OUT'
            AND sm."createdAt" >= ${since90}
          WHERE p."type" = 'SPAREPART' AND p."isActive" = true
        `,
        prisma.$queryRaw`
          SELECT 
            oi."productNameSnapshot" as name,
            SUM(oi."subtotal" - (oi."unitCostSnapshot" * oi."quantity"))::bigint as profit
          FROM "OrderItem" oi
          INNER JOIN "Order" o ON oi."orderId" = o."id"
          WHERE o."status" IN ('COMPLETED','CLOSED')
            AND o."deletedAt" IS NULL
          GROUP BY oi."productNameSnapshot"
          ORDER BY profit DESC
          LIMIT 1
        `,
      ]);

      return {
        totalStockValue: Number(stockValue[0].val),
        deadStockValue: Number(dead[0].val),
        turnoverRate: Number(turnover[0].rate),
        mostProfitable: top[0]?.name || null,
      };
    });
  }

  /** @returns {Promise<Object>} */
  async getAdminBusinessGrowth() {
    return cached(mediumCache, `admin:growth`, TTL.MEDIUM, async () => {
      const now = new Date();
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

      const [thisRev, lastRev, thisCust, lastCust, thisOrd, lastOrd] =
        await Promise.all([
          prisma.order.aggregate({
            where: {
              createdAt: { gte: thisMonth, lt: nextMonth },
              status: { in: ["COMPLETED", "CLOSED"] },
              deletedAt: null,
            },
            _sum: { total: true },
          }),
          prisma.order.aggregate({
            where: {
              createdAt: { gte: lastMonth, lt: thisMonth },
              status: { in: ["COMPLETED", "CLOSED"] },
              deletedAt: null,
            },
            _sum: { total: true },
          }),
          prisma.customer.count({
            where: { createdAt: { gte: thisMonth, lt: nextMonth } },
          }),
          prisma.customer.count({
            where: { createdAt: { gte: lastMonth, lt: thisMonth } },
          }),
          prisma.order.count({
            where: {
              createdAt: { gte: thisMonth, lt: nextMonth },
              deletedAt: null,
            },
          }),
          prisma.order.count({
            where: {
              createdAt: { gte: lastMonth, lt: thisMonth },
              deletedAt: null,
            },
          }),
        ]);

      const calc = (curr, prev) =>
        prev ? Math.round(((curr - prev) / prev) * 10000) / 100 : 0;

      return {
        revenueGrowth: calc(
          Number(thisRev._sum.total || 0),
          Number(lastRev._sum.total || 0)
        ),
        customerGrowth: calc(thisCust, lastCust),
        orderGrowth: calc(thisOrd, lastOrd),
      };
    });
  }

  /** @param {number} [days=7] @returns {Promise<Array>} */
  async getAdminDailyNetReport(days = 7) {
    return cached(
      mediumCache,
      `admin:dailyreport:${days}`,
      TTL.MEDIUM,
      async () => {
        const since = new Date(Date.now() - days * 86400000);
        const raw = await prisma.$queryRaw`
        WITH rev AS (
          SELECT DATE("createdAt") as date, SUM("total")::bigint as revenue
          FROM "Order"
          WHERE "createdAt" >= ${since}
            AND "status" IN ('COMPLETED','CLOSED')
            AND "deletedAt" IS NULL
          GROUP BY date
        ),
        exp AS (
          SELECT DATE("date") as date, SUM("amount")::bigint as expenses
          FROM "Expense"
          WHERE "date" >= ${since}
          GROUP BY date
        )
        SELECT 
          COALESCE(r.date, e.date) as date,
          COALESCE(r.revenue, 0) as revenue,
          COALESCE(e.expenses, 0) as expenses,
          COALESCE(r.revenue, 0) - COALESCE(e.expenses, 0) as net
        FROM rev r
        FULL OUTER JOIN exp e ON r.date = e.date
        ORDER BY date ASC
      `;
        return raw.map((r) => ({
          date: r.date,
          revenue: Number(r.revenue),
          expenses: Number(r.expenses),
          net: Number(r.net),
        }));
      }
    );
  }

  /** @param {number} [days=30] @returns {Promise<Array>} */
  async getAdminTopSpareparts(days = 30) {
    return cached(
      mediumCache,
      `admin:topspareparts:${days}`,
      TTL.MEDIUM,
      async () => {
        const since = new Date(Date.now() - days * 86400000);
        const raw = await prisma.$queryRaw`
        SELECT 
          oi."productNameSnapshot" as name,
          SUM(oi."quantity")::int as sold,
          SUM(oi."subtotal")::bigint as revenue,
          SUM(oi."subtotal" - (oi."unitCostSnapshot" * oi."quantity"))::bigint as profit
        FROM "OrderItem" oi
        INNER JOIN "Product" p ON oi."productId" = p."id"
        INNER JOIN "Order" o ON oi."orderId" = o."id"
        WHERE p."type" = 'SPAREPART'
          AND o."createdAt" >= ${since}
          AND o."status" IN ('COMPLETED','CLOSED')
          AND o."deletedAt" IS NULL
        GROUP BY oi."productNameSnapshot"
        ORDER BY sold DESC
        LIMIT 10
      `;
        return raw.map((r) => ({
          name: r.name,
          sold: Number(r.sold),
          revenue: Number(r.revenue),
          profit: Number(r.profit),
        }));
      }
    );
  }

  /** @param {number} [days=30] @returns {Promise<Array>} */
  async getAdminServicePopularity(days = 30) {
    return cached(
      mediumCache,
      `admin:services:${days}`,
      TTL.MEDIUM,
      async () => {
        const since = new Date(Date.now() - days * 86400000);
        const raw = await prisma.$queryRaw`
        SELECT 
          oi."productNameSnapshot" as name,
          COUNT(DISTINCT o."id")::int as orders,
          SUM(oi."quantity")::int as qty,
          SUM(oi."subtotal")::bigint as revenue
        FROM "OrderItem" oi
        INNER JOIN "Product" p ON oi."productId" = p."id"
        INNER JOIN "Order" o ON oi."orderId" = o."id"
        WHERE p."type" = 'SERVICE'
          AND o."createdAt" >= ${since}
          AND o."status" IN ('COMPLETED','CLOSED')
          AND o."deletedAt" IS NULL
        GROUP BY oi."productNameSnapshot"
        ORDER BY orders DESC
        LIMIT 10
      `;
        return raw.map((r) => ({
          name: r.name,
          orders: Number(r.orders),
          qty: Number(r.qty),
          revenue: Number(r.revenue),
        }));
      }
    );
  }

  /** @param {number} [days=30] @returns {Promise<Object>} */
  async getAdminPeakHours(days = 30) {
    return cached(
      mediumCache,
      `admin:peakhours:${days}`,
      TTL.MEDIUM,
      async () => {
        const since = new Date(Date.now() - days * 86400000);
        const raw = await prisma.$queryRaw`
        SELECT 
          EXTRACT(HOUR FROM "createdAt")::int as hour,
          COUNT("id")::int as orders,
          COALESCE(SUM("total"), 0)::bigint as revenue
        FROM "Order"
        WHERE "createdAt" >= ${since}
          AND "deletedAt" IS NULL
        GROUP BY hour
        ORDER BY orders DESC
      `;

        const peak = raw[0] || { hour: 0, orders: 0 };

        return {
          peakHour: Number(peak.hour),
          peakOrders: Number(peak.orders),
          hourly: raw.map((r) => ({
            hour: Number(r.hour),
            orders: Number(r.orders),
            revenue: Number(r.revenue),
          })),
        };
      }
    );
  }

  /** @returns {Promise<Array>} */
  async getAdminVehicleDistribution() {
    return cached(mediumCache, `admin:vehicles`, TTL.MEDIUM, async () => {
      const raw = await prisma.$queryRaw`
        SELECT 
          COALESCE(v."brand", 'Unknown') as brand,
          COUNT(DISTINCT v."id")::int as count
        FROM "Vehicle" v
        INNER JOIN "Order" o ON v."id" = o."vehicleId"
        WHERE o."deletedAt" IS NULL
        GROUP BY v."brand"
        ORDER BY count DESC
        LIMIT 10
      `;
      return raw.map((r) => ({ brand: r.brand, count: Number(r.count) }));
    });
  }

  /** @returns {Promise<Array>} */
  async getAdminStockAlert() {
    return cached(shortCache, `admin:stockalert`, TTL.SHORT, async () => {
      const [outOfStock, lowStock, overStock] = await Promise.all([
        prisma.product.findMany({
          where: { type: "SPAREPART", isActive: true, stock: 0 },
          select: { id: true, sku: true, name: true },
          take: 10,
        }),
        prisma.product.findMany({
          where: {
            type: "SPAREPART",
            isActive: true,
            stock: { gt: 0, lte: 5 },
          },
          select: { id: true, sku: true, name: true, stock: true },
          take: 10,
        }),
        prisma.product.findMany({
          where: { type: "SPAREPART", isActive: true, stock: { gte: 50 } },
          select: { id: true, sku: true, name: true, stock: true },
          take: 10,
        }),
      ]);

      return { outOfStock, lowStock, overStock };
    });
  }

  /** @param {number} [days=30] @returns {Promise<Object>} */
  async getAdminRefundStats(days = 30) {
    return cached(
      mediumCache,
      `admin:refunds:${days}`,
      TTL.MEDIUM,
      async () => {
        const since = new Date(Date.now() - days * 86400000);
        const raw = await prisma.$queryRaw`
        SELECT 
          COUNT(p."id")::int as refunds,
          COALESCE(SUM(p."amountPaid"), 0)::bigint as amount
        FROM "Payment" p
        INNER JOIN "Order" o ON p."orderId" = o."id"
        WHERE p."status" = 'REFUNDED'
          AND p."paidAt" >= ${since}
      `;
        return {
          totalRefunds: Number(raw[0].refunds),
          totalAmount: Number(raw[0].amount),
        };
      }
    );
  }

  /** @returns {Promise<Array>} */
  async getAdminUnpaidOrders() {
    return cached(shortCache, `admin:unpaid`, TTL.SHORT, async () => {
      return prisma.order.findMany({
        where: {
          status: { in: ["COMPLETED", "CLOSED"] },
          deletedAt: null,
          payment: { is: null },
        },
        select: {
          id: true,
          orderNumber: true,
          total: true,
          createdAt: true,
          customer: { select: { name: true, phone: true } },
        },
        orderBy: { createdAt: "desc" },
      });
    });
  }

  /** @param {number} [limit=20] @returns {Promise<Array>} */
  async getAdminRecentActivities(limit = 20) {
    return cached(
      shortCache,
      `admin:activities:${limit}`,
      TTL.SHORT,
      async () => {
        const [orders, expenses, shifts] = await Promise.all([
          prisma.order.findMany({
            where: { deletedAt: null },
            select: {
              orderNumber: true,
              status: true,
              total: true,
              updatedAt: true,
            },
            orderBy: { updatedAt: "desc" },
            take: limit,
          }),
          prisma.expense.findMany({
            select: { title: true, amount: true, category: true, date: true },
            orderBy: { createdAt: "desc" },
            take: limit,
          }),
          prisma.shift.findMany({
            where: { status: "CLOSED" },
            select: {
              cashier: { select: { fullName: true } },
              closedAt: true,
              cashSales: true,
            },
            orderBy: { closedAt: "desc" },
            take: limit,
          }),
        ]);

        const activities = [
          ...orders.map((o) => ({
            type: "order",
            desc: `${o.orderNumber} → ${o.status}`,
            amount: o.total,
            date: o.updatedAt,
          })),
          ...expenses.map((e) => ({
            type: "expense",
            desc: e.title,
            amount: e.amount,
            date: e.date,
          })),
          ...shifts.map((s) => ({
            type: "shift",
            desc: `Shift ${s.cashier.fullName} ditutup`,
            amount: s.cashSales,
            date: s.closedAt,
          })),
        ];

        return activities.sort((a, b) => b.date - a.date).slice(0, limit);
      }
    );
  }

  /** @returns {Promise<Object>} */
  async getAdminCustomerRetention() {
    return cached(mediumCache, `admin:retention`, TTL.MEDIUM, async () => {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

      const raw = await prisma.$queryRaw`
        WITH customer_months AS (
          SELECT DISTINCT 
            c."id",
            DATE_TRUNC('month', o."createdAt")::date as month
          FROM "Customer" c
          INNER JOIN "Order" o ON c."id" = o."customerId"
          WHERE o."createdAt" >= ${threeMonthsAgo}
            AND o."status" IN ('COMPLETED','CLOSED')
            AND o."deletedAt" IS NULL
        ),
        first_month AS (
          SELECT "id", MIN(month) as first_month FROM customer_months GROUP BY "id"
        ),
        retention_data AS (
          SELECT 
            cm.month,
            COUNT(DISTINCT cm."id") as total_customers,
            COUNT(DISTINCT CASE WHEN fm.first_month < cm.month THEN cm."id" END) as returning_customers
          FROM customer_months cm
          INNER JOIN first_month fm ON cm."id" = fm."id"
          GROUP BY cm.month
          ORDER BY cm.month
        )
        SELECT 
          month,
          total_customers,
          returning_customers,
          CASE 
            WHEN total_customers > 0 
            THEN ROUND((returning_customers::float / total_customers * 100)::numeric, 1)
            ELSE 0 
          END as retention_rate
        FROM retention_data
      `;
      return raw.map((r) => ({
        month: r.month,
        totalCustomers: Number(r.total_customers),
        returningCustomers: Number(r.returning_customers),
        retentionRate: Number(r.retention_rate),
      }));
    });
  }

  /** @returns {Promise<Object>} */
  async getAdminRevenueVsTarget() {
    return cached(shortCache, `admin:revenuetarget`, TTL.SHORT, async () => {
      const now = new Date();
      const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const [revenue, setting] = await Promise.all([
        prisma.order.aggregate({
          where: {
            createdAt: { gte: startMonth },
            status: { in: ["COMPLETED", "CLOSED"] },
            deletedAt: null,
          },
          _sum: { total: true },
        }),
        prisma.setting.findUnique({
          where: { key: "monthly_revenue_target" },
          select: { value: true },
        }),
      ]);

      const currentRevenue = Number(revenue._sum.total || 0);
      const target = Number(setting?.value || 0);

      return {
        currentRevenue,
        target,
        percentage:
          target > 0 ? Math.round((currentRevenue / target) * 100) : 0,
        remaining: Math.max(target - currentRevenue, 0),
        daysInMonth: new Date(
          now.getFullYear(),
          now.getMonth() + 1,
          0
        ).getDate(),
        daysPassed: now.getDate(),
      };
    });
  }

  /** @returns {Promise<Array>} */
  async getAdminTopCustomersByVisit() {
    return cached(mediumCache, `admin:topcustomers`, TTL.MEDIUM, async () => {
      const raw = await prisma.$queryRaw`
        SELECT 
          c."id",
          c."name",
          c."phone",
          COUNT(DISTINCT o."id")::int as total_visits,
          COALESCE(SUM(o."total"), 0)::bigint as total_spent,
          MAX(o."createdAt") as last_visit
        FROM "Customer" c
        INNER JOIN "Order" o ON c."id" = o."customerId"
        WHERE o."status" IN ('COMPLETED','CLOSED')
          AND o."deletedAt" IS NULL
        GROUP BY c."id", c."name", c."phone"
        ORDER BY total_visits DESC
        LIMIT 10
      `;
      return raw.map((r) => ({
        customerId: r.id,
        customerName: r.name,
        phone: r.phone,
        totalVisits: Number(r.total_visits),
        totalSpent: Number(r.total_spent),
        lastVisit: r.last_visit,
      }));
    });
  }

  /** @returns {Promise<Object>} */
  async getAdminOrderCompletionTime() {
    return cached(mediumCache, `admin:completiontime`, TTL.MEDIUM, async () => {
      const raw = await prisma.$queryRaw`
        SELECT 
          ROUND(AVG(EXTRACT(EPOCH FROM (o."completedAt" - o."createdAt")) / 3600)::numeric, 1) as avg_hours,
          ROUND(MIN(EXTRACT(EPOCH FROM (o."completedAt" - o."createdAt")) / 3600)::numeric, 1) as min_hours,
          ROUND(MAX(EXTRACT(EPOCH FROM (o."completedAt" - o."createdAt")) / 3600)::numeric, 1) as max_hours,
          COUNT(o."id")::int as total_orders
        FROM "Order" o
        WHERE o."status" IN ('COMPLETED','CLOSED')
          AND o."deletedAt" IS NULL
          AND o."completedAt" IS NOT NULL
      `;
      return {
        avgHours: Number(raw[0].avg_hours) || 0,
        minHours: Number(raw[0].min_hours) || 0,
        maxHours: Number(raw[0].max_hours) || 0,
        totalOrders: Number(raw[0].total_orders),
      };
    });
  }

  // ============================================================================
  // PRODUCT INSIGHTS (NEW)
  // ============================================================================

  /** @returns {Promise<Object>} */
  async getProductCatalogSummary() {
    return cached(longCache, `product:catalog`, TTL.LONG, async () => {
      const [spareparts, services, total] = await Promise.all([
        prisma.product.count({ where: { type: "SPAREPART", isActive: true } }),
        prisma.product.count({ where: { type: "SERVICE", isActive: true } }),
        prisma.product.count({ where: { isActive: true } }),
      ]);

      return { total, spareparts, services };
    });
  }

  /** @param {string} productId @returns {Promise<Object>} */
  async getProductDetail(productId) {
    return cached(
      mediumCache,
      `product:detail:${productId}`,
      TTL.MEDIUM,
      async () => {
        const product = await prisma.product.findUnique({
          where: { id: productId },
          include: {
            image: { select: { path: true, fileName: true } },
            priceHistory: {
              orderBy: { effectiveFrom: "desc" },
              take: 5,
              select: { price: true, cost: true, effectiveFrom: true },
            },
          },
        });

        if (!product) return null;

        const [totalSold, totalRevenue] = await Promise.all([
          prisma.orderItem.aggregate({
            where: {
              productId,
              order: {
                status: { in: ["COMPLETED", "CLOSED"] },
                deletedAt: null,
              },
            },
            _sum: { quantity: true },
          }),
          prisma.orderItem.aggregate({
            where: {
              productId,
              order: {
                status: { in: ["COMPLETED", "CLOSED"] },
                deletedAt: null,
              },
            },
            _sum: { subtotal: true },
          }),
        ]);

        return {
          ...product,
          totalSold: Number(totalSold._sum.quantity || 0),
          totalRevenue: Number(totalRevenue._sum.subtotal || 0),
        };
      }
    );
  }

  /** @param {number} [days=30] @returns {Promise<Array>} */
  async getProductStockMovementHistory(productId, days = 30) {
    return cached(
      mediumCache,
      `product:movement:${productId}:${days}`,
      TTL.MEDIUM,
      async () => {
        const since = new Date(Date.now() - days * 86400000);
        const raw = await prisma.$queryRaw`
        SELECT 
          DATE(sm."createdAt") as date,
          sm."type",
          sm."sourceType",
          SUM(sm."quantity")::int as qty
        FROM "StockMovement" sm
        WHERE sm."productId" = ${productId}
          AND sm."createdAt" >= ${since}
        GROUP BY DATE(sm."createdAt"), sm."type", sm."sourceType"
        ORDER BY date DESC
      `;
        return raw.map((r) => ({
          date: r.date,
          type: r.type,
          sourceType: r.sourceType,
          qty: Number(r.qty),
        }));
      }
    );
  }

  /** @param {number} [limit=10] @returns {Promise<Array>} */
  async getTopMarginProducts(limit = 10) {
    return cached(
      mediumCache,
      `product:topmargin:${limit}`,
      TTL.MEDIUM,
      async () => {
        const raw = await prisma.$queryRaw`
        SELECT 
          p."id",
          p."name",
          p."sku",
          p."price",
          p."cost",
          p."stock",
          (p."price" - p."cost")::int as margin,
          CASE WHEN p."price" > 0 THEN ROUND(((p."price" - p."cost")::float / p."price" * 100)::numeric, 1) ELSE 0 END as margin_pct
        FROM "Product" p
        WHERE p."type" = 'SPAREPART' AND p."isActive" = true
        ORDER BY margin DESC
        LIMIT ${limit}
      `;
        return raw.map((r) => ({
          id: r.id,
          name: r.name,
          sku: r.sku,
          price: Number(r.price),
          cost: Number(r.cost),
          stock: Number(r.stock),
          margin: Number(r.margin),
          marginPct: Number(r.margin_pct),
        }));
      }
    );
  }

  // ============================================================================
  // SETTINGS INSIGHTS (NEW)
  // ============================================================================

  /** @returns {Promise<Array>} */
  async getAllSettings() {
    return cached(longCache, `settings:all`, TTL.LONG, async () => {
      return prisma.setting.findMany({
        select: { key: true, value: true, updatedAt: true },
        orderBy: { key: "asc" },
      });
    });
  }

  /** @param {string} key @returns {Promise<Object|null>} */
  async getSettingByKey(key) {
    return cached(longCache, `settings:key:${key}`, TTL.LONG, async () => {
      return prisma.setting.findUnique({
        where: { key },
        select: { key: true, value: true, updatedAt: true },
      });
    });
  }

  /** @returns {Promise<Object>} */
  async getSystemConfiguration() {
    return cached(longCache, `settings:system`, TTL.LONG, async () => {
      const settings = await prisma.setting.findMany({
        where: {
          key: {
            in: [
              "tax_rate",
              "enable_ppn",
              "enable_pph",
              "pph_rate",
              "ppn_rate",
              "mechanic_max_tasks",
              "shift_min_starting_cash",
              "stock_low_threshold",
            ],
          },
        },
        select: { key: true, value: true },
      });

      const config = {};
      for (const s of settings) {
        config[s.key] = s.value;
      }

      return config;
    });
  }

  // ============================================================================
  // CUSTOMER INSIGHTS (NEW)
  // ============================================================================

  /** @param {string} customerId @returns {Promise<Object>} */
  async getCustomerProfile(customerId) {
    return cached(
      mediumCache,
      `customer:profile:${customerId}`,
      TTL.MEDIUM,
      async () => {
        const customer = await prisma.customer.findUnique({
          where: { id: customerId },
          include: {
            vehicles: {
              select: { plateNumber: true, brand: true, model: true },
            },
          },
        });

        if (!customer) return null;

        const [orderStats, lastOrder] = await Promise.all([
          prisma.order.aggregate({
            where: {
              customerId,
              status: { in: ["COMPLETED", "CLOSED"] },
              deletedAt: null,
            },
            _count: true,
            _sum: { total: true },
          }),
          prisma.order.findFirst({
            where: { customerId, deletedAt: null },
            select: { createdAt: true, orderNumber: true },
            orderBy: { createdAt: "desc" },
          }),
        ]);

        return {
          ...customer,
          totalOrders: orderStats._count,
          totalSpent: Number(orderStats._sum.total || 0),
          lastVisit: lastOrder?.createdAt || null,
        };
      }
    );
  }

  /** @param {number} [days=30] @returns {Promise<Array>} */
  async getNewCustomers(days = 30) {
    return cached(mediumCache, `customer:new:${days}`, TTL.MEDIUM, async () => {
      const since = new Date(Date.now() - days * 86400000);
      return prisma.customer.findMany({
        where: { createdAt: { gte: since } },
        select: {
          id: true,
          name: true,
          phone: true,
          createdAt: true,
          _count: { select: { orders: true, vehicles: true } },
        },
        orderBy: { createdAt: "desc" },
      });
    });
  }

  /** @returns {Promise<Array>} */
  async getInactiveCustomers() {
    return cached(mediumCache, `customer:inactive`, TTL.MEDIUM, async () => {
      const ninetyDaysAgo = new Date(Date.now() - 90 * 86400000);

      const raw = await prisma.$queryRaw`
        SELECT 
          c."id",
          c."name",
          c."phone",
          MAX(o."createdAt") as last_visit,
          COUNT(o."id")::int as total_orders,
          COALESCE(SUM(o."total"), 0)::bigint as total_spent
        FROM "Customer" c
        INNER JOIN "Order" o ON c."id" = o."customerId"
        WHERE o."status" IN ('COMPLETED','CLOSED')
          AND o."deletedAt" IS NULL
        GROUP BY c."id", c."name", c."phone"
        HAVING MAX(o."createdAt") < ${ninetyDaysAgo}
        ORDER BY last_visit ASC
        LIMIT 20
      `;
      return raw.map((r) => ({
        customerId: r.id,
        customerName: r.name,
        phone: r.phone,
        lastVisit: r.last_visit,
        totalOrders: Number(r.total_orders),
        totalSpent: Number(r.total_spent),
      }));
    });
  }

  // ============================================================================
  // VEHICLE INSIGHTS (NEW)
  // ============================================================================

  /** @returns {Promise<Array>} */
  async getVehicleModelDistribution() {
    return cached(longCache, `vehicle:distribution`, TTL.LONG, async () => {
      const raw = await prisma.$queryRaw`
        SELECT 
          COALESCE(v."model", 'Unknown') as model,
          COUNT(v."id")::int as count
        FROM "Vehicle" v
        GROUP BY v."model"
        ORDER BY count DESC
      `;
      return raw.map((r) => ({ model: r.model, count: Number(r.count) }));
    });
  }

  /** @returns {Promise<Object>} */
  async getVehicleStats() {
    return cached(longCache, `vehicle:stats`, TTL.LONG, async () => {
      const [total, withOrders, withoutOrders] = await Promise.all([
        prisma.vehicle.count(),
        prisma.$queryRaw`
          SELECT COUNT(DISTINCT v."id")::int as count
          FROM "Vehicle" v
          INNER JOIN "Order" o ON v."id" = o."vehicleId"
          WHERE o."deletedAt" IS NULL
        `,
        prisma.$queryRaw`
          SELECT COUNT(v."id")::int as count
          FROM "Vehicle" v
          WHERE NOT EXISTS (
            SELECT 1 FROM "Order" o WHERE o."vehicleId" = v."id" AND o."deletedAt" IS NULL
          )
        `,
      ]);

      return {
        total,
        withOrders: Number(withOrders[0].count),
        withoutOrders: Number(withoutOrders[0].count),
      };
    });
  }

  // ============================================================================
  // CACHE MANAGEMENT (NEW)
  // ============================================================================

  /** Invalidate all mechanic caches for a specific mechanic */
  async invalidateMechanicCache(mechanicId) {
    const keys = await shortCache.invalidate(`mechanic:${mechanicId}`);
    const keys2 = await mediumCache.invalidate(`mechanic:${mechanicId}`);
    return keys + keys2;
  }

  /** Invalidate all cashier caches for a specific cashier */
  async invalidateCashierCache(cashierId) {
    const keys = await shortCache.invalidate(`cashier:${cashierId}`);
    const keys2 = await mediumCache.invalidate(`cashier:${cashierId}`);
    return keys + keys2;
  }

  /** Invalidate all admin dashboard caches */
  async invalidateAdminCache() {
    const keys1 = await shortCache.invalidate(`admin:`);
    const keys2 = await mediumCache.invalidate(`admin:`);
    return keys1 + keys2;
  }

  /** Invalidate all product caches */
  async invalidateProductCache(productId = null) {
    if (productId) {
      const keys1 = await mediumCache.invalidate(`product:${productId}`);
      const keys2 = await longCache.invalidate(`product:${productId}`);
      return keys1 + keys2;
    }
    const keys1 = await mediumCache.invalidate(`product:`);
    const keys2 = await longCache.invalidate(`product:`);
    return keys1 + keys2;
  }

  /** Invalidate all settings caches */
  async invalidateSettingsCache() {
    return await longCache.invalidate(`settings:`);
  }

  /** Invalidate all customer caches */
  async invalidateCustomerCache(customerId = null) {
    if (customerId) {
      return await mediumCache.invalidate(`customer:${customerId}`);
    }
    return await mediumCache.invalidate(`customer:`);
  }

  /** Invalidate all vehicle caches */
  async invalidateVehicleCache() {
    return await longCache.invalidate(`vehicle:`);
  }

  /** Get cache info for debugging */
  async getCacheInfo() {
    const [short, medium, long] = await Promise.all([
      shortCache.getInfo(),
      mediumCache.getInfo(),
      longCache.getInfo(),
    ]);

    return {
      short,
      medium,
      long,
      totalKeys: short.totalKeys + medium.totalKeys + long.totalKeys,
    };
  }

  /** Clear all insight caches */
  async clearAllCaches() {
    const [s, m, l] = await Promise.all([
      shortCache.invalidateAll(),
      mediumCache.invalidateAll(),
      longCache.invalidateAll(),
    ]);
    return { short: s, medium: m, long: l, total: s + m + l };
  }
}

export default InsightRepository;
