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
   * Safe JSON parse dengan fallback
   * @param {string} str
   * @returns {Object}
   * @private
   */
  #safeJsonParse(str) {
    try {
      return JSON.parse(str);
    } catch {
      const cleaned = str.replace(/^[^{[]+/, "").replace(/[^}\]]+$/, "");
      try {
        return JSON.parse(cleaned);
      } catch {
        return {};
      }
    }
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
      "Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu",
    ];
    const months = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember",
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
      "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
      "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
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
        "createdAt", "updatedAt", "openedAt", "closedAt", "paidAt",
        "startAt", "endAt", "date", "lastOrderDate", "firstOrderDate",
        "lastVisit", "registeredAt", "last_visit", "completedAt",
        "weekStart", "week_start", "month",
      ];

      for (const key of Object.keys(obj)) {
        if (dateFields.includes(key) && obj[key]) {
          if (key === "weekStart" || key === "week_start" || key === "month") {
            obj[key] = this.#formatDateShort(obj[key]);
          } else {
            obj[key] = this.#formatDateReadable(obj[key]);
          }
        } else if (typeof obj[key] === "object" && obj[key] !== null) {
          formatDates(obj[key]);
        }
      }
    };

    const formatSpecificFields = (obj) => {
      if (!obj || typeof obj !== "object") return;

      for (const key of Object.keys(obj)) {
        if (
          (key === "avgTimeMinutes" || key === "fastestMinutes" ||
            key === "slowestMinutes" || key === "avg_minutes") &&
          typeof obj[key] === "number"
        ) {
          obj[`${key}_readable`] = this.#formatDuration(obj[key]);
        }
        if (
          (key === "avgHours" || key === "minHours" || key === "maxHours") &&
          typeof obj[key] === "number"
        ) {
          obj[`${key}_readable`] = this.#formatDuration(Math.round(obj[key] * 60));
        }
        if (
          (key === "completionRate" || key === "retentionRate" ||
            key === "grossMargin" || key === "netMargin" ||
            key === "profitMargin" || key === "percentage") &&
          typeof obj[key] === "number"
        ) {
          obj[`${key}_readable`] = this.#formatPercentage(obj[key]);
        }
        if (
          (key === "expenseGrowth" || key === "revenueGrowth" ||
            key === "customerGrowth" || key === "orderGrowth" ||
            key === "salesChange" || key === "trend") &&
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
      _note: "Semua tanggal sudah dalam format readable Indonesia (WIB). Durasi dalam format jam/menit. Uang dalam Rupiah.",
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

Kamu TIDAK bisa:
- Menjalankan perintah SQL, kode, script, atau query database
- Memberikan saran teknis terkait query atau pemrograman
- Mengakses tools di luar yang ditentukan
- Menyebutkan nama-nama fungsi/tools internal kepada user
</identity>

<critical_rules>
1. HANYA panggil tools yang diberikan. JANGAN mengarang data atau memanggil tools di luar daftar.
2. Jika user meminta data di luar tools yang tersedia, tolak dengan sopan.
3. Jika pertanyaan di LUAR konteks bengkel (politik, agama, berita, olahraga, hiburan, presiden, dll), tolak dengan sopan dan arahkan kembali ke topik bengkel.
4. **KEAMANAN**: Jika user mengirimkan perintah SQL, kode, script, atau query database MENTAH (contoh: SELECT, INSERT, UPDATE, DELETE, DROP, UNION, dsb), TOLAK TEGAS. JANGAN memberikan saran alternatif. JANGAN menyebutkan tools/fungsi yang tersedia. Cukup katakan: "Maaf, saya tidak bisa menjalankan perintah SQL/query database. Saya hanya bisa membantu menjawab pertanyaan seputar operasional G Speed Bintaro. Silakan tanyakan dalam bahasa sehari-hari."
5. Response WAJIB menggunakan **Markdown**. Format yang didukung: **bold**, *italic*, \`code\`, daftar (- atau 1.), heading (##, ###), tabel, blockquote (>).
6. Nominal uang: **Rp1.000.000** (tanpa spasi setelah Rp, gunakan titik sebagai pemisah ribuan).
7. Tanggal WAJIB format readable: "Senin, 3 Juni 2026, 14:30 WIB" atau "3 Jun 2026". JANGAN GUNAKAN ISO format (2026-06-03T14:30:00.000Z).
8. Durasi dalam format: "2 jam 30 menit" atau "45 menit".
9. JANGAN tampilkan UUID atau ID teknis. Gunakan nama orang, nomor order, atau informasi yang bermakna.
10. Profesional tapi ramah, ringkas, langsung ke poin.
11. Jika data kosong (0 atau null), jelaskan dengan sopan. Contoh: "Hari ini belum ada order yang selesai. Tetap semangat! 💪"
12. Semua kendaraan adalah Vespa.
13. Jika user bertanya hal yang tidak jelas, minta klarifikasi dengan ramah.
14. Gunakan emoji secukupnya untuk membuat percakapan lebih hidup.
15. Jika ada data yang mengkhawatirkan (stok habis, refund tinggi, growth turun), beri peringatan dengan sopan.
16. Jika ditanya "siapa kamu" atau sejenisnya, perkenalkan diri sebagai G-Speed Copilot.
17. Data yang kamu terima dari tools SUDAH dalam format readable. Gunakan langsung tanpa mengkonversi ulang.
18. **PENTING**: Tools untuk role CASHIER dan MECHANIC TIDAK memerlukan parameter ID. Cukup panggil tool tanpa parameter. Sistem akan otomatis mengambil data milik user yang sedang login.
</critical_rules>`;

    const rolePrompts = {
      ADMIN: `${base}

<role>ADMINISTRATOR — Pemilik/Pengelola Bengkel</role>
<nama>${userName}</nama>
<tanggal>${today}</tanggal>

<konteks_bisnis>
G Speed Bintaro adalah bengkel spesialis Vespa. Sebagai admin, Anda mengelola seluruh operasional: tim mekanik, kasir, inventori sparepart, keuangan, dan pertumbuhan bisnis. Data yang Anda lihat adalah data KOLEKTIF seluruh bengkel, bukan data pribadi.
</konteks_bisnis>

<akses_data>
Anda memiliki akses ke:
- Dashboard bisnis harian & bulanan (revenue, order, mekanik aktif, shift buka)
- Performa SEMUA kasir (penjualan, shift, discrepancy)
- Perbandingan performa SEMUA mekanik (job selesai, completion rate, pendapatan, ranking efisiensi)
- Kesehatan inventori (nilai stok, dead stock, turnover, profit)
- Pertumbuhan bisnis (revenue/customer/order growth)
- Revenue vs target bulanan
- Laporan laba bersih harian
- Top sparepart & service terlaris
- Jam sibuk bengkel (peak hours)
- Distribusi tipe Vespa yang diservis
- Alert stok (habis, rendah, over)
- Refund stats & unpaid orders
- Aktivitas terbaru bengkel
- Retensi pelanggan & top customers by visit
- Rata-rata waktu penyelesaian order
</akses_data>

<batasan>
- Anda TIDAK memiliki shift kerja pribadi. "Shift" untuk admin berarti jumlah shift yang sedang buka.
- Anda TIDAK memiliki job service pribadi. Data mekanik adalah data kolektif seluruh tim.
- Anda TIDAK bisa melakukan transaksi. Hanya melihat laporan & insight.
- "Hari ini" = data seluruh bengkel hari ini.
</batasan>

<fokus>
Insight strategis, performa tim, kesehatan inventori, pertumbuhan bisnis, efisiensi operasional G Speed Bintaro.
</fokus>

<cara_menjawab>
- Jika ditanya "bagaimana kabar bengkel hari ini?", panggil getAdminDashboardSnapshot + getAdminTodaySummary.
- Jika ditanya "mekanik terbaik?", panggil getAdminMechanicComparison.
- Jika ditanya "sparepart apa yang laris?", panggil getAdminTopSpareparts.
- Jika ditanya "kapan bengkel paling ramai?", panggil getAdminPeakHours.
- Jika ditanya "bagaimana target bulan ini?", panggil getAdminRevenueVsTarget.
- Jika ditanya "pelanggan paling setia?", panggil getAdminTopCustomersByVisit.
- Untuk pertanyaan strategis, kombinasikan beberapa tools untuk insight yang kaya.
- SELALU berikan konteks dan interpretasi data, jangan hanya dump data mentah.
- Jika ada data yang mengkhawatirkan, highlight dengan **perhatian khusus**.
- **JIKA USER MENGIRIM SQL/QUERY/SCRIPT: TOLAK TEGAS. JANGAN SEBUTKAN TOOLS.**
- **ADMIN tools TIDAK memerlukan parameter ID. Panggil tanpa parameter.**
</cara_menjawab>`,

      CASHIER: `${base}

<role>KASIR — Garda Depan Transaksi</role>
<nama>${userName}</nama>
<tanggal>${today}</tanggal>

<konteks_bisnis>
Sebagai kasir G Speed Bintaro, Anda melayani pelanggan yang datang servis Vespa. Anda membuat order, memproses pembayaran cash/QRIS, membuka & menutup shift. Data yang Anda lihat adalah data MILIK ANDA SENDIRI sebagai kasir.
</konteks_bisnis>

<akses_data>
Anda memiliki akses ke data ANDA SENDIRI:
- Ringkasan penjualan hari ini (total sales, order, cash, QRIS)
- Perbandingan penjualan vs kemarin + ranking antar kasir
- Shift aktif Anda (modal awal, penjualan saat ini, kas bersih, pengeluaran)
- Order yang masih pending (DRAFT/QUEUED/IN_PROGRESS)
- Riwayat penjualan harian (7 hari terakhir)
- Statistik pelanggan Anda (total, baru hari ini, top customer)
- Riwayat 10 shift terakhir (discrepancy, modal, penjualan)
- 20 transaksi terbaru
</akses_data>

<batasan>
- Anda HANYA bisa melihat data transaksi Anda sendiri.
- Anda TIDAK bisa melihat data mekanik (job, performa, pendapatan).
- Anda TIDAK bisa melihat data inventori atau stok sparepart.
- Anda TIDAK bisa melihat data kasir lain.
- "Shift aktif" = shift Anda sendiri yang sedang buka.
- Jika ditanya data di luar akses, tolak dengan sopan.
</batasan>

<fokus>
Penjualan hari ini, shift aktif, order pending, riwayat transaksi, pelayanan pelanggan.
</fokus>

<cara_menjawab>
- Jika ditanya "bagaimana penjualan saya hari ini?", panggil getCashierTodaySummary + getCashierComparisonStats.
- Jika ditanya "shift saya gimana?", panggil getCashierActiveShift.
- Jika ditanya "order yang belum selesai?", panggil getCashierPendingOrders.
- Jika ditanya "siapa pelanggan terbaik saya?", panggil getCashierCustomerStats.
- **PENTING: Tools kasir TIDAK memerlukan parameter. Cukup panggil tanpa parameter. Sistem otomatis mengambil data Anda.**
- SELALU gunakan data nyata dari tools. Jangan mengarang.
- Jika penjualan sepi, beri semangat. Jika ramai, apresiasi.
- **JIKA USER MENGIRIM SQL/QUERY/SCRIPT: TOLAK TEGAS. JANGAN SEBUTKAN TOOLS.**
</cara_menjawab>`,

      MECHANIC: `${base}

<role>MEKANIK — Jantung Operasional Bengkel</role>
<nama>${userName}</nama>
<tanggal>${today}</tanggal>

<konteks_bisnis>
Sebagai mekanik G Speed Bintaro, Anda mengerjakan service Vespa pelanggan. Setiap job di-assign ke Anda. Anda bisa mengerjakan beberapa job sekaligus (IN_PROGRESS) atau menunggu antrian (QUEUED). Performa Anda diukur dari job selesai, kecepatan kerja, dan pendapatan. Data yang Anda lihat adalah data MILIK ANDA SENDIRI.
</konteks_bisnis>

<akses_data>
Anda memiliki akses ke data ANDA SENDIRI:
- Job yang sedang dikerjakan (IN_PROGRESS) — termasuk plat nomor Vespa
- Job antrian (QUEUED) yang menunggu dikerjakan
- Ringkasan performa pribadi (job selesai hari ini/minggu ini/bulan ini + pendapatan)
- Riwayat kerja harian pribadi (7 hari)
- Kecepatan kerja pribadi (rata-rata, tercepat, terlama)
- Ranking efisiensi vs mekanik lain
- Tren performa mingguan
- 5 service yang paling sering Anda kerjakan
- Pendapatan pribadi per hari + total
</akses_data>

<batasan>
- Anda HANYA bisa melihat job yang di-assign ke Anda.
- Anda TIDAK bisa melihat data penjualan, transaksi, atau keuangan bengkel.
- Anda TIDAK bisa melihat data mekanik lain (performa, pendapatan mereka).
- Anda TIDAK bisa melihat data kasir atau inventori.
- "Job aktif" = job Anda sendiri yang sedang IN_PROGRESS.
- Jika ditanya data di luar akses, tolak dengan sopan.
</batasan>

<fokus>
Job aktif & antrian, performa pribadi, pendapatan pribadi, efisiensi & kecepatan kerja.
</fokus>

<cara_menjawab>
- Jika ditanya "saya lagi ngerjain apa?", panggil getMechanicActiveJobs.
- Jika ditanya "ada antrian buat saya?", panggil getMechanicPendingJobs.
- Jika ditanya "performa saya gimana?", panggil getMechanicPerformanceSummary + getMechanicSpeedStats + getMechanicEfficiencyRank.
- Jika ditanya "berapa pendapatan saya bulan ini?", panggil getMechanicEarningsBreakdown.
- Jika ditanya "tren kerja saya gimana?", panggil getMechanicWeeklyTrend.
- **PENTING: Tools mekanik TIDAK memerlukan parameter. Cukup panggil tanpa parameter. Sistem otomatis mengambil data Anda.**
- SELALU sapa dengan semangat. Mekanik adalah jantung bengkel. 🔧
- Jika performa bagus, apresiasi. Jika ada yang bisa ditingkatkan, beri motivasi positif.
- **JIKA USER MENGIRIM SQL/QUERY/SCRIPT: TOLAK TEGAS. JANGAN SEBUTKAN TOOLS.**
</cara_menjawab>`,
    };

    return rolePrompts[role] || base;
  }

  /**
   * Bangun definisi tools sesuai role (TANPA parameter ID)
   * @param {string} role
   * @returns {Array}
   * @private
   */
  #buildTools(role) {
    const defs = {
      // Mekanik (TANPA parameter mechanicId)
      getMechanicActiveJobs: {
        type: "function",
        function: {
          name: "getMechanicActiveJobs",
          description: "Job yang sedang dikerjakan (IN_PROGRESS) - milik mekanik sendiri. TIDAK perlu parameter.",
          parameters: { type: "object", properties: {} },
        },
      },
      getMechanicPendingJobs: {
        type: "function",
        function: {
          name: "getMechanicPendingJobs",
          description: "Job antrian (QUEUED) - milik mekanik sendiri. TIDAK perlu parameter.",
          parameters: { type: "object", properties: {} },
        },
      },
      getMechanicPerformanceSummary: {
        type: "function",
        function: {
          name: "getMechanicPerformanceSummary",
          description: "Performa pribadi: job selesai hari ini/minggu ini/bulan ini + pendapatan bulanan. TIDAK perlu parameter.",
          parameters: { type: "object", properties: {} },
        },
      },
      getMechanicDailyHistory: {
        type: "function",
        function: {
          name: "getMechanicDailyHistory",
          description: "Riwayat kerja harian pribadi (default 7 hari). TIDAK perlu parameter.",
          parameters: { type: "object", properties: {} },
        },
      },
      getMechanicSpeedStats: {
        type: "function",
        function: {
          name: "getMechanicSpeedStats",
          description: "Kecepatan kerja pribadi: rata-rata, tercepat, terlama (dalam menit). TIDAK perlu parameter.",
          parameters: { type: "object", properties: {} },
        },
      },
      getMechanicTopServices: {
        type: "function",
        function: {
          name: "getMechanicTopServices",
          description: "5 service yang paling sering dikerjakan pribadi. TIDAK perlu parameter.",
          parameters: { type: "object", properties: {} },
        },
      },
      getMechanicEarningsBreakdown: {
        type: "function",
        function: {
          name: "getMechanicEarningsBreakdown",
          description: "Pendapatan pribadi per hari + total + rata-rata per hari (default 30 hari). TIDAK perlu parameter.",
          parameters: { type: "object", properties: {} },
        },
      },
      getMechanicEfficiencyRank: {
        type: "function",
        function: {
          name: "getMechanicEfficiencyRank",
          description: "Ranking efisiensi pribadi vs semua mekanik lain. TIDAK perlu parameter.",
          parameters: { type: "object", properties: {} },
        },
      },
      getMechanicWeeklyTrend: {
        type: "function",
        function: {
          name: "getMechanicWeeklyTrend",
          description: "Tren performa mingguan. TIDAK perlu parameter.",
          parameters: { type: "object", properties: {} },
        },
      },
      // Kasir (TANPA parameter cashierId)
      getCashierTodaySummary: {
        type: "function",
        function: {
          name: "getCashierTodaySummary",
          description: "Ringkasan penjualan hari ini: total sales, jumlah order, cash, QRIS. TIDAK perlu parameter.",
          parameters: { type: "object", properties: {} },
        },
      },
      getCashierActiveShift: {
        type: "function",
        function: {
          name: "getCashierActiveShift",
          description: "Shift aktif: modal awal, penjualan saat ini, kas bersih, pengeluaran. TIDAK perlu parameter.",
          parameters: { type: "object", properties: {} },
        },
      },
      getCashierPendingOrders: {
        type: "function",
        function: {
          name: "getCashierPendingOrders",
          description: "Order pending: jumlah per status (DRAFT/QUEUED/IN_PROGRESS). TIDAK perlu parameter.",
          parameters: { type: "object", properties: {} },
        },
      },
      getCashierDailyHistory: {
        type: "function",
        function: {
          name: "getCashierDailyHistory",
          description: "Riwayat penjualan harian (default 7 hari). TIDAK perlu parameter.",
          parameters: { type: "object", properties: {} },
        },
      },
      getCashierCustomerStats: {
        type: "function",
        function: {
          name: "getCashierCustomerStats",
          description: "Statistik pelanggan: total, baru hari ini, top customer. TIDAK perlu parameter.",
          parameters: { type: "object", properties: {} },
        },
      },
      getCashierShiftHistory: {
        type: "function",
        function: {
          name: "getCashierShiftHistory",
          description: "10 shift terakhir: discrepancy, modal, penjualan, rata-rata selisih. TIDAK perlu parameter.",
          parameters: { type: "object", properties: {} },
        },
      },
      getCashierRecentTransactions: {
        type: "function",
        function: {
          name: "getCashierRecentTransactions",
          description: "20 transaksi terbaru. TIDAK perlu parameter.",
          parameters: { type: "object", properties: {} },
        },
      },
      getCashierComparisonStats: {
        type: "function",
        function: {
          name: "getCashierComparisonStats",
          description: "Perbandingan penjualan hari ini vs kemarin + ranking. TIDAK perlu parameter.",
          parameters: { type: "object", properties: {} },
        },
      },
      // Admin (tetap tanpa parameter ID)
      getAdminDashboardSnapshot: {
        type: "function",
        function: {
          name: "getAdminDashboardSnapshot",
          description: "Dashboard bengkel: revenue harian & bulanan, mekanik aktif, shift buka, stok rendah.",
          parameters: { type: "object", properties: {} },
        },
      },
      getAdminTodaySummary: {
        type: "function",
        function: {
          name: "getAdminTodaySummary",
          description: "Ringkasan bisnis hari ini: revenue, jumlah order, rata-rata order, top product.",
          parameters: { type: "object", properties: {} },
        },
      },
      getAdminCashierPerformance: {
        type: "function",
        function: {
          name: "getAdminCashierPerformance",
          description: "Performa SEMUA kasir: jumlah shift, total penjualan, rata-rata selisih (default 30 hari).",
          parameters: { type: "object", properties: {} },
        },
      },
      getAdminMechanicComparison: {
        type: "function",
        function: {
          name: "getAdminMechanicComparison",
          description: "Perbandingan SEMUA mekanik: total job, job selesai, completion rate, pendapatan (default 30 hari).",
          parameters: { type: "object", properties: {} },
        },
      },
      getAdminExpenseOverview: {
        type: "function",
        function: {
          name: "getAdminExpenseOverview",
          description: "Pengeluaran bulan ini: total, kategori terbesar, growth vs bulan lalu.",
          parameters: { type: "object", properties: {} },
        },
      },
      getAdminOrderStatusDistribution: {
        type: "function",
        function: {
          name: "getAdminOrderStatusDistribution",
          description: "Distribusi status SEMUA order (default 30 hari): jumlah & persentase per status.",
          parameters: { type: "object", properties: {} },
        },
      },
      getAdminInventoryHealth: {
        type: "function",
        function: {
          name: "getAdminInventoryHealth",
          description: "Kesehatan inventori: total nilai stok, dead stock, turnover rate, produk paling profitable.",
          parameters: { type: "object", properties: {} },
        },
      },
      getAdminBusinessGrowth: {
        type: "function",
        function: {
          name: "getAdminBusinessGrowth",
          description: "Pertumbuhan bisnis bulan ini vs bulan lalu: revenue growth, customer growth, order growth (%).",
          parameters: { type: "object", properties: {} },
        },
      },
      getAdminDailyNetReport: {
        type: "function",
        function: {
          name: "getAdminDailyNetReport",
          description: "Laporan laba bersih harian: revenue, expenses, net per hari (default 7 hari).",
          parameters: { type: "object", properties: {} },
        },
      },
      getAdminTopSpareparts: {
        type: "function",
        function: {
          name: "getAdminTopSpareparts",
          description: "10 sparepart terlaris: jumlah terjual, revenue, profit (default 30 hari).",
          parameters: { type: "object", properties: {} },
        },
      },
      getAdminServicePopularity: {
        type: "function",
        function: {
          name: "getAdminServicePopularity",
          description: "10 service terpopuler: jumlah order, quantity, revenue (default 30 hari).",
          parameters: { type: "object", properties: {} },
        },
      },
      getAdminPeakHours: {
        type: "function",
        function: {
          name: "getAdminPeakHours",
          description: "Jam tersibuk bengkel: distribusi order & revenue per jam + jam puncak (default 30 hari).",
          parameters: { type: "object", properties: {} },
        },
      },
      getAdminVehicleDistribution: {
        type: "function",
        function: {
          name: "getAdminVehicleDistribution",
          description: "Distribusi tipe Vespa yang diservis di bengkel (berdasarkan brand).",
          parameters: { type: "object", properties: {} },
        },
      },
      getAdminStockAlert: {
        type: "function",
        function: {
          name: "getAdminStockAlert",
          description: "Alert stok: sparepart habis (0), stok rendah (1-5), stok berlebih (50+).",
          parameters: { type: "object", properties: {} },
        },
      },
      getAdminRefundStats: {
        type: "function",
        function: {
          name: "getAdminRefundStats",
          description: "Statistik refund: jumlah & total refund (default 30 hari).",
          parameters: { type: "object", properties: {} },
        },
      },
      getAdminRecentActivities: {
        type: "function",
        function: {
          name: "getAdminRecentActivities",
          description: "Aktivitas terbaru bengkel: order, expense, shift closing (default 20).",
          parameters: { type: "object", properties: {} },
        },
      },
      getAdminUnpaidOrders: {
        type: "function",
        function: {
          name: "getAdminUnpaidOrders",
          description: "Order COMPLETED/CLOSED yang belum dibayar.",
          parameters: { type: "object", properties: {} },
        },
      },
      getAdminCustomerRetention: {
        type: "function",
        function: {
          name: "getAdminCustomerRetention",
          description: "Retensi pelanggan 3 bulan terakhir: pelanggan baru vs kembali per bulan + retention rate.",
          parameters: { type: "object", properties: {} },
        },
      },
      getAdminRevenueVsTarget: {
        type: "function",
        function: {
          name: "getAdminRevenueVsTarget",
          description: "Revenue bulan ini vs target: persentase tercapai, sisa yang harus dicapai, hari tersisa.",
          parameters: { type: "object", properties: {} },
        },
      },
      getAdminTopCustomersByVisit: {
        type: "function",
        function: {
          name: "getAdminTopCustomersByVisit",
          description: "10 pelanggan paling sering berkunjung: total kunjungan, total belanja, kunjungan terakhir.",
          parameters: { type: "object", properties: {} },
        },
      },
      getAdminOrderCompletionTime: {
        type: "function",
        function: {
          name: "getAdminOrderCompletionTime",
          description: "Rata-rata waktu penyelesaian order: rata-rata, tercepat, terlama (dalam jam).",
          parameters: { type: "object", properties: {} },
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
   * Eksekusi tool call dari AI - ID di-inject otomatis
   * @param {string} name
   * @param {string} userId - ID user dari auth
   * @param {string} role
   * @returns {Promise<any>}
   * @private
   */
  async #executeToolCall(name, userId, role) {
    if (!this.#isToolAllowed(name, role)) {
      logger.warn("[AGENT] Tool access denied", { name, role, userId });
      throw ApiError.forbidden({
        message: `Tool '${name}' tidak diizinkan untuk role '${role}'.`,
      });
    }

    logger.info("[AGENT] Executing tool call", { name, userId });

    const map = {
      // Mekanik - ID di-inject otomatis
      getMechanicActiveJobs: () => this.insight.getMechanicActiveJobs(userId),
      getMechanicPendingJobs: () => this.insight.getMechanicPendingJobs(userId),
      getMechanicPerformanceSummary: () => this.insight.getMechanicPerformanceSummary(userId),
      getMechanicDailyHistory: () => this.insight.getMechanicDailyHistory(userId, 7),
      getMechanicSpeedStats: () => this.insight.getMechanicSpeedStats(userId),
      getMechanicTopServices: () => this.insight.getMechanicTopServices(userId),
      getMechanicEarningsBreakdown: () => this.insight.getMechanicEarningsBreakdown(userId, 30),
      getMechanicEfficiencyRank: () => this.insight.getMechanicEfficiencyRank(userId),
      getMechanicWeeklyTrend: () => this.insight.getMechanicWeeklyTrend(userId, 30),
      // Kasir - ID di-inject otomatis
      getCashierTodaySummary: () => this.insight.getCashierTodaySummary(userId),
      getCashierActiveShift: () => this.insight.getCashierActiveShift(userId),
      getCashierPendingOrders: () => this.insight.getCashierPendingOrders(userId),
      getCashierDailyHistory: () => this.insight.getCashierDailyHistory(userId, 7),
      getCashierCustomerStats: () => this.insight.getCashierCustomerStats(userId),
      getCashierShiftHistory: () => this.insight.getCashierShiftHistory(userId),
      getCashierRecentTransactions: () => this.insight.getCashierRecentTransactions(userId),
      getCashierComparisonStats: () => this.insight.getCashierComparisonStats(userId),
      // Admin - tidak perlu ID
      getAdminDashboardSnapshot: () => this.insight.getAdminDashboardSnapshot(),
      getAdminTodaySummary: () => this.insight.getAdminTodaySummary(),
      getAdminCashierPerformance: () => this.insight.getAdminCashierPerformance(30),
      getAdminMechanicComparison: () => this.insight.getAdminMechanicComparison(30),
      getAdminExpenseOverview: () => this.insight.getAdminExpenseOverview(),
      getAdminOrderStatusDistribution: () => this.insight.getAdminOrderStatusDistribution(30),
      getAdminInventoryHealth: () => this.insight.getAdminInventoryHealth(),
      getAdminBusinessGrowth: () => this.insight.getAdminBusinessGrowth(),
      getAdminDailyNetReport: () => this.insight.getAdminDailyNetReport(7),
      getAdminTopSpareparts: () => this.insight.getAdminTopSpareparts(30),
      getAdminServicePopularity: () => this.insight.getAdminServicePopularity(30),
      getAdminPeakHours: () => this.insight.getAdminPeakHours(30),
      getAdminVehicleDistribution: () => this.insight.getAdminVehicleDistribution(),
      getAdminStockAlert: () => this.insight.getAdminStockAlert(),
      getAdminRefundStats: () => this.insight.getAdminRefundStats(30),
      getAdminRecentActivities: () => this.insight.getAdminRecentActivities(20),
      getAdminUnpaidOrders: () => this.insight.getAdminUnpaidOrders(),
      getAdminCustomerRetention: () => this.insight.getAdminCustomerRetention(),
      getAdminRevenueVsTarget: () => this.insight.getAdminRevenueVsTarget(),
      getAdminTopCustomersByVisit: () => this.insight.getAdminTopCustomersByVisit(),
      getAdminOrderCompletionTime: () => this.insight.getAdminOrderCompletionTime(),
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
   * @param {string} userId - ID user dari auth
   * @param {string} message
   * @returns {Promise<{reply: string, toolCalls: Array, cached: boolean}>}
   * @throws {ApiError}
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

    logger.info("[AGENT] Config loaded", {
      role: user.role,
      toolsCount: tools.length,
      max_tokens,
      temperature,
      historyLength: history.length,
    });

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
        logger.info("[AGENT] Processing tool calls", {
          count: aiMessage.tool_calls.length,
        });
        history.push(aiMessage);

        for (const tc of aiMessage.tool_calls) {
          try {
            const result = await this.#executeToolCall(
              tc.function.name,
              userId, // Inject ID dari auth
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

        logger.info("[AGENT] Sending final request to OpenRouter...");
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

        logger.info("[AGENT] Final response sent", {
          replyPreview: finalMessage.content?.slice(0, 150),
        });
        return { reply: finalMessage.content, toolCalls, cached: false };
      }

      history.push(aiMessage);
      await this.cache.set(cacheKey, history.slice(-25), 1800);
      await this.qaCache.set(`${userId}:${qHash}`, aiMessage.content, 600);

      logger.info("[AGENT] Response sent (no tool calls)", {
        replyPreview: aiMessage.content?.slice(0, 150),
      });
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