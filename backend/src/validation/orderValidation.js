import Joi from "joi";
import {
  MAX_ORDER_ITEMS,
  MIN_ORDER_ITEMS,
  MAX_ITEM_QUANTITY,
  MIN_ITEM_QUANTITY,
  MAX_LIMIT,
  MAX_PAGE,
} from "#shared/constant/constants.js";

/**
 * Regex untuk validasi format nomor order.
 * 
 * Format: ORD-YYYYMMDD-XXXXXX (6 karakter hex random)
 * Contoh valid: ORD-20260604-A3F5C8
 * 
 * @constant {RegExp}
 */
const ORDER_NUMBER_REGEX = /^ORD-\d{8}-[A-F0-9]{6}$/;

/**
 * Schema untuk validasi item dalam pesanan.
 * 
 * @constant {Joi.ObjectSchema}
 * @property {string} productId - ID produk (required)
 * @property {number} quantity - Jumlah item (required, integer, min/max sesuai constants)
 */
const orderItemSchema = Joi.object({
  productId: Joi.string().required().messages({
    "any.required": "ID produk harus diisi",
    "string.empty": "ID produk tidak boleh kosong",
  }),
  quantity: Joi.number()
    .integer()
    .min(MIN_ITEM_QUANTITY)
    .max(MAX_ITEM_QUANTITY)
    .required()
    .messages({
      "any.required": "Jumlah item harus diisi",
      "number.base": "Jumlah item harus berupa angka",
      "number.integer": "Jumlah item harus berupa bilangan bulat",
      "number.min": `Jumlah item minimal ${MIN_ITEM_QUANTITY}`,
      "number.max": `Jumlah item maksimal ${MAX_ITEM_QUANTITY}`,
    }),
});

/**
 * Schema untuk membuat order baru dengan status DRAFT.
 * 
 * Field yang divalidasi:
 * - customerId: opsional, ID pelanggan
 * - vehicleId: opsional, ID kendaraan
 * - items: array item pesanan (required, min/max sesuai constants)
 * 
 * @constant {Joi.ObjectSchema}
 * 
 * @example
 * // Validasi request body
 * const { error } = createOrderSchema.validate(req.body);
 */
const createOrderSchema = Joi.object({
  customerId: Joi.string().optional().allow(null, "").messages({
    "string.empty": "ID pelanggan tidak boleh kosong",
  }),
  vehicleId: Joi.string().optional().allow(null, "").messages({
    "string.empty": "ID kendaraan tidak boleh kosong",
  }),
  items: Joi.array()
    .items(orderItemSchema)
    .min(MIN_ORDER_ITEMS)
    .max(MAX_ORDER_ITEMS)
    .required()
    .messages({
      "any.required": "Item pesanan harus diisi",
      "array.base": "Item pesanan harus berupa array",
      "array.min": `Minimal ${MIN_ORDER_ITEMS} item dalam pesanan`,
      "array.max": `Maksimal ${MAX_ORDER_ITEMS} item dalam pesanan`,
    }),
});

/**
 * Schema untuk update status order.
 * 
 * Status yang diizinkan:
 * - QUEUED: Menunggu antrian pengerjaan
 * - IN_PROGRESS: Sedang dikerjakan mekanik
 * - COMPLETED: Pengerjaan selesai
 * - CLOSED: Pembayaran lunas, motor diambil
 * - CANCELLED: Pesanan dibatalkan
 * 
 * @constant {Joi.ObjectSchema}
 * 
 * @example
 * const { error } = updateOrderStatusSchema.validate({ status: "IN_PROGRESS" });
 */
const updateOrderStatusSchema = Joi.object({
  status: Joi.string()
    .valid("QUEUED", "IN_PROGRESS", "COMPLETED", "CLOSED", "CANCELLED")
    .required()
    .messages({
      "any.required": "Status pesanan harus diisi",
      "string.empty": "Status pesanan tidak boleh kosong",
      "any.only": "Status pesanan tidak valid. Status yang diizinkan: QUEUED, IN_PROGRESS, COMPLETED, CLOSED, CANCELLED",
    }),
});

/**
 * Schema untuk pembatalan order.
 * 
 * @constant {Joi.ObjectSchema}
 * @property {string} reason - Alasan pembatalan (required, min 3, max 255 karakter)
 */
const cancelOrderSchema = Joi.object({
  reason: Joi.string().min(3).max(255).required().messages({
    "any.required": "Alasan pembatalan harus diisi",
    "string.empty": "Alasan pembatalan tidak boleh kosong",
    "string.min": "Alasan pembatalan minimal 3 karakter",
    "string.max": "Alasan pembatalan maksimal 255 karakter",
  }),
});

/**
 * Schema untuk query parameter GET /orders.
 * 
 * Mendukung filtering, searching, dan pagination.
 * 
 * @constant {Joi.ObjectSchema}
 * 
 * @property {number} [page=1] - Halaman saat ini
 * @property {number} [limit=10] - Jumlah data per halaman
 * @property {string} [search] - Pencarian berdasarkan orderNumber atau customer
 * @property {string} [status] - Filter berdasarkan status order
 * @property {string} [cashierId] - Filter berdasarkan ID kasir
 * @property {string} [shiftId] - Filter berdasarkan ID shift
 * @property {string} [customerId] - Filter berdasarkan ID pelanggan
 * @property {string} [vehicleId] - Filter berdasarkan ID kendaraan
 * @property {Date} [startDate] - Filter tanggal mulai
 * @property {Date} [endDate] - Filter tanggal akhir (harus >= startDate)
 */
const getOrdersQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).max(MAX_PAGE).optional().default(1).messages({
    "number.base": "Halaman harus berupa angka",
    "number.integer": "Halaman harus berupa bilangan bulat",
    "number.min": "Halaman minimal 1",
    "number.max": `Halaman maksimal ${MAX_PAGE}`,
  }),
  limit: Joi.number().integer().min(1).max(MAX_LIMIT).optional().default(10).messages({
    "number.base": "Limit harus berupa angka",
    "number.integer": "Limit harus berupa bilangan bulat",
    "number.min": "Limit minimal 1",
    "number.max": `Limit maksimal ${MAX_LIMIT}`,
  }),
  search: Joi.string().max(100).optional().allow("").messages({
    "string.max": "Pencarian maksimal 100 karakter",
  }),
  status: Joi.string()
    .valid("DRAFT", "QUEUED", "IN_PROGRESS", "COMPLETED", "CLOSED", "CANCELLED")
    .optional()
    .messages({
      "any.only": "Status pesanan tidak valid. Status yang diizinkan: DRAFT, QUEUED, IN_PROGRESS, COMPLETED, CLOSED, CANCELLED",
    }),
  cashierId: Joi.string().optional().messages({
    "string.empty": "ID kasir tidak boleh kosong",
  }),
  shiftId: Joi.string().optional().messages({
    "string.empty": "ID shift tidak boleh kosong",
  }),
  customerId: Joi.string().optional().messages({
    "string.empty": "ID pelanggan tidak boleh kosong",
  }),
  vehicleId: Joi.string().optional().messages({
    "string.empty": "ID kendaraan tidak boleh kosong",
  }),
  startDate: Joi.date().iso().optional().messages({
    "date.format": "Format tanggal mulai tidak valid. Gunakan format ISO 8601 (YYYY-MM-DD)",
  }),
  endDate: Joi.date().iso().min(Joi.ref("startDate")).optional().messages({
    "date.format": "Format tanggal akhir tidak valid. Gunakan format ISO 8601 (YYYY-MM-DD)",
    "date.min": "Tanggal akhir tidak boleh kurang dari tanggal mulai",
  }),
});

/**
 * Schema untuk validasi parameter ID order di URL.
 * 
 * @constant {Joi.ObjectSchema}
 * @property {string} id - ID pesanan (required)
 */
const orderIdParamSchema = Joi.object({
  id: Joi.string().required().messages({
    "any.required": "ID pesanan harus diisi",
    "string.empty": "ID pesanan tidak boleh kosong",
  }),
});

/**
 * Schema untuk validasi parameter identifier order di URL.
 * 
 * Identifier bisa berupa ID atau nomor order.
 * 
 * @constant {Joi.ObjectSchema}
 * @property {string} identifier - ID atau nomor pesanan (required)
 */
const orderIdentifierParamSchema = Joi.object({
  identifier: Joi.string().required().messages({
    "any.required": "ID atau nomor pesanan harus diisi",
    "string.empty": "ID atau nomor pesanan tidak boleh kosong",
  }),
});

/**
 * Schema untuk validasi parameter nomor order di URL.
 * 
 * Format yang diizinkan: ORD-YYYYMMDD-XXXXXX (6 karakter hex)
 * 
 * @constant {Joi.ObjectSchema}
 * @property {string} orderNumber - Nomor pesanan (required, harus sesuai format)
 */
const orderNumberParamSchema = Joi.object({
  orderNumber: Joi.string()
    .pattern(ORDER_NUMBER_REGEX)
    .required()
    .messages({
      "any.required": "Nomor pesanan harus diisi",
      "string.empty": "Nomor pesanan tidak boleh kosong",
      "string.pattern.base": "Format nomor pesanan tidak valid. Format yang benar: ORD-YYYYMMDD-XXXXXX (contoh: ORD-20260604-A3F5C8)",
    }),
});

/**
 * Schema untuk kalkulasi total pesanan.
 * 
 * Menerima array item pesanan untuk dihitung subtotal, tax, dan total.
 * 
 * @constant {Joi.ArraySchema}
 */
const calculateTotalSchema = Joi.array()
  .items(orderItemSchema)
  .min(MIN_ORDER_ITEMS)
  .max(MAX_ORDER_ITEMS)
  .required()
  .messages({
    "any.required": "Item pesanan harus diisi",
    "array.base": "Item pesanan harus berupa array",
    "array.min": `Minimal ada ${MIN_ORDER_ITEMS} item dalam pesanan`,
    "array.max": `Maksimal ${MAX_ORDER_ITEMS} item dalam pesanan`,
  });

export {
  createOrderSchema,
  updateOrderStatusSchema,
  cancelOrderSchema,
  getOrdersQuerySchema,
  orderIdParamSchema,
  orderIdentifierParamSchema,
  orderNumberParamSchema,
  calculateTotalSchema,
};