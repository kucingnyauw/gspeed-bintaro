import OrderRepository from "#repository/orderRepository.js";
import ProductRepository from "#repository/productRepository.js";
import ShiftRepository from "#repository/shiftRepository.js";
import SettingRepository from "#repository/settingRepository.js";
import NotificationRepository from "#repository/notificationRepository.js";
import UserRepository from "#repository/userRepository.js";
import CacheManager from "#shared/utils/cache.js";
import CodeGenerator from "#shared/utils/code.js";
import Currency from "#shared/utils/currency.js";
import DateTime from "#shared/utils/datetime.js";
import ApiError from "#shared/utils/error.js";
import prisma from "#app/database.js";
import logger from "#app/logger.js";
import axios from "axios";

class OrderService {
  constructor() {
    this.orderRepo = new OrderRepository();
    this.productRepo = new ProductRepository();
    this.shiftRepo = new ShiftRepository();
    this.settingRepo = new SettingRepository();
    this.notifRepo = new NotificationRepository();
    this.userRepo = new UserRepository();
    this.cache = new CacheManager("order");
  }

  /**
   * Cek apakah items memiliki tipe SERVICE
   * @param {Array<{productType?: string, product?: {type: string}}>} items
   * @returns {boolean}
   * @private
   */
  #hasServiceItem(items) {
    return (
      items?.some((item) => {
        const type = item.productType || item.product?.type;
        return type === "SERVICE";
      }) ?? false
    );
  }

  /**
   * Mendapatkan nilai setting dari database
   * @param {string} key
   * @param {*} defaultValue
   * @returns {Promise<*>}
   * @private
   */
  async #getSetting(key, defaultValue) {
    const setting = await this.settingRepo.findByKey(key);
    return setting ? setting.value : defaultValue;
  }

  /**
   * Mendapatkan tarif pajak dari settings
   * @returns {Promise<number>}
   * @private
   */
  async #getTaxRate() {
    const enabled = await this.#getSetting("enable_ppn", "true");
    if (enabled !== "true") return 0;
    return Number(await this.#getSetting("ppn_rate", 11));
  }

  /**
   * Invalidasi cache terkait order
   * @param {string} orderNumber
   * @returns {Promise<void>}
   * @private
   */
  async #invalidateOrderCache(orderNumber) {
    await this.cache.invalidate(`history:${orderNumber}`);
  }

  /**
   * Format detail kendaraan untuk display
   * @param {Object|null} vehicle
   * @param {string} vehicle.plateNumber
   * @param {string} [vehicle.brand]
   * @param {string} [vehicle.model]
   * @returns {string}
   * @private
   */
  #formatVehicleInfo(vehicle) {
    if (!vehicle) return "Tidak ada kendaraan";
    const parts = [vehicle.plateNumber, vehicle.brand, vehicle.model].filter(
      Boolean
    );
    return parts.join(" - ");
  }

  /**
   * Format daftar item dalam Markdown table
   * @param {Array<{productNameSnapshot?: string, product?: {name: string}, quantity: number, subtotal?: number, unitPrice?: number}>} items
   * @returns {string}
   * @private
   */
  #formatItemTable(items) {
    if (!items || items.length === 0) return "*Tidak ada item*";

    let table = "| # | Item | Qty | Harga |\n";
    table += "|---|------|-----|-------|\n";

    items.forEach((item, index) => {
      const name = item.productNameSnapshot || item.product?.name || "Item";
      const subtotal = item.subtotal || item.unitPrice * item.quantity;
      table += `| ${index + 1} | ${name} | ${item.quantity} | ${Currency.toIDR(
        subtotal
      )} |\n`;
    });

    return table;
  }

  /**
   * Build notifikasi dalam format Markdown
   * @param {Object} params
   * @param {string} params.eventTitle
   * @param {Object} params.order
   * @param {string} params.order.orderNumber
   * @param {string} params.order.status
   * @param {number} params.order.subtotal
   * @param {number} params.order.tax
   * @param {number} params.order.total
   * @param {Date} [params.order.createdAt]
   * @param {string} [params.cashierName]
   * @param {string} [params.customerName]
   * @param {string} [params.vehicleInfo]
   * @param {Array} [params.items]
   * @param {number} [params.taxRate=11]
   * @param {string} [params.note]
   * @param {string} [params.paymentMethod]
   * @returns {string}
   * @private
   */
  #buildMarkdownNotification({
    eventTitle,
    order,
    cashierName,
    customerName,
    vehicleInfo,
    items,
    taxRate = 11,
    note,
    paymentMethod,
  }) {
    const lines = [];

    lines.push(`## ${eventTitle}`);
    lines.push("");

    lines.push(`**Nomor Pesanan:** ${order.orderNumber}`);
    lines.push(`**Status:** ${order.status}`);
    if (cashierName) lines.push(`**Kasir:** ${cashierName}`);
    if (customerName) lines.push(`**Pelanggan:** ${customerName}`);
    if (vehicleInfo) lines.push(`**Kendaraan:** ${vehicleInfo}`);
    lines.push(
      `**Tanggal:** ${DateTime.toFullID(order.createdAt || new Date())}`
    );
    lines.push("");

    if (items && items.length > 0) {
      lines.push("### Rincian Item");
      lines.push(this.#formatItemTable(items));
      lines.push("");
    }

    lines.push("### Ringkasan");
    lines.push(`- Subtotal: ${Currency.toIDR(order.subtotal || 0)}`);
    lines.push(`- Pajak (${taxRate}%): ${Currency.toIDR(order.tax || 0)}`);
    lines.push(`- **Total: ${Currency.toIDR(order.total || 0)}**`);
    lines.push("");

    if (paymentMethod) {
      lines.push(`**Pembayaran:** ${paymentMethod}`);
      lines.push("");
    }

    if (note) {
      lines.push(`> ${note}`);
    }

    return lines.join("\n");
  }

  /**
   * Mengirim notifikasi
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
      logger.warn("Gagal mengirim notifikasi order", {
        userId,
        error: err.message,
      });
    }
  }

  /**
   * Generate note status history menggunakan AI
   * @param {string} status - Status baru
   * @param {string|null} previousStatus - Status sebelumnya
   * @param {Object} context - Konteks tambahan
   * @param {string} context.orderNumber
   * @param {string} [context.customerName]
   * @param {string} [context.vehicleInfo]
   * @param {number} [context.total]
   * @param {number} [context.itemCount]
   * @param {string} [context.cashierName]
   * @returns {Promise<string>}
   * @private
   */
  async #generateStatusNote(status, previousStatus, context = {}) {
    try {
      const prompt = `Buatkan catatan singkat (1-2 kalimat, maksimal 100 karakter) dalam bahasa Indonesia untuk perubahan status pesanan bengkel Vespa.

Status sebelumnya: ${previousStatus || "Tidak ada (pesanan baru)"}
Status baru: ${status}

Konteks:
- Nomor Pesanan: ${context.orderNumber || "-"}
- Pelanggan: ${context.customerName || "Tidak diketahui"}
- Kendaraan: ${context.vehicleInfo || "Tidak ada"}
- Total: ${context.total ? Currency.toIDR(context.total) : "-"}
- Item: ${context.itemCount || 0} item
${context.cashierName ? `- Kasir: ${context.cashierName}` : ""}

Catatan harus:
1. Informatif dan deskriptif
2. Natural seperti ditulis oleh staff bengkel
3. JANGAN gunakan format JSON atau markup apapun

Contoh:
"Pesanan dibuat oleh kasir Budi untuk servis Vespa Sprint 150."
"Mekanik Andi mulai pengerjaan servis ringan dan ganti oli."
"Pesanan ditutup. Motor sudah diambil pelanggan."`;

      const response = await axios.post(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          model: "meta-llama/llama-3.1-8b-instruct",
          messages: [
            {
              role: "system",
              content:
                "Kamu adalah asisten yang membuat catatan singkat status pesanan bengkel. Jawab HANYA dengan catatan yang diminta, tanpa tambahan apapun.",
            },
            { role: "user", content: prompt },
          ],
          max_tokens: 100,
          temperature: 0.7,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
          },
          timeout: 10000,
        }
      );

      const note = response.data.choices[0].message.content.trim();
      logger.info("AI generated status note", { status, note });
      return note;
    } catch (err) {
      logger.warn("Gagal generate AI note, pakai fallback", {
        status,
        error: err.message,
      });
      return this.#getFallbackNote(status, previousStatus);
    }
  }

  /**
   * Fallback note jika AI gagal
   * @param {string} status
   * @param {string|null} previousStatus
   * @returns {string}
   * @private
   */
  #getFallbackNote(status, previousStatus) {
    const notes = {
      DRAFT: "Pesanan baru dibuat sebagai draft. Menunggu pembayaran.",
      QUEUED: "Pembayaran berhasil. Pesanan masuk antrian pengerjaan.",
      IN_PROGRESS: "Mekanik mulai mengerjakan pesanan.",
      COMPLETED: "Pengerjaan selesai. Menunggu penutupan pesanan.",
      CLOSED: "Pesanan ditutup. Motor sudah diambil pelanggan.",
      CANCELLED: "Pesanan dibatalkan. Stok sparepart dikembalikan.",
    };
    return (
      notes[status] || `Status diubah dari "${previousStatus}" ke "${status}".`
    );
  }

  /**
   * Validasi apakah pesanan dapat diedit
   * @param {Object} order
   * @param {string} order.status
   * @param {string} order.orderNumber
   * @param {string} action
   * @throws {ApiError} notFound - Jika order tidak ditemukan
   * @throws {ApiError} conflict - Jika order sudah selesai/dibatalkan
   * @private
   */
  #validateOrderEditable(order, action = "diubah") {
    if (!order)
      throw ApiError.notFound({
        message: `Gagal ${action}. Pesanan tidak ditemukan.`,
      });
    if (order.status === "COMPLETED" || order.status === "CLOSED") {
      throw ApiError.conflict({
        message: `Gagal ${action}. Pesanan '${order.orderNumber}' sudah selesai atau ditutup.`,
      });
    }
    if (order.status === "CANCELLED") {
      throw ApiError.conflict({
        message: `Gagal ${action}. Pesanan '${order.orderNumber}' sudah dibatalkan.`,
      });
    }
  }

  /**
   * Validasi produk dan stok
   * @param {Object} product
   * @param {string} product.name
   * @param {string} product.type
   * @param {number} product.stock
   * @param {boolean} product.isActive
   * @param {number} quantity
   * @throws {ApiError} notFound - Jika produk tidak ditemukan
   * @throws {ApiError} badRequest - Jika produk tidak aktif atau stok kurang
   * @private
   */
  #validateProduct(product, quantity) {
    if (!product)
      throw ApiError.notFound({
        message: "Gagal. Produk dengan ID tersebut tidak ditemukan.",
      });
    if (!product.isActive)
      throw ApiError.badRequest({
        message: `Gagal. Produk '${product.name}' tidak aktif.`,
      });
    if (product.type === "SPAREPART" && product.stock < quantity) {
      throw ApiError.badRequest({
        message: `Gagal. Stok produk '${product.name}' tidak mencukupi. Tersedia: ${product.stock}, Diminta: ${quantity}.`,
      });
    }
  }

  /**
   * Menghitung subtotal dan memproses item pesanan
   * @param {Array<{productId: string, quantity: number}>} items
   * @returns {Promise<{subtotal: number, processedItems: Array}>}
   * @private
   */
  async #calculateItems(items) {
    const productIds = items.map((item) => item.productId);
    const products = await Promise.all(
      productIds.map((id) => this.productRepo.findById(id))
    );
    const productMap = new Map(products.map((p) => [p?.id, p]));
    let subtotal = 0;
    const processedItems = [];

    for (const item of items) {
      const product = productMap.get(item.productId);
      this.#validateProduct(product, item.quantity);
      const unitPrice = product.price;
      const itemSubtotal = unitPrice * item.quantity;
      subtotal += itemSubtotal;
      processedItems.push({
        productId: item.productId,
        productNameSnapshot: product.name,
        productType: product.type,
        quantity: item.quantity,
        unitPrice,
        unitCostSnapshot: product.cost,
        subtotal: itemSubtotal,
      });
    }
    return { subtotal, processedItems };
  }

  /**
   * Mendapatkan shift aktif kasir
   * @param {string} cashierId
   * @returns {Promise<Object>}
   * @throws {ApiError} badRequest - Jika tidak ada shift aktif
   * @private
   */
  async #getActiveShift(cashierId) {
    const hasActiveShift = await this.shiftRepo.hasActiveShift(cashierId);
    if (!hasActiveShift)
      throw ApiError.badRequest({
        message: "Gagal membuat pesanan. Kasir tidak memiliki shift aktif.",
      });
    return this.shiftRepo.findActiveByCashier(cashierId);
  }

  /**
   * Generate nomor pesanan unik
   * @returns {Promise<string>}
   * @private
   */
  async #generateUniqueOrderNumber() {
    let orderNumber;
    let exists = true;
    while (exists) {
      orderNumber = CodeGenerator.orderNumber();
      exists = await this.orderRepo.isOrderNumberExists(orderNumber);
    }
    return orderNumber;
  }

  /**
   * Kurangi stok sparepart dan buat stock movement
   * @param {Array<{productId: string, quantity: number}>} sparepartItems
   * @param {Object} tx - Prisma transaction client
   * @param {string} orderId - ID order
   * @param {string} orderNumber - Nomor order
   * @param {string} recordedById - User ID
   * @returns {Promise<void>}
   * @private
   */
  async #deductSparePartStock(
    sparepartItems,
    tx,
    orderId,
    orderNumber,
    recordedById
  ) {
    if (!sparepartItems.length) return;

    await Promise.all(
      sparepartItems.map((item) =>
        tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        })
      )
    );

    const createdItems = await tx.orderItem.findMany({
      where: { orderId },
      select: { id: true, productId: true, quantity: true },
    });

    await Promise.all(
      sparepartItems.map((item) => {
        const orderItem = createdItems.find(
          (oi) =>
            oi.productId === item.productId && oi.quantity === item.quantity
        );
        return tx.stockMovement.create({
          data: {
            productId: item.productId,
            type: "OUT",
            sourceType: "SALE",
            quantity: item.quantity,
            orderItemId: orderItem?.id || null,
            recordedById,
            note: `Penjualan - Order #${orderNumber}`,
          },
        });
      })
    );
  }

  /**
   * Kembalikan stok sparepart dan buat stock movement return
   * @param {Array<{productId: string, quantity: number, id: string}>} sparepartItems
   * @param {Object} tx - Prisma transaction client
   * @param {string} orderNumber - Nomor order
   * @param {string} recordedById - User ID
   * @returns {Promise<void>}
   * @private
   */
  async #restoreSparePartStock(sparepartItems, tx, orderNumber, recordedById) {
    if (!sparepartItems.length) return;

    await Promise.all(
      sparepartItems.map((item) =>
        tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        })
      )
    );

    await Promise.all(
      sparepartItems.map((item) =>
        tx.stockMovement.create({
          data: {
            productId: item.productId,
            type: "IN",
            sourceType: "RETURN",
            quantity: item.quantity,
            orderItemId: item.id,
            recordedById,
            note: `Retur dari pembatalan order #${orderNumber}`,
          },
        })
      )
    );
  }

  // ==========================================================================
  // PUBLIC METHODS
  // ==========================================================================

  /**
   * Menghitung estimasi total pesanan (tanpa menyimpan)
   * @param {Array<{productId: string, quantity: number}>} items
   * @returns {Promise<{subtotal: number, tax: number, total: number, items: Array}>}
   */
  async calculateTotal(items) {
    const productIds = items.map((item) => item.productId);
    const products = await Promise.all(
      productIds.map((id) => this.productRepo.findById(id))
    );
    const productMap = new Map(products.map((p) => [p?.id, p]));

    let subtotal = 0;
    const calculatedItems = [];
    const taxRate = await this.#getTaxRate();

    for (const item of items) {
      const product = productMap.get(item.productId);
      if (!product)
        throw ApiError.notFound({ message: "Produk tidak ditemukan." });
      if (!product.isActive)
        throw ApiError.badRequest({ message: "Produk tidak aktif." });
      const unitPrice = product.price;
      const itemSubtotal = unitPrice * item.quantity;
      subtotal += itemSubtotal;
      calculatedItems.push({
        productId: item.productId,
        productName: product.name,
        productType: product.type,
        quantity: item.quantity,
        unitPrice,
        subtotal: itemSubtotal,
        stock: product.type === "SPAREPART" ? product.stock : null,
        needMechanic: product.type === "SERVICE",
      });
    }

    const taxAmount = Math.round(subtotal * (taxRate / 100));
    return {
      subtotal,
      tax: taxAmount,
      total: subtotal + taxAmount,
      items: calculatedItems,
    };
  }

  /**
   * Membuat pesanan baru (DRAFT)
   * @param {string} cashierId
   * @param {Object} payload
   * @param {string} [payload.customerId]
   * @param {string} [payload.vehicleId]
   * @param {Array<{productId: string, quantity: number}>} payload.items
   * @returns {Promise<Object>}
   */
  async createOrder(cashierId, payload) {
    const { customerId, vehicleId, items } = payload;
    const activeShift = await this.#getActiveShift(cashierId);
    const { subtotal, processedItems } = await this.#calculateItems(items);
    const hasService = this.#hasServiceItem(processedItems);
    const cashier = await this.userRepo.findById(cashierId);

    if (hasService && !customerId)
      throw ApiError.badRequest({
        message: "Pesanan service memerlukan customer.",
      });
    if (hasService && !vehicleId)
      throw ApiError.badRequest({
        message: "Pesanan service memerlukan kendaraan.",
      });

    const orderNumber = await this.#generateUniqueOrderNumber();
    const taxRate = await this.#getTaxRate();
    const taxAmount = Math.round(subtotal * (taxRate / 100));
    const total = subtotal + taxAmount;

    const sparepartItems = processedItems.filter(
      (i) => i.productType === "SPAREPART"
    );

    const vehicle = vehicleId
      ? await prisma.vehicle.findUnique({
          where: { id: vehicleId },
          select: { plateNumber: true, brand: true, model: true },
        })
      : null;
    const customer = customerId
      ? await prisma.customer.findUnique({
          where: { id: customerId },
          select: { name: true },
        })
      : null;

    const aiNote = await this.#generateStatusNote("DRAFT", null, {
      orderNumber,
      customerName: customer?.name || "Umum",
      vehicleInfo: this.#formatVehicleInfo(vehicle),
      total,
      itemCount: processedItems.length,
      cashierName: cashier?.fullName || "-",
    });

    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          cashierId,
          shiftId: activeShift.id,
          customerId: hasService ? customerId : customerId || null,
          vehicleId: hasService ? vehicleId : vehicleId || null,
          subtotal,
          tax: taxAmount,
          total,
          items: {
            create: processedItems.map((item) => ({
              productId: item.productId,
              productNameSnapshot: item.productNameSnapshot,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              unitCostSnapshot: item.unitCostSnapshot,
              subtotal: item.subtotal,
            })),
          },
          histories: {
            create: { status: "DRAFT", changedById: cashierId, note: aiNote },
          },
        },
      });

      await this.#deductSparePartStock(
        sparepartItems,
        tx,
        newOrder.id,
        orderNumber,
        cashierId
      );

      await tx.shift.update({
        where: { id: activeShift.id },
        data: { cashSales: { increment: total } },
      });

      return newOrder;
    });

    const notificationMessage = this.#buildMarkdownNotification({
      eventTitle: "Pesanan Baru Dibuat",
      order,
      cashierName: cashier?.fullName || "-",
      customerName: customer?.name || "Umum",
      vehicleInfo: this.#formatVehicleInfo(vehicle),
      items: processedItems,
      taxRate,
      note: aiNote,
    });

    await this.#sendNotification(
      cashierId,
      `Pesanan Baru - #${orderNumber}`,
      notificationMessage,
      "SUCCESS"
    );

    logger.info("Pesanan berhasil dibuat", {
      orderId: order.id,
      orderNumber,
      total,
      itemCount: items.length,
      cashierId,
    });
    return this.orderRepo.findById(order.id);
  }

  /**
   * Mendapatkan pesanan berdasarkan ID atau nomor pesanan
   * @param {string} identifier
   * @returns {Promise<Object>}
   */
  async getOrder(identifier) {
    const order =
      (await this.orderRepo.findByOrderNumber(identifier)) ||
      (await this.orderRepo.findById(identifier));
    if (!order)
      throw ApiError.notFound({ message: "Pesanan tidak ditemukan." });
    return order;
  }

  /**
   * Mendapatkan daftar pesanan dengan filter dan paginasi
   * @param {Object} [query={}]
   * @returns {Promise<{data: Array, metadata: Object}>}
   */
  async getOrders(query = {}) {
    const result = await this.orderRepo.findMany(query);
    logger.info("Mengambil daftar pesanan", { total: result.metadata.total });
    return result;
  }

  /**
   * Mendapatkan pesanan aktif untuk kasir tertentu
   * @param {string} cashierId
   * @param {Object} [query={}]
   * @returns {Promise<{data: Array, metadata: Object}>}
   */
  async getActiveOrders(cashierId, query = {}) {
    return this.orderRepo.findActiveByCashier(cashierId, query);
  }

  /**
   * Membatalkan pesanan (restore stok + stock movement + hapus payment)
   * @param {string} orderId
   * @param {string} userId
   * @returns {Promise<Object>}
   */
  async cancelOrder(orderId, userId) {
    const order = await this.orderRepo.findById(orderId);
    this.#validateOrderEditable(order, "membatalkan");

    const changedById = userId || order.cashierId;
    const sparepartItems = await prisma.orderItem
      .findMany({
        where: { orderId: order.id },
        include: { product: { select: { type: true } } },
      })
      .then((items) =>
        items.filter((item) => item.product?.type === "SPAREPART")
      );

    const cancelNote = await this.#generateStatusNote(
      "CANCELLED",
      order.status,
      {
        orderNumber: order.orderNumber,
        customerName: order.customer?.name || "Umum",
        vehicleInfo: this.#formatVehicleInfo(order.vehicle),
        total: order.total,
        itemCount: order.items?.length || 0,
      }
    );

    await prisma.$transaction(async (tx) => {
      await this.#restoreSparePartStock(
        sparepartItems,
        tx,
        order.orderNumber,
        changedById
      );

      await tx.order.update({
        where: { id: order.id },
        data: { status: "CANCELLED" },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          status: "CANCELLED",
          changedById,
          note: cancelNote,
        },
      });

      if (order.shiftId) {
        await tx.shift.update({
          where: { id: order.shiftId },
          data: { cashSales: { decrement: order.total } },
        });
      }
      await tx.payment.deleteMany({ where: { orderId: order.id } });
    });

    await this.#invalidateOrderCache(order.orderNumber);

    const notificationMessage = this.#buildMarkdownNotification({
      eventTitle: "Pesanan Dibatalkan",
      order,
      customerName: order.customer?.name || "Umum",
      vehicleInfo: this.#formatVehicleInfo(order.vehicle),
      note: cancelNote,
    });

    await this.#sendNotification(
      order.cashierId,
      `Pesanan Dibatalkan - #${order.orderNumber}`,
      notificationMessage,
      "WARNING"
    );

    logger.warn("Pesanan dibatalkan", {
      orderId: order.id,
      orderNumber: order.orderNumber,
    });
    return this.orderRepo.findByOrderNumber(order.orderNumber);
  }

  /**
   * Memperbarui status pesanan
   * @param {string} orderId
   * @param {string} status
   * @param {string} userId
   * @returns {Promise<Object>}
   */
  async updateOrderStatus(orderId, status, userId) {
    const order = await this.orderRepo.findById(orderId);
    this.#validateOrderEditable(order, "memperbarui status");

    const changedById = userId || order.cashierId;
    const timestampMap = {
      IN_PROGRESS: "startedAt",
      COMPLETED: "completedAt",
      CLOSED: "closedAt",
    };
    const timestampUpdate = timestampMap[status]
      ? { [timestampMap[status]]: new Date() }
      : {};

    const statusNote = await this.#generateStatusNote(status, order.status, {
      orderNumber: order.orderNumber,
      customerName: order.customer?.name || "Umum",
      vehicleInfo: this.#formatVehicleInfo(order.vehicle),
      total: order.total,
      itemCount: order.items?.length || 0,
    });

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.order.update({
        where: { id: orderId },
        data: { status, updatedAt: new Date(), ...timestampUpdate },
      });
      await tx.orderStatusHistory.create({
        data: { orderId, status, changedById, note: statusNote },
      });
      return result;
    });

    await this.#invalidateOrderCache(order.orderNumber);
    logger.info("Status pesanan diperbarui", { orderId, newStatus: status });
    return updated;
  }

  /**
   * Menutup pesanan (COMPLETED -> CLOSED)
   * @param {string} orderId
   * @param {string} userId
   * @returns {Promise<Object>}
   */
  async closeOrder(orderId, userId) {
    const order = await this.orderRepo.findById(orderId);

    if (!order)
      throw ApiError.notFound({ message: "Pesanan tidak ditemukan." });
    if (order.status === "CLOSED")
      throw ApiError.conflict({ message: "Pesanan sudah ditutup." });
    if (order.status === "CANCELLED")
      throw ApiError.conflict({ message: "Pesanan sudah dibatalkan." });
    if (order.status !== "COMPLETED")
      throw ApiError.conflict({
        message: `Hanya pesanan COMPLETED yang dapat ditutup. Status saat ini: ${order.status}`,
      });

    const changedById = userId || order.cashierId;

    const closeNote = await this.#generateStatusNote("CLOSED", order.status, {
      orderNumber: order.orderNumber,
      customerName: order.customer?.name || "Umum",
      vehicleInfo: this.#formatVehicleInfo(order.vehicle),
      total: order.total,
      itemCount: order.items?.length || 0,
    });

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.order.update({
        where: { id: orderId },
        data: { status: "CLOSED", closedAt: new Date(), updatedAt: new Date() },
      });
      await tx.orderStatusHistory.create({
        data: { orderId, status: "CLOSED", changedById, note: closeNote },
      });
      return result;
    });

    await this.#invalidateOrderCache(order.orderNumber);

    const notificationMessage = this.#buildMarkdownNotification({
      eventTitle: "Pesanan Ditutup",
      order: { ...order, ...updated },
      customerName: order.customer?.name || "Umum",
      vehicleInfo: this.#formatVehicleInfo(order.vehicle),
      note: closeNote,
    });

    await this.#sendNotification(
      order.cashierId,
      `Pesanan Ditutup - #${order.orderNumber}`,
      notificationMessage,
      "SUCCESS"
    );

    logger.info("Pesanan ditutup", { orderId, orderNumber: order.orderNumber });
    return updated;
  }

  /**
   * Melacak riwayat lengkap pesanan (dengan cache)
   * @param {string} orderNumber
   * @returns {Promise<Object>}
   */
  async trackOrderHistory(orderNumber) {
    const cacheKey = `history:${orderNumber}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    const order = await prisma.order.findUnique({
      where: { orderNumber },
      include: {
        cashier: { select: { fullName: true } },
        customer: { select: { name: true, phone: true } },
        vehicle: { select: { plateNumber: true, brand: true, model: true } },
        payment: {
          select: {
            method: true,
            amountPaid: true,
            change: true,
            status: true,
            paidAt: true,
          },
        },
        items: { include: { product: { select: { name: true, type: true } } } },
        histories: {
          include: { changedBy: { select: { fullName: true } } },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!order)
      throw ApiError.notFound({
        message: `Pesanan dengan nomor '${orderNumber}' tidak ditemukan.`,
      });

    const result = {
      orderNumber: order.orderNumber,
      currentStatus: order.status,
      total: order.total,
      createdAt: order.createdAt,
      completedAt: order.completedAt,
      closedAt: order.closedAt,
      cashier: order.cashier,
      customer: order.customer,
      vehicle: order.vehicle,
      payment: order.payment,
      items: order.items,
      timeline: order.histories.map((h) => ({
        status: h.status,
        note: h.note || null,
        changedAt: h.createdAt,
        changedBy: h.changedBy?.fullName || "System",
      })),
    };

    await this.cache.set(cacheKey, result, 300);
    return result;
  }

  /**
   * Soft delete pesanan
   * @param {string} orderId
   * @returns {Promise<void>}
   */
  async softDeleteOrder(orderId) {
    const order = await this.orderRepo.findById(orderId);
    if (!order)
      throw ApiError.notFound({ message: "Pesanan tidak ditemukan." });
    await this.orderRepo.softDelete(orderId);
    await this.#invalidateOrderCache(order.orderNumber);
    logger.info("Pesanan di-soft delete", {
      orderId,
      orderNumber: order.orderNumber,
    });
  }

  /**
   * Restore pesanan
   * @param {string} orderId
   * @returns {Promise<void>}
   */
  async restoreOrder(orderId) {
    const order = await this.orderRepo.findById(orderId);
    if (!order)
      throw ApiError.notFound({ message: "Pesanan tidak ditemukan." });
    await this.orderRepo.restore(orderId);
    await this.#invalidateOrderCache(order.orderNumber);
    logger.info("Pesanan direstore", {
      orderId,
      orderNumber: order.orderNumber,
    });
  }
}

export default OrderService;
