import prisma from "#app/database.js";
import UserRepository from "#repository/userRepository.js";

jest.mock("#app/database.js", () => ({
  user: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  order: {
    count: jest.fn(),
  },
  expense: {
    count: jest.fn(),
  },
  stockMovement: {
    count: jest.fn(),
  },
  mechanicAssignment: {
    count: jest.fn(),
  },
  file: {
    count: jest.fn(),
  },
}));

jest.mock("#shared/utils/pagination.js", () => ({
  generateMetadata: jest.fn((total, page, limit) => ({
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  })),
}));

/**
 * Unit test untuk UserRepository
 * @describe UserRepository
 */
describe("UserRepository", () => {
  let repo;

  beforeEach(() => {
    jest.clearAllMocks();
    repo = new UserRepository();
  });

  describe("create", () => {
    it("should create a user with all fields", async () => {
      const input = {
        email: "kasir@bengkel.com",
        fullName: "Kasir 1",
        phone: "081234567890",
        role: "CASHIER",
        isAuthenticated: false,
      };

      const expected = {
        id: "user-1",
        email: "kasir@bengkel.com",
        fullName: "Kasir 1",
        phone: "081234567890",
        role: "CASHIER",
        isActive: true,
        isAuthenticated: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.user.create.mockResolvedValue(expected);

      const result = await repo.create(input);

      expect(result).toEqual(expected);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          email: "kasir@bengkel.com",
          fullName: "Kasir 1",
          phone: "081234567890",
          role: "CASHIER",
          isActive: true,
          isAuthenticated: false,
        },
        select: expect.any(Object),
      });
    });

    it("should create a user with default values", async () => {
      const input = { email: "mekanik@bengkel.com", fullName: "Mekanik 1" };

      prisma.user.create.mockResolvedValue({});

      await repo.create(input);

      expect(prisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          role: "CASHIER",
          isActive: true,
          isAuthenticated: false,
        }),
        select: expect.any(Object),
      });
    });

    it("should create a user with isAuthenticated true", async () => {
      const input = { email: "admin@bengkel.com", fullName: "Admin", role: "ADMIN", isAuthenticated: true };

      prisma.user.create.mockResolvedValue({});

      await repo.create(input);

      expect(prisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ isAuthenticated: true }),
        select: expect.any(Object),
      });
    });
  });

  describe("findById", () => {
    it("should return user with detail counts when found", async () => {
      const mockUser = {
        id: "user-1",
        email: "kasir@bengkel.com",
        fullName: "Kasir 1",
        phone: "0812",
        role: "CASHIER",
        isActive: true,
        isAuthenticated: true,
        _count: { orders: 50, shifts: 30, expenses: 10, stockMovements: 5, mechanicAssignments: 0, uploadedFiles: 2 },
      };

      prisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await repo.findById("user-1");

      expect(result).toEqual(mockUser);
    });

    it("should return null when user not found", async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const result = await repo.findById("user-99");

      expect(result).toBeNull();
    });
  });

  describe("findByEmail", () => {
    it("should return user by email", async () => {
      const mockUser = { id: "user-1", email: "kasir@bengkel.com", fullName: "Kasir 1", phone: "0812", role: "CASHIER", isActive: true };

      prisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await repo.findByEmail("kasir@bengkel.com");

      expect(result).toEqual(mockUser);
    });

    it("should return null when email not found", async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const result = await repo.findByEmail("unknown@email.com");

      expect(result).toBeNull();
    });
  });

  describe("findByPhone", () => {
    it("should return user by phone", async () => {
      const mockUser = { id: "user-1", email: "kasir@bengkel.com", fullName: "Kasir 1", phone: "081234567890", role: "CASHIER" };

      prisma.user.findFirst.mockResolvedValue(mockUser);

      const result = await repo.findByPhone("081234567890");

      expect(result).toEqual(mockUser);
    });

    it("should return null when phone is null", async () => {
      const result = await repo.findByPhone(null);

      expect(result).toBeNull();
      expect(prisma.user.findFirst).not.toHaveBeenCalled();
    });

    it("should return null when phone not found", async () => {
      prisma.user.findFirst.mockResolvedValue(null);

      const result = await repo.findByPhone("089999999999");

      expect(result).toBeNull();
    });
  });

  describe("findMany", () => {
    it("should return users with default pagination", async () => {
      const mockData = [
        { id: "u1", email: "a@email.com", fullName: "Andi", phone: "0811", role: "CASHIER", isActive: true, isAuthenticated: true },
        { id: "u2", email: "b@email.com", fullName: "Budi", phone: "0812", role: "MECHANIC", isActive: true, isAuthenticated: true },
      ];

      prisma.user.count.mockResolvedValue(2);
      prisma.user.findMany.mockResolvedValue(mockData);

      const result = await repo.findMany({});

      expect(result.data).toEqual(mockData);
      expect(result.data).toHaveLength(2);
      expect(result.metadata.total).toBe(2);
    });

    it("should return users filtered by role", async () => {
      prisma.user.count.mockResolvedValue(5);
      prisma.user.findMany.mockResolvedValue([]);

      await repo.findMany({ role: "MECHANIC" });

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { role: "MECHANIC" } })
      );
    });

    it("should return users filtered by search", async () => {
      prisma.user.count.mockResolvedValue(2);
      prisma.user.findMany.mockResolvedValue([]);

      await repo.findMany({ search: "Budi" });

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { fullName: { contains: "Budi", mode: "insensitive" } },
              { email: { contains: "Budi", mode: "insensitive" } },
            ],
          },
        })
      );
    });
  });

  describe("findByRole", () => {
    it("should return users by role", async () => {
      const mockUsers = [
        { id: "u1", email: "m1@email.com", fullName: "Mekanik 1", phone: "0811", role: "MECHANIC", isActive: true },
      ];

      prisma.user.findMany.mockResolvedValue(mockUsers);

      const result = await repo.findByRole("MECHANIC");

      expect(result).toEqual(mockUsers);
    });
  });

  describe("findEmployees", () => {
    it("should return employees with default role filter", async () => {
      prisma.user.count.mockResolvedValue(10);
      prisma.user.findMany.mockResolvedValue([]);

      await repo.findEmployees({});

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { role: { in: ["CASHIER", "MECHANIC"] } } })
      );
    });
  });

  describe("update", () => {
    it("should update user data", async () => {
      const updateData = { fullName: "Kasir Updated", phone: "089876543210" };
      const expected = { id: "user-1", fullName: "Kasir Updated", phone: "089876543210" };

      prisma.user.update.mockResolvedValue(expected);

      const result = await repo.update("user-1", updateData);

      expect(result).toEqual(expected);
    });
  });

  describe("delete", () => {
    it("should delete a user by ID", async () => {
      prisma.user.delete.mockResolvedValue({});

      await repo.delete("user-1");

      expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: "user-1" } });
    });
  });

  describe("isEmailExists", () => {
    it("should return user when email exists", async () => {
      prisma.user.findUnique.mockResolvedValue({ id: "user-1", email: "kasir@email.com", isActive: true });

      const result = await repo.isEmailExists("kasir@email.com");

      expect(result).toEqual({ id: "user-1", email: "kasir@email.com", isActive: true });
    });

    it("should return null when email does not exist", async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const result = await repo.isEmailExists("new@email.com");

      expect(result).toBeNull();
    });

    it("should return null when email is null", async () => {
      const result = await repo.isEmailExists(null);

      expect(result).toBeNull();
      expect(prisma.user.findUnique).not.toHaveBeenCalled();
    });

    it("should exclude specific ID when checking", async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await repo.isEmailExists("kasir@email.com", "user-1");

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: "kasir@email.com", id: { not: "user-1" } },
        select: { id: true, email: true, isActive: true },
      });
    });
  });

  describe("isPhoneExists", () => {
    it("should return user when phone exists", async () => {
      prisma.user.findFirst.mockResolvedValue({ id: "user-1", phone: "081234567890", isActive: true });

      const result = await repo.isPhoneExists("081234567890");

      expect(result).toEqual({ id: "user-1", phone: "081234567890", isActive: true });
    });

    it("should return null when phone is null", async () => {
      const result = await repo.isPhoneExists(null);

      expect(result).toBeNull();
    });
  });

  describe("hasRelations", () => {
    it("should return true when user has relations", async () => {
      prisma.order.count.mockResolvedValue(5);

      const result = await repo.hasRelations("user-1");

      expect(result).toBe(true);
    });

    it("should return false when user has no relations", async () => {
      prisma.order.count.mockResolvedValue(0);
      prisma.expense.count.mockResolvedValue(0);
      prisma.stockMovement.count.mockResolvedValue(0);
      prisma.mechanicAssignment.count.mockResolvedValue(0);
      prisma.file.count.mockResolvedValue(0);

      const result = await repo.hasRelations("user-1");

      expect(result).toBe(false);
    });
  });

  describe("updateAuthenticated", () => {
    it("should update authentication status to true", async () => {
      prisma.user.update.mockResolvedValue({});

      await repo.updateAuthenticated("user-1", true);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: "user-1" },
        data: { isAuthenticated: true },
        select: expect.any(Object),
      });
    });
  });

  describe("getUserSummary", () => {
    it("should return user summary with todayOrders", async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: "user-1", email: "kasir@email.com", fullName: "Kasir",
        _count: { orders: 100, shifts: 50, expenses: 10, stockMovements: 5, mechanicAssignments: 0, uploadedFiles: 2 },
      });
      prisma.order.count.mockResolvedValue(8);

      const result = await repo.getUserSummary("user-1");

      expect(result.todayOrders).toBe(8);
    });

    it("should return null when user not found", async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const result = await repo.getUserSummary("user-99");

      expect(result).toBeNull();
    });
  });

  describe("findAvailableMechanics", () => {
    it("should return available mechanics", async () => {
      const mockMechanics = [
        { id: "m1", fullName: "Joko", email: "joko@email.com", phone: "0812", _count: { mechanicAssignments: 2 } },
      ];

      prisma.user.findMany.mockResolvedValue(mockMechanics);

      const result = await repo.findAvailableMechanics({});

      expect(result).toEqual(mockMechanics);
    });
  });

  describe("updateAuthStatus", () => {
    it("should update auth status when not authenticated", async () => {
      prisma.user.findUnique.mockResolvedValue({ isAuthenticated: false });
      prisma.user.update.mockResolvedValue({});

      await repo.updateAuthStatus("user-1");

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: "user-1" },
        data: { isAuthenticated: true },
        select: expect.any(Object),
      });
    });

    it("should not update when already authenticated", async () => {
      prisma.user.findUnique.mockResolvedValue({ isAuthenticated: true });

      await repo.updateAuthStatus("user-1");

      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it("should do nothing when user not found", async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await repo.updateAuthStatus("user-99");

      expect(prisma.user.update).not.toHaveBeenCalled();
    });
  });
});