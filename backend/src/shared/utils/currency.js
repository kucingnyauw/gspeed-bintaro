import ApiError from "#shared/utils/error.js";

class Currency {
  /**
   * Mengkonversi angka ke format mata uang Rupiah (IDR)
   * @param {number|string|null|undefined} amount - Jumlah yang akan dikonversi
   * @returns {string} String format mata uang Rupiah
   * @throws {ApiError} Jika nilai amount tidak valid
   * @example
   * Currency.toIDR(100000); // "Rp 100.000"
   * Currency.toIDR("50000"); // "Rp 50.000"
   * Currency.toIDR(null); // "Rp 0"
   */
  static toIDR(amount) {
    try {
      if (amount === null || amount === undefined) {
        return "Rp 0";
      }

      const value = Number(amount);

      if (Number.isNaN(value)) {
        throw ApiError.badRequest({
          message: "Jumlah yang dimasukkan tidak valid untuk format mata uang.",
          code: "CURRENCY_INVALID_AMOUNT",
          details: { amount, type: typeof amount },
        });
      }

      return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      
      throw ApiError.internal({
        message: "Gagal mengkonversi ke format mata uang Rupiah.",
        code: "CURRENCY_CONVERSION_ERROR",
        details: { amount, error: error.message },
      });
    }
  }

  /**
   * Mengkonversi string format mata uang kembali ke number
   * @param {string|number} formatted - String format mata uang yang akan dikonversi
   * @returns {number} Nilai numerik dari format mata uang
   * @throws {ApiError} Jika format input tidak valid atau gagal dikonversi
   * @example
   * Currency.toNumber("Rp 100.000"); // 100000
   * Currency.toNumber("Rp 50.000,00"); // 50000
   * Currency.toNumber(75000); // 75000
   */
  static toNumber(formatted) {
    try {
      if (typeof formatted === "number") {
        if (Number.isNaN(formatted)) {
          throw ApiError.badRequest({
            message: "Nilai numerik tidak valid (NaN).",
            code: "CURRENCY_INVALID_NUMBER",
            details: { formatted },
          });
        }
        return formatted;
      }

      if (!formatted || typeof formatted !== "string") {
        throw ApiError.badRequest({
          message: "Format mata uang tidak valid. Pastikan input berupa teks yang benar.",
          code: "CURRENCY_INVALID_FORMAT",
          details: { formatted, type: typeof formatted },
        });
      }

      const parsed = Number(
        formatted.replace(/[^0-9,-]+/g, "").replace(",", ".")
      );

      if (Number.isNaN(parsed)) {
        throw ApiError.badRequest({
          message: "Gagal mengonversi mata uang. Format tidak dikenali.",
          code: "CURRENCY_PARSE_ERROR",
          details: { formatted },
        });
      }

      return parsed;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      
      throw ApiError.internal({
        message: "Terjadi kesalahan saat mengkonversi mata uang ke number.",
        code: "CURRENCY_TO_NUMBER_ERROR",
        details: { formatted, error: error.message },
      });
    }
  }

  /**
   * Memformat angka ke string dengan separator ribuan (tanpa simbol mata uang)
   * @param {number|string|null|undefined} amount - Nilai yang akan diformat
   * @returns {number|string} Angka yang sudah diformat dengan separator, atau 0 jika null/undefined
   * @throws {ApiError} Jika nilai amount tidak valid
   * @example
   * Currency.formatPlain(100000); // "100.000"
   * Currency.formatPlain("50000"); // "50.000"
   * Currency.formatPlain(null); // 0
   */
  static formatPlain(amount) {
    try {
      if (amount === null || amount === undefined) return 0;

      const value = Number(amount);

      if (Number.isNaN(value)) {
        throw ApiError.badRequest({
          message: "Nilai angka tidak valid untuk diformat.",
          code: "CURRENCY_INVALID_PLAIN_FORMAT",
          details: { amount, type: typeof amount },
        });
      }

      return new Intl.NumberFormat("id-ID").format(value);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      
      throw ApiError.internal({
        message: "Gagal memformat angka dengan separator.",
        code: "CURRENCY_PLAIN_FORMAT_ERROR",
        details: { amount, error: error.message },
      });
    }
  }

  /**
   * Memformat angka ke format Rupiah singkat (contoh: 1,5Rb, 2,3Jt, 1M)
   * @param {number|string} amount - Jumlah yang akan diformat
   * @returns {string} Format Rupiah singkat
   * @throws {ApiError} Jika nilai amount tidak valid
   * @example
   * Currency.toShortIDR(1500); // "Rp 1,5Rb"
   * Currency.toShortIDR(2300000); // "Rp 2,3Jt"
   * Currency.toShortIDR(1000000); // "Rp 1Jt"
   */
  static toShortIDR(amount) {
    try {
      const value = Number(amount);

      if (Number.isNaN(value)) {
        throw ApiError.badRequest({
          message: "Jumlah tidak valid untuk format mata uang singkat.",
          code: "CURRENCY_INVALID_SHORT_FORMAT",
          details: { amount, type: typeof amount },
        });
      }

      if (value >= 1000000000) {
        return `Rp ${(value / 1000000000).toFixed(1).replace(/\.0$/, "")}M`;
      }
      
      if (value >= 1000000) {
        return `Rp ${(value / 1000000).toFixed(1).replace(/\.0$/, "")}Jt`;
      }
      
      if (value >= 1000) {
        return `Rp ${(value / 1000).toFixed(1).replace(/\.0$/, "")}Rb`;
      }
      
      return `Rp ${value}`;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      
      throw ApiError.internal({
        message: "Gagal membuat format mata uang singkat.",
        code: "CURRENCY_SHORT_FORMAT_ERROR",
        details: { amount, error: error.message },
      });
    }
  }

  /**
   * Validasi apakah string merupakan format mata uang yang valid
   * @param {string} formatted - String format mata uang yang akan divalidasi
   * @returns {boolean} True jika format valid, false jika tidak
   * @example
   * Currency.isValidCurrencyFormat("Rp 100.000"); // true
   * Currency.isValidCurrencyFormat("invalid"); // false
   */
  static isValidCurrencyFormat(formatted) {
    try {
      if (!formatted || typeof formatted !== "string") return false;
      
      const cleaned = formatted.replace(/[^0-9,-]/g, "").trim();
      return /^[\d,.]+$/.test(cleaned) && cleaned.length > 0;
    } catch {
      return false;
    }
  }
}

export default Currency;