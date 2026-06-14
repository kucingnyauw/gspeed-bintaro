import UserRepository from "#repository/userRepository.js";
import ShiftRepository from "#repository/shiftRepository.js";
import NotificationRepository from "#repository/notificationRepository.js";
import ApiError from "#shared/utils/error.js";
import logger from "#app/logger.js";
import supabase from "#lib/supabase.js";
import CacheManager from "#shared/utils/cache.js";
import JWT from "#shared/utils/jwt.js";

/**
 * Service untuk mengelola logika bisnis User
 * Menangani autentikasi, manajemen user, notifikasi, dan operasi bulk
 *
 * @class UserService
 */
class UserService {
  constructor() {
    this.userRepo = new UserRepository();
    this.shiftRepo = new ShiftRepository();
    this.notifRepo = new NotificationRepository();
    this.cache = new CacheManager("auth:user");
  }

  /**
   * Mengirim Magic Link ke email user via Supabase Auth
   * @param {string} email - Email tujuan
   * @returns {Promise<void>}
   * @throws {ApiError} 429 - Rate limit exceeded
   * @throws {ApiError} 500 - Gagal mengirim email
   * @private
   */
  async #sendMagicLink(email) {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${process.env.FRONTEND_URL}/auth/callback`,
        },
      });

      if (error) {
        if (error.code === "over_email_send_rate_limit") {
          throw ApiError.tooManyRequests({
            message: "Terlalu banyak permintaan pengiriman email. Silakan coba lagi dalam beberapa saat.",
          });
        }
        logger.warn("Gagal mengirim Magic Link", { email, error: error.message, code: error.code });
        throw ApiError.internal({ message: "Gagal mengirim email verifikasi. Silakan coba lagi." });
      }

      logger.info("Magic Link dikirim", { email });
    } catch (err) {
      if (err instanceof ApiError) throw err;
      if (err?.code === "over_email_send_rate_limit" || err?.status === 429) {
        throw ApiError.tooManyRequests({
          message: "Terlalu banyak permintaan pengiriman email. Silakan coba lagi dalam beberapa saat.",
        });
      }
      logger.error("Error saat mengirim Magic Link", { email, error: err.message });
      throw ApiError.internal({ message: "Gagal mengirim email verifikasi." });
    }
  }

  /**
   * Mengirim notifikasi ke user tertentu
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
      logger.warn("Gagal mengirim notifikasi user", { userId, error: err.message });
    }
  }

  /**
   * Mengirim notifikasi ke semua admin aktif
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
   * Mendapatkan label role dalam Bahasa Indonesia
   * @param {string} role
   * @returns {string}
   * @private
   */
  #getRoleLabel(role) {
    const labels = { ADMIN: "Admin", CASHIER: "Kasir", MECHANIC: "Mekanik" };
    return labels[role] || role;
  }

  /**
   * Validasi role yang bisa dibuat
   * @param {string} role
   * @throws {ApiError} 403
   * @private
   */
  #validateCreatableRole(role) {
    const allowedRoles = ["CASHIER", "MECHANIC"];
    if (!allowedRoles.includes(role)) {
      throw ApiError.forbidden({
        message: `Tidak dapat membuat user dengan role ${role}. Role yang diizinkan: ${allowedRoles.join(", ")}.`,
      });
    }
  }

  /**
   * Validasi role yang bisa diupdate
   * @param {string} currentRole
   * @param {string} newRole
   * @throws {ApiError} 403
   * @private
   */
  #validateUpdatableRole(currentRole, newRole) {
    if (currentRole === "ADMIN" && newRole !== "ADMIN") {
      throw ApiError.forbidden({ message: "Tidak dapat mengubah role Admin." });
    }
    const allowedRoles = ["CASHIER", "MECHANIC"];
    if (newRole && !allowedRoles.includes(newRole) && newRole !== "ADMIN") {
      throw ApiError.forbidden({
        message: `Role '${newRole}' tidak valid. Role yang diizinkan: ${allowedRoles.join(", ")}.`,
      });
    }
  }

  /**
   * Login untuk mendapatkan JWT token
   * @param {string} email - Email user
   * @returns {Promise<{user: Object, tokens: Object}>}
   * @throws {ApiError} 404 - User tidak ditemukan
   * @throws {ApiError} 403 - User tidak aktif
   * @throws {ApiError} 500 - Gagal generate token
   */
  async login(email) {
    const user = await this.userRepo.findByEmail(email);

    if (!user) {
      throw ApiError.notFound({
        message: `User dengan email '${email}' tidak ditemukan. Pastikan user sudah terdaftar di database.`,
        code: "LOGIN_USER_NOT_FOUND",
        details: { email },
      });
    }

    if (!user.isActive) {
      throw ApiError.forbidden({
        message: `Akun dengan email '${email}' tidak aktif. Hubungi admin untuk mengaktifkan akun.`,
        code: "LOGIN_USER_INACTIVE",
        details: { email, userId: user.id },
      });
    }

    try {
      const payload = {
        userId: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      };

      const tokens = JWT.generateTokenPair(payload);

      logger.info("Login berhasil", { userId: user.id, email: user.email, role: user.role });

      return {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          phone: user.phone,
          role: user.role,
          isActive: user.isActive,
          isAuthenticated: user.isAuthenticated,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        tokens,
      };
    } catch (error) {
      logger.error("Gagal generate token saat login", {
        userId: user.id,
        email: user.email,
        error: error.message,
      });

      throw ApiError.internal({
        message: "Gagal membuat token autentikasi. Silakan coba lagi.",
        code: "LOGIN_TOKEN_GENERATE_ERROR",
        details: { userId: user.id },
      });
    }
  }

  /**
   * Membuat user baru dengan role CASHIER atau MECHANIC
   * @param {Object} payload
   * @param {string} payload.fullName
   * @param {string} payload.email
   * @param {string} [payload.phone]
   * @param {string} payload.role
   * @returns {Promise<Object>}
   * @throws {ApiError} 400 - Email wajib diisi
   * @throws {ApiError} 403 - Role tidak diizinkan
   * @throws {ApiError} 409 - Email atau phone sudah digunakan
   * @throws {ApiError} 500 - Gagal membuat user di Supabase
   */
  async createUser(payload) {
    const { fullName, email, phone, role } = payload;

    this.#validateCreatableRole(role);

    if (!email) {
      throw ApiError.badRequest({ message: "Email wajib diisi untuk membuat user baru." });
    }

    const emailExists = await this.userRepo.isEmailExists(email);
    if (emailExists) {
      throw ApiError.conflict({ message: `Email ${email} sudah digunakan oleh user lain.` });
    }

    if (phone) {
      const phoneExists = await this.userRepo.isPhoneExists(phone);
      if (phoneExists) {
        throw ApiError.conflict({ message: `Nomor telepon ${phone} sudah digunakan oleh user lain.` });
      }
    }

    const { data: authData, error: authError } = await supabase.auth.admin.inviteUserByEmail(email, {
      data: { fullName, phone, role },
    });

    if (authError) {
      logger.error("Gagal membuat user di Supabase Auth", { error: authError.message });
      throw ApiError.internal({ message: `Gagal membuat user. Supabase Error: ${authError.message}` });
    }

    const userId = authData.user.id;
    let user = await this.userRepo.findById(userId);

    if (!user) {
      user = {
        id: userId,
        email,
        fullName,
        phone,
        role,
        isActive: true,
        isAuthenticated: false,
      };
    }

    const roleLabel = this.#getRoleLabel(role);

    const welcomeMessage = [
      `## Selamat Datang`,
      ``,
      `Halo **${fullName}**,`,
      ``,
      `Akun Anda telah berhasil dibuat sebagai **${roleLabel}**. Selamat bergabung di Bengkel POS.`,
      ``,
      `Silakan cek email Anda untuk verifikasi akun.`,
    ].join("\n");

    await this.#sendNotification(userId, "Selamat Datang", welcomeMessage, "SUCCESS");

    const adminMessage = [
      `## User Baru Dibuat`,
      ``,
      `**Nama:** ${fullName}`,
      `**Email:** ${email}`,
      `**Role:** ${roleLabel}`,
      `**Telepon:** ${phone || "-"}`,
    ].join("\n");

    await this.#notifyAdmins("User Baru Dibuat", adminMessage, "INFO");

    logger.info(`User dibuat: ${fullName}`, { userId, role, email });
    return user;
  }

  /**
   * Mengirim ulang Magic Link ke user yang belum terautentikasi
   * @param {string} userId
   * @returns {Promise<Object>}
   * @throws {ApiError} 404 - User tidak ditemukan
   * @throws {ApiError} 400 - User tidak memiliki email
   * @throws {ApiError} 409 - User sudah terautentikasi
   */
  async resendMagicLink(userId) {
    const user = await this.userRepo.findById(userId);

    if (!user) {
      throw ApiError.notFound({ message: `User dengan ID '${userId}' tidak ditemukan.` });
    }

    if (!user.email) {
      throw ApiError.badRequest({ message: "User tidak memiliki email. Tidak dapat mengirim Magic Link." });
    }

    if (user.isAuthenticated) {
      throw ApiError.conflict({
        message: `User '${user.fullName}' sudah terautentikasi. Tidak perlu mengirim ulang Magic Link.`,
      });
    }

    await this.#sendMagicLink(user.email);

    logger.info("Magic Link dikirim ulang", { userId, email: user.email });

    return {
      userId: user.id,
      email: user.email,
      message: "Magic Link telah dikirim ulang ke email user.",
    };
  }

  /**
   * Mendapatkan user berdasarkan ID
   * @param {string} userId
   * @returns {Promise<Object>}
   * @throws {ApiError} 404
   */
  async getUserById(userId) {
    const user = await this.userRepo.findById(userId);
    if (!user) throw ApiError.notFound({ message: `User dengan ID '${userId}' tidak ditemukan.` });
    return user;
  }

  /**
   * Mendapatkan user berdasarkan email
   * @param {string} email
   * @returns {Promise<Object>}
   * @throws {ApiError} 404
   */
  async getUserByEmail(email) {
    const user = await this.userRepo.findByEmail(email);
    if (!user) throw ApiError.notFound({ message: `User dengan email '${email}' tidak ditemukan.` });
    return user;
  }

  /**
   * Mendapatkan user berdasarkan nomor telepon
   * @param {string} phone
   * @returns {Promise<Object>}
   * @throws {ApiError} 404
   */
  async getUserByPhone(phone) {
    const user = await this.userRepo.findByPhone(phone);
    if (!user) throw ApiError.notFound({ message: `User dengan nomor telepon '${phone}' tidak ditemukan.` });
    return user;
  }

  /**
   * Mendapatkan daftar user dengan filter dan pagination
   * @param {Object} [query={}]
   * @returns {Promise<{data: Array, metadata: Object}>}
   */
  async getUsers(query = {}) {
    const result = await this.userRepo.findMany(query);
    logger.info("Mengambil daftar user", {
      total: result.metadata.total,
      page: result.metadata.currentPage,
      filters: { role: query.role, search: query.search, isActive: query.isActive },
    });
    return result;
  }

  /**
   * Mendapatkan daftar karyawan (CASHIER & MECHANIC)
   * @param {Object} [query={}]
   * @returns {Promise<{data: Array, metadata: Object}>}
   */
  async getEmployees(query = {}) {
    const result = await this.userRepo.findEmployees(query);
    logger.info("Mengambil daftar karyawan", {
      total: result.metadata.total,
      page: result.metadata.currentPage,
      role: query.role || "CASHIER & MECHANIC",
      filters: { search: query.search, isActive: query.isActive },
    });
    return result;
  }

  /**
   * Mendapatkan daftar semua admin
   * @returns {Promise<Array>}
   */
  async getAdmins() {
    const admins = await this.userRepo.findByRole("ADMIN");
    logger.info("Mengambil daftar admin", { count: admins.length });
    return admins;
  }

  /**
   * Mendapatkan user berdasarkan role tertentu
   * @param {string} role
   * @returns {Promise<Array>}
   */
  async getUsersByRole(role) {
    return this.userRepo.findByRole(role);
  }

  /**
   * Memperbarui data user
   * @param {string} userId
   * @param {Object} payload
   * @returns {Promise<Object>}
   * @throws {ApiError} 404 - User tidak ditemukan
   * @throws {ApiError} 403 - Role tidak valid
   * @throws {ApiError} 409 - Phone sudah digunakan / masih ada shift aktif
   */
  async updateUser(userId, payload) {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw ApiError.notFound({ message: `Gagal memperbarui. User dengan ID '${userId}' tidak ditemukan.` });
    }

    if (payload.role !== undefined) {
      this.#validateUpdatableRole(user.role, payload.role);
    }

    if (payload.phone && payload.phone !== user.phone) {
      const existingPhone = await this.userRepo.isPhoneExists(payload.phone, userId);
      if (existingPhone) {
        throw ApiError.conflict({
          message: `Gagal memperbarui. Nomor telepon '${payload.phone}' sudah digunakan oleh user lain.`,
        });
      }
    }

    if (payload.isActive === false && user.isActive === true) {
      const hasActiveShift = await this.shiftRepo.hasActiveShift(userId);
      if (hasActiveShift) {
        throw ApiError.conflict({
          message: `Gagal menonaktifkan. User '${user.fullName}' masih memiliki shift aktif. Tutup shift terlebih dahulu.`,
        });
      }
    }

    const updateData = {};
    if (payload.fullName !== undefined) updateData.fullName = payload.fullName;
    if (payload.phone !== undefined) updateData.phone = payload.phone;
    if (payload.role !== undefined) updateData.role = payload.role;
    if (payload.isActive !== undefined) updateData.isActive = payload.isActive;

    const updated = await this.userRepo.update(userId, updateData);

    await this.cache.delete(`email:${user.email}`);
    if (payload.email && payload.email !== user.email) {
      await this.cache.delete(`email:${payload.email}`);
    }

    const changes = [];
    if (payload.fullName !== undefined && payload.fullName !== user.fullName)
      changes.push(`Nama: ${user.fullName} -> ${payload.fullName}`);
    if (payload.phone !== undefined && payload.phone !== user.phone)
      changes.push(`Telepon: ${user.phone || "-"} -> ${payload.phone || "-"}`);
    if (payload.role !== undefined && payload.role !== user.role)
      changes.push(`Role: ${this.#getRoleLabel(user.role)} -> ${this.#getRoleLabel(payload.role)}`);
    if (payload.isActive !== undefined && payload.isActive !== user.isActive)
      changes.push(`Status: ${user.isActive ? "Aktif" : "Nonaktif"} -> ${payload.isActive ? "Aktif" : "Nonaktif"}`);

    if (changes.length > 0) {
      const notifMessage = [
        `## Profil Diperbarui`,
        ``,
        `Data akun Anda telah diperbarui:`,
        ``,
        ...changes.map((c) => `- ${c}`),
      ].join("\n");

      await this.#sendNotification(userId, "Profil Diperbarui", notifMessage, "INFO");
    }

    logger.info("User berhasil diperbarui", { userId, changes });
    return updated;
  }

  /**
   * Menghapus user dari sistem
   * @param {string} userId
   * @returns {Promise<void>}
   * @throws {ApiError} 404 - User tidak ditemukan
   * @throws {ApiError} 403 - Mencoba menghapus admin
   * @throws {ApiError} 409 - Masih memiliki shift aktif atau data relasi
   */
  async deleteUser(userId) {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw ApiError.notFound({ message: `Gagal menghapus. User dengan ID '${userId}' tidak ditemukan.` });
    }

    if (user.role === "ADMIN") {
      throw ApiError.forbidden({ message: "Tidak dapat menghapus user dengan role Admin." });
    }

    const hasActiveShift = await this.shiftRepo.hasActiveShift(userId);
    if (hasActiveShift) {
      throw ApiError.conflict({
        message: `Gagal menghapus. User '${user.fullName}' masih memiliki shift aktif.`,
      });
    }

    const hasRelations = await this.userRepo.hasRelations(userId);
    if (hasRelations) {
      throw ApiError.conflict({
        message: `Gagal menghapus. User '${user.fullName}' masih memiliki data terkait (order, expense, atau stock movement).`,
      });
    }

    const roleLabel = this.#getRoleLabel(user.role);

    await this.userRepo.delete(userId);

    const adminMessage = [
      `## User Dihapus`,
      ``,
      `User telah dihapus dari sistem.`,
      ``,
      `**Nama:** ${user.fullName}`,
      `**Email:** ${user.email}`,
      `**Role:** ${roleLabel}`,
      `**Telepon:** ${user.phone || "-"}`,
    ].join("\n");

    await this.#notifyAdmins("User Dihapus", adminMessage, "WARNING");

    logger.info("User berhasil dihapus", {
      userId,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    });
  }

  /**
   * Memvalidasi email user untuk proses autentikasi
   * @param {string} email
   * @returns {Promise<Object>}
   * @throws {ApiError} 404 - Email tidak terdaftar
   * @throws {ApiError} 403 - User tidak aktif / belum terautentikasi
   */
  async validateUserEmail(email) {
    const user = await this.userRepo.findByEmail(email);

    if (!user) {
      throw ApiError.notFound({
        message: `Akun dengan email '${email}' tidak terdaftar. Hubungi admin untuk pendaftaran.`,
      });
    }

    if (!user.isActive) {
      throw ApiError.forbidden({
        message: `Akun dengan email '${email}' telah dinonaktifkan. Hubungi admin untuk informasi lebih lanjut.`,
      });
    }

    if (!user.isAuthenticated) {
      throw ApiError.forbidden({
        message: `Akun kamu belum diaktifkan. Silakan cek email '${email}' dan klik link verifikasi yang telah dikirim.`,
      });
    }

    return user;
  }

  /**
   * Mengecek ketersediaan email
   * @param {string} email
   * @param {string} [excludeId]
   * @returns {Promise<{exists: boolean, message: string}>}
   */
  async checkEmailExists(email, excludeId = null) {
    const exists = await this.userRepo.isEmailExists(email, excludeId);
    return {
      exists,
      message: exists ? `Email '${email}' sudah terdaftar.` : `Email '${email}' tersedia.`,
    };
  }

  /**
   * Mengecek ketersediaan nomor telepon
   * @param {string} phone
   * @param {string} [excludeId]
   * @returns {Promise<{exists: boolean, message: string}>}
   */
  async checkPhoneExists(phone, excludeId = null) {
    const exists = await this.userRepo.isPhoneExists(phone, excludeId);
    return {
      exists,
      message: exists ? `Nomor telepon '${phone}' sudah digunakan.` : `Nomor telepon '${phone}' tersedia.`,
    };
  }

  /**
   * Menonaktifkan banyak user sekaligus
   * @param {string[]} userIds
   * @param {string} actorId
   * @returns {Promise<{summary: Object, details: Object}>}
   * @throws {ApiError} 400 - Tidak ada user yang dipilih atau memenuhi syarat
   */
  async deactivateUsers(userIds, actorId) {
    if (!userIds || userIds.length === 0) {
      throw ApiError.badRequest({ message: "Gagal menonaktifkan. Tidak ada user yang dipilih." });
    }

    const validIds = [];
    const skippedUsers = [];

    for (const id of userIds) {
      const user = await this.userRepo.findById(id);
      if (!user) {
        skippedUsers.push({ id, reason: "User tidak ditemukan" });
        continue;
      }
      if (user.role === "ADMIN") {
        skippedUsers.push({ id, name: user.fullName, reason: "Tidak dapat menonaktifkan Admin" });
        continue;
      }
      if (!user.isActive) {
        skippedUsers.push({ id, name: user.fullName, reason: "User sudah nonaktif" });
        continue;
      }
      const hasActiveShift = await this.shiftRepo.hasActiveShift(id);
      if (hasActiveShift) {
        skippedUsers.push({ id, name: user.fullName, reason: "Masih memiliki shift aktif" });
        continue;
      }
      validIds.push(id);
    }

    if (validIds.length === 0) {
      throw ApiError.badRequest({
        message: "Gagal menonaktifkan. Tidak ada user yang memenuhi syarat untuk dinonaktifkan.",
        details: skippedUsers,
      });
    }

    const deactivateResults = await this.userRepo.deactivateMany(validIds);

    const summary = {
      total: userIds.length,
      valid: validIds.length,
      skipped: skippedUsers.length,
      deactivated: deactivateResults.success.length,
      failed: deactivateResults.failed.length,
    };

    logger.info("Bulk deactivate user selesai", {
      summary,
      skippedUsers,
      failedDeactivates: deactivateResults.failed,
      actorId,
    });

    return {
      summary,
      details: {
        deactivated: deactivateResults.success,
        failed: deactivateResults.failed,
        skipped: skippedUsers,
      },
    };
  }

  /**
   * Mengaktifkan banyak user sekaligus
   * @param {string[]} userIds
   * @param {string} actorId
   * @returns {Promise<{summary: Object, details: Object}>}
   * @throws {ApiError} 400 - Tidak ada user yang dipilih atau memenuhi syarat
   */
  async activateUsers(userIds, actorId) {
    if (!userIds || userIds.length === 0) {
      throw ApiError.badRequest({ message: "Gagal mengaktifkan. Tidak ada user yang dipilih." });
    }

    const validIds = [];
    const skippedUsers = [];

    for (const id of userIds) {
      const user = await this.userRepo.findById(id);
      if (!user) {
        skippedUsers.push({ id, reason: "User tidak ditemukan" });
        continue;
      }
      if (user.isActive) {
        skippedUsers.push({ id, name: user.fullName, reason: "User sudah aktif" });
        continue;
      }
      validIds.push(id);
    }

    if (validIds.length === 0) {
      throw ApiError.badRequest({
        message: "Gagal mengaktifkan. Tidak ada user yang memenuhi syarat untuk diaktifkan.",
        details: skippedUsers,
      });
    }

    const activateResults = await this.userRepo.activateMany(validIds);

    const summary = {
      total: userIds.length,
      valid: validIds.length,
      skipped: skippedUsers.length,
      activated: activateResults.success.length,
      failed: activateResults.failed.length,
    };

    logger.info("Bulk activate user selesai", {
      summary,
      skippedUsers,
      failedActivates: activateResults.failed,
      actorId,
    });

    return {
      summary,
      details: {
        activated: activateResults.success,
        failed: activateResults.failed,
        skipped: skippedUsers,
      },
    };
  }
}

export default UserService;