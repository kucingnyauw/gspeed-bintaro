import prisma from "#app/database.js";
import CacheManager from "#shared/utils/cache.js";

const shortCache = new CacheManager("insight:short");
const mediumCache = new CacheManager("insight:medium");
const longCache = new CacheManager("insight:long");

const TTL = {
  SHORT: 5 * 60,
  MEDIUM: 10 * 60,
  LONG: 30 * 60,
};

/**
 * Helper: ambil setting dari database
 * @param {string} key
 * @param {string} [defaultValue]
 * @returns {Promise<string>}
 */
async function getSetting(key, defaultValue = null) {
  const setting = await prisma.setting.findUnique({
    where: { key },
    select: { value: true },
  });
  return setting?.value || defaultValue;
}

/**
 * Helper: cache wrapper
 * @param {CacheManager} cacheInstance
 * @param {string} key
 * @param {number} ttl
 * @param {Function} fetcher
 * @returns {Promise<any>}
 */
async function cached(cacheInstance, key, ttl, fetcher) {
  const cachedData = await cacheInstance.get(key);
  if (cachedData !== null) return cachedData;
  const data = await fetcher();
  await cacheInstance.set(key, data, ttl);
  return data;
}

class InsightRepository {
  // ============================================================================
  // MEKANIK (10 methods)
  // ============================================================================

  /**
   * Job aktif yang sedang dikerjakan mekanik (IN_PROGRESS)
   * @param {string} mechanicId
   * @returns {Promise<Array<{orderNumber: string, service: string, status: string, plateNumber: string, vehicle: string, customer: string, startAt: Date, createdAt: Date}>>}
   */
  async getMechanicActiveJobs(mechanicId) {
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
                  vehicle: { select: { plateNumber: true, model: true } },
                  customer: { select: { name: true } },
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
          plateNumber: i.orderItem.order.vehicle?.plateNumber || "-",
          vehicle: i.orderItem.order.vehicle?.model || "-",
          customer: i.orderItem.order.customer?.name || "Umum",
          startAt: i.startAt,
          createdAt: i.orderItem.order.createdAt,
        }))
      );
  }

  /**
   * Job antrian yang menunggu dikerjakan mekanik (QUEUED)
   * @param {string} mechanicId
   * @returns {Promise<Array<{orderNumber: string, service: string, plateNumber: string, customer: string, createdAt: Date}>>}
   */
  async getMechanicPendingJobs(mechanicId) {
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
                  vehicle: { select: { plateNumber: true, model: true } },
                  customer: { select: { name: true } },
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
          plateNumber: i.orderItem.order.vehicle?.plateNumber || "-",
          customer: i.orderItem.order.customer?.name || "Umum",
          createdAt: i.orderItem.order.createdAt,
        }))
      );
  }

  /**
   * Ringkasan performa mekanik: job selesai + pendapatan + utilisasi
   * @param {string} mechanicId
   * @returns {Promise<{todayCompleted: number, weekCompleted: number, monthCompleted: number, monthEarnings: number, activeJobs: number, maxTasks: number, utilizationPct: number}>}
   */
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
        const maxTasks = parseInt(
          await getSetting("mechanic_max_tasks", "5"),
          10
        );

        const [today, week, month, activeCount] = await Promise.all([
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
          prisma.$queryRaw`SELECT COUNT(ma."id")::int as count, COALESCE(SUM(oi."subtotal"), 0)::bigint as earnings FROM "MechanicAssignment" ma INNER JOIN "OrderItem" oi ON ma."orderItemId" = oi."id" INNER JOIN "Order" o ON oi."orderId" = o."id" WHERE ma."mechanicId" = ${mechanicId} AND ma."endAt" >= ${startMonth} AND o."status" IN ('COMPLETED','CLOSED') AND o."deletedAt" IS NULL`,
          prisma.mechanicAssignment.count({
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
          }),
        ]);

        return {
          todayCompleted: today,
          weekCompleted: week,
          monthCompleted: Number(month[0].count),
          monthEarnings: Number(month[0].earnings),
          activeJobs: activeCount,
          maxTasks,
          utilizationPct:
            maxTasks > 0 ? Math.round((activeCount / maxTasks) * 100) : 0,
        };
      }
    );
  }

  /**
   * Riwayat kerja harian mekanik
   * @param {string} mechanicId
   * @param {number} [days=7]
   * @returns {Promise<Array<{date: string, completed: number, earnings: number}>>}
   */
  async getMechanicDailyHistory(mechanicId, days = 7) {
    return cached(
      mediumCache,
      `mechanic:daily:${mechanicId}:${days}`,
      TTL.MEDIUM,
      async () => {
        const since = new Date(Date.now() - days * 86400000);
        const raw =
          await prisma.$queryRaw`SELECT DATE(ma."endAt") as date, COUNT(ma."id")::int as completed, COALESCE(SUM(oi."subtotal"), 0)::bigint as earnings FROM "MechanicAssignment" ma INNER JOIN "OrderItem" oi ON ma."orderItemId" = oi."id" INNER JOIN "Order" o ON oi."orderId" = o."id" WHERE ma."mechanicId" = ${mechanicId} AND ma."endAt" >= ${since} AND o."status" IN ('COMPLETED','CLOSED') AND o."deletedAt" IS NULL GROUP BY DATE(ma."endAt") ORDER BY date ASC`;
        return raw.map((r) => ({
          date: r.date,
          completed: Number(r.completed),
          earnings: Number(r.earnings),
        }));
      }
    );
  }

  /**
   * Statistik kecepatan kerja mekanik
   * @param {string} mechanicId
   * @returns {Promise<{totalJobs: number, avgTimeMinutes: number, fastestMinutes: number, slowestMinutes: number}>}
   */
  async getMechanicSpeedStats(mechanicId) {
    return cached(
      mediumCache,
      `mechanic:speed:${mechanicId}`,
      TTL.MEDIUM,
      async () => {
        const raw =
          await prisma.$queryRaw`SELECT COUNT(ma."id")::int as total, ROUND(AVG(EXTRACT(EPOCH FROM (ma."endAt" - ma."startAt")) / 60))::int as avg, ROUND(MIN(EXTRACT(EPOCH FROM (ma."endAt" - ma."startAt")) / 60))::int as min, ROUND(MAX(EXTRACT(EPOCH FROM (ma."endAt" - ma."startAt")) / 60))::int as max FROM "MechanicAssignment" ma WHERE ma."mechanicId" = ${mechanicId} AND ma."endAt" IS NOT NULL AND ma."startAt" IS NOT NULL`;
        return {
          totalJobs: Number(raw[0].total),
          avgTimeMinutes: Number(raw[0].avg) || 0,
          fastestMinutes: Number(raw[0].min) || 0,
          slowestMinutes: Number(raw[0].max) || 0,
        };
      }
    );
  }

  /**
   * 5 service yang paling sering dikerjakan mekanik
   * @param {string} mechanicId
   * @returns {Promise<Array<{serviceName: string, count: number}>>}
   */
  async getMechanicTopServices(mechanicId) {
    return cached(
      mediumCache,
      `mechanic:topservices:${mechanicId}`,
      TTL.MEDIUM,
      async () => {
        const raw =
          await prisma.$queryRaw`SELECT oi."productNameSnapshot" as "serviceName", COUNT(ma."id")::int as count FROM "MechanicAssignment" ma INNER JOIN "OrderItem" oi ON ma."orderItemId" = oi."id" WHERE ma."mechanicId" = ${mechanicId} GROUP BY oi."productNameSnapshot" ORDER BY count DESC LIMIT 5`;
        return raw.map((r) => ({
          serviceName: r.serviceName,
          count: Number(r.count),
        }));
      }
    );
  }

  /**
   * Breakdown pendapatan mekanik per hari
   * @param {string} mechanicId
   * @param {number} [days=30]
   * @returns {Promise<{totalEarnings: number, avgPerDay: number, jobCount: number, daily: Array}>}
   */
  async getMechanicEarningsBreakdown(mechanicId, days = 30) {
    return cached(
      mediumCache,
      `mechanic:earnings:${mechanicId}:${days}`,
      TTL.MEDIUM,
      async () => {
        const since = new Date(Date.now() - days * 86400000);
        const raw =
          await prisma.$queryRaw`SELECT DATE(ma."endAt") as date, COUNT(ma."id")::int as jobs, COALESCE(SUM(oi."subtotal"), 0)::bigint as earnings FROM "MechanicAssignment" ma INNER JOIN "OrderItem" oi ON ma."orderItemId" = oi."id" INNER JOIN "Order" o ON oi."orderId" = o."id" WHERE ma."mechanicId" = ${mechanicId} AND ma."endAt" >= ${since} AND o."status" IN ('COMPLETED','CLOSED') AND o."deletedAt" IS NULL GROUP BY DATE(ma."endAt") ORDER BY date DESC`;
        const totalEarnings = raw.reduce((s, r) => s + Number(r.earnings), 0);
        return {
          totalEarnings,
          avgPerDay: raw.length ? Math.round(totalEarnings / raw.length) : 0,
          jobCount: raw.reduce((s, r) => s + Number(r.jobs), 0),
          daily: raw.map((r) => ({
            date: r.date,
            jobs: Number(r.jobs),
            earnings: Number(r.earnings),
          })),
        };
      }
    );
  }

  /**
   * Ranking efisiensi mekanik vs mekanik lain
   * @param {string} mechanicId
   * @returns {Promise<{rank: number|null, totalMechanics: number, avgMinutes: number, totalJobs: number, mechanicName: string, betterThan: number}>}
   */
  async getMechanicEfficiencyRank(mechanicId) {
    return cached(
      mediumCache,
      `mechanic:rank:${mechanicId}`,
      TTL.MEDIUM,
      async () => {
        const raw =
          await prisma.$queryRaw`WITH mech_stats AS (SELECT ma."mechanicId", COUNT(ma."id")::int as total_jobs, ROUND(AVG(EXTRACT(EPOCH FROM (ma."endAt" - ma."startAt")) / 60))::int as avg_minutes FROM "MechanicAssignment" ma WHERE ma."endAt" IS NOT NULL AND ma."startAt" IS NOT NULL GROUP BY ma."mechanicId" HAVING COUNT(ma."id") >= 5), ranked AS (SELECT ms.*, u."fullName", RANK() OVER (ORDER BY ms.avg_minutes ASC) as "rank", COUNT(*) OVER ()::int as "totalMechanics" FROM mech_stats ms INNER JOIN "User" u ON ms."mechanicId" = u."id") SELECT * FROM ranked WHERE "mechanicId" = ${mechanicId}`;
        if (!raw.length)
          return { rank: null, totalMechanics: 0, avgMinutes: 0, totalJobs: 0 };
        return {
          rank: Number(raw[0].rank),
          totalMechanics: Number(raw[0].totalMechanics),
          avgMinutes: Number(raw[0].avg_minutes),
          totalJobs: Number(raw[0].total_jobs),
          mechanicName: raw[0].fullName,
          betterThan:
            raw[0].totalMechanics > 0
              ? Math.round(
                  (1 - Number(raw[0].rank) / Number(raw[0].totalMechanics)) *
                    100
                )
              : 0,
        };
      }
    );
  }

  /**
   * Tren performa mingguan mekanik
   * @param {string} mechanicId
   * @param {number} [days=30]
   * @returns {Promise<{trend: number, direction: string, weekly: Array}>}
   */
  async getMechanicWeeklyTrend(mechanicId, days = 30) {
    return cached(
      mediumCache,
      `mechanic:trend:${mechanicId}:${days}`,
      TTL.MEDIUM,
      async () => {
        const since = new Date(Date.now() - days * 86400000);
        const raw =
          await prisma.$queryRaw`SELECT DATE_TRUNC('week', ma."endAt")::date as week_start, COUNT(ma."id")::int as jobs, COALESCE(SUM(oi."subtotal"), 0)::bigint as earnings FROM "MechanicAssignment" ma INNER JOIN "OrderItem" oi ON ma."orderItemId" = oi."id" INNER JOIN "Order" o ON oi."orderId" = o."id" WHERE ma."mechanicId" = ${mechanicId} AND ma."endAt" >= ${since} AND o."status" IN ('COMPLETED','CLOSED') AND o."deletedAt" IS NULL GROUP BY week_start ORDER BY week_start ASC`;
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
  // KASIR (9 methods)
  // ============================================================================

  /**
   * Ringkasan penjualan kasir hari ini
   * @param {string} cashierId
   * @returns {Promise<{todaySales: number, todayOrders: number, todayCashAmount: number, todayQrisAmount: number, pendingOrders: number, minStartingCash: number}>}
   */
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
        const minStartingCash = parseInt(
          await getSetting("shift_min_starting_cash", "1000000"),
          10
        );
        const [orderAgg, paymentAgg, pendingCount] = await Promise.all([
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
          prisma.$queryRaw`SELECT COALESCE(SUM(CASE WHEN p."method" = 'CASH' THEN p."amountPaid" ELSE 0 END), 0)::bigint as cash, COALESCE(SUM(CASE WHEN p."method" = 'QRIS' THEN p."amountPaid" ELSE 0 END), 0)::bigint as qris FROM "Payment" p INNER JOIN "Order" o ON p."orderId" = o."id" WHERE o."cashierId" = ${cashierId} AND o."createdAt" >= ${start} AND o."createdAt" <= ${end} AND o."deletedAt" IS NULL`,
          prisma.order.count({
            where: {
              cashierId,
              status: { in: ["DRAFT", "QUEUED", "IN_PROGRESS"] },
              deletedAt: null,
            },
          }),
        ]);
        return {
          todaySales: Number(orderAgg._sum.total || 0),
          todayOrders: orderAgg._count,
          todayCashAmount: Number(paymentAgg[0].cash),
          todayQrisAmount: Number(paymentAgg[0].qris),
          pendingOrders: pendingCount,
          minStartingCash,
        };
      }
    );
  }

  /**
   * Shift aktif kasir saat ini
   * @param {string} cashierId
   * @returns {Promise<{activeShift: Object|null, shiftSales: number, shiftExpenses: number, shiftNetCash: number|null, paymentBreakdown: Array}>}
   */
  async getCashierActiveShift(cashierId) {
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
    if (!shift)
      return {
        activeShift: null,
        shiftSales: 0,
        shiftExpenses: 0,
        shiftNetCash: null,
      };
    const [expenses, paymentBreakdown] = await Promise.all([
      prisma.expense.aggregate({
        where: { shiftId: shift.id },
        _sum: { amount: true },
      }),
      prisma.payment.groupBy({
        by: ["method"],
        where: {
          order: {
            shiftId: shift.id,
            deletedAt: null,
            status: { in: ["COMPLETED", "CLOSED"] },
          },
          status: "PAID",
        },
        _sum: { amountPaid: true },
        _count: { method: true },
      }),
    ]);
    return {
      activeShift: shift,
      shiftSales: shift.cashSales,
      shiftExpenses: Number(expenses._sum.amount || 0),
      shiftNetCash: shift.cashSales - Number(expenses._sum.amount || 0),
      paymentBreakdown: paymentBreakdown.map((p) => ({
        method: p.method,
        total: p._sum.amountPaid || 0,
        count: p._count.method,
      })),
    };
  }

  /**
   * Order pending kasir per status
   * @param {string} cashierId
   * @returns {Promise<Array<{status: string, count: number}>>}
   */
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

  /**
   * Riwayat penjualan harian kasir
   * @param {string} cashierId
   * @param {number} [days=7]
   * @returns {Promise<Array<{date: string, orders: number, sales: number}>>}
   */
  async getCashierDailyHistory(cashierId, days = 7) {
    return cached(
      mediumCache,
      `cashier:daily:${cashierId}:${days}`,
      TTL.MEDIUM,
      async () => {
        const since = new Date(Date.now() - days * 86400000);
        const raw =
          await prisma.$queryRaw`SELECT DATE("createdAt") as date, COUNT("id")::int as orders, COALESCE(SUM("total"), 0)::bigint as sales FROM "Order" WHERE "cashierId" = ${cashierId} AND "createdAt" >= ${since} AND "status" IN ('COMPLETED','CLOSED') AND "deletedAt" IS NULL GROUP BY DATE("createdAt") ORDER BY date ASC`;
        return raw.map((r) => ({
          date: r.date,
          orders: Number(r.orders),
          sales: Number(r.sales),
        }));
      }
    );
  }

  /**
   * Statistik pelanggan kasir
   * @param {string} cashierId
   * @returns {Promise<{totalCustomers: number, newToday: number, topCustomer: Object|null}>}
   */
  async getCashierCustomerStats(cashierId) {
    return cached(
      shortCache,
      `cashier:customer:${cashierId}`,
      TTL.SHORT,
      async () => {
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        const [total, newToday, top] = await Promise.all([
          prisma.$queryRaw`SELECT COUNT(DISTINCT "customerId")::int as count FROM "Order" WHERE "cashierId" = ${cashierId} AND "deletedAt" IS NULL AND "customerId" IS NOT NULL`,
          prisma.$queryRaw`SELECT COUNT(DISTINCT "customerId")::int as count FROM "Order" WHERE "cashierId" = ${cashierId} AND "createdAt" >= ${start} AND "deletedAt" IS NULL AND "customerId" IS NOT NULL`,
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

  /**
   * Riwayat 10 shift terakhir kasir
   * @param {string} cashierId
   * @returns {Promise<{totalShifts: number, avgDiscrepancy: number, lastShifts: Array}>}
   */
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

  /**
   * 20 transaksi terbaru kasir
   * @param {string} cashierId
   * @returns {Promise<Array<{orderNumber: string, total: number, status: string, customer: string, method: string|null, createdAt: Date}>>}
   */
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
              payment: { select: { method: true } },
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

  /**
   * Perbandingan penjualan kasir hari ini vs kemarin + ranking
   * @param {string} cashierId
   * @returns {Promise<{todaySales: number, todayOrders: number, yesterdaySales: number, yesterdayOrders: number, salesChange: number, rank: number|null}>}
   */
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
          prisma.$queryRaw`WITH today_ranks AS (SELECT o."cashierId", SUM(o."total")::bigint as sales, RANK() OVER (ORDER BY SUM(o."total") DESC) as "rank" FROM "Order" o WHERE o."createdAt" >= ${startDay} AND o."status" IN ('COMPLETED','CLOSED') AND o."deletedAt" IS NULL AND o."cashierId" IS NOT NULL GROUP BY o."cashierId") SELECT "rank" FROM today_ranks WHERE "cashierId" = ${cashierId}`,
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
  // ADMIN - DASHBOARD (6 methods)
  // ============================================================================

  /**
   * Dashboard snapshot bengkel
   * @returns {Promise<{dailyRevenue: number, monthlyRevenue: number, activeMechanics: number, openShifts: number, lowStockItems: number, lowStockThreshold: number, mechanicMaxTasks: number}>}
   */
  async getAdminDashboardSnapshot() {
    return cached(shortCache, "admin:dashboard", TTL.SHORT, async () => {
      const now = new Date();
      const startDay = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      );
      const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const lowThreshold = parseInt(
        await getSetting("stock_low_threshold", "5"),
        10
      );
      const maxTasks = parseInt(
        await getSetting("mechanic_max_tasks", "5"),
        10
      );
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
          where: {
            type: "SPAREPART",
            isActive: true,
            stock: { lte: lowThreshold },
          },
        }),
      ]);
      return {
        dailyRevenue: Number(daily._sum.total || 0),
        monthlyRevenue: Number(monthly._sum.total || 0),
        activeMechanics: mechanics,
        openShifts: shifts,
        lowStockItems: lowStock,
        lowStockThreshold: lowThreshold,
        mechanicMaxTasks: maxTasks,
      };
    });
  }

  /**
   * Ringkasan bisnis hari ini
   * @returns {Promise<{totalRevenue: number, totalOrders: number, avgOrderValue: number, topProduct: string|null, paymentBreakdown: Array}>}
   */
  async getAdminTodaySummary() {
    return cached(shortCache, "admin:today", TTL.SHORT, async () => {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date();
      end.setHours(23, 59, 59, 999);
      const [agg, top, paymentBreakdown] = await Promise.all([
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
        prisma.$queryRaw`SELECT oi."productNameSnapshot" as name, SUM(oi."quantity")::int as qty FROM "OrderItem" oi INNER JOIN "Order" o ON oi."orderId" = o."id" WHERE o."createdAt" >= ${start} AND o."createdAt" <= ${end} AND o."deletedAt" IS NULL GROUP BY oi."productNameSnapshot" ORDER BY qty DESC LIMIT 1`,
        prisma.payment.groupBy({
          by: ["method"],
          where: {
            order: { createdAt: { gte: start, lte: end }, deletedAt: null },
          },
          _sum: { amountPaid: true },
          _count: { method: true },
        }),
      ]);
      return {
        totalRevenue: Number(agg._sum.total || 0),
        totalOrders: agg._count,
        avgOrderValue: Math.round(agg._avg.total || 0),
        topProduct: top[0]?.name || null,
        paymentBreakdown: paymentBreakdown.map((p) => ({
          method: p.method,
          total: p._sum.amountPaid || 0,
          count: p._count.method,
        })),
      };
    });
  }

  /**
   * Performa semua kasir
   * @param {Object} [params] - { days, startDate }
   * @returns {Promise<Array<{cashierName: string, shiftCount: number, totalSales: number, avgDiscrepancy: number}>>}
   */
  async getAdminCashierPerformance(params = {}) {
    const days = params.days || 30;
    return cached(
      mediumCache,
      `admin:cashiers:${days}`,
      TTL.MEDIUM,
      async () => {
        const since = params.startDate
          ? new Date(params.startDate)
          : new Date(Date.now() - days * 86400000);
        const raw =
          await prisma.$queryRaw`SELECT u."fullName" as "cashierName", COUNT(s."id")::int as "shiftCount", COALESCE(SUM(s."cashSales"), 0)::bigint as "totalSales", ROUND(AVG(s."discrepancy"))::int as "avgDiscrepancy" FROM "Shift" s INNER JOIN "User" u ON s."cashierId" = u."id" WHERE s."openedAt" >= ${since} GROUP BY u."fullName" ORDER BY "totalSales" DESC`;
        return raw.map((r) => ({
          cashierName: r.cashierName,
          shiftCount: Number(r.shiftCount),
          totalSales: Number(r.totalSales),
          avgDiscrepancy: Number(r.avgDiscrepancy) || 0,
        }));
      }
    );
  }

  /**
   * Perbandingan performa semua mekanik
   * @param {Object} [params] - { days, startDate }
   * @returns {Promise<Array<{mechanicName: string, totalJobs: number, completedJobs: number, completionRate: number, totalEarnings: number}>>}
   */
  async getAdminMechanicComparison(params = {}) {
    const days = params.days || 30;
    return cached(
      mediumCache,
      `admin:mechanics:${days}`,
      TTL.MEDIUM,
      async () => {
        const since = params.startDate
          ? new Date(params.startDate)
          : new Date(Date.now() - days * 86400000);
        const raw =
          await prisma.$queryRaw`SELECT u."fullName" as "mechanicName", COUNT(ma."id")::int as "totalJobs", COUNT(CASE WHEN ma."endAt" IS NOT NULL AND o."status" IN ('COMPLETED','CLOSED') AND o."deletedAt" IS NULL THEN 1 END)::int as "completedJobs", CASE WHEN COUNT(ma."id") > 0 THEN ROUND((COUNT(CASE WHEN ma."endAt" IS NOT NULL AND o."status" IN ('COMPLETED','CLOSED') AND o."deletedAt" IS NULL THEN 1 END)::float / COUNT(ma."id") * 100)) ELSE 0 END as "completionRate", COALESCE(SUM(CASE WHEN ma."endAt" IS NOT NULL AND o."status" IN ('COMPLETED','CLOSED') AND o."deletedAt" IS NULL THEN oi."subtotal" ELSE 0 END), 0)::bigint as "totalEarnings" FROM "User" u LEFT JOIN "MechanicAssignment" ma ON u."id" = ma."mechanicId" LEFT JOIN "OrderItem" oi ON ma."orderItemId" = oi."id" LEFT JOIN "Order" o ON oi."orderId" = o."id" WHERE u."role" = 'MECHANIC' AND ma."createdAt" >= ${since} GROUP BY u."fullName" ORDER BY "totalEarnings" DESC`;
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

  /**
   * Overview pengeluaran bulan ini
   * @returns {Promise<{totalExpenses: number, topCategory: string|null, expenseGrowth: number, byCategory: Array}>}
   */
  async getAdminExpenseOverview() {
    return cached(mediumCache, "admin:expenses", TTL.MEDIUM, async () => {
      const now = new Date();
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const [thisExp, lastExp, top, allCategories] = await Promise.all([
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
        prisma.expense.groupBy({
          by: ["category"],
          where: { date: { gte: thisMonth, lt: nextMonth } },
          _sum: { amount: true },
          orderBy: { _sum: { amount: "desc" } },
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
        byCategory: allCategories.map((c) => ({
          category: c.category,
          total: Number(c._sum.amount || 0),
        })),
      };
    });
  }

  /**
   * Distribusi status order
   * @param {Object} [params] - { days, startDate }
   * @returns {Promise<Array<{status: string, count: number, pct: number}>>}
   */
  async getAdminOrderStatusDistribution(params = {}) {
    const days = params.days || 30;
    return cached(
      mediumCache,
      `admin:orderstatus:${days}`,
      TTL.MEDIUM,
      async () => {
        const since = params.startDate
          ? new Date(params.startDate)
          : new Date(Date.now() - days * 86400000);
        const raw =
          await prisma.$queryRaw`SELECT "status", COUNT("id")::int as count FROM "Order" WHERE "createdAt" >= ${since} AND "deletedAt" IS NULL GROUP BY "status" ORDER BY count DESC`;
        const total = raw.reduce((s, r) => s + Number(r.count), 0);
        return raw.map((r) => ({
          status: r.status,
          count: Number(r.count),
          pct: total ? Math.round((Number(r.count) / total) * 10000) / 100 : 0,
        }));
      }
    );
  }

  // ============================================================================
  // ADMIN - INVENTORY & GROWTH (5 methods)
  // ============================================================================

  /**
   * Kesehatan inventori bengkel
   * @returns {Promise<{totalStockValue: number, deadStockValue: number, turnoverRate: number, mostProfitable: string|null, outOfStock: number, lowStock: number, healthy: number, lowThreshold: number}>}
   */
  async getAdminInventoryHealth() {
    return cached(mediumCache, "admin:inventory", TTL.MEDIUM, async () => {
      const since90 = new Date(Date.now() - 90 * 86400000);
      const lowThreshold = parseInt(
        await getSetting("stock_low_threshold", "5"),
        10
      );
      const [stockValue, dead, turnover, top, stockDistribution] =
        await Promise.all([
          prisma.$queryRaw`SELECT COALESCE(SUM("stock" * "cost"), 0)::bigint as val FROM "Product" WHERE "type" = 'SPAREPART' AND "isActive" = true`,
          prisma.$queryRaw`SELECT COALESCE(SUM(p."stock" * p."cost"), 0)::bigint as val FROM "Product" p WHERE p."type" = 'SPAREPART' AND p."isActive" = true AND p."stock" > 0 AND NOT EXISTS (SELECT 1 FROM "StockMovement" sm WHERE sm."productId" = p."id" AND sm."type" = 'OUT' AND sm."createdAt" >= ${since90})`,
          prisma.$queryRaw`SELECT ROUND(COALESCE(SUM(sm."quantity"), 0) / NULLIF(SUM(p."stock"), 0) * 100) / 100 as rate FROM "Product" p LEFT JOIN "StockMovement" sm ON p."id" = sm."productId" AND sm."type" = 'OUT' AND sm."createdAt" >= ${since90} WHERE p."type" = 'SPAREPART' AND p."isActive" = true`,
          prisma.$queryRaw`SELECT oi."productNameSnapshot" as name, SUM(oi."subtotal" - (oi."unitCostSnapshot" * oi."quantity"))::bigint as profit FROM "OrderItem" oi INNER JOIN "Order" o ON oi."orderId" = o."id" WHERE o."status" IN ('COMPLETED','CLOSED') AND o."deletedAt" IS NULL GROUP BY oi."productNameSnapshot" ORDER BY profit DESC LIMIT 1`,
          prisma.$queryRaw`SELECT COUNT(*)::int as "outOfStock", COUNT(*) FILTER (WHERE "stock" > 0 AND "stock" <= ${lowThreshold})::int as "lowStock", COUNT(*) FILTER (WHERE "stock" > ${lowThreshold})::int as "healthy" FROM "Product" WHERE "type" = 'SPAREPART' AND "isActive" = true`,
        ]);
      return {
        totalStockValue: Number(stockValue[0].val),
        deadStockValue: Number(dead[0].val),
        turnoverRate: Number(turnover[0].rate),
        mostProfitable: top[0]?.name || null,
        outOfStock: Number(stockDistribution[0].outOfStock),
        lowStock: Number(stockDistribution[0].lowStock),
        healthy: Number(stockDistribution[0].healthy),
        lowThreshold,
      };
    });
  }

  /**
   * Pertumbuhan bisnis bulan ini vs bulan lalu
   * @returns {Promise<{revenueGrowth: number, customerGrowth: number, orderGrowth: number}>}
   */
  async getAdminBusinessGrowth() {
    return cached(mediumCache, "admin:growth", TTL.MEDIUM, async () => {
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

  /**
   * Laporan laba bersih harian
   * @param {Object} [params] - { days, startDate }
   * @returns {Promise<Array<{date: string, revenue: number, expenses: number, net: number}>>}
   */
  async getAdminDailyNetReport(params = {}) {
    const days = params.days || 7;
    return cached(
      mediumCache,
      `admin:dailyreport:${days}`,
      TTL.MEDIUM,
      async () => {
        const since = params.startDate
          ? new Date(params.startDate)
          : new Date(Date.now() - days * 86400000);
        const raw =
          await prisma.$queryRaw`WITH rev AS (SELECT DATE("createdAt") as date, SUM("total")::bigint as revenue FROM "Order" WHERE "createdAt" >= ${since} AND "status" IN ('COMPLETED','CLOSED') AND "deletedAt" IS NULL GROUP BY date), exp AS (SELECT DATE("date") as date, SUM("amount")::bigint as expenses FROM "Expense" WHERE "date" >= ${since} GROUP BY date) SELECT COALESCE(r.date, e.date) as date, COALESCE(r.revenue, 0) as revenue, COALESCE(e.expenses, 0) as expenses, COALESCE(r.revenue, 0) - COALESCE(e.expenses, 0) as net FROM rev r FULL OUTER JOIN exp e ON r.date = e.date ORDER BY date ASC`;
        return raw.map((r) => ({
          date: r.date,
          revenue: Number(r.revenue),
          expenses: Number(r.expenses),
          net: Number(r.net),
        }));
      }
    );
  }

  /**
   * 10 sparepart terlaris
   * @param {Object} [params] - { days, startDate }
   * @returns {Promise<Array<{name: string, sold: number, revenue: number, profit: number}>>}
   */
  async getAdminTopSpareparts(params = {}) {
    const days = params.days || 30;
    return cached(
      mediumCache,
      `admin:topspareparts:${days}`,
      TTL.MEDIUM,
      async () => {
        const since = params.startDate
          ? new Date(params.startDate)
          : new Date(Date.now() - days * 86400000);
        const raw =
          await prisma.$queryRaw`SELECT oi."productNameSnapshot" as name, SUM(oi."quantity")::int as sold, SUM(oi."subtotal")::bigint as revenue, SUM(oi."subtotal" - (oi."unitCostSnapshot" * oi."quantity"))::bigint as profit FROM "OrderItem" oi INNER JOIN "Product" p ON oi."productId" = p."id" INNER JOIN "Order" o ON oi."orderId" = o."id" WHERE p."type" = 'SPAREPART' AND o."createdAt" >= ${since} AND o."status" IN ('COMPLETED','CLOSED') AND o."deletedAt" IS NULL GROUP BY oi."productNameSnapshot" ORDER BY sold DESC LIMIT 10`;
        return raw.map((r) => ({
          name: r.name,
          sold: Number(r.sold),
          revenue: Number(r.revenue),
          profit: Number(r.profit),
        }));
      }
    );
  }

  /**
   * 10 service terpopuler
   * @param {Object} [params] - { days, startDate }
   * @returns {Promise<Array<{name: string, orders: number, qty: number, revenue: number}>>}
   */
  async getAdminServicePopularity(params = {}) {
    const days = params.days || 30;
    return cached(
      mediumCache,
      `admin:services:${days}`,
      TTL.MEDIUM,
      async () => {
        const since = params.startDate
          ? new Date(params.startDate)
          : new Date(Date.now() - days * 86400000);
        const raw =
          await prisma.$queryRaw`SELECT oi."productNameSnapshot" as name, COUNT(DISTINCT o."id")::int as orders, SUM(oi."quantity")::int as qty, SUM(oi."subtotal")::bigint as revenue FROM "OrderItem" oi INNER JOIN "Product" p ON oi."productId" = p."id" INNER JOIN "Order" o ON oi."orderId" = o."id" WHERE p."type" = 'SERVICE' AND o."createdAt" >= ${since} AND o."status" IN ('COMPLETED','CLOSED') AND o."deletedAt" IS NULL GROUP BY oi."productNameSnapshot" ORDER BY orders DESC LIMIT 10`;
        return raw.map((r) => ({
          name: r.name,
          orders: Number(r.orders),
          qty: Number(r.qty),
          revenue: Number(r.revenue),
        }));
      }
    );
  }

  // ============================================================================
  // ADMIN - OPERATIONAL (8 methods)
  // ============================================================================

  /**
   * Jam tersibuk bengkel
   * @param {Object} [params] - { days, startDate }
   * @returns {Promise<{peakHour: number, peakOrders: number, hourly: Array}>}
   */
  async getAdminPeakHours(params = {}) {
    const days = params.days || 30;
    return cached(
      mediumCache,
      `admin:peakhours:${days}`,
      TTL.MEDIUM,
      async () => {
        const since = params.startDate
          ? new Date(params.startDate)
          : new Date(Date.now() - days * 86400000);
        const raw =
          await prisma.$queryRaw`SELECT EXTRACT(HOUR FROM "createdAt")::int as hour, COUNT("id")::int as orders, COALESCE(SUM("total"), 0)::bigint as revenue FROM "Order" WHERE "createdAt" >= ${since} AND "deletedAt" IS NULL GROUP BY hour ORDER BY orders DESC`;
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

  /**
   * Distribusi tipe Vespa yang diservis
   * @returns {Promise<Array<{brand: string, count: number}>>}
   */
  async getAdminVehicleDistribution() {
    return cached(mediumCache, "admin:vehicles", TTL.MEDIUM, async () => {
      const raw =
        await prisma.$queryRaw`SELECT COALESCE(v."brand", 'Unknown') as brand, COUNT(DISTINCT v."id")::int as count FROM "Vehicle" v INNER JOIN "Order" o ON v."id" = o."vehicleId" WHERE o."deletedAt" IS NULL GROUP BY v."brand" ORDER BY count DESC LIMIT 10`;
      return raw.map((r) => ({ brand: r.brand, count: Number(r.count) }));
    });
  }

  /**
   * Alert stok sparepart
   * @returns {Promise<{outOfStock: Array, lowStock: Array, overStock: Array, lowThreshold: number}>}
   */
  async getAdminStockAlert() {
    return cached(shortCache, "admin:stockalert", TTL.SHORT, async () => {
      const lowThreshold = parseInt(
        await getSetting("stock_low_threshold", "5"),
        10
      );
      const [outOfStock, lowStock, overStock] = await Promise.all([
        prisma.product.findMany({
          where: { type: "SPAREPART", isActive: true, stock: 0 },
          select: { id: true, sku: true, name: true, cost: true },
          take: 10,
        }),
        prisma.product.findMany({
          where: {
            type: "SPAREPART",
            isActive: true,
            stock: { gt: 0, lte: lowThreshold },
          },
          select: { id: true, sku: true, name: true, stock: true, cost: true },
          take: 10,
        }),
        prisma.product.findMany({
          where: { type: "SPAREPART", isActive: true, stock: { gte: 100 } },
          select: { id: true, sku: true, name: true, stock: true, cost: true },
          take: 10,
        }),
      ]);
      return { outOfStock, lowStock, overStock, lowThreshold };
    });
  }

  /**
   * Statistik refund
   * @param {Object} [params] - { days, startDate }
   * @returns {Promise<{totalRefunds: number, totalAmount: number}>}
   */
  async getAdminRefundStats(params = {}) {
    const days = params.days || 30;
    return cached(
      mediumCache,
      `admin:refunds:${days}`,
      TTL.MEDIUM,
      async () => {
        const since = params.startDate
          ? new Date(params.startDate)
          : new Date(Date.now() - days * 86400000);
        const raw =
          await prisma.$queryRaw`SELECT COUNT(p."id")::int as refunds, COALESCE(SUM(p."amountPaid"), 0)::bigint as amount FROM "Payment" p INNER JOIN "Order" o ON p."orderId" = o."id" WHERE p."status" = 'REFUNDED' AND p."paidAt" >= ${since}`;
        return {
          totalRefunds: Number(raw[0].refunds),
          totalAmount: Number(raw[0].amount),
        };
      }
    );
  }

  /**
   * Order selesai yang belum dibayar
   * @returns {Promise<Array<{id: string, orderNumber: string, total: number, createdAt: Date, customer: Object}>>}
   */
  async getAdminUnpaidOrders() {
    return cached(shortCache, "admin:unpaid", TTL.SHORT, async () => {
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

  /**
   * Aktivitas terbaru bengkel (order, expense, shift)
   * @param {number} [limit=20]
   * @returns {Promise<Array<{type: string, desc: string, amount: number, date: Date}>>}
   */
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
        return [
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
        ]
          .sort((a, b) => b.date - a.date)
          .slice(0, limit);
      }
    );
  }

  /**
   * Retensi pelanggan 3 bulan terakhir
   * @returns {Promise<Array<{month: string, totalCustomers: number, returningCustomers: number, retentionRate: number}>>}
   */
  async getAdminCustomerRetention() {
    return cached(mediumCache, "admin:retention", TTL.MEDIUM, async () => {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      const raw =
        await prisma.$queryRaw`WITH customer_months AS (SELECT DISTINCT c."id", DATE_TRUNC('month', o."createdAt")::date as month FROM "Customer" c INNER JOIN "Order" o ON c."id" = o."customerId" WHERE o."createdAt" >= ${threeMonthsAgo} AND o."status" IN ('COMPLETED','CLOSED') AND o."deletedAt" IS NULL), first_month AS (SELECT "id", MIN(month) as first_month FROM customer_months GROUP BY "id"), retention_data AS (SELECT cm.month, COUNT(DISTINCT cm."id") as total_customers, COUNT(DISTINCT CASE WHEN fm.first_month < cm.month THEN cm."id" END) as returning_customers FROM customer_months cm INNER JOIN first_month fm ON cm."id" = fm."id" GROUP BY cm.month ORDER BY cm.month) SELECT month, total_customers, returning_customers, CASE WHEN total_customers > 0 THEN ROUND((returning_customers::float / total_customers * 100)::numeric, 1) ELSE 0 END as retention_rate FROM retention_data`;
      return raw.map((r) => ({
        month: r.month,
        totalCustomers: Number(r.total_customers),
        returningCustomers: Number(r.returning_customers),
        retentionRate: Number(r.retention_rate),
      }));
    });
  }

  /**
   * Revenue vs target bulanan + proyeksi
   * @returns {Promise<{currentRevenue: number, target: number, percentage: number, remaining: number, daysInMonth: number, daysPassed: number, projectedRevenue: number}>}
   */
  async getAdminRevenueVsTarget() {
    return cached(shortCache, "admin:revenuetarget", TTL.SHORT, async () => {
      const now = new Date();
      const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const [revenue, targetSetting] = await Promise.all([
        prisma.order.aggregate({
          where: {
            createdAt: { gte: startMonth },
            status: { in: ["COMPLETED", "CLOSED"] },
            deletedAt: null,
          },
          _sum: { total: true },
        }),
        getSetting("monthly_revenue_target", "0"),
      ]);
      const currentRevenue = Number(revenue._sum.total || 0);
      const target = Number(targetSetting || 0);
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
        projectedRevenue:
          now.getDate() > 0
            ? Math.round(
                (currentRevenue / now.getDate()) *
                  new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
              )
            : 0,
      };
    });
  }

  // ============================================================================
  // ADMIN - CUSTOMER & MISC (5 methods)
  // ============================================================================

  /**
   * 10 pelanggan paling sering berkunjung
   * @returns {Promise<Array<{customerId: string, customerName: string, phone: string, totalVisits: number, totalSpent: number, lastVisit: Date}>>}
   */
  async getAdminTopCustomersByVisit() {
    return cached(mediumCache, "admin:topcustomers", TTL.MEDIUM, async () => {
      const raw =
        await prisma.$queryRaw`SELECT c."id", c."name", c."phone", COUNT(DISTINCT o."id")::int as total_visits, COALESCE(SUM(o."total"), 0)::bigint as total_spent, MAX(o."createdAt") as last_visit FROM "Customer" c INNER JOIN "Order" o ON c."id" = o."customerId" WHERE o."status" IN ('COMPLETED','CLOSED') AND o."deletedAt" IS NULL GROUP BY c."id", c."name", c."phone" ORDER BY total_visits DESC LIMIT 10`;
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

  /**
   * Rata-rata waktu penyelesaian order
   * @returns {Promise<{avgHours: number, minHours: number, maxHours: number, totalOrders: number}>}
   */
  async getAdminOrderCompletionTime() {
    return cached(mediumCache, "admin:completiontime", TTL.MEDIUM, async () => {
      const raw =
        await prisma.$queryRaw`SELECT ROUND(AVG(EXTRACT(EPOCH FROM (o."completedAt" - o."createdAt")) / 3600)::numeric, 1) as avg_hours, ROUND(MIN(EXTRACT(EPOCH FROM (o."completedAt" - o."createdAt")) / 3600)::numeric, 1) as min_hours, ROUND(MAX(EXTRACT(EPOCH FROM (o."completedAt" - o."createdAt")) / 3600)::numeric, 1) as max_hours, COUNT(o."id")::int as total_orders FROM "Order" o WHERE o."status" IN ('COMPLETED','CLOSED') AND o."deletedAt" IS NULL AND o."completedAt" IS NOT NULL`;
      return {
        avgHours: Number(raw[0].avg_hours) || 0,
        minHours: Number(raw[0].min_hours) || 0,
        maxHours: Number(raw[0].max_hours) || 0,
        totalOrders: Number(raw[0].total_orders),
      };
    });
  }

  /**
   * Distribusi metode pembayaran
   * @param {Object} [params] - { days, startDate }
   * @returns {Promise<Array<{method: string, count: number, total: number, pct: number}>>}
   */
  async getAdminPaymentMethodDistribution(params = {}) {
    const days = params.days || 30;
    return cached(
      mediumCache,
      `admin:paymentdist:${days}`,
      TTL.MEDIUM,
      async () => {
        const since = params.startDate
          ? new Date(params.startDate)
          : new Date(Date.now() - days * 86400000);
        const raw =
          await prisma.$queryRaw`SELECT p."method", COUNT(p."id")::int as count, COALESCE(SUM(p."amountPaid"), 0)::bigint as total FROM "Payment" p INNER JOIN "Order" o ON p."orderId" = o."id" WHERE p."status" = 'PAID' AND p."paidAt" >= ${since} AND o."deletedAt" IS NULL GROUP BY p."method" ORDER BY count DESC`;
        const total = raw.reduce((s, r) => s + Number(r.count), 0);
        return raw.map((r) => ({
          method: r.method,
          count: Number(r.count),
          total: Number(r.total),
          pct: total ? Math.round((Number(r.count) / total) * 10000) / 100 : 0,
        }));
      }
    );
  }

  /**
   * Ketersediaan mekanik (utilisasi)
   * @returns {Promise<Array<{mechanicId: string, mechanicName: string, activeJobs: number, maxTasks: number, available: number, utilizationPct: number}>>}
   */
  async getAdminMechanicAvailability() {
    const maxTasks = parseInt(await getSetting("mechanic_max_tasks", "5"), 10);
    const raw =
      await prisma.$queryRaw`SELECT u."id", u."fullName", COUNT(ma."id")::int as active_jobs FROM "User" u LEFT JOIN "MechanicAssignment" ma ON u."id" = ma."mechanicId" AND ma."endAt" IS NULL AND EXISTS (SELECT 1 FROM "OrderItem" oi INNER JOIN "Order" o ON oi."orderId" = o."id" WHERE oi."id" = ma."orderItemId" AND o."status" IN ('QUEUED','IN_PROGRESS') AND o."deletedAt" IS NULL) WHERE u."role" = 'MECHANIC' AND u."isActive" = true GROUP BY u."id", u."fullName" ORDER BY active_jobs ASC`;
    return raw.map((r) => ({
      mechanicId: r.id,
      mechanicName: r.fullName,
      activeJobs: Number(r.active_jobs),
      maxTasks,
      available: Math.max(0, maxTasks - Number(r.active_jobs)),
      utilizationPct:
        maxTasks > 0 ? Math.round((Number(r.active_jobs) / maxTasks) * 100) : 0,
    }));
  }

  /**
   * Review performa bisnis bulanan (YoY comparison)
   * @param {Object} [params] - { month, year }
   * @returns {Promise<{thisMonth: Object, lastYear: Object, yoyGrowth: number, targetAchievement: number}>}
   */
  async getAdminMonthlyBusinessReview(params = {}) {
    const now = new Date();
    const targetMonth = params.month
      ? parseInt(params.month) - 1
      : now.getMonth();
    const targetYear = params.year || now.getFullYear();
    const thisMonthStart = new Date(targetYear, targetMonth, 1);
    const thisMonthEnd = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59);
    const lastYearStart = new Date(targetYear - 1, targetMonth, 1);
    const lastYearEnd = new Date(
      targetYear - 1,
      targetMonth + 1,
      0,
      23,
      59,
      59
    );

    return cached(
      mediumCache,
      `admin:monthlyreview:${targetYear}:${targetMonth}`,
      TTL.MEDIUM,
      async () => {
        const [thisMonthData, lastYearData, targetSetting] = await Promise.all([
          Promise.all([
            prisma.order.aggregate({
              where: {
                createdAt: { gte: thisMonthStart, lte: thisMonthEnd },
                status: { in: ["COMPLETED", "CLOSED"] },
                deletedAt: null,
              },
              _sum: { total: true },
              _count: true,
            }),
            prisma.customer.count({
              where: { createdAt: { gte: thisMonthStart, lte: thisMonthEnd } },
            }),
            prisma.expense.aggregate({
              where: { date: { gte: thisMonthStart, lte: thisMonthEnd } },
              _sum: { amount: true },
            }),
            prisma.mechanicAssignment.count({
              where: {
                endAt: { gte: thisMonthStart, lte: thisMonthEnd },
                orderItem: {
                  order: {
                    status: { in: ["COMPLETED", "CLOSED"] },
                    deletedAt: null,
                  },
                },
              },
            }),
          ]),
          Promise.all([
            prisma.order.aggregate({
              where: {
                createdAt: { gte: lastYearStart, lte: lastYearEnd },
                status: { in: ["COMPLETED", "CLOSED"] },
                deletedAt: null,
              },
              _sum: { total: true },
              _count: true,
            }),
            prisma.customer.count({
              where: { createdAt: { gte: lastYearStart, lte: lastYearEnd } },
            }),
          ]),
          getSetting("monthly_revenue_target", "0"),
        ]);

        const thisRevenue = Number(thisMonthData[0]._sum.total || 0);
        const lastRevenue = Number(lastYearData[0]._sum.total || 0);
        const target = Number(targetSetting || 0);

        return {
          thisMonth: {
            revenue: thisRevenue,
            orders: thisMonthData[0]._count,
            newCustomers: thisMonthData[1],
            expenses: Number(thisMonthData[2]._sum.amount || 0),
            jobsCompleted: thisMonthData[3],
          },
          lastYear: {
            revenue: lastRevenue,
            orders: lastYearData[0]._count,
            newCustomers: lastYearData[1],
          },
          yoyGrowth: lastRevenue
            ? Math.round(((thisRevenue - lastRevenue) / lastRevenue) * 10000) /
              100
            : 0,
          targetAchievement:
            target > 0 ? Math.round((thisRevenue / target) * 100) : 0,
        };
      }
    );
  }

  // ============================================================================
  // PRODUCT (3 methods)
  // ============================================================================

  /**
   * Ringkasan katalog produk
   * @returns {Promise<{total: number, spareparts: number, services: number, inactive: number}>}
   */
  async getProductCatalogSummary() {
    return cached(longCache, "product:catalog", TTL.LONG, async () => {
      const [spareparts, services, total, inactive] = await Promise.all([
        prisma.product.count({ where: { type: "SPAREPART", isActive: true } }),
        prisma.product.count({ where: { type: "SERVICE", isActive: true } }),
        prisma.product.count({ where: { isActive: true } }),
        prisma.product.count({ where: { isActive: false } }),
      ]);
      return { total, spareparts, services, inactive };
    });
  }

  /**
   * Detail produk + statistik penjualan
   * @param {string} productId
   * @returns {Promise<Object|null>}
   */
  async getProductDetail(productId) {
    return cached(
      mediumCache,
      `product:detail:${productId}`,
      TTL.MEDIUM,
      async () => {
        const product = await prisma.product.findUnique({
          where: { id: productId },
          include: {
            image: { select: { path: true } },
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
          margin: product.price - product.cost,
          marginPct:
            product.price > 0
              ? Math.round(
                  ((product.price - product.cost) / product.price) * 1000
                ) / 10
              : 0,
        };
      }
    );
  }

  /**
   * Produk dengan margin tertinggi
   * @param {number} [limit=10]
   * @returns {Promise<Array<{id: string, name: string, sku: string, price: number, cost: number, stock: number, margin: number, marginPct: number}>>}
   */
  async getTopMarginProducts(limit = 10) {
    return cached(
      mediumCache,
      `product:topmargin:${limit}`,
      TTL.MEDIUM,
      async () => {
        const raw =
          await prisma.$queryRaw`SELECT p."id", p."name", p."sku", p."price", p."cost", p."stock", (p."price" - p."cost")::int as margin, CASE WHEN p."price" > 0 THEN ROUND(((p."price" - p."cost")::float / p."price" * 100)::numeric, 1) ELSE 0 END as margin_pct FROM "Product" p WHERE p."type" = 'SPAREPART' AND p."isActive" = true ORDER BY margin DESC LIMIT ${limit}`;
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
  // SETTINGS (3 methods)
  // ============================================================================

  /**
   * Semua settings
   * @returns {Promise<Array<{key: string, value: string, updatedAt: Date}>>}
   */
  async getAllSettings() {
    return cached(longCache, "settings:all", TTL.LONG, async () =>
      prisma.setting.findMany({
        select: { key: true, value: true, updatedAt: true },
        orderBy: { key: "asc" },
      })
    );
  }

  /**
   * Setting by key
   * @param {string} key
   * @returns {Promise<Object|null>}
   */
  async getSettingByKey(key) {
    return cached(longCache, `settings:key:${key}`, TTL.LONG, async () =>
      prisma.setting.findUnique({
        where: { key },
        select: { key: true, value: true, updatedAt: true },
      })
    );
  }

  /**
   * Konfigurasi sistem (tax, ppn, pph, threshold, target)
   * @returns {Promise<Object>}
   */
  async getSystemConfiguration() {
    return cached(longCache, "settings:system", TTL.LONG, async () => {
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
              "monthly_revenue_target",
            ],
          },
        },
        select: { key: true, value: true },
      });
      const config = {};
      for (const s of settings) config[s.key] = s.value;
      return config;
    });
  }

  // ============================================================================
  // CUSTOMER (3 methods)
  // ============================================================================

  /**
   * Profil pelanggan + statistik
   * @param {string} customerId
   * @returns {Promise<Object|null>}
   */
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
        const [orderStats, lastOrder, firstOrder] = await Promise.all([
          prisma.order.aggregate({
            where: {
              customerId,
              status: { in: ["COMPLETED", "CLOSED"] },
              deletedAt: null,
            },
            _count: true,
            _sum: { total: true },
            _avg: { total: true },
          }),
          prisma.order.findFirst({
            where: { customerId, deletedAt: null },
            select: { createdAt: true },
            orderBy: { createdAt: "desc" },
          }),
          prisma.order.findFirst({
            where: { customerId, deletedAt: null },
            select: { createdAt: true },
            orderBy: { createdAt: "asc" },
          }),
        ]);
        return {
          ...customer,
          totalOrders: orderStats._count,
          totalSpent: Number(orderStats._sum.total || 0),
          avgOrderValue: Math.round(Number(orderStats._avg.total || 0)),
          lastVisit: lastOrder?.createdAt || null,
          firstVisit: firstOrder?.createdAt || null,
        };
      }
    );
  }

  /**
   * Pelanggan baru dalam N hari terakhir
   * @param {number} [days=30]
   * @returns {Promise<Array>}
   */
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

  /**
   * Pelanggan tidak aktif (>90 hari)
   * @returns {Promise<Array<{customerId: string, customerName: string, phone: string, lastVisit: Date, totalOrders: number, totalSpent: number}>>}
   */
  async getInactiveCustomers() {
    return cached(mediumCache, "customer:inactive", TTL.MEDIUM, async () => {
      const ninetyDaysAgo = new Date(Date.now() - 90 * 86400000);
      const raw =
        await prisma.$queryRaw`SELECT c."id", c."name", c."phone", MAX(o."createdAt") as last_visit, COUNT(o."id")::int as total_orders, COALESCE(SUM(o."total"), 0)::bigint as total_spent FROM "Customer" c INNER JOIN "Order" o ON c."id" = o."customerId" WHERE o."status" IN ('COMPLETED','CLOSED') AND o."deletedAt" IS NULL GROUP BY c."id", c."name", c."phone" HAVING MAX(o."createdAt") < ${ninetyDaysAgo} ORDER BY last_visit ASC LIMIT 20`;
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
  // VEHICLE (2 methods)
  // ============================================================================

  /**
   * Distribusi model Vespa
   * @returns {Promise<Array<{model: string, count: number}>>}
   */
  async getVehicleModelDistribution() {
    return cached(longCache, "vehicle:distribution", TTL.LONG, async () => {
      const raw =
        await prisma.$queryRaw`SELECT COALESCE(v."model", 'Unknown') as model, COUNT(v."id")::int as count FROM "Vehicle" v GROUP BY v."model" ORDER BY count DESC`;
      return raw.map((r) => ({ model: r.model, count: Number(r.count) }));
    });
  }

  /**
   * Statistik kendaraan
   * @returns {Promise<{total: number, withOrders: number, withoutOrders: number}>}
   */
  async getVehicleStats() {
    return cached(longCache, "vehicle:stats", TTL.LONG, async () => {
      const [total, withOrders, withoutOrders] = await Promise.all([
        prisma.vehicle.count(),
        prisma.$queryRaw`SELECT COUNT(DISTINCT v."id")::int as count FROM "Vehicle" v INNER JOIN "Order" o ON v."id" = o."vehicleId" WHERE o."deletedAt" IS NULL`,
        prisma.$queryRaw`SELECT COUNT(v."id")::int as count FROM "Vehicle" v WHERE NOT EXISTS (SELECT 1 FROM "Order" o WHERE o."vehicleId" = v."id" AND o."deletedAt" IS NULL)`,
      ]);
      return {
        total,
        withOrders: Number(withOrders[0].count),
        withoutOrders: Number(withoutOrders[0].count),
      };
    });
  }

  // ============================================================================
  // CACHE MANAGEMENT (8 methods)
  // ============================================================================

  async invalidateMechanicCache(mechanicId) {
    const k1 = await shortCache.invalidate(`mechanic:${mechanicId}`);
    const k2 = await mediumCache.invalidate(`mechanic:${mechanicId}`);
    return k1 + k2;
  }
  async invalidateCashierCache(cashierId) {
    const k1 = await shortCache.invalidate(`cashier:${cashierId}`);
    const k2 = await mediumCache.invalidate(`cashier:${cashierId}`);
    return k1 + k2;
  }
  async invalidateAdminCache() {
    const k1 = await shortCache.invalidate("admin:");
    const k2 = await mediumCache.invalidate("admin:");
    return k1 + k2;
  }
  async invalidateProductCache(productId = null) {
    if (productId) {
      const k1 = await mediumCache.invalidate(`product:${productId}`);
      const k2 = await longCache.invalidate(`product:${productId}`);
      return k1 + k2;
    }
    const k1 = await mediumCache.invalidate("product:");
    const k2 = await longCache.invalidate("product:");
    return k1 + k2;
  }
  async invalidateSettingsCache() {
    return await longCache.invalidate("settings:");
  }
  async invalidateCustomerCache(customerId = null) {
    if (customerId)
      return await mediumCache.invalidate(`customer:${customerId}`);
    return await mediumCache.invalidate("customer:");
  }
  async invalidateVehicleCache() {
    return await longCache.invalidate("vehicle:");
  }
  async getCacheInfo() {
    const [s, m, l] = await Promise.all([
      shortCache.getInfo(),
      mediumCache.getInfo(),
      longCache.getInfo(),
    ]);
    return {
      short: s,
      medium: m,
      long: l,
      totalKeys: s.totalKeys + m.totalKeys + l.totalKeys,
    };
  }
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
