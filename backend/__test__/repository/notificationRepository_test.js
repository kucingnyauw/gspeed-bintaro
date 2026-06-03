import prisma from "#app/database.js";
import NotificationRepository from "#repository/notificationRepository.js";

jest.mock("#app/database.js", () => ({
  notification: {
    create: jest.fn(),
    createMany: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn(),
    groupBy: jest.fn(),
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
 * Unit test untuk NotificationRepository
 * @describe NotificationRepository
 */
describe("NotificationRepository", () => {
  let repo;

  beforeEach(() => {
    jest.clearAllMocks();
    repo = new NotificationRepository();
  });

  describe("create", () => {
    it("should create a notification with all fields", async () => {
      const input = {
        title: "Test Notification",
        message: "This is a test message",
        type: "WARNING",
        userId: "user-1",
      };

      const expected = {
        id: "notif-1",
        title: "Test Notification",
        message: "This is a test message",
        type: "WARNING",
        isRead: false,
        createdAt: new Date(),
      };

      prisma.notification.create.mockResolvedValue(expected);

      const result = await repo.create(input);

      expect(result).toEqual(expected);
      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: {
          title: "Test Notification",
          message: "This is a test message",
          type: "WARNING",
          userId: "user-1",
        },
        select: {
          id: true,
          title: true,
          message: true,
          type: true,
          isRead: true,
          createdAt: true,
        },
      });
    });

    it("should create a notification with default type INFO", async () => {
      const input = { title: "Info", message: "System update", userId: "user-1" };

      prisma.notification.create.mockResolvedValue({});

      await repo.create(input);

      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ type: "INFO" }),
        select: expect.any(Object),
      });
    });
  });

  describe("createMany", () => {
    it("should create notifications for multiple users", async () => {
      const input = {
        userIds: ["user-1", "user-2", "user-3"],
        title: "Broadcast",
        message: "System maintenance",
        type: "WARNING",
      };

      prisma.notification.createMany.mockResolvedValue({ count: 3 });

      const result = await repo.createMany(input);

      expect(result).toBe(3);
      expect(prisma.notification.createMany).toHaveBeenCalledWith({
        data: [
          { title: "Broadcast", message: "System maintenance", type: "WARNING", userId: "user-1" },
          { title: "Broadcast", message: "System maintenance", type: "WARNING", userId: "user-2" },
          { title: "Broadcast", message: "System maintenance", type: "WARNING", userId: "user-3" },
        ],
      });
    });

    it("should create notifications with default type", async () => {
      prisma.notification.createMany.mockResolvedValue({ count: 1 });

      await repo.createMany({
        userIds: ["user-1"],
        title: "Hello",
        message: "Welcome",
      });

      expect(prisma.notification.createMany).toHaveBeenCalledWith({
        data: [
          { title: "Hello", message: "Welcome", type: "INFO", userId: "user-1" },
        ],
      });
    });

    it("should return 0 when userIds array is empty", async () => {
      prisma.notification.createMany.mockResolvedValue({ count: 0 });

      const result = await repo.createMany({
        userIds: [],
        title: "Test",
        message: "Test",
      });

      expect(result).toBe(0);
    });
  });

  describe("findById", () => {
    it("should return notification when found", async () => {
      const mockNotif = { id: "notif-1", title: "Test", message: "Message", type: "INFO", isRead: false };

      prisma.notification.findUnique.mockResolvedValue(mockNotif);

      const result = await repo.findById("notif-1");

      expect(result).toEqual(mockNotif);
    });

    it("should return null when not found", async () => {
      prisma.notification.findUnique.mockResolvedValue(null);

      const result = await repo.findById("notif-99");

      expect(result).toBeNull();
    });
  });

  describe("findByUserId", () => {
    it("should return user notifications with default pagination", async () => {
      const mockData = [
        { id: "notif-1", title: "Test 1", type: "INFO", isRead: false, createdAt: new Date() },
        { id: "notif-2", title: "Test 2", type: "WARNING", isRead: true, createdAt: new Date() },
      ];

      prisma.notification.count.mockResolvedValue(2);
      prisma.notification.findMany.mockResolvedValue(mockData);

      const result = await repo.findByUserId("user-1", {});

      expect(result.data).toEqual(mockData);
      expect(result.data).toHaveLength(2);
      expect(result.metadata.total).toBe(2);
      expect(prisma.notification.findMany).toHaveBeenCalledWith({
        where: { userId: "user-1" },
        skip: 0,
        take: 20,
        select: expect.any(Object),
        orderBy: { createdAt: "desc" },
      });
    });

    it("should return notifications filtered by isRead", async () => {
      prisma.notification.count.mockResolvedValue(5);
      prisma.notification.findMany.mockResolvedValue([]);

      await repo.findByUserId("user-1", { isRead: "true" });

      expect(prisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: "user-1", isRead: true },
        })
      );
    });

    it("should return notifications filtered by type", async () => {
      prisma.notification.count.mockResolvedValue(2);
      prisma.notification.findMany.mockResolvedValue([]);

      await repo.findByUserId("user-1", { type: "WARNING" });

      expect(prisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: "user-1", type: "WARNING" },
        })
      );
    });

    it("should return empty array when no notifications", async () => {
      prisma.notification.count.mockResolvedValue(0);
      prisma.notification.findMany.mockResolvedValue([]);

      const result = await repo.findByUserId("user-1", {});

      expect(result.data).toEqual([]);
      expect(result.metadata.total).toBe(0);
    });
  });

  describe("findRecentByUserId", () => {
    it("should return recent notifications with default limit", async () => {
      const mockRecent = [
        { id: "notif-1", title: "Recent 1", type: "INFO", isRead: false, createdAt: new Date() },
      ];

      prisma.notification.findMany.mockResolvedValue(mockRecent);

      const result = await repo.findRecentByUserId("user-1");

      expect(result).toEqual(mockRecent);
      expect(prisma.notification.findMany).toHaveBeenCalledWith({
        where: { userId: "user-1" },
        take: 5,
        select: expect.any(Object),
        orderBy: { createdAt: "desc" },
      });
    });

    it("should return recent notifications with custom limit", async () => {
      prisma.notification.findMany.mockResolvedValue([]);

      await repo.findRecentByUserId("user-1", 10);

      expect(prisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 10 })
      );
    });
  });

  describe("markAsRead", () => {
    it("should mark a notification as read", async () => {
      const expected = { id: "notif-1", isRead: true };

      prisma.notification.update.mockResolvedValue(expected);

      const result = await repo.markAsRead("notif-1");

      expect(result.isRead).toBe(true);
      expect(prisma.notification.update).toHaveBeenCalledWith({
        where: { id: "notif-1" },
        data: { isRead: true },
        select: expect.any(Object),
      });
    });
  });

  describe("markAllAsRead", () => {
    it("should mark all user notifications as read", async () => {
      prisma.notification.updateMany.mockResolvedValue({ count: 5 });

      const result = await repo.markAllAsRead("user-1");

      expect(result).toBe(5);
    });

    it("should return 0 when no unread notifications", async () => {
      prisma.notification.updateMany.mockResolvedValue({ count: 0 });

      const result = await repo.markAllAsRead("user-1");

      expect(result).toBe(0);
    });
  });

  describe("getUnreadCount", () => {
    it("should return unread notification count", async () => {
      prisma.notification.count.mockResolvedValue(8);

      const result = await repo.getUnreadCount("user-1");

      expect(result).toBe(8);
    });
  });

  describe("getTotalCount", () => {
    it("should return total notification count", async () => {
      prisma.notification.count.mockResolvedValue(25);

      const result = await repo.getTotalCount("user-1");

      expect(result).toBe(25);
    });
  });

  describe("delete", () => {
    it("should delete a notification by ID", async () => {
      prisma.notification.delete.mockResolvedValue({});

      await repo.delete("notif-1");

      expect(prisma.notification.delete).toHaveBeenCalledWith({
        where: { id: "notif-1" },
      });
    });
  });

  describe("deleteAll", () => {
    it("should delete all user notifications", async () => {
      prisma.notification.deleteMany.mockResolvedValue({ count: 10 });

      const result = await repo.deleteAll("user-1");

      expect(result).toBe(10);
    });

    it("should return 0 when user has no notifications", async () => {
      prisma.notification.deleteMany.mockResolvedValue({ count: 0 });

      const result = await repo.deleteAll("user-99");

      expect(result).toBe(0);
    });
  });

  describe("deleteReadNotifications", () => {
    it("should delete read notifications", async () => {
      prisma.notification.deleteMany.mockResolvedValue({ count: 7 });

      const result = await repo.deleteReadNotifications("user-1");

      expect(result).toBe(7);
    });
  });

  describe("getNotificationSummary", () => {
    it("should return complete notification summary", async () => {
      prisma.notification.count.mockResolvedValueOnce(20).mockResolvedValueOnce(8);
      prisma.notification.groupBy.mockResolvedValue([
        { type: "INFO", _count: { type: 10 } },
        { type: "WARNING", _count: { type: 5 } },
        { type: "SUCCESS", _count: { type: 3 } },
        { type: "ERROR", _count: { type: 2 } },
      ]);

      const result = await repo.getNotificationSummary("user-1");

      expect(result).toEqual({
        total: 20,
        unread: 8,
        read: 12,
        byType: [
          { type: "INFO", count: 10 },
          { type: "WARNING", count: 5 },
          { type: "SUCCESS", count: 3 },
          { type: "ERROR", count: 2 },
        ],
      });
    });

    it("should handle user with no notifications", async () => {
      prisma.notification.count.mockResolvedValueOnce(0).mockResolvedValueOnce(0);
      prisma.notification.groupBy.mockResolvedValue([]);

      const result = await repo.getNotificationSummary("user-99");

      expect(result).toEqual({
        total: 0,
        unread: 0,
        read: 0,
        byType: [],
      });
    });
  });
});