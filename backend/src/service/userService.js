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
 * @description
 * Fitur utama:
 * - Login dengan JWT token generation
 * - Manajemen user (CRUD) dengan validasi role dan data
 * - Pengiriman Magic Link via Supabase Auth
 * - Notifikasi user dan admin
 * - Operasi bulk (activate/deactivate banyak user)
 * - Caching dengan CacheManager
 *
 * @example
 * const userService = new UserService();
 * const { user, tokens } = await userService.login("admin@bengkel.com");
 */
class UserService {
  /**
   * Inisialisasi UserService dengan repository dan dependencies
   * @constructor
   */
  constructor() {
    this.userRepo = new UserRepository();
    this.shiftRepo = new ShiftRepository();
    this.notifRepo = new NotificationRepository();
    this.cache = new CacheManager("auth:user");
  }

  /**
   * Mengirim Magic Link ke email user via Supabase Auth
   * @param {string} email - Email tujuan pengiriman Magic Link
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
            message:
              "Terlalu banyak permintaan pengiriman email. Silakan coba lagi dalam beberapa saat.",
          });
        }
        logger.warn("Gagal mengirim Magic Link", {
          email,
          error: error.message,
          code: error.code,
        });
        throw ApiError.internal({
          message: "Gagal mengirim email verifikasi. Silakan coba lagi.",
        });
      }

      logger.info("Magic Link dikirim", { email });
    } catch (err) {
      if (err instanceof ApiError) throw err;
      if (err?.code === "over_email_send_rate_limit" || err?.status === 429) {
        throw ApiError.tooManyRequests({
          message:
            "Terlalu banyak permintaan pengiriman email. Silakan coba lagi dalam beberapa saat.",
        });
      }
      logger.error("Error saat mengirim Magic Link", {
        email,
        error: err.message,
      });
      throw ApiError.internal({ message: "Gagal mengirim email verifikasi." });
    }
  }

  /**
   * Mengirim notifikasi ke user tertentu
   * @param {string} userId - ID user penerima notifikasi
   * @param {string} title - Judul notifikasi
   * @param {string} message - Pesan notifikasi
   * @param {string} [type="INFO"] - Tipe notifikasi (INFO/SUCCESS/WARNING/ERROR)
   * @returns {Promise<void>}
   * @private
   */
  async #sendNotification(userId, title, message, type = "INFO") {
    if (!userId) return;
    try {
      await this.notifRepo.create({ title, message, type, userId });
    } catch (err) {
      logger.warn("Gagal mengirim notifikasi user", {
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
   * Mendapatkan label role dalam Bahasa Indonesia
   * @param {string} role - Role user
   * @returns {string} Label role
   * @private
   */
  #getRoleLabel(role) {
    const labels = { ADMIN: "Admin", CASHIER: "Kasir", MECHANIC: "Mekanik" };
    return labels[role] || role;
  }

  /**
   * Validasi role yang bisa dibuat
   * @param {string} role - Role yang akan divalidasi
   * @throws {ApiError} 403 - Role tidak diizinkan
   * @private
   */
  #validateCreatableRole(role) {
    const allowedRoles = ["CASHIER", "MECHANIC"];
    if (!allowedRoles.includes(role)) {
      throw ApiError.forbidden({
        message: `Tidak dapat membuat user dengan role ${role}. Role yang diizinkan: ${allowedRoles.join(
          ", "
        )}.`,
      });
    }
  }

  /**
   * Validasi role yang bisa diupdate
   * @param {string} currentRole - Role saat ini
   * @param {string} newRole - Role baru
   * @throws {ApiError} 403 - Role tidak valid atau mencoba mengubah admin
   * @private
   */
  #validateUpdatableRole(currentRole, newRole) {
    if (currentRole === "ADMIN" && newRole !== "ADMIN") {
      throw ApiError.forbidden({ message: "Tidak dapat mengubah role Admin." });
    }
    const allowedRoles = ["CASHIER", "MECHANIC"];
    if (newRole && !allowedRoles.includes(newRole) && newRole !== "ADMIN") {
      throw ApiError.forbidden({
        message: `Role '${newRole}' tidak valid. Role yang diizinkan: ${allowedRoles.join(
          ", "
        )}.`,
      });
    }
  }

  /**
   * Login untuk mendapatkan JWT token
   * Generate JWT token untuk user yang sudah terdaftar
   *
   * @param {string} email - Email user yang akan login
   * @returns {Promise<{user: Object, tokens: Object}>} User data dan token pair
   * @returns {Object} return.user - Data user
   * @returns {string} return.user.id - User ID
   * @returns {string} return.user.email - Email user
   * @returns {string} return.user.fullName - Nama lengkap user
   * @returns {string|null} return.user.phone - Nomor telepon user
   * @returns {string} return.user.role - Role user (ADMIN/CASHIER/MECHANIC)
   * @returns {boolean} return.user.isActive - Status aktif user
   * @returns {boolean} return.user.isAuthenticated - Status autentikasi user
   * @returns {string} return.user.createdAt - Tanggal pembuatan
   * @returns {string} return.user.updatedAt - Tanggal update terakhir
   * @returns {Object} return.tokens - Token pair
   * @returns {string} return.tokens.accessToken - JWT access token (expires in 15m)
   * @returns {string} return.tokens.refreshToken - JWT refresh token (expires in 7d)
   *
   * @throws {ApiError} 400 - LOGIN_EMAIL_REQUIRED - Jika email tidak diisi
   * @throws {ApiError} 400 - LOGIN_INVALID_EMAIL_FORMAT - Jika format email tidak valid
   * @throws {ApiError} 404 - LOGIN_USER_NOT_FOUND - Jika user tidak ditemukan
   * @throws {ApiError} 403 - LOGIN_USER_INACTIVE - Jika user tidak aktif
   * @throws {ApiError} 500 - LOGIN_TOKEN_GENERATE_ERROR - Jika gagal generate token
   *
   * @example
   * // Login dengan email
   * const { user, tokens } = await userService.login("admin@bengkel.com");
   * console.log(user.fullName); // "Admin User"
   * console.log(tokens.accessToken); // "eyJhbGciOiJIUzI1NiIs..."
   *
   * @example
   * // Error handling
   * try {
   *   const result = await userService.login("nonexistent@email.com");
   * } catch (error) {
   *   if (error.code === "LOGIN_USER_NOT_FOUND") {
   *     // Handle user not found
   *   }
   * }
   */
  /**
   * Login untuk mendapatkan JWT token
   * Generate JWT token untuk user yang sudah terdaftar
   *
   * @param {string} email - Email user yang akan login
   * @returns {Promise<{user: Object, tokens: Object}>} User data dan token pair
   * @returns {Object} return.user - Data user
   * @returns {string} return.user.id - User ID
   * @returns {string} return.user.email - Email user
   * @returns {string} return.user.fullName - Nama lengkap user
   * @returns {string|null} return.user.phone - Nomor telepon user
   * @returns {string} return.user.role - Role user (ADMIN/CASHIER/MECHANIC)
   * @returns {boolean} return.user.isActive - Status aktif user
   * @returns {boolean} return.user.isAuthenticated - Status autentikasi user
   * @returns {string} return.user.createdAt - Tanggal pembuatan
   * @returns {string} return.user.updatedAt - Tanggal update terakhir
   * @returns {Object} return.tokens - Token pair
   * @returns {string} return.tokens.accessToken - JWT access token (expires in 15m)
   * @returns {string} return.tokens.refreshToken - JWT refresh token (expires in 7d)
   *
   * @throws {ApiError} 404 - LOGIN_USER_NOT_FOUND - Jika user tidak ditemukan
   * @throws {ApiError} 403 - LOGIN_USER_INACTIVE - Jika user tidak aktif
   * @throws {ApiError} 500 - LOGIN_TOKEN_GENERATE_ERROR - Jika gagal generate token
   *
   * @example
   * const { user, tokens } = await userService.login("admin@bengkel.com");
   *
   * @example
   * try {
   *   const result = await userService.login("nonexistent@email.com");
   * } catch (error) {
   *   if (error.code === "LOGIN_USER_NOT_FOUND") {
   *     // Handle user not found
   *   }
   * }
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

      logger.info("Login berhasil", {
        userId: user.id,
        email: user.email,
        role: user.role,
      });

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
   * Mengirim undangan via Supabase Auth dan notifikasi
   *
   * @param {Object} payload - Data user baru
   * @param {string} payload.fullName - Nama lengkap user
   * @param {string} payload.email - Email user (harus unik)
   * @param {string} [payload.phone] - Nomor telepon (harus unik jika diisi)
   * @param {string} payload.role - Role user (CASHIER/MECHANIC)
   * @returns {Promise<Object>} User yang berhasil dibuat
   *
   * @throws {ApiError} 400 - Email wajib diisi
   * @throws {ApiError} 403 - Role tidak diizinkan
   * @throws {ApiError} 409 - Email atau phone sudah digunakan
   * @throws {ApiError} 500 - Gagal membuat user di Supabase
   *
   * @example
   * const newUser = await userService.createUser({
   *   fullName: "John Doe",
   *   email: "john@example.com",
   *   phone: "08123456789",
   *   role: "CASHIER"
   * });
   */
  async createUser(payload) {
    const { fullName, email, phone, role } = payload;

    this.#validateCreatableRole(role);

    if (!email) {
      throw ApiError.badRequest({
        message: "Email wajib diisi untuk membuat user baru.",
      });
    }

    const emailExists = await this.userRepo.isEmailExists(email);
    if (emailExists) {
      throw ApiError.conflict({
        message: `Email ${email} sudah digunakan oleh user lain.`,
      });
    }

    if (phone) {
      const phoneExists = await this.userRepo.isPhoneExists(phone);
      if (phoneExists) {
        throw ApiError.conflict({
          message: `Nomor telepon ${phone} sudah digunakan oleh user lain.`,
        });
      }
    }

    const { data: authData, error: authError } =
      await supabase.auth.admin.inviteUserByEmail(email, {
        data: { fullName, phone, role },
      });

    if (authError) {
      logger.error("Gagal membuat user di Supabase Auth", {
        error: authError.message,
      });
      throw ApiError.internal({
        message: `Gagal membuat user. Supabase Error: ${authError.message}`,
      });
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

    await this.#sendNotification(
      userId,
      "Selamat Datang",
      `Halo ${fullName},\n\nAkun Anda telah berhasil dibuat sebagai ${roleLabel}. Selamat bergabung di Bengkel POS.`,
      "SUCCESS"
    );

    await this.#notifyAdmins(
      "User Baru Dibuat",
      `User baru telah ditambahkan.\n\nNama: ${fullName}\nEmail: ${email}\nRole: ${roleLabel}`,
      "INFO"
    );

    logger.info(`User dibuat: ${fullName}`, { userId, role, email });
    return user;
  }

  /**
   * Mengirim ulang Magic Link ke user yang belum terautentikasi
   *
   * @param {string} userId - ID user
   * @returns {Promise<{userId: string, email: string, message: string}>} Info pengiriman Magic Link
   *
   * @throws {ApiError} 404 - User tidak ditemukan
   * @throws {ApiError} 400 - User tidak memiliki email
   * @throws {ApiError} 409 - User sudah terautentikasi
   *
   * @example
   * const result = await userService.resendMagicLink("user-id-123");
   */
  async resendMagicLink(userId) {
    const user = await this.userRepo.findById(userId);

    if (!user) {
      throw ApiError.notFound({
        message: `User dengan ID '${userId}' tidak ditemukan.`,
      });
    }

    if (!user.email) {
      throw ApiError.badRequest({
        message: "User tidak memiliki email. Tidak dapat mengirim Magic Link.",
      });
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
   *
   * @param {string} userId - ID user
   * @returns {Promise<Object>} Data user lengkap dengan relasi count
   *
   * @throws {ApiError} 404 - User tidak ditemukan
   *
   * @example
   * const user = await userService.getUserById("user-id-123");
   */
  async getUserById(userId) {
    const user = await this.userRepo.findById(userId);
    if (!user)
      throw ApiError.notFound({
        message: `User dengan ID '${userId}' tidak ditemukan.`,
      });
    return user;
  }

  /**
   * Mendapatkan user berdasarkan email
   *
   * @param {string} email - Email user
   * @returns {Promise<Object>} Data user
   *
   * @throws {ApiError} 404 - User tidak ditemukan
   *
   * @example
   * const user = await userService.getUserByEmail("john@example.com");
   */
  async getUserByEmail(email) {
    const user = await this.userRepo.findByEmail(email);
    if (!user)
      throw ApiError.notFound({
        message: `User dengan email '${email}' tidak ditemukan.`,
      });
    return user;
  }

  /**
   * Mendapatkan user berdasarkan nomor telepon
   *
   * @param {string} phone - Nomor telepon user
   * @returns {Promise<Object>} Data user
   *
   * @throws {ApiError} 404 - User tidak ditemukan
   *
   * @example
   * const user = await userService.getUserByPhone("08123456789");
   */
  async getUserByPhone(phone) {
    const user = await this.userRepo.findByPhone(phone);
    if (!user)
      throw ApiError.notFound({
        message: `User dengan nomor telepon '${phone}' tidak ditemukan.`,
      });
    return user;
  }

  /**
   * Mendapatkan daftar user dengan filter dan pagination
   *
   * @param {Object} [query={}] - Parameter query
   * @param {number} [query.page=1] - Nomor halaman
   * @param {number} [query.limit=10] - Jumlah item per halaman
   * @param {string} [query.role] - Filter berdasarkan role
   * @param {string} [query.search] - Pencarian berdasarkan nama atau email
   * @param {boolean} [query.isActive] - Filter status aktif
   * @returns {Promise<{data: Array, metadata: Object}>} Daftar user dan metadata pagination
   *
   * @example
   * const { data, metadata } = await userService.getUsers({
   *   page: 1,
   *   limit: 10,
   *   role: "CASHIER",
   *   search: "john"
   * });
   */
  async getUsers(query = {}) {
    const result = await this.userRepo.findMany(query);
    logger.info("Mengambil daftar user", {
      total: result.metadata.total,
      page: result.metadata.currentPage,
      filters: {
        role: query.role,
        search: query.search,
        isActive: query.isActive,
      },
    });
    return result;
  }

  /**
   * Mendapatkan daftar karyawan (CASHIER & MECHANIC)
   *
   * @param {Object} [query={}] - Parameter query
   * @param {number} [query.page=1] - Nomor halaman
   * @param {number} [query.limit=10] - Jumlah item per halaman
   * @param {string} [query.role] - Filter role spesifik
   * @param {string} [query.search] - Pencarian berdasarkan nama atau email
   * @param {boolean} [query.isActive] - Filter status aktif
   * @returns {Promise<{data: Array, metadata: Object}>} Daftar karyawan
   *
   * @example
   * const { data, metadata } = await userService.getEmployees({
   *   role: "MECHANIC",
   *   isActive: true
   * });
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
   *
   * @returns {Promise<Array>} Daftar admin
   *
   * @example
   * const admins = await userService.getAdmins();
   */
  async getAdmins() {
    const admins = await this.userRepo.findByRole("ADMIN");
    logger.info("Mengambil daftar admin", { count: admins.length });
    return admins;
  }

  /**
   * Mendapatkan user berdasarkan role tertentu
   *
   * @param {string} role - Role user
   * @returns {Promise<Array>} Daftar user dengan role tersebut
   *
   * @example
   * const mechanics = await userService.getUsersByRole("MECHANIC");
   */
  async getUsersByRole(role) {
    return this.userRepo.findByRole(role);
  }

  /**
   * Memperbarui data user
   * Validasi role, phone unique, dan shift aktif sebelum update
   *
   * @param {string} userId - ID user yang akan diupdate
   * @param {Object} payload - Data yang akan diupdate
   * @param {string} [payload.fullName] - Nama lengkap baru
   * @param {string} [payload.phone] - Nomor telepon baru
   * @param {string} [payload.role] - Role baru
   * @param {boolean} [payload.isActive] - Status aktif baru
   * @returns {Promise<Object>} User yang sudah diupdate
   *
   * @throws {ApiError} 404 - User tidak ditemukan
   * @throws {ApiError} 403 - Role tidak valid atau mencoba mengubah admin
   * @throws {ApiError} 409 - Phone sudah digunakan atau masih ada shift aktif
   *
   * @example
   * const updated = await userService.updateUser("user-id-123", {
   *   fullName: "John Updated",
   *   role: "MECHANIC"
   * });
   */
  async updateUser(userId, payload) {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw ApiError.notFound({
        message: `Gagal memperbarui. User dengan ID '${userId}' tidak ditemukan.`,
      });
    }

    if (payload.role !== undefined) {
      this.#validateUpdatableRole(user.role, payload.role);
    }

    if (payload.phone && payload.phone !== user.phone) {
      const existingPhone = await this.userRepo.isPhoneExists(
        payload.phone,
        userId
      );
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

    const changes = [];
    if (payload.fullName !== undefined && payload.fullName !== user.fullName)
      changes.push(`Nama: "${user.fullName}" -> "${payload.fullName}"`);
    if (payload.phone !== undefined && payload.phone !== user.phone)
      changes.push(
        `Telepon: "${user.phone || "-"}" -> "${payload.phone || "-"}"`
      );
    if (payload.role !== undefined && payload.role !== user.role)
      changes.push(
        `Role: "${this.#getRoleLabel(user.role)}" -> "${this.#getRoleLabel(
          payload.role
        )}"`
      );
    if (payload.isActive !== undefined && payload.isActive !== user.isActive)
      changes.push(
        `Status: "${user.isActive ? "Aktif" : "Nonaktif"}" -> "${
          payload.isActive ? "Aktif" : "Nonaktif"
        }"`
      );

    if (changes.length > 0) {
      await this.#sendNotification(
        userId,
        "Profil Diperbarui",
        `Data akun Anda telah diperbarui.\n\n${changes.join("\n")}`,
        "INFO"
      );
    }

    logger.info("User berhasil diperbarui", { userId, changes });
    return updated;
  }

  /**
   * Menghapus user dari sistem
   * Memvalidasi tidak ada relasi data dan shift aktif
   *
   * @param {string} userId - ID user yang akan dihapus
   * @returns {Promise<void>}
   *
   * @throws {ApiError} 404 - User tidak ditemukan
   * @throws {ApiError} 403 - Mencoba menghapus admin
   * @throws {ApiError} 409 - User masih memiliki shift aktif atau data relasi
   *
   * @example
   * await userService.deleteUser("user-id-123");
   */
  async deleteUser(userId) {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw ApiError.notFound({
        message: `Gagal menghapus. User dengan ID '${userId}' tidak ditemukan.`,
      });
    }

    if (user.role === "ADMIN") {
      throw ApiError.forbidden({
        message: "Tidak dapat menghapus user dengan role Admin.",
      });
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

    await this.#notifyAdmins(
      "User Dihapus",
      `User telah dihapus dari sistem.\n\nNama: ${user.fullName}\nEmail: ${user.email}\nRole: ${roleLabel}`,
      "WARNING"
    );

    logger.info("User berhasil dihapus", {
      userId,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    });
  }

  /**
   * Memvalidasi email user untuk proses autentikasi
   *
   * @param {string} email - Email yang akan divalidasi
   * @returns {Promise<Object>} Data user jika valid
   *
   * @throws {ApiError} 404 - Email tidak terdaftar
   * @throws {ApiError} 403 - User tidak aktif
   * @throws {ApiError} 403 - User belum terautentikasi
   *
   * @example
   * const user = await userService.validateUserEmail("john@example.com");
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
   *
   * @param {string} email - Email yang akan dicek
   * @param {string} [excludeId] - ID user yang dikecualikan (untuk update)
   * @returns {Promise<{exists: boolean, message: string}>} Status ketersediaan email
   *
   * @example
   * const { exists, message } = await userService.checkEmailExists("john@example.com");
   */
  async checkEmailExists(email, excludeId = null) {
    const exists = await this.userRepo.isEmailExists(email, excludeId);
    return {
      exists,
      message: exists
        ? `Email '${email}' sudah terdaftar.`
        : `Email '${email}' tersedia.`,
    };
  }

  /**
   * Mengecek ketersediaan nomor telepon
   *
   * @param {string} phone - Nomor telepon yang akan dicek
   * @param {string} [excludeId] - ID user yang dikecualikan (untuk update)
   * @returns {Promise<{exists: boolean, message: string}>} Status ketersediaan phone
   *
   * @example
   * const { exists, message } = await userService.checkPhoneExists("08123456789");
   */
  async checkPhoneExists(phone, excludeId = null) {
    const exists = await this.userRepo.isPhoneExists(phone, excludeId);
    return {
      exists,
      message: exists
        ? `Nomor telepon '${phone}' sudah digunakan.`
        : `Nomor telepon '${phone}' tersedia.`,
    };
  }

  /**
   * Menonaktifkan banyak user sekaligus
   * Memvalidasi setiap user sebelum menonaktifkan
   *
   * @param {string[]} userIds - Array ID user yang akan dinonaktifkan
   * @param {string} actorId - ID user yang melakukan penonaktifan
   * @returns {Promise<{summary: Object, details: Object}>} Ringkasan dan detail hasil
   * @returns {Object} return.summary - Ringkasan operasi
   * @returns {number} return.summary.total - Total user yang diproses
   * @returns {number} return.summary.valid - User yang valid
   * @returns {number} return.summary.skipped - User yang dilewati
   * @returns {number} return.summary.deactivated - User yang berhasil dinonaktifkan
   * @returns {number} return.summary.failed - User yang gagal dinonaktifkan
   * @returns {Object} return.details - Detail operasi
   * @returns {Array} return.details.deactivated - ID user yang berhasil
   * @returns {Array} return.details.failed - User yang gagal beserta error
   * @returns {Array} return.details.skipped - User yang dilewati beserta alasan
   *
   * @throws {ApiError} 400 - Tidak ada user yang dipilih atau memenuhi syarat
   *
   * @example
   * const result = await userService.deactivateUsers(
   *   ["id-1", "id-2", "id-3"],
   *   "admin-id"
   * );
   * console.log(result.summary.deactivated); // 2
   */
  async deactivateUsers(userIds, actorId) {
    if (!userIds || userIds.length === 0) {
      throw ApiError.badRequest({
        message: "Gagal menonaktifkan. Tidak ada user yang dipilih.",
      });
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
        skippedUsers.push({
          id,
          name: user.fullName,
          reason: "Tidak dapat menonaktifkan Admin",
        });
        continue;
      }

      if (!user.isActive) {
        skippedUsers.push({
          id,
          name: user.fullName,
          reason: "User sudah nonaktif",
        });
        continue;
      }

      const hasActiveShift = await this.shiftRepo.hasActiveShift(id);
      if (hasActiveShift) {
        skippedUsers.push({
          id,
          name: user.fullName,
          reason: "Masih memiliki shift aktif",
        });
        continue;
      }

      validIds.push(id);
    }

    if (validIds.length === 0) {
      throw ApiError.badRequest({
        message:
          "Gagal menonaktifkan. Tidak ada user yang memenuhi syarat untuk dinonaktifkan.",
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
   * Hanya mengaktifkan user yang sedang nonaktif
   *
   * @param {string[]} userIds - Array ID user yang akan diaktifkan
   * @param {string} actorId - ID user yang melakukan pengaktifan
   * @returns {Promise<{summary: Object, details: Object}>} Ringkasan dan detail hasil
   * @returns {Object} return.summary - Ringkasan operasi
   * @returns {number} return.summary.total - Total user yang diproses
   * @returns {number} return.summary.valid - User yang valid
   * @returns {number} return.summary.skipped - User yang dilewati
   * @returns {number} return.summary.activated - User yang berhasil diaktifkan
   * @returns {number} return.summary.failed - User yang gagal diaktifkan
   * @returns {Object} return.details - Detail operasi
   * @returns {Array} return.details.activated - ID user yang berhasil
   * @returns {Array} return.details.failed - User yang gagal beserta error
   * @returns {Array} return.details.skipped - User yang dilewati beserta alasan
   *
   * @throws {ApiError} 400 - Tidak ada user yang dipilih atau memenuhi syarat
   *
   * @example
   * const result = await userService.activateUsers(
   *   ["id-1", "id-2", "id-3"],
   *   "admin-id"
   * );
   * console.log(result.summary.activated); // 3
   */
  async activateUsers(userIds, actorId) {
    if (!userIds || userIds.length === 0) {
      throw ApiError.badRequest({
        message: "Gagal mengaktifkan. Tidak ada user yang dipilih.",
      });
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
        skippedUsers.push({
          id,
          name: user.fullName,
          reason: "User sudah aktif",
        });
        continue;
      }

      validIds.push(id);
    }

    if (validIds.length === 0) {
      throw ApiError.badRequest({
        message:
          "Gagal mengaktifkan. Tidak ada user yang memenuhi syarat untuk diaktifkan.",
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
