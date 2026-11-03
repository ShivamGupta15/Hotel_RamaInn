import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var globalPrisma: PrismaClient | undefined;
}

export const prisma: PrismaClient | null = (() => {
  // Check if DATABASE_URL is set
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.warn("[Prisma] DATABASE_URL environment variable is NOT set. Running with in-memory fallback.");
    return null;
  }

  if (process.env.NODE_ENV === "production") {
    return new PrismaClient({
      log: ["error", "warn"],
    });
  } else {
    if (!global.globalPrisma) {
      global.globalPrisma = new PrismaClient({
        log: ["error", "warn"],
      });
    }
    return global.globalPrisma;
  }
})();

