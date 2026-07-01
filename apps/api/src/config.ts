export const config = {
  port: Number(process.env.PORT ?? 3000),
  host: process.env.HOST,
  mongoUrl: process.env.MONGO_URL!,
  mongoDbName: process.env.MONGO_DB!,
  jwtSecret: process.env.JWT_SECRET!,
  accessTtlSeconds: Number(process.env.ACCESS_TTL_SECONDS ?? 15 * 60),
  refreshTtlSeconds: Number(process.env.REFRESH_TTL_SECONDS ?? 30 * 24 * 60 * 60),
  bcryptCost: Number(process.env.BCRYPT_COST ?? 12),
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  aiBaseUrl: process.env.AI_BASE_URL,
};
