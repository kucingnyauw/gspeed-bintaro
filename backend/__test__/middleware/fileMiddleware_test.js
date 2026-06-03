import { fileMiddleware, fileUploadSingle, fileUploadMultiple, fileUploadOptional } from "#middleware/fileMiddleware.js";

// Buat mock function yang bisa diakses dari test
let mockFindByChecksum;

jest.mock("#repository/fileRepository.js", () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    findByChecksum: (...args) => mockFindByChecksum(...args),
  })),
}));

jest.mock("multer", () => {
  const singleHandler = jest.fn((req, res, cb) => cb());
  const arrayHandler = jest.fn((req, res, cb) => cb());
  const mockMulter = jest.fn(() => ({
    single: jest.fn(() => singleHandler),
    array: jest.fn(() => arrayHandler),
  }));
  mockMulter.memoryStorage = jest.fn(() => "mock-storage");
  return { __esModule: true, default: mockMulter };
});

jest.mock("sharp", () => {
  return jest.fn((inputBuffer) => ({
    resize: jest.fn().mockReturnThis(),
    webp: jest.fn().mockReturnThis(),
    toBuffer: jest.fn().mockResolvedValue(
      Buffer.from(inputBuffer ? `processed-${inputBuffer.toString()}` : "processed-webp")
    ),
  }));
});

jest.mock("crypto", () => ({
  ...jest.requireActual("crypto"),
  createHash: jest.fn(() => {
    let dataString = "";
    const hashObj = {
      update: jest.fn((data) => {
        dataString = data ? data.toString() : "";
        return hashObj;
      }),
      digest: jest.fn(() => `mock-checksum-${dataString}`),
    };
    return hashObj;
  }),
}));

jest.mock("#shared/constant/constants.js", () => ({
  MAX_FILE_SIZE: { IMAGE: 10485760, VIDEO: 52428800, DOCUMENT: 20971520 },
  FILE_MIME: {
    IMAGE: ["image/jpeg", "image/png", "image/webp"],
    VIDEO: ["video/mp4", "video/mpeg"],
    DOCUMENT: ["application/pdf", "application/msword"],
  },
}));

describe("File Middleware", () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();
    mockFindByChecksum = jest.fn().mockResolvedValue(null);
    req = {};
    res = {};
    next = jest.fn();
  });

  // ============================================================
  // fileMiddleware (single)
  // ============================================================
  describe("fileMiddleware (single)", () => {
    it("should throw bad request when file is empty", async () => {
      const [upload, handler] = fileMiddleware({ field: "file" });
      upload(req, res, () => {});
      await handler(req, res, next);
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 400,
          message: "File tidak boleh kosong",
        })
      );
    });

    it("should process image file and add to req.asset", async () => {
      const [upload, handler] = fileMiddleware({ field: "file" });
      upload(req, res, () => {});
      req.file = {
        fieldname: "file",
        originalname: "test.jpg",
        mimetype: "image/jpeg",
        buffer: Buffer.from("test"),
        size: 1024,
      };
      await handler(req, res, next);
      expect(req.asset.mimetype).toBe("image/webp");
      expect(req.asset.originalname).toBe("test.webp");
      expect(req.asset.checksum).toBe("mock-checksum-processed-test");
      expect(next).toHaveBeenCalledWith();
    });

    it("should process video file without conversion", async () => {
      const [upload, handler] = fileMiddleware({ field: "file" });
      upload(req, res, () => {});
      req.file = {
        fieldname: "file",
        originalname: "test.mp4",
        mimetype: "video/mp4",
        buffer: Buffer.from("video-data"),
        size: 1024,
      };
      await handler(req, res, next);
      expect(req.asset.mimetype).toBe("video/mp4");
      expect(req.asset.originalname).toBe("test.mp4");
      expect(req.asset.checksum).toBe("mock-checksum-video-data");
      expect(next).toHaveBeenCalledWith();
    });

    it("should process document file without conversion", async () => {
      const [upload, handler] = fileMiddleware({ field: "file" });
      upload(req, res, () => {});
      req.file = {
        fieldname: "file",
        originalname: "test.pdf",
        mimetype: "application/pdf",
        buffer: Buffer.from("pdf-data"),
        size: 1024,
      };
      await handler(req, res, next);
      expect(req.asset.mimetype).toBe("application/pdf");
      expect(req.asset.originalname).toBe("test.pdf");
      expect(req.asset.checksum).toBe("mock-checksum-pdf-data");
      expect(next).toHaveBeenCalledWith();
    });

    it("should throw bad request when image size exceeds limit", async () => {
      const [upload, handler] = fileMiddleware({ field: "file" });
      upload(req, res, () => {});
      req.file = {
        fieldname: "file",
        originalname: "large.jpg",
        mimetype: "image/jpeg",
        buffer: Buffer.alloc(11534336), // > 10MB
        size: 11534336,
      };
      await handler(req, res, next);
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 400 })
      );
    });

    it("should throw bad request when video size exceeds limit", async () => {
      const [upload, handler] = fileMiddleware({ field: "file" });
      upload(req, res, () => {});
      req.file = {
        fieldname: "file",
        originalname: "large.mp4",
        mimetype: "video/mp4",
        buffer: Buffer.alloc(55000000), // > 50MB
        size: 55000000,
      };
      await handler(req, res, next);
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 400 })
      );
    });

    it("should throw bad request when document size exceeds limit", async () => {
      const [upload, handler] = fileMiddleware({ field: "file" });
      upload(req, res, () => {});
      req.file = {
        fieldname: "file",
        originalname: "large.pdf",
        mimetype: "application/pdf",
        buffer: Buffer.alloc(25000000), // > 20MB
        size: 25000000,
      };
      await handler(req, res, next);
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 400 })
      );
    });

    it("should throw bad request for unsupported file format", async () => {
      const [upload, handler] = fileMiddleware({ field: "file" });
      upload(req, res, () => {});
      req.file = {
        fieldname: "file",
        originalname: "test.exe",
        mimetype: "application/x-msdownload",
        buffer: Buffer.from("test"),
        size: 1024,
      };
      await handler(req, res, next);
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 400,
          message: "Format file tidak didukung",
        })
      );
    });

    it("should throw conflict when file is duplicate", async () => {
      mockFindByChecksum = jest.fn().mockResolvedValue({ id: "file-1" });
      const [upload, handler] = fileMiddleware({ field: "file" });
      upload(req, res, () => {});
      req.file = {
        fieldname: "file",
        originalname: "test.jpg",
        mimetype: "image/jpeg",
        buffer: Buffer.from("test"),
        size: 1024,
      };
      await handler(req, res, next);
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 409,
          message: "File sudah pernah diunggah sebelumnya",
        })
      );
    });

    it("should skip duplicate check when skipDuplicateCheck is true", async () => {
      const [upload, handler] = fileMiddleware({
        field: "file",
        skipDuplicateCheck: true,
      });
      upload(req, res, () => {});
      req.file = {
        fieldname: "file",
        originalname: "test.jpg",
        mimetype: "image/jpeg",
        buffer: Buffer.from("test"),
        size: 1024,
      };
      await handler(req, res, next);
      expect(req.asset).toBeDefined();
      expect(mockFindByChecksum).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith();
    });

    it("should handle file without originalname", async () => {
      const [upload, handler] = fileMiddleware({ field: "file" });
      upload(req, res, () => {});
      req.file = {
        fieldname: "file",
        originalname: undefined,
        mimetype: "image/jpeg",
        buffer: Buffer.from("test"),
        size: 1024,
      };
      await handler(req, res, next);
      expect(req.asset).toBeDefined();
      expect(req.asset.originalname).toMatch(/\.webp$/);
      expect(next).toHaveBeenCalledWith();
    });
  });

  // ============================================================
  // fileMiddleware (multiple)
  // ============================================================
  describe("fileMiddleware (multiple)", () => {
    it("should throw bad request when files are empty", async () => {
      const [upload, handler] = fileMiddleware({
        field: "files",
        multiple: true,
      });
      upload(req, res, () => {});
      await handler(req, res, next);
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 400,
          message: "File tidak boleh kosong",
        })
      );
    });

    it("should process multiple files and add to req.assets", async () => {
      const [upload, handler] = fileMiddleware({
        field: "files",
        multiple: true,
      });
      upload(req, res, () => {});
      req.files = [
        {
          fieldname: "files",
          originalname: "a.jpg",
          mimetype: "image/jpeg",
          buffer: Buffer.from("a"),
          size: 1024,
        },
        {
          fieldname: "files",
          originalname: "b.jpg",
          mimetype: "image/jpeg",
          buffer: Buffer.from("b"),
          size: 2048,
        },
      ];
      await handler(req, res, next);
      expect(req.assets).toBeDefined();
      expect(req.assets).toHaveLength(2);
      expect(req.assets[0].mimetype).toBe("image/webp");
      expect(req.assets[1].mimetype).toBe("image/webp");
      expect(next).toHaveBeenCalledWith();
    });

    it("should throw bad request for duplicate files in one request", async () => {
      const [upload, handler] = fileMiddleware({
        field: "files",
        multiple: true,
      });
      upload(req, res, () => {});
      req.files = [
        {
          fieldname: "files",
          originalname: "a.jpg",
          mimetype: "image/jpeg",
          buffer: Buffer.from("same"),
          size: 1024,
        },
        {
          fieldname: "files",
          originalname: "b.jpg",
          mimetype: "image/jpeg",
          buffer: Buffer.from("same"),
          size: 1024,
        },
      ];
      await handler(req, res, next);
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 400,
          message: "Terdapat file duplikat dalam satu request",
        })
      );
    });

    it("should skip duplicate check when skipDuplicateCheck is true for multiple", async () => {
      const [upload, handler] = fileMiddleware({
        field: "files",
        multiple: true,
        skipDuplicateCheck: true,
      });
      upload(req, res, () => {});
      req.files = [
        {
          fieldname: "files",
          originalname: "a.jpg",
          mimetype: "image/jpeg",
          buffer: Buffer.from("a"),
          size: 1024,
        },
        {
          fieldname: "files",
          originalname: "b.jpg",
          mimetype: "image/jpeg",
          buffer: Buffer.from("b"),
          size: 2048,
        },
      ];
      await handler(req, res, next);
      expect(req.assets).toBeDefined();
      expect(req.assets).toHaveLength(2);
      expect(mockFindByChecksum).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith();
    });
  });

  // ============================================================
  // fileUploadSingle
  // ============================================================
  describe("fileUploadSingle", () => {
    it("should create single upload middleware with default field", () => {
      const middleware = fileUploadSingle();
      expect(middleware).toHaveLength(2);
    });

    it("should create single upload middleware with custom field", () => {
      const middleware = fileUploadSingle("image");
      expect(middleware).toHaveLength(2);
    });
  });

  // ============================================================
  // fileUploadMultiple
  // ============================================================
  describe("fileUploadMultiple", () => {
    it("should create multiple upload middleware with default field", () => {
      const middleware = fileUploadMultiple();
      expect(middleware).toHaveLength(2);
    });

    it("should create multiple upload middleware with custom field and maxCount", () => {
      const middleware = fileUploadMultiple("photos", 10);
      expect(middleware).toHaveLength(2);
    });
  });

  // ============================================================
  // fileUploadOptional
  // ============================================================
  describe("fileUploadOptional", () => {
    it("should set req.asset to null when no file provided", async () => {
      const [upload, handler] = fileUploadOptional("file");
      upload(req, res, () => {});
      await handler(req, res, next);
      expect(req.asset).toBeNull();
      expect(next).toHaveBeenCalledWith();
    });

    it("should process file when provided", async () => {
      const [upload, handler] = fileUploadOptional("file");
      upload(req, res, () => {});
      req.file = {
        fieldname: "file",
        originalname: "test.jpg",
        mimetype: "image/jpeg",
        buffer: Buffer.from("test"),
        size: 1024,
      };
      await handler(req, res, next);
      expect(req.asset).toBeDefined();
      expect(req.asset.checksum).toBe("mock-checksum-processed-test");
      expect(next).toHaveBeenCalledWith();
    });

    it("should throw conflict when duplicate file in optional upload", async () => {
      mockFindByChecksum = jest.fn().mockResolvedValue({ id: "file-1" });
      const [upload, handler] = fileUploadOptional("file");
      upload(req, res, () => {});
      req.file = {
        fieldname: "file",
        originalname: "test.jpg",
        mimetype: "image/jpeg",
        buffer: Buffer.from("test"),
        size: 1024,
      };
      await handler(req, res, next);
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 409 })
      );
    });

    it("should handle missing file gracefully", async () => {
      const [upload, handler] = fileUploadOptional("file");
      upload(req, res, () => {});
      await handler(req, res, next);
      expect(req.asset).toBeNull();
      expect(next).toHaveBeenCalledWith();
    });
  });
});