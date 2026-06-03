import ShiftService from "#service/shiftService.js";
import ShiftRepository from "#repository/shiftRepository.js";
import SettingRepository from "#repository/settingRepository.js";
import NotificationRepository from "#repository/notificationRepository.js";
import UserRepository from "#repository/userRepository.js";
import ApiError from "#shared/utils/error.js";
import prisma from "#app/database.js";
import logger from "#app/logger.js";
import Storage from "#shared/utils/storage.js";
import Currency from "#shared/utils/currency.js";
import DateTime from "#shared/utils/datetime.js";

// Mock repositories
jest.mock("#repository/shiftRepository.js");
jest.mock("#repository/settingRepository.js");
jest.mock("#repository/notificationRepository.js");
jest.mock("#repository/userRepository.js");

// Mock Currency
jest.mock("#shared/utils/currency.js", () => ({
  toIDR: jest.fn((amount) => `Rp ${amount?.toLocaleString?.("id-ID") || amount}`),
}));

// Mock DateTime
jest.mock("#shared/utils/datetime.js", () => ({
  toFullID: jest.fn((date) => date ? date.toISOString() : "-"),
  toDuration: jest.fn(() => "12 jam 0 menit"),
}));

// Mock Storage
jest.mock("#shared/utils/storage.js", () => ({
  getSignedUrl: jest.fn().mockResolvedValue("https://signed-url.com/receipt.jpg"),
}));

// Mock prisma
jest.mock("#app/database.js", () => ({
  order: { 
    count: jest.fn().mockResolvedValue(0) 
  },
}));

// Mock logger
jest.mock("#app/logger.js", () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

describe("ShiftService", () => {
  let service;
  let mockShiftRepo;
  let mockSettingRepo;
  let mockNotifRepo;
  let mockUserRepo;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Clear mock instances
    ShiftRepository.mockClear();
    SettingRepository.mockClear();
    NotificationRepository.mockClear();
    UserRepository.mockClear();
    
    service = new ShiftService();

    mockShiftRepo = ShiftRepository.mock.instances[0];
    mockSettingRepo = SettingRepository.mock.instances[0];
    mockNotifRepo = NotificationRepository.mock.instances[0];
    mockUserRepo = UserRepository.mock.instances[0];

    // Default setting mock
    mockSettingRepo.findByKey.mockImplementation((key) => {
      if (key === "shift_min_starting_cash") {
        return Promise.resolve({ value: "1000000" });
      }
      return Promise.resolve(null);
    });

    // Default notification mock
    mockNotifRepo.create.mockResolvedValue({});
  });

  // ============================================================
  // openShift
  // ============================================================
  describe("openShift", () => {
    const cashierId = "cashier-1";
    const startingCash = 1000000;
    const mockCashier = { id: cashierId, fullName: "Kasir 1" };
    const mockShift = {
      id: "shift-1",
      status: "OPEN",
      startingCash: 1000000,
      cashierId,
      openedAt: new Date("2025-01-01T08:00:00"),
    };

    beforeEach(() => {
      mockShiftRepo.hasActiveShift.mockResolvedValue(false);
      mockUserRepo.findById.mockResolvedValue(mockCashier);
      mockShiftRepo.create.mockResolvedValue(mockShift);
    });

    it("should open a new shift successfully", async () => {
      const result = await service.openShift(cashierId, startingCash);

      expect(result.status).toBe("OPEN");
      expect(result.id).toBe("shift-1");
      expect(mockShiftRepo.hasActiveShift).toHaveBeenCalledWith(cashierId);
      expect(mockShiftRepo.create).toHaveBeenCalledWith({ cashierId, startingCash });
      
      // Verify notification sent
      expect(mockNotifRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: cashierId,
          title: expect.stringContaining("Shift Dibuka"),
          type: "SUCCESS",
        })
      );

      expect(logger.info).toHaveBeenCalledWith(
        "Shift berhasil dibuka",
        expect.objectContaining({
          shiftId: "shift-1",
          cashierId,
          startingCash,
        })
      );
    });

    it("should throw BadRequest when starting cash below minimum", async () => {
      mockSettingRepo.findByKey.mockResolvedValue({ value: "1500000" });

      await expect(service.openShift(cashierId, 1000000)).rejects.toThrow(ApiError);

      try {
        await service.openShift(cashierId, 1000000);
      } catch (error) {
        expect(error.statusCode).toBe(400);
        expect(error.message).toContain("Saldo awal minimal");
      }
    });

    it("should use default minimum when setting not found", async () => {
      mockSettingRepo.findByKey.mockResolvedValue(null);

      const result = await service.openShift(cashierId, 1000000);

      expect(result.status).toBe("OPEN");
    });

    it("should throw Conflict when cashier already has active shift", async () => {
      mockShiftRepo.hasActiveShift.mockResolvedValue(true);
      mockShiftRepo.findActiveByCashier.mockResolvedValue({
        id: "shift-existing",
        openedAt: new Date("2025-01-01T07:00:00"),
      });

      await expect(service.openShift(cashierId, startingCash)).rejects.toThrow(ApiError);

      try {
        await service.openShift(cashierId, startingCash);
      } catch (error) {
        expect(error.statusCode).toBe(409);
        expect(error.message).toContain("Kasir sudah memiliki shift aktif");
      }
    });

    it("should handle notification failure gracefully", async () => {
      mockNotifRepo.create.mockRejectedValue(new Error("Notification error"));

      // Should not throw
      const result = await service.openShift(cashierId, startingCash);

      expect(result.status).toBe("OPEN");
      expect(logger.warn).toHaveBeenCalled();
    });
  });

  // ============================================================
  // closeShift
  // ============================================================
  describe("closeShift", () => {
    const shiftId = "shift-1";
    const endingCash = 5500000;
    const mockCashier = { id: "cashier-1", fullName: "Kasir 1" };
    
    const openShift = {
      id: shiftId,
      status: "OPEN",
      startingCash: 1000000,
      cashSales: 5000000,
      cashIn: 200000,
      cashOut: 100000,
      cashierId: "cashier-1",
      openedAt: new Date("2025-01-01T08:00:00"),
      closedAt: null,
    };

    const closedShift = {
      ...openShift,
      status: "CLOSED",
      endingCash: 5500000,
      expectedCash: 6100000,
      discrepancy: -600000,
      closedAt: new Date("2025-01-01T20:00:00"),
    };

    beforeEach(() => {
      mockShiftRepo.findById.mockResolvedValue(openShift);
      prisma.order.count.mockResolvedValue(0);
      mockShiftRepo.close.mockResolvedValue(closedShift);
      mockUserRepo.findById.mockResolvedValue(mockCashier);
      mockUserRepo.findByRole.mockResolvedValue([]);
    });

    it("should close shift successfully", async () => {
      const result = await service.closeShift(shiftId, endingCash);

      expect(result.status).toBe("CLOSED");
      expect(mockShiftRepo.close).toHaveBeenCalledWith(shiftId, {
        endingCash: 5500000,
        expectedCash: 6100000,
        discrepancy: -600000,
      });

      // Verify notification to cashier
      expect(mockNotifRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "cashier-1",
          title: expect.stringContaining("Shift Ditutup"),
          type: "WARNING", // Because there's a discrepancy
        })
      );

      expect(logger.info).toHaveBeenCalledWith(
        "Shift berhasil ditutup",
        expect.objectContaining({
          shiftId,
          endingCash: 5500000,
          expectedCash: 6100000,
          discrepancy: -600000,
        })
      );
    });

    it("should close shift with zero discrepancy (SUCCESS notification)", async () => {
      const perfectShift = {
        ...openShift,
        cashSales: 5000000,
        cashIn: 0,
        cashOut: 0,
      };
      mockShiftRepo.findById.mockResolvedValue(perfectShift);
      mockShiftRepo.close.mockResolvedValue({
        ...perfectShift,
        status: "CLOSED",
        endingCash: 6000000,
        expectedCash: 6000000,
        discrepancy: 0,
        closedAt: new Date(),
      });

      await service.closeShift(shiftId, 6000000);

      expect(mockNotifRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "SUCCESS",
        })
      );
    });

    it("should throw NotFound when shift not found", async () => {
      mockShiftRepo.findById.mockResolvedValue(null);

      await expect(service.closeShift(shiftId, endingCash)).rejects.toThrow(ApiError);

      try {
        await service.closeShift(shiftId, endingCash);
      } catch (error) {
        expect(error.statusCode).toBe(404);
        expect(error.message).toContain("Shift dengan ID 'shift-1' tidak ditemukan");
      }
    });

    it("should throw Conflict when shift already closed", async () => {
      mockShiftRepo.findById.mockResolvedValue({
        ...openShift,
        status: "CLOSED",
        closedAt: new Date("2025-01-01T19:00:00"),
      });

      await expect(service.closeShift(shiftId, endingCash)).rejects.toThrow(ApiError);

      try {
        await service.closeShift(shiftId, endingCash);
      } catch (error) {
        expect(error.statusCode).toBe(409);
        expect(error.message).toContain("Shift sudah ditutup sebelumnya");
      }
    });

    it("should throw Conflict when pending DRAFT orders exist", async () => {
      prisma.order.count.mockResolvedValue(3);

      await expect(service.closeShift(shiftId, endingCash)).rejects.toThrow(ApiError);

      try {
        await service.closeShift(shiftId, endingCash);
      } catch (error) {
        expect(error.statusCode).toBe(409);
        expect(error.message).toContain("Masih ada 3 pesanan yang belum dibayar");
      }
    });

    it("should notify admins when discrepancy is significant (>= 50000)", async () => {
      mockUserRepo.findByRole.mockResolvedValue([
        { id: "admin-1", isActive: true },
        { id: "admin-2", isActive: true },
      ]);
      
      mockShiftRepo.close.mockResolvedValue({
        ...openShift,
        status: "CLOSED",
        endingCash: 4000000,
        expectedCash: 6100000,
        discrepancy: -2100000,
        closedAt: new Date(),
      });

      await service.closeShift(shiftId, 4000000);

      // 1 notification to cashier + 2 notifications to admins = 3
      expect(mockNotifRepo.create).toHaveBeenCalledTimes(3);
      
      // Verify admin notification
      expect(mockNotifRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: expect.stringContaining("Selisih Shift"),
          type: "WARNING",
        })
      );
    });

    it("should not notify admins when discrepancy is small (< 50000)", async () => {
      mockShiftRepo.close.mockResolvedValue({
        ...openShift,
        status: "CLOSED",
        endingCash: 6090000,
        expectedCash: 6100000,
        discrepancy: -10000,
        closedAt: new Date(),
      });

      await service.closeShift(shiftId, 6090000);

      // Only 1 notification (to cashier), no admin notification
      expect(mockNotifRepo.create).toHaveBeenCalledTimes(1);
    });

    it("should not notify admins when no active admins", async () => {
      mockUserRepo.findByRole.mockResolvedValue([
        { id: "admin-1", isActive: false }, // Inactive
      ]);
      
      mockShiftRepo.close.mockResolvedValue({
        ...openShift,
        status: "CLOSED",
        endingCash: 4000000,
        expectedCash: 6100000,
        discrepancy: -2100000,
        closedAt: new Date(),
      });

      await service.closeShift(shiftId, 4000000);

      // Only 1 notification to cashier
      expect(mockNotifRepo.create).toHaveBeenCalledTimes(1);
    });

    it("should handle admin notification failure gracefully", async () => {
      mockUserRepo.findByRole.mockResolvedValue([
        { id: "admin-1", isActive: true },
      ]);
      mockNotifRepo.create
        .mockResolvedValueOnce({}) // Cashier notification success
        .mockRejectedValueOnce(new Error("Admin notification error")); // Admin notification fails
      
      mockShiftRepo.close.mockResolvedValue({
        ...openShift,
        status: "CLOSED",
        endingCash: 4000000,
        expectedCash: 6100000,
        discrepancy: -2100000,
        closedAt: new Date(),
      });

      // Should not throw
      const result = await service.closeShift(shiftId, 4000000);

      expect(result.status).toBe("CLOSED");
    });
  });

  // ============================================================
  // getActiveShift
  // ============================================================
  describe("getActiveShift", () => {
    it("should return active shift when found", async () => {
      const mockShift = {
        id: "shift-1",
        status: "OPEN",
        startingCash: 1000000,
        openedAt: new Date(),
      };
      mockShiftRepo.findActiveByCashier.mockResolvedValue(mockShift);

      const result = await service.getActiveShift("cashier-1");

      expect(result).toEqual(mockShift);
      expect(result.id).toBe("shift-1");
      expect(logger.info).toHaveBeenCalledWith(
        "Mengambil shift aktif kasir",
        expect.objectContaining({
          cashierId: "cashier-1",
          shiftId: "shift-1",
        })
      );
    });

    it("should return null when no active shift", async () => {
      mockShiftRepo.findActiveByCashier.mockResolvedValue(null);

      const result = await service.getActiveShift("cashier-1");

      expect(result).toBeNull();
      expect(logger.info).not.toHaveBeenCalled();
    });
  });

  // ============================================================
  // getShiftById
  // ============================================================
  describe("getShiftById", () => {
    it("should return shift with signed URLs for receipts", async () => {
      const mockShift = {
        id: "shift-1",
        status: "OPEN",
        expenses: [
          { id: "exp1", receipt: { path: "receipts/r1.jpg" } },
          { id: "exp2", receipt: null },
        ],
      };
      mockShiftRepo.findById.mockResolvedValue(mockShift);

      const result = await service.getShiftById("shift-1");

      expect(result.id).toBe("shift-1");
      expect(result.expenses[0].receipt.url).toBe("https://signed-url.com/receipt.jpg");
      expect(Storage.getSignedUrl).toHaveBeenCalledWith("receipts/r1.jpg");
    });

    it("should return shift without expenses", async () => {
      const mockShift = {
        id: "shift-1",
        status: "OPEN",
        expenses: [],
      };
      mockShiftRepo.findById.mockResolvedValue(mockShift);

      const result = await service.getShiftById("shift-1");

      expect(result.expenses).toEqual([]);
    });

    it("should throw NotFound when shift not found", async () => {
      mockShiftRepo.findById.mockResolvedValue(null);

      await expect(service.getShiftById("shift-99")).rejects.toThrow(ApiError);

      try {
        await service.getShiftById("shift-99");
      } catch (error) {
        expect(error.statusCode).toBe(404);
        expect(error.message).toContain("Shift dengan ID 'shift-99' tidak ditemukan");
      }
    });
  });

  // ============================================================
  // getShifts
  // ============================================================
  describe("getShifts", () => {
    it("should return paginated shifts with filters", async () => {
      const mockResult = {
        data: [
          { id: "shift-1", status: "OPEN" },
          { id: "shift-2", status: "CLOSED" },
        ],
        metadata: { total: 2, currentPage: 1, itemsPerPage: 10, totalPages: 1 },
      };
      mockShiftRepo.findMany.mockResolvedValue(mockResult);

      const query = { status: "OPEN", cashierId: "cashier-1" };
      const result = await service.getShifts(query);

      expect(result.data).toHaveLength(2);
      expect(result.metadata.total).toBe(2);
      expect(mockShiftRepo.findMany).toHaveBeenCalledWith(query);
      expect(logger.info).toHaveBeenCalledWith(
        "Mengambil daftar shift",
        expect.objectContaining({
          total: 2,
          page: 1,
          filters: { status: "OPEN", cashierId: "cashier-1" },
        })
      );
    });

    it("should handle empty results", async () => {
      const emptyResult = {
        data: [],
        metadata: { total: 0, currentPage: 1 },
      };
      mockShiftRepo.findMany.mockResolvedValue(emptyResult);

      const result = await service.getShifts();

      expect(result.data).toEqual([]);
    });
  });

  // ============================================================
  // getShiftListByCashierId
  // ============================================================
  describe("getShiftListByCashierId", () => {
    it("should return shifts for specific cashier", async () => {
      const mockResult = {
        data: [{ id: "shift-1", cashierId: "cashier-1" }],
        metadata: { total: 1, currentPage: 1 },
      };
      mockShiftRepo.findMany.mockResolvedValue(mockResult);

      const result = await service.getShiftListByCashierId("cashier-1", { page: 1 });

      expect(result.data).toHaveLength(1);
      expect(mockShiftRepo.findMany).toHaveBeenCalledWith({
        page: 1,
        cashierId: "cashier-1",
      });
      expect(logger.info).toHaveBeenCalledWith(
        "Mengambil daftar shift berdasarkan kasir",
        expect.objectContaining({
          cashierId: "cashier-1",
          total: 1,
        })
      );
    });
  });

  // ============================================================
  // recordCashSale
  // ============================================================
  describe("recordCashSale", () => {
    it("should record cash sale successfully", async () => {
      mockShiftRepo.findById.mockResolvedValue({
        id: "shift-1",
        status: "OPEN",
      });
      mockShiftRepo.updateCashFlow.mockResolvedValue({
        id: "shift-1",
        cashSales: 500000,
      });

      const result = await service.recordCashSale("shift-1", 500000);

      expect(result.cashSales).toBe(500000);
      expect(mockShiftRepo.updateCashFlow).toHaveBeenCalledWith("shift-1", {
        cashSales: 500000,
      });
      expect(logger.info).toHaveBeenCalledWith(
        "Penjualan tunai dicatat",
        expect.objectContaining({
          shiftId: "shift-1",
          amount: 500000,
        })
      );
    });

    it("should throw NotFound when shift not found", async () => {
      mockShiftRepo.findById.mockResolvedValue(null);

      await expect(service.recordCashSale("shift-99", 500000)).rejects.toThrow(ApiError);

      try {
        await service.recordCashSale("shift-99", 500000);
      } catch (error) {
        expect(error.statusCode).toBe(404);
        expect(error.message).toContain("Shift dengan ID 'shift-99' tidak ditemukan");
      }
    });

    it("should throw Conflict when shift is closed", async () => {
      mockShiftRepo.findById.mockResolvedValue({
        id: "shift-1",
        status: "CLOSED",
      });

      await expect(service.recordCashSale("shift-1", 500000)).rejects.toThrow(ApiError);

      try {
        await service.recordCashSale("shift-1", 500000);
      } catch (error) {
        expect(error.statusCode).toBe(409);
        expect(error.message).toContain("Shift sudah ditutup");
      }
    });
  });

  // ============================================================
  // recordCashIn
  // ============================================================
  describe("recordCashIn", () => {
    it("should record cash in successfully with note", async () => {
      mockShiftRepo.findById.mockResolvedValue({
        id: "shift-1",
        status: "OPEN",
        cashierId: "cashier-1",
      });
      mockShiftRepo.updateCashFlow.mockResolvedValue({
        id: "shift-1",
        cashIn: 200000,
      });

      await service.recordCashIn("shift-1", 200000, "Setoran modal");

      expect(mockShiftRepo.updateCashFlow).toHaveBeenCalledWith("shift-1", {
        cashIn: 200000,
      });

      // Verify notification
      expect(mockNotifRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "cashier-1",
          title: expect.stringContaining("Kas Masuk"),
          type: "INFO",
        })
      );

      expect(logger.info).toHaveBeenCalledWith(
        "Kas masuk dicatat",
        expect.objectContaining({
          shiftId: "shift-1",
          amount: 200000,
        })
      );
    });

    it("should record cash in without note", async () => {
      mockShiftRepo.findById.mockResolvedValue({
        id: "shift-1",
        status: "OPEN",
        cashierId: "cashier-1",
      });
      mockShiftRepo.updateCashFlow.mockResolvedValue({
        id: "shift-1",
        cashIn: 100000,
      });

      await service.recordCashIn("shift-1", 100000);

      expect(mockShiftRepo.updateCashFlow).toHaveBeenCalledWith("shift-1", {
        cashIn: 100000,
      });
    });

    it("should throw NotFound when shift not found", async () => {
      mockShiftRepo.findById.mockResolvedValue(null);

      await expect(service.recordCashIn("shift-99", 100000)).rejects.toThrow(ApiError);

      try {
        await service.recordCashIn("shift-99", 100000);
      } catch (error) {
        expect(error.statusCode).toBe(404);
        expect(error.message).toContain("Shift dengan ID 'shift-99' tidak ditemukan");
      }
    });

    it("should throw Conflict when shift is closed", async () => {
      mockShiftRepo.findById.mockResolvedValue({
        id: "shift-1",
        status: "CLOSED",
      });

      await expect(service.recordCashIn("shift-1", 100000)).rejects.toThrow(ApiError);

      try {
        await service.recordCashIn("shift-1", 100000);
      } catch (error) {
        expect(error.statusCode).toBe(409);
        expect(error.message).toContain("Shift sudah ditutup");
      }
    });
  });

  // ============================================================
  // recordCashOut
  // ============================================================
  describe("recordCashOut", () => {
    it("should record cash out successfully with note", async () => {
      mockShiftRepo.findById.mockResolvedValue({
        id: "shift-1",
        status: "OPEN",
        cashierId: "cashier-1",
      });
      mockShiftRepo.updateCashFlow.mockResolvedValue({
        id: "shift-1",
        cashOut: 100000,
      });

      await service.recordCashOut("shift-1", 100000, "Pembelian ATK");

      expect(mockShiftRepo.updateCashFlow).toHaveBeenCalledWith("shift-1", {
        cashOut: 100000,
      });

      // Verify notification
      expect(mockNotifRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "cashier-1",
          title: expect.stringContaining("Kas Keluar"),
          type: "INFO",
        })
      );

      expect(logger.info).toHaveBeenCalledWith(
        "Kas keluar dicatat",
        expect.objectContaining({
          shiftId: "shift-1",
          amount: 100000,
        })
      );
    });

    it("should record cash out without note", async () => {
      mockShiftRepo.findById.mockResolvedValue({
        id: "shift-1",
        status: "OPEN",
        cashierId: "cashier-1",
      });
      mockShiftRepo.updateCashFlow.mockResolvedValue({
        id: "shift-1",
        cashOut: 50000,
      });

      await service.recordCashOut("shift-1", 50000);

      expect(mockShiftRepo.updateCashFlow).toHaveBeenCalledWith("shift-1", {
        cashOut: 50000,
      });
    });

    it("should throw NotFound when shift not found", async () => {
      mockShiftRepo.findById.mockResolvedValue(null);

      await expect(service.recordCashOut("shift-99", 50000)).rejects.toThrow(ApiError);

      try {
        await service.recordCashOut("shift-99", 50000);
      } catch (error) {
        expect(error.statusCode).toBe(404);
        expect(error.message).toContain("Shift dengan ID 'shift-99' tidak ditemukan");
      }
    });

    it("should throw Conflict when shift is closed", async () => {
      mockShiftRepo.findById.mockResolvedValue({
        id: "shift-1",
        status: "CLOSED",
      });

      await expect(service.recordCashOut("shift-1", 50000)).rejects.toThrow(ApiError);

      try {
        await service.recordCashOut("shift-1", 50000);
      } catch (error) {
        expect(error.statusCode).toBe(409);
        expect(error.message).toContain("Shift sudah ditutup");
      }
    });
  });

  // ============================================================
  // validateShiftForOrder
  // ============================================================
  describe("validateShiftForOrder", () => {
    it("should return shift when valid", async () => {
      const mockShift = {
        id: "shift-1",
        status: "OPEN",
        cashierId: "cashier-1",
      };
      mockShiftRepo.findById.mockResolvedValue(mockShift);

      const result = await service.validateShiftForOrder("shift-1", "cashier-1");

      expect(result).toEqual(mockShift);
    });

    it("should throw NotFound when shift not found", async () => {
      mockShiftRepo.findById.mockResolvedValue(null);

      await expect(
        service.validateShiftForOrder("shift-99", "cashier-1")
      ).rejects.toThrow(ApiError);

      try {
        await service.validateShiftForOrder("shift-99", "cashier-1");
      } catch (error) {
        expect(error.statusCode).toBe(404);
        expect(error.message).toContain("Shift dengan ID 'shift-99' tidak ditemukan");
      }
    });

    it("should throw Conflict when shift is closed", async () => {
      mockShiftRepo.findById.mockResolvedValue({
        id: "shift-1",
        status: "CLOSED",
        cashierId: "cashier-1",
        closedAt: new Date(),
      });

      await expect(
        service.validateShiftForOrder("shift-1", "cashier-1")
      ).rejects.toThrow(ApiError);

      try {
        await service.validateShiftForOrder("shift-1", "cashier-1");
      } catch (error) {
        expect(error.statusCode).toBe(409);
        expect(error.message).toContain("Shift sudah ditutup");
      }
    });

    it("should throw Forbidden when cashier mismatch", async () => {
      mockShiftRepo.findById.mockResolvedValue({
        id: "shift-1",
        status: "OPEN",
        cashierId: "other-cashier",
      });

      await expect(
        service.validateShiftForOrder("shift-1", "cashier-1")
      ).rejects.toThrow(ApiError);

      try {
        await service.validateShiftForOrder("shift-1", "cashier-1");
      } catch (error) {
        expect(error.statusCode).toBe(403);
        expect(error.message).toContain("Pesanan harus dibuat oleh kasir yang memiliki shift aktif");
      }
    });
  });

  // ============================================================
  // hasActiveShift
  // ============================================================
  describe("hasActiveShift", () => {
    it("should return true when active shift exists", async () => {
      mockShiftRepo.hasActiveShift.mockResolvedValue(true);

      const result = await service.hasActiveShift("cashier-1");

      expect(result).toBe(true);
      expect(mockShiftRepo.hasActiveShift).toHaveBeenCalledWith("cashier-1");
    });

    it("should return false when no active shift", async () => {
      mockShiftRepo.hasActiveShift.mockResolvedValue(false);

      const result = await service.hasActiveShift("cashier-1");

      expect(result).toBe(false);
    });
  });

  // ============================================================
  // getStartingCashSuggestion
  // ============================================================
  describe("getStartingCashSuggestion", () => {
    it("should return previous shift ending cash when available", async () => {
      mockShiftRepo.findLastShiftByCashier.mockResolvedValue({
        id: "shift-0",
        endingCash: 2500000,
        closedAt: new Date("2025-01-01T20:00:00"),
      });

      const result = await service.getStartingCashSuggestion("cashier-1");

      expect(result.suggestedStartingCash).toBe(2500000);
      expect(result.source).toBe("previous_shift");
      expect(result.message).toContain("Mengacu pada ending cash shift sebelumnya");
      expect(result.lastShift).toBeDefined();
    });

    it("should return default from settings when no previous shift", async () => {
      mockShiftRepo.findLastShiftByCashier.mockResolvedValue(null);

      const result = await service.getStartingCashSuggestion("cashier-1");

      expect(result.suggestedStartingCash).toBe(1000000);
      expect(result.source).toBe("settings");
      expect(result.message).toContain("Menggunakan default dari pengaturan");
      expect(result.lastShift).toBeNull();
    });

    it("should use minimum when last shift ending cash is 0", async () => {
      mockShiftRepo.findLastShiftByCashier.mockResolvedValue({
        id: "shift-0",
        endingCash: 0,
        closedAt: new Date(),
      });

      const result = await service.getStartingCashSuggestion("cashier-1");

      expect(result.suggestedStartingCash).toBe(1000000);
    });

    it("should use last shift ending cash when null", async () => {
      mockShiftRepo.findLastShiftByCashier.mockResolvedValue({
        id: "shift-0",
        endingCash: null,
        closedAt: new Date(),
      });

      const result = await service.getStartingCashSuggestion("cashier-1");

      expect(result.suggestedStartingCash).toBe(1000000);
    });
  });

  // ============================================================
  // getExpectedCash
  // ============================================================
  describe("getExpectedCash", () => {
    it("should calculate expected cash", async () => {
      mockShiftRepo.calculateExpectedCash.mockResolvedValue({
        expectedCash: 5600000,
        startingCash: 1000000,
        cashSales: 5000000,
        cashIn: 200000,
        cashOut: 100000,
      });

      const result = await service.getExpectedCash("shift-1");

      expect(result.expectedCash).toBe(5600000);
      expect(mockShiftRepo.calculateExpectedCash).toHaveBeenCalledWith("shift-1");
      expect(logger.info).toHaveBeenCalledWith(
        "Menghitung expected cash",
        expect.objectContaining({
          shiftId: "shift-1",
          expectedCash: 5600000,
        })
      );
    });

    it("should throw NotFound when shift not found", async () => {
      mockShiftRepo.calculateExpectedCash.mockResolvedValue(null);

      await expect(service.getExpectedCash("shift-99")).rejects.toThrow(ApiError);

      try {
        await service.getExpectedCash("shift-99");
      } catch (error) {
        expect(error.statusCode).toBe(404);
        expect(error.message).toContain("Shift dengan ID 'shift-99' tidak ditemukan");
      }
    });
  });
});