import ProductRepository from "#repository/productRepository.js";
import FileRepository from "#repository/fileRepository.js";
import NotificationRepository from "#repository/notificationRepository.js";
import UserRepository from "#repository/userRepository.js";
import CodeGenerator from "#shared/utils/code.js";
import Currency from "#shared/utils/currency.js";
import DateTime from "#shared/utils/datetime.js";
import ApiError from "#shared/utils/error.js";
import Storage from "#shared/utils/storage.js";
import prisma from "#app/database.js";
import logger from "#app/logger.js";

class ProductService {
  constructor() {
    this.productRepo = new ProductRepository();
    this.fileRepo = new FileRepository();
    this.notifRepo = new NotificationRepository();
    this.userRepo = new UserRepository();
  }

  /**
   * Generate SKU unik berdasarkan tipe produk
   * @param {string} type - Tipe produk (SPAREPART/SERVICE)
   * @returns {Promise<string>} SKU yang unik
   * @private
   */
  async #generateSku(type) {
    const prefix = type === "SPAREPART" ? "SP" : "SV";

    const lastProduct = await prisma.product.findFirst({
      where: { sku: { startsWith: prefix } },
      orderBy: { sku: "desc" },
      select: { sku: true },
    });

    let sku;
    let exists = true;

    while (exists) {
      sku = CodeGenerator.productSku(type, lastProduct?.sku);
      exists = await this.productRepo.isSkuExists(sku);
      if (exists) lastProduct.sku = sku;
    }

    return sku;
  }

  /**
   * Upload file gambar produk ke storage
   * @param {Object} file - File dari middleware
   * @param {string} userId - ID user yang upload
   * @returns {Promise<Object>} File record
   * @private
   */
  async #uploadImage(file, userId) {
    const path = await Storage.uploadFile(file, "products");
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
   * Menghapus file gambar lama dari storage dan database
   * @param {string} fileId - ID file yang akan dihapus
   * @param {string} productId - ID produk terkait (untuk logging)
   * @returns {Promise<void>}
   * @private
   */
  async #deleteImage(fileId, productId) {
    try {
      const oldFile = await this.fileRepo.findById(fileId);
      if (oldFile) {
        await Storage.deleteFile(oldFile.path);
        await this.fileRepo.delete(oldFile.id);
      }
    } catch (err) {
      logger.warn("Gagal membersihkan file gambar lama", {
        productId,
        fileId,
        error: err.message,
      });
    }
  }

  /**
   * Generate signed URL untuk gambar produk
   * @param {Object} product - Data produk
   * @returns {Promise<Object>} Produk dengan signed URL
   * @private
   */
  async #addSignedUrl(product) {
    if (product?.image?.path) {
      product.image.url = await Storage.getSignedUrl(product.image.path);
    }
    return product;
  }

  /**
   * Generate signed URL untuk multiple produk
   * @param {Array} products - Array data produk
   * @returns {Promise<Array>} Produk dengan signed URL
   * @private
   */
  async #addSignedUrlsToProducts(products) {
    if (!products?.length) return products;
    await Promise.all(products.map((p) => this.#addSignedUrl(p)));
    return products;
  }

  /**
   * Mengirim notifikasi ke user tertentu
   * @param {string} userId - ID user penerima
   * @param {string} title - Judul notifikasi
   * @param {string} message - Pesan notifikasi (Markdown)
   * @param {string} [type="INFO"] - Tipe notifikasi
   * @returns {Promise<void>}
   * @private
   */
  async #sendNotification(userId, title, message, type = "INFO") {
    if (!userId) return;
    try {
      await this.notifRepo.create({ title, message, type, userId });
    } catch (err) {
      logger.warn("Gagal mengirim notifikasi produk", { userId, error: err.message });
    }
  }

  /**
   * Mengirim notifikasi ke semua admin aktif
   * @param {string} title - Judul notifikasi
   * @param {string} message - Pesan notifikasi (Markdown)
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
   * Build notifikasi produk dalam format Markdown
   * @param {Object} params - Parameter notifikasi
   * @param {string} params.eventTitle - Judul event
   * @param {Object} params.product - Data produk
   * @param {string} [params.userName] - Nama user yang melakukan aksi
   * @param {string} [params.note] - Catatan tambahan
   * @returns {string} Pesan notifikasi format Markdown
   * @private
   */
  #buildProductNotification({ eventTitle, product, userName, note }) {
    const lines = [];

    lines.push(`## ${eventTitle}`);
    lines.push("");

    lines.push(`**Nama:** ${product.name}`);
    lines.push(`**SKU:** ${product.sku}`);
    lines.push(`**Tipe:** ${product.type === "SPAREPART" ? "Sparepart" : "Service"}`);
    lines.push(`**Harga Jual:** ${Currency.toIDR(product.price)}`);
    lines.push(`**Harga Beli:** ${Currency.toIDR(product.cost)}`);

    if (product.type === "SPAREPART") {
      lines.push(`**Stok:** ${product.stock} unit`);
    }

    if (product.description) {
      lines.push(`**Deskripsi:** ${product.description}`);
    }

    lines.push(`**Status:** ${product.isActive ? "Aktif" : "Nonaktif"}`);

    if (userName) {
      lines.push(`**Oleh:** ${userName}`);
    }

    lines.push("");
    lines.push(`**Waktu:** ${DateTime.toFullID(new Date())}`);

    if (note) {
      lines.push("");
      lines.push(`> ${note}`);
    }

    return lines.join("\n");
  }

  /**
   * Membuat produk baru
   * Stok dicatat melalui stock movement, bukan diupdate langsung di produk
   * @param {Object} payload - Data produk
   * @param {string} payload.name - Nama produk
   * @param {string} [payload.type="SPAREPART"] - Tipe produk
   * @param {string} [payload.description] - Deskripsi produk
   * @param {number} payload.price - Harga jual
   * @param {number} [payload.cost=0] - Harga beli
   * @param {number} [payload.stock=0] - Stok awal (dicatat via stock movement)
   * @param {Object} [productFile] - File gambar produk
   * @param {string} userId - ID user yang membuat
   * @returns {Promise<Object>} Produk yang berhasil dibuat
   * @throws {ApiError} 400 - Validasi gagal
   */
  async createProduct(payload, productFile, userId) {
    const type = payload.type || "SPAREPART";
    const sku = await this.#generateSku(type);
    const initialStock = payload.stock || 0;

    let imageId = null;

    if (productFile) {
      const fileRecord = await this.#uploadImage(productFile, userId);
      imageId = fileRecord.id;
    }

    const product = await prisma.$transaction(async (tx) => {
      const newProduct = await tx.product.create({
        data: {
          name: payload.name,
          sku,
          type,
          description: payload.description,
          price: payload.price,
          cost: payload.cost || 0,
          stock: initialStock,
          isActive: true,
          imageId,
        },
      });

      await tx.productPriceHistory.create({
        data: {
          productId: newProduct.id,
          price: newProduct.price,
          cost: newProduct.cost,
          effectiveFrom: new Date(),
        },
      });

      if (initialStock > 0 && type !== "SERVICE") {
        await tx.stockMovement.create({
          data: {
            productId: newProduct.id,
            type: "IN",
            sourceType: "MANUAL",
            quantity: initialStock,
            note: "Stok awal produk",
            recordedById: userId,
          },
        });
      }

      return newProduct;
    });

    const user = await this.userRepo.findById(userId);

    const notificationMessage = this.#buildProductNotification({
      eventTitle: "Produk Baru Dibuat",
      product,
      userName: user?.fullName || "-",
      note: "Produk telah berhasil ditambahkan ke dalam sistem.",
    });

    await this.#notifyAdmins(
      `Produk Baru - ${product.name}`,
      notificationMessage,
      "SUCCESS"
    );

    logger.info("Produk berhasil dibuat", {
      productId: product.id,
      name: product.name,
      sku,
      type,
      userId,
    });

    return this.productRepo.findById(product.id);
  }

  /**
   * Mendapatkan produk berdasarkan ID
   * @param {string} productId - ID produk
   * @returns {Promise<Object>} Detail produk dengan signed URL gambar
   * @throws {ApiError} 404 - Produk tidak ditemukan
   */
  async getProductById(productId) {
    const product = await this.productRepo.findById(productId);
    if (!product) {
      throw ApiError.notFound({
        message: `Produk dengan ID '${productId}' tidak ditemukan.`,
      });
    }
    return this.#addSignedUrl(product);
  }

  /**
   * Mendapatkan produk berdasarkan SKU
   * @param {string} sku - SKU produk
   * @returns {Promise<Object>} Detail produk dengan signed URL gambar
   * @throws {ApiError} 404 - Produk tidak ditemukan
   */
  async getProductBySku(sku) {
    const product = await this.productRepo.findBySku(sku);
    if (!product) {
      throw ApiError.notFound({
        message: `Produk dengan SKU '${sku}' tidak ditemukan.`,
      });
    }
    return this.#addSignedUrl(product);
  }

  /**
   * Mendapatkan daftar produk dengan filter dan paginasi
   * @param {Object} [query={}] - Parameter query
   * @param {number} [query.page=1] - Nomor halaman
   * @param {number} [query.limit=10] - Jumlah per halaman
   * @param {string} [query.type] - Filter tipe (SPAREPART/SERVICE)
   * @param {string} [query.search] - Pencarian berdasarkan nama atau SKU
   * @param {boolean} [query.isActive] - Filter status aktif
   * @returns {Promise<{data: Array, metadata: Object}>} Daftar produk
   */
  async getProducts(query = {}) {
    const result = await this.productRepo.findMany(query);
    result.data = await this.#addSignedUrlsToProducts(result.data);
    return result;
  }

  /**
   * Mendapatkan daftar produk service
   * @param {Object} [query={}] - Parameter query
   * @returns {Promise<Array>} Daftar service
   */
  async getServices(query = {}) {
    return this.productRepo.findServices(query);
  }

  /**
   * Mendapatkan daftar produk sparepart
   * @param {Object} [query={}] - Parameter query
   * @returns {Promise<Array>} Daftar sparepart dengan signed URL
   */
  async getSpareparts(query = {}) {
    const spareparts = await this.productRepo.findSpareparts(query);
    return this.#addSignedUrlsToProducts(spareparts);
  }

  /**
   * Memperbarui produk
   * Stok tidak diupdate disini, hanya via StockService (stock movement)
   * @param {string} productId - ID produk
   * @param {Object} payload - Data yang akan diupdate
   * @param {string} [payload.name] - Nama baru
   * @param {string} [payload.description] - Deskripsi baru
   * @param {string} [payload.type] - Tipe baru
   * @param {number} [payload.price] - Harga jual baru
   * @param {number} [payload.cost] - Harga beli baru
   * @param {boolean} [payload.isActive] - Status aktif baru
   * @param {Object} [productFile] - File gambar baru
   * @param {string} userId - ID user yang mengupdate
   * @returns {Promise<Object>} Produk yang sudah diperbarui
   * @throws {ApiError} 404 - Produk tidak ditemukan
   */
  async updateProduct(productId, payload, productFile, userId) {
    const existing = await this.productRepo.findById(productId);
    if (!existing) {
      throw ApiError.notFound({
        message: `Produk dengan ID '${productId}' tidak ditemukan.`,
      });
    }

    let imageId = existing.imageId;

    if (productFile) {
      const newFileRecord = await this.#uploadImage(productFile, userId);
      imageId = newFileRecord.id;
      if (existing.imageId) {
        await this.#deleteImage(existing.imageId, productId);
      }
    }

    const newPrice = payload.price !== undefined ? Number(payload.price) : existing.price;
    const newCost = payload.cost !== undefined ? Number(payload.cost) : existing.cost;

    const priceChanged = newPrice !== Number(existing.price);
    const costChanged = newCost !== Number(existing.cost);
    const shouldCreatePriceHistory = priceChanged || costChanged;

    const updateData = {};

    if (payload.name !== undefined) updateData.name = payload.name;
    if (payload.description !== undefined) updateData.description = payload.description;
    if (payload.type !== undefined) updateData.type = payload.type;
    if (payload.price !== undefined) updateData.price = Number(payload.price);
    if (payload.cost !== undefined) updateData.cost = Number(payload.cost);
    if (payload.isActive !== undefined) updateData.isActive = payload.isActive;

    updateData.imageId = imageId;

    const updated = await prisma.$transaction(async (tx) => {
      const product = await tx.product.update({
        where: { id: productId },
        data: updateData,
      });

      if (shouldCreatePriceHistory) {
        const existingHistory = await tx.productPriceHistory.findFirst({
          where: {
            productId,
            price: product.price,
            cost: product.cost,
            effectiveFrom: { gte: new Date(Date.now() - 1000) },
          },
          orderBy: { effectiveFrom: "desc" },
        });

        if (!existingHistory) {
          await tx.productPriceHistory.create({
            data: {
              productId,
              price: product.price,
              cost: product.cost,
              effectiveFrom: new Date(),
            },
          });
        }
      }

      return product;
    });

    const user = await this.userRepo.findById(userId);

    const changes = [];
    if (payload.name !== undefined && payload.name !== existing.name)
      changes.push(`Nama: ${existing.name} -> ${payload.name}`);
    if (payload.price !== undefined && Number(payload.price) !== Number(existing.price))
      changes.push(`Harga: ${Currency.toIDR(existing.price)} -> ${Currency.toIDR(payload.price)}`);
    if (payload.cost !== undefined && Number(payload.cost) !== Number(existing.cost))
      changes.push(`Harga Beli: ${Currency.toIDR(existing.cost)} -> ${Currency.toIDR(payload.cost)}`);
    if (payload.isActive !== undefined && payload.isActive !== existing.isActive)
      changes.push(`Status: ${existing.isActive ? "Aktif" : "Nonaktif"} -> ${payload.isActive ? "Aktif" : "Nonaktif"}`);

    if (changes.length > 0) {
      const notificationMessage = this.#buildProductNotification({
        eventTitle: "Produk Diperbarui",
        product: updated,
        userName: user?.fullName || "-",
        note: changes.join(", "),
      });

      await this.#notifyAdmins(
        `Produk Diperbarui - ${updated.name}`,
        notificationMessage,
        "INFO"
      );
    }

    logger.info("Produk berhasil diperbarui", {
      productId,
      previousName: existing.name,
      newName: updated.name,
      userId,
    });

    return this.productRepo.findById(productId);
  }

  /**
   * Toggle status aktif produk (ON/OFF)
   * @param {string} productId - ID produk
   * @returns {Promise<Object>} Produk dengan status baru
   * @throws {ApiError} 404 - Produk tidak ditemukan
   */
  async toggleProductStatus(productId) {
    const existing = await this.productRepo.findById(productId);
    if (!existing) {
      throw ApiError.notFound({
        message: `Produk dengan ID '${productId}' tidak ditemukan.`,
      });
    }

    const newStatus = !existing.isActive;
    const updated = await this.productRepo.updateStatus(productId, newStatus);

    const notificationMessage = this.#buildProductNotification({
      eventTitle: newStatus ? "Produk Diaktifkan" : "Produk Dinonaktifkan",
      product: updated,
      note: newStatus
        ? "Produk telah diaktifkan kembali dan dapat digunakan."
        : "Produk telah dinonaktifkan dan tidak akan muncul di pilihan.",
    });

    await this.#notifyAdmins(
      `${newStatus ? "Produk Aktif" : "Produk Nonaktif"} - ${updated.name}`,
      notificationMessage,
      "WARNING"
    );

    logger.info("Status produk berhasil diubah", {
      productId,
      name: existing.name,
      previousStatus: existing.isActive,
      newStatus,
    });

    return updated;
  }

  /**
   * Mendapatkan produk dengan stok rendah
   * @param {number} [threshold=5] - Batas stok rendah
   * @returns {Promise<Array>} Daftar produk dengan stok di bawah threshold
   */
  async getLowStockProducts(threshold = 5) {
    return this.productRepo.getLowStockProducts(threshold);
  }

  /**
   * Mengecek ketersediaan SKU
   * @param {string} sku - SKU yang akan dicek
   * @param {string} [excludeId] - ID produk yang dikecualikan (untuk update)
   * @returns {Promise<{available: boolean, message: string}>} Status ketersediaan
   */
  async checkSkuAvailability(sku, excludeId = null) {
    const exists = await this.productRepo.isSkuExists(sku, excludeId);
    return {
      available: !exists,
      message: exists ? `SKU '${sku}' sudah digunakan.` : `SKU '${sku}' tersedia.`,
    };
  }

  /**
   * Menonaktifkan banyak produk sekaligus
   * @param {string[]} productIds - Array ID produk
   * @param {string} userId - ID user yang menonaktifkan
   * @returns {Promise<{summary: Object, details: Object}>} Ringkasan dan detail
   * @throws {ApiError} 400 - Tidak ada produk yang dipilih atau valid
   */
  async deactivateProducts(productIds, userId) {
    if (!productIds || productIds.length === 0) {
      throw ApiError.badRequest({
        message: "Gagal menonaktifkan. Tidak ada produk yang dipilih.",
      });
    }

    const validIds = [];
    const skippedProducts = [];

    for (const id of productIds) {
      const product = await this.productRepo.findById(id);
      if (!product) {
        skippedProducts.push({ id, reason: "Produk tidak ditemukan" });
        continue;
      }
      if (!product.isActive) {
        skippedProducts.push({ id, name: product.name, reason: "Produk sudah nonaktif" });
        continue;
      }
      validIds.push(id);
    }

    if (validIds.length === 0) {
      throw ApiError.badRequest({
        message: "Gagal menonaktifkan. Tidak ada produk aktif yang bisa dinonaktifkan.",
        details: skippedProducts,
      });
    }

    const deactivateResults = await this.productRepo.deactivateMany(validIds);

    const user = await this.userRepo.findById(userId);

    const adminMessage = [
      `## Produk Dinonaktifkan Massal`,
      ``,
      `**Jumlah:** ${deactivateResults.success.length} produk`,
      `**Oleh:** ${user?.fullName || "-"}`,
      ``,
      `**Waktu:** ${DateTime.toFullID(new Date())}`,
    ].join("\n");

    await this.#notifyAdmins("Produk Dinonaktifkan Massal", adminMessage, "WARNING");

    const summary = {
      total: productIds.length,
      valid: validIds.length,
      skipped: skippedProducts.length,
      deactivated: deactivateResults.success.length,
      failed: deactivateResults.failed.length,
    };

    logger.info("Bulk deactivate produk selesai", {
      summary,
      skippedProducts,
      failedDeactivates: deactivateResults.failed,
      userId,
    });

    return {
      summary,
      details: {
        deactivated: deactivateResults.success,
        failed: deactivateResults.failed,
        skipped: skippedProducts,
      },
    };
  }

  /**
   * Mengaktifkan banyak produk sekaligus
   * @param {string[]} productIds - Array ID produk
   * @param {string} userId - ID user yang mengaktifkan
   * @returns {Promise<{summary: Object, details: Object}>} Ringkasan dan detail
   * @throws {ApiError} 400 - Tidak ada produk yang dipilih atau valid
   */
  async activateProducts(productIds, userId) {
    if (!productIds || productIds.length === 0) {
      throw ApiError.badRequest({
        message: "Gagal mengaktifkan. Tidak ada produk yang dipilih.",
      });
    }

    const validIds = [];
    const skippedProducts = [];

    for (const id of productIds) {
      const product = await this.productRepo.findById(id);
      if (!product) {
        skippedProducts.push({ id, reason: "Produk tidak ditemukan" });
        continue;
      }
      if (product.isActive) {
        skippedProducts.push({ id, name: product.name, reason: "Produk sudah aktif" });
        continue;
      }
      validIds.push(id);
    }

    if (validIds.length === 0) {
      throw ApiError.badRequest({
        message: "Gagal mengaktifkan. Tidak ada produk nonaktif yang bisa diaktifkan.",
        details: skippedProducts,
      });
    }

    const activateResults = await this.productRepo.activateMany(validIds);

    const user = await this.userRepo.findById(userId);

    const adminMessage = [
      `## Produk Diaktifkan Massal`,
      ``,
      `**Jumlah:** ${activateResults.success.length} produk`,
      `**Oleh:** ${user?.fullName || "-"}`,
      ``,
      `**Waktu:** ${DateTime.toFullID(new Date())}`,
    ].join("\n");

    await this.#notifyAdmins("Produk Diaktifkan Massal", adminMessage, "SUCCESS");

    const summary = {
      total: productIds.length,
      valid: validIds.length,
      skipped: skippedProducts.length,
      activated: activateResults.success.length,
      failed: activateResults.failed.length,
    };

    logger.info("Bulk activate produk selesai", {
      summary,
      skippedProducts,
      failedActivates: activateResults.failed,
      userId,
    });

    return {
      summary,
      details: {
        activated: activateResults.success,
        failed: activateResults.failed,
        skipped: skippedProducts,
      },
    };
  }
}

export default ProductService;