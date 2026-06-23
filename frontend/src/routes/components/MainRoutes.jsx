/**
 * MainRoutes - Definisi rute utama aplikasi.
 *
 * Struktur rute:
 * - PrivateGuard membungkus MainLayout agar Header/Sidebar tidak dirender
 *   sebelum auth check selesai (status "unknown" atau "guest").
 * - RoleGuard membungkus setiap halaman untuk membatasi akses berdasarkan role.
 *
 * @returns {Object} Konfigurasi rute untuk React Router
 */
import { lazy } from "react";
import { RoleGuard, PrivateGuard } from "@routes/guard";
import { AppLoadable } from "@components";
import { Role } from "@shared/constant";
import MainLayout from "@layout/MainLayout.jsx";

const Dashboard = AppLoadable(
  lazy(() => import("@views/dashboard/pages/Dashboard.jsx"))
);

const POS = AppLoadable(lazy(() => import("@views/pos/pages/Pos.jsx")));

const Orders = AppLoadable(lazy(() => import("@views/orders/pages/Orders.jsx")));
const OrderHistory = AppLoadable(
  lazy(() => import("@views/orders/pages/OrderHistory.jsx"))
);

const Customers = AppLoadable(
  lazy(() => import("@views/customers/pages/Customers.jsx"))
);
const Vehicles = AppLoadable(
  lazy(() => import("@views/vehicles/pages/Vehicles.jsx"))
);

const Tasks = AppLoadable(lazy(() => import("@views/tasks/pages/Tasks.jsx")));
const MechanicTasks = AppLoadable(
  lazy(() => import("@views/tasks/pages/MechanicTasks.jsx"))
);
const UnassignedTasks = AppLoadable(
  lazy(() => import("@views/tasks/pages/UnassignedTasks.jsx"))
);
const AvailableMechanics = AppLoadable(
  lazy(() => import("@views/tasks/pages/AvailableMechanics.jsx"))
);

const TaskHistory = AppLoadable(
  lazy(() => import("@views/tasks/pages/TasksHistory.jsx"))
);

const Products = AppLoadable(
  lazy(() => import("@views/products/pages/Products.jsx"))
);
const StockMovements = AppLoadable(
  lazy(() => import("@views/stock/pages/StockMovements.jsx"))
);

const Payments = AppLoadable(
  lazy(() => import("@views/payments/pages/Payments.jsx"))
);
const Expenses = AppLoadable(
  lazy(() => import("@views/expenses/pages/Expenses.jsx"))
);

const ExpensesHistory = AppLoadable(
  lazy(() => import("@views/expenses/pages/ExpensesHistory.jsx"))
);

const Shifts = AppLoadable(lazy(() => import("@views/shifts/pages/Shifts.jsx")));
const AllShifts = AppLoadable(
  lazy(() => import("@views/shifts/pages/AllShifts.jsx"))
);

// Reports
const SalesReport = AppLoadable(
  lazy(() => import("@views/reports/pages/SalesReport.jsx"))
);
const ProfitLoss = AppLoadable(
  lazy(() => import("@views/reports/pages/ProfitLoss.jsx"))
);
const InventoryReport = AppLoadable(
  lazy(() => import("@views/reports/pages/InventoryReport.jsx"))
);
const TopProductsReport = AppLoadable(
  lazy(() => import("@views/reports/pages/TopProductsReport.jsx"))
);
const MechanicReport = AppLoadable(
  lazy(() => import("@views/reports/pages/MechanicReport.jsx"))
);
const ExpenseReport = AppLoadable(
  lazy(() => import("@views/reports/pages/ExpenseReport.jsx"))
);
const PaymentReport = AppLoadable(
  lazy(() => import("@views/reports/pages/PaymentReport.jsx"))
);
const CustomerReport = AppLoadable(
  lazy(() => import("@views/reports/pages/CustomerReport.jsx"))
);
const VehicleReport = AppLoadable(
  lazy(() => import("@views/reports/pages/VehicleReport.jsx"))
);

const Users = AppLoadable(lazy(() => import("@views/users/pages/Users.jsx")));
const Settings = AppLoadable(
  lazy(() => import("@views/settings/Settings.jsx"))
);

const TestView = AppLoadable(lazy(() => import("@views/test/Test.jsx")));

/**
 * Konfigurasi rute utama aplikasi.
 * 
 * Flow guard:
 * 1. PrivateGuard di level parent → memeriksa status auth
 *    - unknown → AppLoading (Header/Sidebar tidak dirender)
 *    - guest   → redirect ke /login
 *    - auth    → render MainLayout + children
 *    - degraded → render MainLayout + children
 * 2. RoleGuard di setiap halaman → memeriksa role user
 * 
 * @type {Object}
 * @property {string} path - Path root "/"
 * @property {JSX.Element} element - PrivateGuard membungkus MainLayout
 * @property {Array<Object>} children - Daftar rute anak
 */
const MainRoutes = {
  path: "/",
  element: (
    <PrivateGuard>
      <MainLayout />
    </PrivateGuard>
  ),
  children: [
    /**
     * Dashboard - Halaman utama
     * @route GET /
     * @access ADMIN, CASHIER, MECHANIC
     */
    {
      index: true,
      element: (
        <RoleGuard allowedRoles={[Role.ADMIN, Role.CASHIER, Role.MECHANIC]}>
          <Dashboard />
        </RoleGuard>
      ),
    },
    /**
     * Dashboard - Halaman utama (alias)
     * @route GET /dashboard
     * @access ADMIN, CASHIER, MECHANIC
     */
    {
      path: "dashboard",
      element: (
        <RoleGuard allowedRoles={[Role.ADMIN, Role.CASHIER, Role.MECHANIC]}>
          <Dashboard />
        </RoleGuard>
      ),
    },
    /**
     * POS - Point of Sale
     * @route GET /pos
     * @access CASHIER
     */
    {
      path: "pos",
      element: (
        <RoleGuard allowedRoles={[Role.CASHIER]}>
          <POS />
        </RoleGuard>
      ),
    },
    /**
     * Orders - Daftar pesanan aktif
     * @route GET /orders
     * @access CASHIER
     */
    {
      path: "orders",
      element: (
        <RoleGuard allowedRoles={[Role.CASHIER]}>
          <Orders />
        </RoleGuard>
      ),
    },
    /**
     * OrderHistory - Riwayat pesanan
     * @route GET /orders/history
     * @access ADMIN, CASHIER
     */
    {
      path: "orders/history",
      element: (
        <RoleGuard allowedRoles={[Role.ADMIN, Role.CASHIER]}>
          <OrderHistory />
        </RoleGuard>
      ),
    },
    /**
     * Customers - Manajemen pelanggan
     * @route GET /customers
     * @access CASHIER
     */
    {
      path: "customers",
      element: (
        <RoleGuard allowedRoles={[Role.CASHIER]}>
          <Customers />
        </RoleGuard>
      ),
    },
    /**
     * Vehicles - Manajemen kendaraan
     * @route GET /vehicles
     * @access CASHIER
     */
    {
      path: "vehicles",
      element: (
        <RoleGuard allowedRoles={[Role.CASHIER]}>
          <Vehicles />
        </RoleGuard>
      ),
    },
    /**
     * Tasks - Manajemen tugas (admin)
     * @route GET /tasks
     * @access ADMIN
     */
    {
      path: "tasks",
      element: (
        <RoleGuard allowedRoles={[Role.ADMIN]}>
          <Tasks />
        </RoleGuard>
      ),
    },
    /**
     * MechanicTasks - Tugas mekanik
     * @route GET /tasks/mechanic
     * @access MECHANIC
     */
    {
      path: "tasks/mechanic",
      element: (
        <RoleGuard allowedRoles={[Role.MECHANIC]}>
          <MechanicTasks />
        </RoleGuard>
      ),
    },
    /**
     * TaskHistory - Riwayat tugas
     * @route GET /tasks/history
     * @access ADMIN, MECHANIC
     */
    {
      path: "tasks/history",
      element: (
        <RoleGuard allowedRoles={[Role.ADMIN, Role.MECHANIC]}>
          <TaskHistory />
        </RoleGuard>
      ),
    },
    /**
     * UnassignedTasks - Tugas belum ditugaskan
     * @route GET /tasks/unassigned
     * @access CASHIER
     */
    {
      path: "tasks/unassigned",
      element: (
        <RoleGuard allowedRoles={[Role.CASHIER]}>
          <UnassignedTasks />
        </RoleGuard>
      ),
    },
    /**
     * AvailableMechanics - Mekanik tersedia
     * @route GET /tasks/mechanics/available
     * @access CASHIER
     */
    {
      path: "tasks/mechanics/available",
      element: (
        <RoleGuard allowedRoles={[Role.CASHIER]}>
          <AvailableMechanics />
        </RoleGuard>
      ),
    },
    /**
     * Products - Manajemen produk
     * @route GET /products
     * @access ADMIN
     */
    {
      path: "products",
      element: (
        <RoleGuard allowedRoles={[Role.ADMIN]}>
          <Products />
        </RoleGuard>
      ),
    },
    /**
     * StockMovements - Riwayat pergerakan stok
     * @route GET /stock/movements
     * @access ADMIN
     */
    {
      path: "stock/movements",
      element: (
        <RoleGuard allowedRoles={[Role.ADMIN]}>
          <StockMovements />
        </RoleGuard>
      ),
    },
    /**
     * Payments - Manajemen pembayaran
     * @route GET /payments
     * @access ADMIN, CASHIER
     */
    {
      path: "payments",
      element: (
        <RoleGuard allowedRoles={[Role.ADMIN, Role.CASHIER]}>
          <Payments />
        </RoleGuard>
      ),
    },
    /**
     * Expenses - Manajemen pengeluaran
     * @route GET /expenses
     * @access ADMIN, CASHIER
     */
    {
      path: "expenses",
      element: (
        <RoleGuard allowedRoles={[Role.ADMIN, Role.CASHIER]}>
          <Expenses />
        </RoleGuard>
      ),
    },
    /**
     * ExpensesHistory - Riwayat pengeluaran
     * @route GET /expenses/history
     * @access ADMIN
     */
    {
      path: "expenses/history",
      element: (
        <RoleGuard allowedRoles={[Role.ADMIN]}>
          <ExpensesHistory />
        </RoleGuard>
      ),
    },
    /**
     * Shifts - Manajemen shift
     * @route GET /shifts
     * @access ADMIN, CASHIER
     */
    {
      path: "shifts",
      element: (
        <RoleGuard allowedRoles={[Role.ADMIN, Role.CASHIER]}>
          <Shifts />
        </RoleGuard>
      ),
    },
    /**
     * AllShifts - Semua shift (admin)
     * @route GET /shifts/all
     * @access ADMIN
     */
    {
      path: "shifts/all",
      element: (
        <RoleGuard allowedRoles={[Role.ADMIN]}>
          <AllShifts />
        </RoleGuard>
      ),
    },
    /**
     * SalesReport - Laporan penjualan
     * @route GET /reports/sales
     * @access ADMIN
     */
    {
      path: "reports/sales",
      element: (
        <RoleGuard allowedRoles={[Role.ADMIN]}>
          <SalesReport />
        </RoleGuard>
      ),
    },
    /**
     * ProfitLoss - Laporan laba rugi
     * @route GET /reports/profit-loss
     * @access ADMIN
     */
    {
      path: "reports/profit-loss",
      element: (
        <RoleGuard allowedRoles={[Role.ADMIN]}>
          <ProfitLoss />
        </RoleGuard>
      ),
    },
    /**
     * InventoryReport - Laporan inventori
     * @route GET /reports/inventory
     * @access ADMIN
     */
    {
      path: "reports/inventory",
      element: (
        <RoleGuard allowedRoles={[Role.ADMIN]}>
          <InventoryReport />
        </RoleGuard>
      ),
    },
    /**
     * TopProductsReport - Laporan produk teratas
     * @route GET /reports/top-products
     * @access ADMIN
     */
    {
      path: "reports/top-products",
      element: (
        <RoleGuard allowedRoles={[Role.ADMIN]}>
          <TopProductsReport />
        </RoleGuard>
      ),
    },
    /**
     * MechanicReport - Laporan mekanik
     * @route GET /reports/mechanics
     * @access ADMIN
     */
    {
      path: "reports/mechanics",
      element: (
        <RoleGuard allowedRoles={[Role.ADMIN]}>
          <MechanicReport />
        </RoleGuard>
      ),
    },
    /**
     * ExpenseReport - Laporan pengeluaran
     * @route GET /reports/expenses
     * @access ADMIN
     */
    {
      path: "reports/expenses",
      element: (
        <RoleGuard allowedRoles={[Role.ADMIN]}>
          <ExpenseReport />
        </RoleGuard>
      ),
    },
    /**
     * PaymentReport - Laporan pembayaran
     * @route GET /reports/payments
     * @access ADMIN
     */
    {
      path: "reports/payments",
      element: (
        <RoleGuard allowedRoles={[Role.ADMIN]}>
          <PaymentReport />
        </RoleGuard>
      ),
    },
    /**
     * CustomerReport - Laporan pelanggan
     * @route GET /reports/customers
     * @access ADMIN
     */
    {
      path: "reports/customers",
      element: (
        <RoleGuard allowedRoles={[Role.ADMIN]}>
          <CustomerReport />
        </RoleGuard>
      ),
    },
    /**
     * VehicleReport - Laporan kendaraan
     * @route GET /reports/vehicles
     * @access ADMIN
     */
    {
      path: "reports/vehicles",
      element: (
        <RoleGuard allowedRoles={[Role.ADMIN]}>
          <VehicleReport />
        </RoleGuard>
      ),
    },
    /**
     * Users - Manajemen pengguna
     * @route GET /users
     * @access ADMIN
     */
    {
      path: "users",
      element: (
        <RoleGuard allowedRoles={[Role.ADMIN]}>
          <Users />
        </RoleGuard>
      ),
    },
    /**
     * Settings - Pengaturan aplikasi
     * @route GET /settings
     * @access ADMIN
     */
    {
      path: "settings",
      element: (
        <RoleGuard allowedRoles={[Role.ADMIN]}>
          <Settings />
        </RoleGuard>
      ),
    },
    /**
     * TestView - Halaman testing (development only)
     * @route GET /test
     * @access Public (no guard)
     */
    {
      path: "test",
      element: <TestView />,
    },
  ],
};

export default MainRoutes;