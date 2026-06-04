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
   * @param {Array} items
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
   * Format detail kendaraan
   * @param {Object} vehicle
   * @returns {string}
   * @private
   */
  #formatVehicleInfo(vehicle) {
    if (!vehicle) return "Tidak ada kendaraan";
    return `${vehicle.plateNumber} - ${vehicle.brand || ""} ${
      vehicle.model || ""
    }`.trim();
  }

  /**
   * Format daftar item untuk notifikasi
   * @param {Array} items
   * @returns {string}
   * @private
   */
  #formatItemList(items) {
    if (!items || items.length === 0) return "";
    return items
      .map((item, index) => {
        const name = item.productNameSnapshot || item.product?.name || "Item";
        const qty = item.quantity > 1 ? ` (x${item.quantity})` : "";
        const subtotal = item.subtotal || item.unitPrice * item.quantity;
        return `  ${index + 1}. ${name}${qty} = ${Currency.toIDR(subtotal)}`;
      })
      .join("\n");
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
   * @param {string} previousStatus - Status sebelumnya
   * @param {Object} context - Konteks tambahan (orderNumber, customerName, items, dll)
   * @returns {Promise<string>}
   * @private
   */
  async #generateStatusNote(status, previousStatus, context = {}) {
    try {
      const prompt = `Buatkan catatan singkat (1-2 kalimat, maksimal 100 karakter) dalam bahasa Indonesia untuk perubahan status pesanan bengkel Vespa.

Status sebelumnya: ${previousStatus || "Tidak ada (pesanan baru)"}
Status baru: ${status}

Konteks tambahan:
- Nomor Pesanan: ${context.orderNumber || "-"}
- Pelanggan: ${context.customerName || "Tidak diketahui"}
- Kendaraan: ${context.vehicleInfo || "Tidak ada"}
- Total: ${context.total ? Currency.toIDR(context.total) : "-"}
- Item: ${context.itemCount || 0} item

Catatan harus:
1. Informatif dan deskriptif
2. Menjelaskan APA yang terjadi dan MENGAPA (jika relevan)
3. Natural seperti ditulis oleh staff bengkel
4. Jangan terlalu teknis
5. JANGAN gunakan format JSON atau markup apapun

Contoh format yang baik:
"Pesanan dibuat oleh kasir Budi untuk servis Vespa Sprint 150."
"Pembayaran lunas via QRIS. Motor masuk antrian pengerjaan."
"Mekanik Andi mulai pengerjaan servis ringan dan ganti oli."
"Servis selesai. Motor siap diambil oleh pelanggan."
"Pesanan ditutup. Motor sudah diambil pelanggan."
"Pesanan dibatalkan oleh kasir. Stok sparepart dikembalikan."`;

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
   * @param {string} previousStatus
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
      CANCELLED: "Pesanan dibatalkan.",
    };
    return (
      notes[status] || `Status diubah dari "${previousStatus}" ke "${status}".`
    );
  }

  /**
   * Validasi apakah pesanan dapat diedit
   * @param {Object} order
   * @param {string} action
   * @throws {ApiError}
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
   * @param {number} quantity
   * @throws {ApiError}
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
   * @param {Array} items
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
   * @throws {ApiError}
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
   * Mengembalikan stok sparepart yang dibatalkan secara batch
   * @param {Array} sparepartItems
   * @param {Object} tx
   * @returns {Promise<void>}
   * @private
   */
  async #restoreSparePartStock(sparepartItems, tx) {
    const restorePromises = sparepartItems.map((item) =>
      tx.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.quantity } },
      })
    );
    await Promise.all(restorePromises);
  }

  /**
   * Menghitung estimasi total pesanan
   * @param {Array} items
   * @returns {Promise<Object>}
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
    const hasSparepart = sparepartItems.length > 0;

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

    const context = {
      orderNumber,
      customerName: customer?.name || "Umum",
      vehicleInfo: this.#formatVehicleInfo(vehicle),
      total,
      itemCount: processedItems.length,
    };

    const aiNote = await this.#generateStatusNote("DRAFT", null, {
      ...context,
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
            create: {
              status: "DRAFT",
              changedById: cashierId,
              note: aiNote,
            },
          },
        },
        select: {
          id: true,
          orderNumber: true,
          status: true,
          subtotal: true,
          tax: true,
          total: true,
          createdAt: true,
          customer: { select: { name: true } },
          vehicle: { select: { plateNumber: true, brand: true, model: true } },
          items: {
            select: {
              id: true,
              productId: true,
              productNameSnapshot: true,
              quantity: true,
              unitPrice: true,
              unitCostSnapshot: true,
              subtotal: true,
            },
          },
        },
      });

      if (hasSparepart) {
        await Promise.all(
          sparepartItems.map((item) =>
            tx.product.update({
              where: { id: item.productId },
              data: { stock: { decrement: item.quantity } },
            })
          )
        );
      }
      await tx.shift.update({
        where: { id: activeShift.id },
        data: { cashSales: { increment: total } },
      });
      return newOrder;
    });

    const itemList = this.#formatItemList(processedItems);
    const notificationMessage = [
      `Pesanan Baru Dibuat`,
      ``,
      `Nomor Pesanan  : #${orderNumber}`,
      `Kasir          : ${cashier?.fullName || "-"}`,
      `Pelanggan      : ${context.customerName}`,
      `Kendaraan      : ${context.vehicleInfo}`,
      ``,
      `Rincian Item (${processedItems.length}):`,
      `${itemList}`,
      ``,
      `Subtotal       : ${Currency.toIDR(subtotal)}`,
      `Pajak (${taxRate}%)   : ${Currency.toIDR(taxAmount)}`,
      `Total          : ${Currency.toIDR(total)}`,
      ``,
      `Status         : DRAFT`,
      `Waktu          : ${DateTime.toFullID(new Date())}`,
      ``,
      `${aiNote}`,
    ].join("\n");

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
   * Membatalkan pesanan
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
      if (sparepartItems.length > 0) {
        await this.#restoreSparePartStock(sparepartItems, tx);
      }

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

    const notificationMessage = [
      `Pesanan Dibatalkan`,
      ``,
      `Nomor Pesanan  : #${order.orderNumber}`,
      `Total          : ${Currency.toIDR(order.total)}`,
      `Waktu          : ${DateTime.toFullID(new Date())}`,
      ``,
      `${cancelNote}`,
    ].join("\n");

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
        select: {
          id: true,
          orderNumber: true,
          status: true,
          startedAt: true,
          completedAt: true,
          closedAt: true,
          updatedAt: true,
        },
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
        select: {
          id: true,
          orderNumber: true,
          status: true,
          closedAt: true,
          updatedAt: true,
        },
      });

      await tx.orderStatusHistory.create({
        data: { orderId, status: "CLOSED", changedById, note: closeNote },
      });

      return result;
    });

    await this.#invalidateOrderCache(order.orderNumber);

    const notificationMessage = [
      `Pesanan Ditutup`,
      ``,
      `Nomor Pesanan  : #${order.orderNumber}`,
      `Total          : ${Currency.toIDR(order.total)}`,
      `Waktu Tutup    : ${DateTime.toFullID(updated.closedAt)}`,
      ``,
      `${closeNote}`,
    ].join("\n");

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
   * Melacak riwayat lengkap pesanan
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
