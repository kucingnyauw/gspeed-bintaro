import crypto from "crypto";
import InsightRepository from "#repository/insightRepository.js";
import UserRepository from "#repository/userRepository.js";
import CacheManager from "#shared/utils/cache.js";
import ApiError from "#shared/utils/error.js";
import logger from "#app/logger.js";
import axios from "axios";

class AgentService {
  constructor() {
    this.insight = new InsightRepository();
    this.user = new UserRepository();
    this.cache = new CacheManager("agent");
    this.qaCache = new CacheManager("agent:qa");
  }

  /**
   * Parse input natural language user menjadi parameter filter terstruktur
   * Support: "30 hari terakhir", "bulan lalu", "Januari 2025", "minggu ini", "tahun 2025", dll
   *
   * @param {string} input - Input natural language dari user (contoh: "30 hari terakhir", "bulan Januari 2025")
   * @returns {{startDate: Date|null, endDate: Date|null, days: number|null}}
   * @private
   */
  #parseTimeFilter(input) {
    if (!input) return { startDate: null, endDate: null, days: null };

    const str = input.toLowerCase().trim();

    const daysMatch = str.match(
      /(\d+)\s*hari\s*(terakhir|yang\s*lalu|belakangan|ini)/
    );
    if (daysMatch) {
      return { startDate: null, endDate: null, days: parseInt(daysMatch[1]) };
    }

    if (str.includes("minggu lalu")) {
      const now = new Date();
      const start = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() - now.getDay() - 7
      );
      const end = new Date(
        start.getFullYear(),
        start.getMonth(),
        start.getDate() + 6,
        23,
        59,
        59
      );
      return { startDate: start, endDate: end, days: null };
    }

    if (str.includes("minggu ini")) {
      const now = new Date();
      const start = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() - now.getDay()
      );
      return { startDate: start, endDate: null, days: null };
    }

    if (str.includes("bulan lalu")) {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
      return { startDate: start, endDate: end, days: null };
    }

    if (str.includes("bulan ini")) {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return { startDate: start, endDate: null, days: null };
    }

    if (str.includes("tahun lalu")) {
      const now = new Date();
      const start = new Date(now.getFullYear() - 1, 0, 1);
      const end = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59);
      return { startDate: start, endDate: end, days: null };
    }

    if (str.includes("tahun ini")) {
      const now = new Date();
      const start = new Date(now.getFullYear(), 0, 1);
      return { startDate: start, endDate: null, days: null };
    }

    const monthYearMatch = str.match(
      /(januari|februari|maret|april|mei|juni|juli|agustus|september|oktober|november|desember|jan|feb|mar|apr|mei|jun|jul|agu|sep|okt|nov|des)\s*(\d{4})/
    );
    if (monthYearMatch) {
      const months = [
        "januari",
        "februari",
        "maret",
        "april",
        "mei",
        "juni",
        "juli",
        "agustus",
        "september",
        "oktober",
        "november",
        "desember",
        "jan",
        "feb",
        "mar",
        "apr",
        "mei",
        "jun",
        "jul",
        "agu",
        "sep",
        "okt",
        "nov",
        "des",
      ];
      const monthIdx = months.indexOf(monthYearMatch[1]) % 12;
      const year = parseInt(monthYearMatch[2]);
      const start = new Date(year, monthIdx, 1);
      const end = new Date(year, monthIdx + 1, 0, 23, 59, 59);
      return { startDate: start, endDate: end, days: null };
    }

    const isoMatch = str.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
      const start = new Date(
        parseInt(isoMatch[1]),
        parseInt(isoMatch[2]) - 1,
        parseInt(isoMatch[3])
      );
      return { startDate: start, endDate: null, days: null };
    }

    const yearMatch = str.match(/tahun\s*(\d{4})|^(\d{4})$/);
    if (yearMatch) {
      const year = parseInt(yearMatch[1] || yearMatch[2]);
      const start = new Date(year, 0, 1);
      const end = new Date(year, 11, 31, 23, 59, 59);
      return { startDate: start, endDate: end, days: null };
    }

    if (str.includes("hari ini")) {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      return { startDate: start, endDate: null, days: null };
    }

    if (str.includes("kemarin")) {
      const now = new Date();
      const start = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() - 1
      );
      const end = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() - 1,
        23,
        59,
        59
      );
      return { startDate: start, endDate: end, days: null };
    }

    return { startDate: null, endDate: null, days: null };
  }

  /**
   * Konfigurasi model per role
   * @param {string} role
   * @returns {{max_tokens: number, temperature: number}}
   * @private
   */
  #getModelConfig(role) {
    const configs = {
      ADMIN: { max_tokens: 768, temperature: 0.3 },
      CASHIER: { max_tokens: 512, temperature: 0.4 },
      MECHANIC: { max_tokens: 512, temperature: 0.4 },
    };
    return configs[role] || { max_tokens: 512, temperature: 0.4 };
  }

  /**
   * Format tanggal ke format readable Indonesia
   * @param {string|Date} date
   * @returns {string}
   * @private
   */
  #formatDateReadable(date) {
    if (!date) return "-";
    const d = new Date(date);
    if (isNaN(d.getTime())) return String(date);

    const days = [
      "Minggu",
      "Senin",
      "Selasa",
      "Rabu",
      "Kamis",
      "Jumat",
      "Sabtu",
    ];
    const months = [
      "Januari",
      "Februari",
      "Maret",
      "April",
      "Mei",
      "Juni",
      "Juli",
      "Agustus",
      "September",
      "Oktober",
      "November",
      "Desember",
    ];

    const day = days[d.getDay()];
    const dateNum = d.getDate();
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");

    return `${day}, ${dateNum} ${month} ${year}, ${hours}:${minutes} WIB`;
  }

  /**
   * Format tanggal pendek (tanpa hari)
   * @param {string|Date} date
   * @returns {string}
   * @private
   */
  #formatDateShort(date) {
    if (!date) return "-";
    const d = new Date(date);
    if (isNaN(d.getTime())) return String(date);

    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "Mei",
      "Jun",
      "Jul",
      "Agu",
      "Sep",
      "Okt",
      "Nov",
      "Des",
    ];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  }

  /**
   * Format durasi dalam menit ke format readable
   * @param {number} minutes
   * @returns {string}
   * @private
   */
  #formatDuration(minutes) {
    if (!minutes || minutes <= 0) return "kurang dari 1 menit";
    if (minutes < 60) return `${minutes} menit`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (mins === 0) return `${hours} jam`;
    return `${hours} jam ${mins} menit`;
  }

  /**
   * Format persentase
   * @param {number} value
   * @returns {string}
   * @private
   */
  #formatPercentage(value) {
    if (value === null || value === undefined) return "0%";
    return `${Math.round(value * 10) / 10}%`;
  }

  /**
   * Sanitasi dan format hasil tool call agar lebih readable untuk AI
   * @param {string} toolName
   * @param {Object} result
   * @returns {Object}
   * @private
   */
  #formatToolResult(toolName, result) {
    if (!result) return result;

    const formatted = JSON.parse(JSON.stringify(result));

    const formatDates = (obj) => {
      if (!obj || typeof obj !== "object") return;
      const dateFields = [
        "createdAt",
        "updatedAt",
        "openedAt",
        "closedAt",
        "paidAt",
        "startAt",
        "endAt",
        "date",
        "lastOrderDate",
        "firstOrderDate",
        "lastVisit",
        "registeredAt",
        "last_visit",
        "completedAt",
        "weekStart",
        "week_start",
        "month",
      ];
      for (const key of Object.keys(obj)) {
        if (dateFields.includes(key) && obj[key]) {
          obj[key] =
            key === "weekStart" || key === "week_start" || key === "month"
              ? this.#formatDateShort(obj[key])
              : this.#formatDateReadable(obj[key]);
        } else if (typeof obj[key] === "object" && obj[key] !== null) {
          formatDates(obj[key]);
        }
      }
    };

    const formatSpecificFields = (obj) => {
      if (!obj || typeof obj !== "object") return;
      for (const key of Object.keys(obj)) {
        if (
          [
            "avgTimeMinutes",
            "fastestMinutes",
            "slowestMinutes",
            "avg_minutes",
          ].includes(key) &&
          typeof obj[key] === "number"
        ) {
          obj[`${key}_readable`] = this.#formatDuration(obj[key]);
        }
        if (
          ["avgHours", "minHours", "maxHours"].includes(key) &&
          typeof obj[key] === "number"
        ) {
          obj[`${key}_readable`] = this.#formatDuration(
            Math.round(obj[key] * 60)
          );
        }
        if (
          [
            "completionRate",
            "retentionRate",
            "grossMargin",
            "netMargin",
            "profitMargin",
            "percentage",
          ].includes(key) &&
          typeof obj[key] === "number"
        ) {
          obj[`${key}_readable`] = this.#formatPercentage(obj[key]);
        }
        if (
          [
            "expenseGrowth",
            "revenueGrowth",
            "customerGrowth",
            "orderGrowth",
            "salesChange",
            "trend",
          ].includes(key) &&
          typeof obj[key] === "number"
        ) {
          const sign = obj[key] > 0 ? "+" : "";
          obj[`${key}_readable`] = `${sign}${obj[key]}%`;
        }
        if (key === "avgDiscrepancy" && typeof obj[key] === "number") {
          obj[`${key}_readable`] = `Rp${obj[key].toLocaleString("id-ID")}`;
        }
        if (typeof obj[key] === "object" && obj[key] !== null) {
          formatSpecificFields(obj[key]);
        }
      }
    };

    formatDates(formatted);
    formatSpecificFields(formatted);

    return {
      _tool: toolName,
      _note:
        "Semua tanggal sudah dalam format readable Indonesia (WIB). Durasi dalam format jam/menit. Uang dalam Rupiah.",
      data: formatted,
    };
  }

  /**
   * Bangun system prompt sesuai role
   * @param {string} role
   * @param {string} userName
   * @returns {string}
   * @private
   */
  #buildSystemPrompt(role, userName) {
    const today = new Date().toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const base = `Kamu adalah **G-Speed Copilot**, asisten AI untuk **G Speed Bintaro** — bengkel spesialis Vespa.

<identity>
Kamu adalah AI operasional bengkel. Kamu bisa:
- Menyapa balik dengan ramah (jawab "halo", "pagi", "selamat pagi", "assalamualaikum", dll)
- Menjawab pertanyaan ringan seperti "siapa kamu?", "kamu bisa apa?", "bengkel ini dimana?"
- Membantu mengakses data sesuai role user
- Memberikan insight operasional berbasis data nyata
- **Memahami filter waktu natural**: user bisa minta data dengan filter seperti "30 hari terakhir", "bulan lalu", "Januari 2025", "tahun ini". Kamu WAJIB menerjemahkan ini ke parameter yang sesuai.

Kamu TIDAK bisa:
- Menjalankan perintah SQL, kode, script, atau query database
- Memberikan saran teknis terkait query atau pemrograman
- Mengakses tools di luar yang ditentukan
- Menyebutkan nama-nama fungsi/tools internal kepada user
</identity>

<critical_rules>
1. HANYA panggil tools yang diberikan. JANGAN mengarang data atau memanggil tools di luar daftar.
2. Jika user meminta data di luar tools yang tersedia, tolak dengan sopan.
3. Jika pertanyaan di LUAR konteks bengkel, tolak dengan sopan dan arahkan kembali ke topik bengkel.
4. **KEAMANAN**: Jika user mengirimkan perintah SQL/kode/script MENTAH, TOLAK TEGAS.
5. Response WAJIB menggunakan **Markdown**.
6. Nominal uang: **Rp1.000.000** (tanpa spasi setelah Rp, gunakan titik sebagai pemisah ribuan).
7. Tanggal WAJIB format readable: "Senin, 3 Juni 2026, 14:30 WIB".
8. Durasi dalam format: "2 jam 30 menit" atau "45 menit".
9. JANGAN tampilkan UUID atau ID teknis.
10. Profesional tapi ramah, ringkas, langsung ke poin.
11. Jika data kosong, jelaskan dengan sopan.
12. Semua kendaraan adalah Vespa.
13. Gunakan emoji secukupnya.
14. Jika ada data yang mengkhawatirkan, beri peringatan.
15. Data yang kamu terima dari tools SUDAH dalam format readable.
16. **PENTING**: Tools CASHIER/MECHANIC tidak perlu parameter ID. Tools ADMIN bisa menerima parameter opsional untuk filter.
17. **FILTER WAKTU**: Jika user menyebutkan periode waktu, gunakan parameter yang sesuai.
</critical_rules>`;

    const rolePrompts = {
      ADMIN: `${base}

<role>ADMINISTRATOR — Pemilik/Pengelola Bengkel</role>
<nama>${userName}</nama>
<tanggal>${today}</tanggal>

<filter_guide>
Untuk tools yang mendukung filter waktu, gunakan parameter berikut:
- Jika user minta "30 hari terakhir": gunakan parameter { "days": 30 }
- Jika user minta "bulan lalu" atau "Januari 2025": gunakan parameter { "startDate": "2025-01-01", "endDate": "2025-01-31" }
- Jika user minta "tahun 2025": gunakan parameter { "startDate": "2025-01-01", "endDate": "2025-12-31" }
- Jika user tidak menyebutkan periode, gunakan default (30 hari atau 7 hari sesuai deskripsi tool)
</filter_guide>

<akses_data>
Anda memiliki akses ke SEMUA data bengkel: dashboard, performa kasir & mekanik, inventori, keuangan, pertumbuhan, pelanggan, dll.
</akses_data>

<cara_menjawab>
- Jika ditanya data dengan periode spesifik, gunakan parameter filter yang sesuai.
- Contoh: "berapa penjualan bulan Agustus 2025?" → panggil getAdminDailyNetReport dengan startDate "2025-08-01" dan endDate "2025-08-31"
- **ADMIN tools menerima parameter opsional untuk filter waktu.**
</cara_menjawab>`,

      CASHIER: `${base}

<role>KASIR — Garda Depan Transaksi</role>
<nama>${userName}</nama>
<tanggal>${today}</tanggal>

<akses_data>
Anda memiliki akses ke data ANDA SENDIRI: penjualan hari ini, shift aktif, order pending, riwayat transaksi, statistik pelanggan.
</akses_data>

<batasan>
Anda HANYA bisa melihat data transaksi Anda sendiri. Tools TIDAK memerlukan parameter ID.
</batasan>`,

      MECHANIC: `${base}

<role>MEKANIK — Jantung Operasional Bengkel</role>
<nama>${userName}</nama>
<tanggal>${today}</tanggal>

<akses_data>
Anda memiliki akses ke data ANDA SENDIRI: job aktif, antrian, performa pribadi, pendapatan, ranking efisiensi.
</akses_data>

<batasan>
Anda HANYA bisa melihat job yang di-assign ke Anda. Tools TIDAK memerlukan parameter ID.
</batasan>`,
    };

    return rolePrompts[role] || base;
  }

  /**
   * Bangun definisi tools sesuai role
   * Admin tools menerima parameter opsional untuk filter waktu
   * @param {string} role
   * @returns {Array}
   * @private
   */
  #buildTools(role) {
    const defs = {
      // Mekanik (tanpa parameter)
      getMechanicActiveJobs: {
        type: "function",
        function: {
          name: "getMechanicActiveJobs",
          description:
            "Job yang sedang dikerjakan (IN_PROGRESS) - milik mekanik sendiri.",
          parameters: { type: "object", properties: {} },
        },
      },
      getMechanicPendingJobs: {
        type: "function",
        function: {
          name: "getMechanicPendingJobs",
          description: "Job antrian (QUEUED) - milik mekanik sendiri.",
          parameters: { type: "object", properties: {} },
        },
      },
      getMechanicPerformanceSummary: {
        type: "function",
        function: {
          name: "getMechanicPerformanceSummary",
          description:
            "Performa pribadi: job selesai hari ini/minggu ini/bulan ini + pendapatan.",
          parameters: { type: "object", properties: {} },
        },
      },
      getMechanicDailyHistory: {
        type: "function",
        function: {
          name: "getMechanicDailyHistory",
          description:
            "Riwayat kerja harian pribadi (default 7 hari). Gunakan parameter days untuk custom.",
          parameters: {
            type: "object",
            properties: {
              days: { type: "number", description: "Jumlah hari (default 7)" },
            },
          },
        },
      },
      getMechanicSpeedStats: {
        type: "function",
        function: {
          name: "getMechanicSpeedStats",
          description: "Kecepatan kerja pribadi: rata-rata, tercepat, terlama.",
          parameters: { type: "object", properties: {} },
        },
      },
      getMechanicTopServices: {
        type: "function",
        function: {
          name: "getMechanicTopServices",
          description: "5 service yang paling sering dikerjakan.",
          parameters: { type: "object", properties: {} },
        },
      },
      getMechanicEarningsBreakdown: {
        type: "function",
        function: {
          name: "getMechanicEarningsBreakdown",
          description:
            "Pendapatan pribadi per hari (default 30 hari). Gunakan days untuk custom.",
          parameters: {
            type: "object",
            properties: {
              days: { type: "number", description: "Jumlah hari (default 30)" },
            },
          },
        },
      },
      getMechanicEfficiencyRank: {
        type: "function",
        function: {
          name: "getMechanicEfficiencyRank",
          description: "Ranking efisiensi vs mekanik lain.",
          parameters: { type: "object", properties: {} },
        },
      },
      getMechanicWeeklyTrend: {
        type: "function",
        function: {
          name: "getMechanicWeeklyTrend",
          description: "Tren performa mingguan (default 30 hari).",
          parameters: {
            type: "object",
            properties: {
              days: { type: "number", description: "Jumlah hari (default 30)" },
            },
          },
        },
      },
      // Kasir (tanpa parameter)
      getCashierTodaySummary: {
        type: "function",
        function: {
          name: "getCashierTodaySummary",
          description: "Ringkasan penjualan hari ini.",
          parameters: { type: "object", properties: {} },
        },
      },
      getCashierActiveShift: {
        type: "function",
        function: {
          name: "getCashierActiveShift",
          description: "Shift aktif saat ini.",
          parameters: { type: "object", properties: {} },
        },
      },
      getCashierPendingOrders: {
        type: "function",
        function: {
          name: "getCashierPendingOrders",
          description: "Order pending per status.",
          parameters: { type: "object", properties: {} },
        },
      },
      getCashierDailyHistory: {
        type: "function",
        function: {
          name: "getCashierDailyHistory",
          description: "Riwayat penjualan harian (default 7 hari).",
          parameters: {
            type: "object",
            properties: {
              days: { type: "number", description: "Jumlah hari (default 7)" },
            },
          },
        },
      },
      getCashierCustomerStats: {
        type: "function",
        function: {
          name: "getCashierCustomerStats",
          description: "Statistik pelanggan.",
          parameters: { type: "object", properties: {} },
        },
      },
      getCashierShiftHistory: {
        type: "function",
        function: {
          name: "getCashierShiftHistory",
          description: "10 shift terakhir.",
          parameters: { type: "object", properties: {} },
        },
      },
      getCashierRecentTransactions: {
        type: "function",
        function: {
          name: "getCashierRecentTransactions",
          description: "20 transaksi terbaru.",
          parameters: { type: "object", properties: {} },
        },
      },
      getCashierComparisonStats: {
        type: "function",
        function: {
          name: "getCashierComparisonStats",
          description: "Perbandingan penjualan hari ini vs kemarin.",
          parameters: { type: "object", properties: {} },
        },
      },
      // Admin (dengan parameter opsional)
      getAdminDashboardSnapshot: {
        type: "function",
        function: {
          name: "getAdminDashboardSnapshot",
          description:
            "Dashboard bengkel: revenue harian & bulanan, mekanik aktif, shift buka, stok rendah.",
          parameters: { type: "object", properties: {} },
        },
      },
      getAdminTodaySummary: {
        type: "function",
        function: {
          name: "getAdminTodaySummary",
          description: "Ringkasan bisnis hari ini.",
          parameters: { type: "object", properties: {} },
        },
      },
      getAdminCashierPerformance: {
        type: "function",
        function: {
          name: "getAdminCashierPerformance",
          description:
            "Performa SEMUA kasir. Gunakan days, startDate, atau endDate.",
          parameters: {
            type: "object",
            properties: {
              days: { type: "number", description: "Jumlah hari (default 30)" },
              startDate: {
                type: "string",
                description: "Tanggal mulai (YYYY-MM-DD)",
              },
              endDate: {
                type: "string",
                description: "Tanggal akhir (YYYY-MM-DD)",
              },
            },
          },
        },
      },
      getAdminMechanicComparison: {
        type: "function",
        function: {
          name: "getAdminMechanicComparison",
          description:
            "Perbandingan SEMUA mekanik. Gunakan days, startDate, atau endDate.",
          parameters: {
            type: "object",
            properties: {
              days: { type: "number", description: "Jumlah hari (default 30)" },
              startDate: {
                type: "string",
                description: "Tanggal mulai (YYYY-MM-DD)",
              },
              endDate: {
                type: "string",
                description: "Tanggal akhir (YYYY-MM-DD)",
              },
            },
          },
        },
      },
      getAdminExpenseOverview: {
        type: "function",
        function: {
          name: "getAdminExpenseOverview",
          description: "Pengeluaran bulan ini.",
          parameters: { type: "object", properties: {} },
        },
      },
      getAdminOrderStatusDistribution: {
        type: "function",
        function: {
          name: "getAdminOrderStatusDistribution",
          description: "Distribusi status order. Gunakan days atau startDate.",
          parameters: {
            type: "object",
            properties: {
              days: { type: "number", description: "Jumlah hari (default 30)" },
              startDate: {
                type: "string",
                description: "Tanggal mulai (YYYY-MM-DD)",
              },
              endDate: {
                type: "string",
                description: "Tanggal akhir (YYYY-MM-DD)",
              },
            },
          },
        },
      },
      getAdminInventoryHealth: {
        type: "function",
        function: {
          name: "getAdminInventoryHealth",
          description: "Kesehatan inventori.",
          parameters: { type: "object", properties: {} },
        },
      },
      getAdminBusinessGrowth: {
        type: "function",
        function: {
          name: "getAdminBusinessGrowth",
          description: "Pertumbuhan bisnis bulan ini vs bulan lalu.",
          parameters: { type: "object", properties: {} },
        },
      },
      getAdminDailyNetReport: {
        type: "function",
        function: {
          name: "getAdminDailyNetReport",
          description:
            "Laporan laba bersih harian. Gunakan days, startDate, atau endDate.",
          parameters: {
            type: "object",
            properties: {
              days: { type: "number", description: "Jumlah hari (default 7)" },
              startDate: {
                type: "string",
                description: "Tanggal mulai (YYYY-MM-DD)",
              },
              endDate: {
                type: "string",
                description: "Tanggal akhir (YYYY-MM-DD)",
              },
            },
          },
        },
      },
      getAdminTopSpareparts: {
        type: "function",
        function: {
          name: "getAdminTopSpareparts",
          description: "10 sparepart terlaris. Gunakan days atau startDate.",
          parameters: {
            type: "object",
            properties: {
              days: { type: "number", description: "Jumlah hari (default 30)" },
              startDate: {
                type: "string",
                description: "Tanggal mulai (YYYY-MM-DD)",
              },
              endDate: {
                type: "string",
                description: "Tanggal akhir (YYYY-MM-DD)",
              },
            },
          },
        },
      },
      getAdminServicePopularity: {
        type: "function",
        function: {
          name: "getAdminServicePopularity",
          description: "10 service terpopuler. Gunakan days atau startDate.",
          parameters: {
            type: "object",
            properties: {
              days: { type: "number", description: "Jumlah hari (default 30)" },
              startDate: {
                type: "string",
                description: "Tanggal mulai (YYYY-MM-DD)",
              },
              endDate: {
                type: "string",
                description: "Tanggal akhir (YYYY-MM-DD)",
              },
            },
          },
        },
      },
      getAdminPeakHours: {
        type: "function",
        function: {
          name: "getAdminPeakHours",
          description: "Jam tersibuk bengkel. Gunakan days atau startDate.",
          parameters: {
            type: "object",
            properties: {
              days: { type: "number", description: "Jumlah hari (default 30)" },
              startDate: {
                type: "string",
                description: "Tanggal mulai (YYYY-MM-DD)",
              },
              endDate: {
                type: "string",
                description: "Tanggal akhir (YYYY-MM-DD)",
              },
            },
          },
        },
      },
      getAdminVehicleDistribution: {
        type: "function",
        function: {
          name: "getAdminVehicleDistribution",
          description: "Distribusi tipe Vespa yang diservis.",
          parameters: { type: "object", properties: {} },
        },
      },
      getAdminStockAlert: {
        type: "function",
        function: {
          name: "getAdminStockAlert",
          description: "Alert stok sparepart.",
          parameters: { type: "object", properties: {} },
        },
      },
      getAdminRefundStats: {
        type: "function",
        function: {
          name: "getAdminRefundStats",
          description: "Statistik refund. Gunakan days atau startDate.",
          parameters: {
            type: "object",
            properties: {
              days: { type: "number", description: "Jumlah hari (default 30)" },
              startDate: {
                type: "string",
                description: "Tanggal mulai (YYYY-MM-DD)",
              },
              endDate: {
                type: "string",
                description: "Tanggal akhir (YYYY-MM-DD)",
              },
            },
          },
        },
      },
      getAdminRecentActivities: {
        type: "function",
        function: {
          name: "getAdminRecentActivities",
          description: "Aktivitas terbaru bengkel (default 20).",
          parameters: { type: "object", properties: {} },
        },
      },
      getAdminUnpaidOrders: {
        type: "function",
        function: {
          name: "getAdminUnpaidOrders",
          description: "Order selesai yang belum dibayar.",
          parameters: { type: "object", properties: {} },
        },
      },
      getAdminCustomerRetention: {
        type: "function",
        function: {
          name: "getAdminCustomerRetention",
          description: "Retensi pelanggan 3 bulan terakhir.",
          parameters: { type: "object", properties: {} },
        },
      },
      getAdminRevenueVsTarget: {
        type: "function",
        function: {
          name: "getAdminRevenueVsTarget",
          description: "Revenue vs target bulanan.",
          parameters: { type: "object", properties: {} },
        },
      },
      getAdminTopCustomersByVisit: {
        type: "function",
        function: {
          name: "getAdminTopCustomersByVisit",
          description: "10 pelanggan paling sering berkunjung.",
          parameters: { type: "object", properties: {} },
        },
      },
      getAdminOrderCompletionTime: {
        type: "function",
        function: {
          name: "getAdminOrderCompletionTime",
          description: "Rata-rata waktu penyelesaian order.",
          parameters: { type: "object", properties: {} },
        },
      },
      getAdminPaymentMethodDistribution: {
        type: "function",
        function: {
          name: "getAdminPaymentMethodDistribution",
          description:
            "Distribusi metode pembayaran. Gunakan days atau startDate.",
          parameters: {
            type: "object",
            properties: {
              days: { type: "number", description: "Jumlah hari (default 30)" },
              startDate: {
                type: "string",
                description: "Tanggal mulai (YYYY-MM-DD)",
              },
              endDate: {
                type: "string",
                description: "Tanggal akhir (YYYY-MM-DD)",
              },
            },
          },
        },
      },
      getAdminMechanicAvailability: {
        type: "function",
        function: {
          name: "getAdminMechanicAvailability",
          description: "Ketersediaan mekanik (utilisasi).",
          parameters: { type: "object", properties: {} },
        },
      },
      getAdminMonthlyBusinessReview: {
        type: "function",
        function: {
          name: "getAdminMonthlyBusinessReview",
          description:
            "Review performa bisnis bulanan. Gunakan month (1-12) dan year.",
          parameters: {
            type: "object",
            properties: {
              month: { type: "number", description: "Bulan (1-12)" },
              year: { type: "number", description: "Tahun (2025, 2026, dst)" },
            },
          },
        },
      },
    };

    const roleTools = {
      ADMIN: Object.keys(defs).filter((k) => k.startsWith("getAdmin")),
      CASHIER: Object.keys(defs).filter((k) => k.startsWith("getCashier")),
      MECHANIC: Object.keys(defs).filter((k) => k.startsWith("getMechanic")),
    };

    return (roleTools[role] || []).map((name) => defs[name]).filter(Boolean);
  }

  /**
   * Cek apakah tool diizinkan untuk role tertentu
   * @param {string} toolName
   * @param {string} role
   * @returns {boolean}
   * @private
   */
  #isToolAllowed(toolName, role) {
    const prefixMap = {
      ADMIN: "getAdmin",
      CASHIER: "getCashier",
      MECHANIC: "getMechanic",
    };
    const prefix = prefixMap[role];
    return prefix ? toolName.startsWith(prefix) : false;
  }

  /**
   * Eksekusi tool call dari AI dengan parameter yang sudah di-parse
   * @param {string} name
   * @param {Object} args - Arguments dari AI (mungkin berisi filter waktu)
   * @param {string} userId
   * @param {string} role
   * @returns {Promise<any>}
   * @private
   */
  async #executeToolCall(name, args, userId, role) {
    if (!this.#isToolAllowed(name, role)) {
      logger.warn("[AGENT] Tool access denied", { name, role, userId });
      throw ApiError.forbidden({
        message: `Tool '${name}' tidak diizinkan untuk role '${role}'.`,
      });
    }

    logger.info("[AGENT] Executing tool call", { name, userId, args });

    const params = {};

    // Parse time filter dari args
    if (args) {
      if (args.days) params.days = parseInt(args.days);
      if (args.month) params.month = parseInt(args.month);
      if (args.year) params.year = parseInt(args.year);

      // Jika ada startDate/endDate langsung dari AI, gunakan
      if (args.startDate) params.startDate = args.startDate;
      if (args.endDate) params.endDate = args.endDate;

      // Jika tidak ada startDate/endDate tapi ada input natural language dari user
      if (
        !params.startDate &&
        !params.endDate &&
        !params.days &&
        !params.month
      ) {
        // Coba parse dari user message (disimpan di args._userMessage oleh chat method)
        if (args._timeFilter) {
          const parsed = this.#parseTimeFilter(args._timeFilter);
          if (parsed.days) params.days = parsed.days;
          if (parsed.startDate)
            params.startDate = parsed.startDate.toISOString();
          if (parsed.endDate) params.endDate = parsed.endDate.toISOString();
        }
      }
    }

    const map = {
      getMechanicActiveJobs: () => this.insight.getMechanicActiveJobs(userId),
      getMechanicPendingJobs: () => this.insight.getMechanicPendingJobs(userId),
      getMechanicPerformanceSummary: () =>
        this.insight.getMechanicPerformanceSummary(userId),
      getMechanicDailyHistory: () =>
        this.insight.getMechanicDailyHistory(userId, params.days || 7),
      getMechanicSpeedStats: () => this.insight.getMechanicSpeedStats(userId),
      getMechanicTopServices: () => this.insight.getMechanicTopServices(userId),
      getMechanicEarningsBreakdown: () =>
        this.insight.getMechanicEarningsBreakdown(userId, params.days || 30),
      getMechanicEfficiencyRank: () =>
        this.insight.getMechanicEfficiencyRank(userId),
      getMechanicWeeklyTrend: () =>
        this.insight.getMechanicWeeklyTrend(userId, params.days || 30),
      getCashierTodaySummary: () => this.insight.getCashierTodaySummary(userId),
      getCashierActiveShift: () => this.insight.getCashierActiveShift(userId),
      getCashierPendingOrders: () =>
        this.insight.getCashierPendingOrders(userId),
      getCashierDailyHistory: () =>
        this.insight.getCashierDailyHistory(userId, params.days || 7),
      getCashierCustomerStats: () =>
        this.insight.getCashierCustomerStats(userId),
      getCashierShiftHistory: () => this.insight.getCashierShiftHistory(userId),
      getCashierRecentTransactions: () =>
        this.insight.getCashierRecentTransactions(userId),
      getCashierComparisonStats: () =>
        this.insight.getCashierComparisonStats(userId),
      getAdminDashboardSnapshot: () => this.insight.getAdminDashboardSnapshot(),
      getAdminTodaySummary: () => this.insight.getAdminTodaySummary(),
      getAdminCashierPerformance: () =>
        this.insight.getAdminCashierPerformance(params),
      getAdminMechanicComparison: () =>
        this.insight.getAdminMechanicComparison(params),
      getAdminExpenseOverview: () => this.insight.getAdminExpenseOverview(),
      getAdminOrderStatusDistribution: () =>
        this.insight.getAdminOrderStatusDistribution(params),
      getAdminInventoryHealth: () => this.insight.getAdminInventoryHealth(),
      getAdminBusinessGrowth: () => this.insight.getAdminBusinessGrowth(),
      getAdminDailyNetReport: () => this.insight.getAdminDailyNetReport(params),
      getAdminTopSpareparts: () => this.insight.getAdminTopSpareparts(params),
      getAdminServicePopularity: () =>
        this.insight.getAdminServicePopularity(params),
      getAdminPeakHours: () => this.insight.getAdminPeakHours(params),
      getAdminVehicleDistribution: () =>
        this.insight.getAdminVehicleDistribution(),
      getAdminStockAlert: () => this.insight.getAdminStockAlert(),
      getAdminRefundStats: () => this.insight.getAdminRefundStats(params),
      getAdminRecentActivities: () => this.insight.getAdminRecentActivities(20),
      getAdminUnpaidOrders: () => this.insight.getAdminUnpaidOrders(),
      getAdminCustomerRetention: () => this.insight.getAdminCustomerRetention(),
      getAdminRevenueVsTarget: () => this.insight.getAdminRevenueVsTarget(),
      getAdminTopCustomersByVisit: () =>
        this.insight.getAdminTopCustomersByVisit(),
      getAdminOrderCompletionTime: () =>
        this.insight.getAdminOrderCompletionTime(),
      getAdminPaymentMethodDistribution: () =>
        this.insight.getAdminPaymentMethodDistribution(params),
      getAdminMechanicAvailability: () =>
        this.insight.getAdminMechanicAvailability(),
      getAdminMonthlyBusinessReview: () =>
        this.insight.getAdminMonthlyBusinessReview(params),
    };

    const fn = map[name];
    if (!fn) {
      logger.error("[AGENT] Unknown tool requested", { name });
      throw ApiError.badRequest({ message: `Tool '${name}' tidak dikenal.` });
    }

    try {
      const result = await fn();
      const formatted = this.#formatToolResult(name, result);
      logger.info("[AGENT] Tool call success", { name });
      return formatted;
    } catch (err) {
      if (err instanceof ApiError) throw err;
      logger.error("[AGENT] Tool call failed", { name, error: err.message });
      throw ApiError.internal({
        message: `Gagal mengambil data untuk '${name}'.`,
      });
    }
  }

  /**
   * Hash pertanyaan untuk deduplikasi cache
   * @param {string} message
   * @returns {string}
   * @private
   */
  #hashQuestion(message) {
    return crypto
      .createHash("sha256")
      .update(message.toLowerCase().trim().replace(/\s+/g, " "))
      .digest("hex")
      .slice(0, 16);
  }

  /**
   * Chat dengan AI agent
   * @param {string} userId
   * @param {string} message
   * @returns {Promise<{reply: string, toolCalls: Array, cached: boolean}>}
   */
  async chat(userId, message) {
    logger.info("[AGENT] Chat started", {
      userId,
      messagePreview: message.slice(0, 100),
    });

    const user = await this.user.findById(userId);
    if (!user) {
      logger.error("[AGENT] User not found", { userId });
      throw ApiError.notFound({ message: "User tidak ditemukan." });
    }

    logger.info("[AGENT] User loaded", {
      userId,
      role: user.role,
      name: user.fullName,
    });

    const qHash = this.#hashQuestion(message);
    const cachedReply = await this.qaCache.get(`${userId}:${qHash}`);
    if (cachedReply) {
      logger.info("[AGENT] Returning cached reply", { userId, qHash });
      return { reply: cachedReply, toolCalls: [], cached: true };
    }

    const systemPrompt = this.#buildSystemPrompt(user.role, user.fullName);
    const tools = this.#buildTools(user.role);
    const { max_tokens, temperature } = this.#getModelConfig(user.role);
    const cacheKey = `chat:${userId}`;
    let history = (await this.cache.get(cacheKey)) || [];

    history.push({ role: "user", content: message });

    try {
      logger.info("[AGENT] Sending request to OpenRouter...");
      const response = await axios.post(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          model: "meta-llama/llama-3.1-8b-instruct",
          messages: [
            { role: "system", content: systemPrompt },
            ...history.slice(-15),
          ],
          tools: tools.length ? tools : undefined,
          tool_choice: tools.length ? "auto" : undefined,
          max_tokens,
          temperature,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
          },
          timeout: 30000,
        }
      );

      const aiMessage = response.data.choices[0].message;
      const toolCalls = [];

      if (aiMessage.tool_calls?.length) {
        history.push(aiMessage);

        for (const tc of aiMessage.tool_calls) {
          try {
            const args = tc.function.arguments
              ? JSON.parse(tc.function.arguments)
              : {};
            const result = await this.#executeToolCall(
              tc.function.name,
              args,
              userId,
              user.role
            );
            toolCalls.push({ name: tc.function.name, result });
            history.push({
              role: "tool",
              tool_call_id: tc.id,
              content: JSON.stringify(result).slice(0, 2000),
            });
          } catch (toolErr) {
            logger.error("[AGENT] Tool execution error", {
              name: tc.function.name,
              error: toolErr.message,
            });
            const errorMsg =
              toolErr instanceof ApiError
                ? toolErr.message
                : `Gagal mengambil data: ${toolErr.message}`;
            history.push({
              role: "tool",
              tool_call_id: tc.id,
              content: JSON.stringify({ error: errorMsg }),
            });
          }
        }

        const finalResponse = await axios.post(
          "https://openrouter.ai/api/v1/chat/completions",
          {
            model: "meta-llama/llama-3.1-8b-instruct",
            messages: [
              { role: "system", content: systemPrompt },
              ...history.slice(-25),
            ],
            max_tokens,
            temperature,
          },
          {
            headers: {
              Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
              "Content-Type": "application/json",
            },
            timeout: 30000,
          }
        );

        const finalMessage = finalResponse.data.choices[0].message;
        history.push(finalMessage);
        await this.cache.set(cacheKey, history.slice(-25), 1800);
        await this.qaCache.set(`${userId}:${qHash}`, finalMessage.content, 600);

        return { reply: finalMessage.content, toolCalls, cached: false };
      }

      history.push(aiMessage);
      await this.cache.set(cacheKey, history.slice(-25), 1800);
      await this.qaCache.set(`${userId}:${qHash}`, aiMessage.content, 600);

      return { reply: aiMessage.content, toolCalls: [], cached: false };
    } catch (err) {
      if (err instanceof ApiError) throw err;
      logger.error("[AGENT] OpenRouter request failed", {
        error: err.message,
        status: err.response?.status,
      });
      throw ApiError.internal({
        message: "Gagal menghubungi AI service. Silakan coba lagi.",
      });
    }
  }
}

export default AgentService;
