import prisma from "#app/database.js";
import OrderHistoryRepository from "#repository/orderHistoryRepository.js";

jest.mock("#app/database.js", () => ({
  order: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
  },
  orderStatusHistory: {
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    groupBy: jest.fn(),
  },
  $queryRawUnsafe: jest.fn(),
}));

/**
 * Unit test untuk OrderHistoryRepository
 * @describe OrderHistoryRepository
 */
describe("OrderHistoryRepository", () => {
  let repo;

  beforeEach(() => {
    jest.clearAllMocks();
    repo = new OrderHistoryRepository();
  });

  describe("findByOrderNumber", () => {
    it("should return full order with history when found", async () => {
      const mockOrder = {
        id: "order-1",
        orderNumber: "ORD-20250601-0001",
        status: "COMPLETED",
        subtotal: 100000,
        tax: 11000,
        total: 111000,
        createdAt: new Date(),
        cashier: { id: "user-1", fullName: "Kasir 1" },
        customer: { id: "cust-1", name: "Budi", phone: "0812" },
        vehicle: { id: "veh-1", plateNumber: "B 1234 CD", brand: "Vespa", model: "Sprint" },
        payment: { id: "pay-1", method: "CASH", amountPaid: 120000, status: "PAID", paidAt: new Date() },
        items: [],
        histories: [],
      };

      prisma.order.findFirst.mockResolvedValue(mockOrder);

      const result = await repo.findByOrderNumber("ORD-20250601-0001");

      expect(result).toEqual(mockOrder);
      expect(prisma.order.findFirst).toHaveBeenCalledWith({
        where: { orderNumber: "ORD-20250601-0001", deletedAt: null },
        select: expect.objectContaining({
          id: true,
          orderNumber: true,
          status: true,
          cashier: expect.any(Object),
          customer: expect.any(Object),
          vehicle: expect.any(Object),
          payment: expect.any(Object),
          items: expect.any(Object),
          histories: expect.any(Object),
        }),
      });
    });

    it("should return null when order number not found", async () => {
      prisma.order.findFirst.mockResolvedValue(null);

      const result = await repo.findByOrderNumber("ORD-99999999-XXXX");

      expect(result).toBeNull();
    });

    it("should not return soft-deleted orders", async () => {
      prisma.order.findFirst.mockResolvedValue(null);

      const result = await repo.findByOrderNumber("ORD-DELETED");

      expect(result).toBeNull();
      expect(prisma.order.findFirst).toHaveBeenCalledWith({
        where: { orderNumber: "ORD-DELETED", deletedAt: null },
        select: expect.any(Object),
      });
    });
  });

  describe("findByOrderId", () => {
    it("should return full order with history when found by ID", async () => {
      const mockOrder = {
        id: "order-1",
        orderNumber: "ORD-20250601-0001",
        status: "COMPLETED",
        subtotal: 100000,
        tax: 11000,
        total: 111000,
        createdAt: new Date(),
        cashier: { id: "user-1", fullName: "Kasir 1" },
        customer: null,
        vehicle: null,
        payment: null,
        items: [],
        histories: [],
      };

      prisma.order.findUnique.mockResolvedValue(mockOrder);

      const result = await repo.findByOrderId("order-1");

      expect(result).toEqual(mockOrder);
      expect(prisma.order.findUnique).toHaveBeenCalledWith({
        where: { id: "order-1", deletedAt: null },
        select: expect.any(Object),
      });
    });

    it("should return null when order ID not found", async () => {
      prisma.order.findUnique.mockResolvedValue(null);

      const result = await repo.findByOrderId("order-99");

      expect(result).toBeNull();
    });
  });

  describe("createHistory", () => {
    it("should create a new status history record", async () => {
      const input = {
        orderId: "order-1",
        status: "IN_PROGRESS",
        changedById: "user-1",
        note: "Mekanik mulai pengerjaan",
      };

      const expected = {
        id: "hist-1",
        status: "IN_PROGRESS",
        note: "Mekanik mulai pengerjaan",
        createdAt: new Date(),
        changedBy: { id: "user-1", fullName: "Mekanik 1" },
      };

      prisma.orderStatusHistory.create.mockResolvedValue(expected);

      const result = await repo.createHistory(input);

      expect(result).toEqual(expected);
      expect(prisma.orderStatusHistory.create).toHaveBeenCalledWith({
        data: {
          orderId: "order-1",
          status: "IN_PROGRESS",
          changedById: "user-1",
          note: "Mekanik mulai pengerjaan",
        },
        select: {
          id: true,
          status: true,
          note: true,
          createdAt: true,
          changedBy: {
            select: { id: true, fullName: true },
          },
        },
      });
    });

    it("should create a history record with null note", async () => {
      const input = { orderId: "order-1", status: "QUEUED", changedById: "user-1" };

      const expected = { id: "hist-2", status: "QUEUED", note: null };

      prisma.orderStatusHistory.create.mockResolvedValue(expected);

      const result = await repo.createHistory(input);

      expect(result.note).toBeNull();
      expect(prisma.orderStatusHistory.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ note: null }),
        select: expect.any(Object),
      });
    });
  });

  describe("getHistoryByOrderId", () => {
    it("should return status history list for an order", async () => {
      const mockHistories = [
        { id: "hist-1", status: "DRAFT", note: "Pesanan dibuat", createdAt: new Date(), changedBy: { id: "u1", fullName: "Kasir 1" } },
        { id: "hist-2", status: "QUEUED", note: "Pembayaran berhasil", createdAt: new Date(), changedBy: { id: "u1", fullName: "Kasir 1" } },
      ];

      prisma.orderStatusHistory.findMany.mockResolvedValue(mockHistories);

      const result = await repo.getHistoryByOrderId("order-1");

      expect(result).toEqual(mockHistories);
      expect(result).toHaveLength(2);
    });

    it("should return empty array when order has no history", async () => {
      prisma.orderStatusHistory.findMany.mockResolvedValue([]);

      const result = await repo.getHistoryByOrderId("order-99");

      expect(result).toEqual([]);
    });
  });

  describe("findMany", () => {
    it("should return histories with default pagination", async () => {
      const mockData = [
        {
          id: "hist-1",
          status: "COMPLETED",
          note: "Pesanan selesai",
          createdAt: new Date(),
          changedBy: { id: "user-1", fullName: "Kasir 1" },
          order: { id: "order-1", orderNumber: "ORD-001", status: "COMPLETED", total: 111000, createdAt: new Date() },
        },
      ];

      prisma.orderStatusHistory.count.mockResolvedValue(1);
      prisma.orderStatusHistory.findMany.mockResolvedValue(mockData);

      const result = await repo.findMany({});

      expect(result.data).toEqual(mockData);
      expect(result.data).toHaveLength(1);
      expect(result.metadata.total).toBe(1);
    });

    it("should return histories filtered by orderId", async () => {
      prisma.orderStatusHistory.count.mockResolvedValue(5);
      prisma.orderStatusHistory.findMany.mockResolvedValue([]);

      await repo.findMany({ orderId: "order-1" });

      expect(prisma.orderStatusHistory.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { orderId: "order-1" } })
      );
    });

    it("should return empty array when no histories", async () => {
      prisma.orderStatusHistory.count.mockResolvedValue(0);
      prisma.orderStatusHistory.findMany.mockResolvedValue([]);

      const result = await repo.findMany({});

      expect(result.data).toEqual([]);
      expect(result.metadata.total).toBe(0);
    });
  });

  describe("getStatusTransitionStats", () => {
    it("should return status transition statistics", async () => {
      prisma.orderStatusHistory.groupBy.mockResolvedValue([
        { status: "DRAFT", _count: { status: 1 }, _min: { createdAt: new Date() }, _max: { createdAt: new Date() } },
        { status: "QUEUED", _count: { status: 1 }, _min: { createdAt: new Date() }, _max: { createdAt: new Date() } },
      ]);
      prisma.orderStatusHistory.count.mockResolvedValue(2);

      const result = await repo.getStatusTransitionStats("order-1");

      expect(result.totalChanges).toBe(2);
      expect(result.statusBreakdown).toHaveLength(2);
    });
  });

  describe("getStatusDurations", () => {
    it("should return status durations using raw query", async () => {
      const mockDurations = [
        { status: "DRAFT", startTime: new Date(), endTime: new Date(), durationSeconds: 300 },
        { status: "QUEUED", startTime: new Date(), endTime: new Date(), durationSeconds: 600 },
      ];

      prisma.$queryRawUnsafe.mockResolvedValue(mockDurations);

      const result = await repo.getStatusDurations("order-1");

      expect(result).toEqual(mockDurations);
    });

    it("should return empty array when no history", async () => {
      prisma.$queryRawUnsafe.mockResolvedValue([]);

      const result = await repo.getStatusDurations("order-99");

      expect(result).toEqual([]);
    });
  });

  describe("getOrderTimeline", () => {
    it("should return complete order timeline summary", async () => {
      const mockOrder = {
        id: "order-1",
        orderNumber: "ORD-001",
        status: "COMPLETED",
        total: 111000,
        createdAt: new Date(),
        customer: { name: "Budi" },
        vehicle: { plateNumber: "B 1234 CD" },
      };

      const mockHistories = [
        { id: "hist-1", status: "DRAFT", note: "Dibuat", createdAt: new Date(), changedBy: { id: "u1", fullName: "Kasir" } },
      ];

      const mockDurations = [
        { status: "DRAFT", startTime: new Date(), endTime: new Date(), durationSeconds: 300 },
      ];

      prisma.order.findUnique.mockResolvedValue(mockOrder);
      prisma.orderStatusHistory.findMany.mockResolvedValue(mockHistories);
      prisma.$queryRawUnsafe.mockResolvedValue(mockDurations);

      const result = await repo.getOrderTimeline("order-1");

      expect(result.order).toEqual(mockOrder);
      expect(result.totalDurationSeconds).toBe(300);
    });

    it("should return null when order not found", async () => {
      prisma.order.findUnique.mockResolvedValue(null);
      prisma.orderStatusHistory.findMany.mockResolvedValue([]);
      prisma.$queryRawUnsafe.mockResolvedValue([]);

      const result = await repo.getOrderTimeline("order-99");

      expect(result).toBeNull();
    });

    it("should calculate zero total duration when no durations", async () => {
      prisma.order.findUnique.mockResolvedValue({
        id: "order-1", orderNumber: "ORD-001", status: "DRAFT", total: 50000, createdAt: new Date(), customer: null, vehicle: null,
      });
      prisma.orderStatusHistory.findMany.mockResolvedValue([]);
      prisma.$queryRawUnsafe.mockResolvedValue([]);

      const result = await repo.getOrderTimeline("order-1");

      expect(result.totalDurationSeconds).toBe(0);
    });
  });
});