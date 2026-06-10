import {
  LayoutDashboard,
  Users,
  Package,
  Store,
  DollarSign,
  TrendingUp,
  ClipboardList,
  History,
  CreditCard,
  Receipt,
  Clock,
  Car,
  Wrench,
  UserCog,
  UserCheck,
  ListOrdered,
  Banknote,
  FileText,
  Activity,
  UserPlus,
  ArrowLeftRight,
  Cog,
  BarChart3,
  PieChart,
} from "lucide-react";

import { Role } from "@shared/constant/enum.js";

const menuItems = {
  items: [
    {
      id: "dashboardGroup",
      title: "Dashboard",
      type: "group",
      roles: [Role.ADMIN, Role.CASHIER, Role.MECHANIC],
      children: [
        {
          id: "dashboardOverview",
          title: "Beranda",
          type: "item",
          url: "/dashboard",
          icon: LayoutDashboard,
          roles: [Role.ADMIN, Role.CASHIER, Role.MECHANIC],
        },
      ],
    },
    // ===== KASIR ONLY =====
    {
      id: "salesGroup",
      title: "Penjualan",
      type: "group",
      roles: [Role.CASHIER],
      children: [
        {
          id: "salesPos",
          title: "Point of Sale",
          type: "item",
          url: "/pos",
          icon: Store,
          roles: [Role.CASHIER],
        },
        {
          id: "salesOrders",
          title: "Pesanan Aktif",
          type: "item",
          url: "/orders",
          icon: ListOrdered,
          roles: [Role.CASHIER],
        },
      ],
    },
    // ===== ADMIN + KASIR =====
    {
      id: "ordersGroup",
      title: "Pesanan",
      type: "group",
      roles: [Role.ADMIN, Role.CASHIER],
      children: [
        {
          id: "ordersHistory",
          title: "Riwayat Pesanan",
          type: "item",
          url: "/orders/history",
          icon: History,
          roles: [Role.ADMIN, Role.CASHIER],
        },
      ],
    },
    // ===== ADMIN + KASIR =====
    {
      id: "customersGroup",
      title: "Pelanggan",
      type: "group",
      roles: [Role.CASHIER],
      children: [
        {
          id: "customersList",
          title: "Data Pelanggan",
          type: "item",
          url: "/customers",
          icon: Users,
          roles: [Role.CASHIER],
        },
        {
          id: "customersVehicles",
          title: "Data Kendaraan",
          type: "item",
          url: "/vehicles",
          icon: Car,
          roles: [Role.CASHIER],
        },
      ],
    },
    // ===== MEKANIK ONLY (+ ADMIN + CASHIER lihat) =====
    {
      id: "operationsGroup",
      title: "Operasional",
      type: "group",
      roles: [Role.ADMIN, Role.MECHANIC, Role.CASHIER],
      children: [
        {
          id: "operationsMyTasks",
          title: "Tugas Saya",
          type: "item",
          url: "/tasks/mechanic",
          icon: Wrench,
          roles: [Role.MECHANIC],
        },
        {
          id: "operationsMyTaskHistory",
          title: "Riwayat Tugas",
          type: "item",
          url: "/tasks/history",
          icon: History,
          roles: [Role.MECHANIC],
        },
        {
          id: "operationsAllTasks",
          title: "Semua Tugas",
          type: "item",
          url: "/tasks",
          icon: ClipboardList,
          roles: [Role.ADMIN],
        },
        {
          id: "operationsUnassignedTasks",
          title: "Tugas Belum Ditugaskan",
          type: "item",
          url: "/tasks/unassigned",
          icon: UserPlus,
          roles: [Role.CASHIER],
        },
        {
          id: "operationsAvailableMechanics",
          title: "Mekanik Tersedia",
          type: "item",
          url: "/tasks/mechanics/available",
          icon: UserCheck,
          roles: [Role.CASHIER],
        },
      ],
    },
    // ===== ADMIN ONLY =====
    {
      id: "inventoryGroup",
      title: "Inventaris",
      type: "group",
      roles: [Role.ADMIN],
      children: [
        {
          id: "inventoryProducts",
          title: "Daftar Produk",
          type: "item",
          url: "/products",
          icon: Package,
          roles: [Role.ADMIN],
        },
        {
          id: "inventoryStock",
          title: "Mutasi Stok",
          type: "item",
          url: "/stock/movements",
          icon: ArrowLeftRight,
          roles: [Role.ADMIN],
        },
      ],
    },
    // ===== ADMIN + KASIR =====
    {
      id: "financeGroup",
      title: "Keuangan",
      type: "group",
      roles: [Role.ADMIN, Role.CASHIER],
      children: [
        {
          id: "financePayments",
          title: "Pembayaran",
          type: "item",
          url: "/payments",
          icon: Banknote,
          roles: [Role.ADMIN, Role.CASHIER],
        },
        {
          id: "financeExpenses",
          title: "Pengeluaran",
          type: "item",
          url: "/expenses",
          icon: Receipt,
          roles: [Role.CASHIER],
        },
        {
          id: "financeExpensesHistory",
          title: "Riwayat Pengeluaran",
          type: "item",
          url: "/expenses/history",
          icon: History,
          roles: [Role.ADMIN],
        },
        {
          id: "financeShifts",
          title: "Shift Saya",
          type: "item",
          url: "/shifts",
          icon: Clock,
          roles: [Role.CASHIER],
        },
        {
          id: "financeAllShifts",
          title: "Semua Shift",
          type: "item",
          url: "/shifts/all",
          icon: Activity,
          roles: [Role.ADMIN],
        },
      ],
    },
    // ===== ADMIN ONLY =====
    {
      id: "reportsGroup",
      title: "Laporan",
      type: "group",
      roles: [Role.ADMIN],
      children: [
        {
          id: "reportsSales",
          title: "Penjualan",
          type: "item",
          url: "/reports/sales",
          icon: TrendingUp,
          roles: [Role.ADMIN],
        },
        {
          id: "reportsProfitLoss",
          title: "Laba & Rugi",
          type: "item",
          url: "/reports/profit-loss",
          icon: DollarSign,
          roles: [Role.ADMIN],
        },
        {
          id: "reportsInventory",
          title: "Inventaris",
          type: "item",
          url: "/reports/inventory",
          icon: Package,
          roles: [Role.ADMIN],
        },
        {
          id: "reportsTopProducts",
          title: "Produk Terlaris",
          type: "item",
          url: "/reports/top-products",
          icon: BarChart3,
          roles: [Role.ADMIN],
        },
        {
          id: "reportsMechanics",
          title: "Performa Mekanik",
          type: "item",
          url: "/reports/mechanics",
          icon: UserCog,
          roles: [Role.ADMIN],
        },
        {
          id: "reportsExpenses",
          title: "Pengeluaran",
          type: "item",
          url: "/reports/expenses",
          icon: FileText,
          roles: [Role.ADMIN],
        },
        {
          id: "reportsPayments",
          title: "Pembayaran",
          type: "item",
          url: "/reports/payments",
          icon: CreditCard,
          roles: [Role.ADMIN],
        },
        {
          id: "reportsCustomers",
          title: "Pelanggan",
          type: "item",
          url: "/reports/customers",
          icon: PieChart,
          roles: [Role.ADMIN],
        },
        {
          id: "reportsVehicles",
          title: "Kendaraan",
          type: "item",
          url: "/reports/vehicles",
          icon: Car,
          roles: [Role.ADMIN],
        },
      ],
    },
    // ===== ADMIN ONLY =====
    {
      id: "usersGroup",
      title: "Karyawan",
      type: "group",
      roles: [Role.ADMIN],
      children: [
        {
          id: "usersAll",
          title: "Semua Karyawan",
          type: "item",
          url: "/users",
          icon: Users,
          roles: [Role.ADMIN],
        },
      ],
    },
    // ===== ADMIN ONLY =====
    {
      id: "settingsGroup",
      title: "Pengaturan",
      type: "group",
      roles: [Role.ADMIN],
      children: [
        {
          id: "settingsSystem",
          title: "Pengaturan Sistem",
          type: "item",
          url: "/settings",
          icon: Cog,
          roles: [Role.ADMIN],
        },
      ],
    },
  ],
};

/**
 * Normalize role ke lowercase string
 * @param {string} role - Role user
 * @returns {string} Normalized role
 */
const normalize = (role) =>
  typeof role === "string"
    ? role.toLowerCase()
    : Role[role]?.toLowerCase() || "";

/**
 * Filter menu items berdasarkan role user
 * @param {Array} items - Array menu items
 * @param {string} userRole - Role user
 * @returns {Array} Filtered menu items
 */
const filterMenuByRole = (items, userRole) => {
  if (!userRole) return [];

  const normalizedUserRole = normalize(userRole);

  return items
    .map((item) => {
      const allowedRoles = (item.roles || []).map((r) => normalize(r));
      if (!allowedRoles.includes(normalizedUserRole)) return null;

      const children = (item.children || [])
        .filter((child) => {
          const childRoles = (child.roles || []).map((r) => normalize(r));
          return childRoles.includes(normalizedUserRole);
        })
        .map(({ roles, ...rest }) => rest);

      if (item.children && children.length === 0) return null;

      const { roles, ...cleanItem } = item;
      return { ...cleanItem, children };
    })
    .filter(Boolean);
};

/**
 * Mendapatkan semua halaman yang bisa diakses user berdasarkan role
 * @param {string} userRole - Role user
 * @returns {Array} Array halaman { label, path }
 */
const getSearchPages = (userRole) => {
  if (!userRole) return [];

  const normalizedRole = normalize(userRole);
  const pages = [];

  const traverse = (menuItems) => {
    menuItems.forEach((item) => {
      const allowedRoles = (item.roles || []).map((r) => normalize(r));

      if (allowedRoles.includes(normalizedRole)) {
        if (item.type === "item" && item.url && item.title) {
          pages.push({ label: item.title, path: item.url });
        }
        if (item.children) {
          traverse(item.children);
        }
      }
    });
  };

  traverse(menuItems.items);
  return pages;
};

export { filterMenuByRole, menuItems, getSearchPages };
