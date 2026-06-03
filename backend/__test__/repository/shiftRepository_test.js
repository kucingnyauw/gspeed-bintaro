import prisma from "#app/database.js";
import ShiftRepository from "#repository/shiftRepository.js";

jest.mock("#app/database.js", () => ({
  shift: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  payment: {
    groupBy: jest.fn(),
  },
  expense: {
    aggregate: jest.fn(),
    groupBy: jest.fn(),
  },
}));

jest.mock("#shared/utils/pagination.js", () => ({
  generateMetadata: jest.fn((total, page, limit) => ({
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  })),
}));

/**
 * Unit test untuk ShiftRepository
 * @describe ShiftRepository
 */
describe("ShiftRepository", () => {
  let repo;

  beforeEach(() => {
    jest.clearAllMocks();
    repo = new ShiftRepository();
  });

  describe("create", () => {
    it("should create a new shift with OPEN status", async () => {
      const input = { cashierId: "cashier-1", startingCash: 1000000 };

      const expected = {
        id: "shift-1",
        status: "OPEN",
        startingCash: 1000000,
        openedAt: new Date(),
        cashier: { id: "cashier-1", fullName: "Kasir 1" },
      };

      prisma.shift.create.mockResolvedValue(expected);

      const result = await repo.create(input);

      expect(result).toEqual(expected);
      expect(prisma.shift.create).toHaveBeenCalledWith({
        data: {
          cashierId: "cashier-1",
          startingCash: 1000000,
          status: "OPEN",
          cashSales: 0,
          cashIn: 0,
          cashOut: 0,
          discrepancy: 0,
          openedAt: expect.any(Date),
        },
        select: {
          id: true,
          status: true,
          startingCash: true,
          openedAt: true,
          cashier: { select: { id: true, fullName: true } },
        },
      });
    });
  });

  describe("findById", () => {
    it("should return full shift with orders and expenses", async () => {
      const mockShift = {
        id: "shift-1",
        status: "CLOSED",
        startingCash: 1000000,
        endingCash: 6500000,
        cashier: { id: "c1", fullName: "Kasir 1" },
        orders: [],
        expenses: [],
      };

      prisma.shift.findUnique.mockResolvedValue(mockShift);

      const result = await repo.findById("shift-1");

      expect(result).toEqual(mockShift);
    });

    it("should return null when shift not found", async () => {
      prisma.shift.findUnique.mockResolvedValue(null);

      const result = await repo.findById("shift-99");

      expect(result).toBeNull();
    });
  });

  describe("findActiveByCashier", () => {
    it("should return active shift for cashier", async () => {
      const mockShift = {
        id: "shift-1",
        status: "OPEN",
        startingCash: 1000000,
        cashier: { id: "cashier-1", fullName: "Kasir 1" },
      };

      prisma.shift.findFirst.mockResolvedValue(mockShift);

      const result = await repo.findActiveByCashier("cashier-1");

      expect(result).toEqual(mockShift);
    });

    it("should return null when no active shift", async () => {
      prisma.shift.findFirst.mockResolvedValue(null);

      const result = await repo.findActiveByCashier("cashier-1");

      expect(result).toBeNull();
    });
  });

  describe("hasActiveShift", () => {
    it("should return true when cashier has active shift", async () => {
      prisma.shift.findFirst.mockResolvedValue({ id: "shift-1" });

      const result = await repo.hasActiveShift("cashier-1");

      expect(result).toBe(true);
    });

    it("should return false when no active shift", async () => {
      prisma.shift.findFirst.mockResolvedValue(null);

      const result = await repo.hasActiveShift("cashier-1");

      expect(result).toBe(false);
    });
  });

  describe("findMany", () => {
    it("should return shifts with default pagination", async () => {
      const mockData = [
        {
          id: "shift-1",
          status: "CLOSED",
          startingCash: 1000000,
          endingCash: 6500000,
          cashSales: 5500000,
          cashier: { id: "c1", fullName: "Kasir 1" },
          _count: { orders: 25, expenses: 5 },
        },
      ];

      prisma.shift.count.mockResolvedValue(1);
      prisma.shift.findMany.mockResolvedValue(mockData);

      const result = await repo.findMany({});

      expect(result.data).toEqual(mockData);
      expect(result.data).toHaveLength(1);
      expect(result.metadata.total).toBe(1);
    });

    it("should return shifts filtered by status", async () => {
      prisma.shift.count.mockResolvedValue(5);
      prisma.shift.findMany.mockResolvedValue([]);

      await repo.findMany({ status: "OPEN" });

      expect(prisma.shift.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { status: "OPEN" } })
      );
    });

    it("should return shifts filtered by date range", async () => {
      prisma.shift.count.mockResolvedValue(20);
      prisma.shift.findMany.mockResolvedValue([]);

      await repo.findMany({
        startDate: new Date("2025-01-01"),
        endDate: new Date("2025-06-30"),
      });

      expect(prisma.shift.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            openedAt: {
              gte: new Date("2025-01-01"),
              lte: new Date("2025-06-30"),
            },
          },
        })
      );
    });
  });

  describe("close", () => {
    it("should close a shift with closing data", async () => {
      const closeData = { endingCash: 6500000, expectedCash: 6500000, discrepancy: 0 };

      prisma.shift.update.mockResolvedValue({ status: "CLOSED", closedAt: new Date() });

      const result = await repo.close("shift-1", closeData);

      expect(result.status).toBe("CLOSED");
      expect(prisma.shift.update).toHaveBeenCalledWith({
        where: { id: "shift-1" },
        data: {
          endingCash: 6500000,
          expectedCash: 6500000,
          discrepancy: 0,
          status: "CLOSED",
          closedAt: expect.any(Date),
        },
        select: expect.any(Object),
      });
    });

    it("should close a shift with negative discrepancy", async () => {
      prisma.shift.update.mockResolvedValue({});

      await repo.close("shift-1", { endingCash: 6000000, expectedCash: 6500000, discrepancy: -500000 });

      expect(prisma.shift.update).toHaveBeenCalledWith({
        where: { id: "shift-1" },
        data: expect.objectContaining({ endingCash: 6000000, discrepancy: -500000 }),
        select: expect.any(Object),
      });
    });
  });

  describe("updateCashFlow", () => {
    it("should increment cash sales", async () => {
      prisma.shift.update.mockResolvedValue({ cashSales: 5500000 });

      await repo.updateCashFlow("shift-1", { cashSales: 500000 });

      expect(prisma.shift.update).toHaveBeenCalledWith({
        where: { id: "shift-1" },
        data: { cashSales: { increment: 500000 } },
        select: { id: true, cashSales: true, cashIn: true, cashOut: true },
      });
    });

    it("should update multiple cash flows at once", async () => {
      prisma.shift.update.mockResolvedValue({});

      await repo.updateCashFlow("shift-1", { cashSales: 500000, cashIn: 200000, cashOut: 100000 });

      expect(prisma.shift.update).toHaveBeenCalledWith({
        where: { id: "shift-1" },
        data: {
          cashSales: { increment: 500000 },
          cashIn: { increment: 200000 },
          cashOut: { increment: 100000 },
        },
        select: expect.any(Object),
      });
    });
  });

  describe("getShiftSummary", () => {
    it("should return shift summary with breakdowns", async () => {
      prisma.shift.findUnique.mockResolvedValue({
        id: "shift-1",
        status: "CLOSED",
        startingCash: 1000000,
        endingCash: 6500000,
        _count: { orders: 25, expenses: 5 },
      });
      prisma.payment.groupBy.mockResolvedValue([
        { method: "CASH", _sum: { amountPaid: 4000000 }, _count: { method: 20 } },
      ]);
      prisma.expense.groupBy.mockResolvedValue([
        { category: "SUPPLIES", _sum: { amount: 300000 } },
      ]);

      const result = await repo.getShiftSummary("shift-1");

      expect(result.id).toBe("shift-1");
      expect(result.paymentBreakdown).toHaveLength(1);
      expect(result.expenseBreakdown).toHaveLength(1);
    });

    it("should return null when shift not found", async () => {
      prisma.shift.findUnique.mockResolvedValue(null);

      const result = await repo.getShiftSummary("shift-99");

      expect(result).toBeNull();
    });
  });

  describe("findLastShiftByCashier", () => {
    it("should return the last shift for a cashier", async () => {
      const mockShift = { id: "shift-5", status: "CLOSED", endingCash: 2500000, closedAt: new Date() };

      prisma.shift.findFirst.mockResolvedValue(mockShift);

      const result = await repo.findLastShiftByCashier("cashier-1");

      expect(result).toEqual(mockShift);
    });

    it("should return null when cashier has no shifts", async () => {
      prisma.shift.findFirst.mockResolvedValue(null);

      const result = await repo.findLastShiftByCashier("cashier-new");

      expect(result).toBeNull();
    });
  });

  describe("calculateExpectedCash", () => {
    it("should calculate expected cash correctly", async () => {
      prisma.shift.findUnique.mockResolvedValue({
        id: "shift-1",
        startingCash: 1000000,
        cashSales: 5000000,
        cashIn: 200000,
        cashOut: 100000,
      });
      prisma.expense.aggregate.mockResolvedValue({ _sum: { amount: 500000 } });
      prisma.payment.groupBy.mockResolvedValue([
        { method: "CASH", _sum: { amountPaid: 3000000 }, _count: { method: 15 } },
      ]);

      const result = await repo.calculateExpectedCash("shift-1");

      expect(result.expectedCash).toBe(5600000);
      expect(result.paymentBreakdown.cash.total).toBe(3000000);
    });

    it("should return null when shift not found", async () => {
      prisma.shift.findUnique.mockResolvedValue(null);

      const result = await repo.calculateExpectedCash("shift-99");

      expect(result).toBeNull();
    });
  });
});