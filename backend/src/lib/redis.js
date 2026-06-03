import { Redis } from "@upstash/redis";

const redisUrl = process.env.UPSTASH_REDIS_URL || "http://localhost:6379";
const redisToken = process.env.UPSTASH_REDIS_TOKEN || "dev-token";

const redis = new Redis({
  url: redisUrl,
  token: redisToken,
});

export default redis;