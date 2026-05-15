export const config = {
  port: Number(process.env.PORT ?? 3000),
  host: process.env.HOST ?? '0.0.0.0',
  mongoUrl: process.env.MONGO_URL ?? 'mongodb://localhost:27017',
  mongoDbName: process.env.MONGO_DB ?? 'mixer',
  jwtSecret: process.env.JWT_SECRET ?? 'dev-secret-change-me',
  accessTtlSeconds: Number(process.env.ACCESS_TTL_SECONDS ?? 15 * 60),
  refreshTtlSeconds: Number(process.env.REFRESH_TTL_SECONDS ?? 30 * 24 * 60 * 60),
  bcryptCost: Number(process.env.BCRYPT_COST ?? 12),
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? '',
};
