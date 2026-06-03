import authMiddleware from "#middleware/authMiddleware.js";
import supabase from "#lib/supabase.js";

jest.mock("#lib/supabase.js", () => ({
  auth: {
    getUser: jest.fn(),
  },
}));

jest.mock("#repository/userRepository.js", () => {
  const mockInstance = {
    findByEmail: jest.fn(),
    updateAuthStatus: jest.fn(),
  };
  return {
    __esModule: true,
    default: jest.fn(() => mockInstance),
  };
});

jest.mock("#shared/utils/cache.js", () => {
  const mockInstance = {
    get: jest.fn(),
    set: jest.fn(),
  };
  return {
    __esModule: true,
    default: jest.fn(() => mockInstance),
  };
});

jest.mock("#shared/utils/error.js", () => {
  const actual = jest.requireActual("#shared/utils/error.js");
  return {
    __esModule: true,
    default: actual.default,
  };
});

jest.mock("#app/logger.js", () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

describe("authMiddleware", () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      headers: {},
      method: "GET",
      originalUrl: "/api/v1/products",
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    next = jest.fn();

    supabase.auth.getUser.mockReset();
  });

  describe("Authorization Header", () => {
    it("should throw unauthorized when no authorization header", async () => {
      await authMiddleware(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 401,
          message: expect.stringContaining("login"),
        })
      );
    });

    it("should throw unauthorized when token format is invalid", async () => {
      req.headers.authorization = "InvalidFormat token123";

      await authMiddleware(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 401,
          message: expect.stringContaining("Format token"),
        })
      );
    });
  });

  describe("Supabase Verification", () => {
    beforeEach(() => {
      req.headers.authorization = "Bearer valid-token";
    });

    it("should throw unauthorized when session expired", async () => {
      supabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: "JWT expired" },
      });

      await authMiddleware(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 401,
          message: expect.stringContaining("Sesi login Anda sudah berakhir"),
        })
      );
    });

    it("should throw unauthorized when JWT is invalid", async () => {
      supabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: "invalid JWT" },
      });

      await authMiddleware(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 401,
          message: expect.stringContaining("Sesi login Anda sudah berakhir"),
        })
      );
    });

    it("should throw service unavailable when auth service error", async () => {
      supabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: "Internal server error" },
      });

      await authMiddleware(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 503,
          message: expect.stringContaining("Layanan autentikasi sedang mengalami gangguan"),
        })
      );
    });

    it("should throw unauthorized when no user in Supabase response", async () => {
      supabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      await authMiddleware(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 401,
          message: expect.stringContaining("Sesi login tidak valid"),
        })
      );
    });

    it("should handle unexpected Supabase errors", async () => {
      supabase.auth.getUser.mockRejectedValue(new Error("Network error"));

      await authMiddleware(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 503,
          message: expect.stringContaining("Tidak dapat terhubung ke layanan autentikasi"),
        })
      );
    });
  });

  describe("User Validation", () => {
    const mockSupabaseUser = { email: "kasir@bengkel.com" };

    beforeEach(() => {
      req.headers.authorization = "Bearer valid-token";
      supabase.auth.getUser.mockResolvedValue({
        data: { user: mockSupabaseUser },
        error: null,
      });
    });

    it("should throw unauthorized when user not found in database", async () => {
      const { default: UserRepository } = require("#repository/userRepository.js");
      const mockRepo = new UserRepository();
      mockRepo.findByEmail.mockResolvedValue(null);

      await authMiddleware(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 401,
          message: expect.stringContaining("Akun tidak ditemukan"),
        })
      );
    });

    it("should throw forbidden when account is inactive", async () => {
      const { default: UserRepository } = require("#repository/userRepository.js");
      const mockRepo = new UserRepository();
      mockRepo.findByEmail.mockResolvedValue({
        id: "user-1",
        email: "kasir@bengkel.com",
        isActive: false,
        isAuthenticated: false,
      });

      await authMiddleware(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 403,
          message: expect.stringContaining("tidak aktif"),
        })
      );
    });

    it("should update auth status when not authenticated", async () => {
      const { default: UserRepository } = require("#repository/userRepository.js");
      const mockRepo = new UserRepository();
      const mockUser = {
        id: "user-1",
        email: "kasir@bengkel.com",
        isActive: true,
        isAuthenticated: false,
        role: "CASHIER",
      };

      mockRepo.findByEmail.mockResolvedValue(mockUser);
      mockRepo.updateAuthStatus.mockResolvedValue();

      await authMiddleware(req, res, next);

      expect(mockRepo.updateAuthStatus).toHaveBeenCalledWith("user-1");
      expect(req.user.isAuthenticated).toBe(true);
      expect(next).toHaveBeenCalledWith();
    });

    it("should skip update when already authenticated", async () => {
      const { default: UserRepository } = require("#repository/userRepository.js");
      const mockRepo = new UserRepository();
      const mockUser = {
        id: "user-1",
        email: "kasir@bengkel.com",
        isActive: true,
        isAuthenticated: true,
        role: "CASHIER",
      };

      mockRepo.findByEmail.mockResolvedValue(mockUser);

      await authMiddleware(req, res, next);

      expect(mockRepo.updateAuthStatus).not.toHaveBeenCalled();
      expect(req.user).toEqual(mockUser);
      expect(next).toHaveBeenCalledWith();
    });
  });

  describe("Cache", () => {
    const mockSupabaseUser = { email: "kasir@bengkel.com" };
    const mockUser = {
      id: "user-1",
      email: "kasir@bengkel.com",
      isActive: true,
      isAuthenticated: true,
      role: "CASHIER",
    };

    beforeEach(() => {
      req.headers.authorization = "Bearer valid-token";
      supabase.auth.getUser.mockResolvedValue({
        data: { user: mockSupabaseUser },
        error: null,
      });
    });

    it("should use cached user when available", async () => {
      const { default: CacheManager } = require("#shared/utils/cache.js");
      const mockCache = new CacheManager();
      mockCache.get.mockResolvedValue(mockUser);

      await authMiddleware(req, res, next);

      expect(mockCache.get).toHaveBeenCalledWith("email:kasir@bengkel.com");
      expect(req.user).toEqual(mockUser);
      expect(next).toHaveBeenCalledWith();
    });

    it("should fetch from database and cache when not cached", async () => {
      const { default: CacheManager } = require("#shared/utils/cache.js");
      const mockCache = new CacheManager();
      mockCache.get.mockResolvedValue(null);

      const { default: UserRepository } = require("#repository/userRepository.js");
      const mockRepo = new UserRepository();
      mockRepo.findByEmail.mockResolvedValue(mockUser);

      await authMiddleware(req, res, next);

      expect(mockCache.set).toHaveBeenCalledWith(
        "email:kasir@bengkel.com",
        mockUser,
        3600
      );
      expect(req.user).toEqual(mockUser);
      expect(next).toHaveBeenCalledWith();
    });
  });
});