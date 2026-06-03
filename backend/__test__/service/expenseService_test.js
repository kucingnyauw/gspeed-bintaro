import ExpenseService from "#service/expenseService.js";
import ExpenseRepository from "#repository/expenseRepository.js";
import FileRepository from "#repository/fileRepository.js";
import ShiftRepository from "#repository/shiftRepository.js";
import ApiError from "#shared/utils/error.js";
import prisma from "#app/database.js";
import logger from "#app/logger.js";
import Storage from "#shared/utils/storage.js";

jest.mock("#repository/expenseRepository.js");
jest.mock("#repository/fileRepository.js");
jest.mock("#repository/shiftRepository.js");

jest.mock("#shared/utils/storage.js", () => ({
  uploadFile: jest.fn().mockResolvedValue("expenses/file-123.jpg"),
  deleteFile: jest.fn().mockResolvedValue(),
  getSignedUrl: jest.fn().mockResolvedValue("https://signed-url.com/file.jpg"),
}));

jest.mock("#app/database.js", () => ({
  $transaction: jest.fn((callback) =>
    callback({
      expense: {
        create: jest.fn().mockResolvedValue({
          id: "e1",
          title: "Beli ATK",
          amount: 50000,
          shiftId: "s1",
          recordedById: "c1",
          receiptId: null,
          category: "SUPPLIES",
          description: null,
          date: new Date(),
        }),
        update: jest.fn().mockImplementation((args) =>
          Promise.resolve({ id: args.where.id, ...args.data })
        ),
      },
      shift: {
        update: jest.fn().mockResolvedValue({}),
        findUnique: jest.fn().mockResolvedValue({ status: "OPEN" }),
      },
    })
  ),
}));

jest.mock("#app/logger.js", () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

describe("ExpenseService", () => {
  let service;
  let mockExpenseRepo;
  let mockFileRepo;
  let mockShiftRepo;

  beforeEach(() => {
    jest.clearAllMocks();

    ExpenseRepository.mockClear();
    FileRepository.mockClear();
    ShiftRepository.mockClear();

    service = new ExpenseService();

    mockExpenseRepo = ExpenseRepository.mock.instances[0];
    mockFileRepo = FileRepository.mock.instances[0];
    mockShiftRepo = ShiftRepository.mock.instances[0];
  });

  // ============================================================
  // createExpense
  // ============================================================
  describe("createExpense", () => {
    const cashierId = "c1";
    const payload = {
      title: "Beli ATK",
      amount: 50000,
      category: "SUPPLIES",
      description: "Pembelian alat tulis kantor",
    };

    beforeEach(() => {
      mockShiftRepo.findActiveByCashier.mockResolvedValue({
        id: "s1",
        status: "OPEN",
      });
      mockExpenseRepo.findById.mockResolvedValue({
        id: "e1",
        title: "Beli ATK",
        amount: 50000,
        category: "SUPPLIES",
        receipt: null,
        shiftId: "s1",
        recordedById: cashierId,
      });
    });

    it("should create expense without receipt", async () => {
      const result = await service.createExpense(cashierId, payload);

      expect(result.title).toBe("Beli ATK");
      expect(result.amount).toBe(50000);
      expect(prisma.$transaction).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith(
        "Pengeluaran berhasil dibuat",
        expect.objectContaining({
          title: "Beli ATK",
          amount: 50000,
          shiftId: "s1",
          hasReceipt: false,
        })
      );
    });

    it("should create expense with receipt file", async () => {
      mockFileRepo.create.mockResolvedValue({
        id: "f1",
        path: "expenses/file-123.jpg",
      });
      mockExpenseRepo.findById.mockResolvedValue({
        id: "e1",
        receipt: { path: "expenses/file-123.jpg" },
      });

      const receiptFile = {
        originalname: "receipt.jpg",
        mimetype: "image/jpeg",
        size: 1024,
        checksum: "abc123",
      };

      const result = await service.createExpense(
        cashierId,
        { title: "Test", amount: 50000 },
        receiptFile
      );

      expect(result.receipt.path).toBe("expenses/file-123.jpg");
      expect(Storage.uploadFile).toHaveBeenCalledWith(receiptFile, "expenses");
      expect(mockFileRepo.create).toHaveBeenCalledWith({
        path: "expenses/file-123.jpg",
        fileName: "receipt.jpg",
        mimeType: "image/jpeg",
        size: 1024,
        checksum: "abc123",
        uploadedById: cashierId,
      });
    });

    it("should throw NotFound when cashier has no active shift", async () => {
      mockShiftRepo.findActiveByCashier.mockResolvedValue(null);

      await expect(
        service.createExpense(cashierId, payload)
      ).rejects.toThrow(ApiError);

      try {
        await service.createExpense(cashierId, payload);
      } catch (error) {
        expect(error.statusCode).toBe(404);
        expect(error.message).toContain("tidak memiliki shift aktif");
      }
    });

    it("should throw Conflict when shift is closed", async () => {
      mockShiftRepo.findActiveByCashier.mockResolvedValue({
        id: "s1",
        status: "CLOSED",
      });

      await expect(
        service.createExpense(cashierId, payload)
      ).rejects.toThrow(ApiError);

      try {
        await service.createExpense(cashierId, payload);
      } catch (error) {
        expect(error.statusCode).toBe(409);
        expect(error.message).toContain("Shift sudah ditutup");
      }
    });

    it("should use default category OTHER when not provided", async () => {
      mockExpenseRepo.findById.mockResolvedValue({
        id: "e1",
        category: "OTHER",
        receipt: null,
      });

      const result = await service.createExpense(cashierId, {
        title: "Test",
        amount: 10000,
      });

      expect(result.category).toBe("OTHER");
    });

    it("should use default date when not provided", async () => {
      await service.createExpense(cashierId, {
        title: "Test",
        amount: 10000,
      });

      expect(prisma.$transaction).toHaveBeenCalled();
    });
  });

  // ============================================================
  // getExpenseById
  // ============================================================
  describe("getExpenseById", () => {
    it("should return expense with signed receipt URL", async () => {
      mockExpenseRepo.findById.mockResolvedValue({
        id: "e1",
        title: "Beli ATK",
        amount: 50000,
        receipt: { path: "expenses/file.jpg" },
      });

      const result = await service.getExpenseById("e1");

      expect(result.id).toBe("e1");
      expect(result.receipt.url).toBe("https://signed-url.com/file.jpg");
      expect(Storage.getSignedUrl).toHaveBeenCalledWith("expenses/file.jpg");
    });

    it("should return expense without receipt URL when no receipt", async () => {
      mockExpenseRepo.findById.mockResolvedValue({
        id: "e1",
        title: "Beli ATK",
        amount: 50000,
        receipt: null,
      });

      const result = await service.getExpenseById("e1");

      expect(result.receipt).toBeNull();
    });

    it("should throw NotFound when expense not found", async () => {
      mockExpenseRepo.findById.mockResolvedValue(null);

      await expect(service.getExpenseById("e99")).rejects.toThrow(ApiError);

      try {
        await service.getExpenseById("e99");
      } catch (error) {
        expect(error.statusCode).toBe(404);
        expect(error.message).toContain(
          "Pengeluaran dengan ID 'e99' tidak ditemukan"
        );
      }
    });
  });

  // ============================================================
  // updateExpense
  // ============================================================
  describe("updateExpense", () => {
    const existingExpense = {
      id: "e1",
      title: "Old Title",
      amount: 50000,
      shiftId: "s1",
      receiptId: null,
    };

    beforeEach(() => {
      mockExpenseRepo.findById
        .mockResolvedValueOnce(existingExpense) // First call for existing
        .mockResolvedValueOnce({
          // Second call for updated
          id: "e1",
          title: "New Title",
          amount: 75000,
          receipt: null,
        });
    });

    it("should update expense without receipt", async () => {
      const result = await service.updateExpense(
        "e1",
        { title: "New Title", amount: 75000 },
        null,
        "u1"
      );

      expect(result.title).toBe("New Title");
      expect(result.amount).toBe(75000);
      expect(logger.info).toHaveBeenCalledWith(
        "Pengeluaran berhasil diperbarui",
        expect.objectContaining({
          expenseId: "e1",
          previousAmount: 50000,
          newAmount: 75000,
        })
      );
    });

    it("should replace receipt when new file uploaded", async () => {
      // Override mock for this test
      mockExpenseRepo.findById
        .mockReset()
        .mockResolvedValueOnce({
          ...existingExpense,
          receiptId: "f1",
        })
        .mockResolvedValueOnce({
          id: "e1",
          title: "Updated",
          receiptId: "f2",
          receipt: { path: "expenses/new.jpg" },
        });

      mockFileRepo.create.mockResolvedValue({
        id: "f2",
        path: "expenses/new.jpg",
      });
      mockFileRepo.findById.mockResolvedValue({
        id: "f1",
        path: "expenses/old.jpg",
      });

      const receiptFile = {
        originalname: "new.jpg",
        mimetype: "image/jpeg",
        size: 2048,
        checksum: "def456",
      };

      await service.updateExpense(
        "e1",
        { title: "Updated" },
        receiptFile,
        "u1"
      );

      expect(Storage.uploadFile).toHaveBeenCalled();
      expect(mockFileRepo.create).toHaveBeenCalled();
      expect(Storage.deleteFile).toHaveBeenCalledWith("expenses/old.jpg");
      expect(mockFileRepo.delete).toHaveBeenCalledWith("f1");
    });

    it("should handle receipt deletion failure gracefully", async () => {
      mockExpenseRepo.findById
        .mockReset()
        .mockResolvedValueOnce({
          ...existingExpense,
          receiptId: "f1",
        })
        .mockResolvedValueOnce({
          id: "e1",
          title: "Updated",
          receiptId: "f2",
          receipt: null,
        });

      mockFileRepo.create.mockResolvedValue({
        id: "f2",
        path: "expenses/new.jpg",
      });
      mockFileRepo.findById.mockRejectedValue(new Error("File not found"));

      const receiptFile = {
        originalname: "new.jpg",
        mimetype: "image/jpeg",
        size: 2048,
        checksum: "def456",
      };

      // Should not throw
      await service.updateExpense(
        "e1",
        { title: "Updated" },
        receiptFile,
        "u1"
      );

      expect(logger.warn).toHaveBeenCalled();
    });

    it("should throw NotFound when expense not found", async () => {
      mockExpenseRepo.findById.mockReset().mockResolvedValue(null);

      await expect(
        service.updateExpense("e1", {}, null, "u1")
      ).rejects.toThrow(ApiError);

      try {
        await service.updateExpense("e1", {}, null, "u1");
      } catch (error) {
        expect(error.statusCode).toBe(404);
        expect(error.message).toContain(
          "Pengeluaran dengan ID 'e1' tidak ditemukan"
        );
      }
    });

    it("should update shift cashOut when amount changes", async () => {
      mockExpenseRepo.findById
        .mockReset()
        .mockResolvedValueOnce(existingExpense)
        .mockResolvedValueOnce({
          id: "e1",
          title: "Updated",
          amount: 100000,
          receipt: null,
        });

      await service.updateExpense(
        "e1",
        { title: "Updated", amount: 100000 },
        null,
        "u1"
      );

      expect(prisma.$transaction).toHaveBeenCalled();
    });
  });

  // ============================================================
  // getExpenses
  // ============================================================
  describe("getExpenses", () => {
    it("should return expenses with signed URLs", async () => {
      mockExpenseRepo.findMany.mockResolvedValue({
        data: [
          { id: "e1", receipt: { path: "file1.jpg" } },
          { id: "e2", receipt: null },
          { id: "e3", receipt: { path: "file3.jpg" } },
        ],
        metadata: { total: 3, currentPage: 1 },
      });

      const result = await service.getExpenses({ page: 1 });

      expect(result.data).toHaveLength(3);
      expect(result.metadata.total).toBe(3);
      expect(result.data[0].receipt.url).toBe(
        "https://signed-url.com/file.jpg"
      );
      expect(result.data[1].receipt).toBeNull();
      expect(result.data[2].receipt.url).toBe(
        "https://signed-url.com/file.jpg"
      );
    });

    it("should handle empty results", async () => {
      mockExpenseRepo.findMany.mockResolvedValue({
        data: [],
        metadata: { total: 0 },
      });

      const result = await service.getExpenses();

      expect(result.data).toEqual([]);
    });

    it("should pass query filters to repository", async () => {
      mockExpenseRepo.findMany.mockResolvedValue({
        data: [],
        metadata: { total: 0 },
      });

      const query = {
        category: "SUPPLIES",
        shiftId: "s1",
        startDate: "2025-01-01",
      };
      await service.getExpenses(query);

      expect(mockExpenseRepo.findMany).toHaveBeenCalledWith(query);
    });
  });

  // ============================================================
  // getExpensesByShift
  // ============================================================
  describe("getExpensesByShift", () => {
    it("should return shift info and expenses", async () => {
      mockShiftRepo.findById.mockResolvedValue({
        id: "s1",
        cashier: { id: "c1", fullName: "Kasir" },
        openedAt: new Date(),
        closedAt: null,
        status: "OPEN",
      });
      mockExpenseRepo.findMany.mockResolvedValue({
        data: [
          { id: "e1", receipt: { path: "file.jpg" } },
          { id: "e2", receipt: null },
        ],
        metadata: { total: 2 },
      });

      const result = await service.getExpensesByShift("s1");

      expect(result.shift.id).toBe("s1");
      expect(result.shift.cashier.fullName).toBe("Kasir");
      expect(result.shift.status).toBe("OPEN");
      expect(result.expenses).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.expenses[0].receipt.url).toBe(
        "https://signed-url.com/file.jpg"
      );
    });

    it("should throw NotFound when shift not found", async () => {
      mockShiftRepo.findById.mockResolvedValue(null);

      await expect(service.getExpensesByShift("s99")).rejects.toThrow(ApiError);

      try {
        await service.getExpensesByShift("s99");
      } catch (error) {
        expect(error.statusCode).toBe(404);
        expect(error.message).toContain(
          "Shift dengan ID 's99' tidak ditemukan"
        );
      }
    });
  });

  // ============================================================
  // getExpensesByCashier
  // ============================================================
  describe("getExpensesByCashier", () => {
    it("should return cashier expenses with signed URLs", async () => {
      mockExpenseRepo.findMany.mockResolvedValue({
        data: [
          { id: "e1", receipt: { path: "file.jpg" } },
          { id: "e2", receipt: null },
        ],
        metadata: { total: 2 },
      });

      const result = await service.getExpensesByCashier("c1", {
        page: 1,
        category: "SUPPLIES",
      });

      expect(result.data).toHaveLength(2);
      expect(result.data[0].receipt.url).toBe(
        "https://signed-url.com/file.jpg"
      );
      expect(mockExpenseRepo.findMany).toHaveBeenCalledWith({
        page: 1,
        category: "SUPPLIES",
        recordedById: "c1",
      });
    });
  });

  // ============================================================
  // deleteExpense
  // ============================================================
  describe("deleteExpense", () => {
    it("should delete expense without receipt", async () => {
      mockExpenseRepo.findById.mockResolvedValue({
        id: "e1",
        title: "Test",
        amount: 50000,
        receiptId: null,
      });
      mockExpenseRepo.delete.mockResolvedValue(undefined);

      await service.deleteExpense("e1");

      expect(mockExpenseRepo.delete).toHaveBeenCalledWith("e1");
      expect(logger.info).toHaveBeenCalledWith(
        "Pengeluaran berhasil dihapus",
        expect.objectContaining({
          expenseId: "e1",
          title: "Test",
          amount: 50000,
        })
      );
    });

    it("should delete expense with receipt file", async () => {
      mockExpenseRepo.findById.mockResolvedValue({
        id: "e1",
        title: "Test",
        amount: 50000,
        receiptId: "f1",
      });
      mockFileRepo.findById.mockResolvedValue({
        id: "f1",
        path: "expenses/file.jpg",
      });
      mockExpenseRepo.delete.mockResolvedValue(undefined);

      await service.deleteExpense("e1");

      expect(Storage.deleteFile).toHaveBeenCalledWith("expenses/file.jpg");
      expect(mockFileRepo.delete).toHaveBeenCalledWith("f1");
      expect(mockExpenseRepo.delete).toHaveBeenCalledWith("e1");
    });

    it("should throw NotFound when expense not found", async () => {
      mockExpenseRepo.findById.mockResolvedValue(null);

      await expect(service.deleteExpense("e99")).rejects.toThrow(ApiError);

      try {
        await service.deleteExpense("e99");
      } catch (error) {
        expect(error.statusCode).toBe(404);
        expect(error.message).toContain(
          "Pengeluaran dengan ID 'e99' tidak ditemukan"
        );
      }
    });

    it("should handle receipt deletion failure gracefully", async () => {
      mockExpenseRepo.findById.mockResolvedValue({
        id: "e1",
        title: "Test",
        amount: 50000,
        receiptId: "f1",
      });
      mockFileRepo.findById.mockRejectedValue(new Error("File error"));
      mockExpenseRepo.delete.mockResolvedValue(undefined);

      // Should still delete expense even if receipt deletion fails
      await service.deleteExpense("e1");

      expect(mockExpenseRepo.delete).toHaveBeenCalledWith("e1");
      expect(logger.warn).toHaveBeenCalled();
    });
  });

  // ============================================================
  // deleteExpenses (Bulk)
  // ============================================================
  describe("deleteExpenses", () => {
    it("should delete multiple expenses successfully", async () => {
      mockExpenseRepo.findById
        .mockResolvedValueOnce({ id: "e1", title: "Exp 1", receiptId: null })
        .mockResolvedValueOnce({ id: "e2", title: "Exp 2", receiptId: null });

      mockExpenseRepo.deleteMany.mockResolvedValue({
        success: [{ id: "e1" }, { id: "e2" }],
        failed: [],
      });

      const result = await service.deleteExpenses(["e1", "e2"]);

      expect(result.summary.total).toBe(2);
      expect(result.summary.deleted).toBe(2);
      expect(result.summary.failed).toBe(0);
      expect(mockExpenseRepo.deleteMany).toHaveBeenCalledWith(["e1", "e2"]);
      expect(logger.info).toHaveBeenCalledWith(
        "Bulk delete pengeluaran selesai",
        expect.objectContaining({
          summary: expect.any(Object),
        })
      );
    });

    it("should throw BadRequest when expenseIds is empty", async () => {
      await expect(service.deleteExpenses([])).rejects.toThrow(ApiError);

      try {
        await service.deleteExpenses([]);
      } catch (error) {
        expect(error.statusCode).toBe(400);
        expect(error.message).toContain("Tidak ada pengeluaran yang dipilih");
      }
    });

    it("should throw BadRequest when expenseIds is null", async () => {
      await expect(service.deleteExpenses(null)).rejects.toThrow(ApiError);
    });

    it("should skip non-existent expenses", async () => {
      mockExpenseRepo.findById.mockResolvedValue(null);
      mockExpenseRepo.deleteMany.mockResolvedValue({
        success: [],
        failed: [],
      });

      await expect(
        service.deleteExpenses(["e99", "e100"])
      ).rejects.toThrow(ApiError);

      try {
        await service.deleteExpenses(["e99", "e100"]);
      } catch (error) {
        expect(error.statusCode).toBe(400);
        expect(error.message).toContain(
          "Tidak ada pengeluaran yang valid untuk dihapus"
        );
        expect(error.details).toHaveLength(2);
        expect(error.details[0].reason).toBe("Pengeluaran tidak ditemukan");
      }
    });

    it("should delete receipts for expenses that have them", async () => {
      mockExpenseRepo.findById
        .mockResolvedValueOnce({
          id: "e1",
          title: "Exp 1",
          receiptId: "f1",
        })
        .mockResolvedValueOnce({
          id: "e2",
          title: "Exp 2",
          receiptId: null,
        });

      mockFileRepo.findById.mockResolvedValue({
        id: "f1",
        path: "expenses/file.jpg",
      });
      mockExpenseRepo.deleteMany.mockResolvedValue({
        success: [{ id: "e1" }, { id: "e2" }],
        failed: [],
      });

      await service.deleteExpenses(["e1", "e2"]);

      expect(Storage.deleteFile).toHaveBeenCalledWith("expenses/file.jpg");
      expect(mockFileRepo.delete).toHaveBeenCalledWith("f1");
    });

    it("should handle mixed scenarios (some valid, some skipped)", async () => {
      mockExpenseRepo.findById
        .mockResolvedValueOnce({ id: "e1", title: "Valid", receiptId: null })
        .mockResolvedValueOnce(null); // Not found

      mockExpenseRepo.deleteMany.mockResolvedValue({
        success: [{ id: "e1" }],
        failed: [],
      });

      const result = await service.deleteExpenses(["e1", "e99"]);

      expect(result.summary.total).toBe(2);
      expect(result.summary.valid).toBe(1);
      expect(result.summary.skipped).toBe(1);
      expect(result.summary.deleted).toBe(1);
      expect(result.details.skipped[0].reason).toBe(
        "Pengeluaran tidak ditemukan"
      );
    });

    it("should handle partial failures from repository", async () => {
      mockExpenseRepo.findById.mockResolvedValue({
        id: "e1",
        title: "Exp 1",
        receiptId: null,
      });
      mockExpenseRepo.deleteMany.mockResolvedValue({
        success: [{ id: "e1" }],
        failed: [{ id: "e2", reason: "Database error" }],
      });

      const result = await service.deleteExpenses(["e1", "e2"]);

      expect(result.summary.deleted).toBe(1);
      expect(result.summary.failed).toBe(1);
      expect(result.details.failed).toHaveLength(1);
    });
  });
});