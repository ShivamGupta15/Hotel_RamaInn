import { prisma } from "./prisma";
import { DEFAULT_ROOMS } from "./availability";

// In-memory calendar overrides store for fallback/dev
export const inMemoryOverrides: Map<string, any> = new Map();

export async function resolveRoomCategory(idOrSlug: string): Promise<any> {
  if (prisma) {
    try {
      const cat = await prisma.roomCategory.findFirst({
        where: {
          OR: [{ id: idOrSlug }, { slug: idOrSlug }],
        },
      });
      if (cat) return cat;
    } catch {
      // Fallback
    }
  }

  return (
    DEFAULT_ROOMS.find((r) => r.id === idOrSlug || r.slug === idOrSlug) ||
    DEFAULT_ROOMS[0]
  );
}

export async function getRoomMonthCalendar(
  idOrSlug: string,
  year: number,
  month: number
): Promise<any> {
  const category = await resolveRoomCategory(idOrSlug);

  const catId = category?.id || idOrSlug;
  const catName = category?.name || "Deluxe King AC Room";
  const catSlug = category?.slug || "deluxe-king-ac";
  const totalUnits = category?.total_units || 6;
  const basePrice = Number(category?.base_price_per_night || 2899.0);

  // Determine days in target month
  const numDays = new Date(year, month, 0).getDate();
  const firstDay = new Date(Date.UTC(year, month - 1, 1));
  const lastDay = new Date(Date.UTC(year, month - 1, numDays));

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const weekdayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  let bookings: any[] = [];
  const overridesMap = new Map<string, any>();

  if (prisma && category) {
    try {
      bookings = await prisma.booking.findMany({
        where: {
          room_category_id: category.id,
          check_in_date: { lte: lastDay },
          check_out_date: { gt: firstDay },
          OR: [
            { status: { in: ["CONFIRMED", "CHECKED_IN"] } },
            {
              status: "PENDING_PAYMENT",
              hold_expires_at: { gt: new Date() },
            },
          ],
        },
      });

      const overrides = await prisma.roomCalendarOverride.findMany({
        where: {
          room_category_id: category.id,
          override_date: {
            gte: firstDay,
            lte: lastDay,
          },
        },
      });

      for (const ov of overrides) {
        const dateKey = ov.override_date.toISOString().split("T")[0];
        overridesMap.set(dateKey, ov);
      }
    } catch {
      // Fallback
    }
  }

  const days = [];
  for (let d = 1; d <= numDays; d++) {
    const currDate = new Date(Date.UTC(year, month - 1, d));
    const dateStr = currDate.toISOString().split("T")[0];
    const weekday = weekdayNames[currDate.getUTCDay()];

    // Count booked units for this day
    const bookedUnits = bookings.reduce((sum, b) => {
      const bIn = new Date(b.check_in_date);
      const bOut = new Date(b.check_out_date);
      if (bIn <= currDate && currDate < bOut) {
        return sum + (b.rooms_count || 1);
      }
      return sum;
    }, 0);

    const ov = overridesMap.get(dateStr) || inMemoryOverrides.get(`${catId}:${dateStr}`);
    let isBlocked = false;
    let notes: string | null = null;
    let price = basePrice;
    let availableUnits = Math.max(0, totalUnits - bookedUnits);

    if (ov) {
      isBlocked = Boolean(ov.is_blocked);
      notes = ov.notes || null;
      if (ov.price_override !== null && ov.price_override !== undefined) {
        price = Number(ov.price_override);
      }
      if (isBlocked) {
        availableUnits = 0;
      } else if (ov.available_units !== null && ov.available_units !== undefined) {
        availableUnits = Math.max(0, Number(ov.available_units) - bookedUnits);
      }
    }

    let statusLabel = "AVAILABLE";
    if (isBlocked) {
      statusLabel = "BLOCKED";
    } else if (availableUnits === 0) {
      statusLabel = "SOLD_OUT";
    } else if (availableUnits <= 2) {
      statusLabel = "LIMITED";
    }

    days.push({
      date: dateStr,
      day: d,
      weekday,
      total_units: totalUnits,
      booked_units: bookedUnits,
      available_units: availableUnits,
      is_blocked: isBlocked,
      status: statusLabel,
      price,
      notes,
    });
  }

  return {
    room_category_id: catId,
    room_name: catName,
    room_slug: catSlug,
    year,
    month,
    month_name: monthNames[month - 1],
    total_units: totalUnits,
    base_price: basePrice,
    days,
  };
}

export async function upsertCalendarOverride(params: {
  categoryIdOrSlug: string;
  dateFrom: string;
  dateTo: string;
  availableUnits?: number | null;
  isBlocked?: boolean;
  priceOverride?: number | null;
  notes?: string | null;
}): Promise<number> {
  const category = await resolveRoomCategory(params.categoryIdOrSlug);
  if (!category) return 0;

  const start = new Date(params.dateFrom);
  const end = new Date(params.dateTo);
  let affected = 0;

  for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    const dateStr = d.toISOString().split("T")[0];
    const key = `${category.id}:${dateStr}`;

    const overrideData = {
      room_category_id: category.id,
      override_date: new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())),
      available_units: params.availableUnits ?? null,
      is_blocked: Boolean(params.isBlocked),
      price_override: params.priceOverride ?? null,
      notes: params.notes ?? null,
    };

    inMemoryOverrides.set(key, overrideData);

    if (prisma) {
      try {
        const existing = await prisma.roomCalendarOverride.findFirst({
          where: {
            room_category_id: category.id,
            override_date: overrideData.override_date,
          },
        });

        if (existing) {
          await prisma.roomCalendarOverride.update({
            where: { id: existing.id },
            data: {
              available_units: overrideData.available_units,
              is_blocked: overrideData.is_blocked,
              price_override: overrideData.price_override,
              notes: overrideData.notes,
            },
          });
        } else {
          await prisma.roomCalendarOverride.create({
            data: overrideData,
          });
        }
      } catch {
        // In-memory fallback
      }
    }

    affected++;
  }

  return affected;
}

export async function deleteCalendarOverride(
  categoryIdOrSlug: string,
  dateFrom: string,
  dateTo: string
): Promise<number> {
  const category = await resolveRoomCategory(categoryIdOrSlug);
  if (!category) return 0;

  const start = new Date(dateFrom);
  const end = new Date(dateTo);
  let affected = 0;

  for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    const dateStr = d.toISOString().split("T")[0];
    const key = `${category.id}:${dateStr}`;
    if (inMemoryOverrides.delete(key)) {
      affected++;
    }
  }

  if (prisma) {
    try {
      const res = await prisma.roomCalendarOverride.deleteMany({
        where: {
          room_category_id: category.id,
          override_date: {
            gte: new Date(paramsDate(dateFrom)),
            lte: new Date(paramsDate(dateTo)),
          },
        },
      });
      return res.count || affected;
    } catch {
      // In-memory fallback
    }
  }

  return affected;
}

function paramsDate(str: string): Date {
  const [y, m, d] = str.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

