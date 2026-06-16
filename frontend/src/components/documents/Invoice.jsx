/**
 * Invoice - PDF invoice document component with professional minimalist receipt layout.
 * Menampilkan detail pembayaran, item pesanan, perhitungan pajak, dan informasi pelanggan.
 *
 * @component
 * @param {Object} props - Component props
 * @param {Object} props.data - Invoice data dari payment
 */
import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import {
  formatToIdr,
  formatDate,
  formatTime,
  formatDateTimeFull,
} from "@shared/utils";

import INFO from "@data/Info.js";

const COLOR_BLACK = "#09090B";
const COLOR_DARK = "#27272A";
const COLOR_MUTED = "#71717A";
const COLOR_BORDER = "#E4E4E7";
const COLOR_PURPLE = "#7C3AED";
const COLOR_SUCCESS = "#059669";
const COLOR_WARNING = "#F59E0B";
const COLOR_ERROR = "#EF4444";

const styles = StyleSheet.create({
  page: {
    padding: 40,
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

  // Watermark
  watermarkLayer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.03,
    transform: "rotate(-20deg)",
  },
  watermarkText: {
    fontSize: 96,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 20,
    color: COLOR_PURPLE,
    textTransform: "uppercase",
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 28,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  logo: { width: 48, height: 48 },
  brandName: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: COLOR_BLACK,
    letterSpacing: 0.5,
  },
  brandDesc: { fontSize: 7, color: COLOR_MUTED, marginTop: 2 },
  receiptBadge: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: COLOR_PURPLE,
  },
  receiptTitle: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: COLOR_PURPLE,
    textTransform: "uppercase",
    letterSpacing: 3,
  },

  // Store Info + Meta
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  storeInfo: {
    fontSize: 8,
    color: COLOR_MUTED,
    lineHeight: 1.7,
    flex: 1,
  },
  metaContainer: {
    alignItems: "flex-end",
    gap: 4,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
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
    marginVertical: 12,
  },
  dividerThick: {
    borderTopWidth: 1.5,
    borderTopColor: COLOR_BLACK,
  },

  // Customer & Vehicle
  infoSection: {
    flexDirection: "row",
    paddingTop: 12,
    paddingBottom: 4,
    borderTopWidth: 0.5,
    borderTopColor: COLOR_BORDER,
    gap: 24,
  },
  infoCol: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 7,
    color: COLOR_MUTED,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 10,
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
    paddingVertical: 10,
    borderBottomWidth: 1.5,
    borderBottomColor: COLOR_BLACK,
    marginTop: 12,
    backgroundColor: "#FAFAFA",
    paddingHorizontal: 4,
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
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: COLOR_BORDER,
    alignItems: "flex-start",
  },
  colDesc: { flex: 1.2, paddingRight: 10 },
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
    marginTop: 1,
  },

  // Summary
  summarySection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 28,
    gap: 28,
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
    letterSpacing: 0.8,
    color: COLOR_MUTED,
    marginBottom: 12,
  },
  paymentRow: {
    flexDirection: "row",
    marginBottom: 8,
    alignItems: "center",
  },
  paymentLabel: {
    width: 70,
    fontSize: 8,
    color: COLOR_MUTED,
  },
  paymentValue: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
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
    paddingVertical: 5,
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
    paddingVertical: 10,
    marginTop: 6,
    borderTopWidth: 1.5,
    borderTopColor: COLOR_BLACK,
    borderBottomWidth: 1.5,
    borderBottomColor: COLOR_BLACK,
  },
  calcTotalLabel: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: COLOR_BLACK,
  },
  calcTotalValue: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: COLOR_PURPLE,
  },
  calcPaymentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 5,
    marginTop: 8,
  },

  // Footer
  footer: {
    position: "absolute",
    bottom: 44,
    left: 44,
    right: 44,
    textAlign: "center",
    alignItems: "center",
  },
  footerText: {
    fontSize: 7,
    color: COLOR_MUTED,
    lineHeight: 1.7,
    textAlign: "center",
  },
  thankYou: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: COLOR_PURPLE,
    marginBottom: 8,
    textAlign: "center",
    letterSpacing: 1.5,
  },
});

const getStatusBadgeStyle = (status) => {
  switch (status) {
    case "PAID": return styles.statusBadgePaid;
    case "PENDING": return styles.statusBadgePending;
    case "REFUNDED": return styles.statusBadgeRefunded;
    default: return styles.statusBadgePending;
  }
};

const getStatusColor = (status) => {
  switch (status) {
    case "PAID": return COLOR_SUCCESS;
    case "PENDING": return COLOR_WARNING;
    case "REFUNDED": return COLOR_ERROR;
    default: return COLOR_MUTED;
  }
};

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

  const paymentMethods = { CASH: "Tunai", QRIS: "QRIS" };
  const isPaid = status === "PAID";
  const hasTax = tax > 0 || taxRate > 0;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
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
        <View style={styles.infoRow}>
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
                <Text style={[styles.statusText, { color: getStatusColor(status) }]}>
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

          <View style={styles.calcCol}>
            <Text style={styles.sectionTitle}>Rincian</Text>

            <View style={styles.calcRow}>
              <Text style={styles.calcLabel}>Subtotal</Text>
              <Text style={styles.calcValue}>{formatToIdr(subtotal || 0)}</Text>
            </View>

            {hasTax && (
              <View style={styles.calcRow}>
                <Text style={styles.calcLabel}>Pajak ({taxRate || 0}%)</Text>
                <Text style={styles.calcValue}>{formatToIdr(tax || 0)}</Text>
              </View>
            )}

            <View style={styles.calcTotalRow}>
              <Text style={styles.calcTotalLabel}>TOTAL</Text>
              <Text style={styles.calcTotalValue}>{formatToIdr(total || 0)}</Text>
            </View>

            <View style={styles.calcPaymentRow}>
              <Text style={styles.calcLabel}>Dibayar</Text>
              <Text style={styles.calcValue}>{formatToIdr(amountPaid || 0)}</Text>
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