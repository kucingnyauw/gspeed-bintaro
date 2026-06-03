import StockService from "#service/stockService.js";
import StockRepository from "#repository/stockRepository.js";
import ProductRepository from "#repository/productRepository.js";
import NotificationRepository from "#repository/notificationRepository.js";
import SettingRepository from "#repository/settingRepository.js";
import ApiError from "#shared/utils/error.js";
import prisma from "#app/database.js";
import logger from "#app/logger.js";
import Currency from "#shared/utils/currency.js";
import DateTime from "#shared/utils/datetime.js";

// Mock repositories
jest.mock("#repository/stockRepository.js");
jest.mock("#repository/productRepository.js");
jest.mock("#repository/notificationRepository.js");
jest.mock("#repository/settingRepository.js");

// Mock Currency
jest.mock("#shared/utils/currency.js", () => ({
  toIDR: jest.fn((amount) => `Rp ${amount?.toLocaleString?.("id-ID") || amount}`),
}));

// Mock DateTime
jest.mock("#shared/utils/datetime.js", () => ({
  toFullID: jest.fn((date) => date ? date.toISOString() : "-"),
}));

// Mock prisma
jest.mock("#app/database.js", () => ({
  $transaction: jest.fn((callback) =>
    callback({
      product: { 
        update: jest.fn().mockResolvedValue({ id: "prod-1", stock: 15 }) 
      },
    })
  ),
  user: {
    findUnique: jest.fn().mockResolvedValue({ id: "user-1", fullName: "Admin User" }),
    findMany: jest.fn().mockResolvedValue([
      { id: "admin-1", isActive: true },
      { id: "admin-2", isActive: true },
    ]),
  },
}));

// Mock logger
jest.mock("#app/logger.js", () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

describe("StockService", () => {
  let service;
  let mockStockRepo;
  let mockProductRepo;
  let mockNotifRepo;
  let mockSettingRepo;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Clear mock instances
    StockRepository.mockClear();
    ProductRepository.mockClear();
    NotificationRepository.mockClear();
    SettingRepository.mockClear();
    
    service = new StockService();

    mockStockRepo = StockRepository.mock.instances[0];
    mockProductRepo = ProductRepository.mock.instances[0];
    mockNotifRepo = NotificationRepository.mock.instances[0];
    mockSettingRepo = SettingRepository.mock.instances[0];

    // Default setting mock
    mockSettingRepo.findByKey.mockResolvedValue({ value: "5" });
    
    // Default prisma mocks
    prisma.user.findMany.mockResolvedValue([
      { id: "admin-1", isActive: true },
      { id: "admin-2", isActive: true },
    ]);
    prisma.user.findUnique.mockResolvedValue({ id: "user-1", fullName: "Admin User" });
  });

  // ============================================================
  // recordStockIn
  // ============================================================
  describe("recordStockIn", () => {
    const productId = "prod-1";
    const quantity = 10;
    const recordedById = "user-1";
    const note = "Restock dari supplier";
    const sourceType = "PURCHASE";

    const mockProduct = {
      id: productId,
      name: "Oli Mesin",
      sku: "SP-ABC123",
      type: "SPAREPART",
      stock: 5,
      cost: 30000,
      price: 50000,
      isActive: true,
    };

    const mockMovement = {
      id: "sm-1",
      productId,
      type: "IN",
      sourceType,
      quantity,
      recordedById,
      note,
    };

    beforeEach(() => {
      mockProductRepo.findById.mockResolvedValue(mockProduct);
      mockStockRepo.createInTransaction.mockResolvedValue(mockMovement);
      
      // Mock transaction
      prisma.$transaction.mockImplementation(async (callback) => {
        return callback({
          product: {
            update: jest.fn().mockResolvedValue({ ...mockProduct, stock: 15 }),
          },
        });
      });
    });

    it("should record stock in successfully with all fields", async () => {
      const result = await service.recordStockIn(
        productId,
        quantity,
        recordedById,
        note,
        sourceType
      );

      expect(result.type).toBe("IN");
      expect(result.sourceType).toBe("PURCHASE");
      expect(mockProductRepo.findById).toHaveBeenCalledWith(productId);
      expect(mockStockRepo.createInTransaction).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith(
        "Stok masuk berhasil dicatat",
        expect.objectContaining({
          productId,
          productName: "Oli Mesin",
          quantity,
          sourceType,
        })
      );
    });

    it("should use default values when optional params not provided", async () => {
      await service.recordStockIn(productId, quantity, recordedById);

      expect(mockStockRepo.createInTransaction).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          sourceType: "MANUAL",
          note: null,
        })
      );
    });

    it("should throw NotFoundError when product not found", async () => {
      mockProductRepo.findById.mockResolvedValue(null);

      await expect(
        service.recordStockIn(productId, quantity, recordedById)
      ).rejects.toThrow(ApiError);

      try {
        await service.recordStockIn(productId, quantity, recordedById);
      } catch (error) {
        expect(error.statusCode).toBe(404);
        expect(error.message).toContain("Produk dengan ID 'prod-1' tidak ditemukan");
      }
    });

    it("should throw BadRequest when product is SERVICE type", async () => {
      mockProductRepo.findById.mockResolvedValue({
        ...mockProduct,
        type: "SERVICE",
      });

      await expect(
        service.recordStockIn(productId, quantity, recordedById)
      ).rejects.toThrow(ApiError);

      try {
        await service.recordStockIn(productId, quantity, recordedById);
      } catch (error) {
        expect(error.statusCode).toBe(400);
        expect(error.message).toContain("adalah service, tidak memiliki stok");
      }
    });

    it("should send stock restored notification when stock goes above threshold", async () => {
      // Previous stock was 0 (below threshold), new stock will be 10 (above threshold)
      mockProductRepo.findById.mockResolvedValue({ ...mockProduct, stock: 0 });
      
      prisma.$transaction.mockImplementation(async (callback) => {
        return callback({
          product: {
            update: jest.fn().mockResolvedValue({ ...mockProduct, stock: 10 }),
          },
        });
      });

      await service.recordStockIn(productId, 10, recordedById, null, "PURCHASE");

      // Should send notification to admins
      expect(mockNotifRepo.create).toHaveBeenCalled();
    });

    it("should handle notification failure gracefully", async () => {
      mockNotifRepo.create.mockRejectedValue(new Error("Notification error"));

      // Should not throw
      const result = await service.recordStockIn(
        productId,
        quantity,
        recordedById,
        note,
        sourceType
      );

      expect(result.type).toBe("IN");
      expect(logger.warn).toHaveBeenCalled();
    });
  });

  // ============================================================
  // recordStockOut
  // ============================================================
  describe("recordStockOut", () => {
    const productId = "prod-1";
    const quantity = 3;
    const recordedById = "user-1";
    const orderItemId = "oi-1";
    const note = "Stok keluar untuk penjualan";
    const sourceType = "SALE";

    const mockProduct = {
      id: productId,
      name: "Oli Mesin",
      sku: "SP-ABC123",
      type: "SPAREPART",
      stock: 10,
      cost: 30000,
      price: 50000,
      isActive: true,
    };

    const mockMovement = {
      id: "sm-2",
      productId,
      type: "OUT",
      sourceType,
      quantity,
      recordedById,
      orderItemId,
      note,
    };

    beforeEach(() => {
      mockProductRepo.findById.mockResolvedValue(mockProduct);
      mockStockRepo.createInTransaction.mockResolvedValue(mockMovement);
      
      prisma.$transaction.mockImplementation(async (callback) => {
        return callback({
          product: {
            update: jest.fn().mockResolvedValue({ ...mockProduct, stock: 7 }),
          },
        });
      });
    });

    it("should record stock out successfully", async () => {
      const result = await service.recordStockOut(
        productId,
        quantity,
        recordedById,
        orderItemId,
        note,
        sourceType
      );

      expect(result.type).toBe("OUT");
      expect(result.sourceType).toBe("SALE");
      expect(mockProductRepo.findById).toHaveBeenCalledWith(productId);
      expect(logger.info).toHaveBeenCalledWith(
        "Stok keluar berhasil dicatat",
        expect.objectContaining({
          productId,
          quantity,
          sourceType,
        })
      );
    });

    it("should throw BadRequest when stock insufficient", async () => {
      mockProductRepo.findById.mockResolvedValue({ ...mockProduct, stock: 2 });

      await expect(
        service.recordStockOut(productId, 3, recordedById)
      ).rejects.toThrow(ApiError);

      try {
        await service.recordStockOut(productId, 3, recordedById);
      } catch (error) {
        expect(error.statusCode).toBe(400);
        expect(error.message).toContain("Stok produk 'Oli Mesin' tidak mencukupi");
        expect(error.message).toContain("Stok saat ini: 2");
        expect(error.message).toContain("Diminta: 3");
      }
    });

    it("should throw NotFoundError when product not found", async () => {
      mockProductRepo.findById.mockResolvedValue(null);

      await expect(
        service.recordStockOut(productId, quantity, recordedById)
      ).rejects.toThrow(ApiError);

      try {
        await service.recordStockOut(productId, quantity, recordedById);
      } catch (error) {
        expect(error.statusCode).toBe(404);
      }
    });

    it("should throw BadRequest when product is SERVICE type", async () => {
      mockProductRepo.findById.mockResolvedValue({
        ...mockProduct,
        type: "SERVICE",
      });

      await expect(
        service.recordStockOut(productId, quantity, recordedById)
      ).rejects.toThrow(ApiError);

      try {
        await service.recordStockOut(productId, quantity, recordedById);
      } catch (error) {
        expect(error.statusCode).toBe(400);
        expect(error.message).toContain("adalah service, tidak memiliki stok");
      }
    });

    it("should send low stock notification when stock falls below threshold", async () => {
      // Stock will be 2 after decrement of 3 from 5
      mockProductRepo.findById.mockResolvedValue({ ...mockProduct, stock: 5 });
      
      prisma.$transaction.mockImplementation(async (callback) => {
        return callback({
          product: {
            update: jest.fn().mockResolvedValue({ ...mockProduct, stock: 2 }),
          },
        });
      });

      await service.recordStockOut(productId, 3, recordedById);

      // Should notify admins about low stock
      expect(mockNotifRepo.create).toHaveBeenCalled();
    });

    it("should send out of stock notification when stock becomes 0", async () => {
      mockProductRepo.findById.mockResolvedValue({ ...mockProduct, stock: 3 });
      
      prisma.$transaction.mockImplementation(async (callback) => {
        return callback({
          product: {
            update: jest.fn().mockResolvedValue({ ...mockProduct, stock: 0 }),
          },
        });
      });

      await service.recordStockOut(productId, 3, recordedById);

      // Should notify admins with ERROR type
      const notificationCalls = mockNotifRepo.create.mock.calls;
      const errorNotification = notificationCalls.find(
        (call) => call[0].type === "ERROR"
      );
      expect(errorNotification).toBeDefined();
    });
  });

  // ============================================================
  // recordSaleOut
  // ============================================================
  describe("recordSaleOut", () => {
    it("should call recordStockOut with SALE sourceType", async () => {
      mockProductRepo.findById.mockResolvedValue({
        id: "prod-1",
        name: "Filter",
        sku: "SP-DEF",
        type: "SPAREPART",
        stock: 10,
        cost: 20000,
        price: 35000,
      });
      
      mockStockRepo.createInTransaction.mockResolvedValue({
        id: "sm-sale",
        type: "OUT",
        sourceType: "SALE",
      });

      prisma.$transaction.mockImplementation(async (callback) => {
        return callback({
          product: {
            update: jest.fn().mockResolvedValue({ id: "prod-1", stock: 8 }),
          },
        });
      });

      const result = await service.recordSaleOut("prod-1", 2, "user-1", "oi-1");

      expect(result.sourceType).toBe("SALE");
      expect(mockStockRepo.createInTransaction).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          sourceType: "SALE",
          orderItemId: "oi-1",
          note: null,
        })
      );
    });
  });

  // ============================================================
  // recordReturnIn
  // ============================================================
  describe("recordReturnIn", () => {
    it("should call recordStockIn with RETURN sourceType and default note", async () => {
      mockProductRepo.findById.mockResolvedValue({
        id: "prod-1",
        name: "Ban",
        sku: "SP-GHI",
        type: "SPAREPART",
        stock: 3,
        cost: 25000,
        price: 45000,
      });
      
      mockStockRepo.createInTransaction.mockResolvedValue({
        id: "sm-return",
        type: "IN",
        sourceType: "RETURN",
      });

      prisma.$transaction.mockImplementation(async (callback) => {
        return callback({
          product: {
            update: jest.fn().mockResolvedValue({ id: "prod-1", stock: 8 }),
          },
        });
      });

      const result = await service.recordReturnIn("prod-1", 5, "user-1");

      expect(result.sourceType).toBe("RETURN");
      expect(mockStockRepo.createInTransaction).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          sourceType: "RETURN",
          note: "Retur barang dari pelanggan",
        })
      );
    });

    it("should use custom note when provided", async () => {
      mockProductRepo.findById.mockResolvedValue({
        id: "prod-1",
        name: "Ban",
        sku: "SP-GHI",
        type: "SPAREPART",
        stock: 3,
        cost: 25000,
        price: 45000,
      });
      
      mockStockRepo.createInTransaction.mockResolvedValue({
        id: "sm-return",
        type: "IN",
        sourceType: "RETURN",
      });

      prisma.$transaction.mockImplementation(async (callback) => {
        return callback({
          product: {
            update: jest.fn().mockResolvedValue({ id: "prod-1", stock: 8 }),
          },
        });
      });

      await service.recordReturnIn("prod-1", 5, "user-1", "Custom retur note");

      expect(mockStockRepo.createInTransaction).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          note: "Custom retur note",
        })
      );
    });
  });

  // ============================================================
  // recordAdjustment
  // ============================================================
  describe("recordAdjustment", () => {
    const productId = "prod-1";
    const recordedById = "user-1";
    const note = "Penyesuaian stok";
    
    const mockProduct = {
      id: productId,
      name: "Oli Gardan",
      sku: "SP-MNO",
      type: "SPAREPART",
      stock: 10,
      cost: 35000,
      price: 60000,
      isActive: true,
    };

    beforeEach(() => {
      mockProductRepo.findById.mockResolvedValue(mockProduct);
      mockStockRepo.createInTransaction.mockResolvedValue({
        id: "adj-1",
        type: "ADJUSTMENT",
        sourceType: "ADJUSTMENT",
        quantity: 5,
        recordedById,
        note,
      });

      prisma.$transaction.mockImplementation(async (callback) => {
        return callback({
          product: {
            update: jest.fn().mockResolvedValue({ ...mockProduct, stock: 15 }),
          },
        });
      });
    });

    it("should record positive adjustment successfully", async () => {
      const result = await service.recordAdjustment(productId, 5, recordedById, note);

      expect(result.quantity).toBe(5);
      expect(result.type).toBe("ADJUSTMENT");
      expect(logger.info).toHaveBeenCalledWith(
        "Penyesuaian stok berhasil dicatat",
        expect.objectContaining({
          productId,
          quantity: 5,
        })
      );
    });

    it("should record negative adjustment when stock sufficient", async () => {
      mockStockRepo.createInTransaction.mockResolvedValue({
        id: "adj-2",
        type: "ADJUSTMENT",
        quantity: -3,
      });

      prisma.$transaction.mockImplementation(async (callback) => {
        return callback({
          product: {
            update: jest.fn().mockResolvedValue({ ...mockProduct, stock: 7 }),
          },
        });
      });

      const result = await service.recordAdjustment(productId, -3, recordedById, note);

      expect(result.quantity).toBe(-3);
      expect(mockStockRepo.createInTransaction).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ quantity: -3 })
      );
    });

    it("should throw BadRequest when negative adjustment exceeds stock", async () => {
      mockProductRepo.findById.mockResolvedValue({ ...mockProduct, stock: 2 });

      await expect(
        service.recordAdjustment(productId, -5, recordedById, note)
      ).rejects.toThrow(ApiError);

      try {
        await service.recordAdjustment(productId, -5, recordedById, note);
      } catch (error) {
        expect(error.statusCode).toBe(400);
        expect(error.message).toContain("Stok produk 'Oli Gardan' tidak mencukupi");
      }
    });

    it("should throw NotFoundError when product not found", async () => {
      mockProductRepo.findById.mockResolvedValue(null);

      await expect(
        service.recordAdjustment(productId, 1, recordedById, note)
      ).rejects.toThrow(ApiError);

      try {
        await service.recordAdjustment(productId, 1, recordedById, note);
      } catch (error) {
        expect(error.statusCode).toBe(404);
      }
    });

    it("should throw BadRequest when product is SERVICE type", async () => {
      mockProductRepo.findById.mockResolvedValue({
        ...mockProduct,
        type: "SERVICE",
      });

      await expect(
        service.recordAdjustment(productId, 5, recordedById, note)
      ).rejects.toThrow(ApiError);

      try {
        await service.recordAdjustment(productId, 5, recordedById, note);
      } catch (error) {
        expect(error.statusCode).toBe(400);
        expect(error.message).toContain("adalah service, tidak memiliki stok");
      }
    });

    it("should send low stock notification for negative adjustment", async () => {
      mockProductRepo.findById.mockResolvedValue({ ...mockProduct, stock: 10 });
      
      prisma.$transaction.mockImplementation(async (callback) => {
        return callback({
          product: {
            update: jest.fn().mockResolvedValue({ ...mockProduct, stock: 2 }),
          },
        });
      });

      await service.recordAdjustment(productId, -8, recordedById, note);

      // Should notify about low stock
      expect(mockNotifRepo.create).toHaveBeenCalled();
    });

    it("should send stock restored notification for positive adjustment", async () => {
      // Previous stock was below threshold
      mockProductRepo.findById.mockResolvedValue({ ...mockProduct, stock: 2 });
      
      prisma.$transaction.mockImplementation(async (callback) => {
        return callback({
          product: {
            update: jest.fn().mockResolvedValue({ ...mockProduct, stock: 10 }),
          },
        });
      });

      await service.recordAdjustment(productId, 8, recordedById, note);

      // Should notify about stock restored
      expect(mockNotifRepo.create).toHaveBeenCalled();
    });
  });

  // ============================================================
  // getStockMovements
  // ============================================================
  describe("getStockMovements", () => {
    it("should return paginated stock movements with filters", async () => {
      const mockResult = {
        data: [
          { id: "sm1", type: "IN", quantity: 10 },
          { id: "sm2", type: "OUT", quantity: 3 },
        ],
        metadata: { total: 2, currentPage: 1, itemsPerPage: 10, totalPages: 1 },
      };
      mockStockRepo.findMany.mockResolvedValue(mockResult);

      const query = { page: 1, limit: 10, type: "IN" };
      const result = await service.getStockMovements(query);

      expect(result.data).toHaveLength(2);
      expect(result.metadata.total).toBe(2);
      expect(mockStockRepo.findMany).toHaveBeenCalledWith(query);
      expect(logger.info).toHaveBeenCalledWith(
        "Mengambil daftar mutasi stok",
        expect.objectContaining({
          total: 2,
          page: 1,
        })
      );
    });

    it("should handle empty results", async () => {
      const emptyResult = {
        data: [],
        metadata: { total: 0, currentPage: 1 },
      };
      mockStockRepo.findMany.mockResolvedValue(emptyResult);

      const result = await service.getStockMovements();

      expect(result.data).toEqual([]);
      expect(result.metadata.total).toBe(0);
    });
  });

  // ============================================================
  // getStockMovementById
  // ============================================================
  describe("getStockMovementById", () => {
    it("should return stock movement when found", async () => {
      const mockMovement = {
        id: "sm1",
        type: "IN",
        quantity: 10,
        product: { name: "Oli Mesin" },
      };
      mockStockRepo.findById.mockResolvedValue(mockMovement);

      const result = await service.getStockMovementById("sm1");

      expect(result).toEqual(mockMovement);
      expect(result.id).toBe("sm1");
    });

    it("should throw NotFoundError when movement not found", async () => {
      mockStockRepo.findById.mockResolvedValue(null);

      await expect(service.getStockMovementById("sm99")).rejects.toThrow(ApiError);

      try {
        await service.getStockMovementById("sm99");
      } catch (error) {
        expect(error.statusCode).toBe(404);
        expect(error.message).toContain("Mutasi stok dengan ID 'sm99' tidak ditemukan");
      }
    });
  });

  // ============================================================
  // getMovementsByProduct
  // ============================================================
  describe("getMovementsByProduct", () => {
    it("should return movements for valid product", async () => {
      mockProductRepo.findById.mockResolvedValue({
        id: "prod-1",
        name: "Oli Mesin",
      });
      
      const mockResult = {
        data: [
          { id: "sm1", type: "IN", quantity: 10 },
          { id: "sm2", type: "OUT", quantity: 3 },
        ],
        metadata: { total: 2 },
      };
      mockStockRepo.findByProductId.mockResolvedValue(mockResult);

      const result = await service.getMovementsByProduct("prod-1", { page: 1 });

      expect(result.data).toHaveLength(2);
      expect(mockStockRepo.findByProductId).toHaveBeenCalledWith("prod-1", { page: 1 });
    });

    it("should throw NotFoundError when product not found", async () => {
      mockProductRepo.findById.mockResolvedValue(null);

      await expect(
        service.getMovementsByProduct("bad-id")
      ).rejects.toThrow(ApiError);

      try {
        await service.getMovementsByProduct("bad-id");
      } catch (error) {
        expect(error.statusCode).toBe(404);
        expect(error.message).toContain("Produk dengan ID 'bad-id' tidak ditemukan");
      }
    });
  });

  // ============================================================
  // getMovementsByOrder
  // ============================================================
  describe("getMovementsByOrder", () => {
    it("should return movements for order", async () => {
      const mockMovements = [
        { id: "sm1", type: "OUT", orderItemId: "oi-1" },
        { id: "sm2", type: "OUT", orderItemId: "oi-2" },
      ];
      mockStockRepo.findByOrderId.mockResolvedValue(mockMovements);

      const result = await service.getMovementsByOrder("order-1");

      expect(result).toHaveLength(2);
      expect(result).toEqual(mockMovements);
      expect(mockStockRepo.findByOrderId).toHaveBeenCalledWith("order-1");
    });

    it("should return empty array when no movements", async () => {
      mockStockRepo.findByOrderId.mockResolvedValue([]);

      const result = await service.getMovementsByOrder("order-empty");

      expect(result).toEqual([]);
    });
  });

  // ============================================================
  // deleteStockMovement
  // ============================================================
  describe("deleteStockMovement", () => {
    it("should delete stock movement successfully", async () => {
      const mockMovement = {
        id: "sm-1",
        productId: "prod-1",
        type: "IN",
        quantity: 10,
      };
      mockStockRepo.findById.mockResolvedValue(mockMovement);
      mockStockRepo.delete.mockResolvedValue(undefined);

      await service.deleteStockMovement("sm-1");

      expect(mockStockRepo.findById).toHaveBeenCalledWith("sm-1");
      expect(mockStockRepo.delete).toHaveBeenCalledWith("sm-1");
      expect(logger.info).toHaveBeenCalledWith(
        "Mutasi stok berhasil dihapus",
        expect.objectContaining({
          movementId: "sm-1",
          productId: "prod-1",
          type: "IN",
          quantity: 10,
        })
      );
    });

    it("should throw NotFoundError when movement not found", async () => {
      mockStockRepo.findById.mockResolvedValue(null);

      await expect(service.deleteStockMovement("sm-99")).rejects.toThrow(ApiError);

      try {
        await service.deleteStockMovement("sm-99");
      } catch (error) {
        expect(error.statusCode).toBe(404);
        expect(error.message).toContain("Mutasi stok dengan ID 'sm-99' tidak ditemukan");
      }

      expect(mockStockRepo.delete).not.toHaveBeenCalled();
    });
  });

  // ============================================================
  // deleteStockMovements (Bulk)
  // ============================================================
  describe("deleteStockMovements", () => {
    it("should delete multiple stock movements successfully", async () => {
      mockStockRepo.findById
        .mockResolvedValueOnce({ id: "sm-1", productId: "p1" })
        .mockResolvedValueOnce({ id: "sm-2", productId: "p2" });
      
      mockStockRepo.deleteMany.mockResolvedValue({
        success: [{ id: "sm-1" }, { id: "sm-2" }],
        failed: [],
      });

      const result = await service.deleteStockMovements(["sm-1", "sm-2"], "user-1");

      expect(result.summary.total).toBe(2);
      expect(result.summary.deleted).toBe(2);
      expect(result.summary.failed).toBe(0);
      expect(mockStockRepo.deleteMany).toHaveBeenCalledWith(["sm-1", "sm-2"]);
      expect(logger.info).toHaveBeenCalledWith(
        "Bulk delete mutasi stok selesai",
        expect.objectContaining({
          userId: "user-1",
        })
      );
    });

    it("should throw BadRequest when movementIds is empty", async () => {
      await expect(service.deleteStockMovements([], "user-1")).rejects.toThrow(ApiError);

      try {
        await service.deleteStockMovements([], "user-1");
      } catch (error) {
        expect(error.statusCode).toBe(400);
        expect(error.message).toContain("Tidak ada mutasi stok yang dipilih");
      }
    });

    it("should throw BadRequest when movementIds is null", async () => {
      await expect(service.deleteStockMovements(null, "user-1")).rejects.toThrow(ApiError);
    });

    it("should skip non-existent movements", async () => {
      mockStockRepo.findById.mockResolvedValue(null);
      mockStockRepo.deleteMany.mockResolvedValue({
        success: [],
        failed: [],
      });

      await expect(
        service.deleteStockMovements(["sm-99", "sm-100"], "user-1")
      ).rejects.toThrow(ApiError);

      try {
        await service.deleteStockMovements(["sm-99", "sm-100"], "user-1");
      } catch (error) {
        expect(error.statusCode).toBe(400);
        expect(error.message).toContain("Tidak ada mutasi stok yang valid");
        expect(error.details).toHaveLength(2);
        expect(error.details[0].reason).toBe("Mutasi stok tidak ditemukan");
      }
    });

    it("should handle mixed scenarios (some valid, some skipped)", async () => {
      mockStockRepo.findById
        .mockResolvedValueOnce({ id: "sm-1" }) // Valid
        .mockResolvedValueOnce(null); // Not found - skipped
      
      mockStockRepo.deleteMany.mockResolvedValue({
        success: [{ id: "sm-1" }],
        failed: [],
      });

      const result = await service.deleteStockMovements(["sm-1", "sm-99"], "user-1");

      expect(result.summary.total).toBe(2);
      expect(result.summary.valid).toBe(1);
      expect(result.summary.skipped).toBe(1);
      expect(result.summary.deleted).toBe(1);
      expect(result.details.skipped[0].reason).toBe("Mutasi stok tidak ditemukan");
    });

    it("should handle partial failures from repository", async () => {
      mockStockRepo.findById.mockResolvedValue({ id: "sm-1" });
      mockStockRepo.deleteMany.mockResolvedValue({
        success: [{ id: "sm-1" }],
        failed: [{ id: "sm-2", reason: "Database error" }],
      });

      const result = await service.deleteStockMovements(["sm-1", "sm-2"], "user-1");

      expect(result.summary.deleted).toBe(1);
      expect(result.summary.failed).toBe(1);
      expect(result.details.failed).toHaveLength(1);
    });
  });
});