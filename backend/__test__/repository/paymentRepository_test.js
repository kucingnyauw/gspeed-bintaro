import prisma from "#app/database.js";
import PaymentRepository from "#repository/paymentRepository.js";

jest.mock("#app/database.js", () => ({
  payment: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
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
 * Unit test untuk PaymentRepository
 * @describe PaymentRepository
 */
describe("PaymentRepository", () => {
  let repo;

  beforeEach(() => {
    jest.clearAllMocks();
    repo = new PaymentRepository();
  });

  describe("create", () => {
    it("should create a CASH payment with PAID status", async () => {
      const input = {
        orderId: "order-1",
        method: "CASH",
        amountPaid: 120000,
        change: 20000,
        status: "PAID",
      };

      prisma.payment.create.mockResolvedValue({ id: "pay-1", status: "PAID" });

      await repo.create(input);

      expect(prisma.payment.create).toHaveBeenCalledWith({
        data: {
          orderId: "order-1",
          method: "CASH",
          amountPaid: 120000,
          change: 20000,
          status: "PAID",
          paidAt: expect.any(Date),
        },
        select: expect.any(Object),
      });
    });

    it("should create a QRIS payment with PENDING status", async () => {
      const input = {
        orderId: "order-2",
        method: "QRIS",
        amountPaid: 0,
        status: "PENDING",
      };

      prisma.payment.create.mockResolvedValue({ id: "pay-2", status: "PENDING", paidAt: null });

      await repo.create(input);

      expect(prisma.payment.create).toHaveBeenCalledWith({
        data: {
          orderId: "order-2",
          method: "QRIS",
          amountPaid: 0,
          change: 0,
          status: "PENDING",
          paidAt: null,
        },
        select: expect.any(Object),
      });
    });

    it("should create a payment with default change and status when not provided", async () => {
      const input = {
        orderId: "order-3",
        method: "CASH",
        amountPaid: 100000,
      };
    
      prisma.payment.create.mockResolvedValue({});
    
      await repo.create(input);
    
      expect(prisma.payment.create).toHaveBeenCalledWith({
        data: {
          orderId: "order-3",
          method: "CASH",
          amountPaid: 100000,
          change: 0,
          status: "PAID",
          paidAt: null,
        },
        select: expect.any(Object),
      });
    });
  });

  describe("findById", () => {
    it("should return payment with full invoice when found", async () => {
      const mockPayment = {
        id: "pay-1",
        method: "CASH",
        amountPaid: 120000,
        status: "PAID",
        paidAt: new Date(),
        order: {
          id: "order-1",
          orderNumber: "ORD-001",
          subtotal: 100000,
          tax: 11000,
          total: 111000,
          cashier: { id: "cashier-1", fullName: "Kasir 1" },
          customer: { id: "cust-1", name: "Budi", phone: "0812" },
          vehicle: { id: "veh-1", plateNumber: "B 1234 CD", brand: "Vespa", model: "Sprint" },
          items: [],
        },
      };

      prisma.payment.findUnique.mockResolvedValue(mockPayment);

      const result = await repo.findById("pay-1");

      expect(result).toEqual(mockPayment);
    });

    it("should return null when not found", async () => {
      prisma.payment.findUnique.mockResolvedValue(null);

      const result = await repo.findById("pay-99");

      expect(result).toBeNull();
    });
  });

  describe("findByOrderId", () => {
    it("should return payment by order ID", async () => {
      const mockPayment = {
        id: "pay-1",
        method: "CASH",
        amountPaid: 120000,
        status: "PAID",
        order: { id: "order-1", orderNumber: "ORD-001" },
      };

      prisma.payment.findUnique.mockResolvedValue(mockPayment);

      const result = await repo.findByOrderId("order-1");

      expect(result).toEqual(mockPayment);
    });

    it("should return null when order has no payment", async () => {
      prisma.payment.findUnique.mockResolvedValue(null);

      const result = await repo.findByOrderId("order-99");

      expect(result).toBeNull();
    });
  });

  describe("findMany", () => {
    it("should return payments with default pagination", async () => {
      const mockData = [
        {
          id: "pay-1",
          method: "CASH",
          amountPaid: 120000,
          change: 20000,
          status: "PAID",
          paidAt: new Date(),
          createdAt: new Date(),
          order: {
            id: "order-1",
            orderNumber: "ORD-001",
            subtotal: 100000,
            tax: 11000,
            total: 111000,
            cashier: { id: "c1", fullName: "Kasir" },
            customer: { id: "cust-1", name: "Budi" },
            items: [],
          },
        },
      ];

      prisma.payment.count.mockResolvedValue(1);
      prisma.payment.findMany.mockResolvedValue(mockData);

      const result = await repo.findMany({});

      expect(result.data).toEqual(mockData);
      expect(result.data).toHaveLength(1);
      expect(result.metadata.total).toBe(1);
    });

    it("should return payments filtered by status", async () => {
      prisma.payment.count.mockResolvedValue(10);
      prisma.payment.findMany.mockResolvedValue([]);

      await repo.findMany({ status: "PAID" });

      expect(prisma.payment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { status: "PAID" } })
      );
    });

    it("should return payments filtered by method", async () => {
      prisma.payment.count.mockResolvedValue(8);
      prisma.payment.findMany.mockResolvedValue([]);

      await repo.findMany({ method: "QRIS" });

      expect(prisma.payment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { method: "QRIS" } })
      );
    });

    it("should return empty array when no payments", async () => {
      prisma.payment.count.mockResolvedValue(0);
      prisma.payment.findMany.mockResolvedValue([]);

      const result = await repo.findMany({});

      expect(result.data).toEqual([]);
      expect(result.metadata.total).toBe(0);
    });
  });

  describe("updateStatus", () => {
    it("should update status to PAID with paidAt", async () => {
      prisma.payment.update.mockResolvedValue({ id: "pay-1", status: "PAID", paidAt: new Date() });

      await repo.updateStatus("pay-1", "PAID");

      expect(prisma.payment.update).toHaveBeenCalledWith({
        where: { id: "pay-1" },
        data: { status: "PAID", paidAt: expect.any(Date) },
        select: expect.any(Object),
      });
    });

    it("should update status to REFUNDED without paidAt", async () => {
      prisma.payment.update.mockResolvedValue({});

      await repo.updateStatus("pay-1", "REFUNDED");

      expect(prisma.payment.update).toHaveBeenCalledWith({
        where: { id: "pay-1" },
        data: { status: "REFUNDED" },
        select: expect.any(Object),
      });
    });

    it("should update status to PENDING without paidAt", async () => {
      prisma.payment.update.mockResolvedValue({});

      await repo.updateStatus("pay-1", "PENDING");

      expect(prisma.payment.update).toHaveBeenCalledWith({
        where: { id: "pay-1" },
        data: { status: "PENDING" },
        select: expect.any(Object),
      });
    });
  });

  describe("getPaymentSummary", () => {
    it("should return complete payment summary", async () => {
      prisma.payment.aggregate.mockResolvedValue({ _sum: { amountPaid: 50000000 } });
      prisma.payment.count.mockResolvedValue(100);
      prisma.payment.groupBy
        .mockResolvedValueOnce([
          { method: "CASH", _sum: { amountPaid: 30000000 }, _count: { method: 60 } },
          { method: "QRIS", _sum: { amountPaid: 20000000 }, _count: { method: 40 } },
        ])
        .mockResolvedValueOnce([
          { status: "PAID", _sum: { amountPaid: 48000000 }, _count: { status: 95 } },
          { status: "REFUNDED", _sum: { amountPaid: 2000000 }, _count: { status: 5 } },
        ]);

      const result = await repo.getPaymentSummary({});

      expect(result.totalAmount).toBe(50000000);
      expect(result.totalCount).toBe(100);
      expect(result.byMethod).toEqual([
        { method: "CASH", amount: 30000000, count: 60 },
        { method: "QRIS", amount: 20000000, count: 40 },
      ]);
    });

    it("should handle null aggregation values", async () => {
      prisma.payment.aggregate.mockResolvedValue({ _sum: { amountPaid: null } });
      prisma.payment.count.mockResolvedValue(0);
      prisma.payment.groupBy.mockResolvedValueOnce([]).mockResolvedValueOnce([]);

      const result = await repo.getPaymentSummary({});

      expect(result.totalAmount).toBe(0);
    });
  });

  describe("getTotalByMethod", () => {
    it("should return total payment by method", async () => {
      prisma.payment.aggregate.mockResolvedValue({
        _sum: { amountPaid: 30000000 },
        _count: { id: 60 },
      });

      const result = await repo.getTotalByMethod("CASH", {});

      expect(result).toEqual({
        method: "CASH",
        totalAmount: 30000000,
        totalCount: 60,
      });
    });

    it("should handle null aggregation values", async () => {
      prisma.payment.aggregate.mockResolvedValue({
        _sum: { amountPaid: null },
        _count: { id: null },
      });

      const result = await repo.getTotalByMethod("CASH", {});

      expect(result.totalAmount).toBe(0);
      expect(result.totalCount).toBe(0);
    });
  });

  describe("getPaymentHistoryByOrder", () => {
    it("should return payment history for an order", async () => {
      const mockHistory = [
        { id: "pay-1", method: "QRIS", amountPaid: 0, status: "PENDING", paidAt: null },
        { id: "pay-2", method: "QRIS", amountPaid: 150000, status: "PAID", paidAt: new Date() },
      ];

      prisma.payment.findMany.mockResolvedValue(mockHistory);

      const result = await repo.getPaymentHistoryByOrder("order-1");

      expect(result).toEqual(mockHistory);
      expect(result).toHaveLength(2);
    });

    it("should return empty array when no payment history", async () => {
      prisma.payment.findMany.mockResolvedValue([]);

      const result = await repo.getPaymentHistoryByOrder("order-99");

      expect(result).toEqual([]);
    });
  });
});