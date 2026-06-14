import prisma from "#app/database.js";
import Pagination from "#shared/utils/pagination.js";

class ProductRepository {
  #defaultSelect = {
    id: true,
    name: true,
    sku: true,
    type: true,
    description: true,
    price: true,
    cost: true,
    stock: true,
    isActive: true,
    createdAt: true,
    updatedAt: true,
  };

  #fullSelect = {
    ...this.#defaultSelect,
    image: {
      select: {
        id: true,
        fileName: true,
        path: true,
      },
    },
    priceHistory: {
      select: {
        id: true,
        price: true,
        cost: true,
        effectiveFrom: true,
      },
      orderBy: {
        effectiveFrom: "desc",
      },
      take: 10,
    },
  };

  #listSelect = {
    id: true,
    name: true,
    sku: true,
    type: true,
    description: true,
    price: true,
    cost: true,
    stock: true,
    isActive: true,
    createdAt: true,
    updatedAt: true,
    image: {
      select: {
        id: true,
        path: true,
      },
    },
    _count: {
      select: {
        orderItems: true,
        movements: true,
      },
    },
  };

  /**
   * Membuat produk baru
   * @param {Object} data - Data produk
   * @param {string} data.name - Nama produk
   * @param {string} data.sku - Kode SKU
   * @param {string} [data.type="SPAREPART"] - Tipe produk
   * @param {string} [data.description] - Deskripsi
   * @param {number} data.price - Harga jual
   * @param {number} [data.cost=0] - Harga modal
   * @param {number} [data.stock=0] - Stok awal
   * @param {string} [data.imageId] - ID file gambar
   * @returns {Promise<Object>} Produk yang berhasil dibuat
   */
  async create(data) {
    return prisma.product.create({
      data: {
        name: data.name,
        sku: data.sku,
        type: data.type || "SPAREPART",
        description: data.description,
        price: data.price,
        cost: data.cost || 0,
        stock: data.stock || 0,
        isActive: true,
        imageId: data.imageId,
      },
      select: this.#fullSelect,
    });
  }

  /**
   * Mencari produk berdasarkan ID dengan relasi lengkap
   * @param {string} id - ID produk
   * @returns {Promise<Object|null>} Data produk atau null jika tidak ditemukan
   */
  async findById(id) {
    return prisma.product.findUnique({
      where: { id },
      select: this.#fullSelect,
    });
  }

  /**
   * Mencari produk berdasarkan SKU dengan relasi lengkap
   * @param {string} sku - Kode SKU produk
   * @returns {Promise<Object|null>} Data produk atau null jika tidak ditemukan
   */
  async findBySku(sku) {
    return prisma.product.findUnique({
      where: { sku },
      select: this.#fullSelect,
    });
  }

  /**
   * Mencari daftar produk dengan filter, sorting, dan pagination
   * @param {Object} [query={}] - Parameter query
   * @param {number} [query.page=1] - Nomor halaman
   * @param {number} [query.limit=10] - Jumlah item per halaman
   * @param {string} [query.search] - Pencarian berdasarkan nama, SKU, atau deskripsi
   * @param {string} [query.type] - Filter berdasarkan tipe (SPAREPART/SERVICE)
   * @param {boolean|string} [query.isActive] - Filter status aktif
   * @param {number|string} [query.lowStockThreshold] - Filter stok rendah (hanya SPAREPART)
   * @param {number|string} [query.minPrice] - Filter harga minimum
   * @param {number|string} [query.maxPrice] - Filter harga maksimum
   * @param {string} [query.sortBy] - Field sorting (name/price/stock/createdAt)
   * @param {string} [query.sortOrder] - Arah sorting (asc/desc)
   * @returns {Promise<{data: Array, metadata: Object}>} Data produk dan metadata pagination
   *
   * @example
   * // Semua produk aktif
   * await productRepo.findMany({ isActive: true });
   *
   * @example
   * // Cari sparepart dengan stok rendah
   * await productRepo.findMany({ type: "SPAREPART", lowStockThreshold: 5 });
   *
   * @example
   * // Cari berdasarkan nama
   * await productRepo.findMany({ search: "kampas rem" });
   *
   * @example
   * // Filter harga dan sorting
   * await productRepo.findMany({ minPrice: 50000, maxPrice: 200000, sortBy: "price", sortOrder: "asc" });
   */
  async findMany(query = {}) {
    const limit = query.limit || 10;
    const skip = ((query.page || 1) - 1) * limit;
    const where = {};

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: "insensitive" } },
        { sku: { contains: query.search, mode: "insensitive" } },
        { description: { contains: query.search, mode: "insensitive" } },
      ];
    }

    if (query.type) {
      where.type = query.type;
    }

    if (query.isActive !== undefined) {
      where.isActive = query.isActive === "true" || query.isActive === true;
    }

    if (query.lowStockThreshold) {
      where.type = "SPAREPART";
      where.stock = { lte: parseInt(query.lowStockThreshold) };
    }

    if (query.minPrice || query.maxPrice) {
      where.price = {};
      if (query.minPrice) where.price.gte = parseInt(query.minPrice);
      if (query.maxPrice) where.price.lte = parseInt(query.maxPrice);
    }

    const validSortFields = ["name", "price", "stock", "createdAt"];
    const sortBy = validSortFields.includes(query.sortBy) ? query.sortBy : "createdAt";
    const sortOrder = query.sortOrder === "asc" ? "asc" : "desc";

    const [total, data] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        select: this.#listSelect,
        orderBy: { [sortBy]: sortOrder },
      }),
    ]);

    return {
      data,
      metadata: Pagination.generateMetadata(total, query.page || 1, limit),
    };
  }

  /**
   * Mengupdate data produk
   * @param {string} id - ID produk
   * @param {Object} data - Data yang akan diupdate (partial)
   * @param {string} [data.name] - Nama baru
   * @param {string} [data.description] - Deskripsi baru
   * @param {string} [data.type] - Tipe baru
   * @param {number} [data.price] - Harga jual baru
   * @param {number} [data.cost] - Harga modal baru
   * @param {number} [data.stock] - Stok baru
   * @param {boolean} [data.isActive] - Status aktif baru
   * @param {string} [data.imageId] - ID gambar baru
   * @returns {Promise<Object>} Produk yang sudah diupdate dengan relasi lengkap
   */
  async update(id, data) {
    return prisma.product.update({
      where: { id },
      data,
      select: this.#fullSelect,
    });
  }

  /**
   * Mengupdate status aktif produk
   * @param {string} id - ID produk
   * @param {boolean} isActive - Status aktif baru
   * @returns {Promise<Object>} Produk dengan status terbaru
   */
  async updateStatus(id, isActive) {
    return prisma.product.update({
      where: { id },
      data: { isActive },
      select: {
        id: true,
        name: true,
        sku: true,
        isActive: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Menonaktifkan produk (soft delete)
   * @param {string} id - ID produk
   * @returns {Promise<Object>} Produk yang sudah dinonaktifkan
   */
  async deactivate(id) {
    return prisma.product.update({
      where: { id },
      data: { isActive: false },
      select: {
        id: true,
        name: true,
        sku: true,
        isActive: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Mengaktifkan kembali produk yang dinonaktifkan
   * @param {string} id - ID produk
   * @returns {Promise<Object>} Produk yang sudah diaktifkan
   */
  async activate(id) {
    return prisma.product.update({
      where: { id },
      data: { isActive: true },
      select: {
        id: true,
        name: true,
        sku: true,
        isActive: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Mengupdate stok produk secara atomic (increment/decrement)
   * @param {string} id - ID produk
   * @param {number} quantity - Jumlah perubahan
   * @param {boolean} [increment=true] - true untuk tambah stok, false untuk kurang
   * @returns {Promise<Object>} Produk dengan stok terbaru
   */
  async updateStock(id, quantity, increment = true) {
    return prisma.product.update({
      where: { id },
      data: {
        stock: increment ? { increment: quantity } : { decrement: quantity },
      },
      select: {
        id: true,
        name: true,
        sku: true,
        stock: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Mengecek apakah SKU sudah digunakan oleh produk lain
   * @param {string} sku - SKU yang akan dicek
   * @param {string} [excludeId] - ID produk yang dikecualikan (untuk update)
   * @returns {Promise<boolean>} true jika SKU sudah ada
   */
  async isSkuExists(sku, excludeId = null) {
    const where = { sku };
    if (excludeId) where.id = { not: excludeId };

    const product = await prisma.product.findFirst({
      where,
      select: { id: true },
    });

    return !!product;
  }

  /**
   * Mengecek apakah produk memiliki relasi data (order items atau stock movements)
   * @param {string} id - ID produk
   * @returns {Promise<boolean>} true jika produk memiliki relasi
   */
  async hasRelations(id) {
    const product = await prisma.product.findUnique({
      where: { id },
      select: {
        _count: {
          select: {
            orderItems: true,
            movements: true,
          },
        },
      },
    });

    if (!product) return false;
    return product._count.orderItems > 0 || product._count.movements > 0;
  }

  /**
   * Mendapatkan produk dengan stok rendah
   * @param {number} [threshold=5] - Batas threshold stok rendah
   * @returns {Promise<Array>} Daftar produk sparepart dengan stok di bawah threshold
   */
  async getLowStockProducts(threshold = 5) {
    return prisma.product.findMany({
      where: {
        type: "SPAREPART",
        stock: { lte: threshold },
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        sku: true,
        stock: true,
        price: true,
        cost: true,
      },
      orderBy: { stock: "asc" },
    });
  }

  /**
   * Mencatat riwayat perubahan harga produk
   * @param {string} productId - ID produk
   * @param {number} price - Harga jual baru
   * @param {number} cost - Harga modal baru
   * @returns {Promise<void>}
   */
  async createPriceHistory(productId, price, cost) {
    await prisma.productPriceHistory.create({
      data: {
        productId,
        price,
        cost,
        effectiveFrom: new Date(),
      },
    });
  }

  /**
   * Mencari produk service yang aktif
   * @param {Object} [query={}] - Parameter query
   * @param {boolean} [query.isActive=true] - Filter status aktif
   * @returns {Promise<Array>} Daftar produk service
   */
  async findServices(query = {}) {
    const where = {
      type: "SERVICE",
      isActive: query.isActive !== undefined ? query.isActive : true,
    };

    return prisma.product.findMany({
      where,
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        cost: true,
      },
      orderBy: { name: "asc" },
    });
  }

  /**
   * Mencari produk sparepart yang aktif
   * @param {Object} [query={}] - Parameter query
   * @param {boolean} [query.inStockOnly=false] - Hanya produk dengan stok tersedia
   * @param {boolean} [query.isActive=true] - Filter status aktif
   * @returns {Promise<Array>} Daftar produk sparepart
   */
  async findSpareparts(query = {}) {
    const where = {
      type: "SPAREPART",
      isActive: query.isActive !== undefined ? query.isActive : true,
    };

    if (query.inStockOnly) {
      where.stock = { gt: 0 };
    }

    return prisma.product.findMany({
      where,
      select: {
        id: true,
        name: true,
        sku: true,
        price: true,
        cost: true,
        stock: true,
        image: {
          select: {
            id: true,
            path: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });
  }

  /**
   * Menonaktifkan banyak produk sekaligus dengan partial success
   * @param {string[]} ids - Array ID produk yang akan dinonaktifkan
   * @returns {Promise<{success: string[], failed: Array<{id: string, error: string}>}>}
   */
  async deactivateMany(ids) {
    const results = { success: [], failed: [] };
    const batchSize = 10;

    for (let i = 0; i < ids.length; i += batchSize) {
      const batch = ids.slice(i, i + batchSize);

      try {
        await prisma.product.updateMany({
          where: { id: { in: batch } },
          data: { isActive: false, updatedAt: new Date() },
        });
        results.success.push(...batch);
      } catch (error) {
        for (const id of batch) {
          try {
            await prisma.product.update({
              where: { id },
              data: { isActive: false, updatedAt: new Date() },
            });
            results.success.push(id);
          } catch (individualError) {
            results.failed.push({ id, error: individualError.message });
          }
        }
      }
    }

    return results;
  }

  /**
   * Mengaktifkan banyak produk sekaligus dengan partial success
   * @param {string[]} ids - Array ID produk yang akan diaktifkan
   * @returns {Promise<{success: string[], failed: Array<{id: string, error: string}>}>}
   */
  async activateMany(ids) {
    const results = { success: [], failed: [] };
    const batchSize = 10;

    for (let i = 0; i < ids.length; i += batchSize) {
      const batch = ids.slice(i, i + batchSize);

      try {
        await prisma.product.updateMany({
          where: { id: { in: batch } },
          data: { isActive: true, updatedAt: new Date() },
        });
        results.success.push(...batch);
      } catch (error) {
        for (const id of batch) {
          try {
            await prisma.product.update({
              where: { id },
              data: { isActive: true, updatedAt: new Date() },
            });
            results.success.push(id);
          } catch (individualError) {
            results.failed.push({ id, error: individualError.message });
          }
        }
      }
    }

    return results;
  }
}

export default ProductRepository;