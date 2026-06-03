import Client from "@lib/client.js";


export const getProducts = async (params) => {
    const response = await Client.get("/products", { params });
    return { data: response.data, metadata: response.metadata };
  };