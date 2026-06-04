import PaymentRepository from "#repository/paymentRepository.js";
import UserRepository from "#repository/userRepository.js";
import OrderRepository from "#repository/orderRepository.js";
import NotificationRepository from "#repository/notificationRepository.js";
import CacheManager from "#shared/utils/cache.js";
import Currency from "#shared/utils/currency.js";
import DateTime from "#shared/utils/datetime.js";
import ApiError from "#shared/utils/error.js";
import prisma from "#app/database.js";
import logger from "#app/logger.js";
import axios from "axios";
import midtrans from "#lib/midtrans.js";
import crypto from "crypto";
import { getIO } from "#app/io.js";

/**
 * Service untuk mengelola logika bisnis pembayaran
 *
 * Alur SERVICE: DRAFT -> (payment) -> QUEUED -> IN_PROGRESS -> COMPLETED -> CLOSED
 * Alur SPAREPART ONLY: DRAFT -> (payment) -> COMPLETED -> CLOSED
 *
 * @class PaymentService
 */
class PaymentService {
  constructor() {
    this.paymentRepo = new PaymentRepository();
    this.orderRepo = new OrderRepository();
    this.userRepo = new UserRepository();
    this.notifRepo = new NotificationRepository();
    this.cache = new CacheManager("payment");
    this.orderCache = new CacheManager("order");
  }

  /**
   * Invalidasi cache order history di namespace order
   * @param {string} orderNumber - Nomor pesanan
   * @returns {Promise<void>}
   * @private
   */
  async #invalidateOrderHistoryCache(orderNumber) {
    if (!orderNumber) return;
    await this.orderCache.invalidate(`history:${orderNumber}`);
  }

  /**
   * Kirim notifikasi ke user
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
      logger.warn("Gagal kirim notif payment", { userId, error: err.message });
    }
  }

  /**
   * Format daftar item untuk notifikasi
   * @param {Array} items - Array item pesanan
   * @returns {string} String format item
   * @private
   */
  #formatItemDetails(items) {
    if (!items?.length) return "";
    return items
      .map(
        (item, i) =>
          `  ${i + 1}. ${item.productNameSnapshot}${
            item.quantity > 1 ? ` (x${item.quantity})` : ""
          } = ${Currency.toIDR(item.subtotal)}`
      )
      .join("\n");
  }

  /**
   * Format info kendaraan
   * @param {Object} vehicle - Data kendaraan
   * @param {string} vehicle.plateNumber - Nomor plat
   * @param {string} [vehicle.brand] - Merek kendaraan
   * @param {string} [vehicle.model] - Model kendaraan
   * @returns {string} Info kendaraan terformat
   * @private
   */
  #formatVehicleInfo(vehicle) {
    if (!vehicle) return "Tidak ada kendaraan";
    return `${vehicle.plateNumber} - ${vehicle.brand || ""} ${
      vehicle.model || ""
    }`.trim();
  }

  /**
   * Cek apakah order memiliki item bertipe SERVICE
   * @param {Object} order - Data order
   * @returns {boolean} True jika ada item SERVICE
   * @private
   */
  #hasServiceItem(order) {
    return (
      order.items?.some((item) => item.product?.type === "SERVICE") ?? false
    );
  }

  /**
   * Dapatkan status order setelah pembayaran berhasil
   * @param {Object} order - Data order
   * @returns {string} "QUEUED" jika ada service, "COMPLETED" jika sparepart only
   * @private
   */
  #getStatusAfterPayment(order) {
    return this.#hasServiceItem(order) ? "QUEUED" : "COMPLETED";
  }

  /**
   * Generate note status history menggunakan AI
   * @param {string} action - payment_success | payment_failed | refund
   * @param {Object} [context={}] - Konteks untuk note
   * @returns {Promise<string>} Note yang digenerate
   * @private
   */
  async #generatePaymentNote(action, context = {}) {
    try {
      const prompts = {
        payment_success: `Buatkan catatan singkat (1-2 kalimat, maksimal 100 karakter) dalam bahasa Indonesia tentang pembayaran berhasil di bengkel Vespa.

Konteks:
- Metode: ${context.method || "-"}
- Nomor Pesanan: ${context.orderNumber || "-"}
- Total: ${context.total || "-"}
- Status Baru: ${context.newStatus || "-"}

Contoh: "Pembayaran tunai berhasil. Pesanan masuk antrian pengerjaan."`,

        payment_failed: `Buatkan catatan singkat (1-2 kalimat, maksimal 100 karakter) dalam bahasa Indonesia tentang pembayaran gagal.

Konteks:
- Metode: ${context.method || "-"}
- Nomor Pesanan: ${context.orderNumber || "-"}
- Alasan: ${context.reason || "-"}

Contoh: "Pembayaran QRIS gagal (expired). Pesanan tetap draft."`,

        refund: `Buatkan catatan singkat (1-2 kalimat, maksimal 100 karakter) dalam bahasa Indonesia tentang refund pembayaran.

Konteks:
- Nomor Pesanan: ${context.orderNumber || "-"}
- Jumlah: ${context.amount || "-"}
- Alasan: ${context.reason || "-"}

Contoh: "Pembayaran direfund. Pesanan dibatalkan."`,
      };

      const prompt = prompts[action] || prompts.payment_success;

      const response = await axios.post(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          model: "meta-llama/llama-3.1-8b-instruct",
          messages: [
            {
              role: "system",
              content:
                "Kamu adalah asisten yang membuat catatan singkat pembayaran bengkel. Jawab HANYA dengan catatan, tanpa tambahan.",
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

      return response.data.choices[0].message.content.trim();
    } catch (err) {
      logger.warn("Gagal generate AI payment note", {
        action,
        error: err.message,
      });
      return this.#getFallbackPaymentNote(action, context);
    }
  }

  /**
   * Fallback note jika AI gagal
   * @param {string} action - payment_success | payment_failed | refund
   * @param {Object} context - Konteks note
   * @returns {string} Note fallback
   * @private
   */
  #getFallbackPaymentNote(action, context) {
    const notes = {
      payment_success: `Pembayaran ${context.method || "-"} berhasil. Pesanan ${
        context.newStatus || "-"
      }.`,
      payment_failed: `Pembayaran ${context.method || "-"} gagal (${
        context.reason || "-"
      }). Pesanan tetap draft.`,
      refund: `Pembayaran direfund. Alasan: ${
        context.reason || "-"
      }. Pesanan dibatalkan.`,
    };
    return notes[action] || "Status pembayaran diperbarui.";
  }

  /**
   * Notifikasi ke semua mekanik aktif untuk task baru
   * @param {Object} order - Data order
   * @param {string} orderNumber - Nomor pesanan
   * @returns {Promise<void>}
   * @private
   */
  async #notifyMechanicsNewTask(order, orderNumber) {
    const mechanics = await prisma.user.findMany({
      where: { role: "MECHANIC", isActive: true },
      select: { id: true, fullName: true },
    });
    const serviceItems = order.items.filter(
      (i) => i.product?.type === "SERVICE"
    );
    if (!serviceItems.length) return;

    for (const mechanic of mechanics) {
      await this.#sendNotification(
        mechanic.id,
        `Task Baru - #${orderNumber}`,
        [
          `Pesanan Baru Siap Dikerjakan`,
          ``,
          `Pesanan: #${orderNumber}`,
          `Pelanggan: ${order.customer?.name || "-"}`,
          `Kendaraan: ${this.#formatVehicleInfo(order.vehicle)}`,
          ``,
          `Service:`,
          `${this.#formatItemDetails(serviceItems)}`,
        ].join("\n"),
        "INFO"
      );
    }
  }

  /**
   * Emit event pembayaran via Socket.IO
   * @param {string} orderId - ID pesanan
   * @param {string} orderNumber - Nomor pesanan
   * @param {string} status - Status pembayaran
   * @param {string} paymentStatus - Label status pembayaran
   * @returns {void}
   * @private
   */
  #emitSocket(orderId, orderNumber, status, paymentStatus) {
    try {
      const io = getIO();
      io.emit("payment:status", {
        orderId,
        orderNumber,
        status,
        paymentStatus,
      });
    } catch (err) {
      logger.error("Gagal emit socket", { orderNumber, error: err.message });
    }
  }

  /**
   * Buat pembayaran berdasarkan metode
   * @param {Object} payload - Data pembayaran
   * @param {string} payload.orderId - ID pesanan
   * @param {string} payload.method - Metode pembayaran (CASH | QRIS)
   * @param {number} [payload.amountPaid] - Jumlah dibayar (untuk CASH)
   * @returns {Promise<Object>} Hasil pembayaran
   * @throws {ApiError} 400 - Metode tidak didukung
   */
  async createPayment(payload) {
    const { orderId, method, amountPaid } = payload;
    if (method === "CASH") return this.createCashPayment(orderId, amountPaid);
    if (method === "QRIS") return this.createQrisPayment(orderId);
    throw ApiError.badRequest({
      message: `Metode '${method}' tidak didukung.`,
    });
  }

  /**
   * Proses pembayaran tunai
   * @param {string} orderId - ID pesanan
   * @param {number} amountPaid - Jumlah uang dibayarkan
   * @returns {Promise<Object>} Data pembayaran beserta order
   * @throws {ApiError} 404 - Pesanan tidak ditemukan
   * @throws {ApiError} 409 - Pesanan tidak dapat dibayar / sudah ada pembayaran
   * @throws {ApiError} 400 - Pembayaran kurang dari total
   */
  async createCashPayment(orderId, amountPaid) {
    const order = await this.orderRepo.findById(orderId);
    if (!order)
      throw ApiError.notFound({ message: "Pesanan tidak ditemukan." });
    if (["COMPLETED", "CLOSED", "CANCELLED"].includes(order.status))
      throw ApiError.conflict({
        message: `Pesanan #${order.orderNumber} tidak dapat dibayar. Status: ${order.status}`,
      });
    if (order.status !== "DRAFT")
      throw ApiError.conflict({
        message: `Hanya DRAFT yang dapat dibayar. Status: ${order.status}`,
      });

    const existing = await this.paymentRepo.findByOrderId(orderId);
    if (existing)
      throw ApiError.conflict({
        message: `Pesanan #${order.orderNumber} sudah memiliki pembayaran.`,
      });
    if (amountPaid < order.total)
      throw ApiError.badRequest({
        message: `Pembayaran kurang. Total: ${Currency.toIDR(order.total)}`,
      });

    const change = amountPaid - order.total;
    const newStatus = this.#getStatusAfterPayment(order);
    const hasService = this.#hasServiceItem(order);

    const note = await this.#generatePaymentNote("payment_success", {
      method: "CASH",
      orderNumber: order.orderNumber,
      total: Currency.toIDR(order.total),
      newStatus,
    });

    const result = await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: newStatus,
          ...(newStatus === "COMPLETED" && { completedAt: new Date() }),
        },
      });
      if (hasService)
        await tx.orderStatusHistory.create({
          data: {
            orderId,
            status: newStatus,
            changedById: order.cashierId,
            note,
          },
        });

      return tx.payment.create({
        data: {
          orderId,
          method: "CASH",
          amountPaid,
          change,
          paidAt: new Date(),
        },
        select: {
          id: true,
          method: true,
          amountPaid: true,
          change: true,
          status: true,
          paidAt: true,
          createdAt: true,
          order: {
            select: {
              id: true,
              orderNumber: true,
              status: true,
              subtotal: true,
              tax: true,
              total: true,
              cashier: { select: { id: true, fullName: true } },
              customer: { select: { id: true, name: true, phone: true } },
              vehicle: {
                select: {
                  id: true,
                  plateNumber: true,
                  brand: true,
                  model: true,
                },
              },
              items: {
                select: {
                  id: true,
                  quantity: true,
                  unitPrice: true,
                  subtotal: true,
                  productNameSnapshot: true,
                  product: { select: { id: true, name: true, type: true } },
                },
              },
            },
          },
        },
      });
    });

    await this.#invalidateOrderHistoryCache(order.orderNumber);

    await this.#sendNotification(
      order.cashierId,
      `Pembayaran Tunai - #${order.orderNumber}`,
      [
        `Pembayaran Tunai Berhasil`,
        ``,
        `Pesanan: #${order.orderNumber}`,
        `Total: ${Currency.toIDR(order.total)}`,
        `Dibayar: ${Currency.toIDR(amountPaid)}`,
        `Kembalian: ${Currency.toIDR(change)}`,
        ``,
        `Status: ${newStatus}`,
        hasService
          ? `Pesanan masuk antrian mekanik.`
          : `Pesanan sparepart selesai.`,
      ].join("\n"),
      "SUCCESS"
    );

    if (hasService)
      await this.#notifyMechanicsNewTask(order, order.orderNumber);

    logger.info("Pembayaran CASH berhasil", {
      orderId,
      orderNumber: order.orderNumber,
      amountPaid,
      newStatus,
    });
    return result;
  }

  /**
   * Buat pembayaran QRIS via Midtrans
   * @param {string} orderId - ID pesanan
   * @returns {Promise<Object>} Data QRIS (orderId, qrCodeUrl, expiry, dll)
   * @throws {ApiError} 404 - Pesanan tidak ditemukan
   * @throws {ApiError} 409 - Pesanan tidak dapat dibayar / sudah ada pembayaran
   * @throws {ApiError} 500 - Gagal memproses QRIS di Midtrans
   */
  async createQrisPayment(orderId) {
    const order = await this.orderRepo.findById(orderId);
    if (!order)
      throw ApiError.notFound({ message: "Pesanan tidak ditemukan." });
    if (["COMPLETED", "CLOSED", "CANCELLED"].includes(order.status))
      throw ApiError.conflict({
        message: `Pesanan #${order.orderNumber} tidak dapat dibayar. Status: ${order.status}`,
      });
    if (order.status !== "DRAFT")
      throw ApiError.conflict({
        message: `Hanya DRAFT yang dapat dibayar. Status: ${order.status}`,
      });

    const existing = await this.paymentRepo.findByOrderId(orderId);
    if (existing)
      throw ApiError.conflict({
        message: `Pesanan #${order.orderNumber} sudah memiliki pembayaran.`,
      });

    const itemDetails = order.items.map((item) => ({
      id: item.productId,
      price: item.unitPrice,
      quantity: item.quantity,
      name: item.productNameSnapshot,
      category: item.product?.type === "SERVICE" ? "Service" : "Sparepart",
    }));
    if (order.tax > 0)
      itemDetails.push({
        id: "TAX",
        price: order.tax,
        quantity: 1,
        name: "Pajak",
        category: "Tax",
      });

    const { formatted } = DateTime.getExpiryTime(15);

    const transaction = await midtrans.charge({
      payment_type: "qris",
      transaction_details: {
        order_id: order.orderNumber,
        gross_amount: order.total,
      },
      item_details: itemDetails,
      customer_details: {
        first_name: order.customer?.name || "Customer",
        phone: order.customer?.phone || null,
      },
      expiry: { unit: "minutes", duration: 15 },
    });

    if (!transaction || !["200", "201"].includes(transaction.status_code))
      throw ApiError.internal({ message: "Gagal memproses QRIS." });

    let qrCodeUrl = null;
    const qrAction = transaction.actions?.find(
      (a) => a.name === "generate-qr-code"
    );
    if (qrAction) qrCodeUrl = qrAction.url;

    await this.paymentRepo.create({
      orderId,
      method: "QRIS",
      amountPaid: 0,
      change: 0,
      status: "PENDING",
    });

    await this.#sendNotification(
      order.cashierId,
      `QRIS Pending - #${order.orderNumber}`,
      [
        `Pembayaran QRIS Menunggu`,
        ``,
        `Pesanan: #${order.orderNumber}`,
        `Total: ${Currency.toIDR(order.total)}`,
        ``,
        `Batas Waktu: ${formatted}`,
        `Silakan scan QR Code.`,
      ].join("\n"),
      "INFO"
    );

    logger.info("QRIS dibuat", {
      orderId,
      orderNumber: order.orderNumber,
      transactionId: transaction.transaction_id,
    });
    return {
      orderId,
      orderNumber: order.orderNumber,
      transactionId: transaction.transaction_id,
      qrCodeUrl,
      amount: order.total,
      status: "PENDING",
      expiryTimeFormatted: formatted,
    };
  }

  /**
   * Dapatkan pembayaran berdasarkan ID
   * @param {string} paymentId - ID pembayaran
   * @returns {Promise<Object>} Data pembayaran
   * @throws {ApiError} 404 - Pembayaran tidak ditemukan
   */
  async getPaymentById(paymentId) {
    const p = await this.paymentRepo.findById(paymentId);
    if (!p) throw ApiError.notFound({ message: "Pembayaran tidak ditemukan." });
    return p;
  }

  /**
   * Dapatkan daftar pembayaran dengan filter dan paginasi
   * @param {Object} [query={}] - Parameter query
   * @param {number} [query.page=1] - Nomor halaman
   * @param {number} [query.limit=10] - Jumlah per halaman
   * @param {string} [query.method] - Filter metode (CASH/QRIS)
   * @param {string} [query.status] - Filter status (PAID/PENDING/REFUNDED)
   * @returns {Promise<{data: Array, metadata: Object}>} Daftar pembayaran
   */
  async getPayments(query = {}) {
    const result = await this.paymentRepo.findMany(query);
    result.data = result.data.map((p) => {
      if (!p.order) return p;
      const subtotal = Number(p.order.subtotal) || 0;
      const tax = Number(p.order.tax) || 0;
      return {
        ...p,
        order: {
          ...p.order,
          taxRate: subtotal > 0 ? Math.round((tax / subtotal) * 100) : 0,
        },
      };
    });
    return result;
  }

  /**
   * Dapatkan pembayaran berdasarkan order ID
   * @param {string} orderId - ID pesanan
   * @returns {Promise<Object>} Data pembayaran
   * @throws {ApiError} 404 - Pesanan tidak ditemukan / belum ada pembayaran
   */
  async getPaymentByOrder(orderId) {
    const order = await this.orderRepo.findById(orderId);
    if (!order)
      throw ApiError.notFound({ message: "Pesanan tidak ditemukan." });
    const p = await this.paymentRepo.findByOrderId(orderId);
    if (!p)
      throw ApiError.notFound({
        message: `Pesanan #${order.orderNumber} belum memiliki pembayaran.`,
      });
    return p;
  }

  /**
   * Cek status pembayaran terbaru dari Midtrans (untuk QRIS)
   * @param {string} orderId - ID pesanan
   * @returns {Promise<Object>} Status pembayaran (dari DB atau Midtrans)
   * @throws {ApiError} 404 - Pesanan tidak ditemukan / belum ada pembayaran
   */
  async getPaymentStatus(orderId) {
    const order = await this.orderRepo.findById(orderId);
    if (!order)
      throw ApiError.notFound({ message: "Pesanan tidak ditemukan." });

    const p = await this.paymentRepo.findByOrderId(orderId);
    if (!p)
      throw ApiError.notFound({
        message: `Pesanan #${order.orderNumber} belum memiliki pembayaran.`,
      });

    if (p.method !== "QRIS" || p.status === "PAID" || p.status === "REFUNDED") {
      return {
        orderId: p.orderId,
        orderNumber: order.orderNumber,
        method: p.method,
        status: p.status,
        amountPaid: p.amountPaid,
        change: p.change,
        paidAt: p.paidAt,
      };
    }

    try {
      const serverKey = process.env.MIDTRANS_SERVER_KEY;
      const baseUrl =
        process.env.MIDTRANS_IS_PRODUCTION === "true"
          ? "https://api.midtrans.com/v2"
          : "https://api.sandbox.midtrans.com/v2";
      const authString = Buffer.from(`${serverKey}:`).toString("base64");

      const response = await axios.get(
        `${baseUrl}/${order.orderNumber}/status`,
        {
          headers: {
            Authorization: `Basic ${authString}`,
            "Content-Type": "application/json",
          },
          timeout: 10000,
        }
      );
      const ms = response.data;

      return {
        orderId: p.orderId,
        orderNumber: order.orderNumber,
        method: p.method,
        midtransTransactionId: ms.transaction_id,
        midtransStatus: ms.transaction_status,
        fraudStatus: ms.fraud_status,
        paymentType: ms.payment_type,
        grossAmount: ms.gross_amount,
        currency: ms.currency,
        transactionTime: ms.transaction_time,
        settlementTime: ms.settlement_time,
        expiryTime: ms.expiry_time,
        dbStatus: p.status,
      };
    } catch (err) {
      logger.error("Gagal cek status Midtrans", {
        orderId,
        error: err.message,
      });
      return {
        orderId: p.orderId,
        orderNumber: order.orderNumber,
        method: p.method,
        status: p.status,
        amountPaid: p.amountPaid,
        note: "Gagal mengambil status terbaru",
      };
    }
  }

  /**
   * Verifikasi signature webhook Midtrans
   * @param {Object} payload - Payload webhook
   * @param {string} payload.order_id - Order ID
   * @param {string} payload.status_code - Status code
   * @param {string} payload.gross_amount - Gross amount
   * @param {string} payload.signature_key - Signature key
   * @returns {boolean} True jika signature valid
   * @private
   */
  #verifyWebhookSignature(payload) {
    const { order_id, status_code, gross_amount, signature_key } = payload;
    const generated = crypto
      .createHash("sha512")
      .update(
        order_id + status_code + gross_amount + process.env.MIDTRANS_SERVER_KEY
      )
      .digest("hex");
    return generated === signature_key;
  }

  /**
   * Handle webhook notifikasi pembayaran dari Midtrans
   * @param {Object} payload - Payload webhook Midtrans
   * @returns {Promise<void>}
   * @throws {ApiError} 401 - Signature tidak valid
   * @throws {ApiError} 404 - Pesanan / pembayaran tidak ditemukan
   * @throws {ApiError} 400 - Jumlah tidak sesuai
   */
  async handleMidtransWebhook(payload) {
    const {
      order_id: orderNumber,
      transaction_status: txnStatus,
      fraud_status: fraudStatus,
      gross_amount: rawAmount,
      transaction_id: txnId,
      payment_type: paymentType,
      settlement_time: settlementTime,
    } = payload;
    const grossAmount = parseInt(rawAmount);

    if (!this.#verifyWebhookSignature(payload))
      throw ApiError.unauthorized({
        message: "Signature webhook tidak valid.",
      });

    logger.info("Webhook Midtrans", { orderNumber, txnStatus, fraudStatus });

    const order = await prisma.order.findFirst({
      where: { orderNumber, deletedAt: null },
      include: {
        items: { include: { product: { select: { type: true } } } },
        customer: true,
        vehicle: true,
      },
    });
    if (!order)
      throw ApiError.notFound({
        message: `Pesanan #${orderNumber} tidak ditemukan.`,
      });

    const payment = await this.paymentRepo.findByOrderId(order.id);
    if (!payment)
      throw ApiError.notFound({
        message: `Pembayaran #${orderNumber} tidak ditemukan.`,
      });
    if (payment.status !== "PENDING") {
      logger.info("Webhook diabaikan, status bukan PENDING", { orderNumber });
      return;
    }
    if (grossAmount !== order.total)
      throw ApiError.badRequest({ message: "Jumlah pembayaran tidak sesuai." });

    const isSuccess =
      (txnStatus === "capture" && fraudStatus === "accept") ||
      txnStatus === "settlement";
    const isFailed = ["deny", "cancel", "expire", "failure"].includes(
      txnStatus
    );
    const hasService = this.#hasServiceItem(order);

    if (isSuccess) {
      const newStatus = this.#getStatusAfterPayment(order);
      const note = await this.#generatePaymentNote("payment_success", {
        method: "QRIS",
        orderNumber,
        total: Currency.toIDR(grossAmount),
        newStatus,
      });

      await prisma.$transaction(async (tx) => {
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: "PAID",
            amountPaid: grossAmount,
            paidAt: settlementTime ? new Date(settlementTime) : new Date(),
          },
        });
        await tx.order.update({
          where: { id: order.id },
          data: {
            status: newStatus,
            ...(newStatus === "COMPLETED" && { completedAt: new Date() }),
          },
        });
        if (hasService)
          await tx.orderStatusHistory.create({
            data: {
              orderId: order.id,
              status: newStatus,
              changedById: order.cashierId,
              note,
            },
          });
      });

      await this.#invalidateOrderHistoryCache(orderNumber);
      await this.#sendNotification(
        order.cashierId,
        `QRIS Berhasil - #${orderNumber}`,
        [
          `Pembayaran QRIS Berhasil`,
          ``,
          `Pesanan: #${orderNumber}`,
          `Total: ${Currency.toIDR(grossAmount)}`,
          ``,
          `Status: ${newStatus}`,
          hasService
            ? `Pesanan masuk antrian mekanik.`
            : `Pesanan sparepart selesai.`,
        ].join("\n"),
        "SUCCESS"
      );
      if (hasService) await this.#notifyMechanicsNewTask(order, orderNumber);
      this.#emitSocket(order.id, orderNumber, "PAID", "Lunas");

      logger.info("QRIS berhasil via webhook", {
        orderNumber,
        txnId,
        newStatus,
      });
    } else if (isFailed) {
      const note = await this.#generatePaymentNote("payment_failed", {
        method: "QRIS",
        orderNumber,
        reason: txnStatus,
      });

      await prisma.$transaction(async (tx) => {
        await tx.payment.update({
          where: { id: payment.id },
          data: { status: "REFUNDED" },
        });
        if (hasService)
          await tx.orderStatusHistory.create({
            data: {
              orderId: order.id,
              status: "DRAFT",
              changedById: order.cashierId,
              note,
            },
          });
      });

      await this.#invalidateOrderHistoryCache(orderNumber);
      await this.#sendNotification(
        order.cashierId,
        `QRIS Gagal - #${orderNumber}`,
        [
          `Pembayaran QRIS Gagal`,
          ``,
          `Pesanan: #${orderNumber}`,
          `Status: ${txnStatus}`,
          `Pesanan tetap draft.`,
        ].join("\n"),
        "ERROR"
      );
      this.#emitSocket(order.id, orderNumber, "REFUNDED", "Gagal");

      logger.warn("QRIS gagal via webhook", { orderNumber, txnStatus });
    }
  }

  /**
   * Refund pembayaran
   * @param {string} paymentId - ID pembayaran
   * @param {Object} [payload={}] - Data refund
   * @param {string} [payload.reason] - Alasan refund
   * @param {string} userId - ID user yang melakukan refund
   * @returns {Promise<Object>} Data pembayaran yang sudah direfund
   * @throws {ApiError} 404 - Pembayaran tidak ditemukan
   * @throws {ApiError} 409 - Status bukan PAID
   */
  async refundPayment(paymentId, payload = {}, userId) {
    const payment = await this.paymentRepo.findById(paymentId);
    if (!payment)
      throw ApiError.notFound({ message: "Pembayaran tidak ditemukan." });
    if (payment.status !== "PAID")
      throw ApiError.conflict({ message: "Hanya PAID yang dapat direfund." });

    const reason = payload.reason || "Tidak ada alasan";
    const note = await this.#generatePaymentNote("refund", {
      orderNumber: payment.order?.orderNumber,
      amount: Currency.toIDR(payment.amountPaid),
      reason,
    });

    const updated = await prisma.$transaction(async (tx) => {
      const refunded = await tx.payment.update({
        where: { id: paymentId },
        data: { status: "REFUNDED" },
        select: {
          id: true,
          method: true,
          amountPaid: true,
          status: true,
          paidAt: true,
        },
      });
      await tx.order.update({
        where: { id: payment.order.id },
        data: { status: "CANCELLED" },
      });
      if (payment.order?.items?.some((i) => i.product?.type === "SERVICE")) {
        await tx.orderStatusHistory.create({
          data: {
            orderId: payment.order.id,
            status: "CANCELLED",
            changedById: userId || payment.order.cashierId,
            note,
          },
        });
      }
      return refunded;
    });

    await this.#invalidateOrderHistoryCache(payment.order?.orderNumber);
    await this.#sendNotification(
      payment.order?.cashierId || userId,
      `Refund - #${payment.order?.orderNumber}`,
      [
        `Pembayaran Direfund`,
        ``,
        `Pesanan: #${payment.order?.orderNumber}`,
        `Jumlah: ${Currency.toIDR(payment.amountPaid)}`,
        `Alasan: ${reason}`,
        `Status: CANCELLED`,
      ].join("\n"),
      "WARNING"
    );

    logger.warn("Pembayaran direfund", {
      paymentId,
      orderId: payment.order?.id,
      amount: payment.amountPaid,
    });
    return updated;
  }

  /**
   * Bulk refund pembayaran
   * @param {string[]} paymentIds - Array ID pembayaran
   * @param {string} userId - ID user yang melakukan refund
   * @returns {Promise<{summary: Object, details: Object}>} Ringkasan dan detail refund
   * @throws {ApiError} 400 - Tidak ada pembayaran dipilih / tidak ada yang PAID
   */
  async refundPayments(paymentIds, userId) {
    if (!paymentIds?.length)
      throw ApiError.badRequest({ message: "Tidak ada pembayaran dipilih." });

    const validIds = [];
    const skipped = [];

    for (const id of paymentIds) {
      const p = await this.paymentRepo.findById(id);
      if (!p) {
        skipped.push({ id, reason: "Tidak ditemukan" });
        continue;
      }
      if (p.status !== "PAID") {
        skipped.push({
          id,
          orderNumber: p.order?.orderNumber,
          reason: `Status ${p.status}`,
        });
        continue;
      }
      validIds.push(id);
    }

    if (!validIds.length)
      throw ApiError.badRequest({
        message: "Tidak ada pembayaran PAID.",
        details: skipped,
      });

    const user = await this.userRepo.findById(userId);
    const note = `Direfund oleh ${user.fullName} via refund massal.`;
    const results = await this.paymentRepo.refundMany(validIds, note, userId);

    for (const id of results.success) {
      const p = await this.paymentRepo.findById(id);
      if (p?.order?.orderNumber)
        await this.#invalidateOrderHistoryCache(p.order.orderNumber);
    }

    return {
      summary: {
        total: paymentIds.length,
        valid: validIds.length,
        skipped: skipped.length,
        refunded: results.success.length,
        failed: results.failed.length,
      },
      details: { refunded: results.success, failed: results.failed, skipped },
    };
  }
}

export default PaymentService;
