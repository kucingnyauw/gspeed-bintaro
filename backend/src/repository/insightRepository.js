import prisma from "#app/database.js";

class InsightRepository {
  /**
   * Ambil setting dari database
   * @param {string} key
   * @param {string} [defaultValue]
   * @returns {Promise<string>}
   * @private
   */
  async #getSetting(key, defaultValue = null) {
    const setting = await prisma.setting.findUnique({
      where: { key },
      select: { value: true },
    });
    return setting?.value || defaultValue;
  }

  /**
   * Ambil tanggal 1 tahun yang lalu
   * @returns {Date}
   * @private
   */
  #getOneYearAgo() {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 1);
    return d;
  }

  /**
   * Ambil tanggal awal bulan ini
   * @returns {Date}
   * @private
   */
  #getStartOfMonth() {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  }

  /**
   * Ambil tanggal awal minggu ini
   * @returns {Date}
   * @private
   */
  #getStartOfWeek() {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), d.getDate() - d.getDay());
  }

  /**
   * Ambil tanggal hari ini jam 00:00
   * @returns {Date}
   * @private
   */
  #getStartOfDay() {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  // ============================================================================
  // MEKANIK (9 functions)
  // ============================================================================

  /**
   * Job aktif yang sedang dikerjakan mekanik (IN_PROGRESS)
   * @param {string} mechanicId
   * @returns {Promise<{jobs: Array, count: number}>}
   */
  async getMechanicActiveJobs(mechanicId) {
    const jobs = await prisma.mechanicAssignment.findMany({
      where: {
        mechanicId,
        endAt: null,
        orderItem: {
          order: { status: { in: ["QUEUED", "IN_PROGRESS"] }, deletedAt: null },
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
    });

    return {
      jobs: jobs.map((i) => ({
        orderNumber: i.orderItem.order.orderNumber,
        service: i.orderItem.productNameSnapshot,
        status: i.orderItem.order.status,
        plateNumber: i.orderItem.order.vehicle?.plateNumber || "-",
        vehicle: i.orderItem.order.vehicle?.model || "-",
        customer: i.orderItem.order.customer?.name || "Umum",
        startAt: i.startAt,
        createdAt: i.orderItem.order.createdAt,
      })),
      count: jobs.length,
    };
  }

  /**
   * Job antrian yang menunggu dikerjakan mekanik (QUEUED)
   * @param {string} mechanicId
   * @returns {Promise<{jobs: Array, count: number}>}
   */
  async getMechanicPendingJobs(mechanicId) {
    const jobs = await prisma.mechanicAssignment.findMany({
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
    });

    return {
      jobs: jobs.map((i) => ({
        orderNumber: i.orderItem.order.orderNumber,
        service: i.orderItem.productNameSnapshot,
        plateNumber: i.orderItem.order.vehicle?.plateNumber || "-",
        customer: i.orderItem.order.customer?.name || "Umum",
        createdAt: i.orderItem.order.createdAt,
      })),
      count: jobs.length,
    };
  }

  /**
   * Performa mekanik: ringkasan + detail job per periode
   * @param {string} mechanicId
   * @returns {Promise<Object>}
   */
  async getMechanicPerformanceSummary(mechanicId) {
    const startDay = this.#getStartOfDay();
    const startWeek = this.#getStartOfWeek();
    const startMonth = this.#getStartOfMonth();
    const startYear = this.#getOneYearAgo();

    const maxTasks = parseInt(
      await this.#getSetting("mechanic_max_tasks", "5"),
      10
    );

    const [daily, weekly, monthly, yearly, activeCount, recentJobs] =
      await Promise.all([
        prisma.$queryRaw`SELECT COUNT(ma."id")::int as completed, COALESCE(SUM(oi."subtotal"), 0)::bigint as earnings FROM "MechanicAssignment" ma INNER JOIN "OrderItem" oi ON ma."orderItemId" = oi."id" INNER JOIN "Order" o ON oi."orderId" = o."id" WHERE ma."mechanicId" = ${mechanicId} AND ma."endAt" >= ${startDay} AND o."status" IN ('COMPLETED','CLOSED') AND o."deletedAt" IS NULL`,
        prisma.$queryRaw`SELECT COUNT(ma."id")::int as completed, COALESCE(SUM(oi."subtotal"), 0)::bigint as earnings FROM "MechanicAssignment" ma INNER JOIN "OrderItem" oi ON ma."orderItemId" = oi."id" INNER JOIN "Order" o ON oi."orderId" = o."id" WHERE ma."mechanicId" = ${mechanicId} AND ma."endAt" >= ${startWeek} AND o."status" IN ('COMPLETED','CLOSED') AND o."deletedAt" IS NULL`,
        prisma.$queryRaw`SELECT COUNT(ma."id")::int as completed, COALESCE(SUM(oi."subtotal"), 0)::bigint as earnings FROM "MechanicAssignment" ma INNER JOIN "OrderItem" oi ON ma."orderItemId" = oi."id" INNER JOIN "Order" o ON oi."orderId" = o."id" WHERE ma."mechanicId" = ${mechanicId} AND ma."endAt" >= ${startMonth} AND o."status" IN ('COMPLETED','CLOSED') AND o."deletedAt" IS NULL`,
        prisma.$queryRaw`SELECT COUNT(ma."id")::int as completed, COALESCE(SUM(oi."subtotal"), 0)::bigint as earnings FROM "MechanicAssignment" ma INNER JOIN "OrderItem" oi ON ma."orderItemId" = oi."id" INNER JOIN "Order" o ON oi."orderId" = o."id" WHERE ma."mechanicId" = ${mechanicId} AND ma."endAt" >= ${startYear} AND o."status" IN ('COMPLETED','CLOSED') AND o."deletedAt" IS NULL`,
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
        prisma.mechanicAssignment.findMany({
          where: {
            mechanicId,
            endAt: { not: null },
            orderItem: {
              order: {
                status: { in: ["COMPLETED", "CLOSED"] },
                deletedAt: null,
              },
            },
          },
          select: {
            startAt: true,
            endAt: true,
            orderItem: {
              select: {
                productNameSnapshot: true,
                subtotal: true,
                order: {
                  select: {
                    orderNumber: true,
                    vehicle: { select: { plateNumber: true } },
                  },
                },
              },
            },
          },
          orderBy: { endAt: "desc" },
          take: 20,
        }),
      ]);

    return {
      summary: {
        daily: {
          completed: Number(daily[0].completed),
          earnings: Number(daily[0].earnings),
        },
        weekly: {
          completed: Number(weekly[0].completed),
          earnings: Number(weekly[0].earnings),
        },
        monthly: {
          completed: Number(monthly[0].completed),
          earnings: Number(monthly[0].earnings),
        },
        yearly: {
          completed: Number(yearly[0].completed),
          earnings: Number(yearly[0].earnings),
        },
        activeJobs: activeCount,
        maxTasks,
        utilizationPct:
          maxTasks > 0 ? Math.round((activeCount / maxTasks) * 100) : 0,
      },
      recentJobs: recentJobs.map((j) => ({
        orderNumber: j.orderItem.order.orderNumber,
        service: j.orderItem.productNameSnapshot,
        plateNumber: j.orderItem.order.vehicle?.plateNumber || "-",
        earnings: Number(j.orderItem.subtotal),
        startAt: j.startAt,
        endAt: j.endAt,
        duration:
          j.startAt && j.endAt
            ? Math.round((new Date(j.endAt) - new Date(j.startAt)) / 60000)
            : null,
      })),
    };
  }

  /**
   * Kecepatan kerja mekanik: ringkasan + detail job
   * @param {string} mechanicId
   * @returns {Promise<Object>}
   */
  async getMechanicSpeedStats(mechanicId) {
    const startWeek = this.#getStartOfWeek();
    const startMonth = this.#getStartOfMonth();
    const startYear = this.#getOneYearAgo();

    const [weekly, monthly, yearly, slowestJobs, fastestJobs] =
      await Promise.all([
        prisma.$queryRaw`SELECT COUNT(ma."id")::int as total, ROUND(AVG(EXTRACT(EPOCH FROM (ma."endAt" - ma."startAt")) / 60))::int as avg, ROUND(MIN(EXTRACT(EPOCH FROM (ma."endAt" - ma."startAt")) / 60))::int as min, ROUND(MAX(EXTRACT(EPOCH FROM (ma."endAt" - ma."startAt")) / 60))::int as max FROM "MechanicAssignment" ma WHERE ma."mechanicId" = ${mechanicId} AND ma."endAt" >= ${startWeek} AND ma."endAt" IS NOT NULL AND ma."startAt" IS NOT NULL`,
        prisma.$queryRaw`SELECT COUNT(ma."id")::int as total, ROUND(AVG(EXTRACT(EPOCH FROM (ma."endAt" - ma."startAt")) / 60))::int as avg FROM "MechanicAssignment" ma WHERE ma."mechanicId" = ${mechanicId} AND ma."endAt" >= ${startMonth} AND ma."endAt" IS NOT NULL AND ma."startAt" IS NOT NULL`,
        prisma.$queryRaw`SELECT COUNT(ma."id")::int as total, ROUND(AVG(EXTRACT(EPOCH FROM (ma."endAt" - ma."startAt")) / 60))::int as avg FROM "MechanicAssignment" ma WHERE ma."mechanicId" = ${mechanicId} AND ma."endAt" >= ${startYear} AND ma."endAt" IS NOT NULL AND ma."startAt" IS NOT NULL`,
        prisma.mechanicAssignment.findMany({
          where: { mechanicId, endAt: { not: null }, startAt: { not: null } },
          select: {
            startAt: true,
            endAt: true,
            orderItem: {
              select: {
                productNameSnapshot: true,
                order: { select: { orderNumber: true } },
              },
            },
          },
          orderBy: [{ endAt: "desc" }, { startAt: "asc" }],
          take: 5,
        }),
        prisma.mechanicAssignment.findMany({
          where: { mechanicId, endAt: { not: null }, startAt: { not: null } },
          select: {
            startAt: true,
            endAt: true,
            orderItem: {
              select: {
                productNameSnapshot: true,
                order: { select: { orderNumber: true } },
              },
            },
          },
          orderBy: [{ endAt: "asc" }, { startAt: "desc" }],
          take: 5,
        }),
      ]);

    return {
      summary: {
        weekly: {
          totalJobs: Number(weekly[0].total),
          avgMinutes: Number(weekly[0].avg) || 0,
          fastestMinutes: Number(weekly[0].min) || 0,
          slowestMinutes: Number(weekly[0].max) || 0,
        },
        monthly: {
          totalJobs: Number(monthly[0].total),
          avgMinutes: Number(monthly[0].avg) || 0,
        },
        yearly: {
          totalJobs: Number(yearly[0].total),
          avgMinutes: Number(yearly[0].avg) || 0,
        },
      },
      slowestJobs: slowestJobs.map((j) => ({
        orderNumber: j.orderItem.order.orderNumber,
        service: j.orderItem.productNameSnapshot,
        durationMinutes: Math.round(
          (new Date(j.endAt) - new Date(j.startAt)) / 60000
        ),
      })),
      fastestJobs: fastestJobs.map((j) => ({
        orderNumber: j.orderItem.order.orderNumber,
        service: j.orderItem.productNameSnapshot,
        durationMinutes: Math.round(
          (new Date(j.endAt) - new Date(j.startAt)) / 60000
        ),
      })),
    };
  }

  /**
   * Service yang paling sering dikerjakan mekanik
   * @param {string} mechanicId
   * @returns {Promise<Object>}
   */
  async getMechanicTopServices(mechanicId) {
    const startMonth = this.#getStartOfMonth();
    const startYear = this.#getOneYearAgo();

    const [monthly, yearly] = await Promise.all([
      prisma.$queryRaw`SELECT oi."productNameSnapshot" as "serviceName", COUNT(ma."id")::int as count, COALESCE(SUM(oi."subtotal"), 0)::bigint as earnings FROM "MechanicAssignment" ma INNER JOIN "OrderItem" oi ON ma."orderItemId" = oi."id" WHERE ma."mechanicId" = ${mechanicId} AND ma."endAt" >= ${startMonth} GROUP BY oi."productNameSnapshot" ORDER BY count DESC LIMIT 5`,
      prisma.$queryRaw`SELECT oi."productNameSnapshot" as "serviceName", COUNT(ma."id")::int as count, COALESCE(SUM(oi."subtotal"), 0)::bigint as earnings FROM "MechanicAssignment" ma INNER JOIN "OrderItem" oi ON ma."orderItemId" = oi."id" WHERE ma."mechanicId" = ${mechanicId} AND ma."endAt" >= ${startYear} GROUP BY oi."productNameSnapshot" ORDER BY count DESC LIMIT 5`,
    ]);

    return {
      monthly: monthly.map((r) => ({
        serviceName: r.serviceName,
        count: Number(r.count),
        earnings: Number(r.earnings),
      })),
      yearly: yearly.map((r) => ({
        serviceName: r.serviceName,
        count: Number(r.count),
        earnings: Number(r.earnings),
      })),
    };
  }

  /**
   * Pendapatan mekanik: ringkasan + detail job
   * @param {string} mechanicId
   * @returns {Promise<Object>}
   */
  async getMechanicEarningsBreakdown(mechanicId) {
    const startMonth = this.#getStartOfMonth();
    const startYear = this.#getOneYearAgo();

    const [monthly, yearly, topEarningJobs] = await Promise.all([
      prisma.$queryRaw`SELECT COUNT(ma."id")::int as jobs, COALESCE(SUM(oi."subtotal"), 0)::bigint as earnings, ROUND(AVG(oi."subtotal"))::int as avgPerJob FROM "MechanicAssignment" ma INNER JOIN "OrderItem" oi ON ma."orderItemId" = oi."id" INNER JOIN "Order" o ON oi."orderId" = o."id" WHERE ma."mechanicId" = ${mechanicId} AND ma."endAt" >= ${startMonth} AND o."status" IN ('COMPLETED','CLOSED') AND o."deletedAt" IS NULL`,
      prisma.$queryRaw`SELECT COUNT(ma."id")::int as jobs, COALESCE(SUM(oi."subtotal"), 0)::bigint as earnings, ROUND(AVG(oi."subtotal"))::int as avgPerJob FROM "MechanicAssignment" ma INNER JOIN "OrderItem" oi ON ma."orderItemId" = oi."id" INNER JOIN "Order" o ON oi."orderId" = o."id" WHERE ma."mechanicId" = ${mechanicId} AND ma."endAt" >= ${startYear} AND o."status" IN ('COMPLETED','CLOSED') AND o."deletedAt" IS NULL`,
      prisma.mechanicAssignment.findMany({
        where: {
          mechanicId,
          endAt: { not: null },
          orderItem: {
            order: { status: { in: ["COMPLETED", "CLOSED"] }, deletedAt: null },
          },
        },
        select: {
          endAt: true,
          orderItem: {
            select: {
              productNameSnapshot: true,
              subtotal: true,
              order: {
                select: {
                  orderNumber: true,
                  vehicle: { select: { plateNumber: true } },
                },
              },
            },
          },
        },
        orderBy: { orderItem: { subtotal: "desc" } },
        take: 10,
      }),
    ]);

    return {
      summary: {
        monthly: {
          jobs: Number(monthly[0].jobs),
          earnings: Number(monthly[0].earnings),
          avgPerJob: Number(monthly[0].avgPerJob) || 0,
        },
        yearly: {
          jobs: Number(yearly[0].jobs),
          earnings: Number(yearly[0].earnings),
          avgPerJob: Number(yearly[0].avgPerJob) || 0,
        },
      },
      topEarningJobs: topEarningJobs.map((j) => ({
        orderNumber: j.orderItem.order.orderNumber,
        service: j.orderItem.productNameSnapshot,
        plateNumber: j.orderItem.order.vehicle?.plateNumber || "-",
        earnings: Number(j.orderItem.subtotal),
        completedAt: j.endAt,
      })),
    };
  }

  /**
   * Ranking efisiensi mekanik + detail top performers
   * @param {string} mechanicId
   * @returns {Promise<Object>}
   */
  async getMechanicEfficiencyRank(mechanicId) {
    const raw =
      await prisma.$queryRaw`WITH mech_stats AS (SELECT ma."mechanicId", COUNT(ma."id")::int as total_jobs, ROUND(AVG(EXTRACT(EPOCH FROM (ma."endAt" - ma."startAt")) / 60))::int as avg_minutes FROM "MechanicAssignment" ma WHERE ma."endAt" IS NOT NULL AND ma."startAt" IS NOT NULL GROUP BY ma."mechanicId" HAVING COUNT(ma."id") >= 5), ranked AS (SELECT ms.*, u."fullName", RANK() OVER (ORDER BY ms.avg_minutes ASC) as "rank", COUNT(*) OVER ()::int as "totalMechanics" FROM mech_stats ms INNER JOIN "User" u ON ms."mechanicId" = u."id") SELECT * FROM ranked`;

    const me = raw.find((r) => r.mechanicId === mechanicId);
    const top3 = raw.slice(0, 3);
    const bottom3 = raw.slice(-3).reverse();

    if (!me)
      return {
        rank: null,
        totalMechanics: raw.length,
        avgMinutes: 0,
        totalJobs: 0,
        betterThan: 0,
        topPerformers: [],
        bottomPerformers: [],
        allRankings: [],
      };

    return {
      rank: Number(me.rank),
      totalMechanics: Number(me.totalMechanics),
      avgMinutes: Number(me.avg_minutes),
      totalJobs: Number(me.total_jobs),
      mechanicName: me.fullName,
      betterThan:
        me.totalMechanics > 0
          ? Math.round((1 - Number(me.rank) / Number(me.totalMechanics)) * 100)
          : 0,
      topPerformers: top3.map((r) => ({
        name: r.fullName,
        avgMinutes: Number(r.avg_minutes),
        totalJobs: Number(r.total_jobs),
      })),
      bottomPerformers: bottom3.map((r) => ({
        name: r.fullName,
        avgMinutes: Number(r.avg_minutes),
        totalJobs: Number(r.total_jobs),
      })),
      allRankings: raw.map((r) => ({
        name: r.fullName,
        rank: Number(r.rank),
        avgMinutes: Number(r.avg_minutes),
        totalJobs: Number(r.total_jobs),
      })),
    };
  }

  // ============================================================================
  // KASIR (7 functions)
  // ============================================================================

  /**
   * Ringkasan penjualan kasir: ringkasan + top transactions
   * @param {string} cashierId
   * @returns {Promise<Object>}
   */
  async getCashierTodaySummary(cashierId) {
    const startDay = this.#getStartOfDay();
    const endDay = new Date();
    endDay.setHours(23, 59, 59, 999);
    const yesterday = new Date(startDay.getTime() - 86400000);
    const startMonth = this.#getStartOfMonth();
    const startYear = this.#getOneYearAgo();

    const minStartingCash = parseInt(
      await this.#getSetting("shift_min_starting_cash", "1000000"),
      10
    );

    const [
      todayData,
      yesterdayData,
      monthlyData,
      yearlyData,
      pendingCount,
      paymentData,
      topTransactions,
    ] = await Promise.all([
      prisma.order.aggregate({
        where: {
          cashierId,
          createdAt: { gte: startDay, lte: endDay },
          status: { in: ["COMPLETED", "CLOSED"] },
          deletedAt: null,
        },
        _sum: { total: true },
        _count: true,
        _avg: { total: true },
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
      prisma.order.aggregate({
        where: {
          cashierId,
          createdAt: { gte: startMonth },
          status: { in: ["COMPLETED", "CLOSED"] },
          deletedAt: null,
        },
        _sum: { total: true },
        _count: true,
      }),
      prisma.order.aggregate({
        where: {
          cashierId,
          createdAt: { gte: startYear },
          status: { in: ["COMPLETED", "CLOSED"] },
          deletedAt: null,
        },
        _sum: { total: true },
        _count: true,
      }),
      prisma.order.count({
        where: {
          cashierId,
          status: { in: ["DRAFT", "QUEUED", "IN_PROGRESS"] },
          deletedAt: null,
        },
      }),
      prisma.$queryRaw`SELECT COALESCE(SUM(CASE WHEN p."method" = 'CASH' THEN p."amountPaid" ELSE 0 END), 0)::bigint as cash, COALESCE(SUM(CASE WHEN p."method" = 'QRIS' THEN p."amountPaid" ELSE 0 END), 0)::bigint as qris FROM "Payment" p INNER JOIN "Order" o ON p."orderId" = o."id" WHERE o."cashierId" = ${cashierId} AND o."createdAt" >= ${startDay} AND o."createdAt" <= ${endDay} AND o."deletedAt" IS NULL`,
      prisma.order.findMany({
        where: {
          cashierId,
          createdAt: { gte: startDay, lte: endDay },
          status: { in: ["COMPLETED", "CLOSED"] },
          deletedAt: null,
        },
        select: {
          orderNumber: true,
          total: true,
          createdAt: true,
          customer: { select: { name: true } },
          payment: { select: { method: true } },
        },
        orderBy: { total: "desc" },
        take: 5,
      }),
    ]);

    const todaySales = Number(todayData._sum.total || 0);
    const yesterdaySales = Number(yesterdayData._sum.total || 0);
    const salesChange = yesterdaySales
      ? Math.round(((todaySales - yesterdaySales) / yesterdaySales) * 100)
      : 0;

    return {
      summary: {
        today: {
          sales: todaySales,
          orders: todayData._count,
          avgOrderValue: Math.round(todayData._avg.total || 0),
          cashAmount: Number(paymentData[0].cash),
          qrisAmount: Number(paymentData[0].qris),
        },
        yesterday: { sales: yesterdaySales, orders: yesterdayData._count },
        monthly: {
          sales: Number(monthlyData._sum.total || 0),
          orders: monthlyData._count,
        },
        yearly: {
          sales: Number(yearlyData._sum.total || 0),
          orders: yearlyData._count,
        },
        comparison: {
          salesChange,
          direction:
            salesChange > 0 ? "up" : salesChange < 0 ? "down" : "stable",
        },
        pendingOrders: pendingCount,
        minStartingCash,
      },
      topTransactions: topTransactions.map((t) => ({
        orderNumber: t.orderNumber,
        customer: t.customer?.name || "Umum",
        total: t.total,
        method: t.payment?.method || null,
        createdAt: t.createdAt,
      })),
    };
  }

  /**
   * Shift aktif kasir + detail pembayaran & expenses
   * @param {string} cashierId
   * @returns {Promise<Object>}
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
        shift: null,
        sales: { total: 0, expenses: 0, net: 0 },
        payments: {
          cash: { total: 0, count: 0 },
          qris: { total: 0, count: 0 },
        },
        recentExpenses: [],
        recentOrders: [],
      };

    const [expenses, paymentBreakdown, recentExpenses, recentOrders] =
      await Promise.all([
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
        prisma.expense.findMany({
          where: { shiftId: shift.id },
          select: { title: true, amount: true, category: true, date: true },
          orderBy: { date: "desc" },
          take: 10,
        }),
        prisma.order.findMany({
          where: { shiftId: shift.id, deletedAt: null },
          select: {
            orderNumber: true,
            total: true,
            status: true,
            createdAt: true,
            customer: { select: { name: true } },
            payment: { select: { method: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        }),
      ]);

    const cashPayments = paymentBreakdown.find((p) => p.method === "CASH");
    const qrisPayments = paymentBreakdown.find((p) => p.method === "QRIS");

    return {
      shift,
      sales: {
        total: shift.cashSales,
        expenses: Number(expenses._sum.amount || 0),
        net: shift.cashSales - Number(expenses._sum.amount || 0),
      },
      payments: {
        cash: {
          total: cashPayments?._sum.amountPaid || 0,
          count: cashPayments?._count.method || 0,
        },
        qris: {
          total: qrisPayments?._sum.amountPaid || 0,
          count: qrisPayments?._count.method || 0,
        },
      },
      recentExpenses: recentExpenses.map((e) => ({
        title: e.title,
        amount: e.amount,
        category: e.category,
        date: e.date,
      })),
      recentOrders: recentOrders.map((o) => ({
        orderNumber: o.orderNumber,
        total: o.total,
        status: o.status,
        customer: o.customer?.name || "Umum",
        method: o.payment?.method || null,
        createdAt: o.createdAt,
      })),
    };
  }

  /**
   * Order pending kasir
   * @param {string} cashierId
   * @returns {Promise<Object>}
   */
  async getCashierPendingOrders(cashierId) {
    const raw = await prisma.order.groupBy({
      by: ["status"],
      where: {
        cashierId,
        status: { in: ["DRAFT", "QUEUED", "IN_PROGRESS"] },
        deletedAt: null,
      },
      _count: { id: true },
    });
    const totalPending = raw.reduce((s, r) => s + r._count.id, 0);
    return {
      byStatus: raw.map((i) => ({ status: i.status, count: i._count.id })),
      totalPending,
    };
  }

  /**
   * Statistik pelanggan kasir
   * @param {string} cashierId
   * @returns {Promise<Object>}
   */
  async getCashierCustomerStats(cashierId) {
    const startDay = this.#getStartOfDay();
    const startMonth = this.#getStartOfMonth();
    const startYear = this.#getOneYearAgo();

    const [total, newToday, monthly, yearly, top] = await Promise.all([
      prisma.$queryRaw`SELECT COUNT(DISTINCT "customerId")::int as count FROM "Order" WHERE "cashierId" = ${cashierId} AND "deletedAt" IS NULL AND "customerId" IS NOT NULL`,
      prisma.$queryRaw`SELECT COUNT(DISTINCT "customerId")::int as count FROM "Order" WHERE "cashierId" = ${cashierId} AND "createdAt" >= ${startDay} AND "deletedAt" IS NULL AND "customerId" IS NOT NULL`,
      prisma.$queryRaw`SELECT COUNT(DISTINCT "customerId")::int as count FROM "Order" WHERE "cashierId" = ${cashierId} AND "createdAt" >= ${startMonth} AND "deletedAt" IS NULL AND "customerId" IS NOT NULL`,
      prisma.$queryRaw`SELECT COUNT(DISTINCT "customerId")::int as count FROM "Order" WHERE "cashierId" = ${cashierId} AND "createdAt" >= ${startYear} AND "deletedAt" IS NULL AND "customerId" IS NOT NULL`,
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
        select: { name: true },
      });
      topCustomer = {
        name: cust?.name || "Unknown",
        total: Number(top[0]._sum.total || 0),
      };
    }

    return {
      total: Number(total[0].count),
      newToday: Number(newToday[0].count),
      monthly: Number(monthly[0].count),
      yearly: Number(yearly[0].count),
      top: topCustomer,
    };
  }

  /**
   * Riwayat shift kasir + detail
   * @param {string} cashierId
   * @returns {Promise<Object>}
   */
  async getCashierShiftHistory(cashierId) {
    const [shifts, allTime] = await Promise.all([
      prisma.shift.findMany({
        where: { cashierId, status: "CLOSED" },
        select: {
          id: true,
          openedAt: true,
          closedAt: true,
          startingCash: true,
          endingCash: true,
          cashSales: true,
          discrepancy: true,
          _count: { select: { orders: true, expenses: true } },
        },
        orderBy: { closedAt: "desc" },
        take: 10,
      }),
      prisma.shift.aggregate({
        where: { cashierId, status: "CLOSED" },
        _count: true,
        _avg: { discrepancy: true, cashSales: true },
        _sum: { cashSales: true },
      }),
    ]);

    return {
      shifts: shifts.map((s) => ({
        id: s.id,
        openedAt: s.openedAt,
        closedAt: s.closedAt,
        startingCash: s.startingCash,
        endingCash: s.endingCash,
        cashSales: s.cashSales,
        discrepancy: s.discrepancy,
        orderCount: s._count.orders,
        expenseCount: s._count.expenses,
      })),
      summary: {
        totalShifts: allTime._count,
        avgDiscrepancy: Math.round(allTime._avg.discrepancy || 0),
        avgCashSales: Math.round(allTime._avg.cashSales || 0),
        totalCashSales: Number(allTime._sum.cashSales || 0),
      },
    };
  }

  /**
   * Transaksi terbaru kasir
   * @param {string} cashierId
   * @returns {Promise<Array>}
   */
  async getCashierRecentTransactions(cashierId) {
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

  /**
   * Perbandingan performa kasir + ranking
   * @param {string} cashierId
   * @returns {Promise<Object>}
   */
  async getCashierComparisonStats(cashierId) {
    const startDay = this.#getStartOfDay();
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
    const salesChange = yesterdaySales
      ? Math.round(((todaySales - yesterdaySales) / yesterdaySales) * 100)
      : 0;

    return {
      today: { sales: todaySales, orders: todayAgg._count },
      yesterday: { sales: yesterdaySales, orders: yesterdayAgg._count },
      comparison: {
        salesChange,
        direction: salesChange > 0 ? "up" : salesChange < 0 ? "down" : "stable",
      },
      rank: rankRaw.length ? Number(rankRaw[0].rank) : null,
    };
  }

  // ============================================================================
  // ADMIN - DASHBOARD & OVERVIEW (10 functions)
  // ============================================================================

  /**
   * Dashboard bengkel: ringkasan + recent orders + top mechanics
   * @returns {Promise<Object>}
   */
  async getAdminDashboardSnapshot() {
    const startDay = this.#getStartOfDay();
    const startMonth = this.#getStartOfMonth();
    const startYear = this.#getOneYearAgo();

    const [lowThreshold, maxTasks] = await Promise.all([
      this.#getSetting("stock_low_threshold", "5"),
      this.#getSetting("mechanic_max_tasks", "5"),
    ]);

    const [
      daily,
      monthly,
      yearly,
      mechanics,
      shifts,
      lowStock,
      recentOrders,
      topMechanics,
    ] = await Promise.all([
      prisma.order.aggregate({
        where: {
          createdAt: { gte: startDay },
          status: { in: ["COMPLETED", "CLOSED"] },
          deletedAt: null,
        },
        _sum: { total: true },
        _count: true,
      }),
      prisma.order.aggregate({
        where: {
          createdAt: { gte: startMonth },
          status: { in: ["COMPLETED", "CLOSED"] },
          deletedAt: null,
        },
        _sum: { total: true },
        _count: true,
      }),
      prisma.order.aggregate({
        where: {
          createdAt: { gte: startYear },
          status: { in: ["COMPLETED", "CLOSED"] },
          deletedAt: null,
        },
        _sum: { total: true },
        _count: true,
      }),
      prisma.mechanicAssignment
        .groupBy({ by: ["mechanicId"], where: { endAt: null }, _count: true })
        .then((r) => r.length),
      prisma.shift.count({ where: { status: "OPEN" } }),
      prisma.product.count({
        where: {
          type: "SPAREPART",
          isActive: true,
          stock: { lte: parseInt(lowThreshold, 10) },
        },
      }),
      prisma.order.findMany({
        where: {
          createdAt: { gte: startDay },
          status: { in: ["COMPLETED", "CLOSED"] },
          deletedAt: null,
        },
        select: {
          orderNumber: true,
          total: true,
          createdAt: true,
          customer: { select: { name: true } },
          payment: { select: { method: true } },
        },
        orderBy: { total: "desc" },
        take: 5,
      }),
      prisma.$queryRaw`SELECT u."fullName", COUNT(ma."id")::int as jobs, COALESCE(SUM(oi."subtotal"), 0)::bigint as earnings FROM "User" u LEFT JOIN "MechanicAssignment" ma ON u."id" = ma."mechanicId" LEFT JOIN "OrderItem" oi ON ma."orderItemId" = oi."id" LEFT JOIN "Order" o ON oi."orderId" = o."id" WHERE u."role" = 'MECHANIC' AND ma."endAt" >= ${startMonth} AND o."status" IN ('COMPLETED','CLOSED') AND o."deletedAt" IS NULL GROUP BY u."fullName" ORDER BY earnings DESC LIMIT 5`,
    ]);

    return {
      revenue: {
        daily: Number(daily._sum.total || 0),
        monthly: Number(monthly._sum.total || 0),
        yearly: Number(yearly._sum.total || 0),
      },
      orders: {
        daily: daily._count,
        monthly: monthly._count,
        yearly: yearly._count,
      },
      operational: {
        activeMechanics: mechanics,
        openShifts: shifts,
        lowStockItems: lowStock,
      },
      settings: {
        lowStockThreshold: parseInt(lowThreshold, 10),
        mechanicMaxTasks: parseInt(maxTasks, 10),
      },
      recentOrders: recentOrders.map((o) => ({
        orderNumber: o.orderNumber,
        customer: o.customer?.name || "Umum",
        total: o.total,
        method: o.payment?.method || null,
        createdAt: o.createdAt,
      })),
      topMechanics: topMechanics.map((m) => ({
        name: m.fullName,
        jobs: Number(m.jobs),
        earnings: Number(m.earnings),
      })),
    };
  }

  /**
   * Ringkasan bisnis hari ini + perbandingan kemarin
   * @returns {Promise<Object>}
   */
  async getAdminTodaySummary() {
    const startDay = this.#getStartOfDay();
    const endDay = new Date();
    endDay.setHours(23, 59, 59, 999);
    const yesterday = new Date(startDay.getTime() - 86400000);

    const [agg, yesterdayAgg, top, paymentBreakdown] = await Promise.all([
      prisma.order.aggregate({
        where: {
          createdAt: { gte: startDay, lte: endDay },
          status: { in: ["COMPLETED", "CLOSED"] },
          deletedAt: null,
        },
        _sum: { total: true },
        _count: true,
        _avg: { total: true },
      }),
      prisma.order.aggregate({
        where: {
          createdAt: { gte: yesterday, lt: startDay },
          status: { in: ["COMPLETED", "CLOSED"] },
          deletedAt: null,
        },
        _sum: { total: true },
        _count: true,
      }),
      prisma.$queryRaw`SELECT oi."productNameSnapshot" as name, SUM(oi."quantity")::int as qty FROM "OrderItem" oi INNER JOIN "Order" o ON oi."orderId" = o."id" WHERE o."createdAt" >= ${startDay} AND o."createdAt" <= ${endDay} AND o."deletedAt" IS NULL GROUP BY oi."productNameSnapshot" ORDER BY qty DESC LIMIT 1`,
      prisma.payment.groupBy({
        by: ["method"],
        where: {
          order: { createdAt: { gte: startDay, lte: endDay }, deletedAt: null },
        },
        _sum: { amountPaid: true },
        _count: { method: true },
      }),
    ]);

    const todayRevenue = Number(agg._sum.total || 0);
    const yesterdayRevenue = Number(yesterdayAgg._sum.total || 0);
    const change = yesterdayRevenue
      ? Math.round(((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100)
      : 0;

    const cashPayments = paymentBreakdown.find((p) => p.method === "CASH");
    const qrisPayments = paymentBreakdown.find((p) => p.method === "QRIS");

    return {
      today: {
        revenue: todayRevenue,
        orders: agg._count,
        avgOrderValue: Math.round(agg._avg.total || 0),
      },
      yesterday: { revenue: yesterdayRevenue, orders: yesterdayAgg._count },
      comparison: {
        change,
        direction: change > 0 ? "up" : change < 0 ? "down" : "stable",
      },
      topProduct: top[0]?.name || null,
      payments: {
        cash: {
          total: cashPayments?._sum.amountPaid || 0,
          count: cashPayments?._count.method || 0,
        },
        qris: {
          total: qrisPayments?._sum.amountPaid || 0,
          count: qrisPayments?._count.method || 0,
        },
      },
    };
  }

  /**
   * Performa semua kasir: bulan ini, tahun ini
   * @returns {Promise<Object>}
   */
  async getAdminCashierPerformance() {
    const startMonth = this.#getStartOfMonth();
    const startYear = this.#getOneYearAgo();

    const [monthly, yearly] = await Promise.all([
      prisma.$queryRaw`SELECT u."fullName" as "cashierName", COUNT(s."id")::int as "shiftCount", COALESCE(SUM(s."cashSales"), 0)::bigint as "totalSales", ROUND(AVG(s."discrepancy"))::int as "avgDiscrepancy" FROM "Shift" s INNER JOIN "User" u ON s."cashierId" = u."id" WHERE s."openedAt" >= ${startMonth} GROUP BY u."fullName" ORDER BY "totalSales" DESC`,
      prisma.$queryRaw`SELECT u."fullName" as "cashierName", COUNT(s."id")::int as "shiftCount", COALESCE(SUM(s."cashSales"), 0)::bigint as "totalSales", ROUND(AVG(s."discrepancy"))::int as "avgDiscrepancy" FROM "Shift" s INNER JOIN "User" u ON s."cashierId" = u."id" WHERE s."openedAt" >= ${startYear} GROUP BY u."fullName" ORDER BY "totalSales" DESC`,
    ]);

    return {
      monthly: monthly.map((r) => ({
        cashierName: r.cashierName,
        shiftCount: Number(r.shiftCount),
        totalSales: Number(r.totalSales),
        avgDiscrepancy: Number(r.avgDiscrepancy) || 0,
      })),
      yearly: yearly.map((r) => ({
        cashierName: r.cashierName,
        shiftCount: Number(r.shiftCount),
        totalSales: Number(r.totalSales),
        avgDiscrepancy: Number(r.avgDiscrepancy) || 0,
      })),
    };
  }

  /**
   * Perbandingan semua mekanik: bulan ini, tahun ini
   * @returns {Promise<Object>}
   */
  async getAdminMechanicComparison() {
    const startMonth = this.#getStartOfMonth();
    const startYear = this.#getOneYearAgo();

    const [monthly, yearly] = await Promise.all([
      prisma.$queryRaw`SELECT u."fullName" as "mechanicName", COUNT(ma."id")::int as "totalJobs", COUNT(CASE WHEN ma."endAt" IS NOT NULL AND o."status" IN ('COMPLETED','CLOSED') AND o."deletedAt" IS NULL THEN 1 END)::int as "completedJobs", CASE WHEN COUNT(ma."id") > 0 THEN ROUND((COUNT(CASE WHEN ma."endAt" IS NOT NULL AND o."status" IN ('COMPLETED','CLOSED') AND o."deletedAt" IS NULL THEN 1 END)::float / COUNT(ma."id") * 100)) ELSE 0 END as "completionRate", COALESCE(SUM(CASE WHEN ma."endAt" IS NOT NULL AND o."status" IN ('COMPLETED','CLOSED') AND o."deletedAt" IS NULL THEN oi."subtotal" ELSE 0 END), 0)::bigint as "totalEarnings" FROM "User" u LEFT JOIN "MechanicAssignment" ma ON u."id" = ma."mechanicId" LEFT JOIN "OrderItem" oi ON ma."orderItemId" = oi."id" LEFT JOIN "Order" o ON oi."orderId" = o."id" WHERE u."role" = 'MECHANIC' AND ma."createdAt" >= ${startMonth} GROUP BY u."fullName" ORDER BY "totalEarnings" DESC`,
      prisma.$queryRaw`SELECT u."fullName" as "mechanicName", COUNT(ma."id")::int as "totalJobs", COUNT(CASE WHEN ma."endAt" IS NOT NULL AND o."status" IN ('COMPLETED','CLOSED') AND o."deletedAt" IS NULL THEN 1 END)::int as "completedJobs", CASE WHEN COUNT(ma."id") > 0 THEN ROUND((COUNT(CASE WHEN ma."endAt" IS NOT NULL AND o."status" IN ('COMPLETED','CLOSED') AND o."deletedAt" IS NULL THEN 1 END)::float / COUNT(ma."id") * 100)) ELSE 0 END as "completionRate", COALESCE(SUM(CASE WHEN ma."endAt" IS NOT NULL AND o."status" IN ('COMPLETED','CLOSED') AND o."deletedAt" IS NULL THEN oi."subtotal" ELSE 0 END), 0)::bigint as "totalEarnings" FROM "User" u LEFT JOIN "MechanicAssignment" ma ON u."id" = ma."mechanicId" LEFT JOIN "OrderItem" oi ON ma."orderItemId" = oi."id" LEFT JOIN "Order" o ON oi."orderId" = o."id" WHERE u."role" = 'MECHANIC' AND ma."createdAt" >= ${startYear} GROUP BY u."fullName" ORDER BY "totalEarnings" DESC`,
    ]);

    return {
      monthly: monthly.map((r) => ({
        mechanicName: r.mechanicName,
        totalJobs: Number(r.totalJobs),
        completedJobs: Number(r.completedJobs),
        completionRate: Number(r.completionRate) || 0,
        totalEarnings: Number(r.totalEarnings),
      })),
      yearly: yearly.map((r) => ({
        mechanicName: r.mechanicName,
        totalJobs: Number(r.totalJobs),
        completedJobs: Number(r.completedJobs),
        completionRate: Number(r.completionRate) || 0,
        totalEarnings: Number(r.totalEarnings),
      })),
    };
  }

  /**
   * Overview pengeluaran: bulan ini, tahun ini + detail kategori
   * @returns {Promise<Object>}
   */
  async getAdminExpenseOverview() {
    const startMonth = this.#getStartOfMonth();
    const startYear = this.#getOneYearAgo();

    const [monthly, yearly, byCategory, recentExpenses] = await Promise.all([
      prisma.expense.aggregate({
        where: { date: { gte: startMonth } },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.expense.aggregate({
        where: { date: { gte: startYear } },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.expense.groupBy({
        by: ["category"],
        where: { date: { gte: startYear } },
        _sum: { amount: true },
        orderBy: { _sum: { amount: "desc" } },
      }),
      prisma.expense.findMany({
        select: { title: true, amount: true, category: true, date: true },
        orderBy: { date: "desc" },
        take: 20,
      }),
    ]);

    return {
      summary: {
        monthly: {
          total: Number(monthly._sum.amount || 0),
          count: monthly._count,
        },
        yearly: {
          total: Number(yearly._sum.amount || 0),
          count: yearly._count,
        },
      },
      byCategory: byCategory.map((c) => ({
        category: c.category,
        total: Number(c._sum.amount || 0),
      })),
      recentExpenses: recentExpenses.map((e) => ({
        title: e.title,
        amount: e.amount,
        category: e.category,
        date: e.date,
      })),
    };
  }

  /**
   * Kesehatan inventori: ringkasan + detail stok
   * @returns {Promise<Object>}
   */
  async getAdminInventoryHealth() {
    const since90 = new Date(Date.now() - 90 * 86400000);
    const lowThreshold = parseInt(
      await this.#getSetting("stock_low_threshold", "5"),
      10
    );

    const [
      stockValue,
      dead,
      turnover,
      top,
      stockDistribution,
      outOfStockItems,
      lowStockItems,
      overStockItems,
    ] = await Promise.all([
      prisma.$queryRaw`SELECT COALESCE(SUM("stock" * "cost"), 0)::bigint as val FROM "Product" WHERE "type" = 'SPAREPART' AND "isActive" = true`,
      prisma.$queryRaw`SELECT COALESCE(SUM(p."stock" * p."cost"), 0)::bigint as val FROM "Product" p WHERE p."type" = 'SPAREPART' AND p."isActive" = true AND p."stock" > 0 AND NOT EXISTS (SELECT 1 FROM "StockMovement" sm WHERE sm."productId" = p."id" AND sm."type" = 'OUT' AND sm."createdAt" >= ${since90})`,
      prisma.$queryRaw`SELECT ROUND(COALESCE(SUM(sm."quantity"), 0) / NULLIF(SUM(p."stock"), 0) * 100) / 100 as rate FROM "Product" p LEFT JOIN "StockMovement" sm ON p."id" = sm."productId" AND sm."type" = 'OUT' AND sm."createdAt" >= ${since90} WHERE p."type" = 'SPAREPART' AND p."isActive" = true`,
      prisma.$queryRaw`SELECT oi."productNameSnapshot" as name, SUM(oi."subtotal" - (oi."unitCostSnapshot" * oi."quantity"))::bigint as profit FROM "OrderItem" oi INNER JOIN "Order" o ON oi."orderId" = o."id" WHERE o."status" IN ('COMPLETED','CLOSED') AND o."deletedAt" IS NULL GROUP BY oi."productNameSnapshot" ORDER BY profit DESC LIMIT 1`,
      prisma.$queryRaw`SELECT COUNT(*)::int as "outOfStock", COUNT(*) FILTER (WHERE "stock" > 0 AND "stock" <= ${lowThreshold})::int as "lowStock", COUNT(*) FILTER (WHERE "stock" > ${lowThreshold})::int as "healthy" FROM "Product" WHERE "type" = 'SPAREPART' AND "isActive" = true`,
      prisma.product.findMany({
        where: { type: "SPAREPART", isActive: true, stock: 0 },
        select: { id: true, sku: true, name: true, cost: true, price: true },
        take: 20,
      }),
      prisma.product.findMany({
        where: {
          type: "SPAREPART",
          isActive: true,
          stock: { gt: 0, lte: lowThreshold },
        },
        select: {
          id: true,
          sku: true,
          name: true,
          stock: true,
          cost: true,
          price: true,
        },
        orderBy: { stock: "asc" },
        take: 20,
      }),
      prisma.product.findMany({
        where: { type: "SPAREPART", isActive: true, stock: { gte: 200 } },
        select: {
          id: true,
          sku: true,
          name: true,
          stock: true,
          cost: true,
          price: true,
        },
        orderBy: { stock: "desc" },
        take: 20,
      }),
    ]);

    return {
      summary: {
        stock: {
          totalValue: Number(stockValue[0].val),
          deadValue: Number(dead[0].val),
          turnoverRate: Number(turnover[0].rate),
        },
        distribution: {
          outOfStock: Number(stockDistribution[0].outOfStock),
          lowStock: Number(stockDistribution[0].lowStock),
          healthy: Number(stockDistribution[0].healthy),
        },
        mostProfitable: top[0]?.name || null,
        lowThreshold,
      },
      outOfStockItems: outOfStockItems.map((p) => ({
        id: p.id,
        sku: p.sku,
        name: p.name,
        cost: p.cost,
        price: p.price,
        potentialLoss: p.price - p.cost,
      })),
      lowStockItems: lowStockItems.map((p) => ({
        id: p.id,
        sku: p.sku,
        name: p.name,
        stock: p.stock,
        cost: p.cost,
        price: p.price,
      })),
      overStockItems: overStockItems.map((p) => ({
        id: p.id,
        sku: p.sku,
        name: p.name,
        stock: p.stock,
        cost: p.cost,
        price: p.price,
      })),
    };
  }

  /**
   * Pertumbuhan bisnis: bulanan, tahunan
   * @returns {Promise<Object>}
   */
  async getAdminBusinessGrowth() {
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const thisYear = new Date(now.getFullYear(), 0, 1);
    const lastYear = new Date(now.getFullYear() - 1, 0, 1);

    const [
      thisMonthRev,
      lastMonthRev,
      thisYearRev,
      lastYearRev,
      thisMonthCust,
      lastMonthCust,
      thisYearCust,
      lastYearCust,
      thisMonthOrd,
      lastMonthOrd,
      thisYearOrd,
      lastYearOrd,
    ] = await Promise.all([
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
      prisma.order.aggregate({
        where: {
          createdAt: { gte: thisYear },
          status: { in: ["COMPLETED", "CLOSED"] },
          deletedAt: null,
        },
        _sum: { total: true },
      }),
      prisma.order.aggregate({
        where: {
          createdAt: { gte: lastYear, lt: thisYear },
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
      prisma.customer.count({ where: { createdAt: { gte: thisYear } } }),
      prisma.customer.count({
        where: { createdAt: { gte: lastYear, lt: thisYear } },
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
      prisma.order.count({
        where: { createdAt: { gte: thisYear }, deletedAt: null },
      }),
      prisma.order.count({
        where: { createdAt: { gte: lastYear, lt: thisYear }, deletedAt: null },
      }),
    ]);

    const calc = (curr, prev) =>
      prev ? Math.round(((curr - prev) / prev) * 10000) / 100 : 0;

    return {
      monthly: {
        revenueGrowth: calc(
          Number(thisMonthRev._sum.total || 0),
          Number(lastMonthRev._sum.total || 0)
        ),
        customerGrowth: calc(thisMonthCust, lastMonthCust),
        orderGrowth: calc(thisMonthOrd, lastMonthOrd),
      },
      yearly: {
        revenueGrowth: calc(
          Number(thisYearRev._sum.total || 0),
          Number(lastYearRev._sum.total || 0)
        ),
        customerGrowth: calc(thisYearCust, lastYearCust),
        orderGrowth: calc(thisYearOrd, lastYearOrd),
      },
    };
  }

  /**
   * Top sparepart & service + slow moving products
   * @returns {Promise<Object>}
   */
  async getAdminTopProducts() {
    const startMonth = this.#getStartOfMonth();
    const startYear = this.#getOneYearAgo();

    const [
      sparepartsMonthly,
      sparepartsYearly,
      servicesMonthly,
      servicesYearly,
      slowMoving,
    ] = await Promise.all([
      prisma.$queryRaw`SELECT oi."productNameSnapshot" as name, SUM(oi."quantity")::int as sold, SUM(oi."subtotal")::bigint as revenue, SUM(oi."subtotal" - (oi."unitCostSnapshot" * oi."quantity"))::bigint as profit FROM "OrderItem" oi INNER JOIN "Product" p ON oi."productId" = p."id" INNER JOIN "Order" o ON oi."orderId" = o."id" WHERE p."type" = 'SPAREPART' AND o."createdAt" >= ${startMonth} AND o."status" IN ('COMPLETED','CLOSED') AND o."deletedAt" IS NULL GROUP BY oi."productNameSnapshot" ORDER BY sold DESC LIMIT 10`,
      prisma.$queryRaw`SELECT oi."productNameSnapshot" as name, SUM(oi."quantity")::int as sold, SUM(oi."subtotal")::bigint as revenue, SUM(oi."subtotal" - (oi."unitCostSnapshot" * oi."quantity"))::bigint as profit FROM "OrderItem" oi INNER JOIN "Product" p ON oi."productId" = p."id" INNER JOIN "Order" o ON oi."orderId" = o."id" WHERE p."type" = 'SPAREPART' AND o."createdAt" >= ${startYear} AND o."status" IN ('COMPLETED','CLOSED') AND o."deletedAt" IS NULL GROUP BY oi."productNameSnapshot" ORDER BY sold DESC LIMIT 10`,
      prisma.$queryRaw`SELECT oi."productNameSnapshot" as name, COUNT(DISTINCT o."id")::int as orders, SUM(oi."subtotal")::bigint as revenue FROM "OrderItem" oi INNER JOIN "Product" p ON oi."productId" = p."id" INNER JOIN "Order" o ON oi."orderId" = o."id" WHERE p."type" = 'SERVICE' AND o."createdAt" >= ${startMonth} AND o."status" IN ('COMPLETED','CLOSED') AND o."deletedAt" IS NULL GROUP BY oi."productNameSnapshot" ORDER BY orders DESC LIMIT 10`,
      prisma.$queryRaw`SELECT oi."productNameSnapshot" as name, COUNT(DISTINCT o."id")::int as orders, SUM(oi."subtotal")::bigint as revenue FROM "OrderItem" oi INNER JOIN "Product" p ON oi."productId" = p."id" INNER JOIN "Order" o ON oi."orderId" = o."id" WHERE p."type" = 'SERVICE' AND o."createdAt" >= ${startYear} AND o."status" IN ('COMPLETED','CLOSED') AND o."deletedAt" IS NULL GROUP BY oi."productNameSnapshot" ORDER BY orders DESC LIMIT 10`,
      prisma.$queryRaw`SELECT p."name", p."sku", p."stock", COALESCE(SUM(oi."quantity"), 0)::int as sold_90d FROM "Product" p LEFT JOIN "OrderItem" oi ON p."id" = oi."productId" LEFT JOIN "Order" o ON oi."orderId" = o."id" AND o."createdAt" >= ${new Date(
        Date.now() - 90 * 86400000
      )} AND o."status" IN ('COMPLETED','CLOSED') AND o."deletedAt" IS NULL WHERE p."type" = 'SPAREPART' AND p."isActive" = true AND p."stock" > 0 GROUP BY p."id", p."name", p."sku", p."stock" HAVING COALESCE(SUM(oi."quantity"), 0) = 0 ORDER BY p."stock" DESC LIMIT 10`,
    ]);

    return {
      spareparts: {
        monthly: sparepartsMonthly.map((r) => ({
          name: r.name,
          sold: Number(r.sold),
          revenue: Number(r.revenue),
          profit: Number(r.profit),
        })),
        yearly: sparepartsYearly.map((r) => ({
          name: r.name,
          sold: Number(r.sold),
          revenue: Number(r.revenue),
          profit: Number(r.profit),
        })),
      },
      services: {
        monthly: servicesMonthly.map((r) => ({
          name: r.name,
          orders: Number(r.orders),
          revenue: Number(r.revenue),
        })),
        yearly: servicesYearly.map((r) => ({
          name: r.name,
          orders: Number(r.orders),
          revenue: Number(r.revenue),
        })),
      },
      slowMoving: slowMoving.map((r) => ({
        name: r.name,
        sku: r.sku,
        stock: Number(r.stock),
        sold90Days: Number(r.sold_90d),
      })),
    };
  }

  /**
   * Jam tersibuk: bulan ini, tahun ini
   * @returns {Promise<Object>}
   */
  async getAdminPeakHours() {
    const startMonth = this.#getStartOfMonth();
    const startYear = this.#getOneYearAgo();

    const [monthly, yearly] = await Promise.all([
      prisma.$queryRaw`SELECT EXTRACT(HOUR FROM "createdAt")::int as hour, COUNT("id")::int as orders, COALESCE(SUM("total"), 0)::bigint as revenue FROM "Order" WHERE "createdAt" >= ${startMonth} AND "deletedAt" IS NULL GROUP BY hour ORDER BY orders DESC LIMIT 1`,
      prisma.$queryRaw`SELECT EXTRACT(HOUR FROM "createdAt")::int as hour, COUNT("id")::int as orders, COALESCE(SUM("total"), 0)::bigint as revenue FROM "Order" WHERE "createdAt" >= ${startYear} AND "deletedAt" IS NULL GROUP BY hour ORDER BY orders DESC LIMIT 1`,
    ]);

    return {
      monthly: {
        peakHour: Number(monthly[0]?.hour || 0),
        peakOrders: Number(monthly[0]?.orders || 0),
        peakRevenue: Number(monthly[0]?.revenue || 0),
      },
      yearly: {
        peakHour: Number(yearly[0]?.hour || 0),
        peakOrders: Number(yearly[0]?.orders || 0),
        peakRevenue: Number(yearly[0]?.revenue || 0),
      },
    };
  }

  // ============================================================================
  // P1 - CRITICAL: Attention Needed & Restock (2 functions)
  // ============================================================================

  /**
   * Order yang perlu perhatian: stuck, overdue, unpaid
   * @returns {Promise<Object>}
   */
  async getAdminAttentionNeeded() {
    const threeHoursAgo = new Date(Date.now() - 3 * 3600000);
    const oneDayAgo = new Date(Date.now() - 86400000);

    const [stuckOrders, overduePayments, unpaidOrders, draftOrders] =
      await Promise.all([
        prisma.order.findMany({
          where: {
            status: "IN_PROGRESS",
            deletedAt: null,
            startedAt: { lte: threeHoursAgo },
          },
          select: {
            id: true,
            orderNumber: true,
            total: true,
            startedAt: true,
            createdAt: true,
            vehicle: { select: { plateNumber: true } },
            customer: { select: { name: true } },
            items: {
              select: {
                productNameSnapshot: true,
                assignments: {
                  select: { mechanic: { select: { fullName: true } } },
                },
              },
            },
          },
          orderBy: { startedAt: "asc" },
          take: 10,
        }),
        prisma.order.findMany({
          where: {
            status: "COMPLETED",
            deletedAt: null,
            payment: { is: null },
            completedAt: { lte: oneDayAgo },
          },
          select: {
            id: true,
            orderNumber: true,
            total: true,
            completedAt: true,
            customer: { select: { name: true, phone: true } },
          },
          orderBy: { completedAt: "asc" },
          take: 10,
        }),
        prisma.order.findMany({
          where: {
            status: "COMPLETED",
            deletedAt: null,
            payment: { is: null },
          },
          select: {
            id: true,
            orderNumber: true,
            total: true,
            completedAt: true,
            customer: { select: { name: true, phone: true } },
          },
          orderBy: { completedAt: "desc" },
          take: 10,
        }),
        prisma.order.count({ where: { status: "DRAFT", deletedAt: null } }),
      ]);

    return {
      stuckOrders: stuckOrders.map((o) => ({
        orderNumber: o.orderNumber,
        total: o.total,
        service: o.items[0]?.productNameSnapshot || "-",
        mechanic:
          o.items[0]?.assignments[0]?.mechanic?.fullName || "Belum di-assign",
        plateNumber: o.vehicle?.plateNumber || "-",
        customer: o.customer?.name || "Umum",
        startedAt: o.startedAt,
        stuckHours: o.startedAt
          ? Math.round((Date.now() - new Date(o.startedAt).getTime()) / 3600000)
          : 0,
      })),
      overduePayments: overduePayments.map((o) => ({
        orderNumber: o.orderNumber,
        total: o.total,
        customer: o.customer?.name || "Umum",
        phone: o.customer?.phone || "-",
        completedAt: o.completedAt,
        overdueHours: o.completedAt
          ? Math.round(
              (Date.now() - new Date(o.completedAt).getTime()) / 3600000
            )
          : 0,
      })),
      unpaidOrders: unpaidOrders.map((o) => ({
        orderNumber: o.orderNumber,
        total: o.total,
        customer: o.customer?.name || "Umum",
        completedAt: o.completedAt,
      })),
      summary: {
        stuckCount: stuckOrders.length,
        overduePaymentCount: overduePayments.length,
        unpaidCount: unpaidOrders.length,
        draftCount: draftOrders,
        totalAttentionNeeded:
          stuckOrders.length + overduePayments.length + unpaidOrders.length,
      },
    };
  }

  /**
   * Rekomendasi restock: produk urgent yang perlu dibeli
   * @returns {Promise<Object>}
   */
  async getAdminRestockRecommendations() {
    const lowThreshold = parseInt(
      await this.#getSetting("stock_low_threshold", "5"),
      10
    );
    const since90 = new Date(Date.now() - 90 * 86400000);

    const [outOfStock, lowStock, topSellingLowStock] = await Promise.all([
      prisma.product.findMany({
        where: { type: "SPAREPART", isActive: true, stock: 0 },
        select: { id: true, sku: true, name: true, cost: true, price: true },
        take: 20,
      }),
      prisma.product.findMany({
        where: {
          type: "SPAREPART",
          isActive: true,
          stock: { gt: 0, lte: lowThreshold },
        },
        select: {
          id: true,
          sku: true,
          name: true,
          stock: true,
          cost: true,
          price: true,
        },
        orderBy: { stock: "asc" },
        take: 20,
      }),
      prisma.$queryRaw`
        SELECT p."id", p."sku", p."name", p."stock", p."cost", p."price",
          COALESCE(SUM(oi."quantity"), 0)::int as sold_90d,
          ROUND(COALESCE(SUM(oi."quantity"), 0) / 90.0, 1) as avg_daily_sales
        FROM "Product" p
        LEFT JOIN "OrderItem" oi ON p."id" = oi."productId"
        LEFT JOIN "Order" o ON oi."orderId" = o."id"
          AND o."createdAt" >= ${since90}
          AND o."status" IN ('COMPLETED','CLOSED')
          AND o."deletedAt" IS NULL
        WHERE p."type" = 'SPAREPART' AND p."isActive" = true
          AND p."stock" <= ${lowThreshold}
        GROUP BY p."id", p."sku", p."name", p."stock", p."cost", p."price"
        HAVING COALESCE(SUM(oi."quantity"), 0) > 0
        ORDER BY avg_daily_sales DESC
        LIMIT 20
      `,
    ]);

    const totalRestockCost = [...outOfStock, ...lowStock].reduce(
      (sum, p) => sum + p.cost * Math.max(lowThreshold - (p.stock || 0), 0),
      0
    );

    return {
      outOfStock: outOfStock.map((p) => ({
        sku: p.sku,
        name: p.name,
        cost: p.cost,
        price: p.price,
        suggestedRestock: lowThreshold,
        estimatedCost: p.cost * lowThreshold,
      })),
      lowStock: lowStock.map((p) => ({
        sku: p.sku,
        name: p.name,
        stock: p.stock,
        cost: p.cost,
        price: p.price,
        suggestedRestock: lowThreshold - p.stock,
        estimatedCost: p.cost * (lowThreshold - p.stock),
      })),
      topSellingLowStock: topSellingLowStock.map((p) => ({
        sku: p.sku,
        name: p.name,
        stock: Number(p.stock),
        cost: Number(p.cost),
        price: Number(p.price),
        sold90Days: Number(p.sold_90d),
        avgDailySales: Number(p.avg_daily_sales),
        daysUntilOutOfStock:
          Number(p.avg_daily_sales) > 0
            ? Math.floor(Number(p.stock) / Number(p.avg_daily_sales))
            : 999,
        suggestedRestock: Math.max(
          lowThreshold - Number(p.stock),
          Math.ceil(Number(p.avg_daily_sales) * 30)
        ),
        estimatedCost:
          Number(p.cost) *
          Math.max(
            lowThreshold - Number(p.stock),
            Math.ceil(Number(p.avg_daily_sales) * 30)
          ),
      })),
      summary: {
        outOfStockCount: outOfStock.length,
        lowStockCount: lowStock.length,
        totalItemsToRestock: outOfStock.length + lowStock.length,
        estimatedTotalCost: totalRestockCost,
        lowThreshold,
      },
    };
  }

  // ============================================================================
  // P2 - HIGH VALUE: Order Trend, Revenue by Day, Customer Segmentation (3 functions)
  // ============================================================================

  /**
   * Tren order harian untuk 4 minggu terakhir
   * @returns {Promise<Object>}
   */
  async getAdminOrderTrend() {
    const fourWeeksAgo = new Date(Date.now() - 28 * 86400000);

    const raw = await prisma.$queryRaw`
      SELECT DATE("createdAt") as date, COUNT("id")::int as orders, COALESCE(SUM("total"), 0)::bigint as revenue
      FROM "Order"
      WHERE "createdAt" >= ${fourWeeksAgo} AND "deletedAt" IS NULL
      GROUP BY DATE("createdAt")
      ORDER BY date ASC
    `;

    const daily = raw.map((r) => ({
      date: r.date,
      orders: Number(r.orders),
      revenue: Number(r.revenue),
    }));

    const firstWeek = daily.slice(0, 7).reduce((s, d) => s + d.orders, 0);
    const lastWeek = daily.slice(-7).reduce((s, d) => s + d.orders, 0);
    const trend =
      firstWeek > 0
        ? Math.round(((lastWeek - firstWeek) / firstWeek) * 100)
        : 0;

    return {
      daily,
      summary: {
        totalOrders: daily.reduce((s, d) => s + d.orders, 0),
        totalRevenue: daily.reduce((s, d) => s + d.revenue, 0),
        avgDailyOrders: Math.round(
          daily.reduce((s, d) => s + d.orders, 0) / Math.max(daily.length, 1)
        ),
        firstWeekOrders: firstWeek,
        lastWeekOrders: lastWeek,
        trend,
        direction: trend > 0 ? "up" : trend < 0 ? "down" : "stable",
      },
    };
  }

  /**
   * Revenue per hari dalam seminggu
   * @returns {Promise<Object>}
   */
  async getAdminRevenueByDayOfWeek() {
    const startYear = this.#getOneYearAgo();

    const raw = await prisma.$queryRaw`
      SELECT EXTRACT(DOW FROM "createdAt")::int as day_of_week, COUNT("id")::int as orders, COALESCE(SUM("total"), 0)::bigint as revenue, ROUND(AVG("total"))::int as avg_order_value
      FROM "Order"
      WHERE "createdAt" >= ${startYear} AND "status" IN ('COMPLETED','CLOSED') AND "deletedAt" IS NULL
      GROUP BY day_of_week
      ORDER BY day_of_week ASC
    `;

    const dayNames = [
      "Minggu",
      "Senin",
      "Selasa",
      "Rabu",
      "Kamis",
      "Jumat",
      "Sabtu",
    ];

    const daily = raw.map((r) => ({
      day: dayNames[Number(r.day_of_week)],
      dayIndex: Number(r.day_of_week),
      orders: Number(r.orders),
      revenue: Number(r.revenue),
      avgOrderValue: Number(r.avg_order_value),
    }));

    const bestDay = [...daily].sort((a, b) => b.revenue - a.revenue)[0];
    const worstDay = [...daily].sort((a, b) => a.revenue - b.revenue)[0];

    return {
      daily,
      summary: {
        bestDay: bestDay
          ? {
              day: bestDay.day,
              revenue: bestDay.revenue,
              orders: bestDay.orders,
            }
          : null,
        worstDay: worstDay
          ? {
              day: worstDay.day,
              revenue: worstDay.revenue,
              orders: worstDay.orders,
            }
          : null,
      },
    };
  }

  /**
   * Segmentasi pelanggan
   * @returns {Promise<Object>}
   */
  async getAdminCustomerSegmentation() {
    const twoVisitsThreshold = 2;
    const fiveVisitsThreshold = 5;
    const dormantDays = 90;
    const dormantDate = new Date(Date.now() - dormantDays * 86400000);

    const raw = await prisma.$queryRaw`
      WITH customer_stats AS (
        SELECT c."id", c."name", c."phone",
          COUNT(DISTINCT o."id")::int as total_visits,
          COALESCE(SUM(o."total"), 0)::bigint as total_spent,
          MAX(o."createdAt") as last_visit,
          MIN(o."createdAt") as first_visit
        FROM "Customer" c
        LEFT JOIN "Order" o ON c."id" = o."customerId"
          AND o."status" IN ('COMPLETED','CLOSED')
          AND o."deletedAt" IS NULL
        GROUP BY c."id", c."name", c."phone"
      )
      SELECT 
        COUNT(*)::int as total_customers,
        COUNT(*) FILTER (WHERE total_visits = 1)::int as new_customers,
        COUNT(*) FILTER (WHERE total_visits >= ${twoVisitsThreshold} AND total_visits <= ${fiveVisitsThreshold})::int as regular_customers,
        COUNT(*) FILTER (WHERE total_visits > ${fiveVisitsThreshold})::int as vip_customers,
        COUNT(*) FILTER (WHERE total_visits > 0 AND last_visit < ${dormantDate})::int as dormant_customers,
        COUNT(*) FILTER (WHERE total_visits = 0)::int as no_order_customers,
        COALESCE(SUM(total_spent), 0)::bigint as total_revenue
      FROM customer_stats
    `;

    const topVIP = await prisma.$queryRaw`
      WITH customer_stats AS (
        SELECT c."id", c."name", c."phone",
          COUNT(DISTINCT o."id")::int as total_visits,
          COALESCE(SUM(o."total"), 0)::bigint as total_spent,
          MAX(o."createdAt") as last_visit
        FROM "Customer" c
        INNER JOIN "Order" o ON c."id" = o."customerId"
          AND o."status" IN ('COMPLETED','CLOSED')
          AND o."deletedAt" IS NULL
        GROUP BY c."id", c."name", c."phone"
        HAVING COUNT(DISTINCT o."id") > ${fiveVisitsThreshold}
      )
      SELECT * FROM customer_stats ORDER BY total_spent DESC LIMIT 10
    `;

    const r = raw[0];
    const total = Number(r.total_customers);

    return {
      summary: {
        totalCustomers: total,
        new: {
          count: Number(r.new_customers),
          pct:
            total > 0 ? Math.round((Number(r.new_customers) / total) * 100) : 0,
        },
        regular: {
          count: Number(r.regular_customers),
          pct:
            total > 0
              ? Math.round((Number(r.regular_customers) / total) * 100)
              : 0,
        },
        vip: {
          count: Number(r.vip_customers),
          pct:
            total > 0 ? Math.round((Number(r.vip_customers) / total) * 100) : 0,
        },
        dormant: {
          count: Number(r.dormant_customers),
          pct:
            total > 0
              ? Math.round((Number(r.dormant_customers) / total) * 100)
              : 0,
        },
        noOrder: {
          count: Number(r.no_order_customers),
          pct:
            total > 0
              ? Math.round((Number(r.no_order_customers) / total) * 100)
              : 0,
        },
      },
      topVIP: topVIP.map((c) => ({
        name: c.name,
        phone: c.phone,
        visits: Number(c.total_visits),
        totalSpent: Number(c.total_spent),
        lastVisit: c.last_visit,
      })),
    };
  }

  // ============================================================================
  // P3 - GROWTH: Profitable Services, Service Bundles, Revenue Forecast (3 functions)
  // ============================================================================

  /**
   * Service yang paling menguntungkan (profit margin)
   * @returns {Promise<Object>}
   */
  async getAdminMostProfitableServices() {
    const startYear = this.#getOneYearAgo();

    const raw = await prisma.$queryRaw`
      SELECT oi."productNameSnapshot" as name,
        COUNT(DISTINCT o."id")::int as orders,
        SUM(oi."quantity")::int as quantity,
        SUM(oi."subtotal")::bigint as revenue,
        SUM(oi."unitCostSnapshot" * oi."quantity")::bigint as cost,
        SUM(oi."subtotal" - (oi."unitCostSnapshot" * oi."quantity"))::bigint as profit,
        CASE WHEN SUM(oi."subtotal") > 0 THEN ROUND((SUM(oi."subtotal" - (oi."unitCostSnapshot" * oi."quantity"))::float / SUM(oi."subtotal") * 100)::numeric, 1) ELSE 0 END as margin_pct
      FROM "OrderItem" oi
      INNER JOIN "Product" p ON oi."productId" = p."id"
      INNER JOIN "Order" o ON oi."orderId" = o."id"
      WHERE p."type" = 'SERVICE' AND o."createdAt" >= ${startYear} AND o."status" IN ('COMPLETED','CLOSED') AND o."deletedAt" IS NULL
      GROUP BY oi."productNameSnapshot"
      ORDER BY margin_pct DESC
      LIMIT 15
    `;

    const services = raw.map((r) => ({
      name: r.name,
      orders: Number(r.orders),
      quantity: Number(r.quantity),
      revenue: Number(r.revenue),
      cost: Number(r.cost),
      profit: Number(r.profit),
      marginPct: Number(r.margin_pct),
    }));

    const avgMargin =
      services.length > 0
        ? Math.round(
            services.reduce((s, r) => s + r.marginPct, 0) / services.length
          )
        : 0;

    return {
      services,
      summary: {
        totalServices: services.length,
        avgMargin,
        highestMargin: services[0] || null,
        lowestMargin: services[services.length - 1] || null,
      },
    };
  }

  /**
   * Service bundles (kombinasi yang sering dijual bersama)
   * @returns {Promise<Object>}
   */
  async getAdminServiceBundles() {
    const startYear = this.#getOneYearAgo();

    const raw = await prisma.$queryRaw`
      WITH order_services AS (
        SELECT oi."orderId", oi."productNameSnapshot" as service_name
        FROM "OrderItem" oi
        INNER JOIN "Product" p ON oi."productId" = p."id"
        INNER JOIN "Order" o ON oi."orderId" = o."id"
        WHERE p."type" = 'SERVICE' AND o."createdAt" >= ${startYear} AND o."status" IN ('COMPLETED','CLOSED') AND o."deletedAt" IS NULL
      ),
      bundles AS (
        SELECT os1.service_name as service_a, os2.service_name as service_b, COUNT(DISTINCT os1."orderId")::int as frequency
        FROM order_services os1
        INNER JOIN order_services os2 ON os1."orderId" = os2."orderId" AND os1.service_name < os2.service_name
        GROUP BY os1.service_name, os2.service_name
        HAVING COUNT(DISTINCT os1."orderId") >= 2
      )
      SELECT * FROM bundles ORDER BY frequency DESC LIMIT 15
    `;

    return {
      bundles: raw.map((r) => ({
        serviceA: r.service_a,
        serviceB: r.service_b,
        frequency: Number(r.frequency),
      })),
      summary: {
        totalBundles: raw.length,
        topBundle: raw[0] ? `${raw[0].service_a} + ${raw[0].service_b}` : null,
      },
    };
  }

  /**
   * Forecast revenue bulan depan berdasarkan tren 3 bulan terakhir
   * @returns {Promise<Object>}
   */
  async getAdminRevenueForecast() {
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const raw = await prisma.$queryRaw`
      SELECT DATE_TRUNC('month', "createdAt")::date as month, COALESCE(SUM("total"), 0)::bigint as revenue, COUNT("id")::int as orders
      FROM "Order"
      WHERE "createdAt" >= ${threeMonthsAgo} AND "status" IN ('COMPLETED','CLOSED') AND "deletedAt" IS NULL
      GROUP BY month
      ORDER BY month ASC
    `;

    const months = raw.map((r) => ({
      month: r.month,
      revenue: Number(r.revenue),
      orders: Number(r.orders),
    }));

    const avgRevenue =
      months.length > 0
        ? Math.round(months.reduce((s, m) => s + m.revenue, 0) / months.length)
        : 0;
    const avgOrders =
      months.length > 0
        ? Math.round(months.reduce((s, m) => s + m.orders, 0) / months.length)
        : 0;

    const growthRate =
      months.length >= 2
        ? (months[months.length - 1].revenue - months[0].revenue) /
          Math.max(months[0].revenue, 1)
        : 0;

    const forecastRevenue = Math.round(avgRevenue * (1 + growthRate));
    const forecastOrders = Math.round(avgOrders * (1 + growthRate));

    return {
      historical: months,
      forecast: {
        nextMonth: {
          revenue: forecastRevenue,
          orders: forecastOrders,
        },
        confidence:
          growthRate > 0.5 ? "low" : growthRate > 0.2 ? "medium" : "high",
        basedOnMonths: months.length,
        avgMonthlyRevenue: avgRevenue,
        growthRate: Math.round(growthRate * 100),
      },
    };
  }

  // ============================================================================
  // EXISTING METHODS (unchanged)
  // ============================================================================

  async getAdminStockAlert() {
    const lowThreshold = parseInt(
      await this.#getSetting("stock_low_threshold", "5"),
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
  }

  async getAdminRevenueVsTarget() {
    const now = new Date();
    const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startYear = new Date(now.getFullYear(), 0, 1);
    const [monthlyRevenue, yearlyRevenue, targetSetting] = await Promise.all([
      prisma.order.aggregate({
        where: {
          createdAt: { gte: startMonth },
          status: { in: ["COMPLETED", "CLOSED"] },
          deletedAt: null,
        },
        _sum: { total: true },
      }),
      prisma.order.aggregate({
        where: {
          createdAt: { gte: startYear },
          status: { in: ["COMPLETED", "CLOSED"] },
          deletedAt: null,
        },
        _sum: { total: true },
      }),
      this.#getSetting("monthly_revenue_target", "0"),
    ]);
    const monthlyRev = Number(monthlyRevenue._sum.total || 0);
    const yearlyRev = Number(yearlyRevenue._sum.total || 0);
    const target = Number(targetSetting || 0);
    const yearlyTarget = target * 12;
    return {
      monthly: {
        current: monthlyRev,
        target,
        percentage: target > 0 ? Math.round((monthlyRev / target) * 100) : 0,
        remaining: Math.max(target - monthlyRev, 0),
        daysInMonth: new Date(
          now.getFullYear(),
          now.getMonth() + 1,
          0
        ).getDate(),
        daysPassed: now.getDate(),
        projected:
          now.getDate() > 0
            ? Math.round(
                (monthlyRev / now.getDate()) *
                  new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
              )
            : 0,
      },
      yearly: {
        current: yearlyRev,
        target: yearlyTarget,
        percentage:
          yearlyTarget > 0 ? Math.round((yearlyRev / yearlyTarget) * 100) : 0,
        remaining: Math.max(yearlyTarget - yearlyRev, 0),
      },
    };
  }

  async getAdminTopCustomersByVisit() {
    const [topCustomers, newCustomers] = await Promise.all([
      prisma.$queryRaw`SELECT c."id", c."name", c."phone", COUNT(DISTINCT o."id")::int as total_visits, COALESCE(SUM(o."total"), 0)::bigint as total_spent, MAX(o."createdAt") as last_visit FROM "Customer" c INNER JOIN "Order" o ON c."id" = o."customerId" WHERE o."status" IN ('COMPLETED','CLOSED') AND o."deletedAt" IS NULL GROUP BY c."id", c."name", c."phone" ORDER BY total_visits DESC LIMIT 10`,
      prisma.customer.findMany({
        select: {
          id: true,
          name: true,
          phone: true,
          createdAt: true,
          _count: { select: { orders: true, vehicles: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
    ]);
    return {
      topByVisits: topCustomers.map((r) => ({
        customerId: r.id,
        customerName: r.name,
        phone: r.phone,
        totalVisits: Number(r.total_visits),
        totalSpent: Number(r.total_spent),
        lastVisit: r.last_visit,
      })),
      newestCustomers: newCustomers.map((c) => ({
        id: c.id,
        name: c.name,
        phone: c.phone,
        registeredAt: c.createdAt,
        orderCount: c._count.orders,
        vehicleCount: c._count.vehicles,
      })),
    };
  }

  async getAdminOrderCompletionTime() {
    const startMonth = this.#getStartOfMonth();
    const startYear = this.#getOneYearAgo();
    const [monthly, yearly] = await Promise.all([
      prisma.$queryRaw`SELECT ROUND(AVG(EXTRACT(EPOCH FROM (o."completedAt" - o."createdAt")) / 3600)::numeric, 1) as avg_hours, COUNT(o."id")::int as total_orders FROM "Order" o WHERE o."createdAt" >= ${startMonth} AND o."status" IN ('COMPLETED','CLOSED') AND o."deletedAt" IS NULL AND o."completedAt" IS NOT NULL`,
      prisma.$queryRaw`SELECT ROUND(AVG(EXTRACT(EPOCH FROM (o."completedAt" - o."createdAt")) / 3600)::numeric, 1) as avg_hours, COUNT(o."id")::int as total_orders FROM "Order" o WHERE o."createdAt" >= ${startYear} AND o."status" IN ('COMPLETED','CLOSED') AND o."deletedAt" IS NULL AND o."completedAt" IS NOT NULL`,
    ]);
    return {
      monthly: {
        avgHours: Number(monthly[0].avg_hours) || 0,
        totalOrders: Number(monthly[0].total_orders),
      },
      yearly: {
        avgHours: Number(yearly[0].avg_hours) || 0,
        totalOrders: Number(yearly[0].total_orders),
      },
    };
  }

  async getAdminMechanicAvailability() {
    const maxTasks = parseInt(
      await this.#getSetting("mechanic_max_tasks", "5"),
      10
    );
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

  async getAdminCustomerRetention() {
    const oneYearAgo = this.#getOneYearAgo();
    const [raw, monthlyDetail] = await Promise.all([
      prisma.$queryRaw`WITH customer_months AS (SELECT DISTINCT c."id", DATE_TRUNC('month', o."createdAt")::date as month FROM "Customer" c INNER JOIN "Order" o ON c."id" = o."customerId" WHERE o."createdAt" >= ${oneYearAgo} AND o."status" IN ('COMPLETED','CLOSED') AND o."deletedAt" IS NULL), first_month AS (SELECT "id", MIN(month) as first_month FROM customer_months GROUP BY "id"), retention_data AS (SELECT cm.month, COUNT(DISTINCT cm."id") as total_customers, COUNT(DISTINCT CASE WHEN fm.first_month < cm.month THEN cm."id" END) as returning_customers FROM customer_months cm INNER JOIN first_month fm ON cm."id" = fm."id" GROUP BY cm.month ORDER BY cm.month) SELECT ROUND(AVG(CASE WHEN total_customers > 0 THEN (returning_customers::float / total_customers * 100) ELSE 0 END)::numeric, 1) as avg_retention_rate, SUM(total_customers)::int as total_customers, SUM(returning_customers)::int as total_returning FROM retention_data`,
      prisma.$queryRaw`WITH customer_months AS (SELECT DISTINCT c."id", DATE_TRUNC('month', o."createdAt")::date as month FROM "Customer" c INNER JOIN "Order" o ON c."id" = o."customerId" WHERE o."createdAt" >= ${oneYearAgo} AND o."status" IN ('COMPLETED','CLOSED') AND o."deletedAt" IS NULL), first_month AS (SELECT "id", MIN(month) as first_month FROM customer_months GROUP BY "id") SELECT cm.month, COUNT(DISTINCT cm."id")::int as total, COUNT(DISTINCT CASE WHEN fm.first_month < cm.month THEN cm."id" END)::int as returning, COUNT(DISTINCT CASE WHEN fm.first_month = cm.month THEN cm."id" END)::int as new_customers FROM customer_months cm INNER JOIN first_month fm ON cm."id" = fm."id" GROUP BY cm.month ORDER BY cm.month DESC LIMIT 12`,
    ]);
    return {
      summary: {
        avgRetentionRate: Number(raw[0].avg_retention_rate) || 0,
        totalCustomers: Number(raw[0].total_customers),
        totalReturning: Number(raw[0].total_returning),
      },
      monthlyDetail: monthlyDetail.map((r) => ({
        month: r.month,
        total: Number(r.total),
        returning: Number(r.returning),
        new: Number(r.new_customers),
        retentionRate:
          Number(r.total) > 0
            ? Math.round((Number(r.returning) / Number(r.total)) * 1000) / 10
            : 0,
      })),
    };
  }

  async getAdminPaymentMethodDistribution() {
    const startMonth = this.#getStartOfMonth();
    const startYear = this.#getOneYearAgo();
    const [monthly, yearly] = await Promise.all([
      prisma.$queryRaw`SELECT p."method", COUNT(p."id")::int as count, COALESCE(SUM(p."amountPaid"), 0)::bigint as total FROM "Payment" p INNER JOIN "Order" o ON p."orderId" = o."id" WHERE p."status" = 'PAID' AND p."paidAt" >= ${startMonth} AND o."deletedAt" IS NULL GROUP BY p."method" ORDER BY count DESC`,
      prisma.$queryRaw`SELECT p."method", COUNT(p."id")::int as count, COALESCE(SUM(p."amountPaid"), 0)::bigint as total FROM "Payment" p INNER JOIN "Order" o ON p."orderId" = o."id" WHERE p."status" = 'PAID' AND p."paidAt" >= ${startYear} AND o."deletedAt" IS NULL GROUP BY p."method" ORDER BY count DESC`,
    ]);
    const formatDistribution = (raw) => {
      const total = raw.reduce((s, r) => s + Number(r.count), 0);
      return raw.map((r) => ({
        method: r.method,
        count: Number(r.count),
        total: Number(r.total),
        pct: total ? Math.round((Number(r.count) / total) * 10000) / 100 : 0,
      }));
    };
    return {
      monthly: formatDistribution(monthly),
      yearly: formatDistribution(yearly),
    };
  }
}

export default InsightRepository;
