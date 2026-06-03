import CatchAsync from "#shared/utils/response.js";
import ReportService from "#service/reportService.js";

import {
  dateRangeQuerySchema,
  topProductsQuerySchema,
  mechanicPerformanceQuerySchema,
  expenseReportQuerySchema,
  paymentReportQuerySchema,
  stockMovementQuerySchema,
  mechanicEarningsQuerySchema,
  customerSummaryQuerySchema,
  topCustomersQuerySchema,
  customerTransactionHistoryQuerySchema,
  inactiveCustomersQuerySchema,
  customerLifetimeValueQuerySchema,
  shiftIdParamSchema,
  productIdParamSchema,
  mechanicIdParamSchema,
  orderIdParamSchema,
  customerIdParamSchema,
} from "#validation/reportValidation.js";

import validate from "#validation/validation.js";

import {
  SalesDataDto,
  DailySalesDto,
  HourlySalesDto,
  ProfitLossDto,
  DailyProfitLossDto,
  InventoryReportDto,
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
  PaginationMetadataDto,
} from "#dtos/reportDto.js";

/**
 * Controller untuk mengelola endpoint laporan
 * @class ReportController
 */
class ReportController {
  constructor() {
    this.reportService = new ReportService();
  }

  /**
   * Mendapatkan ringkasan penjualan
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  getSalesSummary = CatchAsync.run(async (req, res) => {
    const query = validate(dateRangeQuerySchema, req.query);

    const report = await this.reportService.getSalesSummary(query.period, query);

    res.status(200).json({
      success: true,
      message: "Ringkasan penjualan berhasil diambil",
      data: {
        period: report.period,
        dateRange: report.dateRange,
        labels: report.labels,
        summary: new SalesDataDto(report.summary),
        breakdown: report.breakdown.map((d) =>
          report.period === "daily" ? new HourlySalesDto(d) : new DailySalesDto(d)
        ),
      },
    });
  });

  /**
   * Mendapatkan laporan laba rugi
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  getProfitLossReport = CatchAsync.run(async (req, res) => {
    const query = validate(dateRangeQuerySchema, req.query);

    const report = await this.reportService.getProfitLossReport(query.period, query);

    res.status(200).json({
      success: true,
      message: "Laporan laba rugi berhasil diambil",
      data: {
        period: report.period,
        dateRange: report.dateRange,
        labels: report.labels,
        summary: new ProfitLossDto(report.summary),
        breakdown: report.breakdown.map((d) => new DailyProfitLossDto(d)),
      },
    });
  });

  /**
   * Mendapatkan laporan inventaris
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  getInventoryReport = CatchAsync.run(async (req, res) => {
    const { page, limit } = req.query;

    const report = await this.reportService.getInventoryReport({
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
    });

    res.status(200).json({
      success: true,
      message: "Laporan inventaris berhasil diambil",
      data: new InventoryReportDto(report),
    });
  });

  /**
   * Mendapatkan laporan shift
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  getShiftReport = CatchAsync.run(async (req, res) => {
    const { shiftId } = validate(shiftIdParamSchema, req.params);

    const report = await this.reportService.getShiftReport(shiftId);

    res.status(200).json({
      success: true,
      message: "Laporan shift berhasil diambil",
      data: new ShiftReportDto(report),
    });
  });

  /**
   * Mendapatkan laporan produk terlaris
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  getTopProductsReport = CatchAsync.run(async (req, res) => {
    const query = validate(topProductsQuerySchema, req.query);

    const report = await this.reportService.getTopProductsReport(query.period, query);

    res.status(200).json({
      success: true,
      message: "Laporan produk terlaris berhasil diambil",
      data: {
        period: report.period,
        dateRange: report.dateRange,
        summary: report.summary,
        products: report.products.map((p) => new ProductSalesDto(p)),
        metadata: new PaginationMetadataDto(report.metadata),
      },
    });
  });

  /**
   * Mendapatkan laporan performa mekanik
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  getMechanicPerformanceReport = CatchAsync.run(async (req, res) => {
    const query = validate(mechanicPerformanceQuerySchema, req.query);

    const report = await this.reportService.getMechanicPerformanceReport(query.period, query);

    res.status(200).json({
      success: true,
      message: "Laporan performa mekanik berhasil diambil",
      data: {
        period: report.period,
        dateRange: report.dateRange,
        summary: report.summary,
        mechanics: report.mechanics.map((m) => new MechanicPerformanceDto(m)),
        metadata: new PaginationMetadataDto(report.metadata),
      },
    });
  });

  /**
   * Mendapatkan ringkasan dashboard berdasarkan role user
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  getDashboardSummary = CatchAsync.run(async (req, res) => {
    const { role, id: userId } = req.user;

    const report = await this.reportService.getDashboardSummary(role, userId);

    let data;
    switch (role) {
      case "CASHIER":
        data = new CashierDashboardDto(report);
        break;
      case "MECHANIC":
        data = new MechanicDashboardDto(report);
        break;
      case "ADMIN":
      default:
        data = new DashboardSummaryDto(report);
        break;
    }

    res.status(200).json({
      success: true,
      message: "Ringkasan dashboard berhasil diambil",
      data,
    });
  });

  /**
   * Mendapatkan laporan pengeluaran
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  getExpenseReport = CatchAsync.run(async (req, res) => {
    const query = validate(expenseReportQuerySchema, req.query);

    const report = await this.reportService.getExpenseReport(query.period, query);

    res.status(200).json({
      success: true,
      message: "Laporan pengeluaran berhasil diambil",
      data: {
        period: report.period,
        dateRange: report.dateRange,
        labels: report.labels,
        filters: report.filters,
        summary: {
          totalAmount: report.summary.totalAmount,
          count: report.summary.count,
          byCategory: report.summary.byCategory.map((e) => new ExpenseByCategoryDto(e)),
        },
        breakdown: report.breakdown.map((d) => new DailyExpenseDto(d)),
      },
    });
  });

  /**
   * Mendapatkan laporan pembayaran
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  getPaymentReport = CatchAsync.run(async (req, res) => {
    const query = validate(paymentReportQuerySchema, req.query);

    const report = await this.reportService.getPaymentReport(query.period, query);

    res.status(200).json({
      success: true,
      message: "Laporan pembayaran berhasil diambil",
      data: {
        period: report.period,
        dateRange: report.dateRange,
        labels: report.labels,
        filters: report.filters,
        summary: new PaymentReportDto(report.summary),
        breakdown: report.breakdown.map((d) => new DailyPaymentDto(d)),
      },
    });
  });

  /**
   * Mendapatkan laporan pergerakan stok
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  getStockMovementReport = CatchAsync.run(async (req, res) => {
    const { productId } = validate(productIdParamSchema, req.params);
    const query = validate(stockMovementQuerySchema, req.query);

    const report = await this.reportService.getStockMovementReport(productId, query.period, query);

    res.status(200).json({
      success: true,
      message: "Laporan pergerakan stok berhasil diambil",
      data: {
        period: report.period,
        dateRange: report.dateRange,
        productId: report.productId,
        movement: {
          summary: new MovementSummaryDto(report.movement),
          movements: report.movement.movements.map((m) => new MovementDetailDto(m)),
          metadata: new PaginationMetadataDto(report.movement.metadata),
        },
        consistency: new StockConsistencyDto(report.consistency),
      },
    });
  });

  /**
   * Mendapatkan statistik task per order
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  getTaskStatsByOrder = CatchAsync.run(async (req, res) => {
    const { orderId } = validate(orderIdParamSchema, req.params);

    const stats = await this.reportService.getTaskStatsByOrder(orderId);

    res.status(200).json({
      success: true,
      message: "Statistik task per order berhasil diambil",
      data: new TaskStatsDto(stats),
    });
  });

  /**
   * Mendapatkan statistik tugas mekanik
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  getMechanicTaskStats = CatchAsync.run(async (req, res) => {
    const { mechanicId } = validate(mechanicIdParamSchema, req.params);

    const stats = await this.reportService.getMechanicTaskStats(mechanicId);

    res.status(200).json({
      success: true,
      message: "Statistik tugas mekanik berhasil diambil",
      data: new MechanicTaskStatsDto(stats),
    });
  });

  /**
   * Mendapatkan total pendapatan mekanik
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  getMechanicEarnings = CatchAsync.run(async (req, res) => {
    const { mechanicId } = validate(mechanicIdParamSchema, req.params);
    const query = validate(mechanicEarningsQuerySchema, req.query);

    const earnings = await this.reportService.getMechanicEarnings(mechanicId, query.period, query);

    res.status(200).json({
      success: true,
      message: "Total pendapatan mekanik berhasil diambil",
      data: {
        mechanicId: earnings.mechanicId,
        period: earnings.period,
        dateRange: earnings.dateRange,
        earnings: new MechanicEarningsDto(earnings),
      },
    });
  });

  /**
   * Mendapatkan ringkasan pelanggan
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  getCustomerSummary = CatchAsync.run(async (req, res) => {
    const query = validate(customerSummaryQuerySchema, req.query);

    const report = await this.reportService.getCustomerSummary(query.period, query);

    res.status(200).json({
      success: true,
      message: "Ringkasan pelanggan berhasil diambil",
      data: {
        period: report.period,
        dateRange: report.dateRange,
        labels: report.labels,
        summary: new CustomerSummaryDto(report.summary),
        acquisition: report.acquisition.map((d) => new DailyCustomerAcquisitionDto(d)),
        visitFrequency: report.visitFrequency.map((v) => new VisitFrequencyDto(v)),
        retention: report.retention.map((r) => new MonthlyRetentionDto(r)),
        topCustomers: report.topCustomers.map((c) => new TopCustomerDto(c)),
        topCustomersMetadata: new PaginationMetadataDto(report.topCustomersMetadata),
      },
    });
  });

  /**
   * Mendapatkan daftar top customers
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  getTopCustomers = CatchAsync.run(async (req, res) => {
    const query = validate(topCustomersQuerySchema, req.query);

    const result = await this.reportService.getTopCustomers(query.period, query);

    res.status(200).json({
      success: true,
      message: "Top customers berhasil diambil",
      data: {
        customers: result.data.map((c) => new TopCustomerDto(c)),
        metadata: new PaginationMetadataDto(result.metadata),
      },
    });
  });

  /**
   * Mendapatkan detail riwayat transaksi pelanggan
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  getCustomerTransactionHistory = CatchAsync.run(async (req, res) => {
    const { customerId } = validate(customerIdParamSchema, req.params);
    const query = validate(customerTransactionHistoryQuerySchema, req.query);

    const result = await this.reportService.getCustomerTransactionHistory(customerId, query.period, query);

    res.status(200).json({
      success: true,
      message: "Riwayat transaksi pelanggan berhasil diambil",
      data: new CustomerTransactionHistoryDto(result),
    });
  });

  /**
   * Mendapatkan daftar pelanggan tidak aktif
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  getInactiveCustomers = CatchAsync.run(async (req, res) => {
    const query = validate(inactiveCustomersQuerySchema, req.query);

    const result = await this.reportService.getInactiveCustomers(query);

    res.status(200).json({
      success: true,
      message: "Pelanggan tidak aktif berhasil diambil",
      data: {
        daysThreshold: result.daysThreshold,
        customers: result.customers.map((c) => new InactiveCustomerDto(c)),
        metadata: new PaginationMetadataDto(result.metadata),
      },
    });
  });

  /**
   * Mendapatkan customer lifetime value
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  getCustomerLifetimeValue = CatchAsync.run(async (req, res) => {
    const query = validate(customerLifetimeValueQuerySchema, req.query);

    const result = await this.reportService.getCustomerLifetimeValue(query);

    res.status(200).json({
      success: true,
      message: "Customer lifetime value berhasil diambil",
      data: {
        customers: result.customers.map((c) => new CustomerLifetimeValueDto(c)),
        metadata: new PaginationMetadataDto(result.metadata),
      },
    });
  });

  /**
   * Mendapatkan ringkasan kendaraan
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  getVehicleSummary = CatchAsync.run(async (req, res) => {
    const result = await this.reportService.getVehicleSummary();

    res.status(200).json({
      success: true,
      message: "Ringkasan kendaraan berhasil diambil",
      data: new VehicleSummaryDto(result),
    });
  });
}

export default new ReportController();