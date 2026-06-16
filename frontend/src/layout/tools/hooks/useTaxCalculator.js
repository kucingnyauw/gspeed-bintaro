// hooks/useTaxCalculator.js
import { useState, useCallback } from "react";
import { formatToIdr } from "@shared/utils";

/**
 * useTaxCalculator - Hook untuk kalkulator pajak dengan input persentase bebas.
 * @returns {Object} State dan handlers kalkulator pajak
 */
export const useTaxCalculator = () => {
  const [amount, setAmount] = useState("");
  const [taxRate, setTaxRate] = useState("");
  const [result, setResult] = useState(null);

  /**
   * Parse input string ke number (hapus semua non-digit).
   * @param {string} val
   * @returns {number}
   */
  const parseAmount = (val) => {
    const cleaned = val.replace(/[^0-9]/g, "");
    return cleaned ? Number(cleaned) : 0;
  };

  /**
   * Format input amount dengan separator ribuan.
   * @param {string} val
   * @returns {string}
   */
  const formatInput = (val) => {
    const num = parseAmount(val);
    if (!num && val !== "") return "";
    return formatToIdr(num); // "100.000" tanpa "Rp"
  };

  /**
   * Hitung pajak.
   * @param {string} mode - "PPN" (tambah pajak) atau "PPh" (kurang pajak)
   */
  const calculate = useCallback(
    (mode = "PPN") => {
      const numAmount = parseAmount(amount);
      const rate = parseFloat(taxRate.replace(",", ".")) || 0;

      if (!numAmount || numAmount <= 0 || !rate || rate <= 0) {
        setResult(null);
        return;
      }

      const taxAmount = Math.round(numAmount * (rate / 100));
      const totalAfterTax =
        mode === "PPN"
          ? numAmount + taxAmount // PPN: harga + pajak
          : numAmount - taxAmount; // PPh: harga - pajak

      setResult({
        baseAmount: numAmount,
        taxRate: rate,
        taxAmount,
        totalAfterTax,
        mode,
      });
    },
    [amount, taxRate]
  );

  /**
   * Handle perubahan input amount.
   * Hanya izinkan digit, maks 12 karakter.
   * @param {string} val
   */
  const handleAmountChange = (val) => {
    const num = val.replace(/[^0-9]/g, "");
    if (num.length > 12) return;
    setAmount(num);
    setResult(null);
  };

  /**
   * Handle perubahan input tax rate.
   * Izinkan angka, 1 titik/koma desimal, maks 2 digit desimal, maks 100%.
   * @param {string} val
   */
  const handleTaxRateChange = (val) => {
    const cleaned = val
      .replace(/[^0-9.,]/g, "")
      .replace(/,/g, ".");

    const parts = cleaned.split(".");
    if (parts.length > 1) {
      parts[1] = parts[1].slice(0, 2);
    }
    const final = parts.join(".");

    if (parseFloat(final) > 100) return;
    setTaxRate(final);
    setResult(null);
  };

  /**
   * Reset semua state.
   */
  const handleClear = useCallback(() => {
    setAmount("");
    setTaxRate("");
    setResult(null);
  }, []);

  return {
    amount,
    taxRate,
    result,
    handleAmountChange,
    handleTaxRateChange,
    calculate,
    handleClear,
    formatInput,
    formatToIdr,
  };
};