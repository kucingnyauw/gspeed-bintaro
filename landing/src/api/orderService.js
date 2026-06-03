import Client from "@lib/client.js";


export const trackOrder = async (orderNumber) => {
    const response = await Client.get(`orders/${orderNumber}/history`);
    return response.data;
}