import prisma from "#app/database.js";
import VehicleRepository from "#repository/vehicleRepository.js";

jest.mock("#app/database.js", () => ({
  vehicle: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  customer: {
    count: jest.fn(),
    findMany: jest.fn(),
  },
  order: {
    count: jest.fn(),
    aggregate: jest.fn(),
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
 * Unit test untuk VehicleRepository
 * @describe VehicleRepository
 */
describe("VehicleRepository", () => {
  let repo;

  beforeEach(() => {
    jest.clearAllMocks();
    repo = new VehicleRepository();
  });

  describe("create", () => {
    it("should create a vehicle with all fields", async () => {
      const input = {
        plateNumber: "B 1234 CD",
        customerId: "cust-1",
        brand: "Vespa",
        model: "Sprint 150",
      };

      const expected = {
        id: "veh-1",
        plateNumber: "B 1234 CD",
        brand: "Vespa",
        model: "Sprint 150",
        customer: { id: "cust-1", name: "Budi", phone: "0812" },
        orders: [],
        _count: { orders: 0 },
      };

      prisma.vehicle.create.mockResolvedValue(expected);

      const result = await repo.create(input);

      expect(result).toEqual(expected);
    });

    it("should create a vehicle with null brand and model", async () => {
      const input = { plateNumber: "B 5678 EF", customerId: "cust-2" };

      prisma.vehicle.create.mockResolvedValue({});

      await repo.create(input);

      expect(prisma.vehicle.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ brand: null, model: null }),
        select: expect.any(Object),
      });
    });
  });

  describe("findById", () => {
    it("should return full vehicle with customer and orders", async () => {
      const mockVehicle = {
        id: "veh-1",
        plateNumber: "B 1234 CD",
        brand: "Vespa",
        model: "Sprint 150",
        customer: { id: "cust-1", name: "Budi", phone: "0812" },
        orders: [],
        _count: { orders: 0 },
      };

      prisma.vehicle.findUnique.mockResolvedValue(mockVehicle);

      const result = await repo.findById("veh-1");

      expect(result).toEqual(mockVehicle);
    });

    it("should return null when not found", async () => {
      prisma.vehicle.findUnique.mockResolvedValue(null);

      const result = await repo.findById("veh-99");

      expect(result).toBeNull();
    });
  });

  describe("findByPlateNumber", () => {
    it("should return vehicle by plate number", async () => {
      const mockVehicle = {
        id: "veh-1",
        plateNumber: "B 1234 CD",
        brand: "Vespa",
        model: "Sprint 150",
        customer: { id: "cust-1", name: "Budi", phone: "0812" },
        orders: [],
        _count: { orders: 0 },
      };

      prisma.vehicle.findUnique.mockResolvedValue(mockVehicle);

      const result = await repo.findByPlateNumber("B 1234 CD");

      expect(result).toEqual(mockVehicle);
    });

    it("should return null when plate not found", async () => {
      prisma.vehicle.findUnique.mockResolvedValue(null);

      const result = await repo.findByPlateNumber("B 9999 ZZ");

      expect(result).toBeNull();
    });
  });

  describe("findByCustomerId", () => {
    it("should return vehicles by customer ID", async () => {
      const mockVehicles = [
        { id: "veh-1", plateNumber: "B 1234 CD", brand: "Vespa", model: "Sprint", _count: { orders: 3 } },
      ];

      prisma.vehicle.findMany.mockResolvedValue(mockVehicles);

      const result = await repo.findByCustomerId("cust-1");

      expect(result).toEqual(mockVehicles);
    });
  });

  describe("findMany", () => {
    it("should return vehicles grouped by customer with default pagination", async () => {
      const mockCustomers = [
        {
          id: "cust-1",
          name: "Budi",
          phone: "0812",
          vehicles: [
            { id: "veh-1", plateNumber: "B 1234 CD", brand: "Vespa", model: "Sprint", _count: { orders: 3 } },
          ],
        },
      ];

      prisma.customer.count.mockResolvedValue(1);
      prisma.customer.findMany.mockResolvedValue(mockCustomers);

      const result = await repo.findMany({});

      expect(result.data).toHaveLength(1);
      expect(result.data[0].vehicles).toHaveLength(1);
      expect(result.data[0].totalVehicles).toBe(1);
      expect(result.metadata.total).toBe(1);
    });

    it("should return vehicles filtered by search", async () => {
      prisma.customer.count.mockResolvedValue(0);
      prisma.customer.findMany.mockResolvedValue([]);

      await repo.findMany({ search: "Vespa" });

      expect(prisma.customer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            vehicles: expect.objectContaining({
              some: expect.objectContaining({ OR: expect.any(Array) }),
            }),
          }),
        })
      );
    });
  });

  describe("update", () => {
    it("should update vehicle data", async () => {
      const updateData = { brand: "Honda", model: "Vario" };
      const expected = { id: "veh-1", plateNumber: "B 1234 CD", brand: "Honda", model: "Vario" };

      prisma.vehicle.update.mockResolvedValue(expected);

      const result = await repo.update("veh-1", updateData);

      expect(result).toEqual(expected);
    });

    it("should update plate number", async () => {
      prisma.vehicle.update.mockResolvedValue({});

      await repo.update("veh-1", { plateNumber: "B 9999 ZZ" });

      expect(prisma.vehicle.update).toHaveBeenCalledWith({
        where: { id: "veh-1" },
        data: { plateNumber: "B 9999 ZZ" },
        select: expect.any(Object),
      });
    });
  });

  describe("delete", () => {
    it("should delete a vehicle by ID", async () => {
      prisma.vehicle.delete.mockResolvedValue({});

      await repo.delete("veh-1");

      expect(prisma.vehicle.delete).toHaveBeenCalledWith({ where: { id: "veh-1" } });
    });
  });

  describe("hasOrders", () => {
    it("should return true when vehicle has orders", async () => {
      prisma.order.count.mockResolvedValue(5);

      const result = await repo.hasOrders("veh-1");

      expect(result).toBe(true);
    });

    it("should return false when no orders", async () => {
      prisma.order.count.mockResolvedValue(0);

      const result = await repo.hasOrders("veh-1");

      expect(result).toBe(false);
    });
  });

  describe("isPlateNumberExists", () => {
    it("should return true when plate number exists", async () => {
      prisma.vehicle.findFirst.mockResolvedValue({ id: "veh-1" });

      const result = await repo.isPlateNumberExists("B 1234 CD");

      expect(result).toBe(true);
    });

    it("should return false when plate does not exist", async () => {
      prisma.vehicle.findFirst.mockResolvedValue(null);

      const result = await repo.isPlateNumberExists("B 9999 ZZ");

      expect(result).toBe(false);
    });

    it("should exclude specific ID when checking", async () => {
      prisma.vehicle.findFirst.mockResolvedValue(null);

      await repo.isPlateNumberExists("B 1234 CD", "veh-1");

      expect(prisma.vehicle.findFirst).toHaveBeenCalledWith({
        where: { plateNumber: "B 1234 CD", id: { not: "veh-1" } },
        select: { id: true },
      });
    });
  });

  describe("searchByPlateNumber", () => {
    it("should search vehicles by partial plate number", async () => {
      const mockResults = [
        { id: "veh-1", plateNumber: "B 1234 CD", brand: "Vespa", model: "Sprint", customer: { id: "c1", name: "Budi" } },
      ];

      prisma.vehicle.findMany.mockResolvedValue(mockResults);

      const result = await repo.searchByPlateNumber("1234");

      expect(result).toEqual(mockResults);
    });

    it("should search with custom limit", async () => {
      prisma.vehicle.findMany.mockResolvedValue([]);

      await repo.searchByPlateNumber("B", 5);

      expect(prisma.vehicle.findMany).toHaveBeenCalledWith(expect.objectContaining({ take: 5 }));
    });
  });

  describe("getVehicleSummary", () => {
    it("should return vehicle summary with totalSpent", async () => {
      const mockVehicle = {
        id: "veh-1",
        plateNumber: "B 1234 CD",
        brand: "Vespa",
        model: "Sprint",
        customer: { id: "c1", name: "Budi" },
        _count: { orders: 10 },
        orders: [{ id: "o1", orderNumber: "ORD-001", status: "COMPLETED", total: 150000 }],
      };

      prisma.vehicle.findUnique.mockResolvedValue(mockVehicle);
      prisma.order.aggregate.mockResolvedValue({ _sum: { total: 5000000 } });

      const result = await repo.getVehicleSummary("veh-1");

      expect(result.totalSpent).toBe(5000000);
    });

    it("should return null when vehicle not found", async () => {
      prisma.vehicle.findUnique.mockResolvedValue(null);

      const result = await repo.getVehicleSummary("veh-99");

      expect(result).toBeNull();
    });
  });

  describe("findRecentVehicles", () => {
    it("should return recent vehicles with default limit", async () => {
      const mockVehicles = [
        { id: "veh-1", plateNumber: "B 1234 CD", brand: "Vespa", model: "Sprint", customer: { id: "c1", name: "Budi" }, _count: { orders: 2 } },
      ];

      prisma.vehicle.findMany.mockResolvedValue(mockVehicles);

      const result = await repo.findRecentVehicles();

      expect(result).toEqual(mockVehicles);
    });

    it("should return recent vehicles with custom limit", async () => {
      prisma.vehicle.findMany.mockResolvedValue([]);

      await repo.findRecentVehicles(5);

      expect(prisma.vehicle.findMany).toHaveBeenCalledWith(expect.objectContaining({ take: 5 }));
    });
  });
});