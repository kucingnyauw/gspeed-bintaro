/**
 * Utility class untuk formatting tanggal, waktu, dan durasi
 * Semua output dalam bahasa Indonesia
 */
export default class DateTime {
  /**
   * Format tanggal ke string lengkap (hari, tanggal, jam)
   * @param {Date|string} date
   * @returns {string}
   * @example "Senin, 24 Mei 2026, 14:30"
   */
  static toFullID(date) {
    if (!date) return "-";
    return new Date(date).toLocaleString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  /**
   * Format tanggal saja (tanpa hari dan jam)
   * @param {Date|string} date
   * @returns {string}
   * @example "24 Mei 2026"
   */
  static toDateID(date) {
    if (!date) return "-";
    return new Date(date).toLocaleString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  /**
   * Format waktu saja
   * @param {Date|string} date
   * @returns {string}
   * @example "14:30"
   */
  static toTimeID(date) {
    if (!date) return "-";
    return new Date(date).toLocaleString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  /**
   * Format tanggal pendek (DD/MM/YYYY)
   * @param {Date|string} date
   * @returns {string}
   * @example "24/05/2026"
   */
  static toShortDate(date) {
    if (!date) return "-";
    const d = new Date(date);
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  }

  /**
   * Format tanggal ISO (YYYY-MM-DD)
   * @param {Date|string} date
   * @returns {string}
   * @example "2026-05-24"
   */
  static toISODate(date) {
    if (!date) return "-";
    const d = new Date(date);
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${yyyy}-${mm}-${dd}`;
  }

  /**
   * Format tanggal ISO DateTime (YYYY-MM-DD HH:MM:SS)
   * @param {Date|string} date
   * @returns {string}
   * @example "2026-05-24 14:30:00"
   */
  static toISODateTime(date) {
    if (!date) return "-";
    const d = new Date(date);
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    const ss = String(d.getSeconds()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
  }

  /**
   * Format tanggal relatif dari sekarang
   * @param {Date|string} date
   * @returns {string}
   * @example "Baru saja", "2 jam yang lalu", "3 hari yang lalu"
   */
  static toRelative(date) {
    if (!date) return "-";
    const now = new Date();
    const then = new Date(date);
    const diffMs = now - then;
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);

    if (diffSeconds < 60) return "Baru saja";
    if (diffMinutes < 60) return `${diffMinutes} menit yang lalu`;
    if (diffHours < 24) return `${diffHours} jam yang lalu`;
    if (diffDays < 7) return `${diffDays} hari yang lalu`;
    if (diffWeeks < 4) return `${diffWeeks} minggu yang lalu`;
    if (diffMonths < 12) return `${diffMonths} bulan yang lalu`;
    return `${diffYears} tahun yang lalu`;
  }

  /**
   * Format durasi antara dua tanggal (lengkap)
   * @param {Date|string} startDate
   * @param {Date|string} endDate
   * @returns {string}
   * @example "2 jam 30 menit", "45 menit", "30 detik"
   */
  static toDuration(startDate, endDate) {
    if (!startDate || !endDate) return "-";
    const diff = new Date(endDate) - new Date(startDate);
    if (diff < 0) return "-";

    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);

    const parts = [];
    if (hours > 0) parts.push(`${hours} jam`);
    if (minutes > 0) parts.push(`${minutes} menit`);
    if (seconds > 0 && parts.length === 0) parts.push(`${seconds} detik`);

    return parts.length > 0 ? parts.join(" ") : "0 detik";
  }

  /**
   * Format durasi pendek (tanpa detik)
   * @param {Date|string} startDate
   * @param {Date|string} endDate
   * @returns {string}
   * @example "2j 30m", "45m"
   */
  static toShortDuration(startDate, endDate) {
    if (!startDate || !endDate) return "-";
    const diff = new Date(endDate) - new Date(startDate);
    if (diff < 0) return "-";

    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);

    const parts = [];
    if (hours > 0) parts.push(`${hours}j`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (parts.length === 0) parts.push("0m");

    return parts.join(" ");
  }

  /**
   * Nama hari dalam bahasa Indonesia
   * @param {Date|string} date
   * @returns {string}
   * @example "Senin"
   */
  static getDayName(date) {
    if (!date) return "-";
    const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    return days[new Date(date).getDay()];
  }

  /**
   * Nama bulan dalam bahasa Indonesia
   * @param {Date|string} date
   * @returns {string}
   * @example "Januari"
   */
  static getMonthName(date) {
    if (!date) return "-";
    const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    return months[new Date(date).getMonth()];
  }

  /**
   * Cek apakah tanggal adalah hari ini
   * @param {Date|string} date
   * @returns {boolean}
   */
  static isToday(date) {
    if (!date) return false;
    const now = new Date();
    const then = new Date(date);
    return now.getFullYear() === then.getFullYear() && now.getMonth() === then.getMonth() && now.getDate() === then.getDate();
  }

  /**
   * Cek apakah tanggal adalah kemarin
   * @param {Date|string} date
   * @returns {boolean}
   */
  static isYesterday(date) {
    if (!date) return false;
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const then = new Date(date);
    return yesterday.getFullYear() === then.getFullYear() && yesterday.getMonth() === then.getMonth() && yesterday.getDate() === then.getDate();
  }

  /**
   * Format tanggal cerdas (Hari ini/Kemarin/tanggal lengkap)
   * @param {Date|string} date
   * @returns {string}
   * @example "Hari ini, 14:30", "Kemarin, 14:30", "24 Mei 2026, 14:30"
   */
  static toSmartDate(date) {
    if (!date) return "-";
    const time = DateTime.toTimeID(date);
    if (DateTime.isToday(date)) return `Hari ini, ${time}`;
    if (DateTime.isYesterday(date)) return `Kemarin, ${time}`;
    return `${DateTime.toDateID(date)}, ${time}`;
  }

  /**
   * Format tanggal untuk nama file
   * @param {Date|string} date
   * @returns {string}
   * @example "20260524_143000"
   */
  static toFileName(date) {
    if (!date) return "-";
    const d = new Date(date);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    const ss = String(d.getSeconds()).padStart(2, "0");
    return `${yyyy}${mm}${dd}_${hh}${min}${ss}`;
  }

  /**
   * Waktu kadaluarsa (default +15 menit dari sekarang)
   * @param {number} [minutes=15]
   * @returns {{iso: string, formatted: string}}
   * @example { iso: "2026-06-01T13:15:00.000Z", formatted: "01/06/2026, 20:15:00 WIB" }
   */
  static getExpiryTime(minutes = 15) {
    const expiryTime = new Date();
    expiryTime.setMinutes(expiryTime.getMinutes() + minutes);
    const formatted = expiryTime.toLocaleString("id-ID", {
      timeZone: "Asia/Jakarta",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
    return { iso: expiryTime.toISOString(), formatted: `${formatted} WIB` };
  }
}