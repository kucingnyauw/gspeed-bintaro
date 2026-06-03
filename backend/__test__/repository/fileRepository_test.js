import prisma from "#app/database.js";
import FileRepository from "#repository/fileRepository.js";

jest.mock("#app/database.js", () => ({
  file: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
}));

jest.mock("#shared/utils/pagination.js", () => ({
  generateMetadata: jest.fn((total, page, limit) => ({
    total,
    currentPage: page,
    itemsPerPage: limit,
    totalPages: Math.ceil(total / limit),
  })),
}));


jest.mock("#shared/utils/pagination.js", () => ({
  create: jest.fn(({ page = 1, limit = 10 } = {}) => ({
    skip: (page - 1) * limit,
    limit,
    metadata: {
      currentPage: page,
      itemsPerPage: limit,
      skip: (page - 1) * limit,
    },
  })),
  generateMetadata: jest.fn((total, page, limit) => ({
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  })),
}));

/**
 * Unit test untuk FileRepository
 * @describe FileRepository
 */
describe("FileRepository", () => {
  let repo;

  beforeEach(() => {
    jest.clearAllMocks();
    repo = new FileRepository();
  });

  /**
   * @describe create
   */
  describe("create", () => {
    it("should create a file with all fields", async () => {
      const input = {
        path: "uploads/receipt-001.jpg",
        fileName: "receipt-001.jpg",
        mimeType: "image/jpeg",
        size: 204800,
        checksum: "abc123def456",
        uploadedById: "user-1",
      };

      const expected = {
        id: "file-1",
        path: "uploads/receipt-001.jpg",
        fileName: "receipt-001.jpg",
        mimeType: "image/jpeg",
        size: 204800,
        checksum: "abc123def456",
        uploadedById: "user-1",
        createdAt: new Date(),
      };

      prisma.file.create.mockResolvedValue(expected);

      const result = await repo.create(input);

      expect(result).toEqual(expected);
      expect(prisma.file.create).toHaveBeenCalledWith({
        data: {
          path: "uploads/receipt-001.jpg",
          fileName: "receipt-001.jpg",
          mimeType: "image/jpeg",
          size: 204800,
          checksum: "abc123def456",
          uploadedById: "user-1",
        },
        select: {
          id: true,
          path: true,
          fileName: true,
          mimeType: true,
          size: true,
          checksum: true,
          uploadedById: true,
          createdAt: true,
        },
      });
    });

    it("should create a file with minimal fields", async () => {
      const input = {
        path: "uploads/doc-001.pdf",
        fileName: "doc-001.pdf",
      };

      prisma.file.create.mockResolvedValue({});

      await repo.create(input);

      expect(prisma.file.create).toHaveBeenCalledWith({
        data: {
          path: "uploads/doc-001.pdf",
          fileName: "doc-001.pdf",
          mimeType: undefined,
          size: undefined,
          checksum: undefined,
          uploadedById: undefined,
        },
        select: expect.any(Object),
      });
    });
  });

  /**
   * @describe findById
   */
  describe("findById", () => {
    it("should return file with uploader when found", async () => {
      const mockFile = {
        id: "file-1",
        path: "uploads/receipt-001.jpg",
        fileName: "receipt-001.jpg",
        uploadedBy: { id: "user-1", fullName: "Kasir 1" },
      };

      prisma.file.findUnique.mockResolvedValue(mockFile);

      const result = await repo.findById("file-1");

      expect(result).toEqual(mockFile);
      expect(prisma.file.findUnique).toHaveBeenCalledWith({
        where: { id: "file-1" },
        include: {
          uploadedBy: { select: { id: true, fullName: true } },
        },
      });
    });

    it("should return null when file not found", async () => {
      prisma.file.findUnique.mockResolvedValue(null);

      const result = await repo.findById("file-99");

      expect(result).toBeNull();
    });
  });

  /**
   * @describe findByChecksum
   */
  describe("findByChecksum", () => {
    it("should return file when checksum found", async () => {
      const mockFile = { id: "file-1", path: "uploads/receipt-001.jpg", checksum: "abc123" };

      prisma.file.findFirst.mockResolvedValue(mockFile);

      const result = await repo.findByChecksum("abc123");

      expect(result).toEqual(mockFile);
      expect(prisma.file.findFirst).toHaveBeenCalledWith({
        where: { checksum: "abc123" },
      });
    });

    it("should return null when checksum not found", async () => {
      prisma.file.findFirst.mockResolvedValue(null);

      const result = await repo.findByChecksum("nonexistent");

      expect(result).toBeNull();
    });
  });

  /**
   * @describe findByPath
   */
  describe("findByPath", () => {
    it("should return file when path found", async () => {
      const mockFile = { id: "file-1", path: "uploads/receipt-001.jpg" };

      prisma.file.findFirst.mockResolvedValue(mockFile);

      const result = await repo.findByPath("uploads/receipt-001.jpg");

      expect(result).toEqual(mockFile);
    });

    it("should return null when path not found", async () => {
      prisma.file.findFirst.mockResolvedValue(null);

      const result = await repo.findByPath("uploads/nonexistent.jpg");

      expect(result).toBeNull();
    });
  });

  /**
   * @describe findMany
   */
  describe("findMany", () => {
    it("should return files with default pagination", async () => {
      const mockData = [
        {
          id: "file-1",
          path: "uploads/receipt-001.jpg",
          fileName: "receipt-001.jpg",
          uploadedById: "user-1",
          createdAt: new Date(),
          uploadedBy: { id: "user-1", fullName: "Kasir 1" },
        },
      ];

      prisma.file.count.mockResolvedValue(1);
      prisma.file.findMany.mockResolvedValue(mockData);

      const result = await repo.findMany({});

      expect(result.data).toEqual(mockData);
      expect(result.data).toHaveLength(1);
      expect(result.metadata.total).toBe(1);
      expect(prisma.file.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 10,
        include: {
          uploadedBy: { select: { id: true, fullName: true } },
        },
        orderBy: { createdAt: "desc" },
      });
    });

    it("should return files filtered by uploadedById", async () => {
      prisma.file.count.mockResolvedValue(3);
      prisma.file.findMany.mockResolvedValue([]);

      await repo.findMany({ uploadedById: "user-1", page: 1, limit: 5 });

      expect(prisma.file.findMany).toHaveBeenCalledWith({
        where: { uploadedById: "user-1" },
        skip: 0,
        take: 5,
        include: expect.any(Object),
        orderBy: { createdAt: "desc" },
      });
    });

    it("should return files filtered by date range", async () => {
      prisma.file.count.mockResolvedValue(10);
      prisma.file.findMany.mockResolvedValue([]);

      await repo.findMany({
        startDate: new Date("2025-01-01"),
        endDate: new Date("2025-06-30"),
      });

      expect(prisma.file.findMany).toHaveBeenCalledWith({
        where: {
          createdAt: {
            gte: new Date("2025-01-01"),
            lte: new Date("2025-06-30"),
          },
        },
        skip: 0,
        take: 10,
        include: expect.any(Object),
        orderBy: { createdAt: "desc" },
      });
    });

    it("should return empty array when no files", async () => {
      prisma.file.count.mockResolvedValue(0);
      prisma.file.findMany.mockResolvedValue([]);

      const result = await repo.findMany({});

      expect(result.data).toEqual([]);
      expect(result.metadata.total).toBe(0);
    });
  });

  /**
   * @describe delete
   */
  describe("delete", () => {
    it("should delete a file by ID", async () => {
      prisma.file.delete.mockResolvedValue({});

      await repo.delete("file-1");

      expect(prisma.file.delete).toHaveBeenCalledWith({
        where: { id: "file-1" },
      });
    });
  });

  /**
   * @describe deleteByPath
   */
  describe("deleteByPath", () => {
    it("should delete a file by path when file exists", async () => {
      prisma.file.findFirst.mockResolvedValue({ id: "file-1" });
      prisma.file.delete.mockResolvedValue({});

      await repo.deleteByPath("uploads/receipt-001.jpg");

      expect(prisma.file.findFirst).toHaveBeenCalledWith({
        where: { path: "uploads/receipt-001.jpg" },
        select: { id: true },
      });
      expect(prisma.file.delete).toHaveBeenCalledWith({
        where: { id: "file-1" },
      });
    });

    it("should do nothing when file not found by path", async () => {
      prisma.file.findFirst.mockResolvedValue(null);

      await repo.deleteByPath("uploads/nonexistent.jpg");

      expect(prisma.file.delete).not.toHaveBeenCalled();
    });
  });
});