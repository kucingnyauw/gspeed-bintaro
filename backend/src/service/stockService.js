import StockRepository from "#repository/stockRepository.js";
import ProductRepository from "#repository/productRepository.js";
import NotificationRepository from "#repository/notificationRepository.js";
import SettingRepository from "#repository/settingRepository.js";
import Currency from "#shared/utils/currency.js";
import DateTime from "#shared/utils/datetime.js";
import ApiError from "#shared/utils/error.js";
import prisma from "#app/database.js";
import logger from "#app/logger.js";

/**
 * Service untuk mengelola logika bisnis mutasi stok
 * @class StockService
 */
class StockService {
  constructor() {
    this.stockRepo = new StockRepository();
    this.productRepo = new ProductRepository();
    this.notifRepo = new NotificationRepository();
    this.settingRepo = new SettingRepository();
  }

  /**
   * Mendapatkan threshold stok rendah dari settings
   * @returns {Promise<number>}
   * @private
   */
  async #getLowStockThreshold() {
    const setting = await this.settingRepo.findByKey("stock_low_threshold");
    return setting ? Number(setting.value) : 5;
  }

  /**
   * Format info produk dalam Markdown untuk notifikasi
   * @param {Object} product
   * @param {string} product.name
   * @param {string} product.sku
   * @param {number} product.stock
   * @param {number} product.price
   * @param {number} product.cost
   * @returns {string}
   * @private
   */
  #formatProductInfo(product) {
    return [
      `**Nama Produk:** ${product.name}`,
      `**SKU:** ${product.sku}`,
      `**Stok Saat Ini:** ${product.stock} unit`,
      `**Harga Jual:** ${Currency.toIDR(product.price)}`,
      `**Harga Beli:** ${Currency.toIDR(product.cost)}`,
    ].join("\n");
  }

  /**
   * Build notifikasi stok dalam format Markdown
   * @param {Object} params
   * @param {string} params.eventTitle
   * @param {Object} params.product
   * @param {number} params.threshold
   * @param {number} [params.previousStock]
   * @param {number} [params.addedStock]
   * @param {string} [params.note]
   * @returns {string}
   * @private
   */
  #buildMarkdownNotification({
    eventTitle,
    product,
    threshold,
    previousStock,
    addedStock,
    note,
  }) {
    const lines = [];

    lines.push(`## ${eventTitle}`);
    lines.push("");

    lines.push(this.#formatProductInfo(product));
    lines.push("");

    if (previousStock !== undefined) {
      lines.push(`**Stok Sebelumnya:** ${previousStock} unit`);
    }

    if (addedStock !== undefined) {
      lines.push(`**Stok Bertambah:** ${addedStock} unit`);
    }

    if (note) {
      lines.push("");
      lines.push(`> ${note}`);
    }

    lines.push("");
    lines.push(`**Batas Minimum:** ${threshold} unit`);
    lines.push(`**Waktu:** ${DateTime.toFullID(new Date())}`);

    return lines.join("\n");
  }

  /**
   * Format ringkasan mutasi stok dalam Markdown
   * @param {Object} data
   * @param {string} data.productName
   * @param {string} data.productSku
   * @param {string} data.typeLabel
   * @param {number} data.quantity
   * @param {number} data.currentStock
   * @param {number} [data.previousStock]
   * @param {string} [data.note]
   * @param {string} data.recordedByName
   * @returns {string}
   * @private
   */
  #formatMovementSummary(data) {
    const lines = [];

    lines.push(`**Produk:** ${data.productName}`);
    lines.push(`**SKU:** ${data.productSku}`);
    lines.push(`**Tipe Mutasi:** ${data.typeLabel}`);
    lines.push(`**Jumlah:** ${data.quantity} unit`);

    if (data.previousStock !== undefined) {
      lines.push(`**Stok Sebelumnya:** ${data.previousStock} unit`);
    }

    lines.push(`**Stok Saat Ini:** ${data.currentStock} unit`);

    if (data.note) {
      lines.push(`**Catatan:** ${data.note}`);
    }

    lines.push("");
    lines.push(`**Dicatat Oleh:** ${data.recordedByName}`);
    lines.push(`**Waktu:** ${DateTime.toFullID(new Date())}`);

    return lines.join("\n");
  }

  /**
   * Mengirim notifikasi stok rendah ke admin
   * @param {Object} product - Data produk
   * @returns {Promise<void>}
   * @private
   */
  async #notifyLowStock(product) {
    try {
      const threshold = await this.#getLowStockThreshold();

      if (product.stock <= threshold) {
        const admins = await prisma.user.findMany({
          where: { role: "ADMIN", isActive: true },
          select: { id: true },
        });

        if (admins.length === 0) return;

        const isOutOfStock = product.stock === 0;
        const notificationType = isOutOfStock ? "ERROR" : "WARNING";
        const eventTitle = isOutOfStock ? "Stok Habis" : "Stok Rendah";

        const notificationMessage = this.#buildMarkdownNotification({
          eventTitle,
          product,
          threshold,
          note: isOutOfStock
            ? "Stok produk ini sudah habis. Segera lakukan pembelian untuk menghindari terhambatnya penjualan."
            : `Stok produk ini tinggal ${product.stock} unit, berada di bawah batas minimum ${threshold} unit. Segera lakukan pembelian ulang.`,
        });

        const notifications = admins.map((admin) => ({
          title: `${eventTitle} - ${product.name}`,
          message: notificationMessage,
          type: notificationType,
          userId: admin.id,
        }));

        await Promise.all(notifications.map((n) => this.notifRepo.create(n)));

        logger.info(`Notifikasi stok rendah dikirim untuk ${product.name}`, {
          productId: product.id,
          stock: product.stock,
          threshold,
          notifiedAdmins: admins.length,
        });
      }
    } catch (err) {
      logger.warn("Gagal mengirim notifikasi stok rendah", {
        productId: product.id,
        error: err.message,
      });
    }
  }

  /**
   * Mengirim notifikasi stok kembali normal
   * @param {Object} product - Data produk
   * @param {number} previousStock - Stok sebelumnya
   * @returns {Promise<void>}
   * @private
   */
  async #notifyStockRestored(product, previousStock) {
    try {
      const threshold = await this.#getLowStockThreshold();

      if (previousStock <= threshold && product.stock > threshold) {
        const admins = await prisma.user.findMany({
          where: { role: "ADMIN", isActive: true },
          select: { id: true },
        });

        if (admins.length === 0) return;

        const addedStock = product.stock - previousStock;

        const notificationMessage = this.#buildMarkdownNotification({
          eventTitle: "Stok Kembali Normal",
          product,
          threshold,
          previousStock,
          addedStock,
          note: `Stok produk ini sudah kembali di atas batas minimum (${threshold} unit) dan aman untuk penjualan.`,
        });

        const notifications = admins.map((admin) => ({
          title: `Stok Normal - ${product.name}`,
          message: notificationMessage,
          type: "SUCCESS",
          userId: admin.id,
        }));

        await Promise.all(notifications.map((n) => this.notifRepo.create(n)));

        logger.info(`Notifikasi stok normal dikirim untuk ${product.name}`, {
          productId: product.id,
          previousStock,
          currentStock: product.stock,
          threshold,
        });
      }
    } catch (err) {
      logger.warn("Gagal mengirim notifikasi stok normal", {
        productId: product.id,
        error: err.message,
      });
    }
  }

  /**
   * Mencatat stok masuk
   * @param {string} productId
   * @param {number} quantity
   * @param {string} recordedById
   * @param {string} [note=null]
   * @param {StockSourceType} [sourceType="MANUAL"]
   * @returns {Promise<Object>}
   * @throws {ApiError} notFound - Produk tidak ditemukan
   * @throws {ApiError} badRequest - Produk bukan sparepart
   */
  async recordStockIn(
    productId,
    quantity,
    recordedById,
    note = null,
    sourceType = "MANUAL"
  ) {
    const product = await this.productRepo.findById(productId);
    if (!product) {
      throw ApiError.notFound({
        message: `Gagal mencatat stok masuk. Produk dengan ID '${productId}' tidak ditemukan.`,
      });
    }

    if (product.type !== "SPAREPART") {
      throw ApiError.badRequest({
        message: `Gagal mencatat stok masuk. Produk '${product.name}' adalah service, tidak memiliki stok.`,
      });
    }

    const previousStock = product.stock;

    const result = await prisma.$transaction(async (tx) => {
      const updatedProduct = await tx.product.update({
        where: { id: productId },
        data: { stock: { increment: quantity } },
      });

      return {
        updatedProduct,
        movement: await this.stockRepo.createInTransaction(tx, {
          productId,
          type: "IN",
          sourceType,
          quantity,
          recordedById,
          note,
        }),
      };
    });

    const recordedBy = await prisma.user.findUnique({
      where: { id: recordedById },
      select: { fullName: true },
    });

    const typeLabel =
      sourceType === "PURCHASE"
        ? "Pembelian"
        : sourceType === "RETURN"
        ? "Retur"
        : "Stok Masuk";

    const notificationMessage = this.#formatMovementSummary({
      productName: product.name,
      productSku: product.sku,
      typeLabel,
      quantity,
      previousStock,
      currentStock: result.updatedProduct.stock,
      note,
      recordedByName: recordedBy?.fullName || "-",
    });

    await this.#notifyStockRestored(result.updatedProduct, previousStock);

    logger.info("Stok masuk berhasil dicatat", {
      stockMovementId: result.movement.id,
      productId,
      productName: product.name,
      quantity,
      sourceType,
      recordedById,
    });

    return result.movement;
  }

  /**
   * Mencatat stok keluar
   * @param {string} productId
   * @param {number} quantity
   * @param {string} recordedById
   * @param {string} [orderItemId=null]
   * @param {string} [note=null]
   * @param {StockSourceType} [sourceType="MANUAL"]
   * @returns {Promise<Object>}
   * @throws {ApiError} notFound - Produk tidak ditemukan
   * @throws {ApiError} badRequest - Produk bukan sparepart atau stok kurang
   */
  async recordStockOut(
    productId,
    quantity,
    recordedById,
    orderItemId = null,
    note = null,
    sourceType = "MANUAL"
  ) {
    const product = await this.productRepo.findById(productId);
    if (!product) {
      throw ApiError.notFound({
        message: `Gagal mencatat stok keluar. Produk dengan ID '${productId}' tidak ditemukan.`,
      });
    }

    if (product.type !== "SPAREPART") {
      throw ApiError.badRequest({
        message: `Gagal mencatat stok keluar. Produk '${product.name}' adalah service, tidak memiliki stok.`,
      });
    }

    if (product.stock < quantity) {
      throw ApiError.badRequest({
        message: `Gagal mencatat stok keluar. Stok produk '${product.name}' tidak mencukupi. Stok saat ini: ${product.stock}, Diminta: ${quantity}.`,
      });
    }

    const previousStock = product.stock;

    const result = await prisma.$transaction(async (tx) => {
      const updatedProduct = await tx.product.update({
        where: { id: productId },
        data: { stock: { decrement: quantity } },
      });

      return {
        updatedProduct,
        movement: await this.stockRepo.createInTransaction(tx, {
          productId,
          type: "OUT",
          sourceType,
          quantity,
          recordedById,
          orderItemId,
          note,
        }),
      };
    });

    const typeLabel = sourceType === "SALE" ? "Penjualan" : "Stok Keluar";

    await this.#notifyLowStock(result.updatedProduct);

    logger.info("Stok keluar berhasil dicatat", {
      stockMovementId: result.movement.id,
      productId,
      productName: product.name,
      quantity,
      sourceType,
      orderItemId,
      recordedById,
    });

    return result.movement;
  }

  /**
   * Mencatat stok keluar untuk penjualan
   * @param {string} productId
   * @param {number} quantity
   * @param {string} recordedById
   * @param {string} orderItemId
   * @returns {Promise<Object>}
   */
  async recordSaleOut(productId, quantity, recordedById, orderItemId) {
    return this.recordStockOut(
      productId,
      quantity,
      recordedById,
      orderItemId,
      null,
      "SALE"
    );
  }

  /**
   * Mencatat stok masuk untuk retur
   * @param {string} productId
   * @param {number} quantity
   * @param {string} recordedById
   * @param {string} [note=null]
   * @returns {Promise<Object>}
   */
  async recordReturnIn(productId, quantity, recordedById, note = null) {
    return this.recordStockIn(
      productId,
      quantity,
      recordedById,
      note || "Retur barang dari pelanggan",
      "RETURN"
    );
  }

  /**
   * Mencatat penyesuaian stok
   * @param {string} productId
   * @param {number} quantity - Positif untuk tambah, negatif untuk kurang
   * @param {string} recordedById
   * @param {string} note
   * @returns {Promise<Object>}
   * @throws {ApiError} notFound - Produk tidak ditemukan
   * @throws {ApiError} badRequest - Produk bukan sparepart atau stok kurang
   */
  async recordAdjustment(productId, quantity, recordedById, note) {
    const product = await this.productRepo.findById(productId);
    if (!product) {
      throw ApiError.notFound({
        message: `Gagal mencatat penyesuaian. Produk dengan ID '${productId}' tidak ditemukan.`,
      });
    }

    if (product.type !== "SPAREPART") {
      throw ApiError.badRequest({
        message: `Gagal mencatat penyesuaian. Produk '${product.name}' adalah service, tidak memiliki stok.`,
      });
    }

    if (quantity < 0 && product.stock < Math.abs(quantity)) {
      throw ApiError.badRequest({
        message: `Gagal mencatat penyesuaian. Stok produk '${product.name}' tidak mencukupi. Stok saat ini: ${product.stock}.`,
      });
    }

    const previousStock = product.stock;

    const result = await prisma.$transaction(async (tx) => {
      const updatedProduct = await tx.product.update({
        where: { id: productId },
        data: {
          stock:
            quantity > 0
              ? { increment: quantity }
              : { decrement: Math.abs(quantity) },
        },
      });

      return {
        updatedProduct,
        movement: await this.stockRepo.createInTransaction(tx, {
          productId,
          type: "ADJUSTMENT",
          sourceType: "ADJUSTMENT",
          quantity,
          recordedById,
          note,
        }),
      };
    });

    if (quantity < 0) {
      await this.#notifyLowStock(result.updatedProduct);
    } else {
      await this.#notifyStockRestored(result.updatedProduct, previousStock);
    }

    logger.info("Penyesuaian stok berhasil dicatat", {
      stockMovementId: result.movement.id,
      productId,
      productName: product.name,
      quantity,
      previousStock: product.stock,
      newStock: result.updatedProduct.stock,
      recordedById,
      note,
    });

    return result.movement;
  }

  /**
   * Mendapatkan daftar mutasi stok dengan filter dan paginasi
   * @param {Object} [query={}]
   * @returns {Promise<Object>}
   */
  async getStockMovements(query = {}) {
    const result = await this.stockRepo.findMany(query);

    logger.info("Mengambil daftar mutasi stok", {
      total: result.metadata.total,
      page: result.metadata.currentPage,
      filters: {
        productId: query.productId,
        type: query.type,
        sourceType: query.sourceType,
      },
    });

    return result;
  }

  /**
   * Mendapatkan detail mutasi stok berdasarkan ID
   * @param {string} id
   * @returns {Promise<Object>}
   * @throws {ApiError} notFound - Mutasi stok tidak ditemukan
   */
  async getStockMovementById(id) {
    const movement = await this.stockRepo.findById(id);

    if (!movement) {
      throw ApiError.notFound({
        message: `Mutasi stok dengan ID '${id}' tidak ditemukan.`,
      });
    }

    return movement;
  }

  /**
   * Mendapatkan mutasi stok berdasarkan produk
   * @param {string} productId
   * @param {Object} [query={}]
   * @returns {Promise<Object>}
   * @throws {ApiError} notFound - Produk tidak ditemukan
   */
  async getMovementsByProduct(productId, query = {}) {
    const product = await this.productRepo.findById(productId);
    if (!product) {
      throw ApiError.notFound({
        message: `Produk dengan ID '${productId}' tidak ditemukan.`,
      });
    }

    return this.stockRepo.findByProductId(productId, query);
  }

  /**
   * Mendapatkan mutasi stok berdasarkan order
   * @param {string} orderId
   * @returns {Promise<Array>}
   */
  async getMovementsByOrder(orderId) {
    return this.stockRepo.findByOrderId(orderId);
  }

  /**
   * Menghapus record mutasi stok
   * @param {string} id
   * @returns {Promise<void>}
   * @throws {ApiError} notFound - Mutasi stok tidak ditemukan
   */
  async deleteStockMovement(id) {
    const movement = await this.stockRepo.findById(id);

    if (!movement) {
      throw ApiError.notFound({
        message: `Gagal menghapus. Mutasi stok dengan ID '${id}' tidak ditemukan.`,
      });
    }

    await this.stockRepo.delete(id);

    logger.info("Mutasi stok berhasil dihapus", {
      movementId: id,
      productId: movement.productId,
      type: movement.type,
      quantity: movement.quantity,
    });
  }

  /**
   * Menghapus banyak record mutasi stok sekaligus
   * @param {string[]} movementIds - Array ID mutasi stok
   * @param {string} userId - ID user yang menghapus
   * @returns {Promise<{summary: Object, details: Object}>}
   * @throws {ApiError} badRequest - Tidak ada mutasi stok yang dipilih
   */
  async deleteStockMovements(movementIds, userId) {
    if (!movementIds || movementIds.length === 0) {
      throw ApiError.badRequest({
        message: "Gagal menghapus. Tidak ada mutasi stok yang dipilih.",
      });
    }

    const validIds = [];
    const skippedMovements = [];

    for (const id of movementIds) {
      const movement = await this.stockRepo.findById(id);
      if (!movement) {
        skippedMovements.push({ id, reason: "Mutasi stok tidak ditemukan" });
        continue;
      }
      validIds.push(id);
    }

    if (validIds.length === 0) {
      throw ApiError.badRequest({
        message:
          "Gagal menghapus. Tidak ada mutasi stok yang valid untuk dihapus.",
        details: skippedMovements,
      });
    }

    const deleteResults = await this.stockRepo.deleteMany(validIds);

    const summary = {
      total: movementIds.length,
      valid: validIds.length,
      skipped: skippedMovements.length,
      deleted: deleteResults.success.length,
      failed: deleteResults.failed.length,
    };

    logger.info("Bulk delete mutasi stok selesai", {
      summary,
      skippedMovements,
      failedDeletes: deleteResults.failed,
      userId,
    });

    return {
      summary,
      details: {
        deleted: deleteResults.success,
        failed: deleteResults.failed,
        skipped: skippedMovements,
      },
    };
  }
}

export default StockService;
