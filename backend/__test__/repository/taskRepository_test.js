import prisma from "#app/database.js";
import TaskRepository from "#repository/taskRepository.js";

jest.mock("#app/database.js", () => ({
  mechanicAssignment: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
  },
  orderItem: {
    findUnique: jest.fn(),
  },
  $queryRawUnsafe: jest.fn(),
  $queryRaw: jest.fn(),
}));

jest.mock("#shared/utils/pagination.js", () => ({
  generateMetadata: jest.fn((total, page, limit) => ({
    total,
    currentPage: page,
    itemsPerPage: limit,
    totalPages: Math.ceil(total / limit),
  })),
}));

describe("TaskRepository", () => {
  let repo;

  beforeEach(() => {
    jest.clearAllMocks();
    repo = new TaskRepository();
  });

  // ============================================================
  // findOrderItemById
  // ============================================================
  describe("findOrderItemById", () => {
    it("should return order item with product info and assignments", async () => {
      const mockItem = {
        id: "oi-1",
        product: { type: "SERVICE", image: { path: "img/service.jpg" } },
        assignments: [{ id: "a1" }],
      };

      prisma.orderItem.findUnique.mockResolvedValue(mockItem);

      const result = await repo.findOrderItemById("oi-1");

      expect(result).toEqual(mockItem);
      expect(prisma.orderItem.findUnique).toHaveBeenCalledWith({
        where: { id: "oi-1" },
        select: {
          id: true,
          product: {
            select: {
              type: true,
              image: { select: { path: true } },
            },
          },
          assignments: { select: { id: true } },
        },
      });
    });

    it("should return null when not found", async () => {
      prisma.orderItem.findUnique.mockResolvedValue(null);

      const result = await repo.findOrderItemById("oi-99");

      expect(result).toBeNull();
    });
  });

  // ============================================================
  // findMany
  // ============================================================
  describe("findMany", () => {
    it("should return tasks with default pagination", async () => {
      const mockRawData = [
        {
          orderId: "order-1",
          orderNumber: "ORD-001",
          status: "IN_PROGRESS",
          orderCreatedAt: new Date(),
          customerName: "Budi",
          plateNumber: "B 1234 CD",
          brand: "Vespa",
          model: "Sprint",
          services: [
            {
              assignmentId: "a1",
              mechanicId: "m1",
              mechanicName: "Joko",
              serviceName: "Ganti Oli",
              startAt: new Date(),
              endAt: null,
            },
          ],
        },
      ];

      prisma.$queryRawUnsafe
        .mockResolvedValueOnce([{ total: 1 }])
        .mockResolvedValueOnce(mockRawData);

      const result = await repo.findMany({});

      expect(result.data).toHaveLength(1);
      expect(result.data[0].services[0].taskStatus).toBe("IN_PROGRESS");
      expect(result.metadata.total).toBe(1);
      expect(result.metadata.currentPage).toBe(1);
      expect(result.metadata.itemsPerPage).toBe(10);
    });

    it("should return tasks filtered by mechanicId", async () => {
      prisma.$queryRawUnsafe
        .mockResolvedValueOnce([{ total: 0 }])
        .mockResolvedValueOnce([]);

      await repo.findMany({ mechanicId: "mech-1" });

      expect(prisma.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining(`ma."mechanicId" = $1`),
        "mech-1",
        expect.any(Number),
        expect.any(Number)
      );
    });

    it("should return tasks filtered by orderStatus", async () => {
      prisma.$queryRawUnsafe
        .mockResolvedValueOnce([{ total: 0 }])
        .mockResolvedValueOnce([]);

      await repo.findMany({ orderStatus: "QUEUED" });

      expect(prisma.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining(`o."status"::text = $1`),
        "QUEUED",
        expect.any(Number),
        expect.any(Number)
      );
    });

    it("should return active tasks when isActive is true", async () => {
      prisma.$queryRawUnsafe
        .mockResolvedValueOnce([{ total: 0 }])
        .mockResolvedValueOnce([]);

      await repo.findMany({ isActive: true });

      expect(prisma.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining(`ma."endAt" IS NULL`),
        expect.any(Number),
        expect.any(Number)
      );
    });

    it("should return completed tasks when isCompleted is true", async () => {
      prisma.$queryRawUnsafe
        .mockResolvedValueOnce([{ total: 0 }])
        .mockResolvedValueOnce([]);

      await repo.findMany({ isCompleted: true });

      expect(prisma.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining(`ma."endAt" IS NOT NULL`),
        expect.any(Number),
        expect.any(Number)
      );
    });

    it("should return tasks with PENDING status when no startAt", async () => {
      const mockRawData = [
        {
          orderId: "order-1",
          orderNumber: "ORD-001",
          status: "QUEUED",
          orderCreatedAt: new Date(),
          customerName: "Budi",
          plateNumber: null,
          brand: null,
          model: null,
          services: [
            {
              assignmentId: "a1",
              mechanicId: "m1",
              mechanicName: "Joko",
              serviceName: "Ganti Oli",
              startAt: null,
              endAt: null,
            },
          ],
        },
      ];

      prisma.$queryRawUnsafe
        .mockResolvedValueOnce([{ total: 1 }])
        .mockResolvedValueOnce(mockRawData);

      const result = await repo.findMany({});

      expect(result.data[0].services[0].taskStatus).toBe("PENDING");
      expect(result.data[0].vehicle).toBeNull();
    });

    it("should return tasks with COMPLETED status when endAt exists", async () => {
      const mockRawData = [
        {
          orderId: "order-1",
          orderNumber: "ORD-001",
          status: "COMPLETED",
          orderCreatedAt: new Date(),
          customerName: "Budi",
          plateNumber: "B 1234 CD",
          brand: "Vespa",
          model: "Sprint",
          services: [
            {
              assignmentId: "a1",
              mechanicId: "m1",
              mechanicName: "Joko",
              serviceName: "Ganti Oli",
              startAt: new Date(),
              endAt: new Date(),
            },
          ],
        },
      ];

      prisma.$queryRawUnsafe
        .mockResolvedValueOnce([{ total: 1 }])
        .mockResolvedValueOnce(mockRawData);

      const result = await repo.findMany({});

      expect(result.data[0].services[0].taskStatus).toBe("COMPLETED");
    });
  });

  // ============================================================
  // findUnassignedServiceTasks
  // ============================================================
  describe("findUnassignedServiceTasks", () => {
    it("should return unassigned service tasks grouped by order", async () => {
      const mockRawData = [
        {
          id: "oi-1",
          quantity: 1,
          productNameSnapshot: "Ganti Oli",
          productId: "p1",
          productName: "Ganti Oli",
          productDescription: "Deskripsi",
          productPrice: 75000,
          imagePath: "img/oli.jpg",
          orderId: "order-1",
          orderNumber: "ORD-001",
          orderStatus: "QUEUED",
          orderCreatedAt: new Date(),
          customerName: "Budi",
          plateNumber: "B 1234 CD",
          brand: "Vespa",
          model: "Sprint",
        },
      ];

      prisma.$queryRawUnsafe
        .mockResolvedValueOnce([{ total: 1 }])
        .mockResolvedValueOnce(mockRawData);

      const result = await repo.findUnassignedServiceTasks({});

      expect(result.data).toHaveLength(1);
      expect(result.data[0].services[0].name).toBe("Ganti Oli");
      expect(result.data[0].services[0].quantity).toBe(1);
      expect(result.data[0].services[0].price).toBe(75000);
    });

    it("should group multiple service items by order", async () => {
      const mockRawData = [
        {
          id: "oi-1",
          quantity: 1,
          productNameSnapshot: "Ganti Oli",
          productId: "p1",
          productName: "Ganti Oli",
          productDescription: null,
          productPrice: 75000,
          imagePath: null,
          orderId: "order-1",
          orderNumber: "ORD-001",
          orderStatus: "QUEUED",
          orderCreatedAt: new Date(),
          customerName: "Budi",
          plateNumber: null,
          brand: null,
          model: null,
        },
        {
          id: "oi-2",
          quantity: 1,
          productNameSnapshot: "Tune Up",
          productId: "p2",
          productName: "Tune Up",
          productDescription: null,
          productPrice: 150000,
          imagePath: null,
          orderId: "order-1",
          orderNumber: "ORD-001",
          orderStatus: "QUEUED",
          orderCreatedAt: new Date(),
          customerName: "Budi",
          plateNumber: null,
          brand: null,
          model: null,
        },
      ];

      prisma.$queryRawUnsafe
        .mockResolvedValueOnce([{ total: 1 }])
        .mockResolvedValueOnce(mockRawData);

      const result = await repo.findUnassignedServiceTasks({});

      expect(result.data).toHaveLength(1); // Same order
      expect(result.data[0].services).toHaveLength(2); // Two services
    });

    it("should return empty array when no unassigned tasks", async () => {
      prisma.$queryRawUnsafe
        .mockResolvedValueOnce([{ total: 0 }])
        .mockResolvedValueOnce([]);

      const result = await repo.findUnassignedServiceTasks({});

      expect(result.data).toEqual([]);
    });
  });

  // ============================================================
  // findById
  // ============================================================
  describe("findById", () => {
    it("should return full task when found", async () => {
      const mockTask = {
        id: "a1",
        startAt: new Date(),
        endAt: null,
        createdAt: new Date(),
        mechanic: {
          id: "m1",
          fullName: "Joko",
          email: "joko@email.com",
          phone: "0812",
        },
        orderItem: {
          id: "oi-1",
          quantity: 1,
          productNameSnapshot: "Ganti Oli",
          unitPrice: 75000,
          subtotal: 75000,
          product: {
            id: "p1",
            name: "Ganti Oli",
            type: "SERVICE",
            description: "Ganti oli",
            image: { path: "img.jpg" },
          },
          order: {
            id: "order-1",
            orderNumber: "ORD-001",
            status: "IN_PROGRESS",
            total: 75000,
            createdAt: new Date(),
            customer: { id: "c1", name: "Budi", phone: "0812" },
            vehicle: {
              id: "v1",
              plateNumber: "B 1234 CD",
              brand: "Vespa",
              model: "Sprint",
            },
          },
        },
      };

      prisma.mechanicAssignment.findUnique.mockResolvedValue(mockTask);

      const result = await repo.findById("a1");

      expect(result).toEqual(mockTask);
      expect(prisma.mechanicAssignment.findUnique).toHaveBeenCalledWith({
        where: { id: "a1" },
        select: expect.any(Object),
      });
    });

    it("should return null when not found", async () => {
      prisma.mechanicAssignment.findUnique.mockResolvedValue(null);

      const result = await repo.findById("a99");

      expect(result).toBeNull();
    });
  });

  // ============================================================
  // findByOrderItemId
  // ============================================================
  describe("findByOrderItemId", () => {
    it("should return tasks by order item ID", async () => {
      const mockTasks = [
        {
          id: "a1",
          startAt: new Date(),
          endAt: null,
          createdAt: new Date(),
          mechanic: { id: "m1", fullName: "Joko" },
          orderItem: { id: "oi-1" },
        },
      ];

      prisma.mechanicAssignment.findMany.mockResolvedValue(mockTasks);

      const result = await repo.findByOrderItemId("oi-1");

      expect(result).toEqual(mockTasks);
      expect(prisma.mechanicAssignment.findMany).toHaveBeenCalledWith({
        where: { orderItemId: "oi-1" },
        select: expect.any(Object),
        orderBy: { createdAt: "asc" },
      });
    });
  });

  // ============================================================
  // findByOrderId
  // ============================================================
  describe("findByOrderId", () => {
    it("should return tasks by order ID", async () => {
      prisma.mechanicAssignment.findMany.mockResolvedValue([]);

      await repo.findByOrderId("order-1");

      expect(prisma.mechanicAssignment.findMany).toHaveBeenCalledWith({
        where: { orderItem: { orderId: "order-1" } },
        select: expect.any(Object),
        orderBy: { createdAt: "asc" },
      });
    });
  });

  // ============================================================
  // findByMechanicId
  // ============================================================
  describe("findByMechanicId", () => {
    it("should return active tasks by mechanic ID", async () => {
      prisma.mechanicAssignment.findMany.mockResolvedValue([]);

      await repo.findByMechanicId("mech-1");

      expect(prisma.mechanicAssignment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            mechanicId: "mech-1",
            endAt: null,
            orderItem: {
              order: { status: { in: ["QUEUED", "IN_PROGRESS"] } },
            },
          },
        })
      );
    });

    it("should filter by orderId when provided", async () => {
      prisma.mechanicAssignment.findMany.mockResolvedValue([]);

      await repo.findByMechanicId("mech-1", { orderId: "order-1" });

      expect(prisma.mechanicAssignment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            mechanicId: "mech-1",
            orderItem: expect.objectContaining({
              orderId: "order-1",
            }),
          }),
        })
      );
    });
  });

  // ============================================================
  // assignMechanic
  // ============================================================
  describe("assignMechanic", () => {
    it("should assign mechanic to order item", async () => {
      const expected = {
        id: "a1",
        mechanic: { id: "m1", fullName: "Joko" },
        orderItem: { id: "oi-1", productNameSnapshot: "Ganti Oli" },
      };

      prisma.mechanicAssignment.create.mockResolvedValue(expected);

      const result = await repo.assignMechanic("oi-1", "m1");

      expect(result).toEqual(expected);
      expect(prisma.mechanicAssignment.create).toHaveBeenCalledWith({
        data: { orderItemId: "oi-1", mechanicId: "m1" },
        select: expect.any(Object),
      });
    });
  });

  // ============================================================
  // assignMechanicMany
  // ============================================================
  describe("assignMechanicMany", () => {
    it("should assign multiple mechanics", async () => {
      const assignments = [
        { orderItemId: "oi-1", mechanicId: "m1" },
        { orderItemId: "oi-2", mechanicId: "m2" },
      ];

      prisma.mechanicAssignment.create
        .mockResolvedValueOnce({ id: "a1" })
        .mockResolvedValueOnce({ id: "a2" });

      const result = await repo.assignMechanicMany(assignments);

      expect(result.success).toHaveLength(2);
      expect(result.failed).toHaveLength(0);
    });

    it("should handle partial failures", async () => {
      const assignments = [
        { orderItemId: "oi-1", mechanicId: "m1" },
        { orderItemId: "oi-2", mechanicId: "m2" },
      ];

      prisma.mechanicAssignment.create
        .mockResolvedValueOnce({ id: "a1" })
        .mockRejectedValueOnce(new Error("DB error"));

      const result = await repo.assignMechanicMany(assignments);

      expect(result.success).toHaveLength(1);
      expect(result.failed).toHaveLength(1);
      expect(result.failed[0].error).toBe("DB error");
    });
  });

  // ============================================================
  // unassignMechanic
  // ============================================================
  describe("unassignMechanic", () => {
    it("should unassign mechanic by ID", async () => {
      prisma.mechanicAssignment.delete.mockResolvedValue({});

      await repo.unassignMechanic("a1");

      expect(prisma.mechanicAssignment.delete).toHaveBeenCalledWith({
        where: { id: "a1" },
      });
    });
  });

  // ============================================================
  // unassignMechanicMany
  // ============================================================
  describe("unassignMechanicMany", () => {
    it("should unassign multiple mechanics in batches", async () => {
      const ids = Array.from({ length: 15 }, (_, i) => `a${i + 1}`);

      prisma.mechanicAssignment.deleteMany.mockResolvedValue({ count: 10 });

      const result = await repo.unassignMechanicMany(ids);

      expect(result.success).toHaveLength(15);
      expect(result.failed).toHaveLength(0);
      // Should call deleteMany twice (batch size 10)
      expect(prisma.mechanicAssignment.deleteMany).toHaveBeenCalledTimes(2);
    });

    it("should handle deleteMany failure with individual retry", async () => {
      const ids = ["a1", "a2"];

      prisma.mechanicAssignment.deleteMany.mockRejectedValue(new Error("Batch error"));
      prisma.mechanicAssignment.delete
        .mockResolvedValueOnce({})
        .mockRejectedValueOnce(new Error("Individual error"));

      const result = await repo.unassignMechanicMany(ids);

      expect(result.success).toHaveLength(1);
      expect(result.failed).toHaveLength(1);
      expect(result.failed[0].error).toBe("Individual error");
    });
  });

  // ============================================================
  // startTask
  // ============================================================
  describe("startTask", () => {
    it("should start a task with startAt timestamp", async () => {
      const expected = {
        id: "a1",
        startAt: new Date(),
        endAt: null,
        orderItem: {
          productNameSnapshot: "Ganti Oli",
          product: { name: "Ganti Oli", image: { path: "img.jpg" } },
          order: {
            id: "order-1",
            orderNumber: "ORD-001",
            status: "QUEUED",
            cashierId: "c1",
          },
        },
      };

      prisma.mechanicAssignment.update.mockResolvedValue(expected);

      const result = await repo.startTask("a1");

      expect(result.startAt).toBeDefined();
      expect(prisma.mechanicAssignment.update).toHaveBeenCalledWith({
        where: { id: "a1" },
        data: { startAt: expect.any(Date) },
        select: expect.any(Object),
      });
    });
  });

  // ============================================================
  // startTaskMany
  // ============================================================
  describe("startTaskMany", () => {
    it("should start multiple tasks in batches", async () => {
      const ids = ["a1", "a2", "a3"];

      prisma.mechanicAssignment.updateMany.mockResolvedValue({ count: 3 });

      const result = await repo.startTaskMany(ids);

      expect(result.success).toHaveLength(3);
      expect(result.failed).toHaveLength(0);
    });

    it("should handle updateMany failure with individual retry", async () => {
      const ids = ["a1", "a2"];

      prisma.mechanicAssignment.updateMany.mockRejectedValue(new Error("Batch error"));
      prisma.mechanicAssignment.update
        .mockResolvedValueOnce({})
        .mockRejectedValueOnce(new Error("Individual error"));

      const result = await repo.startTaskMany(ids);

      expect(result.success).toHaveLength(1);
      expect(result.failed).toHaveLength(1);
    });
  });

  // ============================================================
  // completeTask
  // ============================================================
  describe("completeTask", () => {
    it("should complete a task with endAt timestamp", async () => {
      const expected = {
        id: "a1",
        startAt: new Date(),
        endAt: new Date(),
        orderItem: {
          productNameSnapshot: "Ganti Oli",
          product: { name: "Ganti Oli", image: { path: "img.jpg" } },
          order: { id: "order-1", orderNumber: "ORD-001", cashierId: "c1" },
        },
      };

      prisma.mechanicAssignment.update.mockResolvedValue(expected);

      const result = await repo.completeTask("a1");

      expect(result.endAt).toBeDefined();
    });
  });

  // ============================================================
  // completeTaskMany
  // ============================================================
  describe("completeTaskMany", () => {
    it("should complete multiple tasks in batches", async () => {
      const ids = ["a1", "a2"];

      prisma.mechanicAssignment.updateMany.mockResolvedValue({ count: 2 });

      const result = await repo.completeTaskMany(ids);

      expect(result.success).toHaveLength(2);
      expect(result.failed).toHaveLength(0);
    });

    it("should handle updateMany failure with individual retry", async () => {
      const ids = ["a1"];

      prisma.mechanicAssignment.updateMany.mockRejectedValue(new Error("Batch error"));
      prisma.mechanicAssignment.update.mockResolvedValue({});

      const result = await repo.completeTaskMany(ids);

      expect(result.success).toHaveLength(1);
    });
  });

  // ============================================================
  // hasMechanicAssigned
  // ============================================================
  describe("hasMechanicAssigned", () => {
    it("should return true when mechanic is assigned", async () => {
      prisma.mechanicAssignment.findFirst.mockResolvedValue({ id: "a1" });

      const result = await repo.hasMechanicAssigned("oi-1");

      expect(result).toBe(true);
    });

    it("should return false when no mechanic assigned", async () => {
      prisma.mechanicAssignment.findFirst.mockResolvedValue(null);

      const result = await repo.hasMechanicAssigned("oi-1");

      expect(result).toBe(false);
    });
  });

  // ============================================================
  // getActiveTaskCount
  // ============================================================
  describe("getActiveTaskCount", () => {
    it("should return active task count for mechanic", async () => {
      prisma.$queryRaw.mockResolvedValue([{ count: 3n }]);

      const result = await repo.getActiveTaskCount("mech-1");

      expect(result).toBe(3);
    });

    it("should return 0 when no active tasks", async () => {
      prisma.$queryRaw.mockResolvedValue([{ count: 0n }]);

      const result = await repo.getActiveTaskCount("mech-1");

      expect(result).toBe(0);
    });
  });

  // ============================================================
  // getAvailableMechanics
  // ============================================================
  describe("getAvailableMechanics", () => {
    it("should return available mechanics with pagination", async () => {
      const mockRawData = [
        {
          id: "m1",
          fullName: "Joko",
          email: "joko@email.com",
          phone: "0812",
          activeTaskCount: 3,
        },
        {
          id: "m2",
          fullName: "Budi",
          email: "budi@email.com",
          phone: "0813",
          activeTaskCount: 5,
        },
      ];

      prisma.$queryRawUnsafe
        .mockResolvedValueOnce([{ total: 2 }])
        .mockResolvedValueOnce(mockRawData);

      const result = await repo.getAvailableMechanics({});

      expect(result.data).toHaveLength(2);
      expect(result.metadata.total).toBe(2);
      expect(result.data[0].activeTaskCount).toBe(3);
    });

    it("should filter mechanics by search", async () => {
      prisma.$queryRawUnsafe
        .mockResolvedValueOnce([{ total: 0 }])
        .mockResolvedValueOnce([]);

      await repo.getAvailableMechanics({ search: "Joko" });

      expect(prisma.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining("ILIKE"),
        "%Joko%",
        expect.any(Number),
        expect.any(Number)
      );
    });
  });

  // ============================================================
  // findMyTasks
  // ============================================================
  describe("findMyTasks", () => {
    it("should return tasks for a mechanic", async () => {
      prisma.$queryRawUnsafe
        .mockResolvedValueOnce([{ total: 1 }])
        .mockResolvedValueOnce([
          {
            orderId: "order-1",
            orderNumber: "ORD-001",
            status: "IN_PROGRESS",
            createdAt: new Date(),
            customerName: "Budi",
            plateNumber: null,
            brand: null,
            model: null,
            services: [
              {
                assignmentId: "a1",
                serviceName: "Ganti Oli",
                startAt: new Date(),
                endAt: null,
              },
            ],
          },
        ]);

      const result = await repo.findMyTasks("mech-1", {});

      expect(result.data).toHaveLength(1);
      expect(result.data[0].services[0].taskStatus).toBe("IN_PROGRESS");
    });
  });

  // ============================================================
  // findHistoryByMechanic
  // ============================================================
  describe("findHistoryByMechanic", () => {
    it("should return task history for a mechanic", async () => {
      const startDate = new Date("2025-01-01");
      const endDate = new Date("2025-02-01");

      prisma.$queryRawUnsafe
        .mockResolvedValueOnce([{ total: 1 }])
        .mockResolvedValueOnce([
          {
            orderId: "order-1",
            orderNumber: "ORD-001",
            status: "COMPLETED",
            orderCreatedAt: new Date(),
            customerName: "Budi",
            plateNumber: "B 1234 CD",
            brand: "Vespa",
            model: "Sprint",
            startedAt: startDate,
            completedAt: endDate,
            totalEarnings: 150000,
            services: [
              {
                assignmentId: "a1",
                serviceName: "Ganti Oli",
                startAt: startDate,
                endAt: endDate,
              },
            ],
          },
        ]);

      const result = await repo.findHistoryByMechanic("mech-1", {
        startDate,
        endDate,
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].totalEarnings).toBe(150000);
      expect(result.data[0].startedAt).toBeDefined();
      expect(result.data[0].completedAt).toBeDefined();
    });

    it("should handle empty history", async () => {
      prisma.$queryRawUnsafe
        .mockResolvedValueOnce([{ total: 0 }])
        .mockResolvedValueOnce([]);

      const result = await repo.findHistoryByMechanic("mech-1", {});

      expect(result.data).toEqual([]);
    });
  });
});