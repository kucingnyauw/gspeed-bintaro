// #shared/utils/error.js

/**
 * Custom API Error
 */
class ApiError extends Error {
  /**
   * @param {Object} params
   * @param {string} params.message
   * @param {number} [params.statusCode=500]
   * @param {string} [params.code="INTERNAL_SERVER_ERROR"]
   * @param {*} [params.details=null]
   * @param {boolean} [params.isOperational=true]
   */
  constructor({
    message,
    statusCode = 500,
    code = "INTERNAL_SERVER_ERROR",
    details = null,
    isOperational = true,
  }) {
    super(message);

    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Serialize Error
   */
  toJSON() {
    return {
      success: false,
      message: this.message,
      code: this.code,
      details: this.details,
    };
  }

  /**
   * 400 Bad Request
   */
  static badRequest({
    message = "Permintaan tidak valid. Silakan periksa kembali data yang dikirimkan.",
    code = "BAD_REQUEST",
    details = null,
  } = {}) {
    return new ApiError({
      message,
      statusCode: 400,
      code,
      details,
    });
  }

  /**
   * 401 Unauthorized
   */
  static unauthorized({
    message = "Autentikasi diperlukan. Silakan login terlebih dahulu.",
    code = "UNAUTHORIZED",
    details = null,
  } = {}) {
    return new ApiError({
      message,
      statusCode: 401,
      code,
      details,
    });
  }

  /**
   * 403 Forbidden
   */
  static forbidden({
    message = "Akses ditolak. Anda tidak memiliki izin untuk mengakses sumber daya ini.",
    code = "FORBIDDEN",
    details = null,
  } = {}) {
    return new ApiError({
      message,
      statusCode: 403,
      code,
      details,
    });
  }

  /**
   * 404 Not Found
   */
  static notFound({
    message = "Data atau halaman yang Anda cari tidak ditemukan.",
    code = "NOT_FOUND",
    details = null,
  } = {}) {
    return new ApiError({
      message,
      statusCode: 404,
      code,
      details,
    });
  }

  /**
   * 408 Request Timeout
   */
  static requestTimeout({
    message = "Permintaan membutuhkan waktu terlalu lama. Silakan coba lagi.",
    code = "REQUEST_TIMEOUT",
    details = null,
  } = {}) {
    return new ApiError({
      message,
      statusCode: 408,
      code,
      details,
    });
  }

  /**
   * 409 Conflict
   */
  static conflict({
    message = "Terjadi konflik data. Data yang Anda kirimkan mungkin sudah ada atau bertentangan.",
    code = "RESOURCE_CONFLICT",
    details = null,
  } = {}) {
    return new ApiError({
      message,
      statusCode: 409,
      code,
      details,
    });
  }

  /**
   * 422 Validation Error
   */
  static unprocessableEntity({
    message = "Validasi data gagal. Silakan periksa kembali input Anda.",
    code = "VALIDATION_ERROR",
    details = null,
  } = {}) {
    return new ApiError({
      message,
      statusCode: 422,
      code,
      details,
    });
  }

  /**
   * 429 Too Many Requests
   */
  static tooManyRequests({
    message = "Terlalu banyak permintaan. Silakan tunggu beberapa saat sebelum mencoba lagi.",
    code = "RATE_LIMITED",
    retryAfter = 60,
  } = {}) {
    return new ApiError({
      message,
      statusCode: 429,
      code,
      details: {
        retryAfter,
        suggestion: `Silakan coba lagi dalam ${retryAfter} detik.`,
      },
    });
  }

  /**
   * 500 Internal Server Error
   */
  static internal({
    message = "Terjadi kesalahan pada server. Tim kami sedang menangani masalah ini.",
    code = "INTERNAL_SERVER_ERROR",
    details = null,
  } = {}) {
    return new ApiError({
      message,
      statusCode: 500,
      code,
      details,
    });
  }

  /**
   * 503 Service Unavailable
   */
  static serviceUnavailable({
    message = "Layanan sedang dalam pemeliharaan atau tidak tersedia. Silakan coba beberapa saat lagi.",
    code = "SERVICE_UNAVAILABLE",
    details = null,
  } = {}) {
    return new ApiError({
      message,
      statusCode: 503,
      code,
      details,
    });
  }

  /**
   * 504 Gateway Timeout
   */
  static gatewayTimeout({
    message = "Server gateway timeout. Silakan coba lagi dalam beberapa saat.",
    code = "GATEWAY_TIMEOUT",
    details = null,
  } = {}) {
    return new ApiError({
      message,
      statusCode: 504,
      code,
      details,
    });
  }
}

export default ApiError;