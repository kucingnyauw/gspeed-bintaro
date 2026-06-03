import midtransClient from "midtrans-client";

const serverKey = process.env.MIDTRANS_SERVER_KEY || "dev-server-key";
const clientKey = process.env.MIDTRANS_CLIENT_KEY || "dev-client-key";
const isProduction = process.env.MIDTRANS_IS_PRODUCTION === "true";

const midtrans = new midtransClient.CoreApi({
  isProduction,
  serverKey,
  clientKey,
});

export default midtrans;