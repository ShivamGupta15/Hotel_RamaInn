import { prisma } from "./prisma";

export interface AvailableRoomItem {
  room_category_id: string;
  name: string;
  slug: string;
  images: string[];
  amenities: string[];
  max_adults: number;
  max_children: number;
  total_nights: number;
  price_per_night: number;
  room_total: number;
  tax_amount: number;
  final_payable: number;
  currency: string;
  units_available: number;
}

export interface DefaultRoom {
  id: string;
  name: string;
  slug: string;
  total_units: number;
  base_price_per_night: number;
  tax_percent: number;
  max_adults: number;
  max_children: number;
  amenities: string[];
  images: string[];
  is_active: boolean;
}

export const DEFAULT_ROOMS: DefaultRoom[] = [
  {
    id: "deluxe-double",
    name: "Deluxe King AC Room",
    slug: "deluxe-king-ac",
    total_units: 6,
    base_price_per_night: 2899.0,
    tax_percent: 12.0,
    max_adults: 2,
    max_children: 1,
    amenities: ["King Size Bed", "Air Conditioning", "Free High-Speed Wi-Fi", "HD Smart TV", "Geyser Shower"],
    images: [
      "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=1200&q=80",
    ],
    is_active: true,
  },
  {
    id: "super-deluxe",
    name: "Super Deluxe Executive Room",
    slug: "super-deluxe-executive",
    total_units: 4,
    base_price_per_night: 3899.0,
    tax_percent: 12.0,
    max_adults: 3,
    max_children: 1,
    amenities: ["City View Balcony", "King Bed + Sofa", "Air Conditioning", "Mini Fridge", "Complimentary Breakfast"],
    images: [
      "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=80",
    ],
    is_active: true,
  },
  {
    id: "family-suite",
    name: "Royal Family Suite",
    slug: "royal-family-suite",
    total_units: 3,
    base_price_per_night: 5499.0,
    tax_percent: 18.0,
    max_adults: 4,
    max_children: 2,
    amenities: ["2 Connected Bedrooms", "Living Lounge", "2 Bathrooms with Bathtub", "Dining Table", "Express Room Service"],
    images: [
      "https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80",
    ],
    is_active: true,
  },
  {
    id: "presidential-suite",
    name: "Rama Presidential Suite",
    slug: "rama-presidential-suite",
    total_units: 2,
    base_price_per_night: 8999.0,
    tax_percent: 18.0,
    max_adults: 4,
    max_children: 2,
    amenities: ["Panoramic Skyline View", "Master Jacuzzi", "Private Butler Service", "Executive Workspace", "VIP Lounge Access"],
    images: [
      "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80",
    ],
    is_active: true,
  },
];

// In-memory fallback booking storage for testing/offline resilience
export const inMemoryBookings: any[] = [];

export function generateBookingReference(checkIn: Date): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let suffix = "";
  for (let i = 0; i < 4; i++) {
    suffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  const year = checkIn.getUTCFullYear();
  const month = String(checkIn.getUTCMonth() + 1).padStart(2, "0");
  return `RAMA-${year}${month}-${suffix}`;
}

export function parseArrayField(val: any): string[] {
  if (Array.isArray(val)) return val;
  if (!val) return [];
  if (typeof val === "string") {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      return val.split(",").map((s) => s.trim().replace(/^['"]|['"]$/g, "")).filter(Boolean);
    }
  }
  return [];
}

export async function checkAvailability(params: {
  checkIn: Date;
  checkOut: Date;
  adults: number;
  children: number;
  roomsCount: number;
}): Promise<AvailableRoomItem[]> {
  const totalNights = Math.max(1, Math.round((params.checkOut.getTime() - params.checkIn.getTime()) / (1000 * 60 * 60 * 24)));
  const roomsNeeded = Math.max(1, params.roomsCount);
  const now = new Date();

  let categories: any[] = [];

  if (prisma) {
    try {
      categories = await prisma.roomCategory.findMany({
        where: { is_active: true },
        orderBy: { base_price_per_night: "asc" },
      });
    } catch (err: any) {
      console.warn("[Database Warning - Room Categories]:", err?.message || err);
      // Fallback to default rooms
      categories = [];
    }
  }

  if (!categories || categories.length === 0) {
    categories = DEFAULT_ROOMS.filter((r) => r.is_active);
  }

  // Filter by capacity across requested rooms
  const matching = categories.filter(
    (c) => c.max_adults * roomsNeeded >= params.adults && c.max_children * roomsNeeded >= params.children
  );

  const results: AvailableRoomItem[] = [];

  for (const cat of matching) {
    let bookedUnits = 0;

    if (prisma) {
      try {
        const overlapping = await prisma.booking.findMany({
          where: {
            room_category_id: cat.id,
            check_in_date: { lt: params.checkOut },
            check_out_date: { gt: params.checkIn },
            OR: [
              { status: { in: ["CONFIRMED", "CHECKED_IN"] } },
              {
                status: "PENDING_PAYMENT",
                hold_expires_at: { gt: now },
              },
            ],
          },
          select: { rooms_count: true },
        });

        bookedUnits = overlapping.reduce((sum: number, b: any) => sum + (b.rooms_count || 1), 0);
      } catch (err: any) {
        console.warn("[Database Warning - Bookings]:", err?.message || err);
        bookedUnits = 0;
      }
    } else {
      // Count in-memory bookings
      const overlapping = inMemoryBookings.filter(
        (b) =>
          b.room_category_id === cat.id &&
          new Date(b.check_in_date) < params.checkOut &&
          new Date(b.check_out_date) > params.checkIn &&
          (["CONFIRMED", "CHECKED_IN"].includes(b.status) ||
            (b.status === "PENDING_PAYMENT" && new Date(b.hold_expires_at) > now))
      );
      bookedUnits = overlapping.reduce((sum, b) => sum + (b.rooms_count || 1), 0);
    }

    const unitsAvailable = cat.total_units - bookedUnits;
    if (unitsAvailable < roomsNeeded) {
      continue;
    }

    const price = Number(cat.base_price_per_night);
    const taxRate = Number(cat.tax_percent || 12.0);
    const roomTotal = price * totalNights * roomsNeeded;
    const taxAmount = Math.round((roomTotal * taxRate) / 100 * 100) / 100;
    const finalPayable = roomTotal + taxAmount;

    results.push({
      room_category_id: cat.id,
      name: cat.name,
      slug: cat.slug,
      images: parseArrayField(cat.images),
      amenities: parseArrayField(cat.amenities),
      max_adults: cat.max_adults,
      max_children: cat.max_children,
      total_nights: totalNights,
      price_per_night: price,
      room_total: roomTotal,
      tax_amount: taxAmount,
      final_payable: finalPayable,
      currency: "INR",
      units_available: unitsAvailable,
    });
  }

  return results;
}

export async function isRoomAvailable(params: {
  roomCategoryId: string;
  checkIn: Date;
  checkOut: Date;
  requestedRooms: number;
}): Promise<{ available: boolean; unitsLeft: number; category: any }> {
  let category: any = null;

  if (prisma) {
    try {
      category = await prisma.roomCategory.findFirst({
        where: {
          OR: [
            { id: params.roomCategoryId },
            { slug: params.roomCategoryId },
          ],
        },
      });
    } catch {
      category = null;
    }
  }

  if (!category) {
    category = DEFAULT_ROOMS.find(
      (r) => r.id === params.roomCategoryId || r.slug === params.roomCategoryId
    ) || DEFAULT_ROOMS[0];
  }

  if (!category || !category.is_active) {
    return { available: false, unitsLeft: 0, category: null };
  }

  const now = new Date();
  let bookedUnits = 0;

  if (prisma) {
    try {
      const overlapping = await prisma.booking.findMany({
        where: {
          room_category_id: category.id,
          check_in_date: { lt: params.checkOut },
          check_out_date: { gt: params.checkIn },
          OR: [
            { status: { in: ["CONFIRMED", "CHECKED_IN"] } },
            {
              status: "PENDING_PAYMENT",
              hold_expires_at: { gt: now },
            },
          ],
        },
        select: { rooms_count: true },
      });

      bookedUnits = overlapping.reduce((sum: number, b: any) => sum + (b.rooms_count || 1), 0);

      // Check admin calendar overrides
      const overrides = await prisma.roomCalendarOverride.findMany({
        where: {
          room_category_id: category.id,
          override_date: {
            gte: params.checkIn,
            lt: params.checkOut,
          },
        },
      });

      for (const ov of overrides) {
        if (ov.is_blocked) {
          return { available: false, unitsLeft: 0, category };
        }
        if (ov.available_units !== null && ov.available_units < params.requestedRooms) {
          return { available: false, unitsLeft: Math.max(0, ov.available_units), category };
        }
      }
    } catch {
      // Fallback
    }
  } else {
    const overlapping = inMemoryBookings.filter(
      (b) =>
        b.room_category_id === category.id &&
        new Date(b.check_in_date) < params.checkOut &&
        new Date(b.check_out_date) > params.checkIn &&
        (["CONFIRMED", "CHECKED_IN"].includes(b.status) ||
          (b.status === "PENDING_PAYMENT" && new Date(b.hold_expires_at) > now))
    );
    bookedUnits = overlapping.reduce((sum, b) => sum + (b.rooms_count || 1), 0);
  }

  const unitsAvailable = category.total_units - bookedUnits;
  return {
    available: unitsAvailable >= params.requestedRooms,
    unitsLeft: Math.max(0, unitsAvailable),
    category,
  };
}

