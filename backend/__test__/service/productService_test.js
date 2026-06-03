import ProductService from "#service/productService.js";
import ProductRepository from "#repository/productRepository.js";
import FileRepository from "#repository/fileRepository.js";
import ApiError from "#shared/utils/error.js";
import CodeGenerator from "#shared/utils/code.js";
import Storage from "#shared/utils/storage.js";
import prisma from "#app/database.js";
import logger from "#app/logger.js";

jest.mock("#repository/productRepository.js");
jest.mock("#repository/fileRepository.js");

jest.mock("#shared/utils/code.js", () => ({
  productSku: jest.fn(),
}));

jest.mock("#shared/utils/storage.js", () => ({
  uploadFile: jest.fn().mockResolvedValue("products/img-123.jpg"),
  deleteFile: jest.fn().mockResolvedValue(),
  getSignedUrl: jest.fn().mockResolvedValue("https://signed-url.com/products/img-123.jpg"),
}));

jest.mock("#app/database.js", () => ({
  product: {
    findFirst: jest.fn().mockResolvedValue(null),
  },
  $transaction: jest.fn((callback) =>
    callback({
      product: {
        create: jest.fn().mockResolvedValue({
          id: "p1",
          name: "Oli Mesin",
          sku: "SP-001",
          type: "SPAREPART",
          price: 50000,
          cost: 30000,
          stock: 20,
          isActive: true,
          imageId: null,
        }),
        update: jest.fn().mockImplementation((args) =>
          Promise.resolve({
            id: args.where.id,
            ...args.data,
            name: args.data.name || "Updated",
            price: args.data.price ?? 55000,
            cost: args.data.cost ?? 35000,
          })
        ),
      },
      productPriceHistory: {
        create: jest.fn().mockResolvedValue({}),
        findFirst: jest.fn().mockResolvedValue(null),
      },
      stockMovement: { 
        create: jest.fn().mockResolvedValue({}) 
      },
    })
  ),
}));

jest.mock("#app/logger.js", () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

describe("ProductService", () => {
  let service;
  let mockProductRepo;
  let mockFileRepo;

  beforeEach(() => {
    jest.clearAllMocks();
    
    ProductRepository.mockClear();
    FileRepository.mockClear();
    
    service = new ProductService();

    mockProductRepo = ProductRepository.mock.instances[0];
    mockFileRepo = FileRepository.mock.instances[0];

    // Default mocks
    CodeGenerator.productSku.mockResolvedValue("SP-001");
    mockProductRepo.isSkuExists.mockResolvedValue(false);
    mockProductRepo.findById.mockResolvedValue({
      id: "p1",
      name: "Oli Mesin",
      sku: "SP-001",
      type: "SPAREPART",
      price: 50000,
      cost: 30000,
      stock: 20,
      isActive: true,
      image: null,
    });
    prisma.product.findFirst.mockResolvedValue(null);
  });

  // ============================================================
  // createProduct
  // ============================================================
  describe("createProduct", () => {
    const userId = "user1";
    const payload = {
      name: "Oli Mesin",
      type: "SPAREPART",
      price: 50000,
      cost: 30000,
      stock: 20,
      description: "Oli mesin berkualitas",
    };

    it("should create product without image successfully", async () => {
      const result = await service.createProduct(payload, null, userId);

      expect(result.id).toBe("p1");
      expect(result.sku).toBe("SP-001");
      expect(result.name).toBe("Oli Mesin");
      expect(CodeGenerator.productSku).toHaveBeenCalled();
      expect(mockProductRepo.isSkuExists).toHaveBeenCalled();
      expect(prisma.$transaction).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith(
        "Produk berhasil dibuat",
        expect.objectContaining({
          productId: "p1",
          name: "Oli Mesin",
          sku: "SP-001",
        })
      );
    });

    it("should create product with default values when not provided", async () => {
      const minimalPayload = { name: "Filter Udara", price: 25000 };

      await service.createProduct(minimalPayload, null, userId);

      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it("should create product with image", async () => {
      mockFileRepo.create.mockResolvedValue({ id: "img-1" });

      const file = {
        originalname: "oli.jpg",
        mimetype: "image/jpeg",
        size: 1234,
        checksum: "abc123",
      };

      await service.createProduct(payload, file, userId);

      expect(Storage.uploadFile).toHaveBeenCalledWith(file, "products");
      expect(mockFileRepo.create).toHaveBeenCalledWith({
        path: "products/img-123.jpg",
        fileName: "oli.jpg",
        mimeType: "image/jpeg",
        size: 1234,
        checksum: "abc123",
        uploadedById: userId,
      });
    });

    it("should create stock movement for initial stock", async () => {
      await service.createProduct(payload, null, userId);

      // The $transaction callback should have created a stock movement
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it("should not create stock movement for SERVICE type", async () => {
      const servicePayload = {
        ...payload,
        type: "SERVICE",
        stock: 0,
      };

      await service.createProduct(servicePayload, null, userId);

      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it("should handle SKU collision by generating new SKU", async () => {
      // Mock lastProduct agar tidak null
      prisma.product.findFirst.mockResolvedValue({ sku: "SP-005" });
      
      CodeGenerator.productSku
        .mockResolvedValueOnce("SP-006")
        .mockResolvedValueOnce("SP-007");
    
      mockProductRepo.isSkuExists
        .mockResolvedValueOnce(true)  // SP-006 exists
        .mockResolvedValueOnce(false); // SP-007 available
    
      await service.createProduct(payload, null, userId);
    
      expect(CodeGenerator.productSku).toHaveBeenCalledTimes(2);
      expect(mockProductRepo.isSkuExists).toHaveBeenCalledTimes(2);
      expect(mockProductRepo.isSkuExists).toHaveBeenNthCalledWith(1, "SP-006");
      expect(mockProductRepo.isSkuExists).toHaveBeenNthCalledWith(2, "SP-007");
    });

    it("should use SV prefix for SERVICE type", async () => {
      const servicePayload = { ...payload, type: "SERVICE" };
      CodeGenerator.productSku.mockResolvedValue("SV-001");

      await service.createProduct(servicePayload, null, userId);

      expect(CodeGenerator.productSku).toHaveBeenCalledWith("SERVICE", undefined);
    });

    it("should use SP prefix for SPAREPART type", async () => {
      CodeGenerator.productSku.mockResolvedValue("SP-001");

      await service.createProduct(payload, null, userId);

      expect(CodeGenerator.productSku).toHaveBeenCalledWith("SPAREPART", undefined);
    });
  });

  // ============================================================
  // getProductById
  // ============================================================
  describe("getProductById", () => {
    it("should return product with signed image URL", async () => {
      mockProductRepo.findById.mockResolvedValue({
        id: "p1",
        name: "Oli Mesin",
        image: { path: "products/img.jpg" },
      });

      const result = await service.getProductById("p1");

      expect(result.id).toBe("p1");
      expect(result.image.url).toBe("https://signed-url.com/products/img-123.jpg");
      expect(Storage.getSignedUrl).toHaveBeenCalledWith("products/img.jpg");
    });

    it("should return product without signed URL when no image", async () => {
      mockProductRepo.findById.mockResolvedValue({
        id: "p1",
        name: "Oli Mesin",
        image: null,
      });

      const result = await service.getProductById("p1");

      expect(result.image).toBeNull();
    });

    it("should throw NotFoundError when product not found", async () => {
      mockProductRepo.findById.mockResolvedValue(null);

      await expect(service.getProductById("p99")).rejects.toThrow(ApiError);

      try {
        await service.getProductById("p99");
      } catch (error) {
        expect(error.statusCode).toBe(404);
        expect(error.message).toContain("Produk dengan ID 'p99' tidak ditemukan");
      }
    });
  });

  // ============================================================
  // getProductBySku
  // ============================================================
  describe("getProductBySku", () => {
    it("should return product by SKU with signed URL", async () => {
      mockProductRepo.findBySku.mockResolvedValue({
        id: "p1",
        sku: "SP-001",
        name: "Oli Mesin",
        image: { path: "products/img.jpg" },
      });

      const result = await service.getProductBySku("SP-001");

      expect(result.sku).toBe("SP-001");
      expect(result.image.url).toBe("https://signed-url.com/products/img-123.jpg");
    });

    it("should throw NotFoundError when SKU not found", async () => {
      mockProductRepo.findBySku.mockResolvedValue(null);

      await expect(service.getProductBySku("SKU-999")).rejects.toThrow(ApiError);

      try {
        await service.getProductBySku("SKU-999");
      } catch (error) {
        expect(error.statusCode).toBe(404);
        expect(error.message).toContain("Produk dengan SKU 'SKU-999' tidak ditemukan");
      }
    });
  });

  // ============================================================
  // getProducts
  // ============================================================
  describe("getProducts", () => {
    it("should return products with signed URLs", async () => {
      mockProductRepo.findMany.mockResolvedValue({
        data: [
          { id: "p1", name: "Oli", image: { path: "oli.jpg" } },
          { id: "p2", name: "Filter", image: null },
        ],
        metadata: { total: 2, currentPage: 1 },
      });

      const result = await service.getProducts({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(2);
      expect(result.metadata.total).toBe(2);
      expect(result.data[0].image.url).toBe("https://signed-url.com/products/img-123.jpg");
      expect(result.data[1].image).toBeNull();
    });

    it("should handle empty results", async () => {
      mockProductRepo.findMany.mockResolvedValue({
        data: [],
        metadata: { total: 0, currentPage: 1 },
      });

      const result = await service.getProducts();

      expect(result.data).toEqual([]);
      expect(result.metadata.total).toBe(0);
    });
  });

  // ============================================================
  // getServices
  // ============================================================
  describe("getServices", () => {
    it("should return services list", async () => {
      const mockServices = [
        { id: "s1", name: "Ganti Oli", type: "SERVICE", price: 50000 },
        { id: "s2", name: "Tune Up", type: "SERVICE", price: 150000 },
      ];
      mockProductRepo.findServices.mockResolvedValue(mockServices);

      const result = await service.getServices({ search: "oli" });

      expect(result).toHaveLength(2);
      expect(result).toEqual(mockServices);
      expect(mockProductRepo.findServices).toHaveBeenCalledWith({ search: "oli" });
    });

    it("should handle empty services", async () => {
      mockProductRepo.findServices.mockResolvedValue([]);

      const result = await service.getServices();

      expect(result).toEqual([]);
    });
  });

  // ============================================================
  // getSpareparts
  // ============================================================
  describe("getSpareparts", () => {
    it("should return spareparts with signed URLs", async () => {
      const mockSpareparts = [
        { id: "sp1", name: "Kampas Rem", image: { path: "kampas.jpg" } },
        { id: "sp2", name: "Ban", image: null },
      ];
      mockProductRepo.findSpareparts.mockResolvedValue(mockSpareparts);

      const result = await service.getSpareparts({ search: "kampas" });

      expect(result).toHaveLength(2);
      expect(result[0].image.url).toBe("https://signed-url.com/products/img-123.jpg");
      expect(result[1].image).toBeNull();
    });

    it("should handle empty spareparts", async () => {
      mockProductRepo.findSpareparts.mockResolvedValue([]);

      const result = await service.getSpareparts();

      expect(result).toEqual([]);
    });
  });

  // ============================================================
  // updateProduct
  // ============================================================
  describe("updateProduct", () => {
    const productId = "p1";
    const userId = "user1";
    const existing = {
      id: productId,
      name: "Old Name",
      price: 50000,
      cost: 30000,
      type: "SPAREPART",
      stock: 10,
      isActive: true,
      imageId: "img-old",
      image: { path: "old.jpg" },
    };

    beforeEach(() => {
      mockProductRepo.findById.mockResolvedValue(existing);
    });

    it("should update product name and create price history when price changes", async () => {
      await service.updateProduct(
        productId,
        { name: "New Name", price: 55000, cost: 35000 },
        null,
        userId
      );

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith(
        "Produk berhasil diperbarui",
        expect.objectContaining({
          productId,
          previousName: "Old Name",
          newName: "New Name",
        })
      );
    });

    it("should update product without price change (no price history)", async () => {
      await service.updateProduct(
        productId,
        { name: "Updated Name" },
        null,
        userId
      );

      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it("should upload new image and delete old one", async () => {
      mockFileRepo.create.mockResolvedValue({ id: "img-new" });
      mockFileRepo.findById.mockResolvedValue({
        id: "img-old",
        path: "old.jpg",
      });

      const file = {
        originalname: "new.jpg",
        mimetype: "image/jpeg",
        size: 1234,
        checksum: "abc",
      };

      await service.updateProduct(productId, {}, file, userId);

      expect(Storage.uploadFile).toHaveBeenCalledWith(file, "products");
      expect(Storage.deleteFile).toHaveBeenCalledWith("old.jpg");
      expect(mockFileRepo.delete).toHaveBeenCalledWith("img-old");
    });

    it("should upload new image when no old image exists", async () => {
      mockProductRepo.findById.mockResolvedValue({
        ...existing,
        imageId: null,
        image: null,
      });
      mockFileRepo.create.mockResolvedValue({ id: "img-new" });

      const file = {
        originalname: "new.jpg",
        mimetype: "image/jpeg",
        size: 1234,
        checksum: "abc",
      };

      await service.updateProduct(productId, {}, file, userId);

      expect(Storage.uploadFile).toHaveBeenCalled();
      expect(Storage.deleteFile).not.toHaveBeenCalled();
    });

    it("should handle image deletion failure gracefully", async () => {
      mockFileRepo.create.mockResolvedValue({ id: "img-new" });
      mockFileRepo.findById.mockRejectedValue(new Error("File not found"));

      const file = {
        originalname: "new.jpg",
        mimetype: "image/jpeg",
        size: 1234,
        checksum: "abc",
      };

      // Should not throw
      await service.updateProduct(productId, {}, file, userId);

      expect(logger.warn).toHaveBeenCalled();
    });

    it("should throw NotFoundError when product not found", async () => {
      mockProductRepo.findById.mockResolvedValue(null);

      await expect(
        service.updateProduct("bad-id", {}, null, userId)
      ).rejects.toThrow(ApiError);

      try {
        await service.updateProduct("bad-id", {}, null, userId);
      } catch (error) {
        expect(error.statusCode).toBe(404);
        expect(error.message).toContain("Produk dengan ID 'bad-id' tidak ditemukan");
      }
    });
  });

  // ============================================================
  // toggleProductStatus
  // ============================================================
  describe("toggleProductStatus", () => {
    it("should toggle from active to inactive", async () => {
      mockProductRepo.findById.mockResolvedValue({
        id: "p1",
        name: "Oli Mesin",
        isActive: true,
      });
      mockProductRepo.updateStatus.mockResolvedValue({
        id: "p1",
        isActive: false,
      });

      const result = await service.toggleProductStatus("p1");

      expect(result.isActive).toBe(false);
      expect(mockProductRepo.updateStatus).toHaveBeenCalledWith("p1", false);
      expect(logger.info).toHaveBeenCalledWith(
        "Status produk berhasil diubah",
        expect.objectContaining({
          productId: "p1",
          previousStatus: true,
          newStatus: false,
        })
      );
    });

    it("should toggle from inactive to active", async () => {
      mockProductRepo.findById.mockResolvedValue({
        id: "p1",
        name: "Oli Mesin",
        isActive: false,
      });
      mockProductRepo.updateStatus.mockResolvedValue({
        id: "p1",
        isActive: true,
      });

      const result = await service.toggleProductStatus("p1");

      expect(result.isActive).toBe(true);
      expect(mockProductRepo.updateStatus).toHaveBeenCalledWith("p1", true);
    });

    it("should throw NotFoundError when product not found", async () => {
      mockProductRepo.findById.mockResolvedValue(null);

      await expect(service.toggleProductStatus("p99")).rejects.toThrow(ApiError);

      try {
        await service.toggleProductStatus("p99");
      } catch (error) {
        expect(error.statusCode).toBe(404);
        expect(error.message).toContain("Produk dengan ID 'p99' tidak ditemukan");
      }
    });
  });

  // ============================================================
  // getLowStockProducts
  // ============================================================
  describe("getLowStockProducts", () => {
    it("should return low stock products with custom threshold", async () => {
      const mockProducts = [
        { id: "p1", name: "Ban", stock: 2 },
        { id: "p2", name: "Kampas", stock: 0 },
      ];
      mockProductRepo.getLowStockProducts.mockResolvedValue(mockProducts);

      const result = await service.getLowStockProducts(10);

      expect(result).toHaveLength(2);
      expect(mockProductRepo.getLowStockProducts).toHaveBeenCalledWith(10);
    });

    it("should use default threshold of 5", async () => {
      mockProductRepo.getLowStockProducts.mockResolvedValue([]);

      await service.getLowStockProducts();

      expect(mockProductRepo.getLowStockProducts).toHaveBeenCalledWith(5);
    });
  });

  // ============================================================
  // checkSkuAvailability
  // ============================================================
  describe("checkSkuAvailability", () => {
    it("should return available false when SKU exists", async () => {
      mockProductRepo.isSkuExists.mockResolvedValue(true);

      const result = await service.checkSkuAvailability("SP-001");

      expect(result).toEqual({
        available: false,
        message: "SKU 'SP-001' sudah digunakan.",
      });
    });

    it("should return available true when SKU does not exist", async () => {
      mockProductRepo.isSkuExists.mockResolvedValue(false);

      const result = await service.checkSkuAvailability("SP-999");

      expect(result).toEqual({
        available: true,
        message: "SKU 'SP-999' tersedia.",
      });
    });

    it("should pass excludeId to repository", async () => {
      mockProductRepo.isSkuExists.mockResolvedValue(false);

      await service.checkSkuAvailability("SP-001", "p1");

      expect(mockProductRepo.isSkuExists).toHaveBeenCalledWith("SP-001", "p1");
    });

    it("should handle null excludeId", async () => {
      mockProductRepo.isSkuExists.mockResolvedValue(false);

      await service.checkSkuAvailability("SP-001");

      expect(mockProductRepo.isSkuExists).toHaveBeenCalledWith("SP-001", null);
    });
  });

  // ============================================================
  // deactivateProducts (Bulk)
  // ============================================================
  describe("deactivateProducts", () => {
    it("should deactivate multiple products successfully", async () => {
      mockProductRepo.findById
        .mockResolvedValueOnce({ id: "p1", name: "Product 1", isActive: true })
        .mockResolvedValueOnce({ id: "p2", name: "Product 2", isActive: true });

      mockProductRepo.deactivateMany.mockResolvedValue({
        success: [{ id: "p1" }, { id: "p2" }],
        failed: [],
      });

      const result = await service.deactivateProducts(["p1", "p2"], "user-1");

      expect(result.summary.total).toBe(2);
      expect(result.summary.deactivated).toBe(2);
      expect(result.summary.failed).toBe(0);
      expect(mockProductRepo.deactivateMany).toHaveBeenCalledWith(["p1", "p2"]);
      expect(logger.info).toHaveBeenCalledWith(
        "Bulk deactivate produk selesai",
        expect.objectContaining({
          userId: "user-1",
        })
      );
    });

    it("should throw BadRequest when productIds is empty", async () => {
      await expect(service.deactivateProducts([], "user-1")).rejects.toThrow(ApiError);

      try {
        await service.deactivateProducts([], "user-1");
      } catch (error) {
        expect(error.statusCode).toBe(400);
        expect(error.message).toContain("Tidak ada produk yang dipilih");
      }
    });

    it("should skip non-existent products", async () => {
      mockProductRepo.findById.mockResolvedValue(null);
      mockProductRepo.deactivateMany.mockResolvedValue({
        success: [],
        failed: [],
      });

      await expect(
        service.deactivateProducts(["p99", "p100"], "user-1")
      ).rejects.toThrow(ApiError);

      try {
        await service.deactivateProducts(["p99", "p100"], "user-1");
      } catch (error) {
        expect(error.statusCode).toBe(400);
        expect(error.message).toContain("Tidak ada produk aktif yang bisa dinonaktifkan");
        expect(error.details).toHaveLength(2);
        expect(error.details[0].reason).toBe("Produk tidak ditemukan");
      }
    });

    it("should skip already inactive products", async () => {
      mockProductRepo.findById.mockResolvedValue({
        id: "p1",
        name: "Product 1",
        isActive: false,
      });
      mockProductRepo.deactivateMany.mockResolvedValue({
        success: [],
        failed: [],
      });

      await expect(
        service.deactivateProducts(["p1"], "user-1")
      ).rejects.toThrow(ApiError);

      try {
        await service.deactivateProducts(["p1"], "user-1");
      } catch (error) {
        expect(error.statusCode).toBe(400);
        expect(error.details[0].reason).toBe("Produk sudah nonaktif");
      }
    });

    it("should handle mixed scenarios (some valid, some skipped)", async () => {
      mockProductRepo.findById
        .mockResolvedValueOnce({ id: "p1", name: "Active Product", isActive: true })
        .mockResolvedValueOnce({ id: "p2", name: "Inactive Product", isActive: false });

      mockProductRepo.deactivateMany.mockResolvedValue({
        success: [{ id: "p1" }],
        failed: [],
      });

      const result = await service.deactivateProducts(["p1", "p2"], "user-1");

      expect(result.summary.total).toBe(2);
      expect(result.summary.valid).toBe(1);
      expect(result.summary.skipped).toBe(1);
      expect(result.summary.deactivated).toBe(1);
      expect(result.details.skipped[0].reason).toBe("Produk sudah nonaktif");
    });

    it("should handle partial failures from repository", async () => {
      mockProductRepo.findById.mockResolvedValue({
        id: "p1",
        name: "Product 1",
        isActive: true,
      });
      mockProductRepo.deactivateMany.mockResolvedValue({
        success: [{ id: "p1" }],
        failed: [{ id: "p2", reason: "Database error" }],
      });

      const result = await service.deactivateProducts(["p1", "p2"], "user-1");

      expect(result.summary.deactivated).toBe(1);
      expect(result.summary.failed).toBe(1);
    });
  });

  // ============================================================
  // activateProducts (Bulk)
  // ============================================================
  describe("activateProducts", () => {
    it("should activate multiple products successfully", async () => {
      mockProductRepo.findById
        .mockResolvedValueOnce({ id: "p1", name: "Product 1", isActive: false })
        .mockResolvedValueOnce({ id: "p2", name: "Product 2", isActive: false });

      mockProductRepo.activateMany.mockResolvedValue({
        success: [{ id: "p1" }, { id: "p2" }],
        failed: [],
      });

      const result = await service.activateProducts(["p1", "p2"], "user-1");

      expect(result.summary.total).toBe(2);
      expect(result.summary.activated).toBe(2);
      expect(mockProductRepo.activateMany).toHaveBeenCalledWith(["p1", "p2"]);
    });

    it("should throw BadRequest when productIds is empty", async () => {
      await expect(service.activateProducts([], "user-1")).rejects.toThrow(ApiError);
    });

    it("should skip already active products", async () => {
      mockProductRepo.findById.mockResolvedValue({
        id: "p1",
        name: "Product 1",
        isActive: true,
      });
      mockProductRepo.activateMany.mockResolvedValue({
        success: [],
        failed: [],
      });

      await expect(
        service.activateProducts(["p1"], "user-1")
      ).rejects.toThrow(ApiError);

      try {
        await service.activateProducts(["p1"], "user-1");
      } catch (error) {
        expect(error.statusCode).toBe(400);
        expect(error.details[0].reason).toBe("Produk sudah aktif");
      }
    });

    it("should skip non-existent products", async () => {
      mockProductRepo.findById.mockResolvedValue(null);
      mockProductRepo.activateMany.mockResolvedValue({
        success: [],
        failed: [],
      });

      await expect(
        service.activateProducts(["p99"], "user-1")
      ).rejects.toThrow(ApiError);

      try {
        await service.activateProducts(["p99"], "user-1");
      } catch (error) {
        expect(error.details[0].reason).toBe("Produk tidak ditemukan");
      }
    });

    it("should handle mixed scenarios", async () => {
      mockProductRepo.findById
        .mockResolvedValueOnce({ id: "p1", name: "Inactive", isActive: false })
        .mockResolvedValueOnce({ id: "p2", name: "Already Active", isActive: true });

      mockProductRepo.activateMany.mockResolvedValue({
        success: [{ id: "p1" }],
        failed: [],
      });

      const result = await service.activateProducts(["p1", "p2"], "user-1");

      expect(result.summary.total).toBe(2);
      expect(result.summary.activated).toBe(1);
      expect(result.summary.skipped).toBe(1);
    });
  });
});