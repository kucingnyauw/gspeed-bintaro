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
   * Ambil semua settings terkait target
   * @returns {Promise<Object>}
   * @private
   */
  async #getAllTargetSettings() {
    const settings = await prisma.setting.findMany({
      where: {
        key: {
          in: [
            "monthly_revenue_target",
            "daily_revenue_target",
            "yearly_revenue_target",
            "monthly_profit_target",
            "monthly_order_target",
            "daily_order_target",
          ],
        },
      },
      select: { key: true, value: true },
    });

    const targets = {};
    for (const s of settings) {
      targets[s.key] = parseInt(s.value, 10) || 0;
    }

    return {
      dailyRevenue: targets.daily_revenue_target || 0,
      monthlyRevenue: targets.monthly_revenue_target || 0,
      yearlyRevenue: targets.yearly_revenue_target || 0,
      monthlyProfit: targets.monthly_profit_target || 0,
      dailyOrder: targets.daily_order_target || 0,
      monthlyOrder: targets.monthly_order_target || 0,
    };
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

  /**
   * Generate date ranges untuk metadata
   * @returns {Object}
   * @private
   */
  #getDateRanges() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const daily = [];
    for (let i = 0; i < 1; i++) {
      const d = new Date(today);
      daily.push(d.toISOString().split("T")[0]);
    }

    const weekly = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      weekly.push(d.toISOString().split("T")[0]);
    }

    const monthly = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      monthly.push(d.toISOString().split("T")[0]);
    }

    const yearly = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      yearly.push(
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
      );
    }

    return {
      today: today.toISOString().split("T")[0],
      daily,
      weekly,
      monthly,
      yearly,
    };
  }

  // ============================================================================
  // MEKANIK (7 functions)
  // ============================================================================

  /**
   * Job aktif yang sedang dikerjakan mekanik (IN_PROGRESS)
   * @param {string} mechanicId
   * @returns {Promise<{jobs: Array, count: number, _metadata: Object}>}
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
      _metadata: {
        ...this.#getDateRanges(),
        type: "real-time",
        description:
          "Job yang sedang dikerjakan saat ini (real-time, no cache)",
      },
    };
  }

  /**
   * Job antrian yang menunggu dikerjakan mekanik (QUEUED)
   * @param {string} mechanicId
   * @returns {Promise<{jobs: Array, count: number, _metadata: Object}>}
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
      _metadata: {
        ...this.#getDateRanges(),
        type: "real-time",
        description:
          "Job antrian yang menunggu dikerjakan (real-time, no cache)",
      },
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
        prisma.$queryRaw`
      SELECT 
        COUNT(ma."id")::int as completed, 
        COALESCE(SUM(oi."subtotal"), 0)::bigint as earnings 
      FROM "MechanicAssignment" ma 
      INNER JOIN "OrderItem" oi ON ma."orderItemId" = oi."id" 
      INNER JOIN "Order" o ON oi."orderId" = o."id" 
      WHERE ma."mechanicId" = ${mechanicId} 
        AND ma."endAt" >= ${startDay} 
        AND o."status" IN ('COMPLETED','CLOSED') 
        AND o."deletedAt" IS NULL
    `,
        prisma.$queryRaw`
      SELECT 
        COUNT(ma."id")::int as completed, 
        COALESCE(SUM(oi."subtotal"), 0)::bigint as earnings 
      FROM "MechanicAssignment" ma 
      INNER JOIN "OrderItem" oi ON ma."orderItemId" = oi."id" 
      INNER JOIN "Order" o ON oi."orderId" = o."id" 
      WHERE ma."mechanicId" = ${mechanicId} 
        AND ma."endAt" >= ${startWeek} 
        AND o."status" IN ('COMPLETED','CLOSED') 
        AND o."deletedAt" IS NULL
    `,
        prisma.$queryRaw`
      SELECT 
        COUNT(ma."id")::int as completed, 
        COALESCE(SUM(oi."subtotal"), 0)::bigint as earnings 
      FROM "MechanicAssignment" ma 
      INNER JOIN "OrderItem" oi ON ma."orderItemId" = oi."id" 
      INNER JOIN "Order" o ON oi."orderId" = o."id" 
      WHERE ma."mechanicId" = ${mechanicId} 
        AND ma."endAt" >= ${startMonth} 
        AND o."status" IN ('COMPLETED','CLOSED') 
        AND o."deletedAt" IS NULL
    `,
        prisma.$queryRaw`
      SELECT 
        COUNT(ma."id")::int as completed, 
        COALESCE(SUM(oi."subtotal"), 0)::bigint as earnings 
      FROM "MechanicAssignment" ma 
      INNER JOIN "OrderItem" oi ON ma."orderItemId" = oi."id" 
      INNER JOIN "Order" o ON oi."orderId" = o."id" 
      WHERE ma."mechanicId" = ${mechanicId} 
        AND ma."endAt" >= ${startYear} 
        AND o."status" IN ('COMPLETED','CLOSED') 
        AND o."deletedAt" IS NULL
    `,
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
        durationMinutes:
          j.startAt && j.endAt
            ? Math.round((new Date(j.endAt) - new Date(j.startAt)) / 60000)
            : null,
      })),
      _metadata: {
        ...this.#getDateRanges(),
        periods: {
          daily: {
            start: startDay.toISOString(),
            description: "Hari ini (sejak jam 00:00)",
          },
          weekly: {
            start: startWeek.toISOString(),
            description: "Minggu ini (Senin-Minggu)",
          },
          monthly: {
            start: startMonth.toISOString(),
            description: "Bulan ini (tanggal 1 sampai sekarang)",
          },
          yearly: {
            start: startYear.toISOString(),
            description: "1 tahun terakhir",
          },
        },
      },
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
      _metadata: {
        ...this.#getDateRanges(),
        periods: {
          weekly: { start: startWeek.toISOString() },
          monthly: { start: startMonth.toISOString() },
          yearly: { start: startYear.toISOString() },
        },
      },
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
            order: {
              status: { in: ["COMPLETED", "CLOSED"] },
              deletedAt: null,
            },
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
      _metadata: {
        ...this.#getDateRanges(),
        periods: {
          monthly: { start: startMonth.toISOString() },
          yearly: { start: startYear.toISOString() },
        },
      },
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
      prisma.$queryRaw`
      SELECT 
        COUNT(ma."id")::int as jobs, 
        COALESCE(SUM(oi."subtotal"), 0)::bigint as earnings, 
        ROUND(AVG(oi."subtotal"))::int as avgPerJob 
      FROM "MechanicAssignment" ma 
      INNER JOIN "OrderItem" oi ON ma."orderItemId" = oi."id" 
      INNER JOIN "Order" o ON oi."orderId" = o."id" 
      WHERE ma."mechanicId" = ${mechanicId} 
        AND ma."endAt" >= ${startMonth} 
        AND o."status" IN ('COMPLETED','CLOSED') 
        AND o."deletedAt" IS NULL
    `,
      prisma.$queryRaw`
      SELECT 
        COUNT(ma."id")::int as jobs, 
        COALESCE(SUM(oi."subtotal"), 0)::bigint as earnings, 
        ROUND(AVG(oi."subtotal"))::int as avgPerJob 
      FROM "MechanicAssignment" ma 
      INNER JOIN "OrderItem" oi ON ma."orderItemId" = oi."id" 
      INNER JOIN "Order" o ON oi."orderId" = o."id" 
      WHERE ma."mechanicId" = ${mechanicId} 
        AND ma."endAt" >= ${startYear} 
        AND o."status" IN ('COMPLETED','CLOSED') 
        AND o."deletedAt" IS NULL
    `,
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
      _metadata: {
        ...this.#getDateRanges(),
        periods: {
          monthly: { start: startMonth.toISOString() },
          yearly: { start: startYear.toISOString() },
        },
      },
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
        _metadata: { ...this.#getDateRanges(), type: "all-time" },
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
      _metadata: {
        ...this.#getDateRanges(),
        type: "all-time",
        description: "Ranking berdasarkan seluruh history (minimal 5 job)",
      },
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
    const targets = await this.#getAllTargetSettings();

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
      targets: {
        daily: {
          revenue: targets.dailyRevenue,
          orders: targets.dailyOrder,
          revenuePct:
            targets.dailyRevenue > 0
              ? Math.round((todaySales / targets.dailyRevenue) * 100)
              : 0,
          orderPct:
            targets.dailyOrder > 0
              ? Math.round((todayData._count / targets.dailyOrder) * 100)
              : 0,
        },
        monthly: {
          revenue: targets.monthlyRevenue,
          orders: targets.monthlyOrder,
        },
      },
      topTransactions: topTransactions.map((t) => ({
        orderNumber: t.orderNumber,
        customer: t.customer?.name || "Umum",
        total: t.total,
        method: t.payment?.method || null,
        createdAt: t.createdAt,
      })),
      _metadata: {
        ...this.#getDateRanges(),
        periods: {
          daily: { start: startDay.toISOString() },
          monthly: { start: startMonth.toISOString() },
          yearly: { start: startYear.toISOString() },
        },
      },
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
        _metadata: { ...this.#getDateRanges(), type: "real-time" },
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
      _metadata: {
        ...this.#getDateRanges(),
        type: "real-time",
        shiftOpenedAt: shift.openedAt,
      },
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
      _metadata: { ...this.#getDateRanges(), type: "real-time" },
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
      _metadata: { ...this.#getDateRanges() },
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
      _metadata: { ...this.#getDateRanges(), type: "all-time" },
    };
  }

  /**
   * Transaksi terbaru kasir
   * @param {string} cashierId
   * @returns {Promise<Array>}
   */
  async getCashierRecentTransactions(cashierId) {
    const transactions = await prisma.order.findMany({
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
    });
    return {
      transactions: transactions.map((i) => ({
        orderNumber: i.orderNumber,
        total: i.total,
        status: i.status,
        customer: i.customer?.name || "Umum",
        method: i.payment?.method || null,
        createdAt: i.createdAt,
      })),
      count: transactions.length,
      _metadata: { ...this.#getDateRanges(), type: "recent" },
    };
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
      _metadata: { ...this.#getDateRanges() },
    };
  }

  // ============================================================================
  // ADMIN - DASHBOARD & OVERVIEW
  // ============================================================================

  /**
   * Dashboard bengkel: ringkasan + recent orders + top mechanics + targets
   * @returns {Promise<Object>}
   */
  async getAdminDashboardSnapshot() {
    const startDay = this.#getStartOfDay();
    const startMonth = this.#getStartOfMonth();
    const startYear = this.#getOneYearAgo();

    const [lowThreshold, maxTasks, targets] = await Promise.all([
      this.#getSetting("stock_low_threshold", "5"),
      this.#getSetting("mechanic_max_tasks", "5"),
      this.#getAllTargetSettings(),
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
      dailyTargetCheck,
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
      prisma.order.aggregate({
        where: { createdAt: { gte: startDay }, deletedAt: null },
        _count: true,
      }),
    ]);

    const dailyRevenue = Number(daily._sum.total || 0);
    const dailyOrders = daily._count;

    return {
      revenue: {
        daily: dailyRevenue,
        monthly: Number(monthly._sum.total || 0),
        yearly: Number(yearly._sum.total || 0),
      },
      orders: {
        daily: dailyOrders,
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
      targets: {
        daily: {
          revenue: targets.dailyRevenue,
          revenuePct:
            targets.dailyRevenue > 0
              ? Math.round((dailyRevenue / targets.dailyRevenue) * 100)
              : 0,
          orders: targets.dailyOrder,
          orderPct:
            targets.dailyOrder > 0
              ? Math.round((dailyOrders / targets.dailyOrder) * 100)
              : 0,
        },
        monthly: {
          revenue: targets.monthlyRevenue,
          orders: targets.monthlyOrder,
          profit: targets.monthlyProfit,
        },
        yearly: { revenue: targets.yearlyRevenue },
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
      _metadata: { ...this.#getDateRanges() },
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
      _metadata: { ...this.#getDateRanges() },
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
      _metadata: { ...this.#getDateRanges() },
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
      _metadata: { ...this.#getDateRanges() },
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
      _metadata: { ...this.#getDateRanges() },
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
      _metadata: {
        ...this.#getDateRanges(),
        lowThreshold,
        deadStockSince: since90.toISOString().split("T")[0],
      },
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
      _metadata: {
        ...this.#getDateRanges(),
        periods: {
          monthly: {
            thisMonth: thisMonth.toISOString(),
            lastMonth: lastMonth.toISOString(),
          },
          yearly: {
            thisYear: thisYear.toISOString(),
            lastYear: lastYear.toISOString(),
          },
        },
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
      _metadata: { ...this.#getDateRanges() },
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
      _metadata: { ...this.#getDateRanges() },
    };
  }

  // ============================================================================
  // P1 - CRITICAL
  // ============================================================================

  /**
   * Order yang perlu perhatian: stuck, overdue, unpaid
   * @returns {Promise<Object>}
   */

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
      _metadata: {
        ...this.#getDateRanges(),
        type: "real-time",
        stuckThreshold: "3 jam",
        overdueThreshold: "1 hari",
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
      prisma.$queryRaw`SELECT p."id", p."sku", p."name", p."stock", p."cost", p."price", COALESCE(SUM(oi."quantity"), 0)::int as sold_90d, ROUND(COALESCE(SUM(oi."quantity"), 0) / 90.0, 1) as avg_daily_sales FROM "Product" p LEFT JOIN "OrderItem" oi ON p."id" = oi."productId" LEFT JOIN "Order" o ON oi."orderId" = o."id" AND o."createdAt" >= ${since90} AND o."status" IN ('COMPLETED','CLOSED') AND o."deletedAt" IS NULL WHERE p."type" = 'SPAREPART' AND p."isActive" = true AND p."stock" <= ${lowThreshold} GROUP BY p."id", p."sku", p."name", p."stock", p."cost", p."price" HAVING COALESCE(SUM(oi."quantity"), 0) > 0 ORDER BY avg_daily_sales DESC LIMIT 20`,
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
      _metadata: { ...this.#getDateRanges(), lowThreshold },
    };
  }

  // ============================================================================
  // P2 - HIGH VALUE
  // ============================================================================

  /**
   * Tren order harian untuk 4 minggu terakhir
   * @returns {Promise<Object>}
   */
  async getAdminOrderTrend() {
    const fourWeeksAgo = new Date(Date.now() - 28 * 86400000);
    const raw =
      await prisma.$queryRaw`SELECT DATE("createdAt") as date, COUNT("id")::int as orders, COALESCE(SUM("total"), 0)::bigint as revenue FROM "Order" WHERE "createdAt" >= ${fourWeeksAgo} AND "deletedAt" IS NULL GROUP BY DATE("createdAt") ORDER BY date ASC`;
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
      _metadata: {
        ...this.#getDateRanges(),
        trendStart: fourWeeksAgo.toISOString().split("T")[0],
      },
    };
  }

  /**
   * Revenue per hari dalam seminggu
   * @returns {Promise<Object>}
   */
  async getAdminRevenueByDayOfWeek() {
    const startYear = this.#getOneYearAgo();
    const raw =
      await prisma.$queryRaw`SELECT EXTRACT(DOW FROM "createdAt")::int as day_of_week, COUNT("id")::int as orders, COALESCE(SUM("total"), 0)::bigint as revenue, ROUND(AVG("total"))::int as avg_order_value FROM "Order" WHERE "createdAt" >= ${startYear} AND "status" IN ('COMPLETED','CLOSED') AND "deletedAt" IS NULL GROUP BY day_of_week ORDER BY day_of_week ASC`;
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
      _metadata: { ...this.#getDateRanges() },
    };
  }

  /**
   * Segmentasi pelanggan
   * @returns {Promise<Object>}
   */
  async getAdminCustomerSegmentation() {
    const dormantDays = 90;
    const dormantDate = new Date(Date.now() - dormantDays * 86400000);
    const raw =
      await prisma.$queryRaw`WITH customer_stats AS (SELECT c."id", c."name", c."phone", COUNT(DISTINCT o."id")::int as total_visits, COALESCE(SUM(o."total"), 0)::bigint as total_spent, MAX(o."createdAt") as last_visit, MIN(o."createdAt") as first_visit FROM "Customer" c LEFT JOIN "Order" o ON c."id" = o."customerId" AND o."status" IN ('COMPLETED','CLOSED') AND o."deletedAt" IS NULL GROUP BY c."id", c."name", c."phone") SELECT COUNT(*)::int as total_customers, COUNT(*) FILTER (WHERE total_visits = 1)::int as new_customers, COUNT(*) FILTER (WHERE total_visits >= 2 AND total_visits <= 5)::int as regular_customers, COUNT(*) FILTER (WHERE total_visits > 5)::int as vip_customers, COUNT(*) FILTER (WHERE total_visits > 0 AND last_visit < ${dormantDate})::int as dormant_customers, COUNT(*) FILTER (WHERE total_visits = 0)::int as no_order_customers, COALESCE(SUM(total_spent), 0)::bigint as total_revenue FROM customer_stats`;
    const topVIP =
      await prisma.$queryRaw`WITH customer_stats AS (SELECT c."id", c."name", c."phone", COUNT(DISTINCT o."id")::int as total_visits, COALESCE(SUM(o."total"), 0)::bigint as total_spent, MAX(o."createdAt") as last_visit FROM "Customer" c INNER JOIN "Order" o ON c."id" = o."customerId" AND o."status" IN ('COMPLETED','CLOSED') AND o."deletedAt" IS NULL GROUP BY c."id", c."name", c."phone" HAVING COUNT(DISTINCT o."id") > 5) SELECT * FROM customer_stats ORDER BY total_spent DESC LIMIT 10`;
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
      _metadata: { ...this.#getDateRanges(), dormantDays },
    };
  }

  // ============================================================================
  // P3 - GROWTH
  // ============================================================================

  /**
   * Service yang paling menguntungkan (profit margin)
   * @returns {Promise<Object>}
   */
  async getAdminMostProfitableServices() {
    const startYear = this.#getOneYearAgo();
    const raw =
      await prisma.$queryRaw`SELECT oi."productNameSnapshot" as name, COUNT(DISTINCT o."id")::int as orders, SUM(oi."quantity")::int as quantity, SUM(oi."subtotal")::bigint as revenue, SUM(oi."unitCostSnapshot" * oi."quantity")::bigint as cost, SUM(oi."subtotal" - (oi."unitCostSnapshot" * oi."quantity"))::bigint as profit, CASE WHEN SUM(oi."subtotal") > 0 THEN ROUND((SUM(oi."subtotal" - (oi."unitCostSnapshot" * oi."quantity"))::float / SUM(oi."subtotal") * 100)::numeric, 1) ELSE 0 END as margin_pct FROM "OrderItem" oi INNER JOIN "Product" p ON oi."productId" = p."id" INNER JOIN "Order" o ON oi."orderId" = o."id" WHERE p."type" = 'SERVICE' AND o."createdAt" >= ${startYear} AND o."status" IN ('COMPLETED','CLOSED') AND o."deletedAt" IS NULL GROUP BY oi."productNameSnapshot" ORDER BY margin_pct DESC LIMIT 15`;
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
      _metadata: { ...this.#getDateRanges() },
    };
  }

  /**
   * Service bundles (kombinasi yang sering dijual bersama)
   * @returns {Promise<Object>}
   */
  async getAdminServiceBundles() {
    const startYear = this.#getOneYearAgo();
    const raw =
      await prisma.$queryRaw`WITH order_services AS (SELECT oi."orderId", oi."productNameSnapshot" as service_name FROM "OrderItem" oi INNER JOIN "Product" p ON oi."productId" = p."id" INNER JOIN "Order" o ON oi."orderId" = o."id" WHERE p."type" = 'SERVICE' AND o."createdAt" >= ${startYear} AND o."status" IN ('COMPLETED','CLOSED') AND o."deletedAt" IS NULL), bundles AS (SELECT os1.service_name as service_a, os2.service_name as service_b, COUNT(DISTINCT os1."orderId")::int as frequency FROM order_services os1 INNER JOIN order_services os2 ON os1."orderId" = os2."orderId" AND os1.service_name < os2.service_name GROUP BY os1.service_name, os2.service_name HAVING COUNT(DISTINCT os1."orderId") >= 2) SELECT * FROM bundles ORDER BY frequency DESC LIMIT 15`;
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
      _metadata: { ...this.#getDateRanges() },
    };
  }

  /**
   * Forecast revenue bulan depan berdasarkan tren 3 bulan terakhir
   * @returns {Promise<Object>}
   */
  async getAdminRevenueForecast() {
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    const raw =
      await prisma.$queryRaw`SELECT DATE_TRUNC('month', "createdAt")::date as month, COALESCE(SUM("total"), 0)::bigint as revenue, COUNT("id")::int as orders FROM "Order" WHERE "createdAt" >= ${threeMonthsAgo} AND "status" IN ('COMPLETED','CLOSED') AND "deletedAt" IS NULL GROUP BY month ORDER BY month ASC`;
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
        nextMonth: { revenue: forecastRevenue, orders: forecastOrders },
        confidence:
          growthRate > 0.5 ? "low" : growthRate > 0.2 ? "medium" : "high",
        basedOnMonths: months.length,
        avgMonthlyRevenue: avgRevenue,
        growthRate: Math.round(growthRate * 100),
      },
      _metadata: {
        ...this.#getDateRanges(),
        forecastBasedOn: threeMonthsAgo.toISOString().split("T")[0],
      },
    };
  }

  // ============================================================================
  // EXISTING METHODS
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
    return {
      outOfStock,
      lowStock,
      overStock,
      lowThreshold,
      _metadata: { ...this.#getDateRanges(), lowThreshold },
    };
  }

  async getAdminRevenueVsTarget() {
    const now = new Date();
    const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startYear = new Date(now.getFullYear(), 0, 1);
    const targets = await this.#getAllTargetSettings();

    const [monthlyRevenue, yearlyRevenue] = await Promise.all([
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
    ]);

    const monthlyRev = Number(monthlyRevenue._sum.total || 0);
    const yearlyRev = Number(yearlyRevenue._sum.total || 0);
    const monthlyTarget = targets.monthlyRevenue;
    const yearlyTarget = targets.yearlyRevenue;

    return {
      monthly: {
        current: monthlyRev,
        target: monthlyTarget,
        percentage:
          monthlyTarget > 0
            ? Math.round((monthlyRev / monthlyTarget) * 100)
            : 0,
        remaining: Math.max(monthlyTarget - monthlyRev, 0),
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
      allTargets: targets,
      _metadata: { ...this.#getDateRanges() },
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
      _metadata: { ...this.#getDateRanges() },
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
      _metadata: { ...this.#getDateRanges() },
    };
  }

  async getAdminMechanicAvailability() {
    const maxTasks = parseInt(
      await this.#getSetting("mechanic_max_tasks", "5"),
      10
    );
    const raw =
      await prisma.$queryRaw`SELECT u."id", u."fullName", COUNT(ma."id")::int as active_jobs FROM "User" u LEFT JOIN "MechanicAssignment" ma ON u."id" = ma."mechanicId" AND ma."endAt" IS NULL AND EXISTS (SELECT 1 FROM "OrderItem" oi INNER JOIN "Order" o ON oi."orderId" = o."id" WHERE oi."id" = ma."orderItemId" AND o."status" IN ('QUEUED','IN_PROGRESS') AND o."deletedAt" IS NULL) WHERE u."role" = 'MECHANIC' AND u."isActive" = true GROUP BY u."id", u."fullName" ORDER BY active_jobs ASC`;
    return {
      mechanics: raw.map((r) => ({
        mechanicId: r.id,
        mechanicName: r.fullName,
        activeJobs: Number(r.active_jobs),
        maxTasks,
        available: Math.max(0, maxTasks - Number(r.active_jobs)),
        utilizationPct:
          maxTasks > 0
            ? Math.round((Number(r.active_jobs) / maxTasks) * 100)
            : 0,
      })),
      _metadata: { ...this.#getDateRanges(), type: "real-time", maxTasks },
    };
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
      _metadata: { ...this.#getDateRanges() },
    };
  }

  async getAdminPaymentMethodDistribution() {
    const startMonth = this.#getStartOfMonth();
    const startYear = this.#getOneYearAgo();
    const [monthly, yearly] = await Promise.all([
      prisma.$queryRaw`SELECT p."method", COUNT(p."id")::int as count, COALESCE(SUM(p."amountPaid"), 0)::bigint as total FROM "Payment" p INNER JOIN "Order" o ON p."orderId" = o."id" WHERE p."status" = 'PAID' AND p."paidAt" >= ${startMonth} AND o."deletedAt" IS NULL GROUP BY p."method" ORDER BY count DESC`,
      prisma.$queryRaw`SELECT p."method", COUNT(p."id")::int as count, COALESCE(SUM(p."amountPaid"), 0)::bigint as total FROM "Payment" p INNER JOIN "Order" o ON p."orderId" = o."id" WHERE p."status" = 'PAID' AND p."paidAt" >= ${startYear} AND o."deletedAt" IS NULL GROUP BY p."method" ORDER BY count DESC`,
    ]);
    const formatDistribution = (rawData) => {
      const total = rawData.reduce((s, r) => s + Number(r.count), 0);
      return rawData.map((r) => ({
        method: r.method,
        count: Number(r.count),
        total: Number(r.total),
        pct: total ? Math.round((Number(r.count) / total) * 10000) / 100 : 0,
      }));
    };
    return {
      monthly: formatDistribution(monthly),
      yearly: formatDistribution(yearly),
      _metadata: { ...this.#getDateRanges() },
    };
  }

  // ============================================================================
// ADDITIONAL MECHANIC FUNCTIONS
// ============================================================================

/**
 * Riwayat assignment mekanik per hari (calendar view)
 * @param {string} mechanicId
 * @param {Date} [startDate]
 * @param {Date} [endDate]
 * @returns {Promise<Object>}
 */
async getMechanicDailyCalendar(mechanicId, startDate = null, endDate = null) {
  const start = startDate || this.#getStartOfMonth();
  const end = endDate || new Date();
  end.setHours(23, 59, 59, 999);

  const assignments = await prisma.mechanicAssignment.findMany({
    where: {
      mechanicId,
      createdAt: { gte: start, lte: end },
    },
    select: {
      id: true,
      startAt: true,
      endAt: true,
      createdAt: true,
      orderItem: {
        select: {
          productNameSnapshot: true,
          quantity: true,
          order: {
            select: {
              orderNumber: true,
              status: true,
              vehicle: { select: { plateNumber: true } },
              customer: { select: { name: true } },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const calendarMap = {};
  for (const a of assignments) {
    const dateKey = a.createdAt.toISOString().split("T")[0];
    if (!calendarMap[dateKey]) {
      calendarMap[dateKey] = [];
    }
    calendarMap[dateKey].push({
      assignmentId: a.id,
      orderNumber: a.orderItem.order.orderNumber,
      service: a.orderItem.productNameSnapshot,
      quantity: a.orderItem.quantity,
      status: a.orderItem.order.status,
      plateNumber: a.orderItem.order.vehicle?.plateNumber || "-",
      customer: a.orderItem.order.customer?.name || "Umum",
      startAt: a.startAt,
      endAt: a.endAt,
      durationMinutes:
        a.startAt && a.endAt
          ? Math.round((new Date(a.endAt) - new Date(a.startAt)) / 60000)
          : null,
    });
  }

  const dailySummaries = Object.entries(calendarMap).map(([date, jobs]) => ({
    date,
    totalJobs: jobs.length,
    completedJobs: jobs.filter((j) => j.endAt).length,
    pendingJobs: jobs.filter((j) => !j.endAt).length,
    totalDurationMinutes: jobs.reduce(
      (sum, j) => sum + (j.durationMinutes || 0),
      0
    ),
    jobs,
  }));

  return {
    daily: dailySummaries.sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    ),
    summary: {
      totalDays: dailySummaries.length,
      totalAssignments: assignments.length,
      avgJobsPerDay:
        dailySummaries.length > 0
          ? Math.round(assignments.length / dailySummaries.length)
          : 0,
    },
    _metadata: {
      ...this.#getDateRanges(),
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    },
  };
}

/**
 * Workload distribution mekanik (per jam kerja)
 * @param {string} mechanicId
 * @returns {Promise<Object>}
 */
async getMechanicWorkloadDistribution(mechanicId) {
  const startMonth = this.#getStartOfMonth();

  const hourlyRaw = await prisma.$queryRaw`
    SELECT 
      EXTRACT(HOUR FROM ma."startAt")::int as hour,
      COUNT(ma."id")::int as jobs_started,
      COUNT(CASE WHEN ma."endAt" IS NOT NULL THEN 1 END)::int as jobs_completed
    FROM "MechanicAssignment" ma
    WHERE ma."mechanicId" = ${mechanicId}
      AND ma."createdAt" >= ${startMonth}
    GROUP BY hour
    ORDER BY hour ASC
  `;

  const hourlyDistribution = Array.from({ length: 24 }, (_, i) => {
    const found = hourlyRaw.find((r) => Number(r.hour) === i);
    return {
      hour: i,
      hourFormatted: `${String(i).padStart(2, "0")}:00`,
      jobsStarted: found ? Number(found.jobs_started) : 0,
      jobsCompleted: found ? Number(found.jobs_completed) : 0,
    };
  });

  const peakHour = [...hourlyDistribution].sort(
    (a, b) => b.jobsStarted - a.jobsStarted
  )[0];

  return {
    hourlyDistribution,
    peakHour: peakHour
      ? { hour: peakHour.hourFormatted, jobs: peakHour.jobsStarted }
      : null,
    _metadata: {
      ...this.#getDateRanges(),
      period: "Bulan ini",
      totalHours: 24,
    },
  };
}

/**
 * Service types yang sering dikerjakan mekanik
 * @param {string} mechanicId
 * @returns {Promise<Object>}
 */
async getMechanicServiceBreakdown(mechanicId) {
  const startMonth = this.#getStartOfMonth();
  const startYear = this.#getOneYearAgo();

  const [monthly, yearly] = await Promise.all([
    prisma.$queryRaw`
      SELECT 
        oi."productNameSnapshot" as service_name,
        COUNT(ma."id")::int as times_assigned,
        ROUND(AVG(
          CASE WHEN ma."endAt" IS NOT NULL AND ma."startAt" IS NOT NULL 
          THEN EXTRACT(EPOCH FROM (ma."endAt" - ma."startAt")) / 60 
          ELSE NULL END
        ))::int as avg_minutes
      FROM "MechanicAssignment" ma
      INNER JOIN "OrderItem" oi ON ma."orderItemId" = oi."id"
      INNER JOIN "Order" o ON oi."orderId" = o."id"
      WHERE ma."mechanicId" = ${mechanicId}
        AND ma."createdAt" >= ${startMonth}
        AND o."deletedAt" IS NULL
      GROUP BY oi."productNameSnapshot"
      ORDER BY times_assigned DESC
      LIMIT 10
    `,
    prisma.$queryRaw`
      SELECT 
        oi."productNameSnapshot" as service_name,
        COUNT(ma."id")::int as times_assigned,
        ROUND(AVG(
          CASE WHEN ma."endAt" IS NOT NULL AND ma."startAt" IS NOT NULL 
          THEN EXTRACT(EPOCH FROM (ma."endAt" - ma."startAt")) / 60 
          ELSE NULL END
        ))::int as avg_minutes
      FROM "MechanicAssignment" ma
      INNER JOIN "OrderItem" oi ON ma."orderItemId" = oi."id"
      INNER JOIN "Order" o ON oi."orderId" = o."id"
      WHERE ma."mechanicId" = ${mechanicId}
        AND ma."createdAt" >= ${startYear}
        AND o."deletedAt" IS NULL
      GROUP BY oi."productNameSnapshot"
      ORDER BY times_assigned DESC
      LIMIT 10
    `,
  ]);

  return {
    monthly: monthly.map((r) => ({
      serviceName: r.service_name,
      timesAssigned: Number(r.times_assigned),
      avgMinutes: Number(r.avg_minutes) || 0,
    })),
    yearly: yearly.map((r) => ({
      serviceName: r.service_name,
      timesAssigned: Number(r.times_assigned),
      avgMinutes: Number(r.avg_minutes) || 0,
    })),
    _metadata: {
      ...this.#getDateRanges(),
      periods: {
        monthly: { start: startMonth.toISOString() },
        yearly: { start: startYear.toISOString() },
      },
    },
  };
}

// ============================================================================
// ADDITIONAL CASHIER FUNCTIONS
// ============================================================================

/**
 * Breakdown penjualan kasir per jam
 * @param {string} cashierId
 * @returns {Promise<Object>}
 */
async getCashierHourlySalesBreakdown(cashierId) {
  const startDay = this.#getStartOfDay();
  const endDay = new Date();
  endDay.setHours(23, 59, 59, 999);

  const hourlyRaw = await prisma.$queryRaw`
    SELECT 
      EXTRACT(HOUR FROM o."createdAt")::int as hour,
      COUNT(o."id")::int as orders,
      COALESCE(SUM(o."total"), 0)::bigint as revenue,
      COALESCE(SUM(CASE WHEN p."method" = 'CASH' THEN p."amountPaid" ELSE 0 END), 0)::bigint as cash,
      COALESCE(SUM(CASE WHEN p."method" = 'QRIS' THEN p."amountPaid" ELSE 0 END), 0)::bigint as qris
    FROM "Order" o
    LEFT JOIN "Payment" p ON o."id" = p."orderId"
    WHERE o."cashierId" = ${cashierId}
      AND o."createdAt" >= ${startDay}
      AND o."createdAt" <= ${endDay}
      AND o."deletedAt" IS NULL
    GROUP BY hour
    ORDER BY hour ASC
  `;

  const hourlyDistribution = Array.from({ length: 24 }, (_, i) => {
    const found = hourlyRaw.find((r) => Number(r.hour) === i);
    return {
      hour: i,
      hourFormatted: `${String(i).padStart(2, "0")}:00`,
      orders: found ? Number(found.orders) : 0,
      revenue: found ? Number(found.revenue) : 0,
      cash: found ? Number(found.cash) : 0,
      qris: found ? Number(found.qris) : 0,
    };
  });

  const peakHour = [...hourlyDistribution].sort(
    (a, b) => b.revenue - a.revenue
  )[0];

  return {
    hourlyDistribution,
    peakHour: peakHour
      ? {
          hour: peakHour.hourFormatted,
          revenue: peakHour.revenue,
          orders: peakHour.orders,
        }
      : null,
    summary: {
      totalHours: 24,
      totalRevenue: hourlyDistribution.reduce((s, h) => s + h.revenue, 0),
      totalOrders: hourlyDistribution.reduce((s, h) => s + h.orders, 0),
    },
    _metadata: { ...this.#getDateRanges(), type: "daily" },
  };
}

/**
 * Performance metrics kasir (Key Performance Indicators)
 * @param {string} cashierId
 * @returns {Promise<Object>}
 */
async getCashierKPIMetrics(cashierId) {
  const startMonth = this.#getStartOfMonth();
  const startYear = this.#getOneYearAgo();

  const [monthlyOrders, monthlyShifts, yearlyOrders, yearlyShifts, avgOrderProcessing] = await Promise.all([
    prisma.order.aggregate({
      where: {
        cashierId,
        createdAt: { gte: startMonth },
        status: { in: ["COMPLETED", "CLOSED"] },
        deletedAt: null,
      },
      _sum: { total: true },
      _count: true,
      _avg: { total: true },
    }),
    prisma.shift.aggregate({
      where: {
        cashierId,
        openedAt: { gte: startMonth },
      },
      _sum: { cashSales: true },
      _count: true,
      _avg: { discrepancy: true },
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
      _avg: { total: true },
    }),
    prisma.shift.aggregate({
      where: {
        cashierId,
        openedAt: { gte: startYear },
      },
      _sum: { cashSales: true },
      _count: true,
      _avg: { discrepancy: true },
    }),
    prisma.$queryRaw`
      SELECT ROUND(AVG(EXTRACT(EPOCH FROM (o."completedAt" - o."createdAt")) / 60))::int as avg_minutes
      FROM "Order" o
      WHERE o."cashierId" = ${cashierId}
        AND o."completedAt" IS NOT NULL
        AND o."createdAt" >= ${startMonth}
        AND o."deletedAt" IS NULL
    `,
  ]);

  const monthlyRev = Number(monthlyOrders._sum.total || 0);
  const monthlyShiftCount = monthlyShifts._count;
  const avgShiftRevenue = monthlyShiftCount > 0 ? Math.round(monthlyRev / monthlyShiftCount) : 0;

  return {
    monthly: {
      totalRevenue: monthlyRev,
      totalOrders: monthlyOrders._count,
      avgOrderValue: Math.round(monthlyOrders._avg.total || 0),
      totalShifts: monthlyShiftCount,
      avgDiscrepancy: Math.round(monthlyShifts._avg.discrepancy || 0),
      avgShiftRevenue,
      revenuePerShift: avgShiftRevenue,
    },
    yearly: {
      totalRevenue: Number(yearlyOrders._sum.total || 0),
      totalOrders: yearlyOrders._count,
      avgOrderValue: Math.round(yearlyOrders._avg.total || 0),
      totalShifts: yearlyShifts._count,
      avgDiscrepancy: Math.round(yearlyShifts._avg.discrepancy || 0),
    },
    operational: {
      avgOrderProcessingMinutes: Number(avgOrderProcessing[0]?.avg_minutes || 0),
      discrepancyScore:
        Math.round(monthlyShifts._avg.discrepancy || 0) < 10000
          ? "excellent"
          : Math.round(monthlyShifts._avg.discrepancy || 0) < 50000
          ? "good"
          : "needs_improvement",
    },
    _metadata: {
      ...this.#getDateRanges(),
      periods: {
        monthly: { start: startMonth.toISOString() },
        yearly: { start: startYear.toISOString() },
      },
    },
  };
}

/**
 * Ringkasan customer yang dilayani kasir
 * @param {string} cashierId
 * @returns {Promise<Object>}
 */
async getCashierCustomerSummary(cashierId) {
  const startDay = this.#getStartOfDay();
  const startMonth = this.#getStartOfMonth();

  const [todayCustomers, monthlyCustomers, returningToday, topCustomerToday] = await Promise.all([
    prisma.$queryRaw`
      SELECT COUNT(DISTINCT o."customerId")::int as count
      FROM "Order" o
      WHERE o."cashierId" = ${cashierId}
        AND o."createdAt" >= ${startDay}
        AND o."deletedAt" IS NULL
        AND o."customerId" IS NOT NULL
    `,
    prisma.$queryRaw`
      SELECT COUNT(DISTINCT o."customerId")::int as count
      FROM "Order" o
      WHERE o."cashierId" = ${cashierId}
        AND o."createdAt" >= ${startMonth}
        AND o."deletedAt" IS NULL
        AND o."customerId" IS NOT NULL
    `,
    prisma.$queryRaw`
      WITH today_customers AS (
        SELECT DISTINCT o."customerId"
        FROM "Order" o
        WHERE o."cashierId" = ${cashierId}
          AND o."createdAt" >= ${startDay}
          AND o."deletedAt" IS NULL
          AND o."customerId" IS NOT NULL
      )
      SELECT COUNT(*)::int as count
      FROM today_customers tc
      WHERE EXISTS (
        SELECT 1 FROM "Order" o2
        WHERE o2."customerId" = tc."customerId"
          AND o2."cashierId" = ${cashierId}
          AND o2."createdAt" < ${startDay}
          AND o2."deletedAt" IS NULL
      )
    `,
    prisma.$queryRaw`
      SELECT c."name", c."phone", COUNT(o."id")::int as visits, COALESCE(SUM(o."total"), 0)::bigint as total_spent
      FROM "Order" o
      INNER JOIN "Customer" c ON o."customerId" = c."id"
      WHERE o."cashierId" = ${cashierId}
        AND o."createdAt" >= ${startDay}
        AND o."deletedAt" IS NULL
      GROUP BY c."id", c."name", c."phone"
      ORDER BY total_spent DESC
      LIMIT 1
    `,
  ]);

  return {
    today: {
      total: Number(todayCustomers[0].count),
      returning: Number(returningToday[0].count),
      new: Number(todayCustomers[0].count) - Number(returningToday[0].count),
      topCustomer: topCustomerToday[0]
        ? {
            name: topCustomerToday[0].name,
            phone: topCustomerToday[0].phone,
            visits: Number(topCustomerToday[0].visits),
            totalSpent: Number(topCustomerToday[0].total_spent),
          }
        : null,
    },
    monthly: {
      total: Number(monthlyCustomers[0].count),
    },
    _metadata: { ...this.#getDateRanges() },
  };
}

/**
 * Ringkasan shift terakhir kasir
 * @param {string} cashierId
 * @returns {Promise<Object>}
 */
async getCashierLastShiftSummary(cashierId) {
  const lastShift = await prisma.shift.findFirst({
    where: { cashierId, status: "CLOSED" },
    select: {
      id: true,
      openedAt: true,
      closedAt: true,
      startingCash: true,
      endingCash: true,
      expectedCash: true,
      cashSales: true,
      cashIn: true,
      cashOut: true,
      discrepancy: true,
      _count: { select: { orders: true, expenses: true } },
    },
    orderBy: { closedAt: "desc" },
  });

  if (!lastShift) {
    return {
      shift: null,
      message: "Belum ada shift yang ditutup",
      _metadata: { ...this.#getDateRanges() },
    };
  }

  const [payments, topOrder, expenses] = await Promise.all([
    prisma.payment.groupBy({
      by: ["method"],
      where: {
        order: {
          shiftId: lastShift.id,
          deletedAt: null,
        },
        status: "PAID",
      },
      _sum: { amountPaid: true },
      _count: { method: true },
    }),
    prisma.order.findFirst({
      where: {
        shiftId: lastShift.id,
        deletedAt: null,
        status: { in: ["COMPLETED", "CLOSED"] },
      },
      select: {
        orderNumber: true,
        total: true,
        customer: { select: { name: true } },
        payment: { select: { method: true } },
      },
      orderBy: { total: "desc" },
    }),
    prisma.expense.groupBy({
      by: ["category"],
      where: { shiftId: lastShift.id },
      _sum: { amount: true },
      orderBy: { _sum: { amount: "desc" } },
    }),
  ]);

  const cashPayments = payments.find((p) => p.method === "CASH");
  const qrisPayments = payments.find((p) => p.method === "QRIS");

  return {
    shift: {
      id: lastShift.id,
      openedAt: lastShift.openedAt,
      closedAt: lastShift.closedAt,
      durationHours: lastShift.closedAt
        ? Math.round(
            (new Date(lastShift.closedAt) - new Date(lastShift.openedAt)) /
              3600000
          )
        : 0,
      startingCash: lastShift.startingCash,
      endingCash: lastShift.endingCash,
      expectedCash: lastShift.expectedCash,
      cashSales: lastShift.cashSales,
      cashIn: lastShift.cashIn,
      cashOut: lastShift.cashOut,
      discrepancy: lastShift.discrepancy,
      orderCount: lastShift._count.orders,
      expenseCount: lastShift._count.expenses,
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
    topOrder: topOrder
      ? {
          orderNumber: topOrder.orderNumber,
          total: topOrder.total,
          customer: topOrder.customer?.name || "Umum",
          method: topOrder.payment?.method || null,
        }
      : null,
    expensesByCategory: expenses.map((e) => ({
      category: e.category,
      total: Number(e._sum.amount),
    })),
    _metadata: {
      ...this.#getDateRanges(),
      shiftId: lastShift.id,
      closedAt: lastShift.closedAt,
    },
  };
}

// ============================================================================
// ADDITIONAL ADMIN - FINANCIAL
// ============================================================================

/**
 * Laporan profit & loss bulanan
 * @returns {Promise<Object>}
 */
async getAdminProfitLossStatement() {
  const startMonth = this.#getStartOfMonth();
  const startYear = this.#getOneYearAgo();

  const [monthlyRevenue, yearlyRevenue, monthlyExpenses, yearlyExpenses, monthlyCOGS, yearlyCOGS] =
    await Promise.all([
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
      prisma.$queryRaw`
        SELECT COALESCE(SUM(oi."unitCostSnapshot" * oi."quantity"), 0)::bigint as cogs
        FROM "OrderItem" oi
        INNER JOIN "Order" o ON oi."orderId" = o."id"
        WHERE o."createdAt" >= ${startMonth}
          AND o."status" IN ('COMPLETED','CLOSED')
          AND o."deletedAt" IS NULL
      `,
      prisma.$queryRaw`
        SELECT COALESCE(SUM(oi."unitCostSnapshot" * oi."quantity"), 0)::bigint as cogs
        FROM "OrderItem" oi
        INNER JOIN "Order" o ON oi."orderId" = o."id"
        WHERE o."createdAt" >= ${startYear}
          AND o."status" IN ('COMPLETED','CLOSED')
          AND o."deletedAt" IS NULL
      `,
    ]);

  const mRev = Number(monthlyRevenue._sum.total || 0);
  const mCOGS = Number(monthlyCOGS[0].cogs);
  const mExp = Number(monthlyExpenses._sum.amount || 0);
  const mGross = mRev - mCOGS;
  const mNet = mGross - mExp;

  const yRev = Number(yearlyRevenue._sum.total || 0);
  const yCOGS = Number(yearlyCOGS[0].cogs);
  const yExp = Number(yearlyExpenses._sum.amount || 0);
  const yGross = yRev - yCOGS;
  const yNet = yGross - yExp;

  return {
    monthly: {
      revenue: mRev,
      cogs: mCOGS,
      grossProfit: mGross,
      grossMargin: mRev > 0 ? Math.round((mGross / mRev) * 10000) / 100 : 0,
      expenses: mExp,
      netProfit: mNet,
      netMargin: mRev > 0 ? Math.round((mNet / mRev) * 10000) / 100 : 0,
      orderCount: monthlyRevenue._count,
      expenseCount: monthlyExpenses._count,
    },
    yearly: {
      revenue: yRev,
      cogs: yCOGS,
      grossProfit: yGross,
      grossMargin: yRev > 0 ? Math.round((yGross / yRev) * 10000) / 100 : 0,
      expenses: yExp,
      netProfit: yNet,
      netMargin: yRev > 0 ? Math.round((yNet / yRev) * 10000) / 100 : 0,
      orderCount: yearlyRevenue._count,
      expenseCount: yearlyExpenses._count,
    },
    _metadata: {
      ...this.#getDateRanges(),
      periods: {
        monthly: { start: startMonth.toISOString() },
        yearly: { start: startYear.toISOString() },
      },
    },
  };
}

/**
 * Revenue per kategori sparepart
 * @returns {Promise<Object>}
 */
async getAdminRevenueByProductCategory() {
  const startMonth = this.#getStartOfMonth();
  const startYear = this.#getOneYearAgo();

  const [monthly, yearly] = await Promise.all([
    prisma.$queryRaw`
      SELECT 
        p."type" as product_type,
        COUNT(DISTINCT o."id")::int as orders,
        SUM(oi."quantity")::int as quantity_sold,
        SUM(oi."subtotal")::bigint as revenue,
        SUM(oi."subtotal" - (oi."unitCostSnapshot" * oi."quantity"))::bigint as profit
      FROM "OrderItem" oi
      INNER JOIN "Product" p ON oi."productId" = p."id"
      INNER JOIN "Order" o ON oi."orderId" = o."id"
      WHERE o."createdAt" >= ${startMonth}
        AND o."status" IN ('COMPLETED','CLOSED')
        AND o."deletedAt" IS NULL
      GROUP BY p."type"
      ORDER BY revenue DESC
    `,
    prisma.$queryRaw`
      SELECT 
        p."type" as product_type,
        COUNT(DISTINCT o."id")::int as orders,
        SUM(oi."quantity")::int as quantity_sold,
        SUM(oi."subtotal")::bigint as revenue,
        SUM(oi."subtotal" - (oi."unitCostSnapshot" * oi."quantity"))::bigint as profit
      FROM "OrderItem" oi
      INNER JOIN "Product" p ON oi."productId" = p."id"
      INNER JOIN "Order" o ON oi."orderId" = o."id"
      WHERE o."createdAt" >= ${startYear}
        AND o."status" IN ('COMPLETED','CLOSED')
        AND o."deletedAt" IS NULL
      GROUP BY p."type"
      ORDER BY revenue DESC
    `,
  ]);

  return {
    monthly: monthly.map((r) => ({
      type: r.product_type,
      orders: Number(r.orders),
      quantitySold: Number(r.quantity_sold),
      revenue: Number(r.revenue),
      profit: Number(r.profit),
    })),
    yearly: yearly.map((r) => ({
      type: r.product_type,
      orders: Number(r.orders),
      quantitySold: Number(r.quantity_sold),
      revenue: Number(r.revenue),
      profit: Number(r.profit),
    })),
    _metadata: {
      ...this.#getDateRanges(),
      periods: {
        monthly: { start: startMonth.toISOString() },
        yearly: { start: startYear.toISOString() },
      },
    },
  };
}

/**
 * Daily cash flow (arus kas harian)
 * @returns {Promise<Object>}
 */
async getAdminDailyCashFlow(days = 30) {
  const sinceDate = new Date(Date.now() - days * 86400000);

  const [dailyRevenue, dailyExpenses] = await Promise.all([
    prisma.$queryRaw`
      SELECT 
        DATE(o."createdAt") as date,
        COALESCE(SUM(CASE WHEN p."method" = 'CASH' THEN p."amountPaid" ELSE 0 END), 0)::bigint as cash_in,
        COALESCE(SUM(CASE WHEN p."method" = 'QRIS' THEN p."amountPaid" ELSE 0 END), 0)::bigint as qris_in,
        COALESCE(SUM(o."total"), 0)::bigint as total_revenue,
        COUNT(o."id")::int as order_count
      FROM "Order" o
      LEFT JOIN "Payment" p ON o."id" = p."orderId" AND p."status" = 'PAID'
      WHERE o."createdAt" >= ${sinceDate}
        AND o."status" IN ('COMPLETED','CLOSED')
        AND o."deletedAt" IS NULL
      GROUP BY DATE(o."createdAt")
      ORDER BY date ASC
    `,
    prisma.$queryRaw`
      SELECT 
        DATE(e."date") as date,
        COALESCE(SUM(e."amount"), 0)::bigint as total_expenses,
        COUNT(e."id")::int as expense_count
      FROM "Expense" e
      WHERE e."date" >= ${sinceDate}
      GROUP BY DATE(e."date")
      ORDER BY date ASC
    `,
  ]);

  const expenseMap = {};
  for (const e of dailyExpenses) {
    expenseMap[e.date] = {
      totalExpenses: Number(e.total_expenses),
      expenseCount: Number(e.expense_count),
    };
  }

  const daily = dailyRevenue.map((r) => {
    const exp = expenseMap[r.date] || { totalExpenses: 0, expenseCount: 0 };
    const netCash = Number(r.cash_in) + Number(r.qris_in) - exp.totalExpenses;
    return {
      date: r.date,
      cashIn: Number(r.cash_in),
      qrisIn: Number(r.qris_in),
      totalRevenue: Number(r.total_revenue),
      orderCount: Number(r.order_count),
      expenses: exp.totalExpenses,
      expenseCount: exp.expenseCount,
      netCashFlow: netCash,
    };
  });

  const totalInflow = daily.reduce((s, d) => s + d.totalRevenue, 0);
  const totalOutflow = daily.reduce((s, d) => s + d.expenses, 0);

  return {
    daily,
    summary: {
      totalDays: daily.length,
      totalInflow,
      totalOutflow,
      netCashFlow: totalInflow - totalOutflow,
      avgDailyInflow: daily.length > 0 ? Math.round(totalInflow / daily.length) : 0,
      avgDailyOutflow: daily.length > 0 ? Math.round(totalOutflow / daily.length) : 0,
    },
    _metadata: {
      ...this.#getDateRanges(),
      sinceDate: sinceDate.toISOString().split("T")[0],
      days,
    },
  };
}

// ============================================================================
// ADDITIONAL ADMIN - OPERATIONS
// ============================================================================

/**
 * Status order real-time dashboard
 * @returns {Promise<Object>}
 */
async getAdminOrderStatusOverview() {
  const [statusCounts, recentStatusChanges] = await Promise.all([
    prisma.order.groupBy({
      by: ["status"],
      where: { deletedAt: null },
      _count: { id: true },
      _sum: { total: true },
    }),
    prisma.orderStatusHistory.findMany({
      select: {
        order: { select: { orderNumber: true } },
        status: true,
        note: true,
        changedBy: { select: { fullName: true } },
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  const statusMap = {};
  let totalOrders = 0;
  let totalValue = 0;
  for (const s of statusCounts) {
    statusMap[s.status] = {
      count: s._count.id,
      value: Number(s._sum.total || 0),
    };
    totalOrders += s._count.id;
    totalValue += Number(s._sum.total || 0);
  }

  return {
    byStatus: {
      DRAFT: statusMap.DRAFT || { count: 0, value: 0 },
      QUEUED: statusMap.QUEUED || { count: 0, value: 0 },
      IN_PROGRESS: statusMap.IN_PROGRESS || { count: 0, value: 0 },
      COMPLETED: statusMap.COMPLETED || { count: 0, value: 0 },
      CLOSED: statusMap.CLOSED || { count: 0, value: 0 },
      CANCELLED: statusMap.CANCELLED || { count: 0, value: 0 },
    },
    summary: {
      totalOrders,
      totalValue,
      activeOrders:
        (statusMap.DRAFT?.count || 0) +
        (statusMap.QUEUED?.count || 0) +
        (statusMap.IN_PROGRESS?.count || 0),
      completionRate:
        totalOrders > 0
          ? Math.round(
              (((statusMap.COMPLETED?.count || 0) +
                (statusMap.CLOSED?.count || 0)) /
                totalOrders) *
                10000
            ) / 100
          : 0,
    },
    recentStatusChanges: recentStatusChanges.map((h) => ({
      orderNumber: h.order.orderNumber,
      status: h.status,
      note: h.note,
      changedBy: h.changedBy?.fullName || "System",
      createdAt: h.createdAt,
    })),
    _metadata: { ...this.#getDateRanges(), type: "real-time" },
  };
}

/**
 * Vehicle service history (per kendaraan)
 * @param {string} plateNumber
 * @returns {Promise<Object>}
 */
async getVehicleServiceHistory(plateNumber) {
  const vehicle = await prisma.vehicle.findUnique({
    where: { plateNumber },
    select: {
      id: true,
      plateNumber: true,
      brand: true,
      model: true,
      customer: { select: { name: true, phone: true } },
    },
  });

  if (!vehicle) {
    return {
      vehicle: null,
      history: [],
      summary: { totalOrders: 0, totalSpent: 0 },
      _metadata: { ...this.#getDateRanges() },
    };
  }

  const orders = await prisma.order.findMany({
    where: {
      vehicleId: vehicle.id,
      deletedAt: null,
      status: { in: ["COMPLETED", "CLOSED"] },
    },
    select: {
      orderNumber: true,
      total: true,
      status: true,
      createdAt: true,
      completedAt: true,
      items: {
        select: {
          productNameSnapshot: true,
          quantity: true,
          unitPrice: true,
          subtotal: true,
        },
      },
      payment: { select: { method: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return {
    vehicle: {
      plateNumber: vehicle.plateNumber,
      brand: vehicle.brand,
      model: vehicle.model,
      customerName: vehicle.customer?.name || "Umum",
      customerPhone: vehicle.customer?.phone || "-",
    },
    history: orders.map((o) => ({
      orderNumber: o.orderNumber,
      total: o.total,
      status: o.status,
      items: o.items.map((i) => ({
        product: i.productNameSnapshot,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        subtotal: i.subtotal,
      })),
      paymentMethod: o.payment?.method || null,
      createdAt: o.createdAt,
      completedAt: o.completedAt,
    })),
    summary: {
      totalOrders: orders.length,
      totalSpent: orders.reduce((sum, o) => sum + o.total, 0),
      avgPerVisit:
        orders.length > 0
          ? Math.round(orders.reduce((sum, o) => sum + o.total, 0) / orders.length)
          : 0,
      lastVisit: orders[0]?.createdAt || null,
      firstVisit: orders[orders.length - 1]?.createdAt || null,
    },
    _metadata: { ...this.#getDateRanges() },
  };
}

/**
 * Notifications summary (unread + recent)
 * @param {string} userId
 * @returns {Promise<Object>}
 */
async getUserNotificationsSummary(userId) {
  const [unread, recent, count] = await Promise.all([
    prisma.notification.findMany({
      where: { userId, isRead: false },
      select: {
        id: true,
        title: true,
        message: true,
        type: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.notification.findMany({
      where: { userId },
      select: {
        id: true,
        title: true,
        message: true,
        type: true,
        isRead: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.notification.count({
      where: { userId, isRead: false },
    }),
  ]);

  return {
    unreadCount: count,
    unread: unread,
    recent: recent,
    summary: {
      totalUnread: count,
      infoCount: unread.filter((n) => n.type === "INFO").length,
      warningCount: unread.filter((n) => n.type === "WARNING").length,
      errorCount: unread.filter((n) => n.type === "ERROR").length,
    },
    _metadata: { ...this.#getDateRanges(), type: "real-time" },
  };
}

/**
 * Daily operational checklist
 * @returns {Promise<Object>}
 */
async getAdminDailyChecklist() {
  const startDay = this.#getStartOfDay();
  const endDay = new Date();
  endDay.setHours(23, 59, 59, 999);

  const [
    openShifts,
    activeMechanics,
    pendingOrders,
    unpaidCompleted,
    stockAlerts,
    todayRevenue,
  ] = await Promise.all([
    prisma.shift.findMany({
      where: { status: "OPEN" },
      select: {
        id: true,
        cashier: { select: { fullName: true } },
        openedAt: true,
        startingCash: true,
        cashSales: true,
      },
    }),
    prisma.$queryRaw`
      SELECT u."fullName", COUNT(ma."id")::int as active_jobs
      FROM "User" u
      LEFT JOIN "MechanicAssignment" ma ON u."id" = ma."mechanicId"
        AND ma."endAt" IS NULL
        AND EXISTS (
          SELECT 1 FROM "OrderItem" oi
          INNER JOIN "Order" o ON oi."orderId" = o."id"
          WHERE oi."id" = ma."orderItemId"
            AND o."status" IN ('QUEUED','IN_PROGRESS')
            AND o."deletedAt" IS NULL
        )
      WHERE u."role" = 'MECHANIC' AND u."isActive" = true
      GROUP BY u."id", u."fullName"
    `,
    prisma.order.count({
      where: {
        status: { in: ["QUEUED", "IN_PROGRESS"] },
        deletedAt: null,
      },
    }),
    prisma.order.count({
      where: {
        status: "COMPLETED",
        deletedAt: null,
        payment: { is: null },
      },
    }),
    prisma.product.count({
      where: {
        type: "SPAREPART",
        isActive: true,
        stock: {
          lte: parseInt(await this.#getSetting("stock_low_threshold", "5"), 10),
        },
      },
    }),
    prisma.order.aggregate({
      where: {
        createdAt: { gte: startDay, lte: endDay },
        status: { in: ["COMPLETED", "CLOSED"] },
        deletedAt: null,
      },
      _sum: { total: true },
      _count: true,
    }),
  ]);

  const checklistItems = [
    {
      id: "shifts",
      label: "Buka Shift Kasir",
      status: openShifts.length > 0 ? "completed" : "pending",
      detail: openShifts.length > 0 
        ? `${openShifts.length} shift aktif` 
        : "Belum ada shift dibuka",
      data: openShifts.map((s) => ({
        cashier: s.cashier.fullName,
        openedAt: s.openedAt,
        startingCash: s.startingCash,
        currentSales: s.cashSales,
      })),
    },
    {
      id: "mechanics",
      label: "Mekanik Aktif",
      status: activeMechanics.length > 0 ? "completed" : "warning",
      detail: `${activeMechanics.length} mekanik aktif`,
      data: activeMechanics.map((m) => ({
        name: m.fullName,
        activeJobs: Number(m.active_jobs),
      })),
    },
    {
      id: "pending_orders",
      label: "Order Tertunda",
      status: pendingOrders === 0 ? "completed" : "warning",
      detail: `${pendingOrders} order menunggu`,
      value: pendingOrders,
    },
    {
      id: "unpaid_completed",
      label: "Order Selesai Belum Dibayar",
      status: unpaidCompleted === 0 ? "completed" : "error",
      detail: `${unpaidCompleted} order`,
      value: unpaidCompleted,
    },
    {
      id: "stock_alerts",
      label: "Stok Rendah/Habis",
      status: stockAlerts === 0 ? "completed" : "warning",
      detail: `${stockAlerts} item`,
      value: stockAlerts,
    },
    {
      id: "revenue",
      label: "Pendapatan Hari Ini",
      status: Number(todayRevenue._sum.total || 0) > 0 ? "completed" : "info",
      detail: `Rp ${Number(todayRevenue._sum.total || 0).toLocaleString()}`,
      value: Number(todayRevenue._sum.total || 0),
    },
  ];

  return {
    checklist: checklistItems,
    summary: {
      totalItems: checklistItems.length,
      completedItems: checklistItems.filter((i) => i.status === "completed").length,
      warningItems: checklistItems.filter((i) => i.status === "warning").length,
      errorItems: checklistItems.filter((i) => i.status === "error").length,
      allClear: checklistItems.every(
        (i) => i.status === "completed" || i.status === "info"
      ),
    },
    _metadata: {
      ...this.#getDateRanges(),
      type: "real-time",
      checkedAt: new Date().toISOString(),
    },
  };
}

/**
 * Stock movement log (audit trail)
 * @param {Object} [filters]
 * @param {string} [filters.productId]
 * @param {StockMovementType} [filters.type]
 * @param {number} [filters.limit=50]
 * @returns {Promise<Object>}
 */
async getStockMovementLog(filters = {}) {
  const { productId, type, limit = 50 } = filters;
  const where = {};
  if (productId) where.productId = productId;
  if (type) where.type = type;

  const movements = await prisma.stockMovement.findMany({
    where,
    select: {
      id: true,
      type: true,
      sourceType: true,
      quantity: true,
      note: true,
      createdAt: true,
      product: { select: { name: true, sku: true } },
      recordedBy: { select: { fullName: true } },
      orderItem: {
        select: {
          order: { select: { orderNumber: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return {
    movements: movements.map((m) => ({
      id: m.id,
      type: m.type,
      sourceType: m.sourceType,
      productName: m.product.name,
      sku: m.product.sku,
      quantity: m.quantity,
      note: m.note,
      recordedBy: m.recordedBy.fullName,
      orderNumber: m.orderItem?.order?.orderNumber || null,
      createdAt: m.createdAt,
    })),
    summary: {
      totalMovements: movements.length,
      totalIn: movements
        .filter((m) => m.type === "IN")
        .reduce((s, m) => s + m.quantity, 0),
      totalOut: movements
        .filter((m) => m.type === "OUT")
        .reduce((s, m) => s + m.quantity, 0),
      totalAdjustments: movements
        .filter((m) => m.type === "ADJUSTMENT")
        .reduce((s, m) => s + Math.abs(m.quantity), 0),
    },
    _metadata: {
      ...this.#getDateRanges(),
      filters: { productId: productId || null, type: type || null },
      limit,
    },
  };
}

/**
 * Product price history
 * @param {string} productId
 * @returns {Promise<Object>}
 */
async getProductPriceHistory(productId) {
  const [product, history] = await Promise.all([
    prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        name: true,
        sku: true,
        type: true,
        price: true,
        cost: true,
        stock: true,
      },
    }),
    prisma.productPriceHistory.findMany({
      where: { productId },
      select: {
        price: true,
        cost: true,
        effectiveFrom: true,
        createdAt: true,
      },
      orderBy: { effectiveFrom: "desc" },
      take: 50,
    }),
  ]);

  if (!product) {
    return {
      product: null,
      history: [],
      _metadata: { ...this.#getDateRanges() },
    };
  }

  return {
    product: {
      id: product.id,
      name: product.name,
      sku: product.sku,
      type: product.type,
      currentPrice: product.price,
      currentCost: product.cost,
      currentStock: product.stock,
      currentMargin: product.price - product.cost,
      marginPct:
        product.price > 0
          ? Math.round(((product.price - product.cost) / product.price) * 10000) / 100
          : 0,
    },
    history: history.map((h) => ({
      price: h.price,
      cost: h.cost,
      margin: h.price - h.cost,
      marginPct: h.price > 0 ? Math.round(((h.price - h.cost) / h.price) * 10000) / 100 : 0,
      effectiveFrom: h.effectiveFrom,
      createdAt: h.createdAt,
    })),
    summary: {
      totalChanges: history.length,
      lowestPrice: history.length > 0 ? Math.min(...history.map((h) => h.price)) : product.price,
      highestPrice: history.length > 0 ? Math.max(...history.map((h) => h.price)) : product.price,
      latestChange: history[0] || null,
    },
    _metadata: { ...this.#getDateRanges() },
  };
}

}

export default InsightRepository;
