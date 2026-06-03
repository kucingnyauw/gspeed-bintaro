import PaymentService from "#service/paymentService.js";
import PaymentRepository from "#repository/paymentRepository.js";
import OrderRepository from "#repository/orderRepository.js";
import NotificationRepository from "#repository/notificationRepository.js";
import UserRepository from "#repository/userRepository.js";
import SettingRepository from "#repository/settingRepository.js";
import ApiError from "#shared/utils/error.js";
import prisma from "#app/database.js";
import logger from "#app/logger.js";
import midtrans from "#lib/midtrans.js";
import axios from "axios";
import crypto from "crypto";
import { getIO } from "#app/io.js";

jest.mock("#repository/paymentRepository.js");
jest.mock("#repository/orderRepository.js");
jest.mock("#repository/notificationRepository.js");
jest.mock("#repository/userRepository.js");
jest.mock("#repository/settingRepository.js");

jest.mock("#shared/utils/cache.js", () => {
  return jest.fn().mockImplementation(() => ({
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(undefined),
    invalidate: jest.fn().mockResolvedValue(undefined),
  }));
});

jest.mock("#shared/utils/datetime.js", () => ({
  toFullID: jest.fn((date) => date ? date.toISOString() : "-"),
  getExpiryTime: jest.fn(() => ({
    iso: new Date(Date.now() + 15 * 60000).toISOString(),
    formatted: "15 menit dari sekarang",
  })),
}));

jest.mock("#shared/utils/currency.js", () => ({
  toIDR: jest.fn((amount) => `Rp ${amount?.toLocaleString?.("id-ID") || amount}`),
}));

jest.mock("#lib/midtrans.js", () => ({
  __esModule: true,
  default: { charge: jest.fn() },
}));

jest.mock("#app/io.js", () => ({
  getIO: jest.fn().mockReturnValue({ emit: jest.fn() }),
}));

jest.mock("axios");

jest.mock("#app/logger.js", () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

jest.mock("#app/database.js", () => ({
  $transaction: jest.fn((callback) =>
    callback({
      payment: {
        create: jest.fn().mockResolvedValue({
          id: "pay1",
          method: "CASH",
          amountPaid: 120000,
          change: 20000,
          status: "PAID",
          paidAt: new Date(),
          createdAt: new Date(),
          order: {
            id: "order-1",
            orderNumber: "ORD-001",
            status: "QUEUED",
            subtotal: 100000,
            tax: 11000,
            total: 111000,
            createdAt: new Date(),
            cashier: { id: "cashier-1", fullName: "Kasir" },
            customer: { id: "cust-1", name: "Budi", phone: "0812" },
            vehicle: {
              id: "v1",
              plateNumber: "B 1234 CD",
              brand: "Vespa",
              model: "Sprint",
            },
            items: [],
          },
        }),
        update: jest.fn().mockImplementation((args) =>
          Promise.resolve({
            id: args.where.id,
            status: args.data.status || "REFUNDED",
            method: "CASH",
            amountPaid: 150000,
            change: 0,
            paidAt: new Date(),
            createdAt: new Date(),
          })
        ),
      },
      order: { update: jest.fn().mockResolvedValue({}) },
      orderStatusHistory: { create: jest.fn().mockResolvedValue({}) },
    })
  ),
  order: { findFirst: jest.fn() },
  user: {
    findMany: jest
      .fn()
      .mockResolvedValue([{ id: "mech-1", fullName: "Joko", isActive: true }]),
  },
}));

describe("PaymentService", () => {
  let service;
  let mockPaymentRepo;
  let mockOrderRepo;
  let mockNotifRepo;
  let mockUserRepo;
  let mockSettingRepo;

  beforeEach(() => {
    jest.clearAllMocks();

    PaymentRepository.mockClear();
    OrderRepository.mockClear();
    NotificationRepository.mockClear();
    UserRepository.mockClear();
    SettingRepository.mockClear();

    service = new PaymentService();

    mockPaymentRepo = PaymentRepository.mock.instances[0];
    mockOrderRepo = OrderRepository.mock.instances[0];
    mockNotifRepo = NotificationRepository.mock.instances[0];
    mockUserRepo = UserRepository.mock.instances[0];
    mockSettingRepo = SettingRepository.mock.instances[0];

    mockNotifRepo.create.mockResolvedValue({});
    prisma.user.findMany.mockResolvedValue([
      { id: "mech-1", fullName: "Joko", isActive: true },
    ]);
  });

  // ============================================================
  // createPayment
  // ============================================================
  describe("createPayment", () => {
    it("should route to createCashPayment for CASH method", async () => {
      jest.spyOn(service, "createCashPayment").mockResolvedValue({ id: "pay1" });

      await service.createPayment({
        orderId: "o1",
        method: "CASH",
        amountPaid: 100000,
      });

      expect(service.createCashPayment).toHaveBeenCalledWith("o1", 100000);
    });

    it("should route to createQrisPayment for QRIS method", async () => {
      jest.spyOn(service, "createQrisPayment").mockResolvedValue({ id: "pay2" });

      await service.createPayment({ orderId: "o1", method: "QRIS" });

      expect(service.createQrisPayment).toHaveBeenCalledWith("o1");
    });

    it("should throw BadRequest for unsupported method", async () => {
      await expect(
        service.createPayment({ orderId: "o1", method: "TRANSFER" })
      ).rejects.toThrow(ApiError);

      try {
        await service.createPayment({ orderId: "o1", method: "TRANSFER" });
      } catch (error) {
        expect(error.statusCode).toBe(400);
        expect(error.message).toContain("tidak didukung");
      }
    });
  });

  // ============================================================
  // createCashPayment
  // ============================================================
  describe("createCashPayment", () => {
    const orderId = "order-1";
    const amountPaid = 120000;
    const baseOrder = {
      id: orderId,
      orderNumber: "ORD-001",
      status: "DRAFT",
      total: 100000,
      cashierId: "cashier-1",
      customer: { name: "Budi" },
      vehicle: { plateNumber: "B 1234 CD", brand: "Vespa", model: "Sprint" },
      items: [
        {
          product: { type: "SPAREPART" },
          quantity: 1,
          unitPrice: 50000,
          subtotal: 50000,
          productNameSnapshot: "Oli",
        },
        {
          product: { type: "SERVICE" },
          quantity: 1,
          unitPrice: 50000,
          subtotal: 50000,
          productNameSnapshot: "Ganti Oli",
        },
      ],
    };

    beforeEach(() => {
      mockOrderRepo.findById.mockResolvedValue(baseOrder);
      mockPaymentRepo.findByOrderId.mockResolvedValue(null);
    });

    it("should create CASH payment and transition to QUEUED when has service", async () => {
      const result = await service.createCashPayment(orderId, amountPaid);

      expect(result.id).toBe("pay1");
      expect(result.method).toBe("CASH");
      expect(service.cache.invalidate).toHaveBeenCalledWith("history:ORD-001");
      expect(mockNotifRepo.create).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining("Pembayaran CASH berhasil"),
        expect.objectContaining({
          orderId,
          amountPaid: 120000,
          change: 20000,
          newStatus: "QUEUED",
        })
      );
    });

    it("should transition to COMPLETED when only spareparts", async () => {
      mockOrderRepo.findById.mockResolvedValue({
        ...baseOrder,
        items: [
          {
            product: { type: "SPAREPART" },
            quantity: 1,
            unitPrice: 100000,
            subtotal: 100000,
            productNameSnapshot: "Oli",
          },
        ],
      });

      await service.createCashPayment(orderId, 100000);

      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it("should throw NotFound when order not found", async () => {
      mockOrderRepo.findById.mockResolvedValue(null);

      await expect(
        service.createCashPayment(orderId, amountPaid)
      ).rejects.toThrow(ApiError);

      try {
        await service.createCashPayment(orderId, amountPaid);
      } catch (error) {
        expect(error.statusCode).toBe(404);
        expect(error.message).toContain("Pesanan dengan ID 'order-1' tidak ditemukan");
      }
    });

    it.each(["COMPLETED", "CLOSED"])(
      "should throw Conflict when order is %s",
      async (status) => {
        mockOrderRepo.findById.mockResolvedValue({ ...baseOrder, status });

        await expect(
          service.createCashPayment(orderId, amountPaid)
        ).rejects.toThrow(ApiError);

        try {
          await service.createCashPayment(orderId, amountPaid);
        } catch (error) {
          expect(error.statusCode).toBe(409);
        }
      }
    );

    it("should throw Conflict when order is CANCELLED", async () => {
      mockOrderRepo.findById.mockResolvedValue({ ...baseOrder, status: "CANCELLED" });

      await expect(
        service.createCashPayment(orderId, amountPaid)
      ).rejects.toThrow(ApiError);

      try {
        await service.createCashPayment(orderId, amountPaid);
      } catch (error) {
        expect(error.statusCode).toBe(409);
        expect(error.message).toContain("sudah dibatalkan");
      }
    });

    it("should throw Conflict when order is not DRAFT", async () => {
      mockOrderRepo.findById.mockResolvedValue({ ...baseOrder, status: "QUEUED" });

      await expect(
        service.createCashPayment(orderId, amountPaid)
      ).rejects.toThrow(ApiError);

      try {
        await service.createCashPayment(orderId, amountPaid);
      } catch (error) {
        expect(error.statusCode).toBe(409);
        expect(error.message).toContain("Hanya pesanan dengan status DRAFT");
      }
    });

    it("should throw BadRequest when amount less than total", async () => {
      await expect(service.createCashPayment(orderId, 50000)).rejects.toThrow(ApiError);

      try {
        await service.createCashPayment(orderId, 50000);
      } catch (error) {
        expect(error.statusCode).toBe(400);
        expect(error.message).toContain("kurang dari total tagihan");
      }
    });

    it("should throw Conflict when payment already exists", async () => {
      mockPaymentRepo.findByOrderId.mockResolvedValue({ id: "existing" });

      await expect(
        service.createCashPayment(orderId, amountPaid)
      ).rejects.toThrow(ApiError);

      try {
        await service.createCashPayment(orderId, amountPaid);
      } catch (error) {
        expect(error.statusCode).toBe(409);
        expect(error.message).toContain("sudah memiliki pembayaran");
      }
    });

    it("should notify mechanics when order has service items", async () => {
      await service.createCashPayment(orderId, amountPaid);

      // Should notify mechanics about new task
      const mechanicNotifications = mockNotifRepo.create.mock.calls.filter(
        (call) => call[0].userId === "mech-1"
      );
      expect(mechanicNotifications.length).toBeGreaterThan(0);
    });
  });

  // ============================================================
  // createQrisPayment
  // ============================================================
  describe("createQrisPayment", () => {
    const order = {
      id: "order-2",
      orderNumber: "ORD-002",
      status: "DRAFT",
      total: 150000,
      cashierId: "cashier-1",
      tax: 0,
      customer: { name: "Budi", email: null, phone: null },
      items: [
        {
          product: { type: "SPAREPART" },
          productId: "p1",
          productNameSnapshot: "Oli",
          quantity: 2,
          unitPrice: 50000,
        },
      ],
    };

    beforeEach(() => {
      mockOrderRepo.findById.mockResolvedValue(order);
      mockPaymentRepo.findByOrderId.mockResolvedValue(null);

      midtrans.charge.mockResolvedValue({
        status_code: "201",
        transaction_id: "trx-1",
        actions: [{ name: "generate-qr-code", url: "https://qr.midtrans.com/abc" }],
      });
      mockPaymentRepo.create.mockResolvedValue({ id: "pay-qr" });
    });

    it("should return QRIS data with qrCodeUrl", async () => {
      const result = await service.createQrisPayment("order-2");

      expect(result.qrCodeUrl).toBe("https://qr.midtrans.com/abc");
      expect(result.transactionId).toBe("trx-1");
      expect(result.status).toBe("PENDING");
      expect(mockPaymentRepo.create).toHaveBeenCalled();
      expect(mockNotifRepo.create).toHaveBeenCalled();
    });

    it("should throw InternalServerError when Midtrans fails", async () => {
      midtrans.charge.mockResolvedValue({
        status_code: "400",
        status_message: "error",
      });

      await expect(service.createQrisPayment("order-2")).rejects.toThrow(ApiError);

      try {
        await service.createQrisPayment("order-2");
      } catch (error) {
        expect(error.statusCode).toBe(500);
      }
    });

    it("should throw NotFound when order not found", async () => {
      mockOrderRepo.findById.mockResolvedValue(null);

      await expect(service.createQrisPayment("order-2")).rejects.toThrow(ApiError);

      try {
        await service.createQrisPayment("order-2");
      } catch (error) {
        expect(error.statusCode).toBe(404);
      }
    });

    it("should throw Conflict when payment already exists", async () => {
      mockPaymentRepo.findByOrderId.mockResolvedValue({ id: "pay-old" });

      await expect(service.createQrisPayment("order-2")).rejects.toThrow(ApiError);

      try {
        await service.createQrisPayment("order-2");
      } catch (error) {
        expect(error.statusCode).toBe(409);
      }
    });

    it("should throw Conflict when order is not DRAFT", async () => {
      mockOrderRepo.findById.mockResolvedValue({ ...order, status: "QUEUED" });

      await expect(service.createQrisPayment("order-2")).rejects.toThrow(ApiError);
    });

    it("should handle QRIS without generate-qr-code action", async () => {
      midtrans.charge.mockResolvedValue({
        status_code: "201",
        transaction_id: "trx-2",
        actions: [],
      });

      const result = await service.createQrisPayment("order-2");

      expect(result.qrCodeUrl).toBeNull();
    });
  });

  // ============================================================
  // getPaymentById
  // ============================================================
  describe("getPaymentById", () => {
    it("should return payment when found", async () => {
      mockPaymentRepo.findById.mockResolvedValue({
        id: "pay1",
        method: "CASH",
        amountPaid: 100000,
      });

      const result = await service.getPaymentById("pay1");

      expect(result).toEqual({ id: "pay1", method: "CASH", amountPaid: 100000 });
    });

    it("should throw NotFound when not found", async () => {
      mockPaymentRepo.findById.mockResolvedValue(null);

      await expect(service.getPaymentById("pay99")).rejects.toThrow(ApiError);

      try {
        await service.getPaymentById("pay99");
      } catch (error) {
        expect(error.statusCode).toBe(404);
        expect(error.message).toContain("Pembayaran dengan ID 'pay99' tidak ditemukan");
      }
    });
  });

  // ============================================================
  // getPayments
  // ============================================================
  describe("getPayments", () => {
    it("should return payments with calculated taxRate", async () => {
      mockPaymentRepo.findMany.mockResolvedValue({
        data: [
          {
            id: "pay1",
            order: { id: "o1", subtotal: 100000, tax: 11000 },
          },
          {
            id: "pay2",
            order: { id: "o2", subtotal: 0, tax: 0 },
          },
        ],
        metadata: { total: 2, currentPage: 1 },
      });

      const result = await service.getPayments({ page: 1 });

      expect(result.data).toHaveLength(2);
      expect(result.data[0].order.taxRate).toBe(11);
      expect(result.data[1].order.taxRate).toBe(0);
      expect(result.metadata.total).toBe(2);
    });

    it("should handle payment without order", async () => {
      mockPaymentRepo.findMany.mockResolvedValue({
        data: [{ id: "pay1", order: null }],
        metadata: { total: 1 },
      });

      const result = await service.getPayments();

      expect(result.data[0].order).toBeNull();
    });
  });

  // ============================================================
  // getPaymentByOrder
  // ============================================================
  describe("getPaymentByOrder", () => {
    it("should return payment for order", async () => {
      mockOrderRepo.findById.mockResolvedValue({
        id: "o1",
        orderNumber: "ORD-001",
      });
      mockPaymentRepo.findByOrderId.mockResolvedValue({
        id: "pay1",
        method: "CASH",
      });

      const result = await service.getPaymentByOrder("o1");

      expect(result).toEqual({ id: "pay1", method: "CASH" });
    });

    it("should throw NotFound when order not found", async () => {
      mockOrderRepo.findById.mockResolvedValue(null);

      await expect(service.getPaymentByOrder("o1")).rejects.toThrow(ApiError);
    });

    it("should throw NotFound when payment not found for order", async () => {
      mockOrderRepo.findById.mockResolvedValue({
        id: "o1",
        orderNumber: "ORD-001",
      });
      mockPaymentRepo.findByOrderId.mockResolvedValue(null);

      await expect(service.getPaymentByOrder("o1")).rejects.toThrow(ApiError);

      try {
        await service.getPaymentByOrder("o1");
      } catch (error) {
        expect(error.statusCode).toBe(404);
        expect(error.message).toContain("belum memiliki pembayaran");
      }
    });
  });

  // ============================================================
  // getPaymentStatus
  // ============================================================
  describe("getPaymentStatus", () => {
    it("should return status for CASH payment", async () => {
      mockOrderRepo.findById.mockResolvedValue({
        id: "o1",
        orderNumber: "ORD-001",
      });
      mockPaymentRepo.findByOrderId.mockResolvedValue({
        id: "pay1",
        method: "CASH",
        status: "PAID",
        amountPaid: 100000,
        change: 0,
        paidAt: new Date(),
        orderId: "o1",
      });

      const result = await service.getPaymentStatus("o1");

      expect(result.method).toBe("CASH");
      expect(result.status).toBe("PAID");
    });

    it("should return status for already settled QRIS payment", async () => {
      mockOrderRepo.findById.mockResolvedValue({
        id: "o1",
        orderNumber: "ORD-001",
      });
      mockPaymentRepo.findByOrderId.mockResolvedValue({
        id: "pay1",
        method: "QRIS",
        status: "PAID",
        amountPaid: 100000,
        change: 0,
        paidAt: new Date(),
        orderId: "o1",
      });

      const result = await service.getPaymentStatus("o1");

      expect(result.status).toBe("PAID");
    });

    it("should return status for REFUNDED QRIS payment", async () => {
      mockOrderRepo.findById.mockResolvedValue({
        id: "o1",
        orderNumber: "ORD-001",
      });
      mockPaymentRepo.findByOrderId.mockResolvedValue({
        id: "pay1",
        method: "QRIS",
        status: "REFUNDED",
        amountPaid: 100000,
        change: 0,
        paidAt: new Date(),
        orderId: "o1",
      });

      const result = await service.getPaymentStatus("o1");

      expect(result.status).toBe("REFUNDED");
    });
  });

  // ============================================================
  // refundPayment
  // ============================================================
  describe("refundPayment", () => {
    const payment = {
      id: "pay1",
      status: "PAID",
      amountPaid: 150000,
      order: {
        id: "order-1",
        cashierId: "c1",
        orderNumber: "ORD-001",
      },
    };

    it("should refund payment and cancel order", async () => {
      mockPaymentRepo.findById.mockResolvedValue(payment);
      mockOrderRepo.findById.mockResolvedValue({
        items: [{ product: { type: "SERVICE" } }],
      });

      const result = await service.refundPayment("pay1", { reason: "Test" }, "u1");

      expect(result.status).toBe("REFUNDED");
      expect(service.cache.invalidate).toHaveBeenCalledWith("history:ORD-001");
      expect(mockNotifRepo.create).toHaveBeenCalled();
      expect(logger.warn).toHaveBeenCalledWith(
        "Pembayaran direfund, pesanan dibatalkan",
        expect.objectContaining({
          paymentId: "pay1",
          amountPaid: 150000,
          reason: "Test",
        })
      );
    });

    it("should use default reason when not provided", async () => {
      mockPaymentRepo.findById.mockResolvedValue(payment);
      mockOrderRepo.findById.mockResolvedValue({
        items: [{ product: { type: "SPAREPART" } }],
      });

      await service.refundPayment("pay1", {}, "u1");

      // Should succeed with default reason
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it("should throw NotFound when payment not found", async () => {
      mockPaymentRepo.findById.mockResolvedValue(null);

      await expect(service.refundPayment("pay99", {}, "u1")).rejects.toThrow(ApiError);

      try {
        await service.refundPayment("pay99", {}, "u1");
      } catch (error) {
        expect(error.statusCode).toBe(404);
        expect(error.message).toContain("Pembayaran dengan ID 'pay99' tidak ditemukan");
      }
    });

    it("should throw Conflict when payment not PAID", async () => {
      mockPaymentRepo.findById.mockResolvedValue({ ...payment, status: "PENDING" });

      await expect(service.refundPayment("pay1", {}, "u1")).rejects.toThrow(ApiError);

      try {
        await service.refundPayment("pay1", {}, "u1");
      } catch (error) {
        expect(error.statusCode).toBe(409);
        expect(error.message).toContain("Hanya pembayaran dengan status PAID");
      }
    });
  });

  // ============================================================
  // refundPayments (Bulk)
  // ============================================================
  describe("refundPayments", () => {
    it("should refund multiple payments successfully", async () => {
      mockPaymentRepo.findById
        .mockResolvedValueOnce({
          id: "pay1",
          status: "PAID",
          order: { orderNumber: "ORD-001" },
        })
        .mockResolvedValueOnce({
          id: "pay2",
          status: "PAID",
          order: { orderNumber: "ORD-002" },
        });

      mockUserRepo.findById.mockResolvedValue({
        id: "u1",
        fullName: "Admin",
      });
      mockPaymentRepo.refundMany.mockResolvedValue({
        success: [{ id: "pay1" }, { id: "pay2" }],
        failed: [],
      });

      const result = await service.refundPayments(["pay1", "pay2"], "u1");

      expect(result.summary.total).toBe(2);
      expect(result.summary.refunded).toBe(2);
      expect(result.summary.failed).toBe(0);
    });

    it("should throw BadRequest when paymentIds is empty", async () => {
      await expect(service.refundPayments([], "u1")).rejects.toThrow(ApiError);

      try {
        await service.refundPayments([], "u1");
      } catch (error) {
        expect(error.statusCode).toBe(400);
        expect(error.message).toContain("Tidak ada pembayaran yang dipilih");
      }
    });

    it("should skip non-PAID payments", async () => {
      mockPaymentRepo.findById.mockResolvedValue({
        id: "pay1",
        status: "PENDING",
        order: { orderNumber: "ORD-001" },
      });
      mockPaymentRepo.refundMany.mockResolvedValue({
        success: [],
        failed: [],
      });

      await expect(
        service.refundPayments(["pay1"], "u1")
      ).rejects.toThrow(ApiError);

      try {
        await service.refundPayments(["pay1"], "u1");
      } catch (error) {
        expect(error.statusCode).toBe(400);
        expect(error.details[0].reason).toContain("hanya PAID yang dapat direfund");
      }
    });
  });

  // ============================================================
  // handleMidtransWebhook
  // ============================================================
  describe("handleMidtransWebhook", () => {
    const validPayload = {
      order_id: "ORD-001",
      status_code: "200",
      gross_amount: "150000",
      signature_key: "valid_sig",
      transaction_status: "settlement",
      fraud_status: "accept",
      transaction_id: "trx-1",
      payment_type: "qris",
    };

    const order = {
      id: "order-1",
      orderNumber: "ORD-001",
      total: 150000,
      cashierId: "c1",
      customer: { name: "Budi" },
      vehicle: {
        plateNumber: "B 1234 CD",
        brand: "Vespa",
        model: "Sprint",
      },
      items: [
        {
          product: { type: "SERVICE" },
          productNameSnapshot: "Ganti Oli",
          quantity: 1,
          unitPrice: 150000,
          subtotal: 150000,
        },
      ],
    };

    beforeEach(() => {
      jest.spyOn(crypto, "createHash").mockReturnValue({
        update: jest.fn().mockReturnValue({
          digest: jest.fn().mockReturnValue("valid_sig"),
        }),
      });

      prisma.order.findFirst.mockResolvedValue(order);
      mockPaymentRepo.findByOrderId.mockResolvedValue({
        id: "pay1",
        status: "PENDING",
      });
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it("should process successful payment webhook", async () => {
      await service.handleMidtransWebhook(validPayload);

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(service.cache.invalidate).toHaveBeenCalledWith("history:ORD-001");
    });

    it("should handle failed payment webhook (deny)", async () => {
      await service.handleMidtransWebhook({
        ...validPayload,
        transaction_status: "deny",
      });

      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it("should handle failed payment webhook (cancel)", async () => {
      await service.handleMidtransWebhook({
        ...validPayload,
        transaction_status: "cancel",
      });

      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it("should handle failed payment webhook (expire)", async () => {
      await service.handleMidtransWebhook({
        ...validPayload,
        transaction_status: "expire",
      });

      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it("should throw Unauthorized when signature invalid", async () => {
      jest.spyOn(crypto, "createHash").mockReturnValue({
        update: jest.fn().mockReturnValue({
          digest: jest.fn().mockReturnValue("wrong_sig"),
        }),
      });

      await expect(
        service.handleMidtransWebhook(validPayload)
      ).rejects.toThrow(ApiError);

      try {
        await service.handleMidtransWebhook(validPayload);
      } catch (error) {
        expect(error.statusCode).toBe(401);
      }
    });

    it("should skip when payment not PENDING", async () => {
      mockPaymentRepo.findByOrderId.mockResolvedValue({
        id: "pay1",
        status: "PAID",
      });

      await service.handleMidtransWebhook(validPayload);

      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it("should throw BadRequest when gross amount mismatch", async () => {
      await expect(
        service.handleMidtransWebhook({
          ...validPayload,
          gross_amount: "100000",
        })
      ).rejects.toThrow(ApiError);

      try {
        await service.handleMidtransWebhook({
          ...validPayload,
          gross_amount: "100000",
        });
      } catch (error) {
        expect(error.statusCode).toBe(400);
        expect(error.message).toContain("Jumlah pembayaran tidak sesuai");
      }
    });

    it("should throw NotFound when order not found", async () => {
      prisma.order.findFirst.mockResolvedValue(null);

      await expect(
        service.handleMidtransWebhook(validPayload)
      ).rejects.toThrow(ApiError);

      try {
        await service.handleMidtransWebhook(validPayload);
      } catch (error) {
        expect(error.statusCode).toBe(404);
      }
    });

    it("should throw NotFound when payment not found", async () => {
      mockPaymentRepo.findByOrderId.mockResolvedValue(null);

      await expect(
        service.handleMidtransWebhook(validPayload)
      ).rejects.toThrow(ApiError);

      try {
        await service.handleMidtransWebhook(validPayload);
      } catch (error) {
        expect(error.statusCode).toBe(404);
      }
    });

    it("should ignore non-actionable transaction status", async () => {
      await service.handleMidtransWebhook({
        ...validPayload,
        transaction_status: "pending",
      });

      // Should not call $transaction for "pending" status
      // But should not throw either
    });
  });
});