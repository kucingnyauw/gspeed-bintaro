import TaskService from "#service/taskService.js";
import TaskRepository from "#repository/taskRepository.js";
import UserRepository from "#repository/userRepository.js";
import OrderRepository from "#repository/orderRepository.js";
import NotificationRepository from "#repository/notificationRepository.js";
import SettingRepository from "#repository/settingRepository.js";
import ApiError from "#shared/utils/error.js";
import prisma from "#app/database.js";
import logger from "#app/logger.js";
import Storage from "#shared/utils/storage.js";
import DateTime from "#shared/utils/datetime.js";

// Mock repositories
jest.mock("#repository/taskRepository.js");
jest.mock("#repository/userRepository.js");
jest.mock("#repository/orderRepository.js");
jest.mock("#repository/notificationRepository.js");
jest.mock("#repository/settingRepository.js");

// Mock cache
jest.mock("#shared/utils/cache.js", () => {
  return jest.fn().mockImplementation(() => ({
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(undefined),
    invalidate: jest.fn().mockResolvedValue(undefined),
  }));
});

// Mock storage
jest.mock("#shared/utils/storage.js", () => ({
  getSignedUrl: jest.fn().mockResolvedValue("https://signed-url.com/image.jpg"),
}));

// Mock datetime
jest.mock("#shared/utils/datetime.js", () => ({
  toFullID: jest.fn((date) => (date ? date.toISOString() : "-")),
  toDuration: jest.fn(() => "1 jam 30 menit"),
}));

// Mock prisma
jest.mock("#app/database.js", () => ({
  mechanicAssignment: {
    findMany: jest.fn().mockResolvedValue([]),
  },
  orderStatusHistory: {
    create: jest.fn().mockResolvedValue({}),
  },
  $transaction: jest.fn((fn) =>
    fn({
      order: { update: jest.fn().mockResolvedValue({}) },
      orderStatusHistory: { create: jest.fn().mockResolvedValue({}) },
    })
  ),
}));

// Mock logger
jest.mock("#app/logger.js", () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

describe("TaskService", () => {
  let service;
  let mockTaskRepo;
  let mockUserRepo;
  let mockOrderRepo;
  let mockNotifRepo;
  let mockSettingRepo;
  let mockCache;

  beforeEach(() => {
    jest.clearAllMocks();

    // Clear mock instances
    TaskRepository.mockClear();
    UserRepository.mockClear();
    OrderRepository.mockClear();
    NotificationRepository.mockClear();
    SettingRepository.mockClear();

    service = new TaskService();

    mockTaskRepo = TaskRepository.mock.instances[0];
    mockUserRepo = UserRepository.mock.instances[0];
    mockOrderRepo = OrderRepository.mock.instances[0];
    mockNotifRepo = NotificationRepository.mock.instances[0];
    mockSettingRepo = SettingRepository.mock.instances[0];

    mockCache = service.cache;

    // Default setting mock
    mockSettingRepo.findByKey.mockResolvedValue({ value: "5" });

    // Reset prisma mocks
    prisma.mechanicAssignment.findMany.mockResolvedValue([]);
    prisma.orderStatusHistory.create.mockResolvedValue({});
  });

  // ============================================================
  // assignMechanicToOrder
  // ============================================================
  describe("assignMechanicToOrder", () => {
    const orderId = "order-1";
    const mechanicId = "mech-1";

    const mockMechanic = {
      id: mechanicId,
      fullName: "Joko",
      role: "MECHANIC",
    };

    const mockOrder = {
      id: orderId,
      orderNumber: "ORD-001",
      status: "QUEUED",
      cashierId: "cashier-1",
      customer: { name: "Budi" },
      vehicle: { plateNumber: "B 1234 CD", brand: "Vespa", model: "Sprint" },
      items: [
        {
          id: "oi-1",
          product: { type: "SERVICE", name: "Ganti Oli" },
          productNameSnapshot: "Ganti Oli",
          assignments: [],
        },
        {
          id: "oi-2",
          product: { type: "SERVICE", name: "Tune Up" },
          productNameSnapshot: "Tune Up",
          assignments: [],
        },
      ],
    };

    beforeEach(() => {
      mockUserRepo.findById.mockResolvedValue(mockMechanic);
      mockTaskRepo.getActiveTaskCount.mockResolvedValue(2);
      mockOrderRepo.findById.mockResolvedValue(mockOrder);
      mockTaskRepo.assignMechanic.mockImplementation((itemId) =>
        Promise.resolve({
          id: `a-${itemId}`,
          orderItemId: itemId,
          mechanicId,
        })
      );
      mockNotifRepo.create.mockResolvedValue({});
    });

    it("should assign mechanic to all unassigned service items successfully", async () => {
      const result = await service.assignMechanicToOrder(orderId, mechanicId);

      expect(result).toHaveLength(2);
      expect(result[0].orderItemId).toBe("oi-1");
      expect(result[1].orderItemId).toBe("oi-2");

      expect(mockUserRepo.findById).toHaveBeenCalledWith(mechanicId);
      expect(mockTaskRepo.getActiveTaskCount).toHaveBeenCalledWith(mechanicId);
      expect(mockTaskRepo.assignMechanic).toHaveBeenCalledTimes(2);
      expect(mockTaskRepo.assignMechanic).toHaveBeenCalledWith("oi-1", mechanicId);
      expect(mockTaskRepo.assignMechanic).toHaveBeenCalledWith("oi-2", mechanicId);

      expect(prisma.orderStatusHistory.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          orderId,
          status: "QUEUED",
          changedById: mechanicId,
          note: expect.stringContaining("Joko ditugaskan ke 2 item service"),
        }),
      });

      expect(mockCache.invalidate).toHaveBeenCalledWith("history:ORD-001");

      expect(mockNotifRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mechanicId,
          title: "Tugas Baru - #ORD-001",
          type: "INFO",
          message: expect.stringContaining("Ganti Oli"),
        })
      );

      expect(logger.info).toHaveBeenCalledWith(
        "Mekanik berhasil di-assign ke order",
        expect.objectContaining({
          orderId,
          mechanicId,
          taskCount: 2,
        })
      );
    });

    it("should assign mechanic when there's only one service item", async () => {
      const orderWithOneService = {
        ...mockOrder,
        items: [
          {
            id: "oi-1",
            product: { type: "SERVICE", name: "Ganti Oli" },
            productNameSnapshot: "Ganti Oli",
            assignments: [],
          },
        ],
      };
      mockOrderRepo.findById.mockResolvedValue(orderWithOneService);

      const result = await service.assignMechanicToOrder(orderId, mechanicId);

      expect(result).toHaveLength(1);
      expect(mockTaskRepo.assignMechanic).toHaveBeenCalledTimes(1);
    });

    it("should throw BadRequest when user is not a mechanic", async () => {
      mockUserRepo.findById.mockResolvedValue({
        id: mechanicId,
        fullName: "Budi",
        role: "CASHIER",
      });

      await expect(
        service.assignMechanicToOrder(orderId, mechanicId)
      ).rejects.toThrow(ApiError);

      try {
        await service.assignMechanicToOrder(orderId, mechanicId);
      } catch (error) {
        expect(error.statusCode).toBe(400);
        expect(error.message).toContain("bukan mekanik");
      }

      expect(mockTaskRepo.getActiveTaskCount).not.toHaveBeenCalled();
      expect(mockTaskRepo.assignMechanic).not.toHaveBeenCalled();
    });

    it("should throw BadRequest when mechanic not found", async () => {
      mockUserRepo.findById.mockResolvedValue(null);

      await expect(
        service.assignMechanicToOrder(orderId, mechanicId)
      ).rejects.toThrow(ApiError);

      try {
        await service.assignMechanicToOrder(orderId, mechanicId);
      } catch (error) {
        expect(error.statusCode).toBe(400);
        expect(error.message).toContain("bukan mekanik");
      }
    });

    it("should throw BadRequest when mechanic is not available (capacity full)", async () => {
      mockTaskRepo.getActiveTaskCount.mockResolvedValue(5);

      await expect(
        service.assignMechanicToOrder(orderId, mechanicId)
      ).rejects.toThrow(ApiError);

      try {
        await service.assignMechanicToOrder(orderId, mechanicId);
      } catch (error) {
        expect(error.statusCode).toBe(400);
        expect(error.message).toContain("Mekanik sedang tidak tersedia");
      }

      expect(mockTaskRepo.assignMechanic).not.toHaveBeenCalled();
    });

    it("should throw BadRequest when mechanic exceeds capacity", async () => {
      mockTaskRepo.getActiveTaskCount.mockResolvedValue(6);

      await expect(
        service.assignMechanicToOrder(orderId, mechanicId)
      ).rejects.toThrow(ApiError);

      try {
        await service.assignMechanicToOrder(orderId, mechanicId);
      } catch (error) {
        expect(error.statusCode).toBe(400);
      }
    });

    it("should throw NotFound when order not found", async () => {
      mockOrderRepo.findById.mockResolvedValue(null);

      await expect(
        service.assignMechanicToOrder(orderId, mechanicId)
      ).rejects.toThrow(ApiError);

      try {
        await service.assignMechanicToOrder(orderId, mechanicId);
      } catch (error) {
        expect(error.statusCode).toBe(404);
        expect(error.message).toContain("Pesanan tidak ditemukan");
      }
    });

    it("should throw BadRequest when order status is not QUEUED", async () => {
      mockOrderRepo.findById.mockResolvedValue({
        ...mockOrder,
        status: "DRAFT",
      });

      await expect(
        service.assignMechanicToOrder(orderId, mechanicId)
      ).rejects.toThrow(ApiError);

      try {
        await service.assignMechanicToOrder(orderId, mechanicId);
      } catch (error) {
        expect(error.statusCode).toBe(400);
        expect(error.message).toContain("Hanya pesanan dengan status QUEUED");
        expect(error.message).toContain("Status saat ini: DRAFT");
      }
    });

    it.each(["IN_PROGRESS", "COMPLETED", "CLOSED", "CANCELLED"])(
      "should throw BadRequest when order status is %s",
      async (status) => {
        mockOrderRepo.findById.mockResolvedValue({
          ...mockOrder,
          status,
        });

        await expect(
          service.assignMechanicToOrder(orderId, mechanicId)
        ).rejects.toThrow(ApiError);

        try {
          await service.assignMechanicToOrder(orderId, mechanicId);
        } catch (error) {
          expect(error.statusCode).toBe(400);
          expect(error.message).toContain(status);
        }
      }
    );

    it("should throw BadRequest when order has no service items", async () => {
      const orderNoService = {
        ...mockOrder,
        items: [
          {
            id: "oi-1",
            product: { type: "SPAREPART", name: "Oli" },
            assignments: [],
          },
        ],
      };
      mockOrderRepo.findById.mockResolvedValue(orderNoService);

      await expect(
        service.assignMechanicToOrder(orderId, mechanicId)
      ).rejects.toThrow(ApiError);

      try {
        await service.assignMechanicToOrder(orderId, mechanicId);
      } catch (error) {
        expect(error.statusCode).toBe(400);
        expect(error.message).toContain("tidak memiliki item service");
      }
    });

    it("should throw BadRequest when all service items already have assignments", async () => {
      const allAssigned = {
        ...mockOrder,
        items: [
          {
            id: "oi-1",
            product: { type: "SERVICE", name: "Ganti Oli" },
            assignments: [{ id: "a-old", mechanicId: "m2" }],
          },
        ],
      };
      mockOrderRepo.findById.mockResolvedValue(allAssigned);

      await expect(
        service.assignMechanicToOrder(orderId, mechanicId)
      ).rejects.toThrow(ApiError);

      try {
        await service.assignMechanicToOrder(orderId, mechanicId);
      } catch (error) {
        expect(error.statusCode).toBe(400);
        expect(error.message).toContain("sudah memiliki mekanik");
      }
    });

    it("should skip already assigned items and assign only unassigned ones", async () => {
      const partialAssigned = {
        ...mockOrder,
        items: [
          {
            id: "oi-1",
            product: { type: "SERVICE", name: "Ganti Oli" },
            productNameSnapshot: "Ganti Oli",
            assignments: [{ id: "a-old", mechanicId: "m2" }],
          },
          {
            id: "oi-2",
            product: { type: "SERVICE", name: "Tune Up" },
            productNameSnapshot: "Tune Up",
            assignments: [],
          },
        ],
      };
      mockOrderRepo.findById.mockResolvedValue(partialAssigned);

      const result = await service.assignMechanicToOrder(orderId, mechanicId);

      expect(result).toHaveLength(1);
      expect(result[0].orderItemId).toBe("oi-2");
      expect(mockTaskRepo.assignMechanic).toHaveBeenCalledTimes(1);
      expect(mockTaskRepo.assignMechanic).toHaveBeenCalledWith("oi-2", mechanicId);
    });

    it("should handle notification failure gracefully", async () => {
      mockNotifRepo.create.mockRejectedValue(new Error("Notification error"));

      const result = await service.assignMechanicToOrder(orderId, mechanicId);

      expect(result).toHaveLength(2);
      expect(logger.warn).toHaveBeenCalled();
    });

    it("should use custom max tasks setting from database", async () => {
      mockSettingRepo.findByKey.mockResolvedValue({ value: "3" });
      mockTaskRepo.getActiveTaskCount.mockResolvedValue(3);

      await expect(
        service.assignMechanicToOrder(orderId, mechanicId)
      ).rejects.toThrow(ApiError);

      try {
        await service.assignMechanicToOrder(orderId, mechanicId);
      } catch (error) {
        expect(error.statusCode).toBe(400);
        expect(error.message).toContain("Mekanik sedang tidak tersedia");
      }

      expect(mockSettingRepo.findByKey).toHaveBeenCalledWith("mechanic_max_tasks");
    });
  });

  // ============================================================
  // unassignMechanicFromOrder
  // ============================================================
  describe("unassignMechanicFromOrder", () => {
    const orderId = "order-1";
    const userId = "cashier-1";

    const baseOrder = {
      id: orderId,
      orderNumber: "ORD-001",
      status: "QUEUED",
      cashierId: userId,
      customer: { name: "Budi" },
      vehicle: { plateNumber: "B 1234 CD", brand: "Vespa", model: "Sprint" },
      items: [
        {
          id: "oi-1",
          product: { type: "SERVICE", name: "Ganti Oli" },
          assignments: [
            { id: "a1", mechanicId: "m1", mechanic: { fullName: "Joko" } },
          ],
        },
      ],
    };

    beforeEach(() => {
      mockOrderRepo.findById.mockResolvedValue(baseOrder);
      mockTaskRepo.unassignMechanic.mockResolvedValue(undefined);
      mockNotifRepo.create.mockResolvedValue({});
    });

    it("should unassign all mechanics and invalidate cache", async () => {
      await service.unassignMechanicFromOrder(orderId, userId);

      expect(mockTaskRepo.unassignMechanic).toHaveBeenCalledTimes(1);
      expect(mockTaskRepo.unassignMechanic).toHaveBeenCalledWith("a1");

      expect(prisma.orderStatusHistory.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          orderId,
          status: "QUEUED",
          changedById: userId,
          note: expect.stringContaining("Joko dilepas"),
        }),
      });

      expect(mockCache.invalidate).toHaveBeenCalledWith("history:ORD-001");

      expect(mockNotifRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "m1",
          title: "Unassign - #ORD-001",
          type: "WARNING",
          message: expect.stringContaining("dilepas dari pesanan"),
        })
      );
    });

    it("should unassign from IN_PROGRESS order", async () => {
      mockOrderRepo.findById.mockResolvedValue({
        ...baseOrder,
        status: "IN_PROGRESS",
      });

      await service.unassignMechanicFromOrder(orderId, userId);

      expect(mockTaskRepo.unassignMechanic).toHaveBeenCalledTimes(1);
      expect(prisma.orderStatusHistory.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          status: "IN_PROGRESS",
          note: expect.stringContaining("Status tetap IN_PROGRESS"),
        }),
      });
    });

    it("should use order cashierId when userId not provided", async () => {
      await service.unassignMechanicFromOrder(orderId, null);

      expect(prisma.orderStatusHistory.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          changedById: userId,
        }),
      });
    });

    it("should throw NotFound when order not found", async () => {
      mockOrderRepo.findById.mockResolvedValue(null);

      await expect(
        service.unassignMechanicFromOrder(orderId, userId)
      ).rejects.toThrow(ApiError);

      try {
        await service.unassignMechanicFromOrder(orderId, userId);
      } catch (error) {
        expect(error.statusCode).toBe(404);
        expect(error.message).toContain("Pesanan tidak ditemukan");
      }
    });

    it.each(["COMPLETED", "CLOSED", "CANCELLED"])(
      "should throw BadRequest when order status is %s",
      async (status) => {
        mockOrderRepo.findById.mockResolvedValue({
          ...baseOrder,
          status,
        });

        await expect(
          service.unassignMechanicFromOrder(orderId, userId)
        ).rejects.toThrow(ApiError);

        try {
          await service.unassignMechanicFromOrder(orderId, userId);
        } catch (error) {
          expect(error.statusCode).toBe(400);
          expect(error.message).toContain("sudah selesai, ditutup, atau dibatalkan");
        }
      }
    );

    it("should throw BadRequest when order is DRAFT", async () => {
      mockOrderRepo.findById.mockResolvedValue({
        ...baseOrder,
        status: "DRAFT",
      });

      await expect(
        service.unassignMechanicFromOrder(orderId, userId)
      ).rejects.toThrow(ApiError);

      try {
        await service.unassignMechanicFromOrder(orderId, userId);
      } catch (error) {
        expect(error.statusCode).toBe(400);
        expect(error.message).toContain("Pesanan belum dibayar");
      }
    });

    it("should throw BadRequest when no mechanic is assigned", async () => {
      const orderWithoutAssignment = {
        ...baseOrder,
        items: [
          {
            id: "oi-1",
            product: { type: "SERVICE", name: "Ganti Oli" },
            assignments: [],
          },
        ],
      };
      mockOrderRepo.findById.mockResolvedValue(orderWithoutAssignment);

      await expect(
        service.unassignMechanicFromOrder(orderId, userId)
      ).rejects.toThrow(ApiError);

      try {
        await service.unassignMechanicFromOrder(orderId, userId);
      } catch (error) {
        expect(error.statusCode).toBe(400);
        expect(error.message).toContain("tidak memiliki mekanik yang ditugaskan");
      }
    });

    it("should throw BadRequest when only sparepart items exist", async () => {
      const orderOnlySparepart = {
        ...baseOrder,
        items: [
          {
            id: "oi-1",
            product: { type: "SPAREPART", name: "Oli" },
            assignments: [{ id: "a1", mechanicId: "m1" }],
          },
        ],
      };
      mockOrderRepo.findById.mockResolvedValue(orderOnlySparepart);

      await expect(
        service.unassignMechanicFromOrder(orderId, userId)
      ).rejects.toThrow(ApiError);

      try {
        await service.unassignMechanicFromOrder(orderId, userId);
      } catch (error) {
        expect(error.statusCode).toBe(400);
        expect(error.message).toContain("tidak memiliki mekanik yang ditugaskan");
      }
    });

    it("should unassign multiple mechanics from different service items", async () => {
      const orderWithMultipleMechanics = {
        ...baseOrder,
        items: [
          {
            id: "oi-1",
            product: { type: "SERVICE", name: "Ganti Oli" },
            assignments: [
              { id: "a1", mechanicId: "m1", mechanic: { fullName: "Joko" } },
            ],
          },
          {
            id: "oi-2",
            product: { type: "SERVICE", name: "Tune Up" },
            assignments: [
              { id: "a2", mechanicId: "m2", mechanic: { fullName: "Budi" } },
            ],
          },
        ],
      };
      mockOrderRepo.findById.mockResolvedValue(orderWithMultipleMechanics);

      await service.unassignMechanicFromOrder(orderId, userId);

      expect(mockTaskRepo.unassignMechanic).toHaveBeenCalledTimes(2);
      expect(mockNotifRepo.create).toHaveBeenCalledTimes(2);
      expect(mockNotifRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ userId: "m1" })
      );
      expect(mockNotifRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ userId: "m2" })
      );
    });

    it("should handle order with no customer/vehicle gracefully", async () => {
      const minimalOrder = {
        ...baseOrder,
        customer: null,
        vehicle: null,
        items: [
          {
            id: "oi-1",
            product: { type: "SERVICE", name: "Ganti Oli" },
            assignments: [
              { id: "a1", mechanicId: "m1", mechanic: { fullName: "Joko" } },
            ],
          },
        ],
      };
      mockOrderRepo.findById.mockResolvedValue(minimalOrder);

      await service.unassignMechanicFromOrder(orderId, userId);

      expect(mockNotifRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining("Pelanggan"),
        })
      );
    });
  });

  // ============================================================
  // getTaskById
  // ============================================================
  describe("getTaskById", () => {
    it("should return assignment with signed URL when product image exists", async () => {
      const assignment = {
        id: "a1",
        orderItem: {
          product: {
            id: "p1",
            name: "Ganti Oli",
            image: { path: "product-images/oli.jpg" },
          },
        },
      };
      mockTaskRepo.findById.mockResolvedValue(assignment);

      const result = await service.getTaskById("a1");

      expect(result.orderItem.product.image.url).toBe("https://signed-url.com/image.jpg");
      expect(Storage.getSignedUrl).toHaveBeenCalledWith("product-images/oli.jpg");
    });

    it("should return assignment without signed URL when no image", async () => {
      const assignment = {
        id: "a1",
        orderItem: {
          product: {
            id: "p1",
            name: "Ganti Oli",
            image: null,
          },
        },
      };
      mockTaskRepo.findById.mockResolvedValue(assignment);

      const result = await service.getTaskById("a1");

      expect(result.orderItem.product.image).toBeNull();
    });

    it("should return assignment without signed URL when no product", async () => {
      const assignment = {
        id: "a1",
        orderItem: {
          product: null,
        },
      };
      mockTaskRepo.findById.mockResolvedValue(assignment);

      const result = await service.getTaskById("a1");

      expect(result.orderItem.product).toBeNull();
    });

    it("should throw NotFound when assignment not found", async () => {
      mockTaskRepo.findById.mockResolvedValue(null);

      await expect(service.getTaskById("a99")).rejects.toThrow(ApiError);

      try {
        await service.getTaskById("a99");
      } catch (error) {
        expect(error.statusCode).toBe(404);
        expect(error.message).toContain("Task tidak ditemukan");
      }
    });
  });

  // ============================================================
  // getTasksByOrderId
  // ============================================================
  describe("getTasksByOrderId", () => {
    const orderId = "order-1";
    const baseOrder = {
      id: orderId,
      orderNumber: "ORD-001",
      status: "IN_PROGRESS",
      total: 150000,
      createdAt: new Date("2025-01-01"),
      startedAt: new Date("2025-01-02"),
      completedAt: null,
      customer: { id: "c1", name: "Budi", phone: "0812" },
      vehicle: {
        id: "v1",
        plateNumber: "B 1234 CD",
        brand: "Vespa",
        model: "Sprint",
      },
      items: [
        {
          id: "oi-1",
          product: {
            type: "SERVICE",
            name: "Ganti Oli",
            image: { path: "img/oli.jpg" },
          },
          productNameSnapshot: "Ganti Oli",
          quantity: 1,
          unitPrice: 50000,
          subtotal: 50000,
          assignments: [],
        },
      ],
    };

    it("should return order with services, assignments, and signed URLs", async () => {
      mockOrderRepo.findById.mockResolvedValue(baseOrder);
      mockTaskRepo.findByOrderId.mockResolvedValue([
        {
          id: "a1",
          orderItem: { id: "oi-1" },
          mechanic: { id: "m1", fullName: "Joko" },
          startAt: new Date("2025-01-02T10:00:00"),
          endAt: null,
        },
      ]);

      const result = await service.getTasksByOrderId(orderId);

      expect(result.orderId).toBe(orderId);
      expect(result.orderNumber).toBe("ORD-001");
      expect(result.status).toBe("IN_PROGRESS");
      expect(result.customer.name).toBe("Budi");
      expect(result.vehicle.plateNumber).toBe("B 1234 CD");
      expect(result.services).toHaveLength(1);

      const svc = result.services[0];
      expect(svc.serviceName).toBe("Ganti Oli");
      expect(svc.quantity).toBe(1);
      expect(svc.unitPrice).toBe(50000);
      expect(svc.subtotal).toBe(50000);
      expect(svc.assignments).toHaveLength(1);
      expect(svc.assignments[0].status).toBe("IN_PROGRESS");
      expect(svc.assignments[0].statusLabel).toBe("Dikerjakan");
      expect(svc.product.image).toBe("https://signed-url.com/image.jpg");
    });

    it("should return COMPLETED status when endAt exists", async () => {
      mockOrderRepo.findById.mockResolvedValue(baseOrder);
      mockTaskRepo.findByOrderId.mockResolvedValue([
        {
          id: "a1",
          orderItem: { id: "oi-1" },
          mechanic: { id: "m1", fullName: "Joko" },
          startAt: new Date("2025-01-02T10:00:00"),
          endAt: new Date("2025-01-02T11:00:00"),
        },
      ]);

      const result = await service.getTasksByOrderId(orderId);
      const svc = result.services[0];

      expect(svc.assignments[0].status).toBe("COMPLETED");
      expect(svc.assignments[0].statusLabel).toBe("Selesai");
    });

    it("should return PENDING status when no startAt", async () => {
      mockOrderRepo.findById.mockResolvedValue(baseOrder);
      mockTaskRepo.findByOrderId.mockResolvedValue([
        {
          id: "a1",
          orderItem: { id: "oi-1" },
          mechanic: null,
          startAt: null,
          endAt: null,
        },
      ]);

      const result = await service.getTasksByOrderId(orderId);
      const svc = result.services[0];

      expect(svc.assignments[0].status).toBe("PENDING");
      expect(svc.assignments[0].statusLabel).toBe("Menunggu");
      expect(svc.assignments[0].mechanic).toBeNull();
    });

    it("should handle order with no customer/vehicle", async () => {
      const minimalOrder = {
        ...baseOrder,
        customer: null,
        vehicle: null,
      };
      mockOrderRepo.findById.mockResolvedValue(minimalOrder);
      mockTaskRepo.findByOrderId.mockResolvedValue([]);

      const result = await service.getTasksByOrderId(orderId);

      expect(result.customer).toBeNull();
      expect(result.vehicle).toBeNull();
    });

    it("should handle multiple service items with mixed assignments", async () => {
      const multiItemOrder = {
        ...baseOrder,
        items: [
          {
            id: "oi-1",
            product: { type: "SERVICE", name: "Ganti Oli", image: null },
            productNameSnapshot: "Ganti Oli",
            quantity: 1,
            unitPrice: 50000,
            subtotal: 50000,
            assignments: [],
          },
          {
            id: "oi-2",
            product: { type: "SERVICE", name: "Tune Up", image: null },
            productNameSnapshot: "Tune Up",
            quantity: 2,
            unitPrice: 75000,
            subtotal: 150000,
            assignments: [],
          },
        ],
      };
      mockOrderRepo.findById.mockResolvedValue(multiItemOrder);
      mockTaskRepo.findByOrderId.mockResolvedValue([
        {
          id: "a1",
          orderItem: { id: "oi-1" },
          mechanic: { id: "m1", fullName: "Joko" },
          startAt: new Date(),
          endAt: null,
        },
        {
          id: "a2",
          orderItem: { id: "oi-2" },
          mechanic: { id: "m2", fullName: "Budi" },
          startAt: null,
          endAt: null,
        },
      ]);

      const result = await service.getTasksByOrderId(orderId);

      expect(result.services).toHaveLength(2);
      expect(result.services[0].assignments).toHaveLength(1);
      expect(result.services[1].assignments).toHaveLength(1);
    });

    it("should throw NotFound when order not found", async () => {
      mockOrderRepo.findById.mockResolvedValue(null);

      await expect(service.getTasksByOrderId("bad-order")).rejects.toThrow(ApiError);

      try {
        await service.getTasksByOrderId("bad-order");
      } catch (error) {
        expect(error.statusCode).toBe(404);
        expect(error.message).toContain("Pesanan tidak ditemukan");
      }
    });
  });

  // ============================================================
  // getTasks, getTasksByMechanic, getTasksByOrderItem, getMyTasks, getUnassignedTasks
  // ============================================================
  describe("getTasks", () => {
    it("should delegate to taskRepo.findMany with query", async () => {
      const mockResult = { data: [{ id: "a1" }], metadata: { total: 1 } };
      mockTaskRepo.findMany.mockResolvedValue(mockResult);

      const query = { page: 1, limit: 10, status: "IN_PROGRESS" };
      const result = await service.getTasks(query);

      expect(result).toEqual(mockResult);
      expect(mockTaskRepo.findMany).toHaveBeenCalledWith(query);
    });

    it("should handle empty query", async () => {
      const mockResult = { data: [], metadata: { total: 0 } };
      mockTaskRepo.findMany.mockResolvedValue(mockResult);

      const result = await service.getTasks();

      expect(result).toEqual(mockResult);
      expect(mockTaskRepo.findMany).toHaveBeenCalledWith({});
    });
  });

  describe("getTasksByMechanic", () => {
    it("should group assignments by order", async () => {
      const assignments = [
        {
          id: "a1",
          orderItem: {
            id: "oi-1",
            productNameSnapshot: "Ganti Oli",
            product: { name: "Ganti Oli" },
            order: {
              id: "order-1",
              orderNumber: "ORD-001",
              status: "QUEUED",
              createdAt: new Date(),
              customer: { name: "Budi" },
              vehicle: { plateNumber: "B 1234 CD" },
            },
          },
          startAt: null,
          endAt: null,
        },
      ];

      mockTaskRepo.findByMechanicId.mockResolvedValue(assignments);

      const result = await service.getTasksByMechanic("m1");

      expect(result).toHaveLength(1);
      expect(result[0].orderId).toBe("order-1");
      expect(result[0].orderNumber).toBe("ORD-001");
      expect(result[0].services).toHaveLength(1);
      expect(result[0].services[0].name).toBe("Ganti Oli");
    });

    it("should group multiple assignments for same order", async () => {
      const assignments = [
        {
          id: "a1",
          orderItem: {
            id: "oi-1",
            productNameSnapshot: "Ganti Oli",
            product: { name: "Ganti Oli" },
            order: {
              id: "order-1",
              orderNumber: "ORD-001",
              status: "IN_PROGRESS",
              createdAt: new Date(),
              customer: { name: "Budi" },
              vehicle: { plateNumber: "B 1234 CD" },
            },
          },
          startAt: new Date(),
          endAt: null,
        },
        {
          id: "a2",
          orderItem: {
            id: "oi-2",
            productNameSnapshot: "Tune Up",
            product: { name: "Tune Up" },
            order: {
              id: "order-1",
              orderNumber: "ORD-001",
              status: "IN_PROGRESS",
              createdAt: new Date(),
              customer: { name: "Budi" },
              vehicle: { plateNumber: "B 1234 CD" },
            },
          },
          startAt: null,
          endAt: null,
        },
      ];

      mockTaskRepo.findByMechanicId.mockResolvedValue(assignments);

      const result = await service.getTasksByMechanic("m1");

      expect(result).toHaveLength(1);
      expect(result[0].services).toHaveLength(2);
    });

    it("should skip assignments without order", async () => {
      mockTaskRepo.findByMechanicId.mockResolvedValue([
        { id: "a1", orderItem: null },
        { id: "a2", orderItem: { order: null } },
      ]);

      const result = await service.getTasksByMechanic("m1");

      expect(result).toEqual([]);
    });
  });

  describe("getTasksByOrderItem", () => {
    it("should delegate to taskRepo.findByOrderItemId", async () => {
      const mockAssignments = [{ id: "a1" }, { id: "a2" }];
      mockTaskRepo.findByOrderItemId.mockResolvedValue(mockAssignments);

      const result = await service.getTasksByOrderItem("oi-1");

      expect(result).toEqual(mockAssignments);
      expect(mockTaskRepo.findByOrderItemId).toHaveBeenCalledWith("oi-1");
    });
  });

  describe("getMyTasks", () => {
    it("should delegate to taskRepo.findMyTasks with mechanicId and query", async () => {
      const mockResult = { data: [{ id: "a1" }], metadata: { total: 1 } };
      mockTaskRepo.findMyTasks.mockResolvedValue(mockResult);

      const result = await service.getMyTasks("m1", { page: 2, limit: 5 });

      expect(result).toEqual(mockResult);
      expect(mockTaskRepo.findMyTasks).toHaveBeenCalledWith("m1", { page: 2, limit: 5 });
    });

    it("should handle empty query", async () => {
      const mockResult = { data: [], metadata: { total: 0 } };
      mockTaskRepo.findMyTasks.mockResolvedValue(mockResult);

      const result = await service.getMyTasks("m1");

      expect(result).toEqual(mockResult);
      expect(mockTaskRepo.findMyTasks).toHaveBeenCalledWith("m1", {});
    });
  });

  describe("getUnassignedTasks", () => {
    it("should delegate to taskRepo.findUnassignedServiceTasks", async () => {
      const mockResult = {
        data: [{ id: "oi-1", serviceName: "Ganti Oli" }],
        metadata: { total: 1 },
      };
      mockTaskRepo.findUnassignedServiceTasks.mockResolvedValue(mockResult);

      const result = await service.getUnassignedTasks({ search: "oli" });

      expect(result).toEqual(mockResult);
      expect(mockTaskRepo.findUnassignedServiceTasks).toHaveBeenCalledWith({ search: "oli" });
    });
  });

  // ============================================================
  // startOrder
  // ============================================================
  describe("startOrder", () => {
    const orderId = "order-1";
    const mechanicId = "mech-1";
    const mockOrder = {
      id: orderId,
      orderNumber: "ORD-001",
      status: "QUEUED",
      startedAt: null,
      customer: { name: "Budi" },
      vehicle: { plateNumber: "B 1234 CD", brand: "Vespa", model: "Sprint" },
      cashierId: "cashier-1",
    };

    const pendingAssignments = [
      {
        id: "a1",
        startAt: null,
        orderItem: {
          id: "oi-1",
          productNameSnapshot: "Ganti Oli",
          product: { name: "Ganti Oli" },
        },
      },
      {
        id: "a2",
        startAt: null,
        orderItem: {
          id: "oi-2",
          productNameSnapshot: "Tune Up",
          product: { name: "Tune Up" },
        },
      },
    ];

    beforeEach(() => {
      mockOrderRepo.findById.mockResolvedValue(mockOrder);
      mockUserRepo.findById.mockResolvedValue({
        id: mechanicId,
        fullName: "Joko",
      });
      prisma.mechanicAssignment.findMany.mockResolvedValue(pendingAssignments);
      mockTaskRepo.startTask.mockImplementation((id) =>
        Promise.resolve({
          id,
          startAt: new Date(),
          orderItem: pendingAssignments.find((a) => a.id === id)?.orderItem,
        })
      );
      mockNotifRepo.create.mockResolvedValue({});
    });

    it("should start all pending assignments and transition to IN_PROGRESS", async () => {
      const result = await service.startOrder(orderId, mechanicId);

      expect(result).toHaveLength(2);
      expect(mockTaskRepo.startTask).toHaveBeenCalledTimes(2);
      expect(mockTaskRepo.startTask).toHaveBeenCalledWith("a1");
      expect(mockTaskRepo.startTask).toHaveBeenCalledWith("a2");

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(mockCache.invalidate).toHaveBeenCalledWith("history:ORD-001");

      expect(mockNotifRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "cashier-1",
          title: "Pengerjaan Dimulai - #ORD-001",
          type: "INFO",
        })
      );

      expect(logger.info).toHaveBeenCalledWith(
        "Order dimulai",
        expect.objectContaining({
          orderId,
          mechanicId,
          taskCount: 2,
        })
      );
    });

    it("should start order with single task", async () => {
      const singleAssignment = [pendingAssignments[0]];
      prisma.mechanicAssignment.findMany.mockResolvedValue(singleAssignment);

      const result = await service.startOrder(orderId, mechanicId);

      expect(result).toHaveLength(1);
      expect(mockTaskRepo.startTask).toHaveBeenCalledTimes(1);
    });

    it("should throw NotFound when order not found", async () => {
      mockOrderRepo.findById.mockResolvedValue(null);

      await expect(service.startOrder(orderId, mechanicId)).rejects.toThrow(ApiError);

      try {
        await service.startOrder(orderId, mechanicId);
      } catch (error) {
        expect(error.statusCode).toBe(404);
        expect(error.message).toContain("Pesanan tidak ditemukan");
      }
    });

    it.each(["DRAFT", "IN_PROGRESS", "COMPLETED", "CLOSED", "CANCELLED"])(
      "should throw BadRequest when order status is %s",
      async (status) => {
        mockOrderRepo.findById.mockResolvedValue({
          ...mockOrder,
          status,
        });

        await expect(service.startOrder(orderId, mechanicId)).rejects.toThrow(ApiError);

        try {
          await service.startOrder(orderId, mechanicId);
        } catch (error) {
          expect(error.statusCode).toBe(400);
          expect(error.message).toContain("Hanya pesanan QUEUED yang dapat dimulai");
        }
      }
    );

    it("should throw BadRequest when mechanic has no active assignments", async () => {
      prisma.mechanicAssignment.findMany.mockResolvedValue([]);

      await expect(service.startOrder(orderId, mechanicId)).rejects.toThrow(ApiError);

      try {
        await service.startOrder(orderId, mechanicId);
      } catch (error) {
        expect(error.statusCode).toBe(400);
        expect(error.message).toContain("Tidak ada task aktif");
      }
    });

    it("should throw Conflict when all assignments already started", async () => {
      prisma.mechanicAssignment.findMany.mockResolvedValue([
        { ...pendingAssignments[0], startAt: new Date() },
      ]);

      await expect(service.startOrder(orderId, mechanicId)).rejects.toThrow(ApiError);

      try {
        await service.startOrder(orderId, mechanicId);
      } catch (error) {
        expect(error.statusCode).toBe(409);
        expect(error.message).toContain("Semua task sudah dimulai");
      }
    });

    it("should handle order without cashier (no notification to cashier)", async () => {
      mockOrderRepo.findById.mockResolvedValue({
        ...mockOrder,
        cashierId: null,
      });

      await service.startOrder(orderId, mechanicId);

      const cashierNotification = mockNotifRepo.create.mock.calls.find(
        (call) => call[0].userId === null
      );
      expect(cashierNotification).toBeUndefined();
    });
  });

  // ============================================================
  // completeOrder
  // ============================================================
  describe("completeOrder", () => {
    const orderId = "order-1";
    const mechanicId = "mech-1";
    const now = new Date();
    const mockOrder = {
      id: orderId,
      orderNumber: "ORD-001",
      status: "IN_PROGRESS",
      startedAt: new Date(now.getTime() - 3600000),
      customer: { name: "Budi" },
      vehicle: { plateNumber: "B 1234 CD", brand: "Vespa", model: "Sprint" },
      cashierId: "cashier-1",
    };

    const activeAssignments = [
      {
        id: "a1",
        startAt: new Date(now.getTime() - 3600000),
        endAt: null,
        orderItem: {
          id: "oi-1",
          productNameSnapshot: "Ganti Oli",
          product: { name: "Ganti Oli" },
        },
      },
    ];

    beforeEach(() => {
      mockOrderRepo.findById.mockResolvedValue(mockOrder);
      mockUserRepo.findById.mockResolvedValue({
        id: mechanicId,
        fullName: "Joko",
      });
      prisma.mechanicAssignment.findMany.mockResolvedValue(activeAssignments);
      mockTaskRepo.completeTask.mockImplementation((id) =>
        Promise.resolve({
          id,
          startAt: activeAssignments[0].startAt,
          endAt: new Date(),
          orderItem: activeAssignments[0].orderItem,
        })
      );
      mockNotifRepo.create.mockResolvedValue({});
    });

    it("should complete all pending assignments and transition to COMPLETED", async () => {
      const result = await service.completeOrder(orderId, mechanicId);

      expect(result).toHaveLength(1);
      expect(mockTaskRepo.completeTask).toHaveBeenCalledWith("a1");

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(mockCache.invalidate).toHaveBeenCalledWith("history:ORD-001");

      expect(mockNotifRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "cashier-1",
          title: "Pengerjaan Selesai - #ORD-001",
          type: "SUCCESS",
          message: expect.stringContaining("Durasi"),
        })
      );

      expect(logger.info).toHaveBeenCalledWith(
        "Order selesai",
        expect.objectContaining({
          orderId,
          mechanicId,
          taskCount: 1,
          duration: "1 jam 30 menit",
        })
      );
    });

    it("should complete multiple tasks", async () => {
      const multipleAssignments = [
        activeAssignments[0],
        {
          id: "a2",
          startAt: new Date(now.getTime() - 1800000),
          endAt: null,
          orderItem: {
            id: "oi-2",
            productNameSnapshot: "Tune Up",
            product: { name: "Tune Up" },
          },
        },
      ];
      prisma.mechanicAssignment.findMany.mockResolvedValue(multipleAssignments);

      const result = await service.completeOrder(orderId, mechanicId);

      expect(result).toHaveLength(2);
      expect(mockTaskRepo.completeTask).toHaveBeenCalledTimes(2);
    });

    it("should throw NotFound when order not found", async () => {
      mockOrderRepo.findById.mockResolvedValue(null);

      await expect(service.completeOrder(orderId, mechanicId)).rejects.toThrow(ApiError);

      try {
        await service.completeOrder(orderId, mechanicId);
      } catch (error) {
        expect(error.statusCode).toBe(404);
        expect(error.message).toContain("Pesanan tidak ditemukan");
      }
    });

    it.each(["DRAFT", "QUEUED", "COMPLETED", "CLOSED", "CANCELLED"])(
      "should throw BadRequest when order status is %s",
      async (status) => {
        mockOrderRepo.findById.mockResolvedValue({
          ...mockOrder,
          status,
        });

        await expect(service.completeOrder(orderId, mechanicId)).rejects.toThrow(ApiError);

        try {
          await service.completeOrder(orderId, mechanicId);
        } catch (error) {
          expect(error.statusCode).toBe(400);
          expect(error.message).toContain("Hanya pesanan IN_PROGRESS yang dapat diselesaikan");
        }
      }
    );

    it("should throw BadRequest when mechanic has no active assignments", async () => {
      prisma.mechanicAssignment.findMany.mockResolvedValue([]);

      await expect(service.completeOrder(orderId, mechanicId)).rejects.toThrow(ApiError);

      try {
        await service.completeOrder(orderId, mechanicId);
      } catch (error) {
        expect(error.statusCode).toBe(400);
        expect(error.message).toContain("Tidak ada task aktif");
      }
    });

    it("should throw Conflict when all assignments already completed", async () => {
      prisma.mechanicAssignment.findMany.mockResolvedValue([
        { ...activeAssignments[0], endAt: new Date() },
      ]);

      await expect(service.completeOrder(orderId, mechanicId)).rejects.toThrow(ApiError);

      try {
        await service.completeOrder(orderId, mechanicId);
      } catch (error) {
        expect(error.statusCode).toBe(409);
        expect(error.message).toContain("Semua task sudah selesai");
      }
    });

    it("should handle order without cashier", async () => {
      mockOrderRepo.findById.mockResolvedValue({
        ...mockOrder,
        cashierId: null,
      });

      await service.completeOrder(orderId, mechanicId);

      const nullNotification = mockNotifRepo.create.mock.calls.find(
        (call) => call[0].userId === null
      );
      expect(nullNotification).toBeUndefined();
    });
  });

  // ============================================================
  // getAvailableMechanics
  // ============================================================
  describe("getAvailableMechanics", () => {
    it("should return mechanics with isAvailable status", async () => {
      const mockResult = {
        data: [
          { id: "m1", fullName: "Joko" },
          { id: "m2", fullName: "Budi" },
        ],
        metadata: { total: 2 },
      };
      mockTaskRepo.getAvailableMechanics.mockResolvedValue(mockResult);
      mockTaskRepo.getActiveTaskCount
        .mockResolvedValueOnce(3)
        .mockResolvedValueOnce(5);

      const result = await service.getAvailableMechanics({ page: 1, limit: 10 });

      expect(result.data[0].isAvailable).toBe(true);
      expect(result.data[1].isAvailable).toBe(false);
    });

    it("should handle empty mechanics list", async () => {
      const mockResult = { data: [], metadata: { total: 0 } };
      mockTaskRepo.getAvailableMechanics.mockResolvedValue(mockResult);

      const result = await service.getAvailableMechanics();

      expect(result.data).toEqual([]);
    });
  });

  // ============================================================
  // getMechanicAvailabilityStatus
  // ============================================================
  describe("getMechanicAvailabilityStatus", () => {
    it("should return availability status for a mechanic", async () => {
      mockUserRepo.findById.mockResolvedValue({
        id: "m1",
        fullName: "Joko",
        role: "MECHANIC",
      });
      mockTaskRepo.getActiveTaskCount.mockResolvedValue(4);

      const result = await service.getMechanicAvailabilityStatus("m1");

      expect(result).toEqual({
        isAvailable: true,
        activeTaskCount: 4,
        maxTasks: 5,
        remainingCapacity: 1,
      });
    });

    it("should return isAvailable false when at capacity", async () => {
      mockUserRepo.findById.mockResolvedValue({
        id: "m1",
        role: "MECHANIC",
      });
      mockTaskRepo.getActiveTaskCount.mockResolvedValue(5);

      const result = await service.getMechanicAvailabilityStatus("m1");

      expect(result.isAvailable).toBe(false);
      expect(result.remainingCapacity).toBe(0);
    });

    it("should return isAvailable false when over capacity", async () => {
      mockUserRepo.findById.mockResolvedValue({
        id: "m1",
        role: "MECHANIC",
      });
      mockTaskRepo.getActiveTaskCount.mockResolvedValue(6);

      const result = await service.getMechanicAvailabilityStatus("m1");

      expect(result.isAvailable).toBe(false);
      expect(result.remainingCapacity).toBe(-1);
    });

    it("should throw BadRequest when user is not a mechanic", async () => {
      mockUserRepo.findById.mockResolvedValue({
        id: "m1",
        role: "CASHIER",
      });

      await expect(service.getMechanicAvailabilityStatus("m1")).rejects.toThrow(ApiError);

      try {
        await service.getMechanicAvailabilityStatus("m1");
      } catch (error) {
        expect(error.statusCode).toBe(400);
        expect(error.message).toContain("bukan mekanik");
      }
    });

    it("should throw BadRequest when user not found", async () => {
      mockUserRepo.findById.mockResolvedValue(null);

      await expect(service.getMechanicAvailabilityStatus("m99")).rejects.toThrow(ApiError);
    });
  });

  // ============================================================
  // hasMechanicAssigned
  // ============================================================
  describe("hasMechanicAssigned", () => {
    it("should delegate to taskRepo.hasMechanicAssigned", async () => {
      mockTaskRepo.hasMechanicAssigned.mockResolvedValue(true);

      const result = await service.hasMechanicAssigned("oi-1");

      expect(result).toBe(true);
      expect(mockTaskRepo.hasMechanicAssigned).toHaveBeenCalledWith("oi-1");
    });

    it("should return false when no mechanic assigned", async () => {
      mockTaskRepo.hasMechanicAssigned.mockResolvedValue(false);

      const result = await service.hasMechanicAssigned("oi-1");

      expect(result).toBe(false);
    });
  });

  // ============================================================
  // bulkAssignMechanics
  // ============================================================
  describe("bulkAssignMechanics", () => {
    const mockMechanic = {
      id: "m1",
      fullName: "Joko",
      role: "MECHANIC",
    };
    const mockOrder = {
      id: "o1",
      orderNumber: "ORD-001",
      status: "QUEUED",
      cashierId: "cashier-1",
      customer: { name: "Budi" },
      vehicle: { plateNumber: "B 1234 CD", brand: "Vespa", model: "Sprint" },
      items: [
        {
          id: "oi-1",
          product: { type: "SERVICE", name: "Ganti Oli" },
          productNameSnapshot: "Ganti Oli",
          assignments: [],
        },
      ],
    };

    beforeEach(() => {
      mockUserRepo.findById.mockResolvedValue(mockMechanic);
      mockTaskRepo.getActiveTaskCount.mockResolvedValue(2);
      mockTaskRepo.assignMechanic.mockResolvedValue({ id: "a-new" });
      mockNotifRepo.create.mockResolvedValue({});
    });

    it("should process valid assignments and return results", async () => {
      mockOrderRepo.findById.mockResolvedValue(mockOrder);

      const assignments = [
        { orderId: "o1", mechanicId: "m1" },
        { orderId: "o2", mechanicId: "m1" },
      ];

      mockOrderRepo.findById
        .mockResolvedValueOnce(mockOrder)
        .mockResolvedValueOnce(null);

      const result = await service.bulkAssignMechanics(assignments);

      expect(result.summary.total).toBe(2);
      expect(result.summary.valid).toBe(1);
      expect(result.summary.skipped).toBe(1);
      expect(result.summary.assigned).toBe(1);
      expect(result.summary.failed).toBe(0);
      expect(result.details.skipped[0].reason).toBe("Pesanan tidak ditemukan");
    });

    it("should throw BadRequest when assignments array is empty", async () => {
      await expect(service.bulkAssignMechanics([])).rejects.toThrow(ApiError);

      try {
        await service.bulkAssignMechanics([]);
      } catch (error) {
        expect(error.statusCode).toBe(400);
        expect(error.message).toContain("Tidak ada data penugasan yang dipilih");
      }
    });

    it("should throw BadRequest when no valid assignments (non-mechanic)", async () => {
      mockUserRepo.findById.mockResolvedValue({
        id: "m1",
        role: "CASHIER",
      });

      const assignments = [{ orderId: "o1", mechanicId: "m1" }];

      await expect(service.bulkAssignMechanics(assignments)).rejects.toThrow(ApiError);

      try {
        await service.bulkAssignMechanics(assignments);
      } catch (error) {
        expect(error.statusCode).toBe(400);
        expect(error.message).toContain("Tidak ada penugasan yang valid");
        expect(error.details).toBeDefined();
        expect(error.details[0].reason).toBe("User bukan mekanik");
      }
    });

    it("should throw BadRequest when all mechanics are not available", async () => {
      mockUserRepo.findById.mockResolvedValue(mockMechanic);
      mockTaskRepo.getActiveTaskCount.mockResolvedValue(5);
      mockOrderRepo.findById.mockResolvedValue(mockOrder);

      const assignments = [{ orderId: "o1", mechanicId: "m1" }];

      await expect(service.bulkAssignMechanics(assignments)).rejects.toThrow(ApiError);

      try {
        await service.bulkAssignMechanics(assignments);
      } catch (error) {
        expect(error.statusCode).toBe(400);
        expect(error.message).toContain("Tidak ada penugasan yang valid");
        expect(error.details).toBeDefined();
        expect(error.details).toHaveLength(1);
        expect(error.details[0].reason).toBe("Mekanik tidak tersedia");
      }
    });

    it("should throw BadRequest when all orders have wrong status", async () => {
      mockUserRepo.findById.mockResolvedValue(mockMechanic);
      mockTaskRepo.getActiveTaskCount.mockResolvedValue(2);
      mockOrderRepo.findById.mockResolvedValue({
        ...mockOrder,
        status: "DRAFT",
      });

      const assignments = [{ orderId: "o1", mechanicId: "m1" }];

      await expect(service.bulkAssignMechanics(assignments)).rejects.toThrow(ApiError);

      try {
        await service.bulkAssignMechanics(assignments);
      } catch (error) {
        expect(error.statusCode).toBe(400);
        expect(error.message).toContain("Tidak ada penugasan yang valid");
        expect(error.details).toBeDefined();
        expect(error.details).toHaveLength(1);
        expect(error.details[0].reason).toContain("Status pesanan DRAFT");
      }
    });

    it("should handle mixed scenarios (some valid, some skipped)", async () => {
      mockUserRepo.findById.mockResolvedValue(mockMechanic);
      mockTaskRepo.getActiveTaskCount.mockResolvedValue(2);
    
      // First order valid, second has wrong status
      mockOrderRepo.findById
        .mockResolvedValueOnce(mockOrder) // Valid QUEUED
        .mockResolvedValueOnce({ ...mockOrder, id: "o2", orderNumber: "ORD-002", status: "DRAFT" }); // Invalid
    
      // Spy on assignMechanicToOrder untuk menghindari mock yang kompleks
      const assignSpy = jest
        .spyOn(service, "assignMechanicToOrder")
        .mockResolvedValueOnce([{ id: "a-new", orderItemId: "oi-1", mechanicId: "m1" }]);
    
      const assignments = [
        { orderId: "o1", mechanicId: "m1" },
        { orderId: "o2", mechanicId: "m1" },
      ];
    
      const result = await service.bulkAssignMechanics(assignments);
    
      expect(result.summary.total).toBe(2);
      expect(result.summary.valid).toBe(1);
      expect(result.summary.skipped).toBe(1);
      expect(result.summary.assigned).toBe(1);
      expect(result.summary.failed).toBe(0);
      expect(result.details.skipped[0].reason).toContain("Status pesanan DRAFT");
      expect(result.details.assigned).toHaveLength(1);
    
      assignSpy.mockRestore();
    });

    it("should handle mix of success and failure", async () => {
      mockUserRepo.findById.mockResolvedValue(mockMechanic);
      mockTaskRepo.getActiveTaskCount.mockResolvedValue(2);
      mockOrderRepo.findById.mockResolvedValue(mockOrder);
      mockTaskRepo.assignMechanic
        .mockResolvedValueOnce({ id: "a1" })
        .mockRejectedValueOnce(new Error("Database error"));

      const assignments = [
        { orderId: "o1", mechanicId: "m1" },
        { orderId: "o2", mechanicId: "m1" },
      ];

      const result = await service.bulkAssignMechanics(assignments);

      expect(result.summary.assigned).toBe(1);
      expect(result.summary.failed).toBe(1);
      expect(result.details.failed[0].error).toBe("Database error");
    });
  });

  // ============================================================
  // bulkStartOrders
  // ============================================================
  describe("bulkStartOrders", () => {
    it("should start multiple orders and return results", async () => {
      const mockStartedTask = { id: "a1", startAt: new Date() };

      const startOrderSpy = jest
        .spyOn(service, "startOrder")
        .mockResolvedValueOnce([mockStartedTask])
        .mockRejectedValueOnce(new Error("Order error"));

      const orders = [
        { orderId: "o1", mechanicId: "m1" },
        { orderId: "o2", mechanicId: "m1" },
      ];

      const result = await service.bulkStartOrders(orders);

      expect(result.summary.total).toBe(2);
      expect(result.summary.started).toBe(1);
      expect(result.summary.failed).toBe(1);
      expect(result.details.started).toHaveLength(1);
      expect(result.details.failed).toHaveLength(1);

      startOrderSpy.mockRestore();
    });

    it("should throw BadRequest when orders array is empty", async () => {
      await expect(service.bulkStartOrders([])).rejects.toThrow(ApiError);

      try {
        await service.bulkStartOrders([]);
      } catch (error) {
        expect(error.statusCode).toBe(400);
        expect(error.message).toContain("Tidak ada order yang dipilih");
      }
    });
  });

  // ============================================================
  // bulkCompleteOrders
  // ============================================================
  describe("bulkCompleteOrders", () => {
    it("should complete multiple orders and return results", async () => {
      const mockCompletedTask = {
        id: "a1",
        startAt: new Date(),
        endAt: new Date(),
      };

      const completeOrderSpy = jest
        .spyOn(service, "completeOrder")
        .mockResolvedValueOnce([mockCompletedTask])
        .mockRejectedValueOnce(new Error("Complete error"));

      const orders = [
        { orderId: "o1", mechanicId: "m1" },
        { orderId: "o2", mechanicId: "m1" },
      ];

      const result = await service.bulkCompleteOrders(orders);

      expect(result.summary.total).toBe(2);
      expect(result.summary.completed).toBe(1);
      expect(result.summary.failed).toBe(1);

      completeOrderSpy.mockRestore();
    });

    it("should throw BadRequest when orders array is empty", async () => {
      await expect(service.bulkCompleteOrders([])).rejects.toThrow(ApiError);

      try {
        await service.bulkCompleteOrders([]);
      } catch (error) {
        expect(error.statusCode).toBe(400);
        expect(error.message).toContain("Tidak ada order yang dipilih");
      }
    });
  });

  // ============================================================
  // getMyTaskHistory
  // ============================================================
  describe("getMyTaskHistory", () => {
    it("should delegate to taskRepo.findHistoryByMechanic", async () => {
      const mockResult = {
        data: [
          {
            id: "a1",
            orderItem: { productNameSnapshot: "Ganti Oli" },
            startAt: new Date(),
            endAt: new Date(),
          },
        ],
        metadata: { total: 1, currentPage: 1 },
      };
      mockTaskRepo.findHistoryByMechanic.mockResolvedValue(mockResult);

      const query = { page: 1, limit: 5, startDate: "2025-01-01" };
      const result = await service.getMyTaskHistory("m1", query);

      expect(result).toEqual(mockResult);
      expect(mockTaskRepo.findHistoryByMechanic).toHaveBeenCalledWith("m1", query);
    });

    it("should handle empty history", async () => {
      const mockResult = { data: [], metadata: { total: 0 } };
      mockTaskRepo.findHistoryByMechanic.mockResolvedValue(mockResult);

      const result = await service.getMyTaskHistory("m1");

      expect(result.data).toEqual([]);
    });
  });
});