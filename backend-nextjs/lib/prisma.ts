import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var globalPrisma: PrismaClient | undefined;
}

export const prisma: PrismaClient | null = (() => {
  // Check if DATABASE_URL is set
  const url = process.env.DATABASE_URL;
  if (!url) {
    return null;
  }

  if (process.env.NODE_ENV === "production") {
    return new PrismaClient();
  } else {
    if (!global.globalPrisma) {
      global.globalPrisma = new PrismaClient({
        log: process.env.DEBUG === "true" ? ["query", "error", "warn"] : ["error"],
      });
    }
    return global.globalPrisma;
  }
})();

