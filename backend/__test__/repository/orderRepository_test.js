import prisma from "#app/database.js";
import OrderRepository from "#repository/orderRepository.js";

jest.mock("#app/database.js", () => ({
  order: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
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
 * Unit test untuk OrderRepository
 * @describe OrderRepository
 */
describe("OrderRepository", () => {
  let repo;

  beforeEach(() => {
    jest.clearAllMocks();
    repo = new OrderRepository();
  });

  describe("findById", () => {
    it("should return full order with histories when found", async () => {
      const mockOrder = {
        id: "order-1",
        orderNumber: "ORD-001",
        status: "COMPLETED",
        subtotal: 100000,
        tax: 11000,
        total: 111000,
        cashier: { id: "cashier-1", fullName: "Kasir 1" },
        customer: { id: "cust-1", name: "Budi", phone: "0812" },
        vehicle: { id: "veh-1", plateNumber: "B 1234 CD", brand: "Vespa", model: "Sprint" },
        payment: { id: "pay-1", method: "CASH", amountPaid: 120000, status: "PAID", paidAt: new Date() },
        items: [],
        histories: [],
      };

      prisma.order.findUnique.mockResolvedValue(mockOrder);

      const result = await repo.findById("order-1");

      expect(result).toEqual(mockOrder);
      expect(prisma.order.findUnique).toHaveBeenCalledWith({
        where: { id: "order-1", deletedAt: null },
        select: expect.objectContaining({
          id: true,
          orderNumber: true,
          cashier: expect.any(Object),
          customer: expect.any(Object),
          vehicle: expect.any(Object),
          payment: expect.any(Object),
          items: expect.any(Object),
          histories: expect.any(Object),
        }),
      });
    });

    it("should return null when order not found", async () => {
      prisma.order.findUnique.mockResolvedValue(null);

      const result = await repo.findById("order-99");

      expect(result).toBeNull();
    });
  });

  describe("findByOrderNumber", () => {
    it("should return detail order when found by order number", async () => {
      const mockOrder = {
        id: "order-1",
        orderNumber: "ORD-20250601-0001",
        status: "QUEUED",
        subtotal: 200000,
        tax: 22000,
        total: 222000,
        items: [],
      };

      prisma.order.findFirst.mockResolvedValue(mockOrder);

      const result = await repo.findByOrderNumber("ORD-20250601-0001");

      expect(result).toEqual(mockOrder);
      expect(prisma.order.findFirst).toHaveBeenCalledWith({
        where: { orderNumber: "ORD-20250601-0001", deletedAt: null },
        select: expect.any(Object),
      });
    });

    it("should return null when order number not found", async () => {
      prisma.order.findFirst.mockResolvedValue(null);

      const result = await repo.findByOrderNumber("ORD-999");

      expect(result).toBeNull();
    });
  });

  describe("isOrderNumberExists", () => {
    it("should return true when order number exists", async () => {
      prisma.order.findFirst.mockResolvedValue({ id: "order-1" });

      const result = await repo.isOrderNumberExists("ORD-001");

      expect(result).toBe(true);
      expect(prisma.order.findFirst).toHaveBeenCalledWith({
        where: { orderNumber: "ORD-001" },
        select: { id: true },
      });
    });

    it("should return false when order number does not exist", async () => {
      prisma.order.findFirst.mockResolvedValue(null);

      const result = await repo.isOrderNumberExists("ORD-NEW");

      expect(result).toBe(false);
    });
  });

  describe("findMany", () => {
    it("should return orders with default pagination", async () => {
      const mockData = [
        {
          id: "order-1",
          orderNumber: "ORD-001",
          status: "COMPLETED",
          total: 111000,
          createdAt: new Date(),
          cashier: { id: "c1", fullName: "Kasir" },
          customer: { id: "cust-1", name: "Budi", phone: "0812" },
          payment: { id: "pay-1", method: "CASH", amountPaid: 120000, status: "PAID", paidAt: new Date() },
          items: [],
          _count: { items: 2 },
        },
      ];

      prisma.order.count.mockResolvedValue(1);
      prisma.order.findMany.mockResolvedValue(mockData);

      const result = await repo.findMany({});

      expect(result.data).toEqual(mockData);
      expect(result.data).toHaveLength(1);
      expect(result.metadata.total).toBe(1);
      expect(prisma.order.findMany).toHaveBeenCalledWith({
        where: { deletedAt: null },
        skip: 0,
        take: 10,
        select: expect.any(Object),
        orderBy: { createdAt: "desc" },
      });
    });

    it("should return orders filtered by status", async () => {
      prisma.order.count.mockResolvedValue(5);
      prisma.order.findMany.mockResolvedValue([]);

      await repo.findMany({ status: "QUEUED" });

      expect(prisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { deletedAt: null, status: "QUEUED" } })
      );
    });

    it("should return orders filtered by date range", async () => {
      prisma.order.count.mockResolvedValue(20);
      prisma.order.findMany.mockResolvedValue([]);

      await repo.findMany({
        startDate: new Date("2025-01-01"),
        endDate: new Date("2025-06-30"),
      });

      expect(prisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            deletedAt: null,
            createdAt: { gte: new Date("2025-01-01"), lte: new Date("2025-06-30") },
          },
        })
      );
    });

    it("should return orders filtered by search", async () => {
      prisma.order.count.mockResolvedValue(4);
      prisma.order.findMany.mockResolvedValue([]);

      await repo.findMany({ search: "ORD-2025" });

      expect(prisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { deletedAt: null, orderNumber: { contains: "ORD-2025", mode: "insensitive" } },
        })
      );
    });

    it("should return empty array when no orders", async () => {
      prisma.order.count.mockResolvedValue(0);
      prisma.order.findMany.mockResolvedValue([]);

      const result = await repo.findMany({});

      expect(result.data).toEqual([]);
      expect(result.metadata.total).toBe(0);
    });
  });

  describe("findActiveByCashier", () => {
    it("should return active orders for cashier with default filter", async () => {
      const mockData = [
        {
          id: "order-1",
          orderNumber: "ORD-001",
          status: "QUEUED",
          total: 111000,
          createdAt: new Date(),
          cashier: { id: "cashier-1", fullName: "Kasir" },
          customer: { id: "cust-1", name: "Budi" },
          items: [],
          _count: { items: 1 },
        },
      ];

      prisma.order.count.mockResolvedValue(1);
      prisma.order.findMany.mockResolvedValue(mockData);

      const result = await repo.findActiveByCashier("cashier-1", {});

      expect(result.data).toEqual(mockData);
      expect(prisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            cashierId: "cashier-1",
            deletedAt: null,
            status: { notIn: ["COMPLETED", "CLOSED", "CANCELLED"] },
          },
        })
      );
    });

    it("should return active orders with specific status filter", async () => {
      prisma.order.count.mockResolvedValue(3);
      prisma.order.findMany.mockResolvedValue([]);

      await repo.findActiveByCashier("cashier-1", { status: "IN_PROGRESS" });

      expect(prisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { cashierId: "cashier-1", deletedAt: null, status: "IN_PROGRESS" },
        })
      );
    });

    it("should return empty array when no active orders", async () => {
      prisma.order.count.mockResolvedValue(0);
      prisma.order.findMany.mockResolvedValue([]);

      const result = await repo.findActiveByCashier("cashier-1", {});

      expect(result.data).toEqual([]);
    });
  });

  describe("update", () => {
    it("should update an order with given data", async () => {
      const updateData = { status: "COMPLETED", completedAt: new Date() };
      const expected = { id: "order-1", orderNumber: "ORD-001", status: "COMPLETED", items: [] };

      prisma.order.update.mockResolvedValue(expected);

      const result = await repo.update("order-1", updateData);

      expect(result).toEqual(expected);
      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: "order-1" },
        data: updateData,
        select: expect.any(Object),
      });
    });
  });

  describe("updateStatus", () => {
    it("should update status to IN_PROGRESS with startedAt", async () => {
      const expected = { id: "order-1", orderNumber: "ORD-001", status: "IN_PROGRESS", startedAt: new Date() };

      prisma.order.update.mockResolvedValue(expected);

      const result = await repo.updateStatus("order-1", "IN_PROGRESS");

      expect(result.status).toBe("IN_PROGRESS");
      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: "order-1" },
        data: {
          status: "IN_PROGRESS",
          updatedAt: expect.any(Date),
          startedAt: expect.any(Date),
        },
        select: {
          id: true,
          orderNumber: true,
          status: true,
          startedAt: true,
          completedAt: true,
          closedAt: true,
          updatedAt: true,
        },
      });
    });

    it("should update status to COMPLETED with completedAt", async () => {
      prisma.order.update.mockResolvedValue({});

      await repo.updateStatus("order-1", "COMPLETED");

      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: "order-1" },
        data: expect.objectContaining({
          status: "COMPLETED",
          completedAt: expect.any(Date),
        }),
        select: expect.any(Object),
      });
    });

    it("should update status to CLOSED with closedAt", async () => {
      prisma.order.update.mockResolvedValue({});

      await repo.updateStatus("order-1", "CLOSED");

      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: "order-1" },
        data: expect.objectContaining({
          status: "CLOSED",
          closedAt: expect.any(Date),
        }),
        select: expect.any(Object),
      });
    });

    it("should update status to DRAFT without extra timestamps", async () => {
      prisma.order.update.mockResolvedValue({});

      await repo.updateStatus("order-1", "DRAFT");

      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: "order-1" },
        data: { status: "DRAFT", updatedAt: expect.any(Date) },
        select: expect.any(Object),
      });
    });
  });

  describe("softDelete", () => {
    it("should soft delete an order by setting deletedAt", async () => {
      prisma.order.update.mockResolvedValue({});

      await repo.softDelete("order-1");

      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: "order-1" },
        data: { deletedAt: expect.any(Date) },
      });
    });
  });

  describe("restore", () => {
    it("should restore a soft-deleted order by clearing deletedAt", async () => {
      prisma.order.update.mockResolvedValue({});

      await repo.restore("order-1");

      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: "order-1" },
        data: { deletedAt: null },
      });
    });
  });
});