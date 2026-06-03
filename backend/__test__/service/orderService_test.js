import OrderService from "#service/orderService.js";
import OrderRepository from "#repository/orderRepository.js";
import ProductRepository from "#repository/productRepository.js";
import StockRepository from "#repository/stockRepository.js";
import ShiftRepository from "#repository/shiftRepository.js";
import SettingRepository from "#repository/settingRepository.js";
import OrderHistoryRepository from "#repository/orderHistoryRepository.js";
import NotificationRepository from "#repository/notificationRepository.js";
import UserRepository from "#repository/userRepository.js";
import ApiError from "#shared/utils/error.js";
import prisma from "#app/database.js";
import logger from "#app/logger.js";
import CodeGenerator from "#shared/utils/code.js";
import Currency from "#shared/utils/currency.js";
import DateTime from "#shared/utils/datetime.js";
import Storage from "#shared/utils/storage.js";

jest.mock("#repository/orderRepository.js");
jest.mock("#repository/productRepository.js");
jest.mock("#repository/stockRepository.js");
jest.mock("#repository/shiftRepository.js");
jest.mock("#repository/settingRepository.js");
jest.mock("#repository/orderHistoryRepository.js");
jest.mock("#repository/notificationRepository.js");
jest.mock("#repository/userRepository.js");

jest.mock("#shared/utils/cache.js", () => {
  return jest.fn().mockImplementation(() => ({
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(undefined),
    invalidate: jest.fn().mockResolvedValue(undefined),
  }));
});

jest.mock("#shared/utils/code.js", () => ({
  orderNumber: jest.fn().mockResolvedValue("ORD-20260519-ABCD"),
}));

jest.mock("#shared/utils/currency.js", () => ({
  toIDR: jest.fn((amount) => `Rp ${amount?.toLocaleString?.("id-ID") || amount}`),
}));

jest.mock("#shared/utils/datetime.js", () => ({
  toFullID: jest.fn((date) => date ? date.toISOString() : "-"),
}));

jest.mock("#shared/utils/storage.js", () => ({
  getSignedUrl: jest.fn().mockResolvedValue("https://signed-url.com/image.jpg"),
}));

jest.mock("axios", () => ({
  post: jest.fn(),
}));

jest.mock("#app/logger.js", () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

jest.mock("#app/database.js", () => ({
  orderItem: { findMany: jest.fn().mockResolvedValue([]) },
  payment: { findFirst: jest.fn(), deleteMany: jest.fn() },
  $transaction: jest.fn((callback) =>
    callback({
      order: {
        create: jest.fn().mockResolvedValue({
          id: "o1",
          orderNumber: "ORD-20260519-ABCD",
          status: "DRAFT",
          subtotal: 100000,
          tax: 11000,
          total: 111000,
          createdAt: new Date(),
          customer: { name: "Budi" },
          vehicle: { plateNumber: "B 1234 CD", brand: "Vespa", model: "Sprint" },
          items: [
            {
              id: "oi1",
              productId: "p1",
              productNameSnapshot: "Kampas Rem",
              quantity: 2,
              unitPrice: 50000,
              unitCostSnapshot: 30000,
              subtotal: 100000,
              product: { id: "p1", name: "Kampas Rem", type: "SPAREPART" },
            },
          ],
        }),
        update: jest.fn().mockImplementation((args) =>
          Promise.resolve({
            id: args.where.id,
            orderNumber: "ORD-20260519-ABCD",
            status: args.data.status || "CANCELLED",
            closedAt: args.data.closedAt || null,
            updatedAt: args.data.updatedAt || new Date(),
            startedAt: args.data.startedAt || null,
            completedAt: args.data.completedAt || null,
          })
        ),
      },
      orderStatusHistory: { create: jest.fn().mockResolvedValue({}) },
      product: { update: jest.fn().mockResolvedValue({}) },
      shift: { update: jest.fn().mockResolvedValue({}) },
      stockMovement: { create: jest.fn().mockResolvedValue({}) },
      payment: { deleteMany: jest.fn().mockResolvedValue({}) },
    })
  ),
}));

describe("OrderService", () => {
  let service;
  let mockOrderRepo;
  let mockProductRepo;
  let mockShiftRepo;
  let mockSettingRepo;
  let mockOrderHistoryRepo;
  let mockNotifRepo;
  let mockUserRepo;

  beforeEach(() => {
    jest.clearAllMocks();

    OrderRepository.mockClear();
    ProductRepository.mockClear();
    StockRepository.mockClear();
    ShiftRepository.mockClear();
    SettingRepository.mockClear();
    OrderHistoryRepository.mockClear();
    NotificationRepository.mockClear();
    UserRepository.mockClear();

    service = new OrderService();

    mockOrderRepo = OrderRepository.mock.instances[0];
    mockProductRepo = ProductRepository.mock.instances[0];
    mockShiftRepo = ShiftRepository.mock.instances[0];
    mockSettingRepo = SettingRepository.mock.instances[0];
    mockOrderHistoryRepo = OrderHistoryRepository.mock.instances[0];
    mockNotifRepo = NotificationRepository.mock.instances[0];
    mockUserRepo = UserRepository.mock.instances[0];

    mockNotifRepo.create.mockResolvedValue({});
    mockUserRepo.findByRole.mockResolvedValue([]);
    prisma.orderItem.findMany.mockResolvedValue([]);
    prisma.payment.findFirst.mockResolvedValue(null);
  });

  // ============================================================
  // calculateTotal
  // ============================================================
  describe("calculateTotal", () => {
    it("should calculate total for SPAREPART and SERVICE items", async () => {
      mockProductRepo.findById
        .mockResolvedValueOnce({
          id: "p1",
          name: "Kampas",
          type: "SPAREPART",
          price: 50000,
          stock: 10,
          isActive: true,
        })
        .mockResolvedValueOnce({
          id: "p2",
          name: "Servis",
          type: "SERVICE",
          price: 100000,
          stock: 0,
          isActive: true,
        });
      mockSettingRepo.findByKey.mockResolvedValue({ value: "11" });

      const result = await service.calculateTotal([
        { productId: "p1", quantity: 2 },
        { productId: "p2", quantity: 1 },
      ]);

      expect(result.subtotal).toBe(200000);
      expect(result.tax).toBe(22000);
      expect(result.total).toBe(222000);
      expect(result.items).toHaveLength(2);
      expect(result.items[0].needMechanic).toBe(false);
      expect(result.items[1].needMechanic).toBe(true);
    });

    it("should calculate total correctly even with low stock (calculateTotal does NOT validate stock)", async () => {
      mockProductRepo.findById.mockResolvedValue({
        id: "p1",
        name: "Oli",
        type: "SPAREPART",
        price: 50000,
        stock: 2,
        isActive: true,
      });

      const result = await service.calculateTotal([
        { productId: "p1", quantity: 5 },
      ]);

      // calculateTotal only calculates, stock validation happens in createOrder
      expect(result.subtotal).toBe(250000);
      expect(result.items[0].stock).toBe(2); // Shows available stock
    });

    it("should throw NotFound when product not found", async () => {
      mockProductRepo.findById.mockResolvedValue(null);

      await expect(
        service.calculateTotal([{ productId: "p99", quantity: 1 }])
      ).rejects.toThrow(ApiError);

      try {
        await service.calculateTotal([{ productId: "p99", quantity: 1 }]);
      } catch (error) {
        expect(error.statusCode).toBe(404);
        expect(error.message).toContain("Produk tidak ditemukan");
      }
    });

    it("should throw BadRequest when product is inactive", async () => {
      mockProductRepo.findById.mockResolvedValue({
        id: "p1",
        name: "Oli",
        type: "SPAREPART",
        price: 50000,
        stock: 10,
        isActive: false,
      });

      await expect(
        service.calculateTotal([{ productId: "p1", quantity: 1 }])
      ).rejects.toThrow(ApiError);

      try {
        await service.calculateTotal([{ productId: "p1", quantity: 1 }]);
      } catch (error) {
        expect(error.statusCode).toBe(400);
        expect(error.message).toContain("tidak aktif");
      }
    });

    it("should use default tax rate when setting not found", async () => {
      mockProductRepo.findById.mockResolvedValue({
        id: "p1",
        name: "Oli",
        type: "SPAREPART",
        price: 100000,
        stock: 10,
        isActive: true,
      });
      mockSettingRepo.findByKey.mockResolvedValue(null); // No setting

      const result = await service.calculateTotal([
        { productId: "p1", quantity: 1 },
      ]);

      // Default tax rate is 11
      expect(result.tax).toBe(11000);
    });
  });

  // ============================================================
  // createOrder
  // ============================================================
  describe("createOrder", () => {
    const cashierId = "c1";

    beforeEach(() => {
      mockShiftRepo.hasActiveShift.mockResolvedValue(true);
      mockShiftRepo.findActiveByCashier.mockResolvedValue({
        id: "s1",
        status: "OPEN",
      });
      mockSettingRepo.findByKey.mockResolvedValue({ value: "11" });
      mockOrderRepo.isOrderNumberExists
        .mockResolvedValueOnce(false); // Default: order number available
      mockOrderRepo.findById.mockResolvedValue({
        id: "o1",
        orderNumber: "ORD-20260519-ABCD",
        items: [
          {
            id: "oi1",
            productId: "p1",
            productNameSnapshot: "Kampas Rem",
            quantity: 1,
            unitPrice: 50000,
            subtotal: 50000,
            product: { image: null },
          },
        ],
      });
      mockUserRepo.findById.mockResolvedValue({
        id: cashierId,
        fullName: "Kasir 1",
      });
    });

    it("should create SPAREPART only order without customer", async () => {
      mockProductRepo.findById.mockResolvedValue({
        id: "p1",
        name: "Kampas Rem",
        type: "SPAREPART",
        price: 50000,
        stock: 10,
        isActive: true,
        cost: 30000,
      });

      const result = await service.createOrder(cashierId, {
        customerId: null,
        vehicleId: null,
        items: [{ productId: "p1", quantity: 1 }],
      });

      expect(result).toBeDefined();
      expect(logger.info).toHaveBeenCalledWith(
        "Pesanan berhasil dibuat",
        expect.objectContaining({
          orderNumber: "ORD-20260519-ABCD",
          type: "SPAREPART",
        })
      );
    });

    it("should create SERVICE order with customer and vehicle", async () => {
      mockProductRepo.findById.mockResolvedValue({
        id: "p2",
        name: "Ganti Oli",
        type: "SERVICE",
        price: 100000,
        stock: 0,
        isActive: true,
        cost: 0,
      });

      const result = await service.createOrder(cashierId, {
        customerId: "cust-1",
        vehicleId: "veh-1",
        items: [{ productId: "p2", quantity: 1 }],
      });

      expect(result).toBeDefined();
      expect(logger.info).toHaveBeenCalledWith(
        "Pesanan berhasil dibuat",
        expect.objectContaining({
          type: "SERVICE",
        })
      );
    });

    it("should throw BadRequest when service order has no customer", async () => {
      mockProductRepo.findById.mockResolvedValue({
        id: "p2",
        name: "Ganti Oli",
        type: "SERVICE",
        price: 100000,
        isActive: true,
      });

      await expect(
        service.createOrder(cashierId, {
          items: [{ productId: "p2", quantity: 1 }],
        })
      ).rejects.toThrow(/memerlukan customer/);
    });

    it("should throw BadRequest when service order has no vehicle", async () => {
      mockProductRepo.findById.mockResolvedValue({
        id: "p2",
        name: "Ganti Oli",
        type: "SERVICE",
        price: 100000,
        isActive: true,
      });

      await expect(
        service.createOrder(cashierId, {
          customerId: "cust-1",
          items: [{ productId: "p2", quantity: 1 }],
        })
      ).rejects.toThrow(/memerlukan kendaraan/);
    });

    it("should throw BadRequest when cashier has no active shift", async () => {
      mockShiftRepo.hasActiveShift.mockResolvedValue(false);

      await expect(
        service.createOrder(cashierId, {
          items: [{ productId: "p1", quantity: 1 }],
        })
      ).rejects.toThrow(ApiError);

      try {
        await service.createOrder(cashierId, {
          items: [{ productId: "p1", quantity: 1 }],
        });
      } catch (error) {
        expect(error.statusCode).toBe(400);
        expect(error.message).toContain("Kasir tidak memiliki shift aktif");
      }
    });

    it("should throw BadRequest when SPAREPART stock insufficient", async () => {
      mockProductRepo.findById.mockResolvedValue({
        id: "p1",
        name: "Kampas Rem",
        type: "SPAREPART",
        price: 50000,
        stock: 2,
        isActive: true,
        cost: 30000,
      });

      await expect(
        service.createOrder(cashierId, {
          items: [{ productId: "p1", quantity: 5 }],
        })
      ).rejects.toThrow(/Stok produk.*tidak mencukupi/);
    });

    it("should handle order number collision", async () => {
      mockProductRepo.findById.mockResolvedValue({
        id: "p1",
        name: "Kampas Rem",
        type: "SPAREPART",
        price: 50000,
        stock: 10,
        isActive: true,
        cost: 30000,
      });

      // First call returns true (exists), second returns false (available)
      mockOrderRepo.isOrderNumberExists
        .mockReset()
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false);

      const result = await service.createOrder(cashierId, {
        items: [{ productId: "p1", quantity: 1 }],
      });

      expect(result).toBeDefined();
      // CodeGenerator.orderNumber dipanggil 2x
      expect(CodeGenerator.orderNumber).toHaveBeenCalledTimes(2);
    });

    it("should send notification after creating order", async () => {
      mockProductRepo.findById.mockResolvedValue({
        id: "p1",
        name: "Kampas Rem",
        type: "SPAREPART",
        price: 50000,
        stock: 10,
        isActive: true,
        cost: 30000,
      });

      await service.createOrder(cashierId, {
        items: [{ productId: "p1", quantity: 1 }],
      });

      expect(mockNotifRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: cashierId,
          title: expect.stringContaining("ORD-20260519-ABCD"),
          type: "SUCCESS",
        })
      );
    });
  });

  // ============================================================
  // getOrder
  // ============================================================
  describe("getOrder", () => {
    it("should return order by order number", async () => {
      mockOrderRepo.findByOrderNumber.mockResolvedValue({
        id: "o1",
        orderNumber: "ORD-001",
        items: [],
      });

      const result = await service.getOrder("ORD-001");

      expect(result.orderNumber).toBe("ORD-001");
    });

    it("should return order by ID when order number not found", async () => {
      mockOrderRepo.findByOrderNumber.mockResolvedValue(null);
      mockOrderRepo.findById.mockResolvedValue({
        id: "o1",
        orderNumber: "ORD-001",
        items: [],
      });

      const result = await service.getOrder("o1");

      expect(result.id).toBe("o1");
    });

    it("should add signed URLs to product images", async () => {
      mockOrderRepo.findByOrderNumber.mockResolvedValue({
        id: "o1",
        orderNumber: "ORD-001",
        items: [
          {
            product: {
              id: "p1",
              name: "Oli",
              image: { path: "products/oli.jpg" },
            },
          },
        ],
      });

      const result = await service.getOrder("ORD-001");

      expect(result.items[0].product.image.url).toBe(
        "https://signed-url.com/image.jpg"
      );
      expect(Storage.getSignedUrl).toHaveBeenCalledWith("products/oli.jpg");
    });

    it("should throw NotFound when order not found", async () => {
      mockOrderRepo.findByOrderNumber.mockResolvedValue(null);
      mockOrderRepo.findById.mockResolvedValue(null);

      await expect(service.getOrder("ORD-999")).rejects.toThrow(ApiError);

      try {
        await service.getOrder("ORD-999");
      } catch (error) {
        expect(error.statusCode).toBe(404);
        expect(error.message).toContain("Pesanan tidak ditemukan");
      }
    });
  });

  // ============================================================
  // getOrders
  // ============================================================
  describe("getOrders", () => {
    it("should return paginated orders with signed URLs", async () => {
      mockOrderRepo.findMany.mockResolvedValue({
        data: [
          { id: "o1", items: [{ product: { image: { path: "img.jpg" } } }] },
          { id: "o2", items: [] },
        ],
        metadata: { total: 2, currentPage: 1 },
      });

      const result = await service.getOrders({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(2);
      expect(result.metadata.total).toBe(2);
      expect(logger.info).toHaveBeenCalledWith(
        "Mengambil daftar pesanan",
        expect.objectContaining({ total: 2 })
      );
    });

    it("should handle empty results", async () => {
      mockOrderRepo.findMany.mockResolvedValue({
        data: [],
        metadata: { total: 0 },
      });

      const result = await service.getOrders();

      expect(result.data).toEqual([]);
    });
  });

  // ============================================================
  // getActiveOrders
  // ============================================================
  describe("getActiveOrders", () => {
    it("should return active orders for cashier", async () => {
      mockOrderRepo.findActiveByCashier.mockResolvedValue({
        data: [{ id: "o1", items: [] }],
        metadata: { total: 1 },
      });

      const result = await service.getActiveOrders("c1", { status: "QUEUED" });

      expect(result.data).toHaveLength(1);
      expect(mockOrderRepo.findActiveByCashier).toHaveBeenCalledWith("c1", {
        status: "QUEUED",
      });
    });
  });

  // ============================================================
  // cancelOrder
  // ============================================================
  describe("cancelOrder", () => {
    const mockOrder = {
      id: "o1",
      orderNumber: "ORD-20260519-ABCD",
      status: "DRAFT",
      total: 600000,
      shiftId: "s1",
      cashierId: "c1",
      items: [
        {
          id: "oi1",
          productId: "p1",
          quantity: 2,
          product: { type: "SPAREPART" },
        },
      ],
    };

    beforeEach(() => {
      mockOrderRepo.findById.mockResolvedValue(mockOrder);
      prisma.orderItem.findMany.mockResolvedValue([
        {
          id: "oi1",
          productId: "p1",
          quantity: 2,
          product: { type: "SPAREPART" },
        },
      ]);
      mockUserRepo.findById.mockResolvedValue({
        id: "u1",
        fullName: "Admin",
      });
      mockOrderRepo.findByOrderNumber.mockResolvedValue({
        ...mockOrder,
        status: "CANCELLED",
      });
    });

    it("should cancel order and restore stock", async () => {
      const result = await service.cancelOrder("o1", "u1");

      expect(result.status).toBe("CANCELLED");
      expect(service.cache.invalidate).toHaveBeenCalledWith(
        "history:ORD-20260519-ABCD"
      );
      expect(logger.warn).toHaveBeenCalledWith(
        "Pesanan dibatalkan",
        expect.objectContaining({
          orderId: "o1",
          orderNumber: "ORD-20260519-ABCD",
        })
      );
    });

    it("should send warning notification when order cancelled", async () => {
      await service.cancelOrder("o1", "u1");

      expect(mockNotifRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "c1",
          title: expect.stringContaining("Dibatalkan"),
          type: "WARNING",
        })
      );
    });

    it("should throw NotFound when order not found", async () => {
      mockOrderRepo.findById.mockResolvedValue(null);

      await expect(service.cancelOrder("o99", "u1")).rejects.toThrow(ApiError);

      try {
        await service.cancelOrder("o99", "u1");
      } catch (error) {
        expect(error.statusCode).toBe(404);
      }
    });

    it("should throw Conflict when order is COMPLETED", async () => {
      mockOrderRepo.findById.mockResolvedValue({
        ...mockOrder,
        status: "COMPLETED",
      });

      await expect(service.cancelOrder("o1", "u1")).rejects.toThrow(ApiError);

      try {
        await service.cancelOrder("o1", "u1");
      } catch (error) {
        expect(error.statusCode).toBe(409);
      }
    });

    it("should throw Conflict when order is CANCELLED", async () => {
      mockOrderRepo.findById.mockResolvedValue({
        ...mockOrder,
        status: "CANCELLED",
      });

      await expect(service.cancelOrder("o1", "u1")).rejects.toThrow(ApiError);

      try {
        await service.cancelOrder("o1", "u1");
      } catch (error) {
        expect(error.statusCode).toBe(409);
        expect(error.message).toContain("sudah dibatalkan");
      }
    });
  });

  // ============================================================
  // closeOrder
  // ============================================================
  describe("closeOrder", () => {
    const mockOrder = {
      id: "o1",
      orderNumber: "ORD-20260519-ABCD",
      status: "COMPLETED",
      total: 111000,
      cashierId: "c1",
      items: [{ product: { type: "SERVICE" } }],
      customer: { name: "Budi" },
      vehicle: {
        plateNumber: "B 1234 CD",
        brand: "Vespa",
        model: "Sprint",
      },
    };

    beforeEach(() => {
      mockUserRepo.findById.mockResolvedValue({
        id: "u1",
        fullName: "Kasir",
      });
    });

    it("should close COMPLETED order", async () => {
      mockOrderRepo.findById.mockResolvedValue(mockOrder);

      const result = await service.closeOrder("o1", "u1");

      expect(result.status).toBe("CLOSED");
      expect(service.cache.invalidate).toHaveBeenCalledWith(
        "history:ORD-20260519-ABCD"
      );
    });

    it("should send SUCCESS notification when order closed", async () => {
      mockOrderRepo.findById.mockResolvedValue(mockOrder);

      await service.closeOrder("o1", "u1");

      expect(mockNotifRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "c1",
          title: expect.stringContaining("Ditutup"),
          type: "SUCCESS",
        })
      );
    });

    it("should throw NotFound when order not found", async () => {
      mockOrderRepo.findById.mockResolvedValue(null);

      await expect(service.closeOrder("o99", "u1")).rejects.toThrow(ApiError);
    });

    it("should throw Conflict when order is not COMPLETED", async () => {
      mockOrderRepo.findById.mockResolvedValue({
        ...mockOrder,
        status: "QUEUED",
      });

      await expect(service.closeOrder("o1", "u1")).rejects.toThrow(ApiError);

      try {
        await service.closeOrder("o1", "u1");
      } catch (error) {
        expect(error.statusCode).toBe(409);
        expect(error.message).toContain(
          "Hanya pesanan dengan status COMPLETED"
        );
      }
    });

    it("should throw Conflict when order already CLOSED", async () => {
      mockOrderRepo.findById.mockResolvedValue({
        ...mockOrder,
        status: "CLOSED",
      });

      await expect(service.closeOrder("o1", "u1")).rejects.toThrow(ApiError);

      try {
        await service.closeOrder("o1", "u1");
      } catch (error) {
        expect(error.statusCode).toBe(409);
        expect(error.message).toContain("Pesanan sudah ditutup");
      }
    });

    it("should throw Conflict when order is CANCELLED", async () => {
      mockOrderRepo.findById.mockResolvedValue({
        ...mockOrder,
        status: "CANCELLED",
      });

      await expect(service.closeOrder("o1", "u1")).rejects.toThrow(ApiError);

      try {
        await service.closeOrder("o1", "u1");
      } catch (error) {
        expect(error.statusCode).toBe(409);
        expect(error.message).toContain("Pesanan sudah dibatalkan");
      }
    });
  });

  // ============================================================
  // updateOrderStatus
  // ============================================================
  describe("updateOrderStatus", () => {
    const mockOrder = {
      id: "o1",
      orderNumber: "ORD-20260519-ABCD",
      status: "QUEUED",
      total: 100000,
      shiftId: "s1",
      cashierId: "c1",
      items: [
        {
          product: { type: "SERVICE" },
          productId: "p2",
          quantity: 1,
        },
      ],
    };

    beforeEach(() => {
      mockOrderRepo.findById.mockResolvedValue(mockOrder);
    });

    it("should update order status to IN_PROGRESS", async () => {
      const result = await service.updateOrderStatus("o1", "IN_PROGRESS", "u1");

      expect(result.status).toBe("IN_PROGRESS");
      expect(service.cache.invalidate).toHaveBeenCalledWith(
        "history:ORD-20260519-ABCD"
      );
      expect(logger.info).toHaveBeenCalledWith(
        "Status pesanan diperbarui",
        expect.objectContaining({
          orderId: "o1",
          newStatus: "IN_PROGRESS",
        })
      );
    });

    it("should update order status to COMPLETED", async () => {
      const result = await service.updateOrderStatus("o1", "COMPLETED", "u1");

      expect(result.status).toBe("COMPLETED");
    });

    it("should throw NotFound when order not found", async () => {
      mockOrderRepo.findById.mockResolvedValue(null);

      await expect(
        service.updateOrderStatus("o99", "IN_PROGRESS", "u1")
      ).rejects.toThrow(ApiError);

      try {
        await service.updateOrderStatus("o99", "IN_PROGRESS", "u1");
      } catch (error) {
        expect(error.statusCode).toBe(404);
      }
    });

    it("should throw Conflict when order is COMPLETED", async () => {
      mockOrderRepo.findById.mockResolvedValue({
        ...mockOrder,
        status: "COMPLETED",
      });

      await expect(
        service.updateOrderStatus("o1", "IN_PROGRESS", "u1")
      ).rejects.toThrow(ApiError);
    });
  });

  // ============================================================
  // softDeleteOrder & restoreOrder
  // ============================================================
  describe("softDeleteOrder", () => {
    it("should soft delete order", async () => {
      mockOrderRepo.findById.mockResolvedValue({
        id: "o1",
        orderNumber: "ORD-20260519-ABCD",
      });
      mockOrderRepo.softDelete.mockResolvedValue(undefined);

      await service.softDeleteOrder("o1");

      expect(mockOrderRepo.softDelete).toHaveBeenCalledWith("o1");
      expect(service.cache.invalidate).toHaveBeenCalledWith(
        "history:ORD-20260519-ABCD"
      );
      expect(logger.info).toHaveBeenCalledWith(
        "Pesanan di-soft delete",
        expect.objectContaining({
          orderId: "o1",
        })
      );
    });

    it("should throw NotFound when order not found", async () => {
      mockOrderRepo.findById.mockResolvedValue(null);

      await expect(service.softDeleteOrder("o99")).rejects.toThrow(ApiError);

      try {
        await service.softDeleteOrder("o99");
      } catch (error) {
        expect(error.statusCode).toBe(404);
      }
    });
  });

  describe("restoreOrder", () => {
    it("should restore order", async () => {
      mockOrderRepo.findById.mockResolvedValue({
        id: "o1",
        orderNumber: "ORD-20260519-ABCD",
      });
      mockOrderRepo.restore.mockResolvedValue(undefined);

      await service.restoreOrder("o1");

      expect(mockOrderRepo.restore).toHaveBeenCalledWith("o1");
      expect(service.cache.invalidate).toHaveBeenCalledWith(
        "history:ORD-20260519-ABCD"
      );
    });

    it("should throw NotFound when order not found", async () => {
      mockOrderRepo.findById.mockResolvedValue(null);

      await expect(service.restoreOrder("o99")).rejects.toThrow(ApiError);
    });
  });

  // ============================================================
  // trackOrderHistory
  // ============================================================
  describe("trackOrderHistory", () => {
    it("should return cached order history", async () => {
      const cached = { orderNumber: "ORD-001", currentStatus: "COMPLETED" };
      service.cache.get.mockResolvedValue(cached);

      const result = await service.trackOrderHistory("ORD-001");

      expect(result).toEqual(cached);
      expect(logger.info).toHaveBeenCalledWith(
        "Cache hit untuk order history",
        expect.objectContaining({ orderNumber: "ORD-001" })
      );
    });

    it("should fetch and cache order history when not cached", async () => {
      service.cache.get.mockResolvedValue(null);
      mockOrderHistoryRepo.findByOrderNumber.mockResolvedValue({
        orderNumber: "ORD-001",
        status: "COMPLETED",
        total: 111000,
        createdAt: new Date(),
        completedAt: null,
        closedAt: null,
        cashier: { fullName: "Kasir" },
        customer: { name: "Budi" },
        vehicle: { plateNumber: "B 1234 CD" },
        payment: null,
        items: [],
        histories: [
          {
            status: "DRAFT",
            note: "Pesanan dibuat",
            createdAt: new Date(),
            changedBy: { fullName: "Kasir" },
          },
        ],
      });

      const result = await service.trackOrderHistory("ORD-001");

      expect(result.orderNumber).toBe("ORD-001");
      expect(result.timeline).toHaveLength(1);
      expect(result.timeline[0].status).toBe("DRAFT");
      expect(result.timeline[0].changedBy).toBe("Kasir");
      expect(service.cache.set).toHaveBeenCalled();
    });

    it("should throw NotFound when order not found", async () => {
      service.cache.get.mockResolvedValue(null);
      mockOrderHistoryRepo.findByOrderNumber.mockResolvedValue(null);

      await expect(
        service.trackOrderHistory("ORD-999")
      ).rejects.toThrow(ApiError);

      try {
        await service.trackOrderHistory("ORD-999");
      } catch (error) {
        expect(error.statusCode).toBe(404);
      }
    });
  });

  // ============================================================
  // cancelOrders (Bulk)
  // ============================================================
  describe("cancelOrders", () => {
    it("should cancel multiple DRAFT orders", async () => {
      mockUserRepo.findById.mockResolvedValue({ id: "u1", fullName: "Admin" });
      mockOrderRepo.findById.mockResolvedValue({
        id: "o1",
        orderNumber: "ORD-001",
        status: "DRAFT",
        total: 100000,
        shiftId: "s1",
        cashierId: "c1",
        items: [],
      });
      prisma.orderItem.findMany.mockResolvedValue([]);
      mockOrderRepo.cancelMany.mockResolvedValue({
        success: [{ id: "o1" }],
        failed: [],
      });

      const result = await service.cancelOrders(["o1"], "u1");

      expect(result.summary.total).toBe(1);
      expect(result.summary.cancelled).toBe(1);
      expect(result.summary.failed).toBe(0);
    });

    it("should throw BadRequest when orderIds is empty", async () => {
      await expect(service.cancelOrders([], "u1")).rejects.toThrow(ApiError);

      try {
        await service.cancelOrders([], "u1");
      } catch (error) {
        expect(error.statusCode).toBe(400);
        expect(error.message).toContain("Tidak ada pesanan yang dipilih");
      }
    });

    it("should skip non-DRAFT orders", async () => {
      mockUserRepo.findById.mockResolvedValue({ id: "u1", fullName: "Admin" });
      mockOrderRepo.findById.mockResolvedValue({
        id: "o1",
        orderNumber: "ORD-001",
        status: "COMPLETED",
        items: [],
      });
      mockOrderRepo.cancelMany.mockResolvedValue({
        success: [],
        failed: [],
      });

      await expect(service.cancelOrders(["o1"], "u1")).rejects.toThrow(
        ApiError
      );

      try {
        await service.cancelOrders(["o1"], "u1");
      } catch (error) {
        expect(error.statusCode).toBe(400);
        expect(error.message).toContain(
          "Tidak ada pesanan dengan status DRAFT"
        );
        expect(error.details).toHaveLength(1);
        expect(error.details[0].reason).toContain("Status pesanan COMPLETED");
      }
    });

    it("should skip non-existent orders", async () => {
      mockUserRepo.findById.mockResolvedValue({ id: "u1", fullName: "Admin" });
      mockOrderRepo.findById.mockResolvedValue(null);
      mockOrderRepo.cancelMany.mockResolvedValue({
        success: [],
        failed: [],
      });

      await expect(service.cancelOrders(["o99"], "u1")).rejects.toThrow(
        ApiError
      );

      try {
        await service.cancelOrders(["o99"], "u1");
      } catch (error) {
        expect(error.details[0].reason).toBe("Pesanan tidak ditemukan");
      }
    });
  });

  // ============================================================
  // closeOrders (Bulk)
  // ============================================================
  describe("closeOrders", () => {
    it("should close multiple COMPLETED orders", async () => {
      mockUserRepo.findById.mockResolvedValue({ id: "u1", fullName: "Admin" });
      mockOrderRepo.findById.mockResolvedValue({
        id: "o1",
        orderNumber: "ORD-001",
        status: "COMPLETED",
        items: [],
      });
      mockOrderRepo.closeMany.mockResolvedValue({
        success: [{ id: "o1" }],
        failed: [],
      });

      const result = await service.closeOrders(["o1"], "u1");

      expect(result.summary.total).toBe(1);
      expect(result.summary.closed).toBe(1);
    });

    it("should throw BadRequest when orderIds is empty", async () => {
      await expect(service.closeOrders([], "u1")).rejects.toThrow(ApiError);

      try {
        await service.closeOrders([], "u1");
      } catch (error) {
        expect(error.statusCode).toBe(400);
        expect(error.message).toContain("Tidak ada pesanan yang dipilih");
      }
    });

    it("should skip non-COMPLETED orders", async () => {
      mockUserRepo.findById.mockResolvedValue({ id: "u1", fullName: "Admin" });
      mockOrderRepo.findById.mockResolvedValue({
        id: "o1",
        orderNumber: "ORD-001",
        status: "DRAFT",
        items: [],
      });
      mockOrderRepo.closeMany.mockResolvedValue({
        success: [],
        failed: [],
      });

      await expect(service.closeOrders(["o1"], "u1")).rejects.toThrow(
        ApiError
      );

      try {
        await service.closeOrders(["o1"], "u1");
      } catch (error) {
        expect(error.statusCode).toBe(400);
        expect(error.message).toContain(
          "Tidak ada pesanan dengan status COMPLETED"
        );
      }
    });

    it("should skip non-existent orders", async () => {
      mockUserRepo.findById.mockResolvedValue({ id: "u1", fullName: "Admin" });
      mockOrderRepo.findById.mockResolvedValue(null);
      mockOrderRepo.closeMany.mockResolvedValue({
        success: [],
        failed: [],
      });

      await expect(service.closeOrders(["o99"], "u1")).rejects.toThrow(
        ApiError
      );

      try {
        await service.closeOrders(["o99"], "u1");
      } catch (error) {
        expect(error.details[0].reason).toBe("Pesanan tidak ditemukan");
      }
    });
  });
});