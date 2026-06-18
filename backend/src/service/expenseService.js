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

class ExpenseService {
  constructor() {
    this.expenseRepo = new ExpenseRepository();
    this.shiftRepo = new ShiftRepository();
    this.fileRepo = new FileRepository();
    this.notifRepo = new NotificationRepository();
    this.userRepo = new UserRepository();
  }

  /**
   * Validasi bahwa shift terkait masih terbuka khusus untuk kasir.
   * Admin tidak terikat shift sehingga tidak divalidasi.
   * @param {string} expenseId - ID pengeluaran
   * @returns {Promise<Object>} Data pengeluaran
   * @throws {ApiError} 404 - Pengeluaran tidak ditemukan
   * @throws {ApiError} 409 - Shift sudah ditutup
   * @private
   */
  async #validateShiftOpen(expenseId) {
    const expense = await this.expenseRepo.findById(expenseId);
    if (!expense) {
      throw ApiError.notFound({
        message: `Pengeluaran dengan ID '${expenseId}' tidak ditemukan.`,
      });
    }

    if (
      expense.recordedBy &&
      expense.recordedBy.role === "CASHIER" &&
      expense.shift
    ) {
      if (expense.shift.status !== "OPEN") {
        throw ApiError.conflict({
          message: "Shift sudah ditutup, pengeluaran tidak dapat dihapus.",
        });
      }
    }

    return expense;
  }

  /**
   * Upload file bukti pengeluaran ke storage
   * @param {Object} file - File dari middleware
   * @param {string} userId - ID user pengupload
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
   * Menghapus file bukti lama dari storage dan database.
   * Tidak throw error untuk mencegah transaction gagal.
   * @param {string} fileId - ID file
   * @param {string} expenseId - ID pengeluaran terkait
   * @returns {Promise<boolean>} Status keberhasilan penghapusan
   * @private
   */
  async #deleteReceipt(fileId, expenseId) {
    try {
      const oldFile = await this.fileRepo.findById(fileId);
      if (oldFile) {
        await Storage.deleteFile(oldFile.path);
        await this.fileRepo.delete(oldFile.id);
      }
      return true;
    } catch (err) {
      logger.warn("Gagal membersihkan file bukti lama", {
        expenseId,
        fileId,
        error: err.message,
      });
      return false;
    }
  }

  /**
   * Mendapatkan label kategori dalam Bahasa Indonesia
   * @param {string} category - Kategori pengeluaran
   * @returns {string} Label kategori
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
   * @param {string} params.eventTitle - Judul event notifikasi
   * @param {Object} params.expense - Data pengeluaran
   * @param {string} [params.cashierName] - Nama kasir
   * @param {string} [params.shiftInfo] - Informasi shift
   * @param {boolean} [params.hasReceipt] - Status keberadaan bukti
   * @returns {string} Pesan notifikasi format Markdown
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
   * Mengirim notifikasi ke user tertentu
   * @param {string} userId - ID user penerima
   * @param {string} title - Judul notifikasi
   * @param {string} message - Pesan notifikasi
   * @param {string} [type="INFO"] - Tipe notifikasi
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
   * Mengirim notifikasi ke semua admin aktif
   * @param {string} title - Judul notifikasi
   * @param {string} message - Pesan notifikasi
   * @param {string} [type="INFO"] - Tipe notifikasi
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
   * Membuat pengeluaran baru.
   * Admin tidak memerlukan shift aktif, kasir harus memiliki shift aktif.
   * @param {string} userId - ID user pencatat
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
  async createExpense(userId, payload, receiptFile) {
    const { amount, category } = payload;
    const user = await this.userRepo.findById(userId);
    let shiftId = null;

    if (user.role === "CASHIER") {
      const activeShift = await this.shiftRepo.findActiveByCashier(userId);
      if (!activeShift) {
        throw ApiError.notFound({
          message: `Kasir dengan ID '${userId}' tidak memiliki shift aktif.`,
        });
      }

      if (activeShift.status !== "OPEN") {
        throw ApiError.conflict({
          message:
            "Shift sudah ditutup, tidak dapat mencatat pengeluaran baru.",
        });
      }

      shiftId = activeShift.id;
    }

    let receiptId = null;

    if (receiptFile) {
      const fileRecord = await this.#uploadReceipt(receiptFile, userId);
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
          recordedById: userId,
          receiptId,
        },
      });

      if (shiftId) {
        await tx.shift.update({
          where: { id: shiftId },
          data: { cashOut: { increment: amount } },
        });
      }

      return newExpense;
    });

    const notificationMessage = this.#buildExpenseNotification({
      eventTitle: "Pengeluaran Baru Dicatat",
      expense,
      cashierName: user?.fullName || "-",
      shiftInfo: shiftId || "Non-Shift",
      hasReceipt: !!receiptId,
    });

    await this.#sendNotification(
      userId,
      `Pengeluaran - ${Currency.toIDR(amount)}`,
      notificationMessage,
      "INFO"
    );

    if (amount >= 500000) {
      const adminMessage = this.#buildExpenseNotification({
        eventTitle: "Pengeluaran Signifikan",
        expense,
        cashierName: user?.fullName || "-",
        shiftInfo: shiftId || "Non-Shift",
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
      recordedById: userId,
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
   * Memperbarui pengeluaran.
   * Hanya kasir yang divalidasi shiftnya, admin bebas mengupdate.
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
   * @throws {ApiError} 409 - Shift sudah ditutup
   */
  async updateExpense(expenseId, payload, receiptFile, userId) {
    const existingExpense = await this.expenseRepo.findById(expenseId);
    if (!existingExpense)
      throw ApiError.notFound({
        message: `Pengeluaran dengan ID '${expenseId}' tidak ditemukan.`,
      });

    if (
      existingExpense.recordedBy &&
      existingExpense.recordedBy.role === "CASHIER" &&
      existingExpense.shift
    ) {
      if (existingExpense.shift.status !== "OPEN") {
        throw ApiError.conflict({
          message: "Shift sudah ditutup, pengeluaran tidak dapat diperbarui.",
        });
      }
    }

    let receiptId = existingExpense.receiptId;

    if (receiptFile) {
      const newFileRecord = await this.#uploadReceipt(receiptFile, userId);
      receiptId = newFileRecord.id;
      if (existingExpense.receiptId) {
        await this.#deleteReceipt(existingExpense.receiptId, expenseId);
      }
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
      existingExpense.recordedBy?.id,
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
   * Mendapatkan daftar pengeluaran dengan filter dan paginasi
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
   * Mendapatkan pengeluaran berdasarkan user (admin atau kasir)
   * @param {string} userId - ID user
   * @param {Object} [query={}] - Parameter query tambahan
   * @returns {Promise<{data: Array, metadata: Object}>} Daftar pengeluaran user
   */
  async getExpensesByUser(userId, query = {}) {
    const result = await this.expenseRepo.findMany({
      ...query,
      recordedById: userId,
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
   * Menghapus pengeluaran.
   * Admin bebas menghapus, kasir hanya bisa jika shift masih terbuka.
   * @param {string} expenseId - ID pengeluaran
   * @returns {Promise<void>}
   * @throws {ApiError} 404 - Pengeluaran tidak ditemukan
   * @throws {ApiError} 409 - Shift sudah ditutup
   */
  async deleteExpense(expenseId) {
    const expense = await this.#validateShiftOpen(expenseId);

    if (expense.receiptId) {
      await this.#deleteReceipt(expense.receiptId, expenseId);
    }

    await prisma.$transaction(async (tx) => {
      if (expense.shiftId) {
        await tx.shift.update({
          where: { id: expense.shiftId },
          data: { cashOut: { decrement: expense.amount } },
        });
      }

      await tx.expense.delete({
        where: { id: expenseId },
      });
    });

    const notificationMessage = this.#buildExpenseNotification({
      eventTitle: "Pengeluaran Dihapus",
      expense,
    });

    await this.#sendNotification(
      expense.recordedBy?.id,
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
   * Menghapus banyak pengeluaran sekaligus.
   * Admin bebas menghapus, kasir hanya bisa jika shift masih terbuka.
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
      try {
        const expense = await this.#validateShiftOpen(id);
        validIds.push(expense);
      } catch (err) {
        skippedExpenses.push({
          id,
          reason: err.message || "Gagal memvalidasi pengeluaran",
        });
      }
    }

    for (const expense of validIds) {
      if (expense.receiptId) {
        await this.#deleteReceipt(expense.receiptId, expense.id);
      }

      if (expense.shiftId) {
        await prisma.$transaction(async (tx) => {
          await tx.shift.update({
            where: { id: expense.shiftId },
            data: { cashOut: { decrement: expense.amount } },
          });

          await tx.expense.delete({
            where: { id: expense.id },
          });
        });
      }
    }

    const validExpenseIds = validIds.map((e) => e.id);

    if (validExpenseIds.length === 0) {
      throw ApiError.badRequest({
        message:
          "Gagal menghapus. Tidak ada pengeluaran yang valid untuk dihapus.",
        details: skippedExpenses,
      });
    }

    const deleteResults = await this.expenseRepo.deleteMany(validExpenseIds);

    const summary = {
      total: expenseIds.length,
      valid: validExpenseIds.length,
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
