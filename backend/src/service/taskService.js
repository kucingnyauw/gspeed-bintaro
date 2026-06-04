import TaskRepository from "#repository/taskRepository.js";
import UserRepository from "#repository/userRepository.js";
import OrderRepository from "#repository/orderRepository.js";
import NotificationRepository from "#repository/notificationRepository.js";
import SettingRepository from "#repository/settingRepository.js";
import CacheManager from "#shared/utils/cache.js";
import DateTime from "#shared/utils/datetime.js";
import ApiError from "#shared/utils/error.js";
import Storage from "#shared/utils/storage.js";
import prisma from "#app/database.js";
import logger from "#app/logger.js";
import axios from "axios";

/**
 * Service untuk mengelola logika bisnis penugasan mekanik.
 *
 * Alur SERVICE:
 *   DRAFT -> (payment) -> QUEUED -> (assign mechanic) -> (start order) -> IN_PROGRESS -> (complete order) -> COMPLETED -> (close) -> CLOSED
 *
 * @class TaskService
 */
class TaskService {
  constructor() {
    this.taskRepo = new TaskRepository();
    this.userRepo = new UserRepository();
    this.orderRepo = new OrderRepository();
    this.notifRepo = new NotificationRepository();
    this.settingRepo = new SettingRepository();
    this.cache = new CacheManager("task");
  }

  /**
   * Invalidasi cache order history di namespace order
   * @param {string} orderNumber - Nomor pesanan
   * @returns {Promise<void>}
   * @private
   */
  async #invalidateOrderHistoryCache(orderNumber) {
    if (!orderNumber) return;
    const orderCacheManager = new CacheManager("order");
    await orderCacheManager.delete(`history:${orderNumber}`);
  }

  /**
   * Mendapatkan nilai setting dari database
   * @param {string} key - Key setting
   * @param {*} defaultValue - Nilai default jika tidak ditemukan
   * @returns {Promise<*>} Nilai setting
   * @private
   */
  async #getSetting(key, defaultValue) {
    const setting = await this.settingRepo.findByKey(key);
    return setting ? setting.value : defaultValue;
  }

  /**
   * Format detail kendaraan untuk notifikasi
   * @param {Object} vehicle - Data kendaraan
   * @param {string} vehicle.plateNumber - Nomor plat
   * @param {string} [vehicle.brand] - Merek
   * @param {string} [vehicle.model] - Model
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
   * Format daftar service untuk notifikasi
   * @param {string[]} services - Array nama service
   * @returns {string} Daftar service terformat
   * @private
   */
  #formatServiceList(services) {
    if (!services || services.length === 0) return "";
    return services.map((name, index) => `  ${index + 1}. ${name}`).join("\n");
  }

  /**
   * Generate note untuk order status history menggunakan AI
   * @param {string} action - assign | unassign | start | complete
   * @param {Object} [context={}] - Konteks untuk note
   * @returns {Promise<string>} Note yang digenerate
   * @private
   */
  async #generateTaskNote(action, context = {}) {
    try {
      const prompts = {
        assign: `Buatkan catatan singkat (1-2 kalimat, maksimal 100 karakter) dalam bahasa Indonesia tentang penugasan mekanik di bengkel Vespa.

Konteks:
- Mekanik: ${context.mechanicName || "-"}
- Jumlah Service: ${context.serviceCount || 0}
- Service: ${context.serviceNames || "-"}
- Nomor Pesanan: ${context.orderNumber || "-"}

Contoh: "Mekanik Andi ditugaskan ke 2 service: Service Ringan dan Ganti Oli. Menunggu pengerjaan dimulai."`,

        unassign: `Buatkan catatan singkat (1-2 kalimat, maksimal 100 karakter) dalam bahasa Indonesia tentang pelepasan mekanik dari pesanan.

Konteks:
- Mekanik: ${context.mechanicName || "-"}
- Nomor Pesanan: ${context.orderNumber || "-"}
- Status Pesanan: ${context.orderStatus || "-"}

Contoh: "Mekanik Andi dilepas dari pesanan. Pesanan menunggu assign mekanik baru."`,

        start: `Buatkan catatan singkat (1-2 kalimat, maksimal 100 karakter) dalam bahasa Indonesia tentang mulai pengerjaan service.

Konteks:
- Mekanik: ${context.mechanicName || "-"}
- Jumlah Service: ${context.serviceCount || 0}
- Service: ${context.serviceNames || "-"}

Contoh: "Mekanik Andi mulai mengerjakan 2 service: Service Ringan dan Ganti Oli."`,

        complete: `Buatkan catatan singkat (1-2 kalimat, maksimal 100 karakter) dalam bahasa Indonesia tentang penyelesaian pengerjaan service.

Konteks:
- Mekanik: ${context.mechanicName || "-"}
- Jumlah Service: ${context.serviceCount || 0}
- Service: ${context.serviceNames || "-"}
- Durasi: ${context.duration || "-"}

Contoh: "Semua service selesai dikerjakan oleh Andi. Durasi pengerjaan 45 menit."`,
      };

      const prompt = prompts[action] || prompts.assign;

      const response = await axios.post(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          model: "meta-llama/llama-3.1-8b-instruct",
          messages: [
            {
              role: "system",
              content:
                "Kamu adalah asisten yang membuat catatan singkat status pengerjaan bengkel. Jawab HANYA dengan catatan yang diminta, tanpa tambahan apapun.",
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
      logger.warn("Gagal generate AI task note, pakai fallback", {
        action,
        error: err.message,
      });
      return this.#getFallbackTaskNote(action, context);
    }
  }

  /**
   * Fallback note jika AI gagal
   * @param {string} action - assign | unassign | start | complete
   * @param {Object} context - Konteks note
   * @returns {string} Note fallback
   * @private
   */
  #getFallbackTaskNote(action, context) {
    const notes = {
      assign: `Mekanik ${context.mechanicName || "-"} ditugaskan ke ${
        context.serviceCount || 0
      } service: ${context.serviceNames || "-"}.`,
      unassign: `Mekanik ${
        context.mechanicName || "-"
      } dilepas dari pesanan. Status tetap ${context.orderStatus || "-"}.`,
      start: `Pengerjaan dimulai oleh ${context.mechanicName || "-"} untuk ${
        context.serviceCount || 0
      } service: ${context.serviceNames || "-"}.`,
      complete: `Semua service selesai dikerjakan oleh ${
        context.mechanicName || "-"
      }. Durasi: ${context.duration || "-"}.`,
    };
    return notes[action] || "Status task diperbarui.";
  }

  /**
   * Mendapatkan order item service yang belum di-assign
   * @param {string} orderId - ID pesanan
   * @returns {Promise<Array>} Item service unassigned
   * @throws {ApiError} 404 - Pesanan tidak ditemukan
   * @throws {ApiError} 400 - Tidak ada item service / semua sudah di-assign
   * @private
   */
  async #getUnassignedServiceItems(orderId) {
    const order = await this.orderRepo.findById(orderId);
    if (!order)
      throw ApiError.notFound({ message: "Pesanan tidak ditemukan." });
    const serviceItems = order.items?.filter(
      (item) => item.product?.type === "SERVICE"
    );
    if (!serviceItems || serviceItems.length === 0)
      throw ApiError.badRequest({
        message: "Pesanan ini tidak memiliki item service.",
      });
    const unassignedItems = serviceItems.filter(
      (item) => !item.assignments || item.assignments.length === 0
    );
    if (unassignedItems.length === 0)
      throw ApiError.badRequest({
        message: "Semua item service sudah memiliki mekanik.",
      });
    return unassignedItems;
  }

  /**
   * Validasi kapasitas mekanik
   * @param {string} mechanicId - ID mekanik
   * @returns {Promise<void>}
   * @throws {ApiError} 400 - Mekanik sudah mencapai batas maksimal tugas
   * @private
   */
  async #validateMechanicCapacity(mechanicId) {
    const maxTasks = Number(await this.#getSetting("mechanic_max_tasks", 5));
    const activeTaskCount = await this.taskRepo.getActiveTaskCount(mechanicId);
    if (activeTaskCount >= maxTasks)
      throw ApiError.badRequest({
        message: `Mekanik sudah mencapai batas maksimal ${maxTasks} tugas aktif.`,
      });
  }

  /**
   * Cek ketersediaan mekanik
   * @param {string} mechanicId - ID mekanik
   * @returns {Promise<boolean>} True jika mekanik tersedia
   * @private
   */
  async #isMechanicAvailable(mechanicId) {
    const activeTasks = await this.taskRepo.getActiveTaskCount(mechanicId);
    const maxTasks = Number(await this.#getSetting("mechanic_max_tasks", 5));
    return activeTasks < maxTasks;
  }

  /**
   * Mendapatkan assignment aktif untuk order & mekanik
   * @param {string} orderId - ID pesanan
   * @param {string} mechanicId - ID mekanik
   * @returns {Promise<Array>} Daftar assignment aktif
   * @private
   */
  async #getActiveAssignments(orderId, mechanicId) {
    return prisma.mechanicAssignment.findMany({
      where: { mechanicId, endAt: null, orderItem: { orderId } },
      select: {
        id: true,
        startAt: true,
        orderItem: {
          select: {
            id: true,
            productNameSnapshot: true,
            product: { select: { name: true } },
          },
        },
      },
    });
  }

  /**
   * Mengirim notifikasi
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
      logger.warn("Gagal mengirim notifikasi task", {
        userId,
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
  async #addSignedUrlToProduct(product) {
    if (!product?.image?.path) return product;
    product.image.url = await Storage.getSignedUrl(product.image.path);
    return product;
  }

  // ============================================================
  // PUBLIC METHODS
  // ============================================================

  /**
   * Assign mekanik ke semua item service unassigned dalam order
   *
   * Flow:
   * 1. Validasi mekanik (role, ketersediaan, kapasitas)
   * 2. Validasi order (harus QUEUED)
   * 3. Ambil item service unassigned
   * 4. Assign mekanik ke setiap item
   * 5. Catat history + notifikasi + invalidasi cache
   *
   * @param {string} orderId - ID pesanan
   * @param {string} mechanicId - ID mekanik
   * @returns {Promise<Array>} Daftar assignment yang dibuat
   *
   * @throws {ApiError} 400 - Bukan mekanik / tidak tersedia / kapasitas penuh / bukan QUEUED
   * @throws {ApiError} 404 - Pesanan tidak ditemukan
   *
   * @example
   * const assignments = await taskService.assignMechanicToOrder("order-id", "mechanic-id");
   */
  async assignMechanicToOrder(orderId, mechanicId) {
    const mechanic = await this.userRepo.findById(mechanicId);
    if (!mechanic || mechanic.role !== "MECHANIC")
      throw ApiError.badRequest({
        message: "User yang dipilih bukan mekanik.",
      });
    if (!(await this.#isMechanicAvailable(mechanicId)))
      throw ApiError.badRequest({ message: "Mekanik sedang tidak tersedia." });

    const order = await this.orderRepo.findById(orderId);
    if (!order)
      throw ApiError.notFound({ message: "Pesanan tidak ditemukan." });
    if (order.status !== "QUEUED")
      throw ApiError.badRequest({
        message: `Hanya pesanan QUEUED yang dapat di-assign. Status: ${order.status}`,
      });

    await this.#validateMechanicCapacity(mechanicId);
    const unassignedItems = await this.#getUnassignedServiceItems(orderId);

    const assignments = [];
    const serviceNames = [];
    for (const item of unassignedItems) {
      const a = await this.taskRepo.assignMechanic(item.id, mechanicId);
      assignments.push(a);
      serviceNames.push(item.productNameSnapshot || item.product?.name);
    }

    const note = await this.#generateTaskNote("assign", {
      mechanicName: mechanic.fullName,
      serviceCount: assignments.length,
      serviceNames: serviceNames.join(", "),
      orderNumber: order.orderNumber,
    });

    await prisma.orderStatusHistory.create({
      data: { orderId, status: "QUEUED", changedById: mechanicId, note },
    });

    await this.#invalidateOrderHistoryCache(order.orderNumber);

    const msg = [
      `Tugas Baru Diterima`,
      ``,
      `Pesanan: #${order.orderNumber}`,
      `Pelanggan: ${order.customer?.name || "-"}`,
      `Kendaraan: ${this.#formatVehicleInfo(order.vehicle)}`,
      ``,
      `Service (${assignments.length}):`,
      `${this.#formatServiceList(serviceNames)}`,
    ].join("\n");
    await this.#sendNotification(
      mechanicId,
      `Tugas Baru - #${order.orderNumber}`,
      msg
    );

    logger.info("Mekanik di-assign", {
      orderId,
      mechanicId,
      count: assignments.length,
    });
    return assignments;
  }

  /**
   * Unassign semua mekanik dari order
   *
   * Flow:
   * 1. Validasi order (tidak boleh COMPLETED/CLOSED/CANCELLED/DRAFT)
   * 2. Unassign semua mekanik dari item service
   * 3. Catat history + notifikasi + invalidasi cache
   *
   * @param {string} orderId - ID pesanan
   * @param {string} [userId] - ID user yang melakukan unassign
   * @returns {Promise<void>}
   *
   * @throws {ApiError} 404 - Pesanan tidak ditemukan
   * @throws {ApiError} 400 - Pesanan sudah selesai / belum dibayar / tidak ada mekanik
   *
   * @example
   * await taskService.unassignMechanicFromOrder("order-id", "user-id");
   */
  async unassignMechanicFromOrder(orderId, userId) {
    const order = await this.orderRepo.findById(orderId);
    if (!order)
      throw ApiError.notFound({ message: "Pesanan tidak ditemukan." });
    if (["COMPLETED", "CLOSED", "CANCELLED"].includes(order.status))
      throw ApiError.badRequest({
        message: "Tidak dapat unassign dari pesanan yang sudah selesai.",
      });
    if (order.status === "DRAFT")
      throw ApiError.badRequest({ message: "Pesanan belum dibayar." });

    const serviceItems = order.items?.filter(
      (i) => i.product?.type === "SERVICE" && i.assignments?.length > 0
    );
    if (!serviceItems?.length)
      throw ApiError.badRequest({
        message: "Tidak ada mekanik yang ditugaskan.",
      });

    const mechanicIds = new Set();
    const mechanicNames = [];
    for (const item of serviceItems) {
      for (const a of item.assignments) {
        mechanicIds.add(a.mechanicId);
        if (a.mechanic?.fullName) mechanicNames.push(a.mechanic.fullName);
        await this.taskRepo.unassignMechanic(a.id);
      }
    }

    const uniqueNames = [...new Set(mechanicNames)];
    const note = await this.#generateTaskNote("unassign", {
      mechanicName: uniqueNames.join(", "),
      orderNumber: order.orderNumber,
      orderStatus: order.status,
    });

    await prisma.orderStatusHistory.create({
      data: {
        orderId,
        status: order.status,
        changedById: userId || order.cashierId,
        note,
      },
    });

    await this.#invalidateOrderHistoryCache(order.orderNumber);

    for (const mId of mechanicIds) {
      await this.#sendNotification(
        mId,
        `Unassign - #${order.orderNumber}`,
        [
          `Penugasan Dilepas`,
          ``,
          `Pesanan: #${order.orderNumber}`,
          `Anda telah dilepas dari pesanan ini.`,
        ].join("\n"),
        "WARNING"
      );
    }

    logger.info("Mekanik di-unassign", { orderId });
  }

  /**
   * Dapatkan task berdasarkan ID assignment
   * @param {string} assignmentId - ID assignment
   * @returns {Promise<Object>} Data assignment
   * @throws {ApiError} 404 - Task tidak ditemukan
   *
   * @example
   * const task = await taskService.getTaskById("assignment-id");
   */
  async getTaskById(assignmentId) {
    const a = await this.taskRepo.findById(assignmentId);
    if (!a) throw ApiError.notFound({ message: "Task tidak ditemukan." });
    if (a.orderItem?.product)
      await this.#addSignedUrlToProduct(a.orderItem.product);
    return a;
  }

  /**
   * Dapatkan tasks berdasarkan order ID (grouped by service item)
   * @param {string} orderId - ID pesanan
   * @returns {Promise<Object>} Data order dengan services dan assignments
   * @throws {ApiError} 404 - Pesanan tidak ditemukan
   *
   * @example
   * const tasks = await taskService.getTasksByOrderId("order-id");
   */
  async getTasksByOrderId(orderId) {
    const order = await this.orderRepo.findById(orderId);
    if (!order)
      throw ApiError.notFound({ message: "Pesanan tidak ditemukan." });

    const tasks = await this.taskRepo.findByOrderId(orderId);
    const serviceItems =
      order.items?.filter((i) => i.product?.type === "SERVICE") || [];

    const services = await Promise.all(
      serviceItems.map(async (item) => {
        const itemAssignments = tasks.filter(
          (t) => t.orderItem?.id === item.id
        );
        let imageUrl = null;
        if (item.product?.image?.path)
          imageUrl = await Storage.getSignedUrl(item.product.image.path);

        return {
          orderItemId: item.id,
          serviceName: item.productNameSnapshot || item.product?.name,
          product: item.product
            ? {
                id: item.product.id,
                name: item.product.name,
                type: item.product.type,
                image: imageUrl,
              }
            : null,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          subtotal: item.subtotal,
          assignments: itemAssignments.map((a) => ({
            id: a.id,
            mechanic: a.mechanic
              ? { id: a.mechanic.id, fullName: a.mechanic.fullName }
              : null,
            startAt: a.startAt,
            endAt: a.endAt,
            status: a.endAt
              ? "COMPLETED"
              : a.startAt
              ? "IN_PROGRESS"
              : "PENDING",
            statusLabel: a.endAt
              ? "Selesai"
              : a.startAt
              ? "Dikerjakan"
              : "Menunggu",
          })),
        };
      })
    );

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      total: order.total,
      createdAt: order.createdAt,
      startedAt: order.startedAt,
      completedAt: order.completedAt,
      customer: order.customer
        ? {
            id: order.customer.id,
            name: order.customer.name,
            phone: order.customer.phone,
          }
        : null,
      vehicle: order.vehicle
        ? {
            id: order.vehicle.id,
            plateNumber: order.vehicle.plateNumber,
            brand: order.vehicle.brand,
            model: order.vehicle.model,
          }
        : null,
      services,
    };
  }

  /**
   * Dapatkan semua tasks dengan filter dan paginasi
   * @param {Object} [query={}] - Parameter query
   * @returns {Promise<{data: Array, metadata: Object}>} Daftar tasks
   *
   * @example
   * const { data, metadata } = await taskService.getTasks({ page: 1, limit: 10 });
   */
  async getTasks(query = {}) {
    return this.taskRepo.findMany(query);
  }

  /**
   * Dapatkan tasks berdasarkan mekanik (grouped by order)
   * @param {string} mechanicId - ID mekanik
   * @returns {Promise<Array>} Daftar order dengan services
   *
   * @example
   * const tasks = await taskService.getTasksByMechanic("mechanic-id");
   */
  async getTasksByMechanic(mechanicId) {
    const assignments = await this.taskRepo.findByMechanicId(mechanicId);
    const map = new Map();
    for (const a of assignments) {
      const oid = a.orderItem?.order?.id;
      if (!oid) continue;
      if (!map.has(oid))
        map.set(oid, {
          orderId: oid,
          orderNumber: a.orderItem.order.orderNumber,
          status: a.orderItem.order.status,
          createdAt: a.orderItem.order.createdAt,
          customer: a.orderItem.order.customer,
          vehicle: a.orderItem.order.vehicle,
          services: [],
        });
      map.get(oid).services.push({
        assignmentId: a.id,
        name: a.orderItem.productNameSnapshot || a.orderItem.product?.name,
        startAt: a.startAt,
        endAt: a.endAt,
      });
    }
    return [...map.values()];
  }

  /**
   * Dapatkan tasks yang belum di-assign
   * @param {Object} [query={}] - Parameter query
   * @returns {Promise<{data: Array, metadata: Object}>} Daftar tasks unassigned
   *
   * @example
   * const { data } = await taskService.getUnassignedTasks({ page: 1 });
   */
  async getUnassignedTasks(query = {}) {
    return this.taskRepo.findUnassignedServiceTasks(query);
  }

  /**
   * Mulai pengerjaan order (QUEUED -> IN_PROGRESS)
   *
   * Flow:
   * 1. Validasi order (harus QUEUED)
   * 2. Ambil assignment pending mekanik
   * 3. Start semua task pending
   * 4. Update order status + history + notifikasi + invalidasi cache
   *
   * @param {string} orderId - ID pesanan
   * @param {string} mechanicId - ID mekanik
   * @returns {Promise<Array>} Daftar task yang dimulai
   *
   * @throws {ApiError} 404 - Pesanan tidak ditemukan
   * @throws {ApiError} 400 - Bukan QUEUED / tidak ada task aktif
   * @throws {ApiError} 409 - Semua task sudah dimulai
   *
   * @example
   * const started = await taskService.startOrder("order-id", "mechanic-id");
   */
  async startOrder(orderId, mechanicId) {
    const order = await this.orderRepo.findById(orderId);
    if (!order)
      throw ApiError.notFound({ message: "Pesanan tidak ditemukan." });
    if (order.status !== "QUEUED")
      throw ApiError.badRequest({
        message: `Hanya QUEUED yang dapat dimulai. Status: ${order.status}`,
      });

    const mechanic = await this.userRepo.findById(mechanicId);
    const assignments = await this.#getActiveAssignments(orderId, mechanicId);
    if (!assignments.length)
      throw ApiError.badRequest({ message: "Tidak ada task aktif." });

    const pending = assignments.filter((a) => !a.startAt);
    if (!pending.length)
      throw ApiError.conflict({ message: "Semua task sudah dimulai." });

    const started = [];
    const names = [];
    const startTime = new Date();
    for (const a of pending) {
      const u = await this.taskRepo.startTask(a.id);
      started.push(u);
      names.push(
        u.orderItem?.productNameSnapshot || u.orderItem?.product?.name
      );
    }

    const note = await this.#generateTaskNote("start", {
      mechanicName: mechanic?.fullName || "-",
      serviceCount: started.length,
      serviceNames: names.join(", "),
      orderNumber: order.orderNumber,
    });

    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: { status: "IN_PROGRESS", startedAt: startTime },
      });
      await tx.orderStatusHistory.create({
        data: { orderId, status: "IN_PROGRESS", changedById: mechanicId, note },
      });
    });

    await this.#invalidateOrderHistoryCache(order.orderNumber);

    if (order.cashierId) {
      await this.#sendNotification(
        order.cashierId,
        `Pengerjaan Dimulai - #${order.orderNumber}`,
        [
          `Pengerjaan Dimulai`,
          ``,
          `Pesanan: #${order.orderNumber}`,
          `Mekanik: ${mechanic?.fullName || "-"}`,
          ``,
          `Service:`,
          `${this.#formatServiceList(names)}`,
          ``,
          `Waktu: ${DateTime.toFullID(startTime)}`,
        ].join("\n")
      );
    }

    logger.info("Order dimulai", {
      orderId,
      mechanicId,
      count: started.length,
    });
    return started;
  }

  /**
   * Selesaikan pengerjaan order (IN_PROGRESS -> COMPLETED)
   *
   * Flow:
   * 1. Validasi order (harus IN_PROGRESS)
   * 2. Ambil assignment aktif mekanik
   * 3. Complete semua task pending
   * 4. Update order status + history + notifikasi + invalidasi cache
   *
   * @param {string} orderId - ID pesanan
   * @param {string} mechanicId - ID mekanik
   * @returns {Promise<Array>} Daftar task yang diselesaikan
   *
   * @throws {ApiError} 404 - Pesanan tidak ditemukan
   * @throws {ApiError} 400 - Bukan IN_PROGRESS / tidak ada task aktif
   * @throws {ApiError} 409 - Semua task sudah selesai
   *
   * @example
   * const completed = await taskService.completeOrder("order-id", "mechanic-id");
   */
  async completeOrder(orderId, mechanicId) {
    const order = await this.orderRepo.findById(orderId);
    if (!order)
      throw ApiError.notFound({ message: "Pesanan tidak ditemukan." });
    if (order.status !== "IN_PROGRESS")
      throw ApiError.badRequest({
        message: `Hanya IN_PROGRESS yang dapat diselesaikan. Status: ${order.status}`,
      });

    const mechanic = await this.userRepo.findById(mechanicId);
    const assignments = await this.#getActiveAssignments(orderId, mechanicId);
    if (!assignments.length)
      throw ApiError.badRequest({ message: "Tidak ada task aktif." });

    const pending = assignments.filter((a) => !a.endAt && a.startAt);
    if (!pending.length)
      throw ApiError.conflict({ message: "Semua task sudah selesai." });

    const completed = [];
    const names = [];
    const completeTime = new Date();
    const duration = DateTime.toDuration(order.startedAt, completeTime);
    for (const a of pending) {
      const u = await this.taskRepo.completeTask(a.id);
      completed.push(u);
      names.push(
        u.orderItem?.productNameSnapshot || u.orderItem?.product?.name
      );
    }

    const note = await this.#generateTaskNote("complete", {
      mechanicName: mechanic?.fullName || "-",
      serviceCount: completed.length,
      serviceNames: names.join(", "),
      duration,
      orderNumber: order.orderNumber,
    });

    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: { status: "COMPLETED", completedAt: completeTime },
      });
      await tx.orderStatusHistory.create({
        data: { orderId, status: "COMPLETED", changedById: mechanicId, note },
      });
    });

    await this.#invalidateOrderHistoryCache(order.orderNumber);

    if (order.cashierId) {
      await this.#sendNotification(
        order.cashierId,
        `Pengerjaan Selesai - #${order.orderNumber}`,
        [
          `Pengerjaan Selesai`,
          ``,
          `Pesanan: #${order.orderNumber}`,
          `Mekanik: ${mechanic?.fullName || "-"}`,
          ``,
          `Service:`,
          `${this.#formatServiceList(names)}`,
          ``,
          `Durasi: ${duration}`,
          ``,
          `Pesanan siap ditutup.`,
        ].join("\n"),
        "SUCCESS"
      );
    }

    logger.info("Order selesai", {
      orderId,
      mechanicId,
      count: completed.length,
      duration,
    });
    return completed;
  }

  /**
   * Dapatkan daftar mekanik yang tersedia
   * @param {Object} [query={}] - Parameter query
   * @returns {Promise<{data: Array, metadata: Object}>} Daftar mekanik dengan status ketersediaan
   *
   * @example
   * const { data } = await taskService.getAvailableMechanics({ page: 1 });
   */
  async getAvailableMechanics(query = {}) {
    const result = await this.taskRepo.getAvailableMechanics(query);
    if (result.data?.length) {
      for (const m of result.data)
        m.isAvailable = await this.#isMechanicAvailable(m.id);
    }
    return result;
  }

  /**
   * Cek status ketersediaan mekanik
   * @param {string} mechanicId - ID mekanik
   * @returns {Promise<Object>} Status ketersediaan (isAvailable, activeTaskCount, maxTasks, remainingCapacity)
   * @throws {ApiError} 400 - Bukan mekanik
   *
   * @example
   * const status = await taskService.getMechanicAvailabilityStatus("mechanic-id");
   */
  async getMechanicAvailabilityStatus(mechanicId) {
    const m = await this.userRepo.findById(mechanicId);
    if (!m || m.role !== "MECHANIC")
      throw ApiError.badRequest({ message: "Bukan mekanik." });
    const active = await this.taskRepo.getActiveTaskCount(mechanicId);
    const max = Number(await this.#getSetting("mechanic_max_tasks", 5));
    return {
      isAvailable: active < max,
      activeTaskCount: active,
      maxTasks: max,
      remainingCapacity: max - active,
    };
  }

  /**
   * Cek apakah order item sudah memiliki mekanik
   * @param {string} orderItemId - ID order item
   * @returns {Promise<boolean>} True jika sudah ada mekanik
   *
   * @example
   * const hasMechanic = await taskService.hasMechanicAssigned("order-item-id");
   */
  async hasMechanicAssigned(orderItemId) {
    return this.taskRepo.hasMechanicAssigned(orderItemId);
  }

  /**
   * Bulk assign mekanik ke multiple orders
   * @param {Array<{orderId: string, mechanicId: string}>} assignments - Array penugasan
   * @returns {Promise<{summary: Object, details: Object}>} Ringkasan dan detail assign
   * @throws {ApiError} 400 - Tidak ada data penugasan / tidak ada yang valid
   *
   * @example
   * const result = await taskService.bulkAssignMechanics([
   *   { orderId: "order-1", mechanicId: "mech-1" },
   *   { orderId: "order-2", mechanicId: "mech-2" },
   * ]);
   */
  async bulkAssignMechanics(assignments) {
    if (!assignments?.length)
      throw ApiError.badRequest({ message: "Tidak ada data penugasan." });

    const valid = [];
    const skipped = [];
    for (const item of assignments) {
      try {
        const m = await this.userRepo.findById(item.mechanicId);
        if (!m || m.role !== "MECHANIC") {
          skipped.push({ ...item, reason: "Bukan mekanik" });
          continue;
        }
        if (!(await this.#isMechanicAvailable(item.mechanicId))) {
          skipped.push({ ...item, reason: "Tidak tersedia" });
          continue;
        }
        const o = await this.orderRepo.findById(item.orderId);
        if (!o) {
          skipped.push({ ...item, reason: "Pesanan tidak ditemukan" });
          continue;
        }
        if (o.status !== "QUEUED") {
          skipped.push({ ...item, reason: `Status ${o.status}` });
          continue;
        }
        valid.push(item);
      } catch (e) {
        skipped.push({ ...item, reason: e.message });
      }
    }

    if (!valid.length)
      throw ApiError.badRequest({
        message: "Tidak ada penugasan valid.",
        details: skipped,
      });

    const results = { success: [], failed: [] };
    for (const item of valid) {
      try {
        const a = await this.assignMechanicToOrder(
          item.orderId,
          item.mechanicId
        );
        results.success.push({
          orderId: item.orderId,
          mechanicId: item.mechanicId,
          assignments: a,
        });
      } catch (e) {
        results.failed.push({ ...item, error: e.message });
      }
    }

    return {
      summary: {
        total: assignments.length,
        valid: valid.length,
        skipped: skipped.length,
        assigned: results.success.length,
        failed: results.failed.length,
      },
      details: { assigned: results.success, failed: results.failed, skipped },
    };
  }

  /**
   * Bulk start orders
   * @param {Array<{orderId: string, mechanicId: string}>} orders - Array order yang akan dimulai
   * @returns {Promise<{summary: Object, details: Object}>} Ringkasan dan detail start
   * @throws {ApiError} 400 - Tidak ada order
   *
   * @example
   * const result = await taskService.bulkStartOrders([
   *   { orderId: "order-1", mechanicId: "mech-1" },
   * ]);
   */
  async bulkStartOrders(orders) {
    if (!orders?.length)
      throw ApiError.badRequest({ message: "Tidak ada order." });
    const results = { success: [], failed: [] };
    for (const item of orders) {
      try {
        const s = await this.startOrder(item.orderId, item.mechanicId);
        results.success.push({ orderId: item.orderId, tasks: s });
      } catch (e) {
        results.failed.push({ ...item, error: e.message });
      }
    }
    return {
      summary: {
        total: orders.length,
        started: results.success.length,
        failed: results.failed.length,
      },
      details: { started: results.success, failed: results.failed },
    };
  }

  /**
   * Bulk complete orders
   * @param {Array<{orderId: string, mechanicId: string}>} orders - Array order yang akan diselesaikan
   * @returns {Promise<{summary: Object, details: Object}>} Ringkasan dan detail complete
   * @throws {ApiError} 400 - Tidak ada order
   *
   * @example
   * const result = await taskService.bulkCompleteOrders([
   *   { orderId: "order-1", mechanicId: "mech-1" },
   * ]);
   */
  async bulkCompleteOrders(orders) {
    if (!orders?.length)
      throw ApiError.badRequest({ message: "Tidak ada order." });
    const results = { success: [], failed: [] };
    for (const item of orders) {
      try {
        const c = await this.completeOrder(item.orderId, item.mechanicId);
        results.success.push({ orderId: item.orderId, tasks: c });
      } catch (e) {
        results.failed.push({ ...item, error: e.message });
      }
    }
    return {
      summary: {
        total: orders.length,
        completed: results.success.length,
        failed: results.failed.length,
      },
      details: { completed: results.success, failed: results.failed },
    };
  }

  /**
   * Dapatkan task saya (untuk mekanik yang sedang login)
   * @param {string} mechanicId - ID mekanik
   * @param {Object} [query={}] - Parameter query
   * @returns {Promise<{data: Array, metadata: Object}>} Daftar task mekanik
   *
   * @example
   * const { data } = await taskService.getMyTasks("mechanic-id", { page: 1 });
   */
  async getMyTasks(mechanicId, query = {}) {
    return this.taskRepo.findMyTasks(mechanicId, query);
  }

  /**
   * Dapatkan riwayat task saya
   * @param {string} mechanicId - ID mekanik
   * @param {Object} [query={}] - Parameter query
   * @returns {Promise<{data: Array, metadata: Object}>} Riwayat task mekanik
   *
   * @example
   * const { data } = await taskService.getMyTaskHistory("mechanic-id", { page: 1 });
   */
  async getMyTaskHistory(mechanicId, query = {}) {
    return this.taskRepo.findHistoryByMechanic(mechanicId, query);
  }
}

export default TaskService;
