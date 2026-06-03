import CatchAsync from "#shared/utils/response.js";
import UserService from "#service/userService.js";

import {
  createUserSchema,
  resendMagicLinkSchema,
  updateUserSchema,
  getUsersQuerySchema,
  getEmployeesQuerySchema,
  checkEmailExistsSchema,
  checkPhoneExistsSchema,
  userIdParamSchema,
  userEmailParamSchema,
  userPhoneParamSchema,
  userRoleParamSchema,
  validateEmailSchema,
  loginSchema,
} from "#validation/userValidation.js";

import validate from "#validation/validation.js";

import {
  UserDto,
  UserUpdatedDto,
  UserEmailValidationDto,
  LoginDto,
} from "#dtos/userDto.js";

/**
 * Controller untuk mengelola endpoint user
 * Menangani HTTP request/response untuk semua operasi user
 *
 * @class UserController
 * @description
 * Endpoints yang tersedia:
 * - POST /login - Login user dengan email
 * - POST / - Membuat user baru
 * - GET / - Mendapatkan daftar user
 * - GET /employees - Mendapatkan daftar karyawan
 * - GET /admins - Mendapatkan daftar admin
 * - GET /me - Mendapatkan data user yang sedang login
 * - GET /check-email - Mengecek ketersediaan email
 * - GET /check-phone - Mengecek ketersediaan nomor telepon
 * - GET /role/:role - Mendapatkan user berdasarkan role
 * - GET /email/:email - Mendapatkan user berdasarkan email
 * - GET /phone/:phone - Mendapatkan user berdasarkan nomor telepon
 * - GET /:id - Mendapatkan user berdasarkan ID
 * - PUT /:id - Memperbarui data user
 * - DELETE /:id - Menghapus user
 * - POST /:id/resend-magic-link - Mengirim ulang Magic Link
 * - POST /deactivate - Menonaktifkan banyak user
 * - POST /activate - Mengaktifkan banyak user
 * - POST /validate-email - Validasi email untuk autentikasi
 */
class UserController {
  /**
   * Inisialisasi UserController dengan UserService
   * @constructor
   */
  constructor() {
    this.userService = new UserService();
  }

  /**
   * Login user dengan email
   * Menghasilkan JWT access token dan refresh token
   *
   * @param {import('express').Request} req - Express request object
   * @param {import('express').Response} res - Express response object
   * @returns {Promise<void>}
   *
   * @example
   * // Request body
   * {
   *   "email": "admin@bengkel.com"
   * }
   *
   * // Response success (200)
   * {
   *   "success": true,
   *   "message": "Login berhasil",
   *   "data": {
   *     "user": {
   *       "id": "uuid",
   *       "email": "admin@bengkel.com",
   *       "fullName": "Admin User",
   *       "phone": null,
   *       "role": "ADMIN",
   *       "isActive": true,
   *       "isAuthenticated": true,
   *       "createdAt": "2024-01-01T00:00:00.000Z",
   *       "updatedAt": "2024-01-01T00:00:00.000Z"
   *     },
   *     "tokens": {
   *       "accessToken": "eyJhbGciOiJIUzI1NiIs...",
   *       "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
   *     }
   *   }
   * }
   */
  login = CatchAsync.run(async (req, res) => {
    const { email } = validate(loginSchema, req.body);

    const result = await this.userService.login(email);

    res.status(200).json({
      success: true,
      message: "Login berhasil",
      data: new LoginDto(result),
    });
  });

  /**
   * Membuat user baru (hanya CASHIER & MECHANIC)
   * Mengirim undangan via Supabase Auth dan notifikasi
   *
   * @param {import('express').Request} req - Express request object
   * @param {import('express').Response} res - Express response object
   * @returns {Promise<void>}
   *
   * @example
   * // Request body
   * {
   *   "fullName": "John Doe",
   *   "email": "john@example.com",
   *   "phone": "08123456789",
   *   "role": "CASHIER"
   * }
   *
   * // Response success (201)
   * {
   *   "success": true,
   *   "message": "User berhasil dibuat. Magic Link telah dikirim ke john@example.com",
   *   "data": { ... }
   * }
   */
  createUser = CatchAsync.run(async (req, res) => {
    const payload = validate(createUserSchema, req.body);

    const user = await this.userService.createUser(payload);

    res.status(201).json({
      success: true,
      message: `User berhasil dibuat. Magic Link telah dikirim ke ${payload.email}`,
      data: new UserDto(user),
    });
  });

  /**
   * Generate ulang Magic Link untuk user yang belum terautentikasi
   *
   * @param {import('express').Request} req - Express request object
   * @param {import('express').Response} res - Express response object
   * @returns {Promise<void>}
   *
   * @example
   * // Request params
   * // GET /users/:id/resend-magic-link
   *
   * // Response success (200)
   * {
   *   "success": true,
   *   "message": "Magic Link telah dikirim ulang ke email user.",
   *   "data": {
   *     "userId": "uuid",
   *     "email": "john@example.com",
   *     "message": "Magic Link telah dikirim ulang ke email user."
   *   }
   * }
   */
  resendMagicLink = CatchAsync.run(async (req, res) => {
    const { id } = validate(resendMagicLinkSchema, req.params);

    const result = await this.userService.resendMagicLink(id);

    res.status(200).json({
      success: true,
      message: result.message,
      data: result,
    });
  });

  /**
   * Mendapatkan user berdasarkan ID
   *
   * @param {import('express').Request} req - Express request object
   * @param {import('express').Response} res - Express response object
   * @returns {Promise<void>}
   *
   * @example
   * // Request params
   * // GET /users/:id
   *
   * // Response success (200)
   * {
   *   "success": true,
   *   "message": "Detail user berhasil diambil",
   *   "data": {
   *     "id": "uuid",
   *     "email": "john@example.com",
   *     "fullName": "John Doe",
   *     ...
   *   }
   * }
   */
  getUserById = CatchAsync.run(async (req, res) => {
    const { id } = validate(userIdParamSchema, req.params);

    const user = await this.userService.getUserById(id);

    res.status(200).json({
      success: true,
      message: "Detail user berhasil diambil",
      data: new UserDto(user),
    });
  });

  /**
   * Mendapatkan user berdasarkan email
   *
   * @param {import('express').Request} req - Express request object
   * @param {import('express').Response} res - Express response object
   * @returns {Promise<void>}
   *
   * @example
   * // Request params
   * // GET /users/email/:email
   *
   * // Response success (200)
   * {
   *   "success": true,
   *   "message": "Detail user berhasil diambil",
   *   "data": { ... }
   * }
   */
  getUserByEmail = CatchAsync.run(async (req, res) => {
    const { email } = validate(userEmailParamSchema, req.params);

    const user = await this.userService.getUserByEmail(email);

    res.status(200).json({
      success: true,
      message: "Detail user berhasil diambil",
      data: new UserDto(user),
    });
  });

  /**
   * Mendapatkan user berdasarkan nomor telepon
   *
   * @param {import('express').Request} req - Express request object
   * @param {import('express').Response} res - Express response object
   * @returns {Promise<void>}
   *
   * @example
   * // Request params
   * // GET /users/phone/:phone
   *
   * // Response success (200)
   * {
   *   "success": true,
   *   "message": "Detail user berhasil diambil",
   *   "data": { ... }
   * }
   */
  getUserByPhone = CatchAsync.run(async (req, res) => {
    const { phone } = validate(userPhoneParamSchema, req.params);

    const user = await this.userService.getUserByPhone(phone);

    res.status(200).json({
      success: true,
      message: "Detail user berhasil diambil",
      data: new UserDto(user),
    });
  });

  /**
   * Mendapatkan daftar user dengan filter dan paginasi
   *
   * @param {import('express').Request} req - Express request object
   * @param {import('express').Response} res - Express response object
   * @returns {Promise<void>}
   *
   * @example
   * // Request query
   * // GET /users?page=1&limit=10&role=CASHIER&search=john&isActive=true
   *
   * // Response success (200)
   * {
   *   "success": true,
   *   "message": "Daftar user berhasil diambil",
   *   "data": [ ... ],
   *   "metadata": {
   *     "currentPage": 1,
   *     "totalPages": 5,
   *     "total": 50,
   *     "limit": 10
   *   }
   * }
   */
  getUsers = CatchAsync.run(async (req, res) => {
    const query = validate(getUsersQuerySchema, req.query);

    const result = await this.userService.getUsers(query);

    res.status(200).json({
      success: true,
      message: "Daftar user berhasil diambil",
      data: result.data.map((user) => new UserDto(user)),
      metadata: result.metadata,
    });
  });

  /**
   * Mendapatkan daftar karyawan (CASHIER & MECHANIC)
   *
   * @param {import('express').Request} req - Express request object
   * @param {import('express').Response} res - Express response object
   * @returns {Promise<void>}
   *
   * @example
   * // Request query
   * // GET /users/employees?role=MECHANIC&isActive=true
   *
   * // Response success (200)
   * {
   *   "success": true,
   *   "message": "Daftar karyawan berhasil diambil",
   *   "data": [ ... ],
   *   "metadata": { ... }
   * }
   */
  getEmployees = CatchAsync.run(async (req, res) => {
    const query = validate(getEmployeesQuerySchema, req.query);

    const result = await this.userService.getEmployees(query);

    res.status(200).json({
      success: true,
      message: "Daftar karyawan berhasil diambil",
      data: result.data.map((employee) => new UserDto(employee)),
      metadata: result.metadata,
    });
  });

  /**
   * Mendapatkan daftar admin
   *
   * @param {import('express').Request} req - Express request object
   * @param {import('express').Response} res - Express response object
   * @returns {Promise<void>}
   *
   * @example
   * // GET /users/admins
   *
   * // Response success (200)
   * {
   *   "success": true,
   *   "message": "Daftar admin berhasil diambil",
   *   "data": [ ... ]
   * }
   */
  getAdmins = CatchAsync.run(async (req, res) => {
    const admins = await this.userService.getAdmins();

    res.status(200).json({
      success: true,
      message: "Daftar admin berhasil diambil",
      data: admins.map((admin) => new UserDto(admin)),
    });
  });

  /**
   * Mendapatkan user berdasarkan role tertentu
   *
   * @param {import('express').Request} req - Express request object
   * @param {import('express').Response} res - Express response object
   * @returns {Promise<void>}
   *
   * @example
   * // Request params
   * // GET /users/role/MECHANIC
   *
   * // Response success (200)
   * {
   *   "success": true,
   *   "message": "Daftar user dengan role MECHANIC berhasil diambil",
   *   "data": [ ... ]
   * }
   */
  getUsersByRole = CatchAsync.run(async (req, res) => {
    const { role } = validate(userRoleParamSchema, req.params);

    const users = await this.userService.getUsersByRole(role);

    res.status(200).json({
      success: true,
      message: `Daftar user dengan role ${role} berhasil diambil`,
      data: users.map((user) => new UserDto(user)),
    });
  });

  /**
   * Memperbarui data user
   * Validasi role, phone unique, dan shift aktif sebelum update
   *
   * @param {import('express').Request} req - Express request object
   * @param {import('express').Response} res - Express response object
   * @returns {Promise<void>}
   *
   * @example
   * // Request
   * // PUT /users/:id
   * // Body: { "fullName": "John Updated", "role": "MECHANIC" }
   *
   * // Response success (200)
   * {
   *   "success": true,
   *   "message": "Data user berhasil diperbarui",
   *   "data": { ... }
   * }
   */
  updateUser = CatchAsync.run(async (req, res) => {
    const { id } = validate(userIdParamSchema, req.params);
    const payload = validate(updateUserSchema, req.body);

    const user = await this.userService.updateUser(id, payload);

    res.status(200).json({
      success: true,
      message: "Data user berhasil diperbarui",
      data: new UserUpdatedDto(user),
    });
  });

  /**
   * Menghapus user dari sistem
   * Memvalidasi tidak ada relasi data dan shift aktif
   *
   * @param {import('express').Request} req - Express request object
   * @param {import('express').Response} res - Express response object
   * @returns {Promise<void>}
   *
   * @example
   * // DELETE /users/:id
   *
   * // Response success (200)
   * {
   *   "success": true,
   *   "message": "User berhasil dihapus dari sistem",
   *   "data": null
   * }
   */
  deleteUser = CatchAsync.run(async (req, res) => {
    const { id } = validate(userIdParamSchema, req.params);

    await this.userService.deleteUser(id);

    res.status(200).json({
      success: true,
      message: "User berhasil dihapus dari sistem",
      data: null,
    });
  });

  /**
   * Menonaktifkan banyak user sekaligus
   * Memvalidasi setiap user sebelum menonaktifkan
   *
   * @param {import('express').Request} req - Express request object
   * @param {import('express').Response} res - Express response object
   * @returns {Promise<void>}
   *
   * @example
   * // POST /users/deactivate
   * // Body: { "ids": ["id-1", "id-2", "id-3"] }
   *
   * // Response success (200)
   * {
   *   "success": true,
   *   "message": "2 user berhasil dinonaktifkan",
   *   "data": {
   *     "summary": {
   *       "total": 3,
   *       "valid": 2,
   *       "skipped": 1,
   *       "deactivated": 2,
   *       "failed": 0
   *     },
   *     "details": { ... }
   *   }
   * }
   */
  deactivateUsers = CatchAsync.run(async (req, res) => {
    const { ids } = req.body;
    const userId = req.user.id;

    const result = await this.userService.deactivateUsers(ids, userId);

    res.status(200).json({
      success: true,
      message: `${result.summary.deactivated} user berhasil dinonaktifkan`,
      data: result,
    });
  });

  /**
   * Mengaktifkan banyak user sekaligus
   * Hanya mengaktifkan user yang sedang nonaktif
   *
   * @param {import('express').Request} req - Express request object
   * @param {import('express').Response} res - Express response object
   * @returns {Promise<void>}
   *
   * @example
   * // POST /users/activate
   * // Body: { "ids": ["id-1", "id-2", "id-3"] }
   *
   * // Response success (200)
   * {
   *   "success": true,
   *   "message": "3 user berhasil diaktifkan",
   *   "data": {
   *     "summary": {
   *       "total": 3,
   *       "valid": 3,
   *       "skipped": 0,
   *       "activated": 3,
   *       "failed": 0
   *     },
   *     "details": { ... }
   *   }
   * }
   */
  activateUsers = CatchAsync.run(async (req, res) => {
    const { ids } = req.body;
    const userId = req.user.id;

    const result = await this.userService.activateUsers(ids, userId);

    res.status(200).json({
      success: true,
      message: `${result.summary.activated} user berhasil diaktifkan`,
      data: result,
    });
  });

  /**
   * Validasi email user untuk autentikasi
   * Mengecek apakah email terdaftar, aktif, dan terautentikasi
   *
   * @param {import('express').Request} req - Express request object
   * @param {import('express').Response} res - Express response object
   * @returns {Promise<void>}
   *
   * @example
   * // POST /users/validate-email
   * // Body: { "email": "john@example.com" }
   *
   * // Response success (200)
   * {
   *   "success": true,
   *   "message": "Email terdaftar, aktif, dan terautentikasi",
   *   "data": {
   *     "id": "uuid",
   *     "email": "john@example.com",
   *     "isActive": true,
   *     "isAuthenticated": true
   *   }
   * }
   */
  validateUserEmail = CatchAsync.run(async (req, res) => {
    const { email } = validate(validateEmailSchema, req.body);

    const user = await this.userService.validateUserEmail(email);

    res.status(200).json({
      success: true,
      message: "Email terdaftar, aktif, dan terautentikasi",
      data: new UserEmailValidationDto(user),
    });
  });

  /**
   * Mengecek ketersediaan email
   *
   * @param {import('express').Request} req - Express request object
   * @param {import('express').Response} res - Express response object
   * @returns {Promise<void>}
   *
   * @example
   * // GET /users/check-email?email=john@example.com&excludeId=uuid
   *
   * // Response success (200)
   * {
   *   "success": true,
   *   "message": "Email 'john@example.com' tersedia.",
   *   "data": {
   *     "exists": false,
   *     "message": "Email 'john@example.com' tersedia."
   *   }
   * }
   */
  checkEmailExists = CatchAsync.run(async (req, res) => {
    const { email, excludeId } = validate(checkEmailExistsSchema, req.query);

    const result = await this.userService.checkEmailExists(email, excludeId);

    res.status(200).json({
      success: true,
      message: result.message,
      data: result,
    });
  });

  /**
   * Mengecek ketersediaan nomor telepon
   *
   * @param {import('express').Request} req - Express request object
   * @param {import('express').Response} res - Express response object
   * @returns {Promise<void>}
   *
   * @example
   * // GET /users/check-phone?phone=08123456789&excludeId=uuid
   *
   * // Response success (200)
   * {
   *   "success": true,
   *   "message": "Nomor telepon '08123456789' tersedia.",
   *   "data": {
   *     "exists": false,
   *     "message": "Nomor telepon '08123456789' tersedia."
   *   }
   * }
   */
  checkPhoneExists = CatchAsync.run(async (req, res) => {
    const { phone, excludeId } = validate(checkPhoneExistsSchema, req.query);

    const result = await this.userService.checkPhoneExists(phone, excludeId);

    res.status(200).json({
      success: true,
      message: result.message,
      data: result,
    });
  });

  /**
   * Mendapatkan data user yang sedang login
   * Menggunakan ID dari JWT token yang sudah diverifikasi
   *
   * @param {import('express').Request} req - Express request object
   * @param {import('express').Response} res - Express response object
   * @returns {Promise<void>}
   *
   * @example
   * // GET /users/me
   * // Headers: Authorization: Bearer <token>
   *
   * // Response success (200)
   * {
   *   "success": true,
   *   "message": "Data user berhasil diambil",
   *   "data": {
   *     "id": "uuid",
   *     "email": "john@example.com",
   *     "fullName": "John Doe",
   *     ...
   *   }
   * }
   */
  getCurrentUser = CatchAsync.run(async (req, res) => {
    const user = await this.userService.getUserById(req.user.id);

    res.status(200).json({
      success: true,
      message: "Data user berhasil diambil",
      data: new UserDto(user),
    });
  });
}

export default new UserController();
