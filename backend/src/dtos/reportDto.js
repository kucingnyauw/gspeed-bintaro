/**
 * Data Transfer Object untuk response Report
 * @module dtos/reportDto
 */

/**
 * Base DTO class untuk memastikan spread compatibility
 * @class BaseDto
 */
class BaseDto {
  /**
   * Convert DTO ke plain object
   * @returns {Object}
   */
  toJSON() {
    return { ...this };
  }
}

/**
 * DTO untuk ringkasan data penjualan
 * @class SalesDataDto
 * @extends BaseDto
 */
class SalesDataDto extends BaseDto {
  /**
   * @param {Object} data - Data agregat penjualan
   */
  constructor(data) {
    super();
    this.totalOrders = data.totalOrders || 0;
    this.totalSales = data.totalSales || 0;
    this.totalSubtotal = data.totalSubtotal || 0;
    this.totalTax = data.totalTax || 0;
    this.averageOrderValue = data.averageOrderValue || 0;
  }
}

/**
 * DTO untuk ringkasan penjualan harian
 * @class DailySalesDto
 * @extends BaseDto
 */
class DailySalesDto extends BaseDto {
  /**
   * @param {Object} data - Data penjualan harian
   */
  constructor(data) {
    super();
    this.date = data.date;
    this.orderCount = data.orderCount || 0;
    this.totalSales = data.totalSales || 0;
    this.totalSubtotal = data.totalSubtotal || 0;
    this.totalTax = data.totalTax || 0;
    this.averageOrderValue = data.averageOrderValue || 0;
  }
}

/**
 * DTO untuk ringkasan penjualan per jam
 * @class HourlySalesDto
 * @extends BaseDto
 */
class HourlySalesDto extends BaseDto {
  /**
   * @param {Object} data - Data penjualan per jam
   */
  constructor(data) {
    super();
    this.hour = data.hour;
    this.orderCount = data.orderCount || 0;
    this.totalSales = data.totalSales || 0;
    this.averageOrderValue = data.averageOrderValue || 0;
  }
}

/**
 * DTO untuk laporan laba rugi
 * @class ProfitLossDto
 * @extends BaseDto
 */
class ProfitLossDto extends BaseDto {
  /**
   * @param {Object} data - Data laba rugi
   */
  constructor(data) {
    super();
    this.grossRevenue = data.grossRevenue || 0;
    this.totalCogs = data.totalCogs || 0;
    this.grossProfit = data.grossProfit || 0;
    this.grossMargin = data.grossMargin || 0;
    this.totalOperatingExpenses = data.totalOperatingExpenses || 0;
    this.netProfit = data.netProfit || 0;
    this.netMargin = data.netMargin || 0;
  }
}

/**
 * DTO untuk laba rugi harian
 * @class DailyProfitLossDto
 * @extends BaseDto
 */
class DailyProfitLossDto extends BaseDto {
  /**
   * @param {Object} data - Data laba rugi harian
   */
  constructor(data) {
    super();
    this.date = data.date;
    this.grossRevenue = data.grossRevenue || 0;
    this.totalCogs = data.totalCogs || 0;
    this.grossProfit = data.grossProfit || 0;
    this.totalOperatingExpenses = data.totalOperatingExpenses || 0;
    this.netProfit = data.netProfit || 0;
  }
}

/**
 * DTO untuk item dalam snapshot inventori
 * @class InventoryItemDto
 * @extends BaseDto
 */
class InventoryItemDto extends BaseDto {
  /**
   * @param {Object} data - Data item inventori
   */
  constructor(data) {
    super();
    this.id = data.id;
    this.sku = data.sku;
    this.name = data.name;
    this.stock = data.stock || 0;
    this.cost = data.cost || 0;
    this.price = data.price || 0;
    this.image = data.image || null;
    this.assetValue = data.assetValue || 0;
    this.retailValue = data.retailValue || 0;
    this.potentialProfit = data.potentialProfit || 0;
    this.stockStatus = data.stockStatus || "HEALTHY";
  }
}

/**
 * DTO untuk ringkasan inventori
 * @class InventorySummaryDto
 * @extends BaseDto
 */
class InventorySummaryDto extends BaseDto {
  /**
   * @param {Object} data - Data ringkasan inventori
   */
  constructor(data) {
    super();
    this.totalItems = data.totalItems || 0;
    this.totalAssetValue = data.totalAssetValue || 0;
    this.totalRetailValue = data.totalRetailValue || 0;
    this.potentialProfit = data.potentialProfit || 0;
    this.profitMargin = data.profitMargin || 0;
    this.outOfStock = data.outOfStock || 0;
    this.lowStock = data.lowStock || 0;
    this.healthy = data.healthy || 0;
  }
}

/**
 * DTO untuk metadata pagination
 * @class PaginationMetadataDto
 * @extends BaseDto
 */
class PaginationMetadataDto extends BaseDto {
  /**
   * @param {Object} data - Data metadata pagination
   */
  constructor(data) {
    super();
    this.total = data.total || 0;
    this.page = data.page || 1;
    this.limit = data.limit || 10;
    this.totalPages = data.totalPages || 0;
  }
}

/**
 * DTO untuk laporan inventori
 * @class InventoryReportDto
 * @extends BaseDto
 */
class InventoryReportDto extends BaseDto {
  /**
   * @param {Object} data - Data laporan inventori
   */
  constructor(data) {
    super();
    this.summary = new InventorySummaryDto(data.summary);
    this.items = data.items?.map((i) => new InventoryItemDto(i)) ?? [];
    this.metadata = new PaginationMetadataDto(data.metadata);
  }
}

/**
 * DTO untuk breakdown pembayaran
 * @class PaymentBreakdownDto
 * @extends BaseDto
 */
class PaymentBreakdownDto extends BaseDto {
  /**
   * @param {Object} data - Data breakdown pembayaran
   */
  constructor(data) {
    super();
    this.method = data.method;
    this.total = data.total || 0;
    this.count = data.count || 0;
  }
}

/**
 * DTO untuk laporan ringkasan shift
 * @class ShiftReportDto
 * @extends BaseDto
 */
class ShiftReportDto extends BaseDto {
  /**
   * @param {Object} data - Data laporan shift
   */
  constructor(data) {
    super();
    this.id = data.id;
    this.status = data.status;
    this.startingCash = data.startingCash || 0;
    this.endingCash = data.endingCash ?? null;
    this.expectedCash = data.expectedCash ?? null;
    this.cashSales = data.cashSales || 0;
    this.cashIn = data.cashIn || 0;
    this.cashOut = data.cashOut || 0;
    this.discrepancy = data.discrepancy || 0;
    this.totalExpenses = data.totalExpenses || 0;
    this.netSales = data.netSales || 0;
    this.openedAt = data.openedAt;
    this.closedAt = data.closedAt ?? null;
    this.orderCount = data.orderCount || 0;
    this.paymentBreakdown = data.paymentBreakdown?.map((p) => new PaymentBreakdownDto(p)) ?? [];
    this.cashier = data.cashier ? { id: data.cashier.id, fullName: data.cashier.fullName } : null;
  }
}

/**
 * DTO untuk laporan penjualan per produk
 * @class ProductSalesDto
 * @extends BaseDto
 */
class ProductSalesDto extends BaseDto {
  /**
   * @param {Object} data - Data penjualan produk
   */
  constructor(data) {
    super();
    this.productId = data.productId;
    this.productName = data.productName;
    this.sku = data.sku;
    this.type = data.type;
    this.image = data.image || null;
    this.quantitySold = data.quantitySold || 0;
    this.totalRevenue = data.totalRevenue || 0;
    this.totalCost = data.totalCost || 0;
    this.profit = data.profit || 0;
    this.profitMargin = data.profitMargin || 0;
  }
}

/**
 * DTO untuk laporan performa mekanik
 * @class MechanicPerformanceDto
 * @extends BaseDto
 */
class MechanicPerformanceDto extends BaseDto {
  /**
   * @param {Object} data - Data performa mekanik
   */
  constructor(data) {
    super();
    this.mechanicId = data.mechanicId;
    this.mechanicName = data.mechanicName;
    this.email = data.email;
    this.totalTasks = data.totalTasks || 0;
    this.completedTasks = data.completedTasks || 0;
    this.pendingTasks = data.pendingTasks || 0;
    this.totalEarnings = data.totalEarnings || 0;
    this.averagePerTask = data.averagePerTask || 0;
    this.completionRate = data.completionRate || 0;
  }
}

/**
 * DTO untuk ringkasan dashboard (Admin)
 * @class DashboardSummaryDto
 * @extends BaseDto
 */
class DashboardSummaryDto extends BaseDto {
  /**
   * @param {Object} data - Data dashboard
   */
  constructor(data) {
    super();
    this.today = data.today
      ? {
          date: data.today.date,
          orders: data.today.orders || 0,
          revenue: data.today.revenue || 0,
          averageOrderValue: data.today.averageOrderValue || 0,
        }
      : null;

    this.thisMonth = data.thisMonth
      ? {
          orders: data.thisMonth.orders || 0,
          revenue: data.thisMonth.revenue || 0,
          newCustomers: data.thisMonth.newCustomers || 0,
          activeCustomers: data.thisMonth.activeCustomers || 0,
        }
      : null;

    this.pending = data.pending
      ? { orders: data.pending.orders || 0 }
      : null;

    this.activeShift = data.activeShift
      ? {
          id: data.activeShift.id,
          cashier: data.activeShift.cashier,
          openedAt: data.activeShift.openedAt,
          startingCash: data.activeShift.startingCash || 0,
          currentCashSales: data.activeShift.currentCashSales || 0,
          orderCount: data.activeShift.orderCount || 0,
        }
      : null;

    this.inventory = data.inventory
      ? {
          totalProducts: data.inventory.totalProducts || 0,
          activeProducts: data.inventory.activeProducts || 0,
          lowStockCount: data.inventory.lowStockCount || 0,
          outOfStockCount: data.inventory.outOfStockCount || 0,
          totalStockValue: data.inventory.totalStockValue || 0,
          lowStockProducts: data.inventory.lowStockProducts || [],
        }
      : null;

    this.customers = data.customers
      ? {
          totalCustomers: data.customers.totalCustomers || 0,
          newThisMonth: data.customers.newThisMonth || 0,
          activeThisMonth: data.customers.activeThisMonth || 0,
          totalVehicles: data.customers.totalVehicles || 0,
        }
      : null;
  }
}

/**
 * DTO untuk dashboard kasir
 * @class CashierDashboardDto
 * @extends BaseDto
 */
class CashierDashboardDto extends BaseDto {
  /**
   * @param {Object} data - Data dashboard kasir
   */
  constructor(data) {
    super();
    this.activeShift = data.activeShift
      ? {
          id: data.activeShift.id,
          openedAt: data.activeShift.openedAt,
          startingCash: data.activeShift.startingCash || 0,
          currentCashSales: data.activeShift.currentCashSales || 0,
          orderCount: data.activeShift.orderCount || 0,
        }
      : null;

    this.todaySales = data.todaySales
      ? {
          todayOrders: data.todaySales.todayOrders || 0,
          todaySales: data.todaySales.todaySales || 0,
          pendingOrders: data.todaySales.pendingOrders || 0,
        }
      : null;

    this.recentOrders = data.recentOrders || [];
  }
}

/**
 * DTO untuk dashboard mekanik
 * @class MechanicDashboardDto
 * @extends BaseDto
 */
class MechanicDashboardDto extends BaseDto {
  /**
   * @param {Object} data - Data dashboard mekanik
   */
  constructor(data) {
    super();
    this.todayTasks = {
      pending: data.todayTasks?.pending ?? 0,
      completed: data.todayTasks?.completed ?? 0,
      earnings: data.todayTasks?.earnings ?? 0,
    };

    this.overallStats = {
      total: data.overallStats?.total ?? 0,
      completed: data.overallStats?.completed ?? 0,
      pending: data.overallStats?.pending ?? 0,
      completionRate: data.overallStats?.completionRate ?? 0,
    };

    this.pendingTasks = data.pendingTasks || [];
  }
}

/**
 * DTO untuk laporan ringkasan pembayaran
 * @class PaymentReportDto
 * @extends BaseDto
 */
class PaymentReportDto extends BaseDto {
  /**
   * @param {Object} data - Data pembayaran
   */
  constructor(data) {
    super();
    this.totalAmount = data.totalAmount || 0;
    this.totalCount = data.totalCount || 0;
    this.byMethod = data.byMethod ?? [];
    this.byStatus = data.byStatus ?? [];
  }
}

/**
 * DTO untuk pembayaran harian
 * @class DailyPaymentDto
 * @extends BaseDto
 */
class DailyPaymentDto extends BaseDto {
  /**
   * @param {Object} data - Data pembayaran harian
   */
  constructor(data) {
    super();
    this.date = data.date;
    this.totalAmount = data.totalAmount || 0;
    this.count = data.count || 0;
  }
}

/**
 * DTO untuk pengeluaran per kategori
 * @class ExpenseByCategoryDto
 * @extends BaseDto
 */
class ExpenseByCategoryDto extends BaseDto {
  /**
   * @param {Object} data - Data pengeluaran
   */
  constructor(data) {
    super();
    this.category = data.category;
    this.total = data.total || 0;
    this.count = data.count || 0;
  }
}

/**
 * DTO untuk pengeluaran harian
 * @class DailyExpenseDto
 * @extends BaseDto
 */
class DailyExpenseDto extends BaseDto {
  /**
   * @param {Object} data - Data pengeluaran harian
   */
  constructor(data) {
    super();
    this.date = data.date;
    this.totalAmount = data.totalAmount || 0;
    this.count = data.count || 0;
  }
}

/**
 * DTO untuk ringkasan pergerakan stok
 * @class MovementSummaryDto
 * @extends BaseDto
 */
class MovementSummaryDto extends BaseDto {
  /**
   * @param {Object} data - Data pergerakan stok
   */
  constructor(data) {
    super();
    this.in = data.IN ?? 0;
    this.out = data.OUT ?? 0;
    this.adjustment = data.ADJUSTMENT ?? 0;
    this.netChange = data.netChange ?? 0;
  }
}

/**
 * DTO untuk detail pergerakan stok
 * @class MovementDetailDto
 * @extends BaseDto
 */
class MovementDetailDto extends BaseDto {
  /**
   * @param {Object} data - Data detail pergerakan
   */
  constructor(data) {
    super();
    this.id = data.id;
    this.type = data.type;
    this.sourceType = data.sourceType;
    this.quantity = data.quantity || 0;
    this.note = data.note || null;
    this.createdAt = data.createdAt;
    this.recordedBy = data.recordedBy;
    this.orderItemId = data.orderItemId || null;
    this.orderId = data.orderId || null;
  }
}

/**
 * DTO untuk validasi konsistensi stok
 * @class StockConsistencyDto
 * @extends BaseDto
 */
class StockConsistencyDto extends BaseDto {
  /**
   * @param {Object} data - Data konsistensi stok
   */
  constructor(data) {
    super();
    this.current = data.current || 0;
    this.calculated = data.calculated || 0;
    this.difference = data.difference || 0;
    this.isConsistent = data.isConsistent ?? false;
  }
}

/**
 * DTO untuk statistik task per order
 * @class TaskStatsDto
 * @extends BaseDto
 */
class TaskStatsDto extends BaseDto {
  /**
   * @param {Object} data - Data statistik task
   */
  constructor(data) {
    super();
    this.total = data.total || 0;
    this.assigned = data.assigned || 0;
    this.unassigned = data.unassigned || 0;
    this.tasks = data.tasks ?? [];
  }
}

/**
 * DTO untuk statistik tugas mekanik
 * @class MechanicTaskStatsDto
 * @extends BaseDto
 */
class MechanicTaskStatsDto extends BaseDto {
  /**
   * @param {Object} data - Data statistik mekanik
   */
  constructor(data) {
    super();
    this.totalTasks = data.totalTasks ?? 0;
    this.completedTasks = data.completedTasks ?? 0;
    this.pendingTasks = data.pendingTasks ?? 0;
  }
}

/**
 * DTO untuk pendapatan mekanik
 * @class MechanicEarningsDto
 * @extends BaseDto
 */
class MechanicEarningsDto extends BaseDto {
  /**
   * @param {Object} data - Data pendapatan mekanik
   */
  constructor(data) {
    super();
    this.totalEarnings = data.totalEarnings || 0;
    this.taskCount = data.taskCount || 0;
    this.averagePerTask = data.averagePerTask || 0;
  }
}

/**
 * DTO untuk ringkasan pelanggan
 * @class CustomerSummaryDto
 * @extends BaseDto
 */
class CustomerSummaryDto extends BaseDto {
  /**
   * @param {Object} data - Data ringkasan pelanggan
   */
  constructor(data) {
    super();
    this.totalCustomers = data.totalCustomers || 0;
    this.newCustomers = data.newCustomers || 0;
    this.activeCustomers = data.activeCustomers || 0;
    this.totalVehicles = data.totalVehicles || 0;
  }
}

/**
 * DTO untuk akuisisi pelanggan harian
 * @class DailyCustomerAcquisitionDto
 * @extends BaseDto
 */
class DailyCustomerAcquisitionDto extends BaseDto {
  /**
   * @param {Object} data - Data akuisisi harian
   */
  constructor(data) {
    super();
    this.date = data.date;
    this.newCustomers = data.newCustomers || 0;
    this.totalCustomers = data.totalCustomers || 0;
  }
}

/**
 * DTO untuk frekuensi kunjungan
 * @class VisitFrequencyDto
 * @extends BaseDto
 */
class VisitFrequencyDto extends BaseDto {
  /**
   * @param {Object} data - Data frekuensi kunjungan
   */
  constructor(data) {
    super();
    this.visitCount = data.visitCount || 0;
    this.customerCount = data.customerCount || 0;
    this.percentage = data.percentage || 0;
  }
}

/**
 * DTO untuk top customer
 * @class TopCustomerDto
 * @extends BaseDto
 */
class TopCustomerDto extends BaseDto {
  /**
   * @param {Object} data - Data top customer
   */
  constructor(data) {
    super();
    this.customerId = data.customerId;
    this.customerName = data.customerName;
    this.phone = data.phone || null;
    this.totalOrders = data.totalOrders || 0;
    this.totalSpent = data.totalSpent || 0;
    this.averageOrderValue = data.averageOrderValue || 0;
    this.lastOrderDate = data.lastOrderDate || null;
    this.vehicles = data.vehicles || [];
  }
}

/**
 * DTO untuk retensi pelanggan bulanan
 * @class MonthlyRetentionDto
 * @extends BaseDto
 */
class MonthlyRetentionDto extends BaseDto {
  /**
   * @param {Object} data - Data retensi bulanan
   */
  constructor(data) {
    super();
    this.month = data.month;
    this.newCustomers = data.newCustomers || 0;
    this.returningCustomers = data.returningCustomers || 0;
    this.totalActiveCustomers = data.totalActiveCustomers || 0;
    this.retentionRate = data.retentionRate || 0;
  }
}

/**
 * DTO untuk riwayat transaksi pelanggan
 * @class CustomerTransactionHistoryDto
 * @extends BaseDto
 */
class CustomerTransactionHistoryDto extends BaseDto {
  /**
   * @param {Object} data - Data riwayat transaksi
   */
  constructor(data) {
    super();
    this.customer = data.customer;
    this.orders = data.orders || [];
    this.summary = {
      totalOrders: data.summary?.totalOrders || 0,
      totalSpent: data.summary?.totalSpent || 0,
      averageOrderValue: data.summary?.averageOrderValue || 0,
    };
  }
}

/**
 * DTO untuk pelanggan tidak aktif
 * @class InactiveCustomerDto
 * @extends BaseDto
 */
class InactiveCustomerDto extends BaseDto {
  /**
   * @param {Object} data - Data pelanggan tidak aktif
   */
  constructor(data) {
    super();
    this.customerId = data.customerId;
    this.customerName = data.customerName;
    this.phone = data.phone || null;
    this.lastOrderDate = data.lastOrderDate || null;
    this.daysSinceLastOrder = data.daysSinceLastOrder || null;
    this.totalOrders = data.totalOrders || 0;
    this.totalSpent = data.totalSpent || 0;
  }
}

/**
 * DTO untuk customer lifetime value
 * @class CustomerLifetimeValueDto
 * @extends BaseDto
 */
class CustomerLifetimeValueDto extends BaseDto {
  /**
   * @param {Object} data - Data CLV
   */
  constructor(data) {
    super();
    this.customerId = data.customerId;
    this.customerName = data.customerName;
    this.phone = data.phone || null;
    this.totalOrders = data.totalOrders || 0;
    this.totalSpent = data.totalSpent || 0;
    this.averageOrderValue = data.averageOrderValue || 0;
    this.firstOrderDate = data.firstOrderDate || null;
    this.lastOrderDate = data.lastOrderDate || null;
    this.customerLifespanDays = data.customerLifespanDays || null;
    this.clv = data.clv || 0;
  }
}

/**
 * DTO untuk ringkasan kendaraan
 * @class VehicleSummaryDto
 * @extends BaseDto
 */
class VehicleSummaryDto extends BaseDto {
  /**
   * @param {Object} data - Data ringkasan kendaraan
   */
  constructor(data) {
    super();
    this.totalVehicles = data.totalVehicles || 0;
    this.byBrand = data.byBrand || [];
    this.recentVehicles = data.recentVehicles || [];
  }
}

export {
  SalesDataDto,
  DailySalesDto,
  HourlySalesDto,
  ProfitLossDto,
  DailyProfitLossDto,
  InventoryItemDto,
  InventorySummaryDto,
  PaginationMetadataDto,
  InventoryReportDto,
  PaymentBreakdownDto,
  ShiftReportDto,
  ProductSalesDto,
  MechanicPerformanceDto,
  DashboardSummaryDto,
  CashierDashboardDto,
  MechanicDashboardDto,
  PaymentReportDto,
  DailyPaymentDto,
  ExpenseByCategoryDto,
  DailyExpenseDto,
  MovementSummaryDto,
  MovementDetailDto,
  StockConsistencyDto,
  TaskStatsDto,
  MechanicTaskStatsDto,
  MechanicEarningsDto,
  CustomerSummaryDto,
  DailyCustomerAcquisitionDto,
  VisitFrequencyDto,
  TopCustomerDto,
  MonthlyRetentionDto,
  CustomerTransactionHistoryDto,
  InactiveCustomerDto,
  CustomerLifetimeValueDto,
  VehicleSummaryDto,
};