import ReportRepository from "#repository/reportRepository.js";
import ApiError from "#shared/utils/error.js";
import Storage from "#shared/utils/storage.js";
import prisma from "#app/database.js";
import logger from "#app/logger.js";

class ReportService {
  /**
   * Inisialisasi ReportService
   * @constructor
   */
  constructor() {
    this.reportRepo = new ReportRepository();
  }

  /**
   * Menambahkan signed URL ke image path
   * @param {string|null} path - Image path
   * @returns {Promise<string|null>} Signed URL atau null
   * @private
   */
  async #getSignedUrl(path) {
    if (!path) return null;
    return Storage.getSignedUrl(path);
  }

  /**
   * Mendapatkan rentang tanggal berdasarkan periode
   * @param {string} period - 'daily' | 'weekly' | 'monthly' | 'yearly'
   * @param {Object} [options={}]
   * @param {Date|string} [options.referenceDate] - Tanggal referensi (default: sekarang)
   * @returns {{startDate: Date, endDate: Date, labels: string[]}}
   * @throws {ApiError} 400 - Periode tidak valid
   * @private
   */
  #getPeriodRange(period, options = {}) {
    const reference = options.referenceDate
      ? new Date(options.referenceDate)
      : new Date();
    const startDate = new Date(reference);
    const endDate = new Date(reference);
    let labels = [];

    switch (period) {
      case "daily": {
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        labels = Array.from(
          { length: 24 },
          (_, i) => `${String(i).padStart(2, "0")}:00`
        );
        break;
      }
      case "weekly": {
        startDate.setDate(startDate.getDate() - 6);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        labels = Array.from({ length: 7 }, (_, i) => {
          const d = new Date(startDate);
          d.setDate(d.getDate() + i);
          return d.toISOString().split("T")[0];
        });
        break;
      }
      case "monthly": {
        startDate.setDate(startDate.getDate() - 29);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        labels = Array.from({ length: 30 }, (_, i) => {
          const d = new Date(startDate);
          d.setDate(d.getDate() + i);
          return d.toISOString().split("T")[0];
        });
        break;
      }
      case "yearly": {
        startDate.setFullYear(startDate.getFullYear() - 1);
        startDate.setDate(startDate.getDate() + 1);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        labels = Array.from({ length: 12 }, (_, i) => {
          const d = new Date(startDate);
          d.setMonth(d.getMonth() + i);
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
            2,
            "0"
          )}`;
        });
        break;
      }
      default:
        throw ApiError.badRequest({
          message: `Periode '${period}' tidak valid. Gunakan 'daily', 'weekly', 'monthly', atau 'yearly'.`,
        });
    }

    return { startDate, endDate, labels };
  }

  /**
   * Mendapatkan ringkasan penjualan berdasarkan periode (termasuk PPh UMKM)
   * @param {string} [period='monthly'] - 'daily' | 'weekly' | 'monthly' | 'yearly'
   * @param {Object} [options={}]
   * @param {Date|string} [options.referenceDate] - Tanggal referensi
   * @returns {Promise<Object>} Ringkasan penjualan dengan totalPPH, pphRate
   * @throws {ApiError} 400 - Periode tidak valid
   */
  async getSalesSummary(period = "monthly", options = {}) {
    const { startDate, endDate, labels } = this.#getPeriodRange(
      period,
      options
    );
    logger.info("Mengambil ringkasan penjualan", {
      period,
      startDate,
      endDate,
    });

    const [salesData, dailySales, hourlySales] = await Promise.all([
      this.reportRepo.getSalesData(startDate, endDate),
      this.reportRepo.getDailySalesSummary(startDate, endDate),
      period === "daily"
        ? this.reportRepo.getHourlySalesSummary(startDate, endDate)
        : Promise.resolve(null),
    ]);

    return {
      period,
      dateRange: { startDate, endDate },
      labels,
      summary: {
        totalOrders: salesData.totalOrders,
        totalSales: salesData.totalSales,
        totalSubtotal: salesData.totalSubtotal,
        totalTax: salesData.totalTax,
        totalPPH: salesData.totalPPH, // ✅ PPh UMKM dari repository
        pphRate: salesData.pphRate, // ✅ Rate PPh dari settings
        averageOrderValue: salesData.averageOrderValue,
      },
      breakdown: period === "daily" ? hourlySales : dailySales,
    };
  }

  /**
   * Mendapatkan laporan laba rugi berdasarkan periode (termasuk PPh UMKM)
   * @param {string} [period='monthly'] - 'daily' | 'weekly' | 'monthly' | 'yearly'
   * @param {Object} [options={}]
   * @returns {Promise<Object>} Laporan laba rugi dengan netProfitAfterPPH, netMarginAfterPPH
   * @throws {ApiError} 400 - Periode tidak valid
   */
  async getProfitLossReport(period = "monthly", options = {}) {
    const { startDate, endDate, labels } = this.#getPeriodRange(
      period,
      options
    );
    logger.info("Mengambil laporan laba rugi", { period, startDate, endDate });

    const [profitLossData, dailyProfitLoss] = await Promise.all([
      this.reportRepo.getProfitLossData(startDate, endDate),
      this.reportRepo.getDailyProfitLossSummary(startDate, endDate),
    ]);

    return {
      period,
      dateRange: { startDate, endDate },
      labels,
      summary: {
        grossRevenue: profitLossData.grossRevenue,
        totalCogs: profitLossData.totalCogs,
        grossProfit: profitLossData.grossProfit,
        grossMargin: profitLossData.grossMargin,
        totalOperatingExpenses: profitLossData.totalOperatingExpenses,
        netProfit: profitLossData.netProfit,
        netMargin: profitLossData.netMargin,
        totalPPH: profitLossData.totalPPH, // ✅ PPh UMKM
        pphRate: profitLossData.pphRate, // ✅ Rate PPh
        netProfitAfterPPH: profitLossData.netProfitAfterPPH, // ✅ Laba setelah PPh
        netMarginAfterPPH: profitLossData.netMarginAfterPPH, // ✅ Margin setelah PPh
      },
      breakdown: dailyProfitLoss,
    };
  }

  /**
   * Mendapatkan laporan shift
   * @param {string} shiftId - ID shift
   * @returns {Promise<Object>} Laporan shift
   * @throws {ApiError} 404 - Shift tidak ditemukan
   */
  async getShiftReport(shiftId) {
    logger.info("Mengambil laporan shift", { shiftId });

    const report = await this.reportRepo.getShiftSummary(shiftId);

    if (!report) {
      throw ApiError.notFound({
        message: `Shift dengan ID '${shiftId}' tidak ditemukan.`,
      });
    }

    return report;
  }

  /**
   * Mendapatkan laporan inventori dengan pagination
   * @param {Object} [options={}]
   * @param {number} [options.page=1] - Halaman
   * @param {number} [options.limit=10] - Jumlah per halaman
   * @returns {Promise<Object>} Laporan inventori dengan signed URLs
   */
  async getInventoryReport(options = {}) {
    logger.info("Mengambil laporan inventori", options);

    const snapshot = await this.reportRepo.getInventorySnapshot(options);

    const items = await Promise.all(
      snapshot.items.map(async (item) => ({
        ...item,
        image: await this.#getSignedUrl(item.image),
      }))
    );

    return {
      summary: snapshot.summary,
      items,
      metadata: snapshot.metadata,
    };
  }

  /**
   * Mendapatkan laporan produk terlaris berdasarkan periode dengan pagination
   * @param {string} [period='monthly'] - 'daily' | 'weekly' | 'monthly' | 'yearly'
   * @param {Object} [options={}]
   * @param {number} [options.page=1] - Halaman
   * @param {number} [options.limit=10] - Jumlah per halaman
   * @param {Date|string} [options.referenceDate]
   * @returns {Promise<Object>} Laporan produk terlaris dengan signed image URLs
   * @throws {ApiError} 400 - Periode tidak valid
   */
  async getTopProductsReport(period = "monthly", options = {}) {
    const { startDate, endDate } = this.#getPeriodRange(period, options);
    logger.info("Mengambil laporan produk terlaris", {
      period,
      startDate,
      endDate,
      ...options,
    });

    const result = await this.reportRepo.getProductSalesReport(
      startDate,
      endDate,
      options
    );

    const productsWithImages = await Promise.all(
      result.data.map(async (product) => ({
        ...product,
        image: await this.#getSignedUrl(product.image),
      }))
    );

    const totalQuantity = productsWithImages.reduce(
      (sum, p) => sum + p.quantitySold,
      0
    );
    const totalRevenue = productsWithImages.reduce(
      (sum, p) => sum + p.totalRevenue,
      0
    );
    const totalProfit = productsWithImages.reduce(
      (sum, p) => sum + p.profit,
      0
    );

    return {
      period,
      dateRange: { startDate, endDate },
      summary: {
        totalQuantity,
        totalRevenue,
        totalProfit,
        productCount: result.metadata.total,
      },
      products: productsWithImages,
      metadata: result.metadata,
    };
  }

  /**
   * Mendapatkan laporan performa mekanik berdasarkan periode dengan pagination
   * @param {string} [period='monthly'] - 'daily' | 'weekly' | 'monthly' | 'yearly'
   * @param {Object} [options={}]
   * @param {number} [options.page=1] - Halaman
   * @param {number} [options.limit=10] - Jumlah per halaman
   * @returns {Promise<Object>} Laporan performa mekanik
   * @throws {ApiError} 400 - Periode tidak valid
   */
  async getMechanicPerformanceReport(period = "monthly", options = {}) {
    const { startDate, endDate } = this.#getPeriodRange(period, options);
    logger.info("Mengambil laporan performa mekanik", {
      period,
      startDate,
      endDate,
      ...options,
    });

    const result = await this.reportRepo.getMechanicPerformanceReport(
      startDate,
      endDate,
      options
    );

    const totalTasks = result.data.reduce((sum, m) => sum + m.totalTasks, 0);
    const totalCompleted = result.data.reduce(
      (sum, m) => sum + m.completedTasks,
      0
    );
    const totalEarnings = result.data.reduce(
      (sum, m) => sum + m.totalEarnings,
      0
    );

    return {
      period,
      dateRange: { startDate, endDate },
      summary: {
        totalMechanics: result.metadata.total,
        totalTasks,
        totalCompleted,
        totalEarnings,
        averageCompletionRate:
          totalTasks > 0
            ? Math.round((totalCompleted / totalTasks) * 100 * 100) / 100
            : 0,
      },
      mechanics: result.data,
      metadata: result.metadata,
    };
  }

  /**
   * Mendapatkan ringkasan dashboard berdasarkan role
   * @param {string} role - Role user (ADMIN, CASHIER, MECHANIC)
   * @param {string} [userId] - ID user
   * @returns {Promise<Object>} Ringkasan dashboard
   * @throws {ApiError} 400 - Role tidak valid
   * @throws {ApiError} 400 - User ID diperlukan untuk role CASHIER/MECHANIC
   */
  async getDashboardSummary(role, userId = null) {
    logger.info("Mengambil ringkasan dashboard", { role, userId });

    switch (role) {
      case "ADMIN":
        return await this.#getAdminDashboard();
      case "CASHIER":
        if (!userId) {
          throw ApiError.badRequest({
            message: "User ID diperlukan untuk dashboard kasir.",
          });
        }
        return await this.#getCashierDashboard(userId);
      case "MECHANIC":
        if (!userId) {
          throw ApiError.badRequest({
            message: "User ID diperlukan untuk dashboard mekanik.",
          });
        }
        return await this.#getMechanicDashboard(userId);
      default:
        throw ApiError.badRequest({
          message: `Role '${role}' tidak valid untuk dashboard. Gunakan 'ADMIN', 'CASHIER', atau 'MECHANIC'.`,
        });
    }
  }

  /**
   * Dashboard untuk Admin (termasuk PPN & PPh UMKM)
   * @returns {Promise<Object>}
   * @private
   */
  async #getAdminDashboard() {
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    startOfMonth.setHours(0, 0, 0, 0);

    const lowThresholdSetting = await prisma.setting.findUnique({
      where: { key: "stock_low_threshold" },
      select: { value: true },
    });
    const lowThreshold = parseInt(lowThresholdSetting?.value || "5", 10);

    const [
      todaySales,
      monthSales,
      activeShift,
      pendingCount,
      productSummary,
      lowStockResult,
      customerSummary,
    ] = await Promise.all([
      this.reportRepo.getSalesData(startOfDay, endOfDay),
      this.reportRepo.getSalesData(startOfMonth, endOfDay),
      this.reportRepo.getActiveShift(),
      this.reportRepo.countOrdersByStatus(["DRAFT", "QUEUED", "IN_PROGRESS"]),
      this.reportRepo.getProductSummary(),
      this.reportRepo.getLowStockProducts({
        threshold: lowThreshold,
        page: 1,
        limit: 10,
      }),
      this.reportRepo.getCustomerSummary(startOfMonth, endOfDay),
    ]);

    const lowStockWithImages = await Promise.all(
      lowStockResult.data.map(async (p) => ({
        id: p.id,
        sku: p.sku,
        name: p.name,
        stock: p.stock,
        stockStatus: p.stockStatus,
        image: await this.#getSignedUrl(p.image),
      }))
    );

    return {
      today: {
        date: startOfDay,
        orders: todaySales.totalOrders,
        revenue: todaySales.totalSales,
        ppn: todaySales.totalTax,
        pph: todaySales.totalPPH,
        pphRate: todaySales.pphRate,
        averageOrderValue: todaySales.averageOrderValue,
      },
      thisMonth: {
        orders: monthSales.totalOrders,
        revenue: monthSales.totalSales,
        ppn: monthSales.totalTax,
        pph: monthSales.totalPPH,
        pphRate: monthSales.pphRate,
        newCustomers: customerSummary.newCustomers,
        activeCustomers: customerSummary.activeCustomers,
      },
      pending: { orders: pendingCount },
      activeShift: activeShift
        ? {
            id: activeShift.id,
            cashier: activeShift.cashier?.fullName || null,
            openedAt: activeShift.openedAt,
            startingCash: activeShift.startingCash,
            currentCashSales: activeShift.cashSales,
            orderCount: activeShift._count?.orders || 0,
          }
        : null,
      inventory: {
        totalProducts: productSummary.totalProducts,
        activeProducts: productSummary.activeProducts,
        lowStockCount: productSummary.lowStockCount,
        outOfStockCount: productSummary.outOfStockCount,
        totalStockValue: productSummary.totalStockValue,
        lowStockThreshold: lowThreshold,
        lowStockProducts: lowStockWithImages,
      },
      customers: {
        totalCustomers: customerSummary.totalCustomers,
        newThisMonth: customerSummary.newCustomers,
        activeThisMonth: customerSummary.activeCustomers,
        totalVehicles: customerSummary.totalVehicles,
      },
    };
  }

  /**
   * Dashboard untuk Kasir
   * @param {string} cashierId - ID kasir
   * @returns {Promise<Object>}
   * @private
   */
  async #getCashierDashboard(cashierId) {
    const [activeShift, todaySales] = await Promise.all([
      this.reportRepo.getActiveShift(),
      this.reportRepo.getCashierTodaySales(cashierId),
    ]);

    const recentOrders = await prisma.order.findMany({
      where: { cashierId, deletedAt: null },
      select: {
        id: true,
        orderNumber: true,
        total: true,
        status: true,
        createdAt: true,
        customer: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    return {
      activeShift: activeShift
        ? {
            id: activeShift.id,
            openedAt: activeShift.openedAt,
            startingCash: activeShift.startingCash,
            currentCashSales: activeShift.cashSales,
            orderCount: activeShift._count?.orders || 0,
          }
        : null,
      todaySales: {
        todayOrders: todaySales.todayOrders,
        todaySales: todaySales.todaySales,
        pendingOrders: todaySales.pendingOrders,
      },
      recentOrders,
    };
  }

  /**
   * Dashboard untuk Mekanik
   * @param {string} mechanicId - ID mekanik
   * @returns {Promise<Object>}
   * @private
   */
  async #getMechanicDashboard(mechanicId) {
    const [todayTasks, overallStats, pendingAssignments] = await Promise.all([
      this.reportRepo.getMechanicTodayTasks(mechanicId),
      this.reportRepo.getMechanicTaskStats(mechanicId),
      prisma.mechanicAssignment.findMany({
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
          id: true,
          startAt: true,
          orderItem: {
            select: {
              id: true,
              productNameSnapshot: true,
              order: {
                select: {
                  id: true,
                  orderNumber: true,
                  status: true,
                  vehicle: { select: { plateNumber: true } },
                },
              },
            },
          },
        },
        orderBy: { createdAt: "asc" },
        take: 10,
      }),
    ]);

    return {
      todayTasks: {
        pending: todayTasks.pending,
        completed: todayTasks.completed,
        earnings: todayTasks.earnings,
      },
      overallStats: {
        total: overallStats.totalTasks,
        completed: overallStats.completedTasks,
        pending: overallStats.pendingTasks,
        completionRate:
          overallStats.totalTasks > 0
            ? Math.round(
                (overallStats.completedTasks / overallStats.totalTasks) *
                  100 *
                  100
              ) / 100
            : 0,
      },
      pendingTasks: pendingAssignments.map((a) => ({
        assignmentId: a.id,
        orderItemId: a.orderItem?.id,
        serviceName: a.orderItem?.productNameSnapshot,
        orderId: a.orderItem?.order?.id,
        orderNumber: a.orderItem?.order?.orderNumber,
        status: a.orderItem?.order?.status,
        plateNumber: a.orderItem?.order?.vehicle?.plateNumber,
        startAt: a.startAt,
      })),
    };
  }

  /**
   * Mendapatkan laporan pengeluaran berdasarkan periode
   * @param {string} [period='monthly'] - 'daily' | 'weekly' | 'monthly' | 'yearly'
   * @param {Object} [options={}]
   * @param {string} [options.category] - Filter kategori
   * @param {string} [options.shiftId] - Filter shift ID
   * @returns {Promise<Object>} Laporan pengeluaran
   * @throws {ApiError} 400 - Periode tidak valid
   */
  async getExpenseReport(period = "monthly", options = {}) {
    const { startDate, endDate, labels } = this.#getPeriodRange(
      period,
      options
    );
    logger.info("Mengambil laporan pengeluaran", {
      period,
      startDate,
      endDate,
    });

    const filters = {};
    if (options.category) filters.category = options.category;
    if (options.shiftId) filters.shiftId = options.shiftId;

    const [expensesSummary, dailyExpenses] = await Promise.all([
      this.reportRepo.getExpensesSummary(startDate, endDate, filters),
      this.reportRepo.getDailyExpensesSummary(startDate, endDate),
    ]);

    return {
      period,
      dateRange: { startDate, endDate },
      labels,
      filters,
      summary: expensesSummary,
      breakdown: dailyExpenses,
    };
  }

  /**
   * Mendapatkan laporan pembayaran berdasarkan periode
   * @param {string} [period='monthly'] - 'daily' | 'weekly' | 'monthly' | 'yearly'
   * @param {Object} [options={}]
   * @param {string} [options.method] - Filter metode pembayaran
   * @param {string} [options.status] - Filter status pembayaran
   * @returns {Promise<Object>} Laporan pembayaran
   * @throws {ApiError} 400 - Periode tidak valid
   */
  async getPaymentReport(period = "monthly", options = {}) {
    const { startDate, endDate, labels } = this.#getPeriodRange(
      period,
      options
    );
    logger.info("Mengambil laporan pembayaran", { period, startDate, endDate });

    const filters = {};
    if (options.method) filters.method = options.method;
    if (options.status) filters.status = options.status;

    const paymentSummary = await this.reportRepo.getPaymentSummary(
      startDate,
      endDate,
      filters
    );

    return {
      period,
      dateRange: { startDate, endDate },
      labels,
      filters,
      summary: {
        totalAmount: paymentSummary.totalAmount,
        totalCount: paymentSummary.totalCount,
        byMethod: paymentSummary.byMethod,
        byStatus: paymentSummary.byStatus,
      },
      breakdown: paymentSummary.daily,
    };
  }

  /**
   * Mendapatkan laporan pergerakan stok dengan pagination
   * @param {string} productId - ID produk
   * @param {string} [period='monthly'] - 'daily' | 'weekly' | 'monthly' | 'yearly'
   * @param {Object} [options={}]
   * @param {number} [options.page=1] - Halaman
   * @param {number} [options.limit=10] - Jumlah per halaman
   * @returns {Promise<Object>} Laporan pergerakan stok
   * @throws {ApiError} 400 - Periode tidak valid
   * @throws {ApiError} 404 - Produk tidak ditemukan
   */
  async getStockMovementReport(productId, period = "monthly", options = {}) {
    const { startDate, endDate } = this.#getPeriodRange(period, options);
    logger.info("Mengambil laporan pergerakan stok", {
      productId,
      period,
      startDate,
      endDate,
    });

    const [movementSummary, stockConsistency] = await Promise.all([
      this.reportRepo.getMovementSummary(
        productId,
        startDate,
        endDate,
        options
      ),
      this.reportRepo.validateStockConsistency(productId),
    ]);

    if (!stockConsistency) {
      throw ApiError.notFound({
        message: `Produk dengan ID '${productId}' tidak ditemukan.`,
      });
    }

    return {
      period,
      dateRange: { startDate, endDate },
      productId,
      movement: {
        IN: movementSummary.IN,
        OUT: movementSummary.OUT,
        ADJUSTMENT: movementSummary.ADJUSTMENT,
        netChange: movementSummary.netChange,
        movements: movementSummary.movements,
        metadata: movementSummary.metadata,
      },
      consistency: stockConsistency,
    };
  }

  /**
   * Mendapatkan statistik task per order
   * @param {string} orderId - ID order
   * @returns {Promise<Object>} Statistik task
   */
  async getTaskStatsByOrder(orderId) {
    logger.info("Mengambil statistik task order", { orderId });
    return this.reportRepo.getTaskStatsByOrder(orderId);
  }

  /**
   * Mendapatkan statistik tugas mekanik
   * @param {string} mechanicId - ID mekanik
   * @returns {Promise<Object>} Statistik tugas
   */
  async getMechanicTaskStats(mechanicId) {
    logger.info("Mengambil statistik tugas mekanik", { mechanicId });
    return this.reportRepo.getMechanicTaskStats(mechanicId);
  }

  /**
   * Mendapatkan total pendapatan mekanik berdasarkan periode
   * @param {string} mechanicId - ID mekanik
   * @param {string} [period='monthly'] - 'daily' | 'weekly' | 'monthly' | 'yearly'
   * @param {Object} [options={}]
   * @returns {Promise<Object>} Pendapatan mekanik
   * @throws {ApiError} 400 - Periode tidak valid
   */
  async getMechanicEarnings(mechanicId, period = "monthly", options = {}) {
    const { startDate, endDate } = this.#getPeriodRange(period, options);
    logger.info("Mengambil pendapatan mekanik", {
      mechanicId,
      period,
      startDate,
      endDate,
    });

    const earnings = await this.reportRepo.getTotalEarningsByMechanic(
      mechanicId,
      startDate,
      endDate
    );

    return {
      mechanicId,
      period,
      dateRange: { startDate, endDate },
      ...earnings,
    };
  }

  /**
   * Mendapatkan ringkasan pelanggan berdasarkan periode
   * @param {string} [period='monthly'] - 'daily' | 'weekly' | 'monthly' | 'yearly'
   * @param {Object} [options={}]
   * @returns {Promise<Object>} Ringkasan pelanggan
   * @throws {ApiError} 400 - Periode tidak valid
   */
  async getCustomerSummary(period = "monthly", options = {}) {
    const { startDate, endDate, labels } = this.#getPeriodRange(
      period,
      options
    );
    logger.info("Mengambil ringkasan pelanggan", {
      period,
      startDate,
      endDate,
    });

    const [
      customerSummary,
      dailyAcquisition,
      visitFrequency,
      topCustomersResult,
      retention,
    ] = await Promise.all([
      this.reportRepo.getCustomerSummary(startDate, endDate),
      this.reportRepo.getDailyCustomerAcquisition(startDate, endDate),
      this.reportRepo.getCustomerVisitFrequency(startDate, endDate),
      this.reportRepo.getTopCustomers(startDate, endDate, {
        page: 1,
        limit: 10,
      }),
      this.reportRepo.getMonthlyCustomerRetention(startDate, endDate),
    ]);

    return {
      period,
      dateRange: { startDate, endDate },
      labels,
      summary: customerSummary,
      acquisition: dailyAcquisition,
      visitFrequency,
      retention,
      topCustomers: topCustomersResult.data,
      topCustomersMetadata: topCustomersResult.metadata,
    };
  }

  /**
   * Mendapatkan daftar top customers dengan pagination
   * @param {string} [period='monthly'] - 'daily' | 'weekly' | 'monthly' | 'yearly'
   * @param {Object} [options={}]
   * @param {number} [options.page=1] - Halaman
   * @param {number} [options.limit=10] - Jumlah per halaman
   * @returns {Promise<Object>} Top customers
   * @throws {ApiError} 400 - Periode tidak valid
   */
  async getTopCustomers(period = "monthly", options = {}) {
    const { startDate, endDate } = this.#getPeriodRange(period, options);
    logger.info("Mengambil top customers", {
      period,
      startDate,
      endDate,
      ...options,
    });

    return this.reportRepo.getTopCustomers(startDate, endDate, options);
  }

  /**
   * Mendapatkan detail riwayat transaksi pelanggan
   * @param {string} customerId - ID pelanggan
   * @param {string} [period='monthly'] - 'daily' | 'weekly' | 'monthly' | 'yearly'
   * @param {Object} [options={}]
   * @returns {Promise<Object>} Riwayat transaksi pelanggan
   * @throws {ApiError} 400 - Periode tidak valid
   * @throws {ApiError} 404 - Pelanggan tidak ditemukan
   */
  async getCustomerTransactionHistory(
    customerId,
    period = "monthly",
    options = {}
  ) {
    const { startDate, endDate } = this.#getPeriodRange(period, options);
    logger.info("Mengambil riwayat transaksi pelanggan", {
      customerId,
      period,
      startDate,
      endDate,
    });

    const result = await this.reportRepo.getCustomerTransactionHistory(
      customerId,
      startDate,
      endDate
    );

    if (!result) {
      throw ApiError.notFound({
        message: `Pelanggan dengan ID '${customerId}' tidak ditemukan.`,
      });
    }

    return result;
  }

  /**
   * Mendapatkan daftar pelanggan tidak aktif dengan pagination
   * @param {Object} [options={}]
   * @param {number} [options.daysThreshold=30] - Batas hari tanpa transaksi
   * @param {number} [options.page=1] - Halaman
   * @param {number} [options.limit=20] - Jumlah per halaman
   * @returns {Promise<Object>} Daftar pelanggan tidak aktif
   */
  async getInactiveCustomers(options = {}) {
    logger.info("Mengambil pelanggan tidak aktif", options);

    const result = await this.reportRepo.getInactiveCustomers(options);

    return {
      daysThreshold: options.daysThreshold || 30,
      customers: result.data,
      metadata: result.metadata,
    };
  }

  /**
   * Mendapatkan customer lifetime value dengan pagination
   * @param {Object} [options={}]
   * @param {number} [options.page=1] - Halaman
   * @param {number} [options.limit=20] - Jumlah per halaman
   * @returns {Promise<Object>} Data CLV pelanggan
   */
  async getCustomerLifetimeValue(options = {}) {
    logger.info("Mengambil customer lifetime value", options);

    const result = await this.reportRepo.getCustomerLifetimeValue(options);

    return {
      customers: result.data,
      metadata: result.metadata,
    };
  }

  /**
   * Mendapatkan ringkasan kendaraan pelanggan
   * @returns {Promise<Object>} Ringkasan kendaraan
   */
  async getVehicleSummary() {
    logger.info("Mengambil ringkasan kendaraan");
    return this.reportRepo.getVehicleSummary();
  }
}

export default ReportService;
