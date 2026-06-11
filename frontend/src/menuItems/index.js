/**
 * Konfigurasi menu sidebar aplikasi G-Speed.
 *
 * Struktur menu:
 * - Group: Kategori utama dengan judul dan roles
 * - Item: Halaman individual dengan URL, icon, dan roles
 *
 * Role-based access:
 * - ADMIN: Akses penuh ke semua menu
 * - CASHIER: Penjualan, Pesanan, Pelanggan, Keuangan, Tugas
 * - MECHANIC: Dashboard, Tugas Saya, Riwayat Tugas
 *
 * @module menuItems
 */
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
  Code,
  BookOpen,
} from "lucide-react";

import { Role } from "@shared/constant/enum.js";

/**
 * URL API dari environment variable.
 *
 * @type {string}
 */
const apiUrl = import.meta.env.VITE_API_URL || window.location.origin;

/**
 * Konfigurasi menu items dengan role-based access control.
 *
 * @type {Object}
 * @property {Array<Object>} items - Daftar menu items
 */
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

    {
      id: "docsGroup",
      title: "Dokumentasi",
      type: "group",
      roles: [Role.ADMIN, Role.CASHIER, Role.MECHANIC],
      children: [
        {
          id: "docsGuide",
          title: "Panduan Pengguna",
          type: "item",
          url: "https://gspeed.mintlify.app",
          icon: BookOpen,
          external: true,
          roles: [Role.ADMIN, Role.CASHIER, Role.MECHANIC],
        },
        {
          id: "docsApi",
          title: "API Reference",
          type: "item",
          url: `${apiUrl}/docs`,
          icon: Code,
          roles: [Role.ADMIN],
        },
      ],
    },
  ],
};

/**
 * Normalisasi role ke lowercase string.
 * Mendukung input string maupun enum Role.
 *
 * @param {string|Role} role - Role user
 * @returns {string} Role dalam lowercase, atau string kosong jika invalid
 *
 * @example
 * normalize("ADMIN") // "admin"
 * normalize(Role.CASHIER) // "cashier"
 */
const normalize = (role) =>
  typeof role === "string"
    ? role.toLowerCase()
    : Role[role]?.toLowerCase() || "";

/**
 * Filter menu items berdasarkan role user.
 * Hanya mengembalikan item dan children yang diizinkan untuk role tersebut.
 * Group tanpa children yang valid tidak akan ditampilkan.
 *
 * @param {Array<Object>} items - Array menu items dari konfigurasi
 * @param {string} userRole - Role user yang sedang login
 * @returns {Array<Object>} Menu items yang sudah difilter dan dibersihkan dari field `roles`
 *
 * @example
 * const filtered = filterMenuByRole(menuItems.items, "admin");
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
 * Mendapatkan semua halaman yang bisa diakses user untuk fitur pencarian.
 * Melakukan traverse seluruh menu tree dan mengumpulkan item dengan URL.
 *
 * @param {string} userRole - Role user yang sedang login
 * @returns {Array<{label: string, path: string}>} Array halaman yang bisa diakses
 *
 * @example
 * const pages = getSearchPages("cashier");
 */
const getSearchPages = (userRole) => {
  if (!userRole) return [];

  const normalizedRole = normalize(userRole);
  const pages = [];

  /**
   * Traverse menu items secara rekursif.
   * Mengumpulkan item dengan URL ke dalam array pages.
   *
   * @param {Array<Object>} menuItems - Array menu items
   */
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