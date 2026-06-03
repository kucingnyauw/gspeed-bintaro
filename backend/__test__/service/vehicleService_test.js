import VehicleService from "#service/vehicleService.js";
import VehicleRepository from "#repository/vehicleRepository.js";
import CustomerRepository from "#repository/customerRepository.js";
import ApiError from "#shared/utils/error.js";
import logger from "#app/logger.js";

// Mock repositories
jest.mock("#repository/vehicleRepository.js");
jest.mock("#repository/customerRepository.js");

// Mock logger
jest.mock("#app/logger.js", () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

describe("VehicleService", () => {
  let service;
  let mockVehicleRepo;
  let mockCustomerRepo;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset mock implementations
    VehicleRepository.mockClear();
    CustomerRepository.mockClear();
    
    service = new VehicleService();
    
    // Get mock instances
    mockVehicleRepo = VehicleRepository.mock.instances[0];
    mockCustomerRepo = CustomerRepository.mock.instances[0];
  });

  // ============================================================
  // registerVehicle
  // ============================================================
  describe("registerVehicle", () => {
    const validPayload = {
      plateNumber: "B 1234 CD",
      customerId: "c1",
      brand: "Toyota",
      model: "Avanza",
    };

    it("should register vehicle successfully with all fields", async () => {
      const mockCustomer = { id: "c1", name: "Budi" };
      const mockVehicle = { 
        id: "v1", 
        plateNumber: "B 1234 CD",
        customerId: "c1",
        brand: "Toyota",
        model: "Avanza",
        createdAt: new Date() 
      };

      mockCustomerRepo.findById.mockResolvedValue(mockCustomer);
      mockVehicleRepo.isPlateNumberExists.mockResolvedValue(false);
      mockVehicleRepo.create.mockResolvedValue(mockVehicle);

      const result = await service.registerVehicle(validPayload);

      expect(result).toEqual(mockVehicle);
      expect(mockCustomerRepo.findById).toHaveBeenCalledWith("c1");
      expect(mockVehicleRepo.isPlateNumberExists).toHaveBeenCalledWith("B 1234 CD");
      expect(mockVehicleRepo.create).toHaveBeenCalledWith({
        plateNumber: "B 1234 CD",
        customerId: "c1",
        brand: "Toyota",
        model: "Avanza",
      });
      expect(logger.info).toHaveBeenCalledWith(
        "Kendaraan berhasil didaftarkan",
        expect.objectContaining({
          vehicleId: "v1",
          plateNumber: "B 1234 CD",
          customerId: "c1",
          customerName: "Budi",
        })
      );
    });

    it("should register vehicle with minimal fields (brand and model null)", async () => {
      const minimalPayload = { 
        plateNumber: "B 5678 EF", 
        customerId: "c2" 
      };
      const mockCustomer = { id: "c2", name: "Ani" };
      const mockVehicle = { 
        id: "v2", 
        plateNumber: "B 5678 EF",
        customerId: "c2",
        brand: null, 
        model: null 
      };

      mockCustomerRepo.findById.mockResolvedValue(mockCustomer);
      mockVehicleRepo.isPlateNumberExists.mockResolvedValue(false);
      mockVehicleRepo.create.mockResolvedValue(mockVehicle);

      const result = await service.registerVehicle(minimalPayload);

      expect(result).toEqual(mockVehicle);
      expect(mockVehicleRepo.create).toHaveBeenCalledWith({
        plateNumber: "B 5678 EF",
        customerId: "c2",
        brand: null,
        model: null,
      });
    });

    it("should normalize plate number - trim and uppercase", async () => {
      const payload = { 
        plateNumber: "  b 1234 cd  ", 
        customerId: "c1" 
      };
      const normalizedPlate = "B 1234 CD";
      
      mockCustomerRepo.findById.mockResolvedValue({ id: "c1", name: "Budi" });
      mockVehicleRepo.isPlateNumberExists.mockResolvedValue(false);
      mockVehicleRepo.create.mockResolvedValue({ 
        id: "v1", 
        plateNumber: normalizedPlate 
      });

      await service.registerVehicle(payload);

      expect(mockVehicleRepo.isPlateNumberExists).toHaveBeenCalledWith(normalizedPlate);
      expect(mockVehicleRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ plateNumber: normalizedPlate })
      );
    });

    it("should trim brand and model values", async () => {
      const payload = { 
        plateNumber: "B 1234 CD",
        customerId: "c1",
        brand: "  Toyota  ", 
        model: "  Avanza  " 
      };
      
      mockCustomerRepo.findById.mockResolvedValue({ id: "c1", name: "Budi" });
      mockVehicleRepo.isPlateNumberExists.mockResolvedValue(false);
      mockVehicleRepo.create.mockResolvedValue({ id: "v1" });

      await service.registerVehicle(payload);

      expect(mockVehicleRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ 
          brand: "Toyota", 
          model: "Avanza" 
        })
      );
    });

    it("should throw ApiError 404 when customer not found", async () => {
      mockCustomerRepo.findById.mockResolvedValue(null);

      await expect(service.registerVehicle(validPayload))
        .rejects
        .toThrow(ApiError);
      
      try {
        await service.registerVehicle(validPayload);
      } catch (error) {
        expect(error.statusCode).toBe(404);
        expect(error.message).toContain("Pelanggan dengan ID 'c1' tidak ditemukan");
      }
      
      expect(mockVehicleRepo.isPlateNumberExists).not.toHaveBeenCalled();
      expect(mockVehicleRepo.create).not.toHaveBeenCalled();
    });

    it("should throw ApiError 409 when plate number already exists", async () => {
      mockCustomerRepo.findById.mockResolvedValue({ id: "c1", name: "Budi" });
      mockVehicleRepo.isPlateNumberExists.mockResolvedValue(true);

      await expect(service.registerVehicle(validPayload))
        .rejects
        .toThrow(ApiError);
      
      try {
        await service.registerVehicle(validPayload);
      } catch (error) {
        expect(error.statusCode).toBe(409);
        expect(error.message).toContain("Plat nomor 'B 1234 CD' sudah terdaftar");
      }
      
      expect(mockVehicleRepo.create).not.toHaveBeenCalled();
    });
  });

  // ============================================================
  // getVehicleById
  // ============================================================
  describe("getVehicleById", () => {
    it("should return vehicle when found", async () => {
      const mockVehicle = { 
        id: "v1", 
        plateNumber: "B 1234 CD",
        customerId: "c1",
        brand: "Toyota",
        model: "Avanza"
      };
      
      mockVehicleRepo.findById.mockResolvedValue(mockVehicle);

      const result = await service.getVehicleById("v1");
      
      expect(result).toEqual(mockVehicle);
      expect(mockVehicleRepo.findById).toHaveBeenCalledWith("v1");
    });

    it("should throw ApiError 404 when vehicle not found", async () => {
      mockVehicleRepo.findById.mockResolvedValue(null);

      await expect(service.getVehicleById("v99"))
        .rejects
        .toThrow(ApiError);
      
      try {
        await service.getVehicleById("v99");
      } catch (error) {
        expect(error.statusCode).toBe(404);
        expect(error.message).toContain("Kendaraan dengan ID 'v99' tidak ditemukan");
      }
    });
  });

  // ============================================================
  // getVehicleByPlateNumber
  // ============================================================
  describe("getVehicleByPlateNumber", () => {
    it("should return vehicle when found by exact plate number", async () => {
      const mockVehicle = { 
        id: "v1", 
        plateNumber: "B 1234 CD" 
      };
      
      mockVehicleRepo.findByPlateNumber.mockResolvedValue(mockVehicle);

      const result = await service.getVehicleByPlateNumber("B 1234 CD");
      
      expect(result).toEqual(mockVehicle);
      expect(mockVehicleRepo.findByPlateNumber).toHaveBeenCalledWith("B 1234 CD");
    });

    it("should normalize plate number before search", async () => {
      const mockVehicle = { id: "v1", plateNumber: "B 1234 CD" };
      mockVehicleRepo.findByPlateNumber.mockResolvedValue(mockVehicle);
      
      await service.getVehicleByPlateNumber("  b 1234 cd  ");
      
      expect(mockVehicleRepo.findByPlateNumber).toHaveBeenCalledWith("B 1234 CD");
    });

    it("should throw ApiError 404 when plate number not found", async () => {
      mockVehicleRepo.findByPlateNumber.mockResolvedValue(null);

      await expect(service.getVehicleByPlateNumber("B 9999 XX"))
        .rejects
        .toThrow(ApiError);
      
      try {
        await service.getVehicleByPlateNumber("B 9999 XX");
      } catch (error) {
        expect(error.statusCode).toBe(404);
        expect(error.message).toContain("Kendaraan dengan plat nomor 'B 9999 XX' tidak ditemukan");
      }
    });
  });

  // ============================================================
  // getVehicles
  // ============================================================
  describe("getVehicles", () => {
    it("should return paginated vehicles with default query (empty object)", async () => {
      const mockResult = {
        data: [
          { id: "v1", plateNumber: "B 1234 CD" }, 
          { id: "v2", plateNumber: "B 5678 EF" }
        ],
        metadata: { 
          total: 2, 
          currentPage: 1, 
          itemsPerPage: 10, 
          totalPages: 1 
        },
      };
      
      mockVehicleRepo.findMany.mockResolvedValue(mockResult);

      const result = await service.getVehicles();
      
      expect(result).toEqual(mockResult);
      expect(mockVehicleRepo.findMany).toHaveBeenCalledWith({});
      expect(logger.info).toHaveBeenCalledWith(
        "Mengambil daftar kendaraan",
        expect.objectContaining({
          total: 2,
          page: 1,
        })
      );
    });

    it("should pass query parameters to repository correctly", async () => {
      const query = { 
        page: 2, 
        limit: 5, 
        search: "Toyota", 
        customerId: "c1" 
      };
      
      mockVehicleRepo.findMany.mockResolvedValue({ 
        data: [], 
        metadata: { total: 0, currentPage: 2 } 
      });

      await service.getVehicles(query);
      
      expect(mockVehicleRepo.findMany).toHaveBeenCalledWith(query);
      expect(logger.info).toHaveBeenCalledWith(
        "Mengambil daftar kendaraan",
        expect.objectContaining({
          filters: {
            customerId: "c1",
            search: "Toyota",
          },
        })
      );
    });

    it("should handle empty result", async () => {
      const emptyResult = {
        data: [],
        metadata: { total: 0, currentPage: 1, itemsPerPage: 10, totalPages: 0 },
      };
      
      mockVehicleRepo.findMany.mockResolvedValue(emptyResult);

      const result = await service.getVehicles();
      
      expect(result.data).toHaveLength(0);
      expect(result.metadata.total).toBe(0);
    });
  });

  // ============================================================
  // getVehiclesByCustomer
  // ============================================================
  describe("getVehiclesByCustomer", () => {
    it("should return vehicles for valid customer", async () => {
      const mockCustomer = { id: "c1", name: "Budi" };
      const mockVehicles = [
        { id: "v1", plateNumber: "B 1234 CD" },
        { id: "v2", plateNumber: "B 5678 EF" }
      ];
      
      mockCustomerRepo.findById.mockResolvedValue(mockCustomer);
      mockVehicleRepo.findByCustomerId.mockResolvedValue(mockVehicles);

      const result = await service.getVehiclesByCustomer("c1");
      
      expect(result).toHaveLength(2);
      expect(result).toEqual(mockVehicles);
      expect(mockCustomerRepo.findById).toHaveBeenCalledWith("c1");
      expect(mockVehicleRepo.findByCustomerId).toHaveBeenCalledWith("c1");
      expect(logger.info).toHaveBeenCalledWith(
        "Mengambil kendaraan pelanggan",
        expect.objectContaining({
          customerId: "c1",
          customerName: "Budi",
          vehicleCount: 2,
        })
      );
    });

    it("should return empty array when customer has no vehicles", async () => {
      mockCustomerRepo.findById.mockResolvedValue({ id: "c1", name: "Budi" });
      mockVehicleRepo.findByCustomerId.mockResolvedValue([]);

      const result = await service.getVehiclesByCustomer("c1");
      
      expect(result).toEqual([]);
      expect(logger.info).toHaveBeenCalledWith(
        "Mengambil kendaraan pelanggan",
        expect.objectContaining({
          vehicleCount: 0,
        })
      );
    });

    it("should throw ApiError 404 when customer not found", async () => {
      mockCustomerRepo.findById.mockResolvedValue(null);

      await expect(service.getVehiclesByCustomer("c99"))
        .rejects
        .toThrow(ApiError);
      
      try {
        await service.getVehiclesByCustomer("c99");
      } catch (error) {
        expect(error.statusCode).toBe(404);
        expect(error.message).toContain("Pelanggan dengan ID 'c99' tidak ditemukan");
      }
      
      expect(mockVehicleRepo.findByCustomerId).not.toHaveBeenCalled();
    });
  });

  // ============================================================
  // updateVehicle
  // ============================================================
  describe("updateVehicle", () => {
    const existingVehicle = { 
      id: "v1", 
      plateNumber: "B 1234 CD", 
      brand: "Toyota",
      model: "Avanza",
      customerId: "c1"
    };

    beforeEach(() => {
      mockVehicleRepo.findById.mockResolvedValue(existingVehicle);
    });

    it("should update vehicle brand and model successfully", async () => {
      const payload = { brand: "Honda", model: "Civic" };
      const updatedVehicle = { 
        ...existingVehicle, 
        brand: "Honda", 
        model: "Civic" 
      };
      
      mockVehicleRepo.update.mockResolvedValue(updatedVehicle);

      const result = await service.updateVehicle("v1", payload);
      
      expect(result.brand).toBe("Honda");
      expect(result.model).toBe("Civic");
      expect(mockVehicleRepo.update).toHaveBeenCalledWith("v1", payload);
      expect(logger.info).toHaveBeenCalledWith(
        "Kendaraan berhasil diperbarui",
        expect.objectContaining({
          vehicleId: "v1",
          previousPlateNumber: "B 1234 CD",
        })
      );
    });

    it("should update plate number when different from existing", async () => {
      const newPlate = "B 9999 ZZ";
      mockVehicleRepo.isPlateNumberExists.mockResolvedValue(false);
      mockVehicleRepo.update.mockResolvedValue({ 
        ...existingVehicle, 
        plateNumber: newPlate 
      });

      const result = await service.updateVehicle("v1", { plateNumber: newPlate });
      
      expect(result.plateNumber).toBe(newPlate);
      expect(mockVehicleRepo.isPlateNumberExists).toHaveBeenCalledWith(newPlate, "v1");
    });

    it("should normalize and trim updated plate number, brand, and model", async () => {
      mockVehicleRepo.isPlateNumberExists.mockResolvedValue(false);
      mockVehicleRepo.update.mockResolvedValue({ 
        ...existingVehicle,
        plateNumber: "B 9999 ZZ",
        brand: "Honda",
        model: "Civic"
      });

      await service.updateVehicle("v1", {
        plateNumber: "  b 9999 zz  ",
        brand: "  Honda  ",
        model: "  Civic  "
      });

      expect(mockVehicleRepo.update).toHaveBeenCalledWith("v1", {
        plateNumber: "B 9999 ZZ",
        brand: "Honda",
        model: "Civic"
      });
    });

    it("should not check plate existence when new plate same as existing (after normalization)", async () => {
      mockVehicleRepo.update.mockResolvedValue({ 
        ...existingVehicle, 
        brand: "Honda" 
      });

      await service.updateVehicle("v1", { 
        plateNumber: "  b 1234 cd  ", // Same plate after normalization
        brand: "Honda" 
      });
      
      expect(mockVehicleRepo.isPlateNumberExists).not.toHaveBeenCalled();
      expect(mockVehicleRepo.update).toHaveBeenCalledWith("v1", {
        plateNumber: "B 1234 CD",
        brand: "Honda",
      });
    });

    it("should throw ApiError 404 when vehicle not found", async () => {
      mockVehicleRepo.findById.mockResolvedValue(null);

      await expect(service.updateVehicle("v99", { brand: "Honda" }))
        .rejects
        .toThrow(ApiError);
      
      try {
        await service.updateVehicle("v99", { brand: "Honda" });
      } catch (error) {
        expect(error.statusCode).toBe(404);
        expect(error.message).toContain("Kendaraan dengan ID 'v99' tidak ditemukan");
      }
    });

    it("should throw ApiError 409 when new plate number already used by another vehicle", async () => {
      mockVehicleRepo.isPlateNumberExists.mockResolvedValue(true);

      await expect(service.updateVehicle("v1", { plateNumber: "B 5678 EF" }))
        .rejects
        .toThrow(ApiError);
      
      try {
        await service.updateVehicle("v1", { plateNumber: "B 5678 EF" });
      } catch (error) {
        expect(error.statusCode).toBe(409);
        expect(error.message).toContain("Plat nomor 'B 5678 EF' sudah digunakan");
      }
      
      expect(mockVehicleRepo.update).not.toHaveBeenCalled();
    });

    it("should update only provided fields (partial update)", async () => {
      mockVehicleRepo.update.mockResolvedValue({ 
        ...existingVehicle, 
        brand: "Honda" 
      });

      const result = await service.updateVehicle("v1", { brand: "Honda" });
      
      expect(result.brand).toBe("Honda");
      expect(result.plateNumber).toBe("B 1234 CD"); // Unchanged
      expect(mockVehicleRepo.update).toHaveBeenCalledWith("v1", { brand: "Honda" });
    });
  });

  // ============================================================
  // deleteVehicle
  // ============================================================
  describe("deleteVehicle", () => {
    const mockVehicle = { 
      id: "v1", 
      plateNumber: "B 1234 CD",
      customerId: "c1"
    };

    it("should delete vehicle successfully when no orders exist", async () => {
      mockVehicleRepo.findById.mockResolvedValue(mockVehicle);
      mockVehicleRepo.hasOrders.mockResolvedValue(false);
      mockVehicleRepo.delete.mockResolvedValue(undefined);

      await service.deleteVehicle("v1");
      
      expect(mockVehicleRepo.findById).toHaveBeenCalledWith("v1");
      expect(mockVehicleRepo.hasOrders).toHaveBeenCalledWith("v1");
      expect(mockVehicleRepo.delete).toHaveBeenCalledWith("v1");
      expect(logger.info).toHaveBeenCalledWith(
        "Kendaraan berhasil dihapus",
        expect.objectContaining({
          vehicleId: "v1",
          plateNumber: "B 1234 CD",
          customerId: "c1",
        })
      );
    });

    it("should throw ApiError 404 when vehicle not found", async () => {
      mockVehicleRepo.findById.mockResolvedValue(null);

      await expect(service.deleteVehicle("v99"))
        .rejects
        .toThrow(ApiError);
      
      try {
        await service.deleteVehicle("v99");
      } catch (error) {
        expect(error.statusCode).toBe(404);
        expect(error.message).toContain("Kendaraan dengan ID 'v99' tidak ditemukan");
      }
      
      expect(mockVehicleRepo.hasOrders).not.toHaveBeenCalled();
      expect(mockVehicleRepo.delete).not.toHaveBeenCalled();
    });

    it("should throw ApiError 409 when vehicle has service orders", async () => {
      mockVehicleRepo.findById.mockResolvedValue(mockVehicle);
      mockVehicleRepo.hasOrders.mockResolvedValue(true);

      await expect(service.deleteVehicle("v1"))
        .rejects
        .toThrow(ApiError);
      
      try {
        await service.deleteVehicle("v1");
      } catch (error) {
        expect(error.statusCode).toBe(409);
        expect(error.message).toContain("Kendaraan dengan plat 'B 1234 CD' masih memiliki riwayat servis");
      }
      
      expect(mockVehicleRepo.delete).not.toHaveBeenCalled();
    });
  });

  // ============================================================
  // checkPlateNumberExists
  // ============================================================
  describe("checkPlateNumberExists", () => {
    it("should return exists true with appropriate message when plate number is registered", async () => {
      mockVehicleRepo.isPlateNumberExists.mockResolvedValue(true);
      
      const result = await service.checkPlateNumberExists("B 1234 CD");
      
      expect(result).toEqual({
        exists: true,
        message: "Plat nomor 'B 1234 CD' sudah terdaftar.",
      });
      expect(mockVehicleRepo.isPlateNumberExists).toHaveBeenCalledWith("B 1234 CD", null);
    });

    it("should return exists false with appropriate message when plate number is available", async () => {
      mockVehicleRepo.isPlateNumberExists.mockResolvedValue(false);
      
      const result = await service.checkPlateNumberExists("B 9999 ZZ");
      
      expect(result).toEqual({
        exists: false,
        message: "Plat nomor 'B 9999 ZZ' tersedia.",
      });
    });

    it("should normalize plate number and pass excludeId to repository", async () => {
      mockVehicleRepo.isPlateNumberExists.mockResolvedValue(false);
      
      await service.checkPlateNumberExists("  b 1234 cd  ", "v1");
      
      expect(mockVehicleRepo.isPlateNumberExists).toHaveBeenCalledWith("B 1234 CD", "v1");
    });

    it("should handle excludeId as null by default", async () => {
      mockVehicleRepo.isPlateNumberExists.mockResolvedValue(false);
      
      await service.checkPlateNumberExists("B 1234 CD");
      
      expect(mockVehicleRepo.isPlateNumberExists).toHaveBeenCalledWith("B 1234 CD", null);
    });
  });

  // ============================================================
  // searchByPlateNumber
  // ============================================================
  describe("searchByPlateNumber", () => {
    it("should return matching vehicles for partial plate number", async () => {
      const mockVehicles = [
        { id: "v1", plateNumber: "B 1234 CD" },
        { id: "v2", plateNumber: "B 1235 EF" }
      ];
      
      mockVehicleRepo.searchByPlateNumber.mockResolvedValue(mockVehicles);
      
      const result = await service.searchByPlateNumber("B 12");
      
      expect(result).toHaveLength(2);
      expect(result).toEqual(mockVehicles);
      expect(mockVehicleRepo.searchByPlateNumber).toHaveBeenCalledWith("B 12");
      expect(logger.info).toHaveBeenCalledWith(
        "Mencari kendaraan berdasarkan plat",
        expect.objectContaining({
          searchTerm: "B 12",
          resultCount: 2,
        })
      );
    });

    it("should normalize search term before querying", async () => {
      mockVehicleRepo.searchByPlateNumber.mockResolvedValue([]);
      
      await service.searchByPlateNumber("  b 12  ");
      
      expect(mockVehicleRepo.searchByPlateNumber).toHaveBeenCalledWith("B 12");
    });

    it("should return empty array when no vehicles match", async () => {
      mockVehicleRepo.searchByPlateNumber.mockResolvedValue([]);
      
      const result = await service.searchByPlateNumber("XYZ");
      
      expect(result).toEqual([]);
      expect(logger.info).toHaveBeenCalledWith(
        "Mencari kendaraan berdasarkan plat",
        expect.objectContaining({
          resultCount: 0,
        })
      );
    });
  });
});