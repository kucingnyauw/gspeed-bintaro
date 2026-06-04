/**
 * Invoice - PDF invoice document component with professional minimalist receipt layout.
 * Menampilkan detail pembayaran, item pesanan, perhitungan pajak, dan informasi pelanggan.
 *
 * @component
 * @param {Object} props - Component props
 * @param {Object} props.data - Invoice data dari payment
 * @param {string} props.data.id - Payment ID
 * @param {string} props.data.method - Metode pembayaran (CASH/QRIS)
 * @param {number} props.data.amountPaid - Jumlah yang dibayarkan
 * @param {number} props.data.change - Kembalian
 * @param {string} props.data.status - Status pembayaran (PAID/PENDING)
 * @param {string} props.data.paidAt - Waktu pembayaran
 * @param {string} props.data.statusLabel - Label status (Lunas/Menunggu)
 * @param {Object} props.data.order - Data pesanan terkait
 */
import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import {
  formatToIdr,
  formatDate,
  formatTime,
  formatDateTimeFull,
} from "@shared/utils";

import INFO from "@data/Info.js";

/** @type {string} Warna hitam utama */
const COLOR_BLACK = "#09090B";
/** @type {string} Warna teks gelap */
const COLOR_DARK = "#27272A";
/** @type {string} Warna teks muted */
const COLOR_MUTED = "#71717A";
/** @type {string} Warna border */
const COLOR_BORDER = "#E4E4E7";
/** @type {string} Warna aksen ungu */
const COLOR_PURPLE = "#7C3AED";
/** @type {string} Warna sukses */
const COLOR_SUCCESS = "#059669";
/** @type {string} Warna warning */
const COLOR_WARNING = "#F59E0B";
/** @type {string} Warna error */
const COLOR_ERROR = "#EF4444";

/**
 * StyleSheet untuk komponen Invoice PDF.
 * Menggunakan layout A4 dengan margin 36pt.
 */
const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontFamily: "Helvetica",
    fontSize: 9,
    color: COLOR_DARK,
    lineHeight: 1.5,
    backgroundColor: "#ffffff",
    position: "relative",
  },
  textBold: { fontFamily: "Helvetica-Bold", color: COLOR_BLACK },
  textMuted: { color: COLOR_MUTED, fontSize: 8 },
  textPurple: { color: COLOR_PURPLE },
  textSuccess: { color: COLOR_SUCCESS },
  row: { flexDirection: "row" },
  spaceBetween: { flexDirection: "row", justifyContent: "space-between" },

  // Watermark - Centered di tengah halaman
  watermarkLayer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.04,
    transform: "rotate(-20deg)",
  },
  watermarkText: {
    fontSize: 80,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 16,
    color: COLOR_PURPLE,
    textTransform: "uppercase",
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  logo: { width: 44, height: 44 },
  brandName: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: COLOR_BLACK,
    letterSpacing: 0.5,
  },
  brandDesc: { fontSize: 7, color: COLOR_MUTED, marginTop: 2 },
  receiptBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: COLOR_PURPLE,
  },
  receiptTitle: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: COLOR_PURPLE,
    textTransform: "uppercase",
    letterSpacing: 2,
  },

  // Store Info
  storeInfo: {
    fontSize: 8,
    color: COLOR_MUTED,
    lineHeight: 1.6,
    width: "55%",
  },
  metaContainer: {
    width: "42%",
    alignItems: "flex-end",
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    marginBottom: 3,
  },
  metaLabel: {
    fontSize: 7,
    color: COLOR_MUTED,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  metaValue: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: COLOR_DARK,
  },

  // Divider
  divider: {
    borderTopWidth: 0.5,
    borderTopColor: COLOR_BORDER,
    marginVertical: 10,
  },

  // Customer & Vehicle
  infoSection: {
    flexDirection: "row",
    marginTop: 8,
    marginBottom: 8,
    paddingTop: 10,
    borderTopWidth: 0.5,
    borderTopColor: COLOR_BORDER,
    gap: 20,
  },
  infoCol: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 7,
    color: COLOR_MUTED,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  infoValue: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: COLOR_DARK,
  },
  infoSub: {
    fontSize: 7,
    color: COLOR_MUTED,
    marginTop: 2,
  },

  // Table
  tableHeader: {
    flexDirection: "row",
    paddingVertical: 8,
    borderBottomWidth: 1.5,
    borderBottomColor: COLOR_BLACK,
    marginTop: 8,
    backgroundColor: "#FAFAFA",
  },
  th: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    color: COLOR_MUTED,
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: COLOR_BORDER,
    alignItems: "center",
  },
  colDesc: { flex: 1.2, paddingRight: 8 },
  colQty: { width: "8%", textAlign: "center" },
  colPrice: { width: "22%", textAlign: "right" },
  colTotal: { width: "22%", textAlign: "right" },
  itemName: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    marginBottom: 2,
  },
  itemType: {
    fontSize: 7,
    color: COLOR_MUTED,
  },
  itemMechanic: {
    fontSize: 7,
    color: COLOR_MUTED,
    fontStyle: "italic",
  },

  // Summary
  summarySection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 24,
    gap: 20,
  },
  paymentCol: {
    width: "48%",
  },
  calcCol: {
    width: "48%",
  },
  sectionTitle: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: COLOR_MUTED,
    marginBottom: 8,
  },
  paymentRow: {
    flexDirection: "row",
    marginBottom: 6,
    alignItems: "center",
  },
  paymentLabel: {
    width: 65,
    fontSize: 8,
    color: COLOR_MUTED,
  },
  paymentValue: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 3,
    alignSelf: "flex-start",
  },
  statusBadgePaid: {
    backgroundColor: "#ECFDF5",
    borderWidth: 0.5,
    borderColor: "#A7F3D0",
  },
  statusBadgePending: {
    backgroundColor: "#FFFBEB",
    borderWidth: 0.5,
    borderColor: "#FCD34D",
  },
  statusBadgeRefunded: {
    backgroundColor: "#FEF2F2",
    borderWidth: 0.5,
    borderColor: "#FECACA",
  },
  statusText: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
  },
  calcRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  calcLabel: {
    fontSize: 8,
    color: COLOR_MUTED,
  },
  calcValue: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
  },
  calcTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    marginTop: 4,
    borderTopWidth: 1.5,
    borderTopColor: COLOR_BLACK,
    borderBottomWidth: 1.5,
    borderBottomColor: COLOR_BLACK,
  },
  calcTotalLabel: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: COLOR_BLACK,
  },
  calcTotalValue: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: COLOR_PURPLE,
  },
  calcPaymentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    marginTop: 6,
  },

  // Footer
  footer: {
    position: "absolute",
    bottom: 40,
    left: 40,
    right: 40,
    textAlign: "center",
    alignItems: "center",
  },
  footerText: {
    fontSize: 7,
    color: COLOR_MUTED,
    lineHeight: 1.6,
    textAlign: "center",
  },
  thankYou: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: COLOR_PURPLE,
    marginBottom: 6,
    textAlign: "center",
    letterSpacing: 1,
  },
});

/**
 * Mendapatkan style status badge berdasarkan status pembayaran.
 * @param {string} status - Status pembayaran
 * @returns {Object} Style object untuk badge
 */
const getStatusBadgeStyle = (status) => {
  switch (status) {
    case "PAID":
      return styles.statusBadgePaid;
    case "PENDING":
      return styles.statusBadgePending;
    case "REFUNDED":
      return styles.statusBadgeRefunded;
    default:
      return styles.statusBadgePending;
  }
};

/**
 * Mendapatkan warna teks berdasarkan status pembayaran.
 * @param {string} status - Status pembayaran
 * @returns {string} Kode warna hex
 */
const getStatusColor = (status) => {
  switch (status) {
    case "PAID":
      return COLOR_SUCCESS;
    case "PENDING":
      return COLOR_WARNING;
    case "REFUNDED":
      return COLOR_ERROR;
    default:
      return COLOR_MUTED;
  }
};

/**
 * Komponen Invoice PDF untuk mencetak struk pembayaran.
 *
 * Fitur:
 * - Watermark "LUNAS" centered di tengah halaman (hanya jika PAID)
 * - Header dengan logo toko dan badge INVOICE
 * - Informasi toko, nomor order, tanggal, dan kasir
 * - Informasi pelanggan dan kendaraan
 * - Tabel item dengan nama, tipe, mekanik, quantity, harga, dan subtotal
 * - Ringkasan pembayaran (metode, status badge, waktu bayar)
 * - Kalkulasi (subtotal, pajak hanya jika > 0, total, dibayar, kembalian)
 * - Footer dengan ucapan terima kasih
 *
 * @param {Object} props - Props komponen
 * @param {Object} props.data - Data pembayaran lengkap
 * @returns {JSX.Element} Document PDF invoice
 */
const Invoice = ({ data }) => {
  if (!data) return null;

  const { order, method, amountPaid, change, paidAt, status, statusLabel } = data;
  const {
    orderNumber,
    cashier,
    customer,
    vehicle,
    items,
    subtotal,
    tax,
    taxRate,
    total,
    createdAt,
  } = order || {};

  /**
   * Map metode pembayaran ke label bahasa Indonesia.
   * @type {Object<string, string>}
   */
  const paymentMethods = {
    CASH: "Tunai",
    QRIS: "QRIS",
  };

  /** @type {boolean} Apakah pembayaran sudah lunas */
  const isPaid = status === "PAID";

  /** @type {boolean} Apakah ada pajak yang perlu ditampilkan */
  const hasTax = tax > 0 || taxRate > 0;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* WATERMARK - Centered */}
        {isPaid && (
          <View style={styles.watermarkLayer} fixed>
            <Text style={styles.watermarkText}>LUNAS</Text>
          </View>
        )}

        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {INFO.logoUrl && <Image src={INFO.logoUrl} style={styles.logo} />}
            <View>
              <Text style={styles.brandName}>{INFO.name || "G-Speed"}</Text>
              <Text style={styles.brandDesc}>
                {INFO.descriptions || "Bengkel Motor Spesialis Vespa"}
              </Text>
            </View>
          </View>
          <View style={styles.receiptBadge}>
            <Text style={styles.receiptTitle}>INVOICE</Text>
          </View>
        </View>

        {/* STORE INFO + META */}
        <View style={styles.spaceBetween}>
          <Text style={styles.storeInfo}>
            {INFO.address}
            {"\n"}Telp: {INFO.phone}
          </Text>
          <View style={styles.metaContainer}>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>No. Order</Text>
              <Text style={styles.metaValue}>{orderNumber || "-"}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Tanggal</Text>
              <Text style={styles.metaValue}>
                {formatDate(createdAt)} {formatTime(createdAt)}
              </Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Kasir</Text>
              <Text style={styles.metaValue}>{cashier?.fullName || "-"}</Text>
            </View>
          </View>
        </View>

        {/* CUSTOMER & VEHICLE */}
        <View style={styles.infoSection}>
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>Pelanggan</Text>
            <Text style={styles.infoValue}>
              {customer?.name || "Pelanggan Umum"}
            </Text>
            {customer?.phone && (
              <Text style={styles.infoSub}>{customer.phone}</Text>
            )}
          </View>
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>Kendaraan</Text>
            <Text style={styles.infoValue}>
              {vehicle?.plateNumber || "-"}
            </Text>
            {vehicle && (
              <Text style={styles.infoSub}>
                {vehicle.brand} {vehicle.model || ""}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.divider} />

        {/* ITEMS TABLE */}
        <View style={styles.tableHeader}>
          <Text style={[styles.th, styles.colDesc]}>Deskripsi</Text>
          <Text style={[styles.th, styles.colQty]}>Qty</Text>
          <Text style={[styles.th, styles.colPrice]}>Harga</Text>
          <Text style={[styles.th, styles.colTotal]}>Subtotal</Text>
        </View>

        {items?.map((item, i) => (
          <View key={i} style={styles.tableRow}>
            <View style={styles.colDesc}>
              <Text style={styles.itemName}>{item.productName}</Text>
              <Text style={styles.itemType}>
                {item.type === "SERVICE" ? "Servis" : "Sparepart"}
              </Text>
              {item.mechanics?.length > 0 && (
                <Text style={styles.itemMechanic}>
                  Mekanik: {item.mechanics.map((m) => m.name).join(", ")}
                </Text>
              )}
            </View>
            <Text style={[styles.colQty, styles.textBold]}>
              {item.quantity}
            </Text>
            <Text style={[styles.colPrice, { fontSize: 8 }]}>
              {formatToIdr(item.unitPrice)}
            </Text>
            <Text style={[styles.colTotal, styles.textBold, { fontSize: 9 }]}>
              {formatToIdr(item.subtotal)}
            </Text>
          </View>
        ))}

        {/* SUMMARY & PAYMENT */}
        <View style={styles.summarySection}>
          {/* Payment Info */}
          <View style={styles.paymentCol}>
            <Text style={styles.sectionTitle}>Pembayaran</Text>

            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Metode</Text>
              <Text style={styles.paymentValue}>
                {paymentMethods[method] || method}
              </Text>
            </View>

            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Status</Text>
              <View style={[styles.statusBadge, getStatusBadgeStyle(status)]}>
                <Text
                  style={[
                    styles.statusText,
                    { color: getStatusColor(status) },
                  ]}
                >
                  {statusLabel || status}
                </Text>
              </View>
            </View>

            {paidAt && (
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>Waktu Bayar</Text>
                <Text style={[styles.paymentValue, { fontSize: 8 }]}>
                  {formatDateTimeFull(paidAt)}
                </Text>
              </View>
            )}
          </View>

          {/* Calculation */}
          <View style={styles.calcCol}>
            <Text style={styles.sectionTitle}>Rincian</Text>

            <View style={styles.calcRow}>
              <Text style={styles.calcLabel}>Subtotal</Text>
              <Text style={styles.calcValue}>
                {formatToIdr(subtotal || 0)}
              </Text>
            </View>

            {/* Pajak hanya ditampilkan jika tax > 0 */}
            {hasTax && (
              <View style={styles.calcRow}>
                <Text style={styles.calcLabel}>
                  Pajak ({taxRate || 0}%)
                </Text>
                <Text style={styles.calcValue}>
                  {formatToIdr(tax || 0)}
                </Text>
              </View>
            )}

            <View style={styles.calcTotalRow}>
              <Text style={styles.calcTotalLabel}>TOTAL</Text>
              <Text style={styles.calcTotalValue}>
                {formatToIdr(total || 0)}
              </Text>
            </View>

            <View style={styles.calcPaymentRow}>
              <Text style={styles.calcLabel}>Dibayar</Text>
              <Text style={styles.calcValue}>
                {formatToIdr(amountPaid || 0)}
              </Text>
            </View>

            {change > 0 && (
              <View style={styles.calcRow}>
                <Text style={styles.calcLabel}>Kembalian</Text>
                <Text style={[styles.calcValue, { color: COLOR_SUCCESS }]}>
                  {formatToIdr(change)}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* FOOTER */}
        <View style={styles.footer} fixed>
          <Text style={styles.thankYou}>TERIMA KASIH</Text>
          <Text style={styles.footerText}>
            Barang yang sudah dibeli tidak dapat dikembalikan.
            {"\n"}Garansi servis berlaku selama 7 hari.
            {"\n"}Simpan invoice ini sebagai bukti pembayaran yang sah.
          </Text>
        </View>
      </Page>
    </Document>
  );
};

export default Invoice;