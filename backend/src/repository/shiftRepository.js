import prisma from "#app/database.js";
import Pagination from "#shared/utils/pagination.js";

class ShiftRepository {
  #defaultSelect = {
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
  };

  #fullSelect = {
    ...this.#defaultSelect,
    cashierId: true,
    cashier: {
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        phone: true,
      },
    },
    orders: {
      select: {
        id: true,
        orderNumber: true,
        status: true,
        total: true,
        createdAt: true,
        customer: { select: { id: true, name: true } },
        payment: {
          select: { id: true, method: true, amountPaid: true, status: true },
        },
        items: {
          select: {
            id: true,
            quantity: true,
            productNameSnapshot: true,
            unitPrice: true,
            subtotal: true,
            product: { select: { id: true, name: true, type: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    },
    expenses: {
      select: {
        id: true,
        title: true,
        amount: true,
        category: true,
        date: true,
        receipt: { select: { id: true, path: true } },
      },
      orderBy: { date: "desc" },
    },
  };

  #listSelect = {
    id: true,
    status: true,
    startingCash: true,
    endingCash: true,
    expectedCash: true,
    cashSales: true,
    discrepancy: true,
    openedAt: true,
    closedAt: true,
    cashier: { select: { id: true, fullName: true } },
    _count: { select: { orders: true, expenses: true } },
  };

  /**
   * Membuat shift baru
   * @param {Object} data - Data shift
   * @param {string} data.cashierId - ID kasir
   * @param {number} data.startingCash - Saldo awal
   * @returns {Promise<Object>} Shift yang baru dibuat
   */
  async create(data) {
    return prisma.shift.create({
      data: {
        cashierId: data.cashierId,
        startingCash: data.startingCash,
        status: "OPEN",
        cashSales: 0,
        cashIn: 0,
        cashOut: 0,
        discrepancy: 0,
        openedAt: new Date(),
      },
      select: {
        id: true,
        status: true,
        startingCash: true,
        openedAt: true,
        cashier: { select: { id: true, fullName: true } },
      },
    });
  }

  /**
   * Mencari shift berdasarkan ID dengan relasi lengkap
   * @param {string} id - ID shift
   * @returns {Promise<Object|null>} Shift dengan orders, expenses, dan cashier
   */
  async findById(id) {
    return prisma.shift.findUnique({ where: { id }, select: this.#fullSelect });
  }

  /**
   * Mencari shift aktif kasir
   * @param {string} cashierId - ID kasir
   * @returns {Promise<Object|null>} Shift aktif atau null
   */
  async findActiveByCashier(cashierId) {
    return prisma.shift.findFirst({
      where: { cashierId, status: "OPEN" },
      select: {
        ...this.#defaultSelect,
        cashier: { select: { id: true, fullName: true } },
      },
    });
  }

  /**
   * Cek apakah kasir memiliki shift aktif
   * @param {string} cashierId - ID kasir
   * @returns {Promise<boolean>} True jika ada shift aktif
   */
  async hasActiveShift(cashierId) {
    const shift = await prisma.shift.findFirst({
      where: { cashierId, status: "OPEN" },
      select: { id: true },
    });
    return !!shift;
  }

  /**
   * Mencari daftar shift dengan paginasi dan filter
   * @param {Object} [query={}] - Parameter query
   * @param {number} [query.page=1] - Nomor halaman
   * @param {number} [query.limit=10] - Jumlah item per halaman
   * @param {string} [query.status] - Filter berdasarkan status (OPEN/CLOSED)
   * @param {string} [query.cashierId] - Filter berdasarkan ID kasir
   * @param {string} [query.search] - Pencarian berdasarkan nama, email, atau telepon kasir
   * @param {string|Date} [query.startDate] - Filter tanggal mulai
   * @param {string|Date} [query.endDate] - Filter tanggal akhir
   * @param {string} [query.sortBy="openedAt"] - Field sorting (openedAt/closedAt/cashSales/discrepancy)
   * @param {string} [query.sortOrder="desc"] - Arah sorting (asc/desc)
   * @returns {Promise<{data: Array, metadata: Object}>} Daftar shift dan metadata
   */
  async findMany(query = {}) {
    const limit = query.limit || 10;
    const skip = ((query.page || 1) - 1) * limit;

    const where = {};

    if (query.status) where.status = query.status;
    if (query.cashierId) where.cashierId = query.cashierId;

    if (query.startDate || query.endDate) {
      where.openedAt = {};
      if (query.startDate) where.openedAt.gte = new Date(query.startDate);
      if (query.endDate) where.openedAt.lte = new Date(query.endDate);
    }

    if (query.search) {
      where.cashier = {
        OR: [
          { fullName: { contains: query.search, mode: "insensitive" } },
          { phone: { contains: query.search, mode: "insensitive" } },
          { email: { contains: query.search, mode: "insensitive" } },
        ],
      };
    }

    const validSortFields = [
      "openedAt",
      "closedAt",
      "cashSales",
      "discrepancy",
    ];
    const sortBy = validSortFields.includes(query.sortBy)
      ? query.sortBy
      : "openedAt";
    const sortOrder = query.sortOrder === "asc" ? "asc" : "desc";

    const [total, data] = await Promise.all([
      prisma.shift.count({ where }),
      prisma.shift.findMany({
        where,
        skip,
        take: limit,
        select: this.#listSelect,
        orderBy: { [sortBy]: sortOrder },
      }),
    ]);

    return {
      data,
      metadata: Pagination.generateMetadata(total, query.page || 1, limit),
    };
  }

  /**
   * Menutup shift
   * @param {string} id - ID shift
   * @param {Object} data - Data penutupan
   * @param {number} data.endingCash - Saldo akhir aktual
   * @param {number} data.expectedCash - Saldo yang diharapkan
   * @param {number} data.discrepancy - Selisih saldo
   * @returns {Promise<Object>} Shift yang sudah ditutup
   */
  async close(id, data) {
    return prisma.shift.update({
      where: { id },
      data: {
        endingCash: data.endingCash,
        expectedCash: data.expectedCash,
        discrepancy: data.discrepancy,
        status: "CLOSED",
        closedAt: new Date(),
      },
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
      },
    });
  }

  /**
   * Update cash flow shift (atomic increment)
   * @param {string} shiftId - ID shift
   * @param {Object} data - Data update
   * @param {number} [data.cashSales] - Penjualan tunai
   * @param {number} [data.cashIn] - Kas masuk
   * @param {number} [data.cashOut] - Kas keluar
   * @returns {Promise<Object>} Shift dengan nilai terbaru
   */
  async updateCashFlow(shiftId, data) {
    const updatePayload = {};
    if (data.cashSales !== undefined)
      updatePayload.cashSales = { increment: data.cashSales };
    if (data.cashIn !== undefined)
      updatePayload.cashIn = { increment: data.cashIn };
    if (data.cashOut !== undefined)
      updatePayload.cashOut = { increment: data.cashOut };

    return prisma.shift.update({
      where: { id: shiftId },
      data: updatePayload,
      select: { id: true, cashSales: true, cashIn: true, cashOut: true },
    });
  }

  /**
   * Mendapatkan ringkasan shift dengan breakdown pembayaran dan pengeluaran
   * @param {string} shiftId - ID shift
   * @returns {Promise<Object|null>} Ringkasan shift dengan paymentBreakdown dan expenseBreakdown
   */
  async getShiftSummary(shiftId) {
    const [shift, paymentAgg, expenseAgg] = await Promise.all([
      prisma.shift.findUnique({
        where: { id: shiftId },
        select: {
          id: true,
          status: true,
          startingCash: true,
          endingCash: true,
          expectedCash: true,
          discrepancy: true,
          cashSales: true,
          cashIn: true,
          cashOut: true,
          openedAt: true,
          closedAt: true,
          _count: { select: { orders: true, expenses: true } },
        },
      }),
      prisma.payment.groupBy({
        by: ["method"],
        where: { order: { shiftId, deletedAt: null } },
        _sum: { amountPaid: true },
        _count: { method: true },
      }),
      prisma.expense.groupBy({
        by: ["category"],
        where: { shiftId },
        _sum: { amount: true },
      }),
    ]);

    if (!shift) return null;

    return {
      ...shift,
      paymentBreakdown: paymentAgg.map((p) => ({
        method: p.method,
        total: p._sum.amountPaid || 0,
        count: p._count.method,
      })),
      expenseBreakdown: expenseAgg.map((e) => ({
        category: e.category,
        total: e._sum.amount || 0,
      })),
    };
  }

  /**
   * Mencari shift terakhir kasir (untuk saran starting cash)
   * @param {string} cashierId - ID kasir
   * @returns {Promise<Object|null>} Shift terakhir dengan endingCash
   */
  async findLastShiftByCashier(cashierId) {
    return prisma.shift.findFirst({
      where: { cashierId },
      orderBy: { openedAt: "desc" },
      select: {
        id: true,
        status: true,
        endingCash: true,
        closedAt: true,
        openedAt: true,
      },
    });
  }

  /**
   * Menghitung expected cash shift berdasarkan formula
   * Formula: startingCash + cashSales + cashIn - cashOut - totalExpenses
   * @param {string} shiftId - ID shift
   * @returns {Promise<Object|null>} Detail perhitungan expected cash
   */
  async calculateExpectedCash(shiftId) {
    const shift = await prisma.shift.findUnique({
      where: { id: shiftId },
      select: {
        id: true,
        startingCash: true,
        cashSales: true,
        cashIn: true,
        cashOut: true,
        status: true,
      },
    });

    if (!shift) return null;

    const [totalExpenses, paymentBreakdown] = await Promise.all([
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

    const totalExpenseAmount = totalExpenses._sum.amount || 0;
    const cashPayments = paymentBreakdown.find((p) => p.method === "CASH");
    const qrisPayments = paymentBreakdown.find((p) => p.method === "QRIS");

    const expectedCash =
      shift.startingCash +
      shift.cashSales +
      shift.cashIn -
      shift.cashOut -
      totalExpenseAmount;

    return {
      shiftId: shift.id,
      startingCash: shift.startingCash,
      cashSales: shift.cashSales,
      cashIn: shift.cashIn,
      cashOut: shift.cashOut,
      totalExpenses: totalExpenseAmount,
      expectedCash,
      paymentBreakdown: {
        cash: {
          total: cashPayments?._sum.amountPaid || 0,
          count: cashPayments?._count.method || 0,
        },
        qris: {
          total: qrisPayments?._sum.amountPaid || 0,
          count: qrisPayments?._count.method || 0,
        },
      },
      formula: "startingCash + cashSales + cashIn - cashOut - totalExpenses",
    };
  }
}

export default ShiftRepository;
