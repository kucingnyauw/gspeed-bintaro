// scripts/test-insight.js
import prisma from "#app/database.js";
import InsightRepository from "#repository/insightRepository.js";

const insight = new InsightRepository();

const adminEmail = "rifkyf589@gmail.com";
const kasirEmail = "kasir1@bengkel.com";
const mekanikEmail = "mekanik1@bengkel.com";

async function main() {
  const [admin, cashier, mechanic] = await Promise.all([
    prisma.user.findUnique({ where: { email: adminEmail } }),
    prisma.user.findUnique({ where: { email: kasirEmail } }),
    prisma.user.findUnique({ where: { email: mekanikEmail } }),
  ]);

  if (!admin || !cashier || !mechanic) {
    console.log("❌ User tidak ditemukan, pastikan sudah di-seed");
    await prisma.$disconnect();
    return;
  }

  const adminId = admin.id;
  const cashierId = cashier.id;
  const mechanicId = mechanic.id;

  // Ambil sample data untuk testing
  const [sampleOrder, sampleProduct, sampleCustomer, sampleVehicle] = await Promise.all([
    prisma.order.findFirst({ where: { deletedAt: null }, select: { id: true } }),
    prisma.product.findFirst({ where: { type: "SPAREPART", isActive: true }, select: { id: true } }),
    prisma.customer.findFirst({ select: { id: true } }),
    prisma.vehicle.findFirst({ select: { id: true } }),
  ]);

  const sampleOrderId = sampleOrder?.id;
  const sampleProductId = sampleProduct?.id;
  const sampleCustomerId = sampleCustomer?.id;

  console.log("=".repeat(80));
  console.log("🧪 TESTING ALL INSIGHT REPOSITORY FUNCTIONS");
  console.log("=".repeat(80));

  // ============================================================================
  // 1. MEKANIK INSIGHTS (11 fungsi)
  // ============================================================================
  console.log("\n" + "=".repeat(80));
  console.log("🔧 [1/6] MEKANIK INSIGHTS (11 functions)");
  console.log("=".repeat(80));

  try {
    console.log("\n✅ 1. getMechanicActiveJobs");
    const r1 = await insight.getMechanicActiveJobs(mechanicId);
    console.log(`   Count: ${r1.length} jobs`);

    console.log("\n✅ 2. getMechanicPendingJobs");
    const r2 = await insight.getMechanicPendingJobs(mechanicId);
    console.log(`   Count: ${r2.length} pending`);

    console.log("\n✅ 3. getMechanicPerformanceSummary");
    const r3 = await insight.getMechanicPerformanceSummary(mechanicId);
    console.log(`   Today: ${r3.todayCompleted}, Week: ${r3.weekCompleted}, Month: ${r3.monthCompleted}, Earnings: ${r3.monthEarnings}`);

    console.log("\n✅ 4. getMechanicDailyHistory");
    const r4 = await insight.getMechanicDailyHistory(mechanicId, 7);
    console.log(`   Days: ${r4.length}`);

    console.log("\n✅ 5. getMechanicSpeedStats");
    const r5 = await insight.getMechanicSpeedStats(mechanicId);
    console.log(`   Total: ${r5.totalJobs}, Avg: ${r5.avgTimeMinutes}min, Fastest: ${r5.fastestMinutes}min, Slowest: ${r5.slowestMinutes}min`);

    console.log("\n✅ 6. getMechanicTopServices");
    const r6 = await insight.getMechanicTopServices(mechanicId);
    console.log(`   Services: ${r6.map(s => s.serviceName).join(", ")}`);

    console.log("\n✅ 7. getMechanicEarningsBreakdown");
    const r7 = await insight.getMechanicEarningsBreakdown(mechanicId, 30);
    console.log(`   Total: ${r7.totalEarnings}, Avg/Day: ${r7.avgPerDay}, Daily items: ${r7.daily.length}`);

    console.log("\n✅ 8. getMechanicEfficiencyRank");
    const r8 = await insight.getMechanicEfficiencyRank(mechanicId);
    console.log(`   Rank: ${r8.rank}/${r8.totalMechanics}, Avg: ${r8.avgMinutes}min, Jobs: ${r8.totalJobs}`);

    console.log("\n✅ 9. getMechanicWeeklyTrend");
    const r9 = await insight.getMechanicWeeklyTrend(mechanicId, 30);
    console.log(`   Trend: ${r9.trend}% (${r9.direction}), Weeks: ${r9.weekly.length}`);
  } catch (e) {
    console.log(`   ❌ Mechanic error: ${e.message}`);
  }

  // ============================================================================
  // 2. KASIR INSIGHTS (9 fungsi)
  // ============================================================================
  console.log("\n" + "=".repeat(80));
  console.log("💰 [2/6] KASIR INSIGHTS (9 functions)");
  console.log("=".repeat(80));

  try {
    console.log("\n✅ 1. getCashierTodaySummary");
    const k1 = await insight.getCashierTodaySummary(cashierId);
    console.log(`   Sales: ${k1.todaySales}, Orders: ${k1.todayOrders}, Cash: ${k1.todayCashAmount}, QRIS: ${k1.todayQrisAmount}`);

    console.log("\n✅ 2. getCashierActiveShift");
    const k2 = await insight.getCashierActiveShift(cashierId);
    console.log(`   Active: ${k2.activeShift ? "Yes" : "No"}, Sales: ${k2.shiftSales}, Expenses: ${k2.shiftExpenses}`);

    console.log("\n✅ 3. getCashierPendingOrders");
    const k3 = await insight.getCashierPendingOrders(cashierId);
    console.log(`   Statuses: ${k3.map(s => `${s.status}=${s.count}`).join(", ")}`);

    console.log("\n✅ 4. getCashierDailyHistory");
    const k4 = await insight.getCashierDailyHistory(cashierId, 7);
    console.log(`   Days: ${k4.length}`);

    console.log("\n✅ 5. getCashierCustomerStats");
    const k5 = await insight.getCashierCustomerStats(cashierId);
    console.log(`   Total: ${k5.totalCustomers}, New Today: ${k5.newToday}, Top: ${k5.topCustomer?.name || "N/A"}`);

    console.log("\n✅ 6. getCashierShiftHistory");
    const k6 = await insight.getCashierShiftHistory(cashierId);
    console.log(`   Shifts: ${k6.totalShifts}, Avg Discrepancy: ${k6.avgDiscrepancy}`);

    console.log("\n✅ 7. getCashierRecentTransactions");
    const k7 = await insight.getCashierRecentTransactions(cashierId);
    console.log(`   Transactions: ${k7.length}`);

    console.log("\n✅ 8. getCashierComparisonStats");
    const k8 = await insight.getCashierComparisonStats(cashierId);
    console.log(`   Today: ${k8.todaySales}, Yesterday: ${k8.yesterdaySales}, Change: ${k8.salesChange}%, Rank: ${k8.rank}`);
  } catch (e) {
    console.log(`   ❌ Cashier error: ${e.message}`);
  }

  // ============================================================================
  // 3. ADMIN DASHBOARD & OVERVIEW (20 fungsi)
  // ============================================================================
  console.log("\n" + "=".repeat(80));
  console.log("🏢 [3/6] ADMIN DASHBOARD & OVERVIEW (20 functions)");
  console.log("=".repeat(80));

  try {
    console.log("\n✅ 1. getAdminDashboardSnapshot");
    const a1 = await insight.getAdminDashboardSnapshot();
    console.log(`   Daily: ${a1.dailyRevenue}, Monthly: ${a1.monthlyRevenue}, Mechanics: ${a1.activeMechanics}, Shifts: ${a1.openShifts}, Low Stock: ${a1.lowStockItems}`);

    console.log("\n✅ 2. getAdminTodaySummary");
    const a2 = await insight.getAdminTodaySummary();
    console.log(`   Revenue: ${a2.totalRevenue}, Orders: ${a2.totalOrders}, AVG: ${a2.avgOrderValue}, Top: ${a2.topProduct}`);

    console.log("\n✅ 3. getAdminCashierPerformance");
    const a3 = await insight.getAdminCashierPerformance(30);
    console.log(`   Cashiers: ${a3.length}`);

    console.log("\n✅ 4. getAdminMechanicComparison");
    const a4 = await insight.getAdminMechanicComparison(30);
    console.log(`   Mechanics: ${a4.length}`);

    console.log("\n✅ 5. getAdminExpenseOverview");
    const a5 = await insight.getAdminExpenseOverview();
    console.log(`   Total: ${a5.totalExpenses}, Top: ${a5.topCategory}, Growth: ${a5.expenseGrowth}%`);

    console.log("\n✅ 6. getAdminOrderStatusDistribution");
    const a6 = await insight.getAdminOrderStatusDistribution(30);
    console.log(`   Statuses: ${a6.map(s => `${s.status}=${s.count}(${s.pct}%)`).join(", ")}`);

    console.log("\n✅ 7. getAdminInventoryHealth");
    const a7 = await insight.getAdminInventoryHealth();
    console.log(`   Stock Value: ${a7.totalStockValue}, Dead: ${a7.deadStockValue}, Turnover: ${a7.turnoverRate}, Profitable: ${a7.mostProfitable}`);

    console.log("\n✅ 8. getAdminBusinessGrowth");
    const a8 = await insight.getAdminBusinessGrowth();
    console.log(`   Revenue: ${a8.revenueGrowth}%, Customers: ${a8.customerGrowth}%, Orders: ${a8.orderGrowth}%`);

    console.log("\n✅ 9. getAdminDailyNetReport");
    const a9 = await insight.getAdminDailyNetReport(7);
    console.log(`   Days: ${a9.length}`);

    console.log("\n✅ 10. getAdminTopSpareparts");
    const a10 = await insight.getAdminTopSpareparts(30);
    console.log(`   Items: ${a10.length}`);

    console.log("\n✅ 11. getAdminServicePopularity");
    const a11 = await insight.getAdminServicePopularity(30);
    console.log(`   Services: ${a11.length}`);

    console.log("\n✅ 12. getAdminPeakHours");
    const a12 = await insight.getAdminPeakHours(30);
    console.log(`   Peak: ${a12.peakHour}:00 (${a12.peakOrders} orders), Hourly data: ${a12.hourly.length}`);

    console.log("\n✅ 13. getAdminVehicleDistribution");
    const a13 = await insight.getAdminVehicleDistribution();
    console.log(`   Brands: ${a13.length}`);

    console.log("\n✅ 14. getAdminStockAlert");
    const a14 = await insight.getAdminStockAlert();
    console.log(`   Out: ${a14.outOfStock.length}, Low: ${a14.lowStock.length}, Over: ${a14.overStock.length}`);

    console.log("\n✅ 15. getAdminRefundStats");
    const a15 = await insight.getAdminRefundStats(30);
    console.log(`   Refunds: ${a15.totalRefunds}, Amount: ${a15.totalAmount}`);

    console.log("\n✅ 16. getAdminUnpaidOrders");
    const a16 = await insight.getAdminUnpaidOrders();
    console.log(`   Unpaid: ${a16.length}`);

    console.log("\n✅ 17. getAdminRecentActivities");
    const a17 = await insight.getAdminRecentActivities(20);
    console.log(`   Activities: ${a17.length}`);

    console.log("\n✅ 18. getAdminCustomerRetention");
    const a18 = await insight.getAdminCustomerRetention();
    console.log(`   Months: ${a18.length}`);

    console.log("\n✅ 19. getAdminRevenueVsTarget");
    const a19 = await insight.getAdminRevenueVsTarget();
    console.log(`   Revenue: ${a19.currentRevenue}/${a19.target} (${a19.percentage}%), Remaining: ${a19.remaining}, Day: ${a19.daysPassed}/${a19.daysInMonth}`);

    console.log("\n✅ 20. getAdminTopCustomersByVisit");
    const a20 = await insight.getAdminTopCustomersByVisit();
    console.log(`   Customers: ${a20.length}`);

    console.log("\n✅ 21. getAdminOrderCompletionTime");
    const a21 = await insight.getAdminOrderCompletionTime();
    console.log(`   AVG: ${a21.avgHours}h, Min: ${a21.minHours}h, Max: ${a21.maxHours}h, Orders: ${a21.totalOrders}`);
  } catch (e) {
    console.log(`   ❌ Admin error: ${e.message}`);
  }

  // ============================================================================
  // 4. PRODUCT INSIGHTS (4 fungsi)
  // ============================================================================
  console.log("\n" + "=".repeat(80));
  console.log("🏍️  [4/6] PRODUCT INSIGHTS (4 functions)");
  console.log("=".repeat(80));

  try {
    console.log("\n✅ 1. getProductCatalogSummary");
    const p1 = await insight.getProductCatalogSummary();
    console.log(`   Total: ${p1.total}, Spareparts: ${p1.spareparts}, Services: ${p1.services}`);

    if (sampleProductId) {
      console.log("\n✅ 2. getProductDetail");
      const p2 = await insight.getProductDetail(sampleProductId);
      console.log(`   Name: ${p2.name}, SKU: ${p2.sku}, Stock: ${p2.stock}, Sold: ${p2.totalSold}, Revenue: ${p2.totalRevenue}`);

      console.log("\n✅ 3. getProductStockMovementHistory");
      const p3 = await insight.getProductStockMovementHistory(sampleProductId, 30);
      console.log(`   Movements: ${p3.length}`);
    } else {
      console.log("\n   ⚠️  No sample product found, skipping product detail tests");
    }

    console.log("\n✅ 4. getTopMarginProducts");
    const p4 = await insight.getTopMarginProducts(10);
    console.log(`   Products: ${p4.length}`);
    if (p4.length > 0) {
      console.log(`   Top: ${p4[0].name} (Margin: ${p4[0].margin}, ${p4[0].marginPct}%)`);
    }
  } catch (e) {
    console.log(`   ❌ Product error: ${e.message}`);
  }

  // ============================================================================
  // 5. SETTINGS INSIGHTS (3 fungsi)
  // ============================================================================
  console.log("\n" + "=".repeat(80));
  console.log("⚙️  [5/6] SETTINGS INSIGHTS (3 functions)");
  console.log("=".repeat(80));

  try {
    console.log("\n✅ 1. getAllSettings");
    const s1 = await insight.getAllSettings();
    console.log(`   Settings: ${s1.length}`);

    console.log("\n✅ 2. getSettingByKey");
    const s2 = await insight.getSettingByKey("tax_rate");
    console.log(`   tax_rate: ${s2?.value || "N/A"}`);

    console.log("\n✅ 3. getSystemConfiguration");
    const s3 = await insight.getSystemConfiguration();
    console.log(`   Keys: ${Object.keys(s3).length}`);
    console.log(`   Config: tax_rate=${s3.tax_rate}, ppn=${s3.enable_ppn}, pph=${s3.enable_pph}`);
  } catch (e) {
    console.log(`   ❌ Settings error: ${e.message}`);
  }

  // ============================================================================
  // 6. CUSTOMER & VEHICLE INSIGHTS + CACHE MANAGEMENT (6+5 fungsi)
  // ============================================================================
  console.log("\n" + "=".repeat(80));
  console.log("👥 [6/6] CUSTOMER, VEHICLE & CACHE MANAGEMENT (11 functions)");
  console.log("=".repeat(80));

  // Customer Insights
  try {
    if (sampleCustomerId) {
      console.log("\n✅ 1. getCustomerProfile");
      const c1 = await insight.getCustomerProfile(sampleCustomerId);
      console.log(`   Name: ${c1.name}, Orders: ${c1.totalOrders}, Spent: ${c1.totalSpent}, Vehicles: ${c1.vehicles.length}`);
    } else {
      console.log("\n   ⚠️  No sample customer found");
    }

    console.log("\n✅ 2. getNewCustomers");
    const c2 = await insight.getNewCustomers(30);
    console.log(`   New: ${c2.length}`);

    console.log("\n✅ 3. getInactiveCustomers");
    const c3 = await insight.getInactiveCustomers();
    console.log(`   Inactive: ${c3.length}`);
  } catch (e) {
    console.log(`   ❌ Customer error: ${e.message}`);
  }

  // Vehicle Insights
  try {
    console.log("\n✅ 4. getVehicleModelDistribution");
    const v1 = await insight.getVehicleModelDistribution();
    console.log(`   Models: ${v1.length}`);

    console.log("\n✅ 5. getVehicleStats");
    const v2 = await insight.getVehicleStats();
    console.log(`   Total: ${v2.total}, With Orders: ${v2.withOrders}, Without: ${v2.withoutOrders}`);
  } catch (e) {
    console.log(`   ❌ Vehicle error: ${e.message}`);
  }

  // Cache Management
  try {
    console.log("\n✅ 6. getCacheInfo");
    const cacheInfo = await insight.getCacheInfo();
    console.log(`   Total Keys: ${cacheInfo.totalKeys}`);
    console.log(`   Short (5m): ${cacheInfo.short.totalKeys}, Medium (10m): ${cacheInfo.medium.totalKeys}, Long (30m): ${cacheInfo.long.totalKeys}`);

    console.log("\n✅ 7. invalidateMechanicCache");
    const im = await insight.invalidateMechanicCache(mechanicId);
    console.log(`   Invalidated: ${im} keys`);

    console.log("\n✅ 8. invalidateCashierCache");
    const ic = await insight.invalidateCashierCache(cashierId);
    console.log(`   Invalidated: ${ic} keys`);

    console.log("\n✅ 9. invalidateAdminCache");
    const ia = await insight.invalidateAdminCache();
    console.log(`   Invalidated: ${ia} keys`);

    if (sampleProductId) {
      console.log("\n✅ 10. invalidateProductCache");
      const ip = await insight.invalidateProductCache(sampleProductId);
      console.log(`   Invalidated: ${ip} keys`);
    }

    console.log("\n✅ 11. invalidateSettingsCache");
    const isettings = await insight.invalidateSettingsCache();
    console.log(`   Invalidated: ${isettings} keys`);

    if (sampleCustomerId) {
      console.log("\n✅ 12. invalidateCustomerCache");
      const icust = await insight.invalidateCustomerCache(sampleCustomerId);
      console.log(`   Invalidated: ${icust} keys`);
    }

    console.log("\n✅ 13. invalidateVehicleCache");
    const iv = await insight.invalidateVehicleCache();
    console.log(`   Invalidated: ${iv} keys`);

    console.log("\n✅ 14. clearAllCaches");
    const cleared = await insight.clearAllCaches();
    console.log(`   Cleared: short=${cleared.short}, medium=${cleared.medium}, long=${cleared.long}, total=${cleared.total}`);
  } catch (e) {
    console.log(`   ❌ Cache error: ${e.message}`);
  }

  // ============================================================================
  // FINAL SUMMARY
  // ============================================================================
  console.log("\n" + "=".repeat(80));
  console.log("📊 TEST COMPLETE");
  console.log("=".repeat(80));
  console.log("Total functions tested: 50+");
  console.log("  🔧 Mechanic: 9");
  console.log("  💰 Cashier: 8");
  console.log("  🏢 Admin: 21");
  console.log("  🏍️  Product: 4");
  console.log("  ⚙️  Settings: 3");
  console.log("  👥 Customer: 3");
  console.log("  🏍️  Vehicle: 2");
  console.log("  🗄️  Cache: 9");
  console.log("=".repeat(80));

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error("❌ Fatal error:", e);
  await prisma.$disconnect();
  process.exit(1);
});