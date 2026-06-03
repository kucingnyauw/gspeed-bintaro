import Client from "@lib/client.js";

/**
 * API untuk mengelola data user
 * @module api/userApi
 */

export const createUser = async (payload) => {
  const { data } = await Client.post("/users", payload);
  return data;
};

export const resendMagicLink = async (id) => {
  const { data } = await Client.post(`/users/${id}/resend-magic-link`);
  return data;
};

export const getCurrentUser = async () => {
  const { data } = await Client.get("/users/me", { skipError: true });
  return data;
};

export const validateUserEmail = async (email) => {
  const { data } = await Client.post("/auth/validate/email", { email });
  return data;
};

export const getUsers = async (params) => {
  const response = await Client.get("/users", { params });
  return { data: response.data, metadata: response.metadata };
};

export const getUserById = async (id) => {
  const { data } = await Client.get(`/users/${id}`);
  return data;
};

export const getUserByEmail = async (email) => {
  const { data } = await Client.get(`/users/email/${email}`);
  return data;
};

export const getUserByPhone = async (phone) => {
  const { data } = await Client.get(`/users/phone/${phone}`);
  return data;
};

export const getEmployees = async (params) => {
  const response = await Client.get("/users/employees", { params });
  return { data: response.data, metadata: response.metadata };
};

export const getAdmins = async () => {
  const { data } = await Client.get("/users/admins");
  return data;
};

export const getUsersByRole = async (role) => {
  const { data } = await Client.get(`/users/role/${role}`);
  return data;
};

export const checkEmailExists = async (email, excludeId = null) => {
  const { data } = await Client.get("/users/check/email", {
    params: { email, excludeId },
  });
  return data;
};

export const checkPhoneExists = async (phone, excludeId = null) => {
  const { data } = await Client.get("/users/check/phone", {
    params: { phone, excludeId },
  });
  return data;
};

export const updateUser = async (id, payload) => {
  const { data } = await Client.put(`/users/${id}`, payload);
  return data;
};

export const deleteUser = async (id) => {
  await Client.delete(`/users/${id}`);
};

/**
 * Menonaktifkan banyak user sekaligus
 * @param {string[]} ids - Array ID user
 * @returns {Promise<Object>} Hasil penonaktifan
 */
export const deactivateUsers = async (ids) => {
  const { data } = await Client.patch("/users/deactivate", { ids });
  return data;
};

/**
 * Mengaktifkan banyak user sekaligus
 * @param {string[]} ids - Array ID user
 * @returns {Promise<Object>} Hasil pengaktifan
 */
export const activateUsers = async (ids) => {
  const { data } = await Client.patch("/users/activate", { ids });
  return data;
};