import { useForm } from "react-hook-form";

/**
 * Custom hook untuk mengelola form pembuatan customer baru beserta kendaraannya.
 *
 * @returns {import("react-hook-form").UseFormReturn}
 *
 * @example
 * const form = useCustomerCreateForm();
 *
 * const onSubmit = (data) => {
 *   createCustomerMutation.mutate(data);
 * };
 */
export const useCustomerCreateForm = () => {
  return useForm({
    defaultValues: {
      name: "",
      phone: "",
      vehicle: {
        plateNumber: "",
        brand: "",
        model: "",
      },
    },
  });
};

/**
 * Custom hook untuk mengelola form update data customer.
 *
 * @param {Object} [defaultValues] - Nilai default kustom untuk form (digunakan saat edit customer).
 *
 * @returns {import("react-hook-form").UseFormReturn}
 */
export const useCustomerUpdateForm = (defaultValues) => {
  return useForm({
    defaultValues: {
      name: "",
      phone: "",
      ...defaultValues,
    },
  });
};