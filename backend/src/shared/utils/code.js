import crypto from "crypto";

/**
 * Utility untuk generate kode unik untuk berbagai entitas bisnis.
 * 
 * @class CodeGenerator
 * @description Menyediakan method static untuk menghasilkan kode unik
 *              dengan format standar untuk order, produk, dan entitas lainnya.
 */
class CodeGenerator {
  /**
   * Generate nomor order dengan format: ORD-YYYYMMDD-XXXXXX
   * 
   * Format: ORD-[TANGGAL]-[6 KARAKTER HEX RANDOM]
   * Contoh: ORD-20260604-A3F5C8
   * 
   * @static
   * @returns {string} Nomor order unik
   * 
   * @example
   * const orderNumber = CodeGenerator.orderNumber();
   * // "ORD-20260604-A3F5C8"
   */
  static orderNumber() {
    const date = new Date();
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    const rand = crypto.randomBytes(3).toString("hex").toUpperCase();

    return `ORD-${yyyy}${mm}${dd}-${rand}`;
  }

  /**
   * Generate SKU produk berdasarkan tipe dan SKU terakhir.
   * 
   * Format: [PREFIX]-[NOMOR URUT 3 DIGIT]
   * - Sparepart: SP-001, SP-002, ...
   * - Service: SV-001, SV-002, ...
   * 
   * @static
   * @param {"SPAREPART"|"SERVICE"} type - Tipe produk
   * @param {string} [lastSku] - SKU terakhir yang ada di database untuk increment
   * @returns {string} SKU produk baru
   * 
   * @example
   * // Generate SKU pertama untuk sparepart
   * const sku1 = CodeGenerator.productSku("SPAREPART");
   * // "SP-001"
   * 
   * @example
   * // Generate SKU berikutnya berdasarkan SKU terakhir
   * const sku2 = CodeGenerator.productSku("SPAREPART", "SP-015");
   * // "SP-016"
   * 
   * @example
   * // Generate SKU untuk service
   * const sku3 = CodeGenerator.productSku("SERVICE", "SV-008");
   * // "SV-009"
   */
  static productSku(type, lastSku) {
    const prefix = type === "SPAREPART" ? "SP" : "SV";

    if (!lastSku) {
      return `${prefix}-001`;
    }

    const match = lastSku.match(new RegExp(`^${prefix}-(\\d+)$`));
    if (!match) {
      return `${prefix}-001`;
    }

    const nextNumber = parseInt(match[1]) + 1;
    return `${prefix}-${String(nextNumber).padStart(3, "0")}`;
  }
}

export default CodeGenerator;