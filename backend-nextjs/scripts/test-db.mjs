import { PrismaClient } from "@prisma/client";

async function testConnection() {
  console.log("Testing Database connection with DATABASE_URL from .env...\n");
  const prisma = new PrismaClient({
    log: ["error", "warn"],
  });

  try {
    console.log("Attempting $connect()...");
    await prisma.$connect();
    console.log("✅ Successfully connected to database!");

    console.log("Querying room categories...");
    const rooms = await prisma.roomCategory.findMany();
    console.log(`Found ${rooms.length} room categories in database.`);
  } catch (err) {
    console.error("❌ Database connection error:");
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();

