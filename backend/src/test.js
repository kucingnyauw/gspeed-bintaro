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

  console.log("=".repeat(80));
  console.log("🧪 TESTING ALL INSIGHT REPOSITORY FUNCTIONS (V2 - Agregat)");
  console.log("=".repeat(80));

  // ============================================================================
  // MEKANIK
  // ============================================================================
  console.log("\n" + "=".repeat(80));
  console.log("🔧 MEKANIK INSIGHTS");
  console.log("=".repeat(80));

  try {
    console.log("\n✅ getMechanicActiveJobs");
    const m1 = await insight.getMechanicActiveJobs(mechanicId);
    console.log(JSON.stringify(m1, null, 2));

    console.log("\n✅ getMechanicPendingJobs");
    const m2 = await insight.getMechanicPendingJobs(mechanicId);
    console.log(JSON.stringify(m2, null, 2));

    console.log("\n✅ getMechanicPerformanceSummary");
    const m3 = await insight.getMechanicPerformanceSummary(mechanicId);
    console.log(JSON.stringify(m3, null, 2));

    console.log("\n✅ getMechanicSpeedStats");
    const m4 = await insight.getMechanicSpeedStats(mechanicId);
    console.log(JSON.stringify(m4, null, 2));

    console.log("\n✅ getMechanicTopServices");
    const m5 = await insight.getMechanicTopServices(mechanicId);
    console.log(JSON.stringify(m5, null, 2));

    console.log("\n✅ getMechanicEarningsBreakdown");
    const m6 = await insight.getMechanicEarningsBreakdown(mechanicId);
    console.log(JSON.stringify(m6, null, 2));

    console.log("\n✅ getMechanicEfficiencyRank");
    const m7 = await insight.getMechanicEfficiencyRank(mechanicId);
    console.log(JSON.stringify(m7, null, 2));
  } catch (e) {
    console.log(`❌ Mechanic error: ${e.message}`);
  }

  // ============================================================================
  // KASIR
  // ============================================================================
  console.log("\n" + "=".repeat(80));
  console.log("💰 KASIR INSIGHTS");
  console.log("=".repeat(80));

  try {
    console.log("\n✅ getCashierTodaySummary");
    const k1 = await insight.getCashierTodaySummary(cashierId);
    console.log(JSON.stringify(k1, null, 2));

    console.log("\n✅ getCashierActiveShift");
    const k2 = await insight.getCashierActiveShift(cashierId);
    console.log(JSON.stringify(k2, null, 2));

    console.log("\n✅ getCashierPendingOrders");
    const k3 = await insight.getCashierPendingOrders(cashierId);
    console.log(JSON.stringify(k3, null, 2));

    console.log("\n✅ getCashierCustomerStats");
    const k4 = await insight.getCashierCustomerStats(cashierId);
    console.log(JSON.stringify(k4, null, 2));

    console.log("\n✅ getCashierShiftHistory");
    const k5 = await insight.getCashierShiftHistory(cashierId);
    console.log(JSON.stringify(k5, null, 2));

    console.log("\n✅ getCashierRecentTransactions");
    const k6 = await insight.getCashierRecentTransactions(cashierId);
    console.log(JSON.stringify(k6, null, 2));

    console.log("\n✅ getCashierComparisonStats");
    const k7 = await insight.getCashierComparisonStats(cashierId);
    console.log(JSON.stringify(k7, null, 2));
  } catch (e) {
    console.log(`❌ Cashier error: ${e.message}`);
  }

  // ============================================================================
  // ADMIN
  // ============================================================================
  console.log("\n" + "=".repeat(80));
  console.log("🏢 ADMIN INSIGHTS");
  console.log("=".repeat(80));

  try {
    console.log("\n✅ getAdminDashboardSnapshot");
    const a1 = await insight.getAdminDashboardSnapshot();
    console.log(JSON.stringify(a1, null, 2));

    console.log("\n✅ getAdminTodaySummary");
    const a2 = await insight.getAdminTodaySummary();
    console.log(JSON.stringify(a2, null, 2));

    console.log("\n✅ getAdminCashierPerformance");
    const a3 = await insight.getAdminCashierPerformance();
    console.log(JSON.stringify(a3, null, 2));

    console.log("\n✅ getAdminMechanicComparison");
    const a4 = await insight.getAdminMechanicComparison();
    console.log(JSON.stringify(a4, null, 2));

    console.log("\n✅ getAdminExpenseOverview");
    const a5 = await insight.getAdminExpenseOverview();
    console.log(JSON.stringify(a5, null, 2));

    console.log("\n✅ getAdminInventoryHealth");
    const a6 = await insight.getAdminInventoryHealth();
    console.log(JSON.stringify(a6, null, 2));

    console.log("\n✅ getAdminBusinessGrowth");
    const a7 = await insight.getAdminBusinessGrowth();
    console.log(JSON.stringify(a7, null, 2));

    console.log("\n✅ getAdminTopProducts");
    const a8 = await insight.getAdminTopProducts();
    console.log(JSON.stringify(a8, null, 2));

    console.log("\n✅ getAdminPeakHours");
    const a9 = await insight.getAdminPeakHours();
    console.log(JSON.stringify(a9, null, 2));

    console.log("\n✅ getAdminStockAlert");
    const a10 = await insight.getAdminStockAlert();
    console.log(JSON.stringify(a10, null, 2));

    console.log("\n✅ getAdminRevenueVsTarget");
    const a11 = await insight.getAdminRevenueVsTarget();
    console.log(JSON.stringify(a11, null, 2));

    console.log("\n✅ getAdminTopCustomersByVisit");
    const a12 = await insight.getAdminTopCustomersByVisit();
    console.log(JSON.stringify(a12, null, 2));

    console.log("\n✅ getAdminOrderCompletionTime");
    const a13 = await insight.getAdminOrderCompletionTime();
    console.log(JSON.stringify(a13, null, 2));

    console.log("\n✅ getAdminMechanicAvailability");
    const a14 = await insight.getAdminMechanicAvailability();
    console.log(JSON.stringify(a14, null, 2));

    console.log("\n✅ getAdminCustomerRetention");
    const a15 = await insight.getAdminCustomerRetention();
    console.log(JSON.stringify(a15, null, 2));

    console.log("\n✅ getAdminPaymentMethodDistribution");
    const a16 = await insight.getAdminPaymentMethodDistribution();
    console.log(JSON.stringify(a16, null, 2));
  } catch (e) {
    console.log(`❌ Admin error: ${e.message}`);
  }

  // ============================================================================
  // SUMMARY
  // ============================================================================
  console.log("\n" + "=".repeat(80));
  console.log("📊 TEST COMPLETE");
  console.log("=".repeat(80));
  console.log("  🔧 Mechanic: 7 functions");
  console.log("  💰 Cashier: 7 functions");
  console.log("  🏢 Admin: 16 functions");
  console.log("  📦 TOTAL: 30 functions");
  console.log("=".repeat(80));

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error("❌ Fatal error:", e);
  await prisma.$disconnect();
  process.exit(1);
});