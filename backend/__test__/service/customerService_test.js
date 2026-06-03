import CustomerService from "#service/customerService.js";
import CustomerRepository from "#repository/customerRepository.js";
import ApiError from "#shared/utils/error.js";
import logger from "#app/logger.js";

jest.mock("#repository/customerRepository.js");
jest.mock("#app/logger.js", () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

describe("CustomerService", () => {
  let service;
  let mockCustomerRepo;

  beforeEach(() => {
    jest.clearAllMocks();
    CustomerRepository.mockClear();

    service = new CustomerService();
    mockCustomerRepo = CustomerRepository.mock.instances[0];
  });

  // ============================================================
  // createCustomer
  // ============================================================
  describe("createCustomer", () => {
    const payload = {
      name: "Budi Santoso",
      phone: "08123456789",
    };

    it("should create customer successfully without vehicle", async () => {
      const created = { id: "c1", name: "Budi Santoso", phone: "08123456789" };
      mockCustomerRepo.isPhoneExists.mockResolvedValue(false);
      mockCustomerRepo.create.mockResolvedValue(created);

      const result = await service.createCustomer(payload);

      expect(result).toEqual(created);
      expect(mockCustomerRepo.create).toHaveBeenCalledWith({
        name: "Budi Santoso",
        phone: "08123456789",
        vehicle: undefined,
      });
      expect(logger.info).toHaveBeenCalledWith(
        "Pelanggan berhasil dibuat",
        expect.objectContaining({
          customerId: "c1",
          name: "Budi Santoso",
        })
      );
    });

    it("should create customer with vehicle", async () => {
      const payloadWithVehicle = {
        name: "Budi Santoso",
        phone: "08123456789",
        vehicle: {
          plateNumber: "B 1234 CD",
          brand: "Toyota",
          model: "Avanza",
        },
      };
      const created = {
        id: "c1",
        name: "Budi Santoso",
        phone: "08123456789",
        vehicles: [{ plateNumber: "B 1234 CD" }],
      };

      mockCustomerRepo.isPhoneExists.mockResolvedValue(false);
      mockCustomerRepo.isPlateNumberExists.mockResolvedValue(false);
      mockCustomerRepo.create.mockResolvedValue(created);

      const result = await service.createCustomer(payloadWithVehicle);

      expect(result).toEqual(created);
      expect(mockCustomerRepo.isPlateNumberExists).toHaveBeenCalledWith(
        "B 1234 CD"
      );
      expect(logger.info).toHaveBeenCalledWith(
        "Pelanggan berhasil dibuat",
        expect.objectContaining({
          hasVehicle: true,
        })
      );
    });

    it("should create customer without phone", async () => {
      const payloadNoPhone = { name: "Ani Lestari" };
      const created = { id: "c2", name: "Ani Lestari", phone: null };

      mockCustomerRepo.create.mockResolvedValue(created);

      const result = await service.createCustomer(payloadNoPhone);

      expect(result).toEqual(created);
      expect(mockCustomerRepo.isPhoneExists).not.toHaveBeenCalled();
    });

    it("should throw Conflict when phone already exists", async () => {
      mockCustomerRepo.isPhoneExists.mockResolvedValue(true);

      await expect(service.createCustomer(payload)).rejects.toThrow(ApiError);

      try {
        await service.createCustomer(payload);
      } catch (error) {
        expect(error.statusCode).toBe(409);
        expect(error.message).toContain(
          "Nomor telepon '08123456789' sudah digunakan"
        );
      }

      expect(mockCustomerRepo.create).not.toHaveBeenCalled();
    });

    it("should throw Conflict when plate number already exists", async () => {
      const payloadWithVehicle = {
        name: "Budi",
        phone: "08123456789",
        vehicle: { plateNumber: "B 1234 CD" },
      };

      mockCustomerRepo.isPhoneExists.mockResolvedValue(false);
      mockCustomerRepo.isPlateNumberExists.mockResolvedValue(true);

      await expect(
        service.createCustomer(payloadWithVehicle)
      ).rejects.toThrow(ApiError);

      try {
        await service.createCustomer(payloadWithVehicle);
      } catch (error) {
        expect(error.statusCode).toBe(409);
        expect(error.message).toContain(
          "Plat nomor 'B 1234 CD' sudah terdaftar"
        );
      }
    });
  });

  // ============================================================
  // upsertCustomer
  // ============================================================
  describe("upsertCustomer", () => {
    it("should create new customer when not exists", async () => {
      const payload = { name: "Budi", phone: "08123456789" };
      const created = { id: "c1", name: "Budi", phone: "08123456789" };

      mockCustomerRepo.findByPhone.mockResolvedValue(null);
      mockCustomerRepo.upsert.mockResolvedValue(created);

      const result = await service.upsertCustomer(payload);

      expect(result).toEqual(created);
      expect(logger.info).toHaveBeenCalledWith(
        "Pelanggan berhasil dibuat (upsert)",
        expect.objectContaining({ customerId: "c1" })
      );
    });

    it("should update existing customer", async () => {
      const payload = { name: "Budi Updated", phone: "08123456789" };
      const existing = { id: "c1", name: "Budi", phone: "08123456789" };
      const updated = { id: "c1", name: "Budi Updated", phone: "08123456789" };

      mockCustomerRepo.findByPhone.mockResolvedValue(existing);
      mockCustomerRepo.upsert.mockResolvedValue(updated);

      const result = await service.upsertCustomer(payload);

      expect(result).toEqual(updated);
      expect(logger.info).toHaveBeenCalledWith(
        "Pelanggan berhasil diperbarui (upsert)",
        expect.objectContaining({ customerId: "c1" })
      );
    });
  });

  // ============================================================
  // getCustomerById
  // ============================================================
  describe("getCustomerById", () => {
    it("should return customer when found", async () => {
      const customer = {
        id: "c1",
        name: "Budi",
        phone: "08123456789",
        vehicles: [],
      };
      mockCustomerRepo.findById.mockResolvedValue(customer);

      const result = await service.getCustomerById("c1");

      expect(result).toEqual(customer);
      expect(mockCustomerRepo.findById).toHaveBeenCalledWith("c1");
    });

    it("should throw NotFound when customer not found", async () => {
      mockCustomerRepo.findById.mockResolvedValue(null);

      await expect(service.getCustomerById("c99")).rejects.toThrow(ApiError);

      try {
        await service.getCustomerById("c99");
      } catch (error) {
        expect(error.statusCode).toBe(404);
        expect(error.message).toContain(
          "Pelanggan dengan ID 'c99' tidak ditemukan"
        );
      }
    });
  });

  // ============================================================
  // getCustomerByPhone
  // ============================================================
  describe("getCustomerByPhone", () => {
    it("should return customer when found by phone", async () => {
      const customer = { id: "c1", name: "Budi", phone: "08123456789" };
      mockCustomerRepo.findByPhone.mockResolvedValue(customer);

      const result = await service.getCustomerByPhone("08123456789");

      expect(result).toEqual(customer);
    });

    it("should throw NotFound when phone not found", async () => {
      mockCustomerRepo.findByPhone.mockResolvedValue(null);

      await expect(
        service.getCustomerByPhone("0899999999")
      ).rejects.toThrow(ApiError);

      try {
        await service.getCustomerByPhone("0899999999");
      } catch (error) {
        expect(error.statusCode).toBe(404);
        expect(error.message).toContain(
          "Pelanggan dengan nomor telepon '0899999999' tidak ditemukan"
        );
      }
    });
  });

  // ============================================================
  // getCustomers
  // ============================================================
  describe("getCustomers", () => {
    it("should return paginated customers", async () => {
      const mockResult = {
        data: [
          { id: "c1", name: "Budi" },
          { id: "c2", name: "Ani" },
        ],
        metadata: { total: 2, currentPage: 1, itemsPerPage: 10, totalPages: 1 },
      };
      mockCustomerRepo.findMany.mockResolvedValue(mockResult);

      const result = await service.getCustomers({ page: 1, search: "Bud" });

      expect(result.data).toHaveLength(2);
      expect(result.metadata.total).toBe(2);
      expect(mockCustomerRepo.findMany).toHaveBeenCalledWith({
        page: 1,
        search: "Bud",
      });
      expect(logger.info).toHaveBeenCalledWith(
        "Mengambil daftar pelanggan",
        expect.objectContaining({ total: 2, page: 1 })
      );
    });

    it("should handle empty results", async () => {
      const emptyResult = {
        data: [],
        metadata: { total: 0, currentPage: 1 },
      };
      mockCustomerRepo.findMany.mockResolvedValue(emptyResult);

      const result = await service.getCustomers();

      expect(result.data).toEqual([]);
      expect(result.metadata.total).toBe(0);
    });
  });

  // ============================================================
  // updateCustomer
  // ============================================================
  describe("updateCustomer", () => {
    const existingCustomer = {
      id: "c1",
      name: "Budi",
      phone: "08123456789",
    };

    it("should update customer name successfully", async () => {
      mockCustomerRepo.findById.mockResolvedValue(existingCustomer);
      mockCustomerRepo.update.mockResolvedValue({
        ...existingCustomer,
        name: "Budi Updated",
      });

      const result = await service.updateCustomer("c1", {
        name: "Budi Updated",
      });

      expect(result.name).toBe("Budi Updated");
      expect(mockCustomerRepo.update).toHaveBeenCalledWith("c1", {
        name: "Budi Updated",
      });
      expect(logger.info).toHaveBeenCalledWith(
        "Pelanggan berhasil diperbarui",
        expect.objectContaining({
          customerId: "c1",
          previousName: "Budi",
          newName: "Budi Updated",
        })
      );
    });

    it("should update customer phone when not used", async () => {
      mockCustomerRepo.findById.mockResolvedValue(existingCustomer);
      mockCustomerRepo.isPhoneExists.mockResolvedValue(false);
      mockCustomerRepo.update.mockResolvedValue({
        ...existingCustomer,
        phone: "0813",
      });

      const result = await service.updateCustomer("c1", { phone: "0813" });

      expect(result.phone).toBe("0813");
    });

    it("should throw NotFound when customer not found", async () => {
      mockCustomerRepo.findById.mockResolvedValue(null);

      await expect(
        service.updateCustomer("c99", { name: "Test" })
      ).rejects.toThrow(ApiError);

      try {
        await service.updateCustomer("c99", { name: "Test" });
      } catch (error) {
        expect(error.statusCode).toBe(404);
        expect(error.message).toContain(
          "Pelanggan dengan ID 'c99' tidak ditemukan"
        );
      }
    });

    it("should throw Conflict when phone already used by another customer", async () => {
      mockCustomerRepo.findById.mockResolvedValue(existingCustomer);
      mockCustomerRepo.isPhoneExists.mockResolvedValue(true);

      await expect(
        service.updateCustomer("c1", { phone: "0813" })
      ).rejects.toThrow(ApiError);

      try {
        await service.updateCustomer("c1", { phone: "0813" });
      } catch (error) {
        expect(error.statusCode).toBe(409);
        expect(error.message).toContain(
          "Nomor telepon '0813' sudah digunakan oleh pelanggan lain"
        );
      }
    });

    it("should skip phone check when phone not provided", async () => {
      mockCustomerRepo.findById.mockResolvedValue(existingCustomer);
      mockCustomerRepo.update.mockResolvedValue(existingCustomer);

      await service.updateCustomer("c1", { name: "Budi" });

      expect(mockCustomerRepo.isPhoneExists).not.toHaveBeenCalled();
    });
  });

  // ============================================================
  // deleteCustomer
  // ============================================================
  describe("deleteCustomer", () => {
    const existingCustomer = {
      id: "c1",
      name: "Budi",
      phone: "08123456789",
    };

    it("should delete customer successfully", async () => {
      mockCustomerRepo.findById.mockResolvedValue(existingCustomer);
      mockCustomerRepo.hasOrders.mockResolvedValue(false);
      mockCustomerRepo.delete.mockResolvedValue(undefined);

      await service.deleteCustomer("c1");

      expect(mockCustomerRepo.delete).toHaveBeenCalledWith("c1");
      expect(logger.info).toHaveBeenCalledWith(
        "Pelanggan berhasil dihapus",
        expect.objectContaining({
          customerId: "c1",
          name: "Budi",
        })
      );
    });

    it("should throw NotFound when customer not found", async () => {
      mockCustomerRepo.findById.mockResolvedValue(null);

      await expect(service.deleteCustomer("c99")).rejects.toThrow(ApiError);

      try {
        await service.deleteCustomer("c99");
      } catch (error) {
        expect(error.statusCode).toBe(404);
        expect(error.message).toContain(
          "Pelanggan dengan ID 'c99' tidak ditemukan"
        );
      }
    });

    it("should throw BadRequest when customer has orders", async () => {
      mockCustomerRepo.findById.mockResolvedValue(existingCustomer);
      mockCustomerRepo.hasOrders.mockResolvedValue(true);

      await expect(service.deleteCustomer("c1")).rejects.toThrow(ApiError);

      try {
        await service.deleteCustomer("c1");
      } catch (error) {
        expect(error.statusCode).toBe(400);
        expect(error.message).toContain(
          "Pelanggan 'Budi' masih memiliki riwayat transaksi"
        );
      }

      expect(mockCustomerRepo.delete).not.toHaveBeenCalled();
    });
  });

  // ============================================================
  // checkPhoneAvailability
  // ============================================================
  describe("checkPhoneAvailability", () => {
    it("should return available false when phone exists", async () => {
      mockCustomerRepo.isPhoneExists.mockResolvedValue(true);

      const result = await service.checkPhoneAvailability("08123456789");

      expect(result).toEqual({
        available: false,
        message: "Nomor telepon '08123456789' sudah terdaftar.",
      });
    });

    it("should return available true when phone does not exist", async () => {
      mockCustomerRepo.isPhoneExists.mockResolvedValue(false);

      const result = await service.checkPhoneAvailability("0899999999");

      expect(result).toEqual({
        available: true,
        message: "Nomor telepon '0899999999' tersedia.",
      });
    });

    it("should pass excludeId to repository", async () => {
      mockCustomerRepo.isPhoneExists.mockResolvedValue(false);

      await service.checkPhoneAvailability("08123456789", "c1");

      expect(mockCustomerRepo.isPhoneExists).toHaveBeenCalledWith(
        "08123456789",
        "c1"
      );
    });
  });

  // ============================================================
  // deleteCustomers (Bulk)
  // ============================================================
  describe("deleteCustomers", () => {
    it("should delete multiple customers successfully", async () => {
      mockCustomerRepo.findById
        .mockResolvedValueOnce({ id: "c1", name: "Budi" })
        .mockResolvedValueOnce({ id: "c2", name: "Ani" });

      mockCustomerRepo.deleteMany.mockResolvedValue({
        success: [{ id: "c1" }, { id: "c2" }],
        failed: [],
      });

      const result = await service.deleteCustomers(["c1", "c2"]);

      expect(result.summary.total).toBe(2);
      expect(result.summary.deleted).toBe(2);
      expect(result.summary.failed).toBe(0);
      expect(mockCustomerRepo.deleteMany).toHaveBeenCalledWith(["c1", "c2"]);
      expect(logger.info).toHaveBeenCalledWith(
        "Bulk delete pelanggan selesai",
        expect.objectContaining({
          summary: expect.any(Object),
        })
      );
    });

    it("should throw BadRequest when customerIds is empty", async () => {
      await expect(service.deleteCustomers([])).rejects.toThrow(ApiError);

      try {
        await service.deleteCustomers([]);
      } catch (error) {
        expect(error.statusCode).toBe(400);
        expect(error.message).toContain("Tidak ada pelanggan yang dipilih");
      }
    });

    it("should throw BadRequest when customerIds is null", async () => {
      await expect(service.deleteCustomers(null)).rejects.toThrow(ApiError);
    });

    it("should skip non-existent customers", async () => {
      mockCustomerRepo.findById.mockResolvedValue(null);
      mockCustomerRepo.deleteMany.mockResolvedValue({
        success: [],
        failed: [],
      });

      await expect(
        service.deleteCustomers(["c99", "c100"])
      ).rejects.toThrow(ApiError);

      try {
        await service.deleteCustomers(["c99", "c100"]);
      } catch (error) {
        expect(error.statusCode).toBe(400);
        expect(error.message).toContain(
          "Tidak ada pelanggan yang memenuhi syarat"
        );
        expect(error.details).toHaveLength(2);
        expect(error.details[0].reason).toContain("tidak ditemukan");
      }
    });

    it("should handle mixed scenarios (some valid, some skipped)", async () => {
      mockCustomerRepo.findById
        .mockResolvedValueOnce({ id: "c1", name: "Budi" })
        .mockResolvedValueOnce(null);

      mockCustomerRepo.deleteMany.mockResolvedValue({
        success: [{ id: "c1" }],
        failed: [],
      });

      const result = await service.deleteCustomers(["c1", "c99"]);

      expect(result.summary.total).toBe(2);
      expect(result.summary.valid).toBe(1);
      expect(result.summary.skipped).toBe(1);
      expect(result.summary.deleted).toBe(1);
    });

    it("should handle partial failures from repository", async () => {
      mockCustomerRepo.findById.mockResolvedValue({
        id: "c1",
        name: "Budi",
      });
      mockCustomerRepo.deleteMany.mockResolvedValue({
        success: [{ id: "c1" }],
        failed: [{ id: "c2", reason: "Database error" }],
      });

      const result = await service.deleteCustomers(["c1", "c2"]);

      expect(result.summary.deleted).toBe(1);
      expect(result.summary.failed).toBe(1);
    });
  });
});