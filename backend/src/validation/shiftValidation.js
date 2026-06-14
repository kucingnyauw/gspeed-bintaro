import Joi from "joi";
import { MAX_LIMIT, MAX_PAGE } from "#shared/constant/constants.js";

const openShiftSchema = Joi.object({
  startingCash: Joi.number().integer().min(0).max(99999999).required().messages({
    "any.required": "Saldo awal harus diisi",
    "number.base": "Saldo awal harus berupa angka",
    "number.integer": "Saldo awal harus berupa bilangan bulat",
    "number.min": "Saldo awal tidak boleh negatif",
    "number.max": "Saldo awal maksimal 99.999.999",
  }),
});

const closeShiftSchema = Joi.object({
  endingCash: Joi.number().integer().min(0).max(99999999).required().messages({
    "any.required": "Jumlah kas akhir harus diisi",
    "number.base": "Jumlah kas akhir harus berupa angka",
    "number.integer": "Jumlah kas akhir harus berupa bilangan bulat",
    "number.min": "Jumlah kas akhir tidak boleh negatif",
    "number.max": "Jumlah kas akhir maksimal 99.999.999",
  }),
});

const recordCashInSchema = Joi.object({
  amount: Joi.number().integer().min(1).max(99999999).required().messages({
    "any.required": "Jumlah kas masuk harus diisi",
    "number.base": "Jumlah kas masuk harus berupa angka",
    "number.integer": "Jumlah kas masuk harus berupa bilangan bulat",
    "number.min": "Jumlah kas masuk minimal 1",
    "number.max": "Jumlah kas masuk maksimal 99.999.999",
  }),
  note: Joi.string().max(255).optional().allow("").messages({
    "string.max": "Catatan maksimal 255 karakter",
  }),
});

const recordCashOutSchema = Joi.object({
  amount: Joi.number().integer().min(1).max(99999999).required().messages({
    "any.required": "Jumlah kas keluar harus diisi",
    "number.base": "Jumlah kas keluar harus berupa angka",
    "number.integer": "Jumlah kas keluar harus berupa bilangan bulat",
    "number.min": "Jumlah kas keluar minimal 1",
    "number.max": "Jumlah kas keluar maksimal 99.999.999",
  }),
  note: Joi.string().max(255).optional().allow("").messages({
    "string.max": "Catatan maksimal 255 karakter",
  }),
});

/**
 * Schema validasi query GET /shifts
 * Support filter: page, limit, status, cashierId, search, startDate, endDate, sortBy, sortOrder
 */
const getShiftsQuerySchema = Joi.object({
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
  status: Joi.string().valid("OPEN", "CLOSED").optional().messages({
    "any.only": "Status shift harus OPEN atau CLOSED",
  }),
  cashierId: Joi.string().optional().messages({
    "string.empty": "ID kasir tidak boleh kosong",
  }),
  search: Joi.string().max(100).optional().allow("").messages({
    "string.max": "Pencarian maksimal 100 karakter",
  }),
  startDate: Joi.date().iso().optional().messages({
    "date.base": "Tanggal mulai harus berupa tanggal yang valid",
    "date.format": "Format tanggal mulai harus ISO (YYYY-MM-DD)",
  }),
  endDate: Joi.date().iso().min(Joi.ref("startDate")).optional().messages({
    "date.base": "Tanggal akhir harus berupa tanggal yang valid",
    "date.format": "Format tanggal akhir harus ISO (YYYY-MM-DD)",
    "date.min": "Tanggal akhir tidak boleh kurang dari tanggal mulai",
  }),
  sortBy: Joi.string()
    .valid("openedAt", "closedAt", "cashSales", "discrepancy")
    .optional()
    .default("openedAt")
    .messages({
      "any.only": "Sort by harus openedAt, closedAt, cashSales, atau discrepancy",
    }),
  sortOrder: Joi.string()
    .valid("asc", "desc")
    .optional()
    .default("desc")
    .messages({
      "any.only": "Sort order harus asc atau desc",
    }),
});

const shiftIdParamSchema = Joi.object({
  id: Joi.string().required().messages({
    "any.required": "ID shift harus diisi",
    "string.empty": "ID shift tidak boleh kosong",
  }),
});

export {
  openShiftSchema,
  closeShiftSchema,
  recordCashInSchema,
  recordCashOutSchema,
  getShiftsQuerySchema,
  shiftIdParamSchema,
};