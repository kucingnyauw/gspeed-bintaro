import Joi from "joi";

const periodSchema = Joi.string()
  .valid("daily", "weekly", "monthly", "yearly")
  .optional()
  .default("monthly")
  .messages({
    "any.only": "Periode harus salah satu dari: daily, weekly, monthly, yearly",
  });

const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).optional().default(1).messages({
    "number.base": "Halaman harus berupa angka",
    "number.integer": "Halaman harus berupa bilangan bulat",
    "number.min": "Halaman minimal 1",
  }),
  limit: Joi.number().integer().min(1).max(100).optional().default(10).messages({
    "number.base": "Limit harus berupa angka",
    "number.integer": "Limit harus berupa bilangan bulat",
    "number.min": "Limit minimal 1",
    "number.max": "Limit maksimal 100",
  }),
});

const dateRangeQuerySchema = Joi.object({
  period: periodSchema,
  referenceDate: Joi.date().optional().messages({
    "date.base": "Tanggal referensi harus berupa tanggal yang valid",
  }),
});

const topProductsQuerySchema = Joi.object({
  period: periodSchema,
  referenceDate: Joi.date().optional().messages({
    "date.base": "Tanggal referensi harus berupa tanggal yang valid",
  }),
  page: paginationSchema.extract("page"),
  limit: paginationSchema.extract("limit"),
});

const mechanicPerformanceQuerySchema = Joi.object({
  period: periodSchema,
  referenceDate: Joi.date().optional().messages({
    "date.base": "Tanggal referensi harus berupa tanggal yang valid",
  }),
  page: paginationSchema.extract("page"),
  limit: paginationSchema.extract("limit"),
});

const expenseReportQuerySchema = Joi.object({
  period: periodSchema,
  referenceDate: Joi.date().optional().messages({
    "date.base": "Tanggal referensi harus berupa tanggal yang valid",
  }),
  category: Joi.string().optional().messages({
    "string.base": "Kategori harus berupa string",
  }),
  shiftId: Joi.string().optional().messages({
    "string.base": "ID shift harus berupa string",
  }),
});

const paymentReportQuerySchema = Joi.object({
  period: periodSchema,
  referenceDate: Joi.date().optional().messages({
    "date.base": "Tanggal referensi harus berupa tanggal yang valid",
  }),
  method: Joi.string()
    .valid("CASH", "QRIS")
    .optional()
    .messages({
      "any.only": "Metode pembayaran harus CASH atau QRIS",
    }),
  status: Joi.string()
    .valid("PENDING", "PAID", "REFUNDED")
    .optional()
    .messages({
      "any.only": "Status pembayaran harus PENDING, PAID, atau REFUNDED",
    }),
});

const stockMovementQuerySchema = Joi.object({
  period: periodSchema,
  referenceDate: Joi.date().optional().messages({
    "date.base": "Tanggal referensi harus berupa tanggal yang valid",
  }),
  page: paginationSchema.extract("page"),
  limit: paginationSchema.extract("limit"),
});

const mechanicEarningsQuerySchema = Joi.object({
  period: periodSchema,
  referenceDate: Joi.date().optional().messages({
    "date.base": "Tanggal referensi harus berupa tanggal yang valid",
  }),
});

const customerSummaryQuerySchema = Joi.object({
  period: periodSchema,
  referenceDate: Joi.date().optional().messages({
    "date.base": "Tanggal referensi harus berupa tanggal yang valid",
  }),
});

const topCustomersQuerySchema = Joi.object({
  period: periodSchema,
  referenceDate: Joi.date().optional().messages({
    "date.base": "Tanggal referensi harus berupa tanggal yang valid",
  }),
  page: paginationSchema.extract("page"),
  limit: paginationSchema.extract("limit"),
});

const customerTransactionHistoryQuerySchema = Joi.object({
  period: periodSchema,
  referenceDate: Joi.date().optional().messages({
    "date.base": "Tanggal referensi harus berupa tanggal yang valid",
  }),
});

const inactiveCustomersQuerySchema = Joi.object({
  daysThreshold: Joi.number().integer().min(1).optional().default(30).messages({
    "number.base": "Batas hari harus berupa angka",
    "number.integer": "Batas hari harus berupa bilangan bulat",
    "number.min": "Batas hari minimal 1",
  }),
  page: paginationSchema.extract("page"),
  limit: paginationSchema.extract("limit"),
});

const customerLifetimeValueQuerySchema = Joi.object({
  page: paginationSchema.extract("page"),
  limit: paginationSchema.extract("limit"),
});

const shiftIdParamSchema = Joi.object({
  shiftId: Joi.string().required().messages({
    "any.required": "ID shift harus diisi",
    "string.empty": "ID shift tidak boleh kosong",
  }),
});

const productIdParamSchema = Joi.object({
  productId: Joi.string().required().messages({
    "any.required": "ID produk harus diisi",
    "string.empty": "ID produk tidak boleh kosong",
  }),
});

const mechanicIdParamSchema = Joi.object({
  mechanicId: Joi.string().required().messages({
    "any.required": "ID mekanik harus diisi",
    "string.empty": "ID mekanik tidak boleh kosong",
  }),
});

const orderIdParamSchema = Joi.object({
  orderId: Joi.string().required().messages({
    "any.required": "ID order harus diisi",
    "string.empty": "ID order tidak boleh kosong",
  }),
});

const customerIdParamSchema = Joi.object({
  customerId: Joi.string().required().messages({
    "any.required": "ID pelanggan harus diisi",
    "string.empty": "ID pelanggan tidak boleh kosong",
  }),
});

export {
  dateRangeQuerySchema,
  topProductsQuerySchema,
  mechanicPerformanceQuerySchema,
  expenseReportQuerySchema,
  paymentReportQuerySchema,
  stockMovementQuerySchema,
  mechanicEarningsQuerySchema,
  customerSummaryQuerySchema,
  topCustomersQuerySchema,
  customerTransactionHistoryQuerySchema,
  inactiveCustomersQuerySchema,
  customerLifetimeValueQuerySchema,
  shiftIdParamSchema,
  productIdParamSchema,
  mechanicIdParamSchema,
  orderIdParamSchema,
  customerIdParamSchema,
};