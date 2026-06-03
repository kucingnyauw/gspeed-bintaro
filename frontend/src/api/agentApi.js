// lib/api/AgentApi.js
import Client from "@lib/client.js";

/**
 * Chat dengan AI agent
 * @param {string} message - Pesan dari user
 * @returns {Promise<Object>} Response dari AI agent
 */
export const chat = async (message) => {
  const { data } = await Client.post("/agent/chat", { message });
  return data;
};