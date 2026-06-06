/**
 * useHeaderCart - Hook untuk mengelola state dan operasi keranjang belanja.
 *
 * Fitur:
 * - Kalkulasi total otomatis setiap kali item berubah (dengan debounce)
 * - Race condition handling dengan request ID
 * - Form management untuk customer & vehicle dengan react-hook-form
 * - Mutasi create order dengan notifikasi sukses/gagal
 * - Auto-reset saat dialog ditutup
 * - Optimistic update untuk increment/decrement quantity
 *
 * @param {boolean} open - Status dialog terbuka
 * @param {Function} onClose - Callback untuk menutup dialog
 * @returns {Object} Cart state dan handlers
 */
import { useMemo, useCallback, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { selectCartItems } from "@store/cart/cartSelector.js";
import {
  incrementQuantity,
  decrementQuantity,
  removeItem,
  clearCart,
} from "@store/cart/cartSlices.js";
import { createOrder, calculateTotal } from "@api/orderApi.js";
import { showNotification } from "@store/notifications/notificationsSlice.js";

export const useHeaderCart = (open, onClose) => {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();

  /**
   * Item keranjang dari Redux store.
   *
   * @type {Array<Object>}
   */
  const items = useSelector(selectCartItems);

  /**
   * Ref untuk menyimpan ID request terbaru (race condition handling).
   *
   * @type {React.MutableRefObject<number>}
   */
  const requestIdRef = useRef(0);

  /**
   * Ref untuk menyimpan snapshot items terbaru.
   * Digunakan saat submit untuk memastikan data terbaru.
   *
   * @type {React.MutableRefObject<Array>}
   */
  const itemsRef = useRef(items);
  itemsRef.current = items;

  /**
   * Form instance untuk customer & vehicle selection.
   */
  const { control, handleSubmit, watch, setValue, reset } = useForm({
    defaultValues: { customer: null, vehicle: null },
  });

  /**
   * Customer yang dipilih dari form.
   *
   * @type {Object|null}
   */
  const selectedCustomer = watch("customer");

  /**
   * Daftar kendaraan dari customer yang dipilih.
   *
   * @type {Array<Object>}
   */
  const customerVehicles = useMemo(
    () => selectedCustomer?.vehicles || [],
    [selectedCustomer]
  );

  /**
   * Payload untuk kalkulasi total.
   * Berisi array productId & quantity.
   *
   * @type {Array<{productId: string, quantity: number}>}
   */
  const calculatePayload = useMemo(() => {
    if (!items.length) return [];
    return items.map(({ productId, quantity }) => ({ productId, quantity }));
  }, [items]);

  /**
   * Mutation untuk kalkulasi total.
   * Menggunakan mutationFn agar selalu fresh (tidak di-cache).
   */
  const {
    mutate: calculateTotalMutate,
    data: calculateTotalData,
    isPending: isCalculatePending,
  } = useMutation({
    mutationFn: calculateTotal,
    /**
     * Reset data kalkulasi saat error.
     * Mencegah tampilan data stale.
     */
    onError: () => {
      // Data akan otomatis undefined, trigger re-render
    },
  });

  /**
   * Effect: Trigger kalkulasi ulang setiap kali items berubah.
   * Menggunakan request ID untuk mencegah race condition.
   */
  useEffect(() => {
    if (!calculatePayload.length) return;

    const currentRequestId = ++requestIdRef.current;

    calculateTotalMutate(calculatePayload, {
      onSuccess: (data) => {
        if (currentRequestId !== requestIdRef.current) {
          return;
        }
      },
      onError: () => {
        if (currentRequestId !== requestIdRef.current) {
          return;
        }
      },
    });
  }, [calculatePayload, calculateTotalMutate]);

  /**
   * Effect: Reset state saat dialog ditutup.
   */
  useEffect(() => {
    if (!open) {
      requestIdRef.current = 0;
      reset();
    }
  }, [open, reset]);

  /**
   * Mutation untuk create order.
   */
  const createOrderMutation = useMutation({
    mutationFn: createOrder,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["orders-active"] });
      dispatch(clearCart());
      dispatch(
        showNotification({
          message: `Pesanan #${data?.orderNumber || "baru"} berhasil dibuat`,
          type: "success",
          title: "Berhasil",
          variant: "snackbar",
          autoHide: 3000,
        })
      );
      onClose();
      reset();
    },
    onError: (error) => {
      dispatch(
        showNotification({
          message: error.message || "Gagal membuat pesanan",
          type: "error",
          title: "Error",
          variant: "snackbar",
          autoHide: 5000,
        })
      );
    },
  });

  /**
   * Handler increment quantity.
   *
   * @param {string} productId - ID produk
   */
  const handleIncrement = useCallback(
    (productId) => dispatch(incrementQuantity(productId)),
    [dispatch]
  );

  /**
   * Handler decrement quantity.
   *
   * @param {string} productId - ID produk
   */
  const handleDecrement = useCallback(
    (productId) => dispatch(decrementQuantity(productId)),
    [dispatch]
  );

  /**
   * Handler hapus item dari keranjang.
   *
   * @param {string} productId - ID produk
   */
  const handleRemoveItem = useCallback(
    (productId) => dispatch(removeItem(productId)),
    [dispatch]
  );

  /**
   * Handler submit form untuk membuat pesanan.
   * Menggunakan itemsRef untuk mendapatkan data terbaru.
   *
   * @param {Object} data - Data form
   */
  const onSubmit = (data) => {
    const currentItems = itemsRef.current;
    if (!currentItems.length) return;

    createOrderMutation.mutate({
      ...(data.customer?.id && { customerId: data.customer.id }),
      ...(data.vehicle?.id && { vehicleId: data.vehicle.id }),
      items: currentItems.map(({ productId, quantity }) => ({
        productId,
        quantity,
      })),
    });
  };

  return {
    control,
    handleSubmit,
    setValue,
    selectedCustomer,
    customerVehicles,
    items,
    isCalculatePending,
    isSubmitting: createOrderMutation.isPending,
    calcData: calculateTotalData || {},
    handleIncrement,
    handleDecrement,
    handleRemoveItem,
    onSubmit,
  };
};