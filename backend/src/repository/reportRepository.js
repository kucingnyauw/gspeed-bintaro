import prisma from "#app/database.js";

class ReportRepository {
  /**
   * Mendapatkan PPH rate dari settings
   * @returns {Promise<number>} PPH rate dalam persen (default 0.5)
   * @private
   */
  async #getPPHRate() {
    const setting = await prisma.setting.findUnique({
      where: { key: "pph_rate" },
      select: { value: true },
    });
    return setting ? parseFloat(setting.value) : 0.5;
  }

  /**
   * Mendapatkan threshold stok rendah dari settings
   * @returns {Promise<number>} Threshold stok rendah (default 5)
   * @private
   */
  async #getStockLowThreshold() {
    const setting = await prisma.setting.findUnique({
      where: { key: "stock_low_threshold" },
      select: { value: true },
    });
    return setting ? parseInt(setting.value, 10) : 5;
  }

  /**
   * Mendapatkan batas maksimal task mekanik dari settings
   * @returns {Promise<number>} Max tasks (default 5)
   * @private
   */
  async #getMechanicMaxTasks() {
    const setting = await prisma.setting.findUnique({
      where: { key: "mechanic_max_tasks" },
      select: { value: true },
    });
    return setting ? parseInt(setting.value, 10) : 5;
  }

  /**
   * Mendapatkan minimal modal awal shift dari settings
   * @returns {Promise<number>} Minimal starting cash (default 1000000)
   * @private
   */
  async #getShiftMinStartingCash() {
    const setting = await prisma.setting.findUnique({
      where: { key: "shift_min_starting_cash" },
      select: { value: true },
    });
    return setting ? parseInt(setting.value, 10) : 1000000;
  }

  /**
   * Mendapatkan tax rate dari settings
   * @returns {Promise<number>} Tax rate dalam persen (default 11)
   * @private
   */
  async #getTaxRate() {
    const setting = await prisma.setting.findUnique({
      where: { key: "tax_rate" },
      select: { value: true },
    });
    return setting ? parseFloat(setting.value) : 11;
  }

  /**
   * Mendapatkan status enable PPN dari settings
   * @returns {Promise<boolean>}
   * @private
   */
  async #isPPNEnabled() {
    const setting = await prisma.setting.findUnique({
      where: { key: "enable_ppn" },
      select: { value: true },
    });
    return setting?.value === "true";
  }

  /**
   * Mendapatkan status enable PPH dari settings
   * @returns {Promise<boolean>}
   * @private
   */
  async #isPPHEnabled() {
    const setting = await prisma.setting.findUnique({
      where: { key: "enable_pph" },
      select: { value: true },
    });
    return setting?.value === "true";
  }

  /**
   * Mendapatkan target revenue bulanan dari settings
   * @returns {Promise<number>} Target revenue (default 0)
   * @private
   */
  async #getMonthlyRevenueTarget() {
    const setting = await prisma.setting.findUnique({
      where: { key: "monthly_revenue_target" },
      select: { value: true },
    });
    return setting ? parseInt(setting.value, 10) : 0;
  }

  /**
   * Mendapatkan data penjualan agregat dalam rentang waktu tertentu
   * @param {Date} startDate - Tanggal mulai
   * @param {Date} endDate - Tanggal akhir
   * @returns {Promise<Object>}
   */
  async getSalesData(startDate, endDate) {
    const [pphRate, taxRate, pphEnabled, ppnEnabled] = await Promise.all([
      this.#getPPHRate(),
      this.#getTaxRate(),
      this.#isPPHEnabled(),
      this.#isPPNEnabled(),
    ]);

    const aggregations = await prisma.order.aggregate({
      _sum: { subtotal: true, tax: true, total: true },
      _count: { id: true },
      _avg: { total: true },
      where: {
        status: { in: ["COMPLETED", "CLOSED"] },
        deletedAt: null,
        payment: { status: "PAID" },
        createdAt: { gte: startDate, lte: endDate },
      },
    });

    const totalSubtotal = Number(aggregations._sum.subtotal || 0);
    const totalPPH = ppnEnabled
      ? Math.round((totalSubtotal * pphRate) / 100)
      : 0;

    return {
      totalOrders: aggregations._count.id || 0,
      totalSales: Number(aggregations._sum.total || 0),
      totalSubtotal,
      totalTax: Number(aggregations._sum.tax || 0),
      totalPPH,
      pphRate,
      taxRate,
      pphEnabled,
      ppnEnabled,
      averageOrderValue: Math.round(Number(aggregations._avg.total || 0)),
    };
  }

  /**
   * Mendapatkan ringkasan penjualan harian untuk chart dan export
   * @param {Date} startDate - Tanggal mulai
   * @param {Date} endDate - Tanggal akhir
   * @returns {Promise<Array>}
   */
  async getDailySalesSummary(startDate, endDate) {
    const [pphRate, pphEnabled] = await Promise.all([
      this.#getPPHRate(),
      this.#isPPHEnabled(),
    ]);

    const query = `
      SELECT 
        DATE(o."createdAt") as date,
        COUNT(o."id")::int as "orderCount",
        COALESCE(SUM(o."subtotal"), 0)::bigint as "totalSubtotal",
        COALESCE(SUM(o."tax"), 0)::bigint as "totalTax",
        COALESCE(SUM(o."total"), 0)::bigint as "totalSales",
        COALESCE(AVG(o."total"), 0)::float as "averageOrderValue"
      FROM "Order" o
      INNER JOIN "Payment" p ON o."id" = p."orderId"
      WHERE o."status" IN ('COMPLETED', 'CLOSED')
        AND o."deletedAt" IS NULL
        AND p."status" = 'PAID'
        AND o."createdAt" >= $1::timestamp
        AND o."createdAt" <= $2::timestamp
      GROUP BY DATE(o."createdAt")
      ORDER BY DATE(o."createdAt") ASC
    `;

    const rawData = await prisma.$queryRawUnsafe(query, startDate, endDate);

    return rawData.map((item) => ({
      date: item.date,
      orderCount: Number(item.orderCount),
      totalSales: Number(item.totalSales),
      totalSubtotal: Number(item.totalSubtotal),
      totalTax: Number(item.totalTax),
      totalPPH: pphEnabled
        ? Math.round((Number(item.totalSubtotal) * pphRate) / 100)
        : 0,
      averageOrderValue: Math.round(Number(item.averageOrderValue)),
    }));
  }

  /**
   * Mendapatkan ringkasan penjualan per jam untuk chart daily
   * @param {Date} startDate - Tanggal mulai
   * @param {Date} endDate - Tanggal akhir
   * @returns {Promise<Array>}
   */
  async getHourlySalesSummary(startDate, endDate) {
    const query = `
      SELECT 
        EXTRACT(HOUR FROM o."createdAt")::int as hour,
        COUNT(o."id")::int as "orderCount",
        COALESCE(SUM(o."total"), 0)::bigint as "totalSales",
        COALESCE(AVG(o."total"), 0)::float as "averageOrderValue"
      FROM "Order" o
      INNER JOIN "Payment" p ON o."id" = p."orderId"
      WHERE o."status" IN ('COMPLETED', 'CLOSED')
        AND o."deletedAt" IS NULL
        AND p."status" = 'PAID'
        AND o."createdAt" >= $1::timestamp
        AND o."createdAt" <= $2::timestamp
      GROUP BY EXTRACT(HOUR FROM o."createdAt")
      ORDER BY hour ASC
    `;

    const rawData = await prisma.$queryRawUnsafe(query, startDate, endDate);

    return Array.from({ length: 24 }, (_, i) => {
      const found = rawData.find((item) => Number(item.hour) === i);
      return {
        hour: `${String(i).padStart(2, "0")}:00`,
        orderCount: found ? Number(found.orderCount) : 0,
        totalSales: found ? Number(found.totalSales) : 0,
        averageOrderValue: found
          ? Math.round(Number(found.averageOrderValue))
          : 0,
      };
    });
  }

  /**
   * Mendapatkan data laba rugi
   * @param {Date} startDate - Tanggal mulai
   * @param {Date} endDate - Tanggal akhir
   * @returns {Promise<Object>}
   */
  async getProfitLossData(startDate, endDate) {
    const [pphRate, pphEnabled] = await Promise.all([
      this.#getPPHRate(),
      this.#isPPHEnabled(),
    ]);

    const query = `
      WITH expense_total AS (
        SELECT COALESCE(SUM("amount"), 0)::bigint as "totalExpenses"
        FROM "Expense"
        WHERE "date" >= $1::timestamp AND "date" <= $2::timestamp
      )
      SELECT 
        COALESCE(SUM(o."subtotal"), 0)::bigint as "grossRevenue",
        COALESCE(SUM(oi."unitCostSnapshot" * oi."quantity"), 0)::bigint as "totalCogs",
        COALESCE(SUM(o."subtotal") - SUM(oi."unitCostSnapshot" * oi."quantity"), 0)::bigint as "grossProfit",
        CASE 
          WHEN SUM(o."subtotal") > 0 
          THEN ((SUM(o."subtotal") - SUM(oi."unitCostSnapshot" * oi."quantity"))::float / SUM(o."subtotal") * 100) 
          ELSE 0 
        END as "grossMargin",
        COALESCE((SELECT "totalExpenses" FROM expense_total), 0)::bigint as "totalOperatingExpenses",
        COALESCE(SUM(o."subtotal") - SUM(oi."unitCostSnapshot" * oi."quantity") - (SELECT "totalExpenses" FROM expense_total), 0)::bigint as "netProfit",
        CASE 
          WHEN SUM(o."subtotal") > 0 
          THEN ((SUM(o."subtotal") - SUM(oi."unitCostSnapshot" * oi."quantity") - (SELECT "totalExpenses" FROM expense_total))::float / SUM(o."subtotal") * 100) 
          ELSE 0 
        END as "netMargin"
      FROM "Order" o
      INNER JOIN "Payment" p ON o."id" = p."orderId"
      LEFT JOIN "OrderItem" oi ON o."id" = oi."orderId"
      WHERE o."status" IN ('COMPLETED', 'CLOSED')
        AND o."deletedAt" IS NULL
        AND p."status" = 'PAID'
        AND o."createdAt" >= $1::timestamp
        AND o."createdAt" <= $2::timestamp
    `;

    const [result] = await prisma.$queryRawUnsafe(query, startDate, endDate);

    const grossRevenue = Number(result.grossRevenue);
    const netProfit = Number(result.netProfit);
    const totalPPH = pphEnabled
      ? Math.round((grossRevenue * pphRate) / 100)
      : 0;
    const netProfitAfterPPH = netProfit - totalPPH;

    return {
      grossRevenue,
      totalCogs: Number(result.totalCogs),
      grossProfit: Number(result.grossProfit),
      grossMargin: Math.round(Number(result.grossMargin) * 100) / 100,
      totalOperatingExpenses: Number(result.totalOperatingExpenses),
      netProfit,
      netMargin: Math.round(Number(result.netMargin) * 100) / 100,
      totalPPH,
      pphRate,
      pphEnabled,
      netProfitAfterPPH,
      netMarginAfterPPH:
        grossRevenue > 0
          ? Math.round((netProfitAfterPPH / grossRevenue) * 100 * 100) / 100
          : 0,
    };
  }

  /**
   * Mendapatkan data laba rugi harian untuk chart dan export
   * @param {Date} startDate - Tanggal mulai
   * @param {Date} endDate - Tanggal akhir
   * @returns {Promise<Array>}
   */
  async getDailyProfitLossSummary(startDate, endDate) {
    const [pphRate, pphEnabled] = await Promise.all([
      this.#getPPHRate(),
      this.#isPPHEnabled(),
    ]);

    const query = `
      WITH daily_expenses AS (
        SELECT DATE("date") as date, COALESCE(SUM("amount"), 0)::bigint as "expenses"
        FROM "Expense"
        WHERE "date" >= $1::timestamp AND "date" <= $2::timestamp
        GROUP BY DATE("date")
      ),
      daily_orders AS (
        SELECT 
          DATE(o."createdAt") as date,
          COALESCE(SUM(o."subtotal"), 0)::bigint as "grossRevenue",
          COALESCE(SUM(oi."unitCostSnapshot" * oi."quantity"), 0)::bigint as "totalCogs"
        FROM "Order" o
        INNER JOIN "Payment" p ON o."id" = p."orderId"
        LEFT JOIN "OrderItem" oi ON o."id" = oi."orderId"
        WHERE o."status" IN ('COMPLETED', 'CLOSED')
          AND o."deletedAt" IS NULL
          AND p."status" = 'PAID'
          AND o."createdAt" >= $1::timestamp
          AND o."createdAt" <= $2::timestamp
        GROUP BY DATE(o."createdAt")
      )
      SELECT 
        do2.date,
        do2."grossRevenue",
        do2."totalCogs",
        do2."grossRevenue" - do2."totalCogs" as "grossProfit",
        COALESCE(de."expenses", 0)::bigint as "totalOperatingExpenses",
        do2."grossRevenue" - do2."totalCogs" - COALESCE(de."expenses", 0) as "netProfit"
      FROM daily_orders do2
      LEFT JOIN daily_expenses de ON do2.date = de.date
      ORDER BY do2.date ASC
    `;

    const rawData = await prisma.$queryRawUnsafe(query, startDate, endDate);

    return rawData.map((item) => {
      const netProfit = Number(item.netProfit);
      const grossRevenue = Number(item.grossRevenue);
      const totalPPH = pphEnabled
        ? Math.round((grossRevenue * pphRate) / 100)
        : 0;
      const netProfitAfterPPH = netProfit - totalPPH;

      return {
        date: item.date,
        grossRevenue,
        totalCogs: Number(item.totalCogs),
        grossProfit: Number(item.grossProfit),
        totalOperatingExpenses: Number(item.totalOperatingExpenses),
        netProfit,
        totalPPH,
        netProfitAfterPPH,
      };
    });
  }

  /**
   * Mendapatkan snapshot inventori saat ini
   * Threshold stok rendah diambil dari settings `stock_low_threshold`
   * @param {Object} [options={}] - Opsi pagination
   * @param {number} [options.page=1] - Halaman
   * @param {number} [options.limit=10] - Jumlah per halaman
   * @returns {Promise<Object>}
   */
  async getInventorySnapshot(options = {}) {
    const page = options.page || 1;
    const limit = options.limit || 10;
    const skip = (page - 1) * limit;
    const lowThreshold = await this.#getStockLowThreshold();

    const [result, total, products] = await Promise.all([
      prisma.$queryRaw`
        SELECT 
          COUNT(*)::int as "totalItems",
          COUNT(*) FILTER (WHERE "stock" = 0)::int as "outOfStock",
          COUNT(*) FILTER (WHERE "stock" > 0 AND "stock" <= ${lowThreshold})::int as "lowStock",
          COUNT(*) FILTER (WHERE "stock" > ${lowThreshold})::int as "healthy",
          COALESCE(SUM("stock" * "cost"), 0)::bigint as "totalAssetValue",
          COALESCE(SUM("stock" * "price"), 0)::bigint as "totalRetailValue",
          COALESCE(SUM("stock" * "price") - SUM("stock" * "cost"), 0)::bigint as "potentialProfit",
          CASE 
            WHEN SUM("stock" * "price") > 0 
            THEN ((SUM("stock" * "price") - SUM("stock" * "cost"))::float / SUM("stock" * "price") * 100) 
            ELSE 0 
          END as "profitMargin"
        FROM "Product"
        WHERE "type" = 'SPAREPART' AND "isActive" = true
      `,
      prisma.product.count({ where: { type: "SPAREPART", isActive: true } }),
      prisma.product.findMany({
        where: { type: "SPAREPART", isActive: true },
        select: {
          id: true,
          sku: true,
          name: true,
          stock: true,
          cost: true,
          price: true,
          image: { select: { path: true } },
        },
        orderBy: { stock: "asc" },
        skip,
        take: limit,
      }),
    ]);

    const items = products.map((product) => {
      const assetValue = product.stock * product.cost;
      const retailValue = product.stock * product.price;

      return {
        id: product.id,
        sku: product.sku,
        name: product.name,
        stock: product.stock,
        cost: product.cost,
        price: product.price,
        image: product.image?.path || null,
        assetValue,
        retailValue,
        potentialProfit: retailValue - assetValue,
        stockStatus:
          product.stock === 0
            ? "OUT_OF_STOCK"
            : product.stock <= lowThreshold
            ? "LOW_STOCK"
            : "HEALTHY",
      };
    });

    return {
      summary: {
        totalItems: Number(result[0].totalItems),
        totalAssetValue: Number(result[0].totalAssetValue),
        totalRetailValue: Number(result[0].totalRetailValue),
        potentialProfit: Number(result[0].potentialProfit),
        profitMargin: Math.round(Number(result[0].profitMargin) * 100) / 100,
        outOfStock: Number(result[0].outOfStock),
        lowStock: Number(result[0].lowStock),
        healthy: Number(result[0].healthy),
        lowThreshold,
      },
      items,
      metadata: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Mendapatkan ringkasan shift kerja
   * @param {string} shiftId - ID shift
   * @returns {Promise<Object|null>}
   */
  async getShiftSummary(shiftId) {
    const minStartingCash = await this.#getShiftMinStartingCash();

    const [shift, expensesAgg, paymentBreakdown] = await Promise.all([
      prisma.shift.findUnique({
        where: { id: shiftId },
        select: {
          id: true,
          status: true,
          startingCash: true,
          endingCash: true,
          expectedCash: true,
          cashSales: true,
          cashIn: true,
          cashOut: true,
          discrepancy: true,
          openedAt: true,
          closedAt: true,
          cashier: { select: { id: true, fullName: true } },
          _count: { select: { orders: true } },
        },
      }),
      prisma.expense.aggregate({ where: { shiftId }, _sum: { amount: true } }),
      prisma.payment.groupBy({
        by: ["method"],
        where: {
          order: {
            shiftId,
            deletedAt: null,
            status: { in: ["COMPLETED", "CLOSED"] },
          },
          status: "PAID",
        },
        _sum: { amountPaid: true },
        _count: { method: true },
      }),
    ]);

    if (!shift) return null;

    const totalExpenses = Number(expensesAgg._sum.amount || 0);

    return {
      id: shift.id,
      status: shift.status,
      startingCash: shift.startingCash,
      endingCash: shift.endingCash,
      expectedCash: shift.expectedCash,
      cashSales: shift.cashSales,
      cashIn: shift.cashIn,
      cashOut: shift.cashOut,
      discrepancy: shift.discrepancy,
      openedAt: shift.openedAt,
      closedAt: shift.closedAt,
      cashier: shift.cashier,
      orderCount: shift._count.orders,
      totalExpenses,
      netSales: shift.cashSales - totalExpenses,
      minStartingCash,
      paymentBreakdown: paymentBreakdown.map((item) => ({
        method: item.method,
        total: Number(item._sum.amountPaid || 0),
        count: Number(item._count.method),
      })),
    };
  }

  /**
   * Mendapatkan statistik task per order
   * @param {string} orderId - ID order
   * @returns {Promise<Object>}
   */
  async getTaskStatsByOrder(orderId) {
    const mechanicMaxTasks = await this.#getMechanicMaxTasks();

    const [total, assigned] = await Promise.all([
      prisma.orderItem.count({
        where: { orderId, product: { type: "SERVICE" } },
      }),
      prisma.orderItem.count({
        where: {
          orderId,
          product: { type: "SERVICE" },
          assignments: { some: {} },
        },
      }),
    ]);

    const tasks = await prisma.orderItem.findMany({
      where: { orderId, product: { type: "SERVICE" } },
      select: {
        id: true,
        productNameSnapshot: true,
        assignments: {
          select: {
            id: true,
            startAt: true,
            endAt: true,
            mechanic: { select: { id: true, fullName: true } },
          },
        },
      },
    });

    return {
      total,
      assigned,
      unassigned: total - assigned,
      mechanicMaxTasks,
      tasks: tasks.map((t) => ({
        id: t.id,
        serviceName: t.productNameSnapshot,
        assignedMechanics: t.assignments.map((a) => ({
          id: a.mechanic.id,
          name: a.mechanic.fullName,
          startAt: a.startAt,
          endAt: a.endAt,
        })),
      })),
    };
  }

  /**
   * Mendapatkan statistik tugas mekanik
   * @param {string} mechanicId - ID mekanik
   * @returns {Promise<Object>}
   */
  async getMechanicTaskStats(mechanicId) {
    const mechanicMaxTasks = await this.#getMechanicMaxTasks();

    const [pending, completed, total] = await Promise.all([
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
      prisma.mechanicAssignment.count({
        where: {
          mechanicId,
          endAt: { not: null },
          orderItem: {
            order: { status: { in: ["COMPLETED", "CLOSED"] }, deletedAt: null },
          },
        },
      }),
      prisma.mechanicAssignment.count({ where: { mechanicId } }),
    ]);

    return {
      totalTasks: total,
      completedTasks: completed,
      pendingTasks: pending,
      maxTasks: mechanicMaxTasks,
      available: Math.max(0, mechanicMaxTasks - pending),
      isOverloaded: pending >= mechanicMaxTasks,
    };
  }

  /**
   * Mendapatkan total pendapatan dari tugas mekanik
   * @param {string} mechanicId - ID mekanik
   * @param {Date} startDate - Tanggal mulai
   * @param {Date} endDate - Tanggal akhir
   * @returns {Promise<Object>}
   */
  async getTotalEarningsByMechanic(mechanicId, startDate, endDate) {
    const query = `
      SELECT 
        COALESCE(SUM(oi."subtotal"), 0)::bigint as "totalEarnings",
        COUNT(ma."id")::int as "taskCount"
      FROM "MechanicAssignment" ma
      INNER JOIN "OrderItem" oi ON ma."orderItemId" = oi."id"
      INNER JOIN "Order" o ON oi."orderId" = o."id"
      WHERE ma."mechanicId" = $1
        AND ma."endAt" IS NOT NULL
        AND o."status" IN ('COMPLETED', 'CLOSED')
        AND o."deletedAt" IS NULL
        AND ma."endAt" >= $2::timestamp
        AND ma."endAt" <= $3::timestamp
    `;

    const [result] = await prisma.$queryRawUnsafe(
      query,
      mechanicId,
      startDate,
      endDate
    );
    const totalEarnings = Number(result.totalEarnings);
    const taskCount = Number(result.taskCount);

    return {
      totalEarnings,
      taskCount,
      averagePerTask: taskCount > 0 ? Math.round(totalEarnings / taskCount) : 0,
    };
  }

  /**
   * Mendapatkan ringkasan pengeluaran
   * @param {Date} startDate - Tanggal mulai
   * @param {Date} endDate - Tanggal akhir
   * @param {Object} [filters={}] - Filter tambahan
   * @returns {Promise<Object>}
   */
  async getExpensesSummary(startDate, endDate, filters = {}) {
    const where = { date: { gte: startDate, lte: endDate } };
    if (filters.shiftId) where.shiftId = filters.shiftId;
    if (filters.category) where.category = filters.category;

    const [totalAgg, byCategory] = await Promise.all([
      prisma.expense.aggregate({
        where,
        _sum: { amount: true },
        _count: { id: true },
      }),
      prisma.expense.groupBy({
        by: ["category"],
        where,
        _sum: { amount: true },
        _count: { id: true },
      }),
    ]);

    return {
      totalAmount: Number(totalAgg._sum.amount || 0),
      count: totalAgg._count.id,
      byCategory: byCategory.map((e) => ({
        category: e.category,
        total: Number(e._sum.amount || 0),
        count: Number(e._count.id),
      })),
    };
  }

  /**
   * Mendapatkan pengeluaran harian untuk chart dan export
   * @param {Date} startDate - Tanggal mulai
   * @param {Date} endDate - Tanggal akhir
   * @returns {Promise<Array>}
   */
  async getDailyExpensesSummary(startDate, endDate) {
    const query = `
      SELECT DATE("date") as date, COALESCE(SUM("amount"), 0)::bigint as "totalAmount", COUNT("id")::int as "count"
      FROM "Expense"
      WHERE "date" >= $1::timestamp AND "date" <= $2::timestamp
      GROUP BY DATE("date") ORDER BY DATE("date") ASC
    `;

    const rawData = await prisma.$queryRawUnsafe(query, startDate, endDate);
    return rawData.map((item) => ({
      date: item.date,
      totalAmount: Number(item.totalAmount),
      count: Number(item.count),
    }));
  }

  /**
   * Mendapatkan ringkasan pergerakan stok
   * @param {string} productId - ID produk
   * @param {Date} startDate - Tanggal mulai
   * @param {Date} endDate - Tanggal akhir
   * @param {Object} [options={}] - Opsi pagination
   * @returns {Promise<Object>}
   */
  async getMovementSummary(productId, startDate, endDate, options = {}) {
    const page = options.page || 1;
    const limit = options.limit || 10;
    const skip = (page - 1) * limit;
    const where = { productId, createdAt: { gte: startDate, lte: endDate } };

    const [movementTypes, total, movements] = await Promise.all([
      prisma.stockMovement.groupBy({
        by: ["type"],
        where,
        _sum: { quantity: true },
      }),
      prisma.stockMovement.count({ where }),
      prisma.stockMovement.findMany({
        where,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          type: true,
          sourceType: true,
          quantity: true,
          note: true,
          createdAt: true,
          recordedBy: { select: { id: true, fullName: true } },
          orderItem: { select: { id: true, orderId: true } },
        },
        skip,
        take: limit,
      }),
    ]);

    const summary = { IN: 0, OUT: 0, ADJUSTMENT: 0 };
    for (const m of movementTypes) {
      summary[m.type] = Number(m._sum.quantity || 0);
    }

    return {
      IN: summary.IN,
      OUT: summary.OUT,
      ADJUSTMENT: summary.ADJUSTMENT,
      netChange: summary.IN - summary.OUT + summary.ADJUSTMENT,
      movements: movements.map((m) => ({
        id: m.id,
        type: m.type,
        sourceType: m.sourceType,
        quantity: m.quantity,
        note: m.note,
        createdAt: m.createdAt,
        recordedBy: m.recordedBy.fullName,
        orderItemId: m.orderItem?.id || null,
        orderId: m.orderItem?.orderId || null,
      })),
      metadata: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Menghitung stok dari pergerakan stok
   * @param {string} productId - ID produk
   * @returns {Promise<number>}
   */
  async calculateStockFromMovements(productId) {
    const movements = await prisma.stockMovement.groupBy({
      by: ["type"],
      where: { productId },
      _sum: { quantity: true },
    });

    let calculatedStock = 0;
    for (const m of movements) {
      const qty = Number(m._sum.quantity || 0);
      if (m.type === "IN" || m.type === "ADJUSTMENT") calculatedStock += qty;
      else if (m.type === "OUT") calculatedStock -= qty;
    }
    return calculatedStock;
  }

  /**
   * Validasi konsistensi stok produk
   * @param {string} productId - ID produk
   * @returns {Promise<Object|null>}
   */
  async validateStockConsistency(productId) {
    const [product, calculatedStock] = await Promise.all([
      prisma.product.findUnique({
        where: { id: productId },
        select: { stock: true },
      }),
      this.calculateStockFromMovements(productId),
    ]);
    if (!product) return null;

    return {
      current: product.stock,
      calculated: calculatedStock,
      difference: product.stock - calculatedStock,
      isConsistent: product.stock === calculatedStock,
    };
  }

  /**
   * Mendapatkan laporan performa mekanik dengan pagination
   * @param {Date} startDate - Tanggal mulai
   * @param {Date} endDate - Tanggal akhir
   * @param {Object} [options={}] - Opsi pagination
   * @returns {Promise<Object>}
   */
  async getMechanicPerformanceReport(startDate, endDate, options = {}) {
    const page = options.page || 1;
    const limit = options.limit || 10;
    const offset = (page - 1) * limit;

    const countQuery = `
      SELECT COUNT(DISTINCT u."id")::int as "total"
      FROM "User" u
      LEFT JOIN "MechanicAssignment" ma ON u."id" = ma."mechanicId" 
        AND ma."createdAt" >= $1::timestamp AND ma."createdAt" <= $2::timestamp
      WHERE u."role" = 'MECHANIC'
    `;

    const dataQuery = `
      SELECT 
        u."id" as "mechanicId", u."fullName" as "mechanicName", u."email",
        COUNT(DISTINCT ma."id")::int as "totalTasks",
        COUNT(DISTINCT CASE WHEN ma."endAt" IS NOT NULL AND o."status" IN ('COMPLETED','CLOSED') AND o."deletedAt" IS NULL THEN ma."id" END)::int as "completedTasks",
        COUNT(DISTINCT CASE WHEN ma."endAt" IS NULL AND o."status" IN ('QUEUED','IN_PROGRESS') AND o."deletedAt" IS NULL THEN ma."id" END)::int as "pendingTasks",
        COALESCE(SUM(CASE WHEN ma."endAt" IS NOT NULL AND o."status" IN ('COMPLETED','CLOSED') AND o."deletedAt" IS NULL THEN oi."subtotal" ELSE 0 END), 0)::bigint as "totalEarnings",
        CASE WHEN COUNT(DISTINCT CASE WHEN ma."endAt" IS NOT NULL AND o."status" IN ('COMPLETED','CLOSED') AND o."deletedAt" IS NULL THEN ma."id" END) > 0 
          THEN COALESCE(SUM(CASE WHEN ma."endAt" IS NOT NULL AND o."status" IN ('COMPLETED','CLOSED') AND o."deletedAt" IS NULL THEN oi."subtotal" ELSE 0 END), 0) / COUNT(DISTINCT CASE WHEN ma."endAt" IS NOT NULL AND o."status" IN ('COMPLETED','CLOSED') AND o."deletedAt" IS NULL THEN ma."id" END)
          ELSE 0 END as "averagePerTask",
        CASE WHEN COUNT(DISTINCT ma."id") > 0 
          THEN (COUNT(DISTINCT CASE WHEN ma."endAt" IS NOT NULL AND o."status" IN ('COMPLETED','CLOSED') AND o."deletedAt" IS NULL THEN ma."id" END)::float / COUNT(DISTINCT ma."id") * 100)
          ELSE 0 END as "completionRate"
      FROM "User" u
      LEFT JOIN "MechanicAssignment" ma ON u."id" = ma."mechanicId" 
        AND ma."createdAt" >= $1::timestamp AND ma."createdAt" <= $2::timestamp
      LEFT JOIN "OrderItem" oi ON ma."orderItemId" = oi."id"
      LEFT JOIN "Order" o ON oi."orderId" = o."id"
      WHERE u."role" = 'MECHANIC'
      GROUP BY u."id", u."fullName", u."email"
      ORDER BY "totalEarnings" DESC
      LIMIT $3 OFFSET $4
    `;

    const [countResult, rawData] = await Promise.all([
      prisma.$queryRawUnsafe(countQuery, startDate, endDate),
      prisma.$queryRawUnsafe(dataQuery, startDate, endDate, limit, offset),
    ]);

    const total = Number(countResult[0].total);

    return {
      data: rawData.map((item) => ({
        mechanicId: item.mechanicId,
        mechanicName: item.mechanicName,
        email: item.email,
        totalTasks: Number(item.totalTasks),
        completedTasks: Number(item.completedTasks),
        pendingTasks: Number(item.pendingTasks),
        totalEarnings: Number(item.totalEarnings),
        averagePerTask: Number(item.averagePerTask),
        completionRate: Math.round(Number(item.completionRate) * 100) / 100,
      })),
      metadata: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Mendapatkan laporan penjualan per produk
   * @param {Date} startDate - Tanggal mulai
   * @param {Date} endDate - Tanggal akhir
   * @param {Object} [options={}] - Opsi pagination
   * @returns {Promise<Object>}
   */
  async getProductSalesReport(startDate, endDate, options = {}) {
    const page = options.page || 1;
    const limit = options.limit || 10;
    const offset = (page - 1) * limit;

    const countQuery = `
      SELECT COUNT(DISTINCT oi."productId")::int as "total"
      FROM "OrderItem" oi
      INNER JOIN "Order" o ON oi."orderId" = o."id"
      INNER JOIN "Payment" p2 ON o."id" = p2."orderId"
      WHERE o."status" IN ('COMPLETED','CLOSED') AND o."deletedAt" IS NULL
        AND p2."status" = 'PAID'
        AND o."createdAt" >= $1::timestamp AND o."createdAt" <= $2::timestamp
    `;

    const dataQuery = `
      SELECT 
        oi."productId", MAX(oi."productNameSnapshot") as "productName",
        MAX(p."sku") as "sku", MAX(p."type") as "type", f."path" as "image",
        SUM(oi."quantity")::int as "quantitySold",
        SUM(oi."subtotal")::bigint as "totalRevenue",
        SUM(oi."unitCostSnapshot" * oi."quantity")::bigint as "totalCost",
        SUM(oi."subtotal") - SUM(oi."unitCostSnapshot" * oi."quantity")::bigint as "profit",
        CASE WHEN SUM(oi."subtotal") > 0 
          THEN ((SUM(oi."subtotal") - SUM(oi."unitCostSnapshot" * oi."quantity"))::float / SUM(oi."subtotal") * 100)
          ELSE 0 END as "profitMargin"
      FROM "OrderItem" oi
      INNER JOIN "Order" o ON oi."orderId" = o."id"
      INNER JOIN "Payment" p2 ON o."id" = p2."orderId"
      LEFT JOIN "Product" p ON oi."productId" = p."id"
      LEFT JOIN "File" f ON p."imageId" = f."id"
      WHERE o."status" IN ('COMPLETED','CLOSED') AND o."deletedAt" IS NULL
        AND p2."status" = 'PAID'
        AND o."createdAt" >= $1::timestamp AND o."createdAt" <= $2::timestamp
      GROUP BY oi."productId", f."path"
      ORDER BY "totalRevenue" DESC
      LIMIT $3 OFFSET $4
    `;

    const [countResult, rawData] = await Promise.all([
      prisma.$queryRawUnsafe(countQuery, startDate, endDate),
      prisma.$queryRawUnsafe(dataQuery, startDate, endDate, limit, offset),
    ]);

    const total = Number(countResult[0].total);

    return {
      data: rawData.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        sku: item.sku,
        type: item.type,
        image: item.image,
        quantitySold: Number(item.quantitySold),
        totalRevenue: Number(item.totalRevenue),
        totalCost: Number(item.totalCost),
        profit: Number(item.profit),
        profitMargin: Math.round(Number(item.profitMargin) * 100) / 100,
      })),
      metadata: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Mendapatkan ringkasan produk untuk dashboard
   * @returns {Promise<Object>}
   */
  async getProductSummary() {
    const lowThreshold = await this.#getStockLowThreshold();

    const [productStats, stockValue, outOfStock] = await Promise.all([
      Promise.all([
        prisma.product.count(),
        prisma.product.count({ where: { isActive: true } }),
        prisma.product.count({
          where: {
            type: "SPAREPART",
            stock: { lte: lowThreshold, gt: 0 },
            isActive: true,
          },
        }),
        prisma.product.groupBy({
          by: ["type"],
          _count: { type: true },
          _sum: { stock: true },
        }),
      ]),
      prisma.$queryRaw`
        SELECT 
          COALESCE(SUM("stock"), 0)::int as "totalStockQuantity",
          COALESCE(SUM("stock" * "cost"), 0)::bigint as "totalStockValue"
        FROM "Product" WHERE "type" = 'SPAREPART'
      `,
      prisma.product.count({
        where: { type: "SPAREPART", stock: 0, isActive: true },
      }),
    ]);

    const [totalProducts, activeProducts, lowStock, byType] = productStats;

    return {
      totalProducts,
      activeProducts,
      inactiveProducts: totalProducts - activeProducts,
      lowStockCount: lowStock,
      outOfStockCount: outOfStock,
      totalStockValue: Number(stockValue[0].totalStockValue),
      totalStockQuantity: Number(stockValue[0].totalStockQuantity),
      lowThreshold,
      byType: byType.map((item) => ({
        type: item.type,
        count: item._count.type,
        totalStock: item._sum.stock || 0,
      })),
    };
  }

  /**
   * Mendapatkan produk dengan stok rendah dengan pagination
   * @param {Object} [options={}] - Opsi
   * @param {number} [options.threshold] - Batas stok rendah (default dari settings)
   * @param {number} [options.page=1] - Halaman
   * @param {number} [options.limit=10] - Jumlah per halaman
   * @returns {Promise<Object>}
   */
  async getLowStockProducts(options = {}) {
    const page = options.page || 1;
    const limit = options.limit || 10;
    const threshold = options.threshold || (await this.#getStockLowThreshold());
    const skip = (page - 1) * limit;

    const where = {
      type: "SPAREPART",
      isActive: true,
      stock: { lte: threshold },
    };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        select: {
          id: true,
          sku: true,
          name: true,
          stock: true,
          cost: true,
          price: true,
          image: { select: { path: true } },
        },
        orderBy: { stock: "asc" },
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    return {
      data: products.map((product) => ({
        id: product.id,
        sku: product.sku,
        name: product.name,
        stock: product.stock,
        cost: product.cost,
        price: product.price,
        image: product.image?.path || null,
        stockStatus: product.stock === 0 ? "OUT_OF_STOCK" : "LOW_STOCK",
      })),
      metadata: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        threshold,
      },
    };
  }

  /**
   * Mendapatkan ringkasan pembayaran
   * @param {Date} startDate - Tanggal mulai
   * @param {Date} endDate - Tanggal akhir
   * @param {Object} [filters={}] - Filter tambahan
   * @returns {Promise<Object>}
   */
  async getPaymentSummary(startDate, endDate, filters = {}) {
    const where = { createdAt: { gte: startDate, lte: endDate } };
    if (filters.status) where.status = filters.status;
    if (filters.method) where.method = filters.method;

    const [totalAmount, count, byMethod, byStatus, daily] = await Promise.all([
      prisma.payment.aggregate({ where, _sum: { amountPaid: true } }),
      prisma.payment.count({ where }),
      prisma.payment.groupBy({
        by: ["method"],
        where,
        _sum: { amountPaid: true },
        _count: { method: true },
      }),
      prisma.payment.groupBy({
        by: ["status"],
        where,
        _sum: { amountPaid: true },
        _count: { status: true },
      }),
      prisma.$queryRaw`
        SELECT DATE("createdAt") as date, COALESCE(SUM("amountPaid"), 0)::bigint as "totalAmount", COUNT("id")::int as "count"
        FROM "Payment"
        WHERE "createdAt" >= ${startDate}::timestamp AND "createdAt" <= ${endDate}::timestamp
        GROUP BY DATE("createdAt") ORDER BY DATE("createdAt") ASC
      `,
    ]);

    return {
      totalAmount: Number(totalAmount._sum.amountPaid || 0),
      totalCount: count,
      byMethod: byMethod.map((item) => ({
        method: item.method,
        amount: Number(item._sum.amountPaid || 0),
        count: Number(item._count.method),
      })),
      byStatus: byStatus.map((item) => ({
        status: item.status,
        amount: Number(item._sum.amountPaid || 0),
        count: Number(item._count.status),
      })),
      daily: daily.map((item) => ({
        date: item.date,
        totalAmount: Number(item.totalAmount),
        count: Number(item.count),
      })),
    };
  }

  /**
   * Mendapatkan jumlah order berdasarkan status
   * @param {string|string[]} status - Status order
   * @returns {Promise<number>}
   */
  async countOrdersByStatus(status) {
    return prisma.order.count({
      where: {
        status: Array.isArray(status) ? { in: status } : status,
        deletedAt: null,
      },
    });
  }

  /**
   * Mendapatkan shift yang sedang aktif
   * @returns {Promise<Object|null>}
   */
  async getActiveShift() {
    return prisma.shift.findFirst({
      where: { status: "OPEN" },
      include: {
        cashier: { select: { id: true, fullName: true } },
        _count: { select: { orders: true } },
      },
      orderBy: { openedAt: "desc" },
    });
  }

  /**
   * Mendapatkan data penjualan hari ini untuk kasir tertentu
   * @param {string} cashierId - ID kasir
   * @returns {Promise<Object>}
   */
  async getCashierTodaySales(cashierId) {
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    const [aggregations, pendingCount] = await Promise.all([
      prisma.order.aggregate({
        _sum: { total: true },
        _count: { id: true },
        where: {
          cashierId,
          status: { in: ["COMPLETED", "CLOSED"] },
          deletedAt: null,
          createdAt: { gte: startOfDay, lte: endOfDay },
        },
      }),
      prisma.order.count({
        where: {
          cashierId,
          status: { in: ["DRAFT", "QUEUED", "IN_PROGRESS"] },
          deletedAt: null,
        },
      }),
    ]);

    return {
      todayOrders: aggregations._count.id || 0,
      todaySales: Number(aggregations._sum.total || 0),
      pendingOrders: pendingCount,
    };
  }

  /**
   * Mendapatkan data tugas mekanik hari ini
   * @param {string} mechanicId - ID mekanik
   * @returns {Promise<Object>}
   */
  async getMechanicTodayTasks(mechanicId) {
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    const [pendingCount, completedStats] = await Promise.all([
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
      prisma.$queryRaw`
        SELECT COUNT(ma."id")::int as "completedCount", COALESCE(SUM(oi."subtotal"), 0)::bigint as "earnings"
        FROM "MechanicAssignment" ma
        INNER JOIN "OrderItem" oi ON ma."orderItemId" = oi."id"
        INNER JOIN "Order" o ON oi."orderId" = o."id"
        WHERE ma."mechanicId" = ${mechanicId}
          AND ma."endAt" >= ${startOfDay}::timestamp AND ma."endAt" <= ${endOfDay}::timestamp
          AND o."status" IN ('COMPLETED','CLOSED') AND o."deletedAt" IS NULL
      `,
    ]);

    return {
      pending: pendingCount,
      completed: Number(completedStats[0].completedCount),
      earnings: Number(completedStats[0].earnings),
    };
  }

  /**
   * Mendapatkan ringkasan statistik pelanggan
   * @param {Date} startDate - Tanggal mulai
   * @param {Date} endDate - Tanggal akhir
   * @returns {Promise<Object>}
   */
  async getCustomerSummary(startDate, endDate) {
    const [totalCustomers, newCustomers, activeCustomers, totalVehicles] =
      await Promise.all([
        prisma.customer.count(),
        prisma.customer.count({
          where: { createdAt: { gte: startDate, lte: endDate } },
        }),
        prisma.customer.count({
          where: {
            orders: {
              some: {
                createdAt: { gte: startDate, lte: endDate },
                status: { in: ["COMPLETED", "CLOSED"] },
                deletedAt: null,
              },
            },
          },
        }),
        prisma.vehicle.count(),
      ]);

    return { totalCustomers, newCustomers, activeCustomers, totalVehicles };
  }

  /**
   * Mendapatkan daftar pelanggan teratas berdasarkan total belanja
   * @param {Date} startDate - Tanggal mulai
   * @param {Date} endDate - Tanggal akhir
   * @param {Object} [options={}] - Opsi pagination
   * @returns {Promise<Object>}
   */
  async getTopCustomers(startDate, endDate, options = {}) {
    const page = options.page || 1;
    const limit = options.limit || 10;
    const offset = (page - 1) * limit;

    const countQuery = `
      SELECT COUNT(DISTINCT c."id")::int as "total"
      FROM "Customer" c
      INNER JOIN "Order" o ON c."id" = o."customerId"
      INNER JOIN "Payment" p ON o."id" = p."orderId"
      WHERE o."status" IN ('COMPLETED','CLOSED') AND o."deletedAt" IS NULL
        AND p."status" = 'PAID'
        AND o."createdAt" >= $1::timestamp AND o."createdAt" <= $2::timestamp
    `;

    const dataQuery = `
      SELECT c."id" as "customerId", c."name" as "customerName", c."phone",
        COUNT(DISTINCT o."id")::int as "totalOrders",
        COALESCE(SUM(o."total"), 0)::bigint as "totalSpent",
        COALESCE(AVG(o."total"), 0)::float as "averageOrderValue",
        MAX(o."createdAt") as "lastOrderDate",
        ARRAY_AGG(DISTINCT v."plateNumber") FILTER (WHERE v."plateNumber" IS NOT NULL) as "vehiclePlates"
      FROM "Customer" c
      INNER JOIN "Order" o ON c."id" = o."customerId"
      INNER JOIN "Payment" p ON o."id" = p."orderId"
      LEFT JOIN "Vehicle" v ON c."id" = v."customerId"
      WHERE o."status" IN ('COMPLETED','CLOSED') AND o."deletedAt" IS NULL
        AND p."status" = 'PAID'
        AND o."createdAt" >= $1::timestamp AND o."createdAt" <= $2::timestamp
      GROUP BY c."id", c."name", c."phone"
      ORDER BY "totalSpent" DESC
      LIMIT $3 OFFSET $4
    `;

    const [countResult, rawData] = await Promise.all([
      prisma.$queryRawUnsafe(countQuery, startDate, endDate),
      prisma.$queryRawUnsafe(dataQuery, startDate, endDate, limit, offset),
    ]);

    const total = Number(countResult[0].total);

    return {
      data: rawData.map((item) => ({
        customerId: item.customerId,
        customerName: item.customerName,
        phone: item.phone,
        totalOrders: Number(item.totalOrders),
        totalSpent: Number(item.totalSpent),
        averageOrderValue: Math.round(Number(item.averageOrderValue)),
        lastOrderDate: item.lastOrderDate,
        vehicles: item.vehiclePlates || [],
      })),
      metadata: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Mendapatkan akuisisi pelanggan baru harian
   * @param {Date} startDate - Tanggal mulai
   * @param {Date} endDate - Tanggal akhir
   * @returns {Promise<Array>}
   */
  async getDailyCustomerAcquisition(startDate, endDate) {
    const query = `
      WITH daily_new AS (
        SELECT DATE("createdAt") as date, COUNT("id")::int as "newCustomers"
        FROM "Customer" WHERE "createdAt" >= $1::timestamp AND "createdAt" <= $2::timestamp
        GROUP BY DATE("createdAt")
      )
      SELECT dn.date, dn."newCustomers", SUM(dn."newCustomers") OVER (ORDER BY dn.date)::int as "totalCustomers"
      FROM daily_new dn ORDER BY dn.date ASC
    `;

    const rawData = await prisma.$queryRawUnsafe(query, startDate, endDate);
    return rawData.map((item) => ({
      date: item.date,
      newCustomers: Number(item.newCustomers),
      totalCustomers: Number(item.totalCustomers),
    }));
  }

  /**
   * Mendapatkan distribusi frekuensi kunjungan pelanggan
   * @param {Date} startDate - Tanggal mulai
   * @param {Date} endDate - Tanggal akhir
   * @returns {Promise<Array>}
   */
  async getCustomerVisitFrequency(startDate, endDate) {
    const query = `
      WITH customer_visits AS (
        SELECT c."id", COUNT(DISTINCT o."id")::int as "visitCount"
        FROM "Customer" c
        INNER JOIN "Order" o ON c."id" = o."customerId"
        INNER JOIN "Payment" p ON o."id" = p."orderId"
        WHERE o."status" IN ('COMPLETED','CLOSED') AND o."deletedAt" IS NULL
          AND p."status" = 'PAID'
          AND o."createdAt" >= $1::timestamp AND o."createdAt" <= $2::timestamp
        GROUP BY c."id"
      ),
      total_customers AS (SELECT COUNT(*)::int as "total" FROM customer_visits)
      SELECT cv."visitCount", COUNT(cv."id")::int as "customerCount",
        (COUNT(cv."id")::float / tc."total" * 100) as "percentage"
      FROM customer_visits cv, total_customers tc
      GROUP BY cv."visitCount", tc."total"
      ORDER BY cv."visitCount" ASC
    `;

    const rawData = await prisma.$queryRawUnsafe(query, startDate, endDate);
    return rawData.map((item) => ({
      visitCount: Number(item.visitCount),
      customerCount: Number(item.customerCount),
      percentage: Math.round(Number(item.percentage) * 100) / 100,
    }));
  }

  /**
   * Mendapatkan detail riwayat transaksi per pelanggan
   * @param {string} customerId - ID pelanggan
   * @param {Date} startDate - Tanggal mulai
   * @param {Date} endDate - Tanggal akhir
   * @returns {Promise<Object|null>}
   */
  async getCustomerTransactionHistory(customerId, startDate, endDate) {
    const [customer, orders, summary] = await Promise.all([
      prisma.customer.findUnique({
        where: { id: customerId },
        select: {
          id: true,
          name: true,
          phone: true,
          createdAt: true,
          vehicles: {
            select: { id: true, plateNumber: true, brand: true, model: true },
          },
        },
      }),
      prisma.order.findMany({
        where: {
          customerId,
          status: { in: ["COMPLETED", "CLOSED"] },
          deletedAt: null,
          payment: { status: "PAID" },
          createdAt: { gte: startDate, lte: endDate },
        },
        select: {
          id: true,
          orderNumber: true,
          status: true,
          total: true,
          createdAt: true,
          vehicle: { select: { id: true, plateNumber: true } },
          payment: { select: { method: true, amountPaid: true } },
          items: {
            select: {
              id: true,
              productNameSnapshot: true,
              quantity: true,
              unitPrice: true,
              subtotal: true,
              product: { select: { type: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.order.aggregate({
        where: {
          customerId,
          status: { in: ["COMPLETED", "CLOSED"] },
          deletedAt: null,
          payment: { status: "PAID" },
          createdAt: { gte: startDate, lte: endDate },
        },
        _sum: { total: true },
        _count: { id: true },
        _avg: { total: true },
      }),
    ]);
    if (!customer) return null;

    return {
      customer: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        registeredAt: customer.createdAt,
        vehicles: customer.vehicles,
      },
      orders: orders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        total: o.total,
        createdAt: o.createdAt,
        vehiclePlate: o.vehicle?.plateNumber || null,
        paymentMethod: o.payment?.method || null,
        amountPaid: o.payment?.amountPaid || 0,
        items: o.items.map((i) => ({
          id: i.id,
          name: i.productNameSnapshot,
          type: i.product.type,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          subtotal: i.subtotal,
        })),
      })),
      summary: {
        totalOrders: summary._count.id,
        totalSpent: Number(summary._sum.total || 0),
        averageOrderValue: Math.round(Number(summary._avg.total || 0)),
      },
    };
  }

  /**
   * Mendapatkan daftar pelanggan yang sudah lama tidak bertransaksi
   * @param {Object} [options={}] - Opsi
   * @param {number} [options.daysThreshold=30] - Batas hari tanpa transaksi
   * @param {number} [options.page=1] - Halaman
   * @param {number} [options.limit=20] - Jumlah per halaman
   * @returns {Promise<Object>}
   */
  async getInactiveCustomers(options = {}) {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const daysThreshold = options.daysThreshold || 30;
    const offset = (page - 1) * limit;
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - daysThreshold);

    const dataQuery = `
      SELECT c."id" as "customerId", c."name" as "customerName", c."phone",
        MAX(o."createdAt") as "lastOrderDate",
        COUNT(DISTINCT o."id")::int as "totalOrders",
        COALESCE(SUM(o."total"), 0)::bigint as "totalSpent",
        EXTRACT(DAY FROM (NOW() - MAX(o."createdAt")))::int as "daysSinceLastOrder"
      FROM "Customer" c
      LEFT JOIN "Order" o ON c."id" = o."customerId" AND o."status" IN ('COMPLETED','CLOSED') AND o."deletedAt" IS NULL
      LEFT JOIN "Payment" p ON o."id" = p."orderId" AND p."status" = 'PAID'
      GROUP BY c."id", c."name", c."phone"
      HAVING MAX(o."createdAt") IS NULL OR MAX(o."createdAt") < $1::timestamp
      ORDER BY "daysSinceLastOrder" DESC NULLS FIRST
      LIMIT $2 OFFSET $3
    `;

    const rawData = await prisma.$queryRawUnsafe(
      dataQuery,
      thresholdDate,
      limit,
      offset
    );
    const total = rawData.length;

    return {
      data: rawData.map((item) => ({
        customerId: item.customerId,
        customerName: item.customerName,
        phone: item.phone,
        lastOrderDate: item.lastOrderDate,
        daysSinceLastOrder: item.daysSinceLastOrder,
        totalOrders: Number(item.totalOrders),
        totalSpent: Number(item.totalSpent),
      })),
      metadata: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Mendapatkan retensi pelanggan bulanan
   * @param {Date} startDate - Tanggal mulai
   * @param {Date} endDate - Tanggal akhir
   * @returns {Promise<Array>}
   */
  async getMonthlyCustomerRetention(startDate, endDate) {
    const query = `
      WITH monthly_customers AS (
        SELECT DATE_TRUNC('month', o."createdAt") as month, c."id" as "customerId",
          MIN(DATE_TRUNC('month', o."createdAt")) OVER (PARTITION BY c."id") as "firstPurchaseMonth"
        FROM "Customer" c
        INNER JOIN "Order" o ON c."id" = o."customerId"
        INNER JOIN "Payment" p ON o."id" = p."orderId"
        WHERE o."status" IN ('COMPLETED','CLOSED') AND o."deletedAt" IS NULL AND p."status" = 'PAID'
          AND o."createdAt" >= $1::timestamp AND o."createdAt" <= $2::timestamp
        GROUP BY month, c."id"
      )
      SELECT month::date as month,
        COUNT(DISTINCT CASE WHEN "firstPurchaseMonth" = month THEN "customerId" END)::int as "newCustomers",
        COUNT(DISTINCT CASE WHEN "firstPurchaseMonth" < month THEN "customerId" END)::int as "returningCustomers",
        COUNT(DISTINCT "customerId")::int as "totalActiveCustomers",
        CASE WHEN COUNT(DISTINCT "customerId") > 0 
          THEN (COUNT(DISTINCT CASE WHEN "firstPurchaseMonth" < month THEN "customerId" END)::float / COUNT(DISTINCT "customerId") * 100)
          ELSE 0 END as "retentionRate"
      FROM monthly_customers GROUP BY month ORDER BY month ASC
    `;

    const rawData = await prisma.$queryRawUnsafe(query, startDate, endDate);
    return rawData.map((item) => ({
      month: item.month,
      newCustomers: Number(item.newCustomers),
      returningCustomers: Number(item.returningCustomers),
      totalActiveCustomers: Number(item.totalActiveCustomers),
      retentionRate: Math.round(Number(item.retentionRate) * 100) / 100,
    }));
  }

  /**
   * Mendapatkan metrik customer lifetime value
   * @param {Object} [options={}] - Opsi pagination
   * @returns {Promise<Object>}
   */
  async getCustomerLifetimeValue(options = {}) {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const offset = (page - 1) * limit;

    const dataQuery = `
      SELECT c."id" as "customerId", c."name" as "customerName", c."phone",
        COUNT(DISTINCT o."id")::int as "totalOrders",
        COALESCE(SUM(o."total"), 0)::bigint as "totalSpent",
        COALESCE(AVG(o."total"), 0)::float as "averageOrderValue",
        MIN(o."createdAt") as "firstOrderDate", MAX(o."createdAt") as "lastOrderDate",
        EXTRACT(DAY FROM (MAX(o."createdAt") - MIN(o."createdAt")))::int as "customerLifespanDays"
      FROM "Customer" c
      INNER JOIN "Order" o ON c."id" = o."customerId"
      INNER JOIN "Payment" p ON o."id" = p."orderId"
      WHERE o."status" IN ('COMPLETED','CLOSED') AND o."deletedAt" IS NULL AND p."status" = 'PAID'
      GROUP BY c."id", c."name", c."phone"
      HAVING COUNT(DISTINCT o."id") > 1
      ORDER BY "totalSpent" DESC
      LIMIT $1 OFFSET $2
    `;

    const rawData = await prisma.$queryRawUnsafe(dataQuery, limit, offset);
    const total = rawData.length;

    return {
      data: rawData.map((item) => ({
        customerId: item.customerId,
        customerName: item.customerName,
        phone: item.phone,
        totalOrders: Number(item.totalOrders),
        totalSpent: Number(item.totalSpent),
        averageOrderValue: Math.round(Number(item.averageOrderValue)),
        firstOrderDate: item.firstOrderDate,
        lastOrderDate: item.lastOrderDate,
        customerLifespanDays: item.customerLifespanDays,
        clv:
          item.customerLifespanDays > 0
            ? Math.round(
                (Number(item.totalSpent) / Number(item.totalOrders)) *
                  (Number(item.totalOrders) / (item.customerLifespanDays / 30))
              )
            : Number(item.totalSpent),
      })),
      metadata: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Mendapatkan ringkasan kendaraan pelanggan
   * @returns {Promise<Object>}
   */
  async getVehicleSummary() {
    const [totalVehicles, byBrand, recentVehicles] = await Promise.all([
      prisma.vehicle.count(),
      prisma.vehicle.groupBy({
        by: ["brand"],
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        where: { brand: { not: null } },
      }),
      prisma.vehicle.findMany({
        take: 20,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          plateNumber: true,
          brand: true,
          model: true,
          customer: { select: { name: true } },
          _count: { select: { orders: true } },
        },
      }),
    ]);

    return {
      totalVehicles,
      byBrand: byBrand.map((item) => ({
        brand: item.brand,
        count: Number(item._count.id),
      })),
      recentVehicles: recentVehicles.map((v) => ({
        id: v.id,
        plateNumber: v.plateNumber,
        brand: v.brand,
        model: v.model,
        customerName: v.customer.name,
        orderCount: v._count.orders,
      })),
    };
  }
}

export default ReportRepository;
