import CustomerRepository from "#repository/customerRepository.js";
import ApiError from "#shared/utils/error.js";
import logger from "#app/logger.js";

/**
 * Service untuk mengelola logika bisnis pelanggan
 * @class CustomerService
 */
class CustomerService {
  constructor() {
    this.customerRepo = new CustomerRepository();
  }

  /**
   * Membuat pelanggan baru beserta kendaraannya
   * @param {Object} payload - Data pelanggan
   * @param {string} payload.name - Nama pelanggan
   * @param {string} [payload.phone] - Nomor telepon
   * @param {Array} [payload.vehicles] - Data kendaraan
   * @returns {Promise<Object>} Data pelanggan yang berhasil dibuat
   * @throws {ApiError} 409 - Nomor telepon sudah digunakan
   */

  async createCustomer(payload) {
    const { name, phone, vehicle } = payload;

    if (phone) {
      const isPhoneUsed = await this.customerRepo.isPhoneExists(phone);
      if (isPhoneUsed) {
        throw ApiError.conflict({
          message: `Gagal membuat pelanggan. Nomor telepon '${phone}' sudah digunakan.`,
        });
      }
    }

    if (vehicle) {
      const isPlateUsed = await this.customerRepo.isPlateNumberExists(
        vehicle.plateNumber
      );
      if (isPlateUsed) {
        throw ApiError.conflict({
          message: `Gagal membuat pelanggan. Plat nomor '${vehicle.plateNumber}' sudah terdaftar.`,
        });
      }
    }

    const customer = await this.customerRepo.create({ name, phone, vehicle });

    logger.info("Pelanggan berhasil dibuat", {
      customerId: customer.id,
      name: customer.name,
      phone: customer.phone,
      hasVehicle: !!vehicle,
    });

    return customer;
  }

  /**
   * Membuat atau mengupdate pelanggan berdasarkan nomor telepon (upsert)
   * @param {Object} payload - Data pelanggan
   * @param {string} payload.name - Nama pelanggan
   * @param {string} payload.phone - Nomor telepon
   * @returns {Promise<Object>} Data pelanggan
   */
  async upsertCustomer(payload) {
    const { name, phone } = payload;
    const existingCustomer = await this.customerRepo.findByPhone(phone);
    const customer = await this.customerRepo.upsert({ name, phone });

    if (existingCustomer) {
      logger.info("Pelanggan berhasil diperbarui (upsert)", {
        customerId: customer.id,
        name: customer.name,
        phone: customer.phone,
      });
    } else {
      logger.info("Pelanggan berhasil dibuat (upsert)", {
        customerId: customer.id,
        name: customer.name,
        phone: customer.phone,
      });
    }

    return customer;
  }

  /**
   * Mendapatkan pelanggan berdasarkan ID
   * @param {string} customerId - ID pelanggan
   * @returns {Promise<Object>} Data pelanggan
   * @throws {ApiError} 404 - Pelanggan tidak ditemukan
   */
  async getCustomerById(customerId) {
    const customer = await this.customerRepo.findById(customerId);

    if (!customer) {
      throw ApiError.notFound({
        message: `Pelanggan dengan ID '${customerId}' tidak ditemukan.`,
      });
    }

    return customer;
  }

  /**
   * Mendapatkan pelanggan berdasarkan nomor telepon
   * @param {string} phone - Nomor telepon
   * @returns {Promise<Object>} Data pelanggan
   * @throws {ApiError} 404 - Pelanggan tidak ditemukan
   */
  async getCustomerByPhone(phone) {
    const customer = await this.customerRepo.findByPhone(phone);

    if (!customer) {
      throw ApiError.notFound({
        message: `Pelanggan dengan nomor telepon '${phone}' tidak ditemukan.`,
      });
    }

    return customer;
  }

  /**
   * Mendapatkan daftar pelanggan dengan paginasi dan filter
   * @param {Object} [query={}] - Parameter query
   * @param {number} [query.page] - Nomor halaman
   * @param {number} [query.limit] - Jumlah item per halaman
   * @param {string} [query.search] - Kata kunci pencarian
   * @returns {Promise<{data: Array, metadata: Object}>} Daftar pelanggan
   */
  async getCustomers(query = {}) {
    const result = await this.customerRepo.findMany(query);

    logger.info("Mengambil daftar pelanggan", {
      total: result.metadata.total,
      page: result.metadata.currentPage,
    });

    return result;
  }

  /**
   * Memperbarui data pelanggan
   * @param {string} customerId - ID pelanggan
   * @param {Object} payload - Data yang akan diupdate
   * @param {string} [payload.name] - Nama baru
   * @param {string} [payload.phone] - Nomor telepon baru
   * @returns {Promise<Object>} Data pelanggan yang diupdate
   * @throws {ApiError} 404 - Pelanggan tidak ditemukan
   * @throws {ApiError} 409 - Nomor telepon sudah digunakan
   */
  async updateCustomer(customerId, payload) {
    const existingCustomer = await this.customerRepo.findById(customerId);
    if (!existingCustomer) {
      throw ApiError.notFound({
        message: `Gagal memperbarui. Pelanggan dengan ID '${customerId}' tidak ditemukan.`,
      });
    }

    if (payload.phone) {
      const isPhoneUsed = await this.customerRepo.isPhoneExists(
        payload.phone,
        customerId
      );
      if (isPhoneUsed) {
        throw ApiError.conflict({
          message: `Gagal memperbarui. Nomor telepon '${payload.phone}' sudah digunakan oleh pelanggan lain.`,
        });
      }
    }

    const updatedCustomer = await this.customerRepo.update(customerId, payload);

    logger.info("Pelanggan berhasil diperbarui", {
      customerId,
      previousName: existingCustomer.name,
      newName: updatedCustomer.name,
    });

    return updatedCustomer;
  }

  /**
   * Menghapus pelanggan beserta kendaraannya
   * @param {string} customerId - ID pelanggan
   * @returns {Promise<void>}
   * @throws {ApiError} 404 - Pelanggan tidak ditemukan
   * @throws {ApiError} 400 - Pelanggan masih memiliki transaksi
   */
  async deleteCustomer(customerId) {
    const existingCustomer = await this.customerRepo.findById(customerId);
    if (!existingCustomer) {
      throw ApiError.notFound({
        message: `Gagal menghapus. Pelanggan dengan ID '${customerId}' tidak ditemukan.`,
      });
    }

    const hasOrders = await this.customerRepo.hasOrders(customerId);
    if (hasOrders) {
      throw ApiError.badRequest({
        message: `Gagal menghapus. Pelanggan '${existingCustomer.name}' masih memiliki riwayat transaksi. Transaksi akan tetap ada tanpa pelanggan.`,
      });
    }

    await this.customerRepo.delete(customerId);

    logger.info("Pelanggan berhasil dihapus", {
      customerId,
      name: existingCustomer.name,
      phone: existingCustomer.phone,
    });
  }

  /**
   * Mengecek ketersediaan nomor telepon
   * @param {string} phone - Nomor telepon
   * @param {string} [excludeId] - ID pelanggan yang dikecualikan
   * @returns {Promise<{available: boolean, message: string}>} Status ketersediaan
   */
  async checkPhoneAvailability(phone, excludeId = null) {
    const isExists = await this.customerRepo.isPhoneExists(phone, excludeId);

    return {
      available: !isExists,
      message: isExists
        ? `Nomor telepon '${phone}' sudah terdaftar.`
        : `Nomor telepon '${phone}' tersedia.`,
    };
  }

  /**
   * Menghapus banyak pelanggan sekaligus beserta kendaraannya
   * @param {string[]} customerIds - Array ID pelanggan
   * @returns {Promise<{summary: Object, details: Object}>} Ringkasan dan detail hasil penghapusan
   * @throws {ApiError} 400 - Tidak ada pelanggan yang dipilih atau valid
   */
  async deleteCustomers(customerIds) {
    if (!customerIds || customerIds.length === 0) {
      throw ApiError.badRequest({
        message: "Gagal menghapus. Tidak ada pelanggan yang dipilih.",
      });
    }

    const validationResults = { valid: [], invalid: [] };

    for (const id of customerIds) {
      const customer = await this.customerRepo.findById(id);

      if (!customer) {
        validationResults.invalid.push({
          id,
          reason: `Pelanggan dengan ID '${id}' tidak ditemukan.`,
        });
        continue;
      }

      validationResults.valid.push(id);
    }

    if (validationResults.valid.length === 0) {
      throw ApiError.badRequest({
        message:
          "Gagal menghapus. Tidak ada pelanggan yang memenuhi syarat untuk dihapus.",
        details: validationResults.invalid,
      });
    }

    const deleteResults = await this.customerRepo.deleteMany(
      validationResults.valid
    );

    const summary = {
      total: customerIds.length,
      valid: validationResults.valid.length,
      skipped: validationResults.invalid.length,
      deleted: deleteResults.success.length,
      failed: deleteResults.failed.length,
    };

    logger.info("Bulk delete pelanggan selesai", {
      summary,
      invalidItems: validationResults.invalid,
      failedDeletes: deleteResults.failed,
    });

    return {
      summary,
      details: {
        deleted: deleteResults.success,
        failed: deleteResults.failed,
        skipped: validationResults.invalid,
      },
    };
  }
}

export default CustomerService;
