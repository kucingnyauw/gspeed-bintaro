import UserService from "#service/userService.js";
import UserRepository from "#repository/userRepository.js";
import ShiftRepository from "#repository/shiftRepository.js";
import NotificationRepository from "#repository/notificationRepository.js";
import ApiError from "#shared/utils/error.js";
import supabase from "#lib/supabase.js";
import logger from "#app/logger.js";

// --- Mocks ---
jest.mock("#repository/userRepository.js");
jest.mock("#repository/shiftRepository.js");
jest.mock("#repository/notificationRepository.js");

jest.mock("#shared/utils/cache.js", () => {
  return jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    set: jest.fn(),
    invalidate: jest.fn(),
  }));
});

jest.mock("#lib/supabase.js", () => ({
  auth: {
    signInWithOtp: jest.fn(),
    admin: {
      inviteUserByEmail: jest.fn(),
    },
  },
}));

jest.mock("#app/logger.js", () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

describe("UserService", () => {
  let service;
  let mockUserRepo;
  let mockShiftRepo;
  let mockNotifRepo;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Clear mock instances
    UserRepository.mockClear();
    ShiftRepository.mockClear();
    NotificationRepository.mockClear();
    
    service = new UserService();
    
    mockUserRepo = UserRepository.mock.instances[0];
    mockShiftRepo = ShiftRepository.mock.instances[0];
    mockNotifRepo = NotificationRepository.mock.instances[0];
  });

  // ============================================================
  // createUser
  // ============================================================
  describe("createUser", () => {
    const validPayload = {
      fullName: "Budi Santoso",
      email: "budi@example.com",
      phone: "08123456789",
      role: "MECHANIC",
    };

    beforeEach(() => {
      mockUserRepo.isEmailExists.mockResolvedValue(false);
      mockUserRepo.isPhoneExists.mockResolvedValue(false);
      mockUserRepo.findById.mockResolvedValue(null);
      mockUserRepo.findByRole.mockResolvedValue([
        { id: "admin1", isActive: true },
        { id: "admin2", isActive: true },
      ]);
      
      supabase.auth.admin.inviteUserByEmail.mockResolvedValue({
        data: { user: { id: "u1" } },
        error: null,
      });
      
      mockNotifRepo.create.mockResolvedValue({});
    });

    it("should create user successfully with all fields", async () => {
      const result = await service.createUser(validPayload);

      expect(result).toEqual({
        id: "u1",
        email: validPayload.email,
        fullName: validPayload.fullName,
        phone: validPayload.phone,
        role: validPayload.role,
        isActive: true,
        isAuthenticated: false,
      });

      // Verify Supabase Auth called
      expect(supabase.auth.admin.inviteUserByEmail).toHaveBeenCalledWith(
        validPayload.email,
        {
          data: {
            fullName: validPayload.fullName,
            phone: validPayload.phone,
            role: validPayload.role,
          },
        }
      );

      // Verify notifications sent (1 for user + 1 for each active admin = 3)
      expect(mockNotifRepo.create).toHaveBeenCalledTimes(3);
      
      // Verify user notification
      expect(mockNotifRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Selamat Datang",
          type: "SUCCESS",
          userId: "u1",
        })
      );

      // Verify admin notification
      expect(mockNotifRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "User Baru Dibuat",
          type: "INFO",
        })
      );

      // Verify logging
      expect(logger.info).toHaveBeenCalledWith(
        "User dibuat: Budi Santoso",
        expect.objectContaining({
          userId: "u1",
          role: "MECHANIC",
          email: "budi@example.com",
        })
      );
    });

    it("should create user with minimal fields (no phone)", async () => {
      const minimalPayload = {
        fullName: "Ani Lestari",
        email: "ani@example.com",
        role: "CASHIER",
      };

      mockUserRepo.findById.mockResolvedValue(null);

      const result = await service.createUser(minimalPayload);

      expect(result.email).toBe("ani@example.com");
      expect(result.phone).toBeUndefined();
      expect(result.role).toBe("CASHIER");
    });

    it("should throw ForbiddenError when role is ADMIN", async () => {
      await expect(
        service.createUser({ ...validPayload, role: "ADMIN" })
      ).rejects.toThrow(ApiError);

      try {
        await service.createUser({ ...validPayload, role: "ADMIN" });
      } catch (error) {
        expect(error.statusCode).toBe(403);
        expect(error.message).toContain("Tidak dapat membuat user dengan role ADMIN");
      }

      expect(supabase.auth.admin.inviteUserByEmail).not.toHaveBeenCalled();
    });

    it("should throw ForbiddenError for invalid role", async () => {
      await expect(
        service.createUser({ ...validPayload, role: "SUPERADMIN" })
      ).rejects.toThrow(ApiError);

      try {
        await service.createUser({ ...validPayload, role: "SUPERADMIN" });
      } catch (error) {
        expect(error.statusCode).toBe(403);
      }
    });

    it("should throw BadRequest when email is empty", async () => {
      await expect(
        service.createUser({ ...validPayload, email: "" })
      ).rejects.toThrow(ApiError);

      try {
        await service.createUser({ ...validPayload, email: "" });
      } catch (error) {
        expect(error.statusCode).toBe(400);
        expect(error.message).toContain("Email wajib diisi");
      }
    });

    it("should throw BadRequest when email is missing", async () => {
      const { email, ...payloadWithoutEmail } = validPayload;
      
      await expect(
        service.createUser(payloadWithoutEmail)
      ).rejects.toThrow(ApiError);
    });

    it("should throw Conflict when email already exists", async () => {
      mockUserRepo.isEmailExists.mockResolvedValue(true);

      await expect(service.createUser(validPayload)).rejects.toThrow(ApiError);

      try {
        await service.createUser(validPayload);
      } catch (error) {
        expect(error.statusCode).toBe(409);
        expect(error.message).toContain("Email budi@example.com sudah digunakan");
      }

      expect(mockUserRepo.isPhoneExists).not.toHaveBeenCalled();
      expect(supabase.auth.admin.inviteUserByEmail).not.toHaveBeenCalled();
    });

    it("should throw Conflict when phone already exists", async () => {
      mockUserRepo.isPhoneExists.mockResolvedValue(true);

      await expect(service.createUser(validPayload)).rejects.toThrow(ApiError);

      try {
        await service.createUser(validPayload);
      } catch (error) {
        expect(error.statusCode).toBe(409);
        expect(error.message).toContain("Nomor telepon 08123456789 sudah digunakan");
      }
    });

    it("should skip phone check if phone is not provided", async () => {
      const payloadWithoutPhone = {
        fullName: "Budi",
        email: "budi@example.com",
        role: "MECHANIC",
      };

      await service.createUser(payloadWithoutPhone);

      expect(mockUserRepo.isPhoneExists).not.toHaveBeenCalled();
    });

    it("should throw InternalServerError when Supabase auth fails", async () => {
      supabase.auth.admin.inviteUserByEmail.mockResolvedValue({
        data: null,
        error: { message: "Supabase connection error" },
      });

      await expect(service.createUser(validPayload)).rejects.toThrow(ApiError);

      try {
        await service.createUser(validPayload);
      } catch (error) {
        expect(error.statusCode).toBe(500);
        expect(error.message).toContain("Gagal membuat user");
      }

      expect(logger.error).toHaveBeenCalledWith(
        "Gagal membuat user di Supabase Auth",
        expect.objectContaining({
          error: "Supabase connection error",
        })
      );
    });

    it("should handle notification failure gracefully", async () => {
      mockNotifRepo.create.mockRejectedValue(new Error("Notification error"));

      // Should not throw error even if notification fails
      const result = await service.createUser(validPayload);

      expect(result.id).toBe("u1");
      expect(logger.warn).toHaveBeenCalled();
    });

    it("should notify all active admins (not inactive ones)", async () => {
      mockUserRepo.findByRole.mockResolvedValue([
        { id: "admin1", isActive: true },
        { id: "admin2", isActive: false }, // Inactive admin
        { id: "admin3", isActive: true },
      ]);

      await service.createUser(validPayload);

      // 1 notification for user + 2 notifications for active admins = 3
      expect(mockNotifRepo.create).toHaveBeenCalledTimes(3);
    });

    it("should handle existing user from Supabase (already in DB)", async () => {
      const existingUser = {
        id: "u1",
        email: "budi@example.com",
        fullName: "Budi Santoso",
        phone: "08123456789",
        role: "MECHANIC",
        isActive: true,
        isAuthenticated: true,
      };

      mockUserRepo.findById.mockResolvedValue(existingUser);

      const result = await service.createUser(validPayload);

      expect(result).toEqual(existingUser);
    });
  });

  // ============================================================
  // resendMagicLink
  // ============================================================
  describe("resendMagicLink", () => {
    const mockUser = {
      id: "u1",
      fullName: "Test User",
      email: "test@example.com",
      isAuthenticated: false,
    };

    it("should resend magic link successfully", async () => {
      mockUserRepo.findById.mockResolvedValue(mockUser);
      supabase.auth.signInWithOtp.mockResolvedValue({ error: null });

      const result = await service.resendMagicLink("u1");

      expect(result).toEqual({
        userId: "u1",
        email: "test@example.com",
        message: "Magic Link telah dikirim ulang ke email user.",
      });

      expect(supabase.auth.signInWithOtp).toHaveBeenCalledWith({
        email: "test@example.com",
        options: {
          emailRedirectTo: expect.stringContaining("/auth/callback"),
        },
      });

      expect(logger.info).toHaveBeenCalledWith(
        "Magic Link dikirim ulang",
        expect.objectContaining({
          userId: "u1",
          email: "test@example.com",
        })
      );
    });

    it("should throw NotFoundError when user not found", async () => {
      mockUserRepo.findById.mockResolvedValue(null);

      await expect(service.resendMagicLink("u99")).rejects.toThrow(ApiError);

      try {
        await service.resendMagicLink("u99");
      } catch (error) {
        expect(error.statusCode).toBe(404);
        expect(error.message).toContain("User dengan ID 'u99' tidak ditemukan");
      }

      expect(supabase.auth.signInWithOtp).not.toHaveBeenCalled();
    });

    it("should throw BadRequest when user has no email", async () => {
      mockUserRepo.findById.mockResolvedValue({
        id: "u1",
        email: null,
        isAuthenticated: false,
      });

      await expect(service.resendMagicLink("u1")).rejects.toThrow(ApiError);

      try {
        await service.resendMagicLink("u1");
      } catch (error) {
        expect(error.statusCode).toBe(400);
        expect(error.message).toContain("User tidak memiliki email");
      }
    });

    it("should throw Conflict when user is already authenticated", async () => {
      mockUserRepo.findById.mockResolvedValue({
        ...mockUser,
        isAuthenticated: true,
      });

      await expect(service.resendMagicLink("u1")).rejects.toThrow(ApiError);

      try {
        await service.resendMagicLink("u1");
      } catch (error) {
        expect(error.statusCode).toBe(409);
        expect(error.message).toContain("sudah terautentikasi");
      }
    });

    it("should throw TooManyRequests when rate limited by Supabase", async () => {
      mockUserRepo.findById.mockResolvedValue(mockUser);
      supabase.auth.signInWithOtp.mockResolvedValue({
        error: {
          code: "over_email_send_rate_limit",
          message: "Rate limit exceeded",
        },
      });

      await expect(service.resendMagicLink("u1")).rejects.toMatchObject({
        statusCode: 429,
      });

      try {
        await service.resendMagicLink("u1");
      } catch (error) {
        expect(error.message).toContain("Terlalu banyak permintaan");
      }
    });

    it("should throw InternalServerError on unexpected Supabase error", async () => {
      mockUserRepo.findById.mockResolvedValue(mockUser);
      supabase.auth.signInWithOtp.mockResolvedValue({
        error: {
          code: "unknown_error",
          message: "Something went wrong",
        },
      });

      await expect(service.resendMagicLink("u1")).rejects.toThrow(ApiError);

      try {
        await service.resendMagicLink("u1");
      } catch (error) {
        expect(error.statusCode).toBe(500);
      }

      expect(logger.warn).toHaveBeenCalledWith(
        "Gagal mengirim Magic Link",
        expect.objectContaining({
          email: "test@example.com",
          error: "Something went wrong",
          code: "unknown_error",
        })
      );
    });

    it("should handle network errors from Supabase", async () => {
      mockUserRepo.findById.mockResolvedValue(mockUser);
      supabase.auth.signInWithOtp.mockRejectedValue(new Error("Network error"));

      await expect(service.resendMagicLink("u1")).rejects.toThrow(ApiError);

      try {
        await service.resendMagicLink("u1");
      } catch (error) {
        expect(error.statusCode).toBe(500);
        expect(error.message).toContain("Gagal mengirim email verifikasi");
      }

      expect(logger.error).toHaveBeenCalledWith(
        "Error saat mengirim Magic Link",
        expect.objectContaining({
          email: "test@example.com",
          error: "Network error",
        })
      );
    });
  });

  // ============================================================
  // getUserById, getUserByEmail, getUserByPhone
  // ============================================================
  describe("getUserById", () => {
    it("should return user when found", async () => {
      const mockUser = {
        id: "u1",
        fullName: "Test User",
        email: "test@example.com",
      };

      mockUserRepo.findById.mockResolvedValue(mockUser);

      const result = await service.getUserById("u1");

      expect(result).toEqual(mockUser);
      expect(mockUserRepo.findById).toHaveBeenCalledWith("u1");
    });

    it("should throw NotFoundError when user not found", async () => {
      mockUserRepo.findById.mockResolvedValue(null);

      await expect(service.getUserById("u99")).rejects.toThrow(ApiError);

      try {
        await service.getUserById("u99");
      } catch (error) {
        expect(error.statusCode).toBe(404);
        expect(error.message).toContain("User dengan ID 'u99' tidak ditemukan");
      }
    });
  });

  describe("getUserByEmail", () => {
    it("should return user when found", async () => {
      const mockUser = { email: "test@example.com", id: "u1" };

      mockUserRepo.findByEmail.mockResolvedValue(mockUser);

      const result = await service.getUserByEmail("test@example.com");

      expect(result).toEqual(mockUser);
      expect(mockUserRepo.findByEmail).toHaveBeenCalledWith("test@example.com");
    });

    it("should throw NotFoundError when email not found", async () => {
      mockUserRepo.findByEmail.mockResolvedValue(null);

      await expect(service.getUserByEmail("unknown@test.com")).rejects.toThrow(ApiError);

      try {
        await service.getUserByEmail("unknown@test.com");
      } catch (error) {
        expect(error.statusCode).toBe(404);
        expect(error.message).toContain("User dengan email 'unknown@test.com' tidak ditemukan");
      }
    });
  });

  describe("getUserByPhone", () => {
    it("should return user when found", async () => {
      const mockUser = { phone: "08123456789", id: "u1" };

      mockUserRepo.findByPhone.mockResolvedValue(mockUser);

      const result = await service.getUserByPhone("08123456789");

      expect(result).toEqual(mockUser);
      expect(mockUserRepo.findByPhone).toHaveBeenCalledWith("08123456789");
    });

    it("should throw NotFoundError when phone not found", async () => {
      mockUserRepo.findByPhone.mockResolvedValue(null);

      await expect(service.getUserByPhone("000000")).rejects.toThrow(ApiError);

      try {
        await service.getUserByPhone("000000");
      } catch (error) {
        expect(error.statusCode).toBe(404);
        expect(error.message).toContain("User dengan nomor telepon '000000' tidak ditemukan");
      }
    });
  });

  // ============================================================
  // getUsers, getEmployees, getAdmins, getUsersByRole
  // ============================================================
  describe("getUsers", () => {
    it("should return paginated users with filters", async () => {
      const mockResult = {
        data: [
          { id: "u1", fullName: "User 1" },
          { id: "u2", fullName: "User 2" },
        ],
        metadata: {
          total: 2,
          currentPage: 1,
          itemsPerPage: 10,
          totalPages: 1,
        },
      };

      mockUserRepo.findMany.mockResolvedValue(mockResult);

      const query = { role: "CASHIER", search: "User", isActive: true };
      const result = await service.getUsers(query);

      expect(result).toEqual(mockResult);
      expect(mockUserRepo.findMany).toHaveBeenCalledWith(query);
      expect(logger.info).toHaveBeenCalledWith(
        "Mengambil daftar user",
        expect.objectContaining({
          total: 2,
          page: 1,
          filters: {
            role: "CASHIER",
            search: "User",
            isActive: true,
          },
        })
      );
    });

    it("should handle empty results", async () => {
      const emptyResult = {
        data: [],
        metadata: { total: 0, currentPage: 1 },
      };

      mockUserRepo.findMany.mockResolvedValue(emptyResult);

      const result = await service.getUsers();

      expect(result.data).toHaveLength(0);
      expect(result.metadata.total).toBe(0);
    });
  });

  describe("getEmployees", () => {
    it("should return employees with filters", async () => {
      const mockResult = {
        data: [
          { id: "u1", role: "CASHIER" },
          { id: "u2", role: "MECHANIC" },
        ],
        metadata: { total: 2, currentPage: 1 },
      };

      mockUserRepo.findEmployees.mockResolvedValue(mockResult);

      const query = { search: "Budi", isActive: true };
      const result = await service.getEmployees(query);

      expect(result).toEqual(mockResult);
      expect(mockUserRepo.findEmployees).toHaveBeenCalledWith(query);
      expect(logger.info).toHaveBeenCalledWith(
        "Mengambil daftar karyawan",
        expect.objectContaining({
          total: 2,
          page: 1,
          role: "CASHIER & MECHANIC",
        })
      );
    });

    it("should pass role in log when provided", async () => {
      mockUserRepo.findEmployees.mockResolvedValue({
        data: [],
        metadata: { total: 0, currentPage: 1 },
      });

      await service.getEmployees({ role: "MECHANIC" });

      expect(logger.info).toHaveBeenCalledWith(
        "Mengambil daftar karyawan",
        expect.objectContaining({
          role: "MECHANIC",
        })
      );
    });
  });

  describe("getAdmins", () => {
    it("should return all admin users", async () => {
      const mockAdmins = [
        { id: "admin1", role: "ADMIN" },
        { id: "admin2", role: "ADMIN" },
      ];

      mockUserRepo.findByRole.mockResolvedValue(mockAdmins);

      const result = await service.getAdmins();

      expect(result).toEqual(mockAdmins);
      expect(result).toHaveLength(2);
      expect(mockUserRepo.findByRole).toHaveBeenCalledWith("ADMIN");
      expect(logger.info).toHaveBeenCalledWith(
        "Mengambil daftar admin",
        expect.objectContaining({
          count: 2,
        })
      );
    });

    it("should return empty array when no admins", async () => {
      mockUserRepo.findByRole.mockResolvedValue([]);

      const result = await service.getAdmins();

      expect(result).toEqual([]);
    });
  });

  describe("getUsersByRole", () => {
    it("should return users filtered by role", async () => {
      const mockMechanics = [
        { id: "m1", role: "MECHANIC" },
        { id: "m2", role: "MECHANIC" },
      ];

      mockUserRepo.findByRole.mockResolvedValue(mockMechanics);

      const result = await service.getUsersByRole("MECHANIC");

      expect(result).toEqual(mockMechanics);
      expect(mockUserRepo.findByRole).toHaveBeenCalledWith("MECHANIC");
    });
  });

  // ============================================================
  // updateUser
  // ============================================================
  describe("updateUser", () => {
    const existingUser = {
      id: "u1",
      fullName: "Old Name",
      email: "old@example.com",
      phone: "0811111111",
      role: "CASHIER",
      isActive: true,
    };

    beforeEach(() => {
      mockUserRepo.findById.mockResolvedValue(existingUser);
      mockUserRepo.update.mockImplementation((id, data) =>
        Promise.resolve({ ...existingUser, ...data })
      );
      mockUserRepo.isPhoneExists.mockResolvedValue(false);
      mockShiftRepo.hasActiveShift.mockResolvedValue(false);
      mockNotifRepo.create.mockResolvedValue({});
    });

    it("should update all allowed fields successfully", async () => {
      const payload = {
        fullName: "New Name",
        phone: "0822222222",
        role: "MECHANIC",
        isActive: false,
      };

      const result = await service.updateUser("u1", payload);

      expect(result.fullName).toBe("New Name");
      expect(result.phone).toBe("0822222222");
      expect(result.role).toBe("MECHANIC");
      expect(result.isActive).toBe(false);
      expect(mockUserRepo.update).toHaveBeenCalledWith("u1", payload);
    });

    it("should send notification when changes are made", async () => {
      const payload = { fullName: "New Name" };

      await service.updateUser("u1", payload);

      expect(mockNotifRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Profil Diperbarui",
          type: "INFO",
          userId: "u1",
          message: expect.stringContaining("Nama:"),
        })
      );

      expect(logger.info).toHaveBeenCalledWith(
        "User berhasil diperbarui",
        expect.objectContaining({
          userId: "u1",
          changes: ['Nama: "Old Name" -> "New Name"'],
        })
      );
    });

    it("should not send notification when no actual changes", async () => {
      const payload = { fullName: "Old Name" }; // Same as existing

      await service.updateUser("u1", payload);

      expect(mockNotifRepo.create).not.toHaveBeenCalled();
    });

    it("should send detailed notification for multiple changes", async () => {
      const payload = {
        fullName: "New Name",
        phone: "0822222222",
        role: "MECHANIC",
      };

      await service.updateUser("u1", payload);

      expect(mockNotifRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining("Nama:"),
        })
      );

      const notificationCall = mockNotifRepo.create.mock.calls[0][0];
      expect(notificationCall.message).toContain("Telepon:");
      expect(notificationCall.message).toContain("Role:");
    });

    it("should throw NotFoundError when user not found", async () => {
      mockUserRepo.findById.mockResolvedValue(null);

      await expect(
        service.updateUser("u99", { fullName: "Test" })
      ).rejects.toThrow(ApiError);

      try {
        await service.updateUser("u99", { fullName: "Test" });
      } catch (error) {
        expect(error.statusCode).toBe(404);
        expect(error.message).toContain("User dengan ID 'u99' tidak ditemukan");
      }
    });

    it("should throw ForbiddenError when changing ADMIN role", async () => {
      mockUserRepo.findById.mockResolvedValue({
        ...existingUser,
        role: "ADMIN",
      });

      await expect(
        service.updateUser("u1", { role: "CASHIER" })
      ).rejects.toThrow(ApiError);

      try {
        await service.updateUser("u1", { role: "CASHIER" });
      } catch (error) {
        expect(error.statusCode).toBe(403);
        expect(error.message).toContain("Tidak dapat mengubah role Admin");
      }
    });

    it("should throw ForbiddenError when setting invalid role", async () => {
      await expect(
        service.updateUser("u1", { role: "SUPERADMIN" })
      ).rejects.toThrow(ApiError);

      try {
        await service.updateUser("u1", { role: "SUPERADMIN" });
      } catch (error) {
        expect(error.statusCode).toBe(403);
        expect(error.message).toContain("Role 'SUPERADMIN' tidak valid");
      }
    });

    it("should allow changing to ADMIN role (from non-ADMIN)", async () => {
      // This should be allowed based on the code logic
      // The validation only blocks changing FROM admin, or to invalid roles
      await service.updateUser("u1", { role: "ADMIN" });

      expect(mockUserRepo.update).toHaveBeenCalledWith("u1", {
        role: "ADMIN",
      });
    });

    it("should throw Conflict when new phone already exists", async () => {
      mockUserRepo.isPhoneExists.mockResolvedValue(true);

      await expect(
        service.updateUser("u1", { phone: "0822222222" })
      ).rejects.toThrow(ApiError);

      try {
        await service.updateUser("u1", { phone: "0822222222" });
      } catch (error) {
        expect(error.statusCode).toBe(409);
        expect(error.message).toContain(
          "Nomor telepon '0822222222' sudah digunakan"
        );
      }
    });

    it("should skip phone uniqueness check when phone unchanged", async () => {
      await service.updateUser("u1", { phone: "0811111111" }); // Same phone

      expect(mockUserRepo.isPhoneExists).not.toHaveBeenCalled();
    });

    it("should throw Conflict when deactivating user with active shift", async () => {
      mockShiftRepo.hasActiveShift.mockResolvedValue(true);

      await expect(
        service.updateUser("u1", { isActive: false })
      ).rejects.toThrow(ApiError);

      try {
        await service.updateUser("u1", { isActive: false });
      } catch (error) {
        expect(error.statusCode).toBe(409);
        expect(error.message).toContain("masih memiliki shift aktif");
      }
    });

    it("should allow deactivating user without active shift", async () => {
      mockShiftRepo.hasActiveShift.mockResolvedValue(false);

      const result = await service.updateUser("u1", { isActive: false });

      expect(result.isActive).toBe(false);
    });

    it("should skip shift check when activating user", async () => {
      const result = await service.updateUser("u1", { isActive: true });

      expect(result.isActive).toBe(true);
      expect(mockShiftRepo.hasActiveShift).not.toHaveBeenCalled();
    });

    it("should only update provided fields (partial update)", async () => {
      await service.updateUser("u1", { fullName: "Partial Update" });

      expect(mockUserRepo.update).toHaveBeenCalledWith("u1", {
        fullName: "Partial Update",
      });
    });
  });

  // ============================================================
  // deleteUser
  // ============================================================
  describe("deleteUser", () => {
    const mockUser = {
      id: "u1",
      fullName: "Test User",
      email: "test@example.com",
      role: "CASHIER",
    };

    beforeEach(() => {
      mockUserRepo.findById.mockResolvedValue(mockUser);
      mockShiftRepo.hasActiveShift.mockResolvedValue(false);
      mockUserRepo.hasRelations.mockResolvedValue(false);
      mockUserRepo.delete.mockResolvedValue(undefined);
      mockUserRepo.findByRole.mockResolvedValue([
        { id: "admin1", isActive: true },
      ]);
      mockNotifRepo.create.mockResolvedValue({});
    });

    it("should delete user successfully and notify admins", async () => {
      await service.deleteUser("u1");

      expect(mockUserRepo.findById).toHaveBeenCalledWith("u1");
      expect(mockShiftRepo.hasActiveShift).toHaveBeenCalledWith("u1");
      expect(mockUserRepo.hasRelations).toHaveBeenCalledWith("u1");
      expect(mockUserRepo.delete).toHaveBeenCalledWith("u1");

      // Should notify admin
      expect(mockNotifRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "User Dihapus",
          type: "WARNING",
        })
      );

      expect(logger.info).toHaveBeenCalledWith(
        "User berhasil dihapus",
        expect.objectContaining({
          userId: "u1",
          email: "test@example.com",
          fullName: "Test User",
          role: "CASHIER",
        })
      );
    });

    it("should throw NotFoundError when user not found", async () => {
      mockUserRepo.findById.mockResolvedValue(null);

      await expect(service.deleteUser("u99")).rejects.toThrow(ApiError);

      try {
        await service.deleteUser("u99");
      } catch (error) {
        expect(error.statusCode).toBe(404);
        expect(error.message).toContain("User dengan ID 'u99' tidak ditemukan");
      }

      expect(mockUserRepo.delete).not.toHaveBeenCalled();
    });

    it("should throw ForbiddenError when deleting ADMIN", async () => {
      mockUserRepo.findById.mockResolvedValue({ ...mockUser, role: "ADMIN" });

      await expect(service.deleteUser("u1")).rejects.toThrow(ApiError);

      try {
        await service.deleteUser("u1");
      } catch (error) {
        expect(error.statusCode).toBe(403);
        expect(error.message).toContain(
          "Tidak dapat menghapus user dengan role Admin"
        );
      }
    });

    it("should throw Conflict when user has active shift", async () => {
      mockShiftRepo.hasActiveShift.mockResolvedValue(true);

      await expect(service.deleteUser("u1")).rejects.toThrow(ApiError);

      try {
        await service.deleteUser("u1");
      } catch (error) {
        expect(error.statusCode).toBe(409);
        expect(error.message).toContain("masih memiliki shift aktif");
      }
    });

    it("should throw Conflict when user has relations", async () => {
      mockUserRepo.hasRelations.mockResolvedValue(true);

      await expect(service.deleteUser("u1")).rejects.toThrow(ApiError);

      try {
        await service.deleteUser("u1");
      } catch (error) {
        expect(error.statusCode).toBe(409);
        expect(error.message).toContain("masih memiliki data terkait");
      }
    });
  });

  // ============================================================
  // validateUserEmail
  // ============================================================
  describe("validateUserEmail", () => {
    const mockUser = {
      id: "u1",
      email: "test@example.com",
      isActive: true,
      isAuthenticated: true,
    };

    it("should return user when valid, active, and authenticated", async () => {
      mockUserRepo.findByEmail.mockResolvedValue(mockUser);

      const result = await service.validateUserEmail("test@example.com");

      expect(result).toEqual(mockUser);
      expect(mockUserRepo.findByEmail).toHaveBeenCalledWith("test@example.com");
    });

    it("should throw NotFoundError when email not registered", async () => {
      mockUserRepo.findByEmail.mockResolvedValue(null);

      await expect(
        service.validateUserEmail("unknown@test.com")
      ).rejects.toThrow(ApiError);

      try {
        await service.validateUserEmail("unknown@test.com");
      } catch (error) {
        expect(error.statusCode).toBe(404);
        expect(error.message).toContain(
          "Akun dengan email 'unknown@test.com' tidak terdaftar"
        );
      }
    });

    it("should throw ForbiddenError when user is inactive", async () => {
      mockUserRepo.findByEmail.mockResolvedValue({
        ...mockUser,
        isActive: false,
      });

      await expect(
        service.validateUserEmail("test@example.com")
      ).rejects.toThrow(ApiError);

      try {
        await service.validateUserEmail("test@example.com");
      } catch (error) {
        expect(error.statusCode).toBe(403);
        expect(error.message).toContain("telah dinonaktifkan");
      }
    });

    it("should throw ForbiddenError when user is not authenticated", async () => {
      mockUserRepo.findByEmail.mockResolvedValue({
        ...mockUser,
        isAuthenticated: false,
      });

      await expect(
        service.validateUserEmail("test@example.com")
      ).rejects.toThrow(ApiError);

      try {
        await service.validateUserEmail("test@example.com");
      } catch (error) {
        expect(error.statusCode).toBe(403);
        expect(error.message).toContain("belum diaktifkan");
      }
    });
  });

  // ============================================================
  // checkEmailExists & checkPhoneExists
  // ============================================================
  describe("checkEmailExists", () => {
    it("should return exists true with message when email is registered", async () => {
      mockUserRepo.isEmailExists.mockResolvedValue(true);

      const result = await service.checkEmailExists("test@example.com");

      expect(result).toEqual({
        exists: true,
        message: "Email 'test@example.com' sudah terdaftar.",
      });
      expect(mockUserRepo.isEmailExists).toHaveBeenCalledWith(
        "test@example.com",
        null
      );
    });

    it("should return exists false with message when email is available", async () => {
      mockUserRepo.isEmailExists.mockResolvedValue(false);

      const result = await service.checkEmailExists("new@example.com");

      expect(result).toEqual({
        exists: false,
        message: "Email 'new@example.com' tersedia.",
      });
    });

    it("should pass excludeId to repository", async () => {
      mockUserRepo.isEmailExists.mockResolvedValue(false);

      await service.checkEmailExists("test@example.com", "u1");

      expect(mockUserRepo.isEmailExists).toHaveBeenCalledWith(
        "test@example.com",
        "u1"
      );
    });
  });

  describe("checkPhoneExists", () => {
    it("should return exists true with message when phone is used", async () => {
      mockUserRepo.isPhoneExists.mockResolvedValue(true);

      const result = await service.checkPhoneExists("08123456789");

      expect(result).toEqual({
        exists: true,
        message: "Nomor telepon '08123456789' sudah digunakan.",
      });
      expect(mockUserRepo.isPhoneExists).toHaveBeenCalledWith(
        "08123456789",
        null
      );
    });

    it("should return exists false with message when phone is available", async () => {
      mockUserRepo.isPhoneExists.mockResolvedValue(false);

      const result = await service.checkPhoneExists("0899999999");

      expect(result).toEqual({
        exists: false,
        message: "Nomor telepon '0899999999' tersedia.",
      });
    });

    it("should pass excludeId to repository", async () => {
      mockUserRepo.isPhoneExists.mockResolvedValue(false);

      await service.checkPhoneExists("08123456789", "u1");

      expect(mockUserRepo.isPhoneExists).toHaveBeenCalledWith(
        "08123456789",
        "u1"
      );
    });
  });


  // ============================================================
// deactivateUsers - PERBAIKAN
// ============================================================
describe("deactivateUsers", () => {
  const mockUsers = [
    { id: "u1", fullName: "User 1", role: "CASHIER", isActive: true },
    { id: "u2", fullName: "User 2", role: "MECHANIC", isActive: true },
  ];

  it("should deactivate multiple users successfully", async () => {
    mockUserRepo.findById.mockImplementation((id) => {
      return Promise.resolve(mockUsers.find((u) => u.id === id) || null);
    });
    mockShiftRepo.hasActiveShift.mockResolvedValue(false);
    mockUserRepo.deactivateMany.mockResolvedValue({
      success: [{ id: "u1" }, { id: "u2" }],
      failed: [],
    });

    const result = await service.deactivateUsers(
      ["u1", "u2"],
      "admin1"
    );

    expect(result.summary).toEqual({
      total: 2,
      valid: 2,
      skipped: 0,
      deactivated: 2,
      failed: 0,
    });
    expect(mockUserRepo.deactivateMany).toHaveBeenCalledWith(["u1", "u2"]);
    expect(logger.info).toHaveBeenCalledWith(
      "Bulk deactivate user selesai",
      expect.objectContaining({
        summary: expect.any(Object),
        actorId: "admin1",
      })
    );
  });

  it("should throw BadRequest when userIds is empty", async () => {
    await expect(service.deactivateUsers([], "admin1")).rejects.toThrow(
      ApiError
    );

    try {
      await service.deactivateUsers([], "admin1");
    } catch (error) {
      expect(error.statusCode).toBe(400);
      expect(error.message).toContain("Tidak ada user yang dipilih");
    }
  });

  // PERBAIKAN: Ketika semua user di-skip, service melempar error
  // Jadi test harus menangkap error tersebut, bukan mengharapkan result
  it("should throw BadRequest when all users are non-existent", async () => {
    mockUserRepo.findById.mockResolvedValue(null);

    await expect(
      service.deactivateUsers(["u99", "u100"], "admin1")
    ).rejects.toThrow(ApiError);

    try {
      await service.deactivateUsers(["u99", "u100"], "admin1");
    } catch (error) {
      expect(error.statusCode).toBe(400);
      expect(error.message).toContain(
        "Tidak ada user yang memenuhi syarat untuk dinonaktifkan"
      );
      expect(error.details).toBeDefined();
      expect(error.details).toHaveLength(2);
      expect(error.details[0]).toEqual({
        id: "u99",
        reason: "User tidak ditemukan",
      });
    }
  });

  it("should throw BadRequest when all users are ADMIN", async () => {
    mockUserRepo.findById.mockImplementation((id) => {
      return Promise.resolve({
        id,
        fullName: `Admin ${id}`,
        role: "ADMIN",
        isActive: true,
      });
    });

    await expect(
      service.deactivateUsers(["admin1", "admin2"], "admin1")
    ).rejects.toThrow(ApiError);

    try {
      await service.deactivateUsers(["admin1", "admin2"], "admin1");
    } catch (error) {
      expect(error.statusCode).toBe(400);
      expect(error.message).toContain(
        "Tidak ada user yang memenuhi syarat untuk dinonaktifkan"
      );
      expect(error.details).toBeDefined();
      expect(error.details).toHaveLength(2);
      expect(error.details[0].reason).toBe("Tidak dapat menonaktifkan Admin");
    }
  });

  it("should throw BadRequest when all users are already inactive", async () => {
    mockUserRepo.findById.mockImplementation((id) => {
      return Promise.resolve({
        id,
        fullName: `User ${id}`,
        role: "CASHIER",
        isActive: false, // Already inactive
      });
    });

    await expect(
      service.deactivateUsers(["u1", "u2"], "admin1")
    ).rejects.toThrow(ApiError);

    try {
      await service.deactivateUsers(["u1", "u2"], "admin1");
    } catch (error) {
      expect(error.statusCode).toBe(400);
      expect(error.message).toContain(
        "Tidak ada user yang memenuhi syarat untuk dinonaktifkan"
      );
      expect(error.details).toBeDefined();
      expect(error.details).toHaveLength(2);
      expect(error.details[0].reason).toBe("User sudah nonaktif");
    }
  });

  it("should throw BadRequest when all users have active shift", async () => {
    mockUserRepo.findById.mockImplementation((id) => {
      return Promise.resolve({
        id,
        fullName: `User ${id}`,
        role: "CASHIER",
        isActive: true,
      });
    });
    mockShiftRepo.hasActiveShift.mockResolvedValue(true);

    await expect(
      service.deactivateUsers(["u1", "u2"], "admin1")
    ).rejects.toThrow(ApiError);

    try {
      await service.deactivateUsers(["u1", "u2"], "admin1");
    } catch (error) {
      expect(error.statusCode).toBe(400);
      expect(error.message).toContain(
        "Tidak ada user yang memenuhi syarat untuk dinonaktifkan"
      );
      expect(error.details).toBeDefined();
      expect(error.details).toHaveLength(2);
      expect(error.details[0].reason).toBe("Masih memiliki shift aktif");
    }
  });

  // Test untuk mixed scenarios (ada yang valid, ada yang skip)
  it("should handle mixed scenarios (some valid, some skipped)", async () => {
    mockUserRepo.findById.mockImplementation((id) => {
      const users = {
        u1: { id: "u1", fullName: "Valid User", role: "CASHIER", isActive: true },
        u2: { id: "u2", fullName: "Admin User", role: "ADMIN", isActive: true },
        u3: { id: "u3", fullName: "Inactive User", role: "MECHANIC", isActive: false },
      };
      return Promise.resolve(users[id] || null);
    });
    
    mockShiftRepo.hasActiveShift.mockImplementation((id) => {
      return Promise.resolve(id === "u4"); // Only u4 has active shift
    });
    
    mockUserRepo.deactivateMany.mockResolvedValue({
      success: [{ id: "u1" }],
      failed: [],
    });

    const userIds = ["u1", "u2", "u3", "u99", "u4"];
    // u1: valid, u2: admin (skip), u3: already inactive (skip), u99: not found (skip), u4: active shift (skip)
    
    // Mock for u4
    mockUserRepo.findById.mockImplementation((id) => {
      const users = {
        u1: { id: "u1", fullName: "Valid User", role: "CASHIER", isActive: true },
        u2: { id: "u2", fullName: "Admin User", role: "ADMIN", isActive: true },
        u3: { id: "u3", fullName: "Inactive User", role: "MECHANIC", isActive: false },
        u4: { id: "u4", fullName: "Shift User", role: "CASHIER", isActive: true },
      };
      return Promise.resolve(users[id] || null);
    });

    const result = await service.deactivateUsers(userIds, "admin1");

    expect(result.summary.total).toBe(5);
    expect(result.summary.valid).toBe(1); // Only u1 is valid
    expect(result.summary.skipped).toBe(4); // u2, u3, u99, u4 are skipped
    expect(result.summary.deactivated).toBe(1);
    expect(result.summary.failed).toBe(0);
    
    expect(result.details.skipped).toHaveLength(4);
    expect(result.details.skipped.map(s => s.id || s.id)).toContain("u2");
    expect(result.details.skipped.map(s => s.id || s.id)).toContain("u3");
  });

  it("should throw BadRequest when no users can be deactivated", async () => {
    mockUserRepo.findById.mockResolvedValue({
      id: "u1",
      role: "ADMIN",
      isActive: true,
    });

    await expect(
      service.deactivateUsers(["u1"], "admin1")
    ).rejects.toThrow(ApiError);

    try {
      await service.deactivateUsers(["u1"], "admin1");
    } catch (error) {
      expect(error.statusCode).toBe(400);
      expect(error.message).toContain(
        "Tidak ada user yang memenuhi syarat"
      );
      expect(error.details).toBeDefined();
    }
  });

  it("should handle partial failures from repository", async () => {
    mockUserRepo.findById.mockImplementation((id) => {
      return Promise.resolve(
        mockUsers.find((u) => u.id === id) || null
      );
    });
    mockShiftRepo.hasActiveShift.mockResolvedValue(false);
    mockUserRepo.deactivateMany.mockResolvedValue({
      success: [{ id: "u1" }],
      failed: [{ id: "u2", reason: "Database error" }],
    });

    const result = await service.deactivateUsers(
      ["u1", "u2"],
      "admin1"
    );

    expect(result.summary.deactivated).toBe(1);
    expect(result.summary.failed).toBe(1);
    expect(result.details.failed).toHaveLength(1);
  });
});

// ============================================================
// activateUsers - PERBAIKAN
// ============================================================
describe("activateUsers", () => {
  it("should activate multiple users successfully", async () => {
    mockUserRepo.findById.mockImplementation((id) => {
      return Promise.resolve({
        id,
        fullName: `User ${id}`,
        role: "CASHIER",
        isActive: false,
      });
    });
    mockUserRepo.activateMany.mockResolvedValue({
      success: [{ id: "u1" }, { id: "u2" }],
      failed: [],
    });

    const result = await service.activateUsers(
      ["u1", "u2"],
      "admin1"
    );

    expect(result.summary).toEqual({
      total: 2,
      valid: 2,
      skipped: 0,
      activated: 2,
      failed: 0,
    });
    expect(mockUserRepo.activateMany).toHaveBeenCalledWith(["u1", "u2"]);
    expect(logger.info).toHaveBeenCalledWith(
      "Bulk activate user selesai",
      expect.objectContaining({
        actorId: "admin1",
      })
    );
  });

  it("should throw BadRequest when userIds is empty", async () => {
    await expect(service.activateUsers([], "admin1")).rejects.toThrow(
      ApiError
    );

    try {
      await service.activateUsers([], "admin1");
    } catch (error) {
      expect(error.statusCode).toBe(400);
      expect(error.message).toContain("Tidak ada user yang dipilih");
    }
  });

  // PERBAIKAN: Ketika semua user sudah aktif, service melempar error
  it("should throw BadRequest when all users are already active", async () => {
    mockUserRepo.findById.mockImplementation((id) => {
      return Promise.resolve({
        id,
        fullName: `User ${id}`,
        role: "CASHIER",
        isActive: true, // Already active
      });
    });

    await expect(
      service.activateUsers(["u1", "u2"], "admin1")
    ).rejects.toThrow(ApiError);

    try {
      await service.activateUsers(["u1", "u2"], "admin1");
    } catch (error) {
      expect(error.statusCode).toBe(400);
      expect(error.message).toContain(
        "Tidak ada user yang memenuhi syarat untuk diaktifkan"
      );
      expect(error.details).toBeDefined();
      expect(error.details).toHaveLength(2);
      expect(error.details[0].reason).toBe("User sudah aktif");
    }
  });

  // PERBAIKAN: Ketika semua user tidak ditemukan, service melempar error
  it("should throw BadRequest when all users are non-existent", async () => {
    mockUserRepo.findById.mockResolvedValue(null);

    await expect(
      service.activateUsers(["u99", "u100"], "admin1")
    ).rejects.toThrow(ApiError);

    try {
      await service.activateUsers(["u99", "u100"], "admin1");
    } catch (error) {
      expect(error.statusCode).toBe(400);
      expect(error.message).toContain(
        "Tidak ada user yang memenuhi syarat untuk diaktifkan"
      );
      expect(error.details).toBeDefined();
      expect(error.details).toHaveLength(2);
      expect(error.details[0]).toEqual({
        id: "u99",
        reason: "User tidak ditemukan",
      });
    }
  });

  // Test untuk mixed scenarios
  it("should handle mixed scenarios (some valid, some skipped)", async () => {
    mockUserRepo.findById.mockImplementation((id) => {
      const users = {
        u1: { id: "u1", fullName: "Inactive User", role: "CASHIER", isActive: false },
        u2: { id: "u2", fullName: "Already Active", role: "MECHANIC", isActive: true },
      };
      return Promise.resolve(users[id] || null);
    });
    
    mockUserRepo.activateMany.mockResolvedValue({
      success: [{ id: "u1" }],
      failed: [],
    });

    const result = await service.activateUsers(["u1", "u2", "u99"], "admin1");

    expect(result.summary.total).toBe(3);
    expect(result.summary.valid).toBe(1); // Only u1 is valid
    expect(result.summary.skipped).toBe(2); // u2 (already active), u99 (not found)
    expect(result.summary.activated).toBe(1);
    expect(result.summary.failed).toBe(0);
    
    expect(result.details.skipped).toHaveLength(2);
  });

  it("should throw BadRequest when no users can be activated", async () => {
    mockUserRepo.findById.mockResolvedValue({
      id: "u1",
      isActive: true, // Already active
    });

    await expect(
      service.activateUsers(["u1"], "admin1")
    ).rejects.toThrow(ApiError);

    try {
      await service.activateUsers(["u1"], "admin1");
    } catch (error) {
      expect(error.statusCode).toBe(400);
      expect(error.message).toContain(
        "Tidak ada user yang memenuhi syarat"
      );
      expect(error.details).toBeDefined();
    }
  });
});
});