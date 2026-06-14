import ExpenseRepository from "#repository/expenseRepository.js";
import FileRepository from "#repository/fileRepository.js";
import ShiftRepository from "#repository/shiftRepository.js";
import NotificationRepository from "#repository/notificationRepository.js";
import UserRepository from "#repository/userRepository.js";
import ApiError from "#shared/utils/error.js";
import Currency from "#shared/utils/currency.js";
import DateTime from "#shared/utils/datetime.js";
import Storage from "#shared/utils/storage.js";
import prisma from "#app/database.js";
import logger from "#app/logger.js";

/**
 * Service untuk mengelola logika bisnis pengeluaran
 * @class ExpenseService
 */
class ExpenseService {
  constructor() {
    this.expenseRepo = new ExpenseRepository();
    this.shiftRepo = new ShiftRepository();
    this.fileRepo = new FileRepository();
    this.notifRepo = new NotificationRepository();
    this.userRepo = new UserRepository();
  }

  /**
   * Upload file bukti pengeluaran
   * @param {Object} file - File dari middleware
   * @param {string} userId - ID user
   * @returns {Promise<Object>} File record
   * @private
   */
  async #uploadReceipt(file, userId) {
    const path = await Storage.uploadFile(file, "expenses");
    return this.fileRepo.create({
      path: path,
      fileName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      checksum: file.checksum,
      uploadedById: userId,
    });
  }

  /**
   * Menghapus file bukti lama
   * @param {string} fileId - ID file
   * @param {string} expenseId - ID pengeluaran
   * @returns {Promise<void>}
   * @private
   */
  async #deleteReceipt(fileId, expenseId) {
    try {
      const oldFile = await this.fileRepo.findById(fileId);
      if (oldFile) {
        await Storage.deleteFile(oldFile.path);
        await this.fileRepo.delete(oldFile.id);
      }
    } catch (err) {
      logger.warn("Gagal membersihkan file bukti lama", {
        expenseId,
        fileId,
        error: err.message,
      });
    }
  }

  /**
   * Mendapatkan label kategori dalam Bahasa Indonesia
   * @param {string} category
   * @returns {string}
   * @private
   */
  #getCategoryLabel(category) {
    const labels = {
      SUPPLIES: "Perlengkapan",
      MAINTENANCE: "Perawatan",
      UTILITIES: "Utilitas",
      RENT: "Sewa",
      OTHER: "Lainnya",
    };
    return labels[category] || category;
  }

  /**
   * Build notifikasi pengeluaran dalam format Markdown
   * @param {Object} params
   * @param {string} params.eventTitle
   * @param {Object} params.expense
   * @param {string} [params.cashierName]
   * @param {string} [params.shiftInfo]
   * @param {boolean} [params.hasReceipt]
   * @returns {string}
   * @private
   */
  #buildExpenseNotification({
    eventTitle,
    expense,
    cashierName,
    shiftInfo,
    hasReceipt,
  }) {
    const lines = [];

    lines.push(`## ${eventTitle}`);
    lines.push("");

    lines.push(`**Judul:** ${expense.title}`);
    if (expense.description)
      lines.push(`**Deskripsi:** ${expense.description}`);
    lines.push(`**Jumlah:** ${Currency.toIDR(expense.amount)}`);
    lines.push(`**Kategori:** ${this.#getCategoryLabel(expense.category)}`);
    lines.push(`**Tanggal:** ${DateTime.toFullID(expense.date || new Date())}`);

    if (cashierName) lines.push(`**Dicatat Oleh:** ${cashierName}`);
    if (shiftInfo) lines.push(`**Shift:** ${shiftInfo}`);
    if (hasReceipt) lines.push(`**Bukti:** Terlampir`);

    lines.push("");
    lines.push(`**Waktu:** ${DateTime.toFullID(new Date())}`);

    return lines.join("\n");
  }

  /**
   * Mengirim notifikasi ke user
   * @param {string} userId
   * @param {string} title
   * @param {string} message
   * @param {string} [type="INFO"]
   * @returns {Promise<void>}
   * @private
   */
  async #sendNotification(userId, title, message, type = "INFO") {
    if (!userId) return;
    try {
      await this.notifRepo.create({ title, message, type, userId });
    } catch (err) {
      logger.warn("Gagal mengirim notifikasi expense", {
        userId,
        error: err.message,
      });
    }
  }

  /**
   * Mengirim notifikasi ke semua admin
   * @param {string} title
   * @param {string} message
   * @param {string} [type="INFO"]
   * @returns {Promise<void>}
   * @private
   */
  async #notifyAdmins(title, message, type = "INFO") {
    try {
      const admins = await this.userRepo.findByRole("ADMIN");
      const activeAdmins = admins.filter((a) => a.isActive);
      if (activeAdmins.length > 0) {
        await Promise.all(
          activeAdmins.map((admin) =>
            this.notifRepo.create({ title, message, type, userId: admin.id })
          )
        );
      }
    } catch (err) {
      logger.warn("Gagal mengirim notifikasi ke admin", { error: err.message });
    }
  }

  /**
   * Membuat pengeluaran baru
   * @param {string} cashierId - ID kasir (sekaligus sebagai pencatat)
   * @param {Object} payload - Data pengeluaran
   * @param {string} payload.title - Judul pengeluaran
   * @param {string} [payload.description] - Deskripsi
   * @param {number} payload.amount - Jumlah
   * @param {string} [payload.category] - Kategori
   * @param {string|Date} [payload.date] - Tanggal pengeluaran
   * @param {Object} [receiptFile] - File bukti pembayaran
   * @returns {Promise<Object>} Pengeluaran yang berhasil dibuat
   * @throws {ApiError} 404 - Shift tidak ditemukan
   * @throws {ApiError} 409 - Shift sudah ditutup
   */
  async createExpense(cashierId, payload, receiptFile) {
    const { amount, category } = payload;

    const activeShift = await this.shiftRepo.findActiveByCashier(cashierId);
    if (!activeShift) {
      throw ApiError.notFound({
        message: `Kasir dengan ID '${cashierId}' tidak memiliki shift aktif.`,
      });
    }

    if (activeShift.status !== "OPEN") {
      throw ApiError.conflict({
        message: "Shift sudah ditutup, tidak dapat mencatat pengeluaran baru.",
      });
    }

    const shiftId = activeShift.id;
    let receiptId = null;

    if (receiptFile) {
      const fileRecord = await this.#uploadReceipt(receiptFile, cashierId);
      receiptId = fileRecord.id;
    }

    const expense = await prisma.$transaction(async (tx) => {
      const newExpense = await tx.expense.create({
        data: {
          title: payload.title,
          description: payload.description,
          amount,
          category: category || "OTHER",
          date: payload.date || new Date(),
          shiftId,
          recordedById: cashierId,
          receiptId,
        },
      });

      await tx.shift.update({
        where: { id: shiftId },
        data: { cashOut: { increment: amount } },
      });

      return newExpense;
    });

    const cashier = await this.userRepo.findById(cashierId);

    const notificationMessage = this.#buildExpenseNotification({
      eventTitle: "Pengeluaran Baru Dicatat",
      expense,
      cashierName: cashier?.fullName || "-",
      shiftInfo: activeShift.id,
      hasReceipt: !!receiptId,
    });

    await this.#sendNotification(
      cashierId,
      `Pengeluaran - ${Currency.toIDR(amount)}`,
      notificationMessage,
      "INFO"
    );

    if (amount >= 500000) {
      const adminMessage = this.#buildExpenseNotification({
        eventTitle: "Pengeluaran Signifikan",
        expense,
        cashierName: cashier?.fullName || "-",
        shiftInfo: activeShift.id,
        hasReceipt: !!receiptId,
      });

      await this.#notifyAdmins(
        `Pengeluaran Besar - ${Currency.toIDR(amount)}`,
        adminMessage,
        "WARNING"
      );
    }

    logger.info("Pengeluaran berhasil dibuat", {
      expenseId: expense.id,
      title: expense.title,
      amount,
      shiftId,
      recordedById: cashierId,
      hasReceipt: !!receiptId,
    });

    return this.expenseRepo.findById(expense.id);
  }

  /**
   * Mendapatkan pengeluaran berdasarkan ID
   * @param {string} expenseId - ID pengeluaran
   * @returns {Promise<Object>} Detail pengeluaran
   * @throws {ApiError} 404 - Pengeluaran tidak ditemukan
   */
  async getExpenseById(expenseId) {
    const expense = await this.expenseRepo.findById(expenseId);
    if (!expense)
      throw ApiError.notFound({
        message: `Pengeluaran dengan ID '${expenseId}' tidak ditemukan.`,
      });

    if (expense.receipt && expense.receipt.path) {
      const signedUrl = await Storage.getSignedUrl(expense.receipt.path);
      expense.receipt.url = signedUrl;
    }

    return expense;
  }

  /**
   * Memperbarui pengeluaran
   * @param {string} expenseId - ID pengeluaran
   * @param {Object} payload - Data yang akan diupdate
   * @param {string} [payload.title] - Judul baru
   * @param {string} [payload.description] - Deskripsi baru
   * @param {number} [payload.amount] - Jumlah baru
   * @param {string} [payload.category] - Kategori baru
   * @param {string|Date} [payload.date] - Tanggal baru
   * @param {Object} [receiptFile] - File bukti baru
   * @param {string} userId - ID user yang melakukan update
   * @returns {Promise<Object>} Pengeluaran yang sudah diperbarui
   * @throws {ApiError} 404 - Pengeluaran tidak ditemukan
   */
  async updateExpense(expenseId, payload, receiptFile, userId) {
    const existingExpense = await this.expenseRepo.findById(expenseId);
    if (!existingExpense)
      throw ApiError.notFound({
        message: `Pengeluaran dengan ID '${expenseId}' tidak ditemukan.`,
      });

    let receiptId = existingExpense.receiptId;

    if (receiptFile) {
      const newFileRecord = await this.#uploadReceipt(receiptFile, userId);
      receiptId = newFileRecord.id;
      if (existingExpense.receiptId)
        await this.#deleteReceipt(existingExpense.receiptId, expenseId);
    }

    const updatedExpense = await prisma.$transaction(async (tx) => {
      const expense = await tx.expense.update({
        where: { id: expenseId },
        data: { ...payload, receiptId },
      });

      if (
        existingExpense.shiftId &&
        payload.amount &&
        payload.amount !== existingExpense.amount
      ) {
        const shift = await tx.shift.findUnique({
          where: { id: existingExpense.shiftId },
          select: { status: true },
        });
        if (shift && shift.status === "OPEN") {
          const diff = payload.amount - existingExpense.amount;
          await tx.shift.update({
            where: { id: existingExpense.shiftId },
            data: { cashOut: { increment: diff } },
          });
        }
      }

      return expense;
    });

    const user = await this.userRepo.findById(userId);

    const notificationMessage = this.#buildExpenseNotification({
      eventTitle: "Pengeluaran Diperbarui",
      expense: updatedExpense,
      cashierName: user?.fullName || "-",
    });

    await this.#sendNotification(
      existingExpense.recordedById,
      `Pengeluaran Diperbarui - ${Currency.toIDR(updatedExpense.amount)}`,
      notificationMessage,
      "INFO"
    );

    logger.info("Pengeluaran berhasil diperbarui", {
      expenseId,
      previousAmount: existingExpense.amount,
      newAmount: updatedExpense.amount,
      userId,
    });

    return this.expenseRepo.findById(expenseId);
  }

  /**
   * Mendapatkan daftar pengeluaran
   * @param {Object} [query={}] - Parameter query
   * @param {number} [query.page] - Nomor halaman
   * @param {number} [query.limit] - Jumlah item per halaman
   * @param {string} [query.category] - Filter berdasarkan kategori
   * @param {string} [query.shiftId] - Filter berdasarkan shift
   * @param {string} [query.recordedById] - Filter berdasarkan user pencatat
   * @param {string|Date} [query.startDate] - Filter tanggal mulai
   * @param {string|Date} [query.endDate] - Filter tanggal akhir
   * @param {string} [query.search] - Pencarian berdasarkan judul
   * @returns {Promise<{data: Array, metadata: Object}>} Daftar pengeluaran
   */
  async getExpenses(query = {}) {
    const result = await this.expenseRepo.findMany(query);

    for (const expense of result.data) {
      if (expense.receipt && expense.receipt.path) {
        const signedUrl = await Storage.getSignedUrl(expense.receipt.path);
        expense.receipt.url = signedUrl;
      }
    }

    return result;
  }

  /**
   * Mendapatkan pengeluaran berdasarkan shift
   * @param {string} shiftId - ID shift
   * @returns {Promise<Object>} Daftar pengeluaran dalam shift
   * @throws {ApiError} 404 - Shift tidak ditemukan
   */
  async getExpensesByShift(shiftId) {
    const shift = await this.shiftRepo.findById(shiftId);
    if (!shift)
      throw ApiError.notFound({
        message: `Shift dengan ID '${shiftId}' tidak ditemukan.`,
      });

    const result = await this.expenseRepo.findMany({ shiftId });

    for (const expense of result.data) {
      if (expense.receipt && expense.receipt.path) {
        const signedUrl = await Storage.getSignedUrl(expense.receipt.path);
        expense.receipt.url = signedUrl;
      }
    }

    return {
      shift: {
        id: shift.id,
        cashier: shift.cashier,
        openedAt: shift.openedAt,
        closedAt: shift.closedAt,
        status: shift.status,
      },
      expenses: result.data,
      total: result.metadata.total,
    };
  }

  /**
   * Mendapatkan pengeluaran berdasarkan kasir
   * @param {string} cashierId - ID kasir
   * @param {Object} [query={}] - Parameter query tambahan
   * @returns {Promise<{data: Array, metadata: Object}>} Daftar pengeluaran kasir
   */
  async getExpensesByCashier(cashierId, query = {}) {
    const result = await this.expenseRepo.findMany({
      ...query,
      recordedById: cashierId,
    });

    for (const expense of result.data) {
      if (expense.receipt && expense.receipt.path) {
        const signedUrl = await Storage.getSignedUrl(expense.receipt.path);
        expense.receipt.url = signedUrl;
      }
    }

    return result;
  }

  /**
   * Menghapus pengeluaran
   * @param {string} expenseId - ID pengeluaran
   * @returns {Promise<void>}
   * @throws {ApiError} 404 - Pengeluaran tidak ditemukan
   */
  async deleteExpense(expenseId) {
    const expense = await this.expenseRepo.findById(expenseId);
    if (!expense)
      throw ApiError.notFound({
        message: `Pengeluaran dengan ID '${expenseId}' tidak ditemukan.`,
      });

    if (expense.receiptId)
      await this.#deleteReceipt(expense.receiptId, expenseId);

    await this.expenseRepo.delete(expenseId);

    const notificationMessage = this.#buildExpenseNotification({
      eventTitle: "Pengeluaran Dihapus",
      expense,
    });

    await this.#sendNotification(
      expense.recordedById,
      `Pengeluaran Dihapus - ${Currency.toIDR(expense.amount)}`,
      notificationMessage,
      "WARNING"
    );

    logger.info("Pengeluaran berhasil dihapus", {
      expenseId,
      title: expense.title,
      amount: expense.amount,
    });
  }

  /**
   * Menghapus banyak pengeluaran sekaligus
   * @param {string[]} expenseIds - Array ID pengeluaran
   * @returns {Promise<{summary: Object, details: Object}>} Ringkasan dan detail hasil penghapusan
   * @throws {ApiError} 400 - Tidak ada pengeluaran yang dipilih
   */
  async deleteExpenses(expenseIds) {
    if (!expenseIds || expenseIds.length === 0) {
      throw ApiError.badRequest({
        message: "Gagal menghapus. Tidak ada pengeluaran yang dipilih.",
      });
    }

    const validIds = [];
    const skippedExpenses = [];

    for (const id of expenseIds) {
      const expense = await this.expenseRepo.findById(id);
      if (!expense) {
        skippedExpenses.push({ id, reason: "Pengeluaran tidak ditemukan" });
        continue;
      }

      if (expense.receiptId) {
        await this.#deleteReceipt(expense.receiptId, id);
      }

      validIds.push(id);
    }

    if (validIds.length === 0) {
      throw ApiError.badRequest({
        message:
          "Gagal menghapus. Tidak ada pengeluaran yang valid untuk dihapus.",
        details: skippedExpenses,
      });
    }

    const deleteResults = await this.expenseRepo.deleteMany(validIds);

    const summary = {
      total: expenseIds.length,
      valid: validIds.length,
      skipped: skippedExpenses.length,
      deleted: deleteResults.success.length,
      failed: deleteResults.failed.length,
    };

    logger.info("Bulk delete pengeluaran selesai", {
      summary,
      skippedExpenses,
      failedDeletes: deleteResults.failed,
    });

    return {
      summary,
      details: {
        deleted: deleteResults.success,
        failed: deleteResults.failed,
        skipped: skippedExpenses,
      },
    };
  }
}

export default ExpenseService;
