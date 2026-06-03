import prisma from "#app/database.js";
import ProductRepository from "#repository/productRepository.js";

jest.mock("#app/database.js", () => ({
  product: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  productPriceHistory: {
    create: jest.fn(),
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
 * Unit test untuk ProductRepository
 * @describe ProductRepository
 */
describe("ProductRepository", () => {
  let repo;

  beforeEach(() => {
    jest.clearAllMocks();
    repo = new ProductRepository();
  });

  describe("create", () => {
    it("should create a product with all fields", async () => {
      const input = {
        name: "Oli Mesin Motul",
        sku: "SP-OLI-001",
        type: "SPAREPART",
        description: "Oli mesin berkualitas tinggi",
        price: 150000,
        cost: 100000,
        stock: 50,
        imageId: "file-1",
      };

      const expected = {
        id: "prod-1",
        name: "Oli Mesin Motul",
        sku: "SP-OLI-001",
        type: "SPAREPART",
        price: 150000,
        cost: 100000,
        stock: 50,
        isActive: true,
        image: { id: "file-1", path: "products/oli.jpg" },
        priceHistory: [],
      };

      prisma.product.create.mockResolvedValue(expected);

      const result = await repo.create(input);

      expect(result).toEqual(expected);
      expect(prisma.product.create).toHaveBeenCalledWith({
        data: {
          name: "Oli Mesin Motul",
          sku: "SP-OLI-001",
          type: "SPAREPART",
          description: "Oli mesin berkualitas tinggi",
          price: 150000,
          cost: 100000,
          stock: 50,
          isActive: true,
          imageId: "file-1",
        },
        select: expect.objectContaining({
          id: true,
          name: true,
          sku: true,
          image: expect.any(Object),
          priceHistory: expect.any(Object),
        }),
      });
    });

    it("should create a product with default values", async () => {
      const input = { name: "Service Ringan", sku: "SV-SVC-001", price: 75000 };

      prisma.product.create.mockResolvedValue({});

      await repo.create(input);

      expect(prisma.product.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: "SPAREPART",
          cost: 0,
          stock: 0,
          isActive: true,
          imageId: undefined,
        }),
        select: expect.any(Object),
      });
    });
  });

  describe("findById", () => {
    it("should return full product with image and price history", async () => {
      const mockProduct = {
        id: "prod-1",
        name: "Oli Mesin",
        sku: "SP-OLI-001",
        type: "SPAREPART",
        price: 150000,
        cost: 100000,
        stock: 50,
        isActive: true,
        image: { id: "file-1", path: "products/oli.jpg" },
        priceHistory: [
          { id: "ph-1", price: 150000, cost: 100000, effectiveFrom: new Date() },
        ],
      };

      prisma.product.findUnique.mockResolvedValue(mockProduct);

      const result = await repo.findById("prod-1");

      expect(result).toEqual(mockProduct);
      expect(prisma.product.findUnique).toHaveBeenCalledWith({
        where: { id: "prod-1" },
        select: expect.objectContaining({
          image: expect.any(Object),
          priceHistory: expect.any(Object),
        }),
      });
    });

    it("should return null when product not found", async () => {
      prisma.product.findUnique.mockResolvedValue(null);

      const result = await repo.findById("prod-99");

      expect(result).toBeNull();
    });
  });

  describe("findBySku", () => {
    it("should return product by SKU", async () => {
      const mockProduct = {
        id: "prod-1",
        name: "Oli Mesin",
        sku: "SP-OLI-001",
        type: "SPAREPART",
        price: 150000,
        cost: 100000,
        stock: 50,
        isActive: true,
        image: null,
        priceHistory: [],
      };

      prisma.product.findUnique.mockResolvedValue(mockProduct);

      const result = await repo.findBySku("SP-OLI-001");

      expect(result).toEqual(mockProduct);
    });

    it("should return null when SKU not found", async () => {
      prisma.product.findUnique.mockResolvedValue(null);

      const result = await repo.findBySku("SKU-NOT-FOUND");

      expect(result).toBeNull();
    });
  });

  describe("findMany", () => {
    it("should return products with default pagination", async () => {
      const mockData = [
        {
          id: "prod-1",
          name: "Oli Mesin",
          sku: "SP-OLI-001",
          type: "SPAREPART",
          price: 150000,
          cost: 100000,
          stock: 50,
          isActive: true,
          createdAt: new Date(),
          image: { id: "file-1", path: "products/oli.jpg" },
        },
      ];

      prisma.product.count.mockResolvedValue(1);
      prisma.product.findMany.mockResolvedValue(mockData);

      const result = await repo.findMany({});

      expect(result.data).toEqual(mockData);
      expect(result.data).toHaveLength(1);
      expect(result.metadata.total).toBe(1);
    });

    it("should return products filtered by search", async () => {
      prisma.product.count.mockResolvedValue(3);
      prisma.product.findMany.mockResolvedValue([]);

      await repo.findMany({ search: "Oli" });

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { name: { contains: "Oli", mode: "insensitive" } },
              { sku: { contains: "Oli", mode: "insensitive" } },
            ],
          },
        })
      );
    });

    it("should return products filtered by type", async () => {
      prisma.product.count.mockResolvedValue(5);
      prisma.product.findMany.mockResolvedValue([]);

      await repo.findMany({ type: "SERVICE" });

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { type: "SERVICE" } })
      );
    });

    it("should return low stock products", async () => {
      prisma.product.count.mockResolvedValue(4);
      prisma.product.findMany.mockResolvedValue([]);

      await repo.findMany({ lowStockThreshold: "5" });

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { type: "SPAREPART", stock: { lte: 5 } },
        })
      );
    });

    it("should return products with custom sorting", async () => {
      prisma.product.count.mockResolvedValue(8);
      prisma.product.findMany.mockResolvedValue([]);

      await repo.findMany({ sortBy: "price", sortOrder: "asc" });

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { price: "asc" } })
      );
    });

    it("should ignore invalid sort field and use default", async () => {
      prisma.product.count.mockResolvedValue(0);
      prisma.product.findMany.mockResolvedValue([]);

      await repo.findMany({ sortBy: "invalidField", sortOrder: "asc" });

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { createdAt: "asc" } })
      );
    });

    it("should return empty array when no products", async () => {
      prisma.product.count.mockResolvedValue(0);
      prisma.product.findMany.mockResolvedValue([]);

      const result = await repo.findMany({});

      expect(result.data).toEqual([]);
      expect(result.metadata.total).toBe(0);
    });
  });

  describe("update", () => {
    it("should update a product with given data", async () => {
      const updateData = { name: "Oli Updated", price: 175000 };
      const expected = { id: "prod-1", name: "Oli Updated", sku: "SP-OLI-001", price: 175000 };

      prisma.product.update.mockResolvedValue(expected);

      const result = await repo.update("prod-1", updateData);

      expect(result).toEqual(expected);
      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: "prod-1" },
        data: updateData,
        select: expect.objectContaining({
          image: expect.any(Object),
          priceHistory: expect.any(Object),
        }),
      });
    });
  });

  describe("updateStatus", () => {
    it("should update product active status", async () => {
      const expected = { id: "prod-1", isActive: false };

      prisma.product.update.mockResolvedValue(expected);

      const result = await repo.updateStatus("prod-1", false);

      expect(result.isActive).toBe(false);
    });
  });

  describe("deactivate", () => {
    it("should deactivate a product", async () => {
      prisma.product.update.mockResolvedValue({ isActive: false });

      const result = await repo.deactivate("prod-1");

      expect(result.isActive).toBe(false);
    });
  });

  describe("activate", () => {
    it("should activate a product", async () => {
      prisma.product.update.mockResolvedValue({ isActive: true });

      const result = await repo.activate("prod-1");

      expect(result.isActive).toBe(true);
    });
  });

  describe("updateStock", () => {
    it("should increment product stock", async () => {
      prisma.product.update.mockResolvedValue({ stock: 60 });

      await repo.updateStock("prod-1", 10, true);

      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: "prod-1" },
        data: { stock: { increment: 10 } },
        select: { id: true, name: true, sku: true, stock: true, updatedAt: true },
      });
    });

    it("should decrement product stock", async () => {
      prisma.product.update.mockResolvedValue({ stock: 40 });

      await repo.updateStock("prod-1", 10, false);

      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: "prod-1" },
        data: { stock: { decrement: 10 } },
        select: expect.any(Object),
      });
    });
  });

  describe("isSkuExists", () => {
    it("should return true when SKU exists", async () => {
      prisma.product.findFirst.mockResolvedValue({ id: "prod-1" });

      const result = await repo.isSkuExists("SP-OLI-001");

      expect(result).toBe(true);
    });

    it("should return false when SKU does not exist", async () => {
      prisma.product.findFirst.mockResolvedValue(null);

      const result = await repo.isSkuExists("SKU-NEW");

      expect(result).toBe(false);
    });

    it("should exclude specific ID when checking", async () => {
      prisma.product.findFirst.mockResolvedValue(null);

      await repo.isSkuExists("SP-OLI-001", "prod-1");

      expect(prisma.product.findFirst).toHaveBeenCalledWith({
        where: { sku: "SP-OLI-001", id: { not: "prod-1" } },
        select: { id: true },
      });
    });
  });

  describe("getLowStockProducts", () => {
    it("should return low stock products with default threshold", async () => {
      const mockProducts = [
        { id: "prod-1", name: "Oli", sku: "SP-001", stock: 3, price: 150000, cost: 100000 },
      ];

      prisma.product.findMany.mockResolvedValue(mockProducts);

      const result = await repo.getLowStockProducts();

      expect(result).toEqual(mockProducts);
    });

    it("should return low stock products with custom threshold", async () => {
      prisma.product.findMany.mockResolvedValue([]);

      await repo.getLowStockProducts(10);

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ stock: { lte: 10 } }) })
      );
    });
  });

  describe("createPriceHistory", () => {
    it("should create a price history record", async () => {
      prisma.productPriceHistory.create.mockResolvedValue({});

      await repo.createPriceHistory("prod-1", 175000, 120000);

      expect(prisma.productPriceHistory.create).toHaveBeenCalledWith({
        data: {
          productId: "prod-1",
          price: 175000,
          cost: 120000,
          effectiveFrom: expect.any(Date),
        },
      });
    });
  });

  describe("findServices", () => {
    it("should return active service products", async () => {
      const mockServices = [
        { id: "svc-1", name: "Ganti Oli", description: "Ganti oli mesin", price: 75000, cost: 30000 },
      ];

      prisma.product.findMany.mockResolvedValue(mockServices);

      const result = await repo.findServices({});

      expect(result).toEqual(mockServices);
    });
  });

  describe("findSpareparts", () => {
    it("should return active sparepart products", async () => {
      const mockSpareparts = [
        { id: "sp-1", name: "Oli Mesin", sku: "SP-001", price: 150000, cost: 100000, stock: 50, image: { id: "file-1", path: "products/oli.jpg" } },
      ];

      prisma.product.findMany.mockResolvedValue(mockSpareparts);

      const result = await repo.findSpareparts({});

      expect(result).toEqual(mockSpareparts);
    });

    it("should return only in-stock spareparts", async () => {
      prisma.product.findMany.mockResolvedValue([]);

      await repo.findSpareparts({ inStockOnly: true });

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { type: "SPAREPART", isActive: true, stock: { gt: 0 } } })
      );
    });
  });
});