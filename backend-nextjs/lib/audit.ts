import { v4 as uuidv4 } from "uuid";
import { prisma } from "./prisma";

export interface AuditLogItem {
  id: string;
  timestamp: string;
  user_id: string | null;
  user_name: string;
  user_role: string;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  details: string;
}

// In-memory fallback logs for seamless operation when database is offline
export const inMemoryAuditLogs: AuditLogItem[] = [
  {
    id: uuidv4(),
    timestamp: new Date().toISOString(),
    user_id: "11111111-1111-1111-1111-111111111111",
    user_name: "Principal Administrator",
    user_role: "ADMIN",
    action: "SYSTEM_INITIALIZED",
    entity_type: "SYSTEM",
    entity_id: "SYSTEM",
    details: "Next.js backend successfully migrated and operational on Hostinger.",
  },
];

export async function recordAuditLog(params: {
  userName?: string | null;
  userRole?: string | null;
  action: string;
  details: string;
  entityType?: string | null;
  entityId?: string | null;
  userId?: string | null;
}): Promise<AuditLogItem> {
  const item: AuditLogItem = {
    id: uuidv4(),
    timestamp: new Date().toISOString(),
    user_id: params.userId || null,
    user_name: params.userName || "System Administrator",
    user_role: (params.userRole || "ADMIN").toUpperCase(),
    action: params.action.toUpperCase(),
    entity_type: params.entityType ? params.entityType.toUpperCase() : null,
    entity_id: params.entityId || null,
    details: params.details,
  };

  // Always keep in-memory for resilience
  inMemoryAuditLogs.unshift(item);
  if (inMemoryAuditLogs.length > 500) {
    inMemoryAuditLogs.pop();
  }

  // Persist to database if available
  if (prisma) {
    try {
      await prisma.adminAuditLog.create({
        data: {
          id: item.id,
          timestamp: new Date(item.timestamp),
          user_id: item.user_id,
          user_name: item.user_name,
          user_role: item.user_role,
          action: item.action,
          entity_type: item.entity_type,
          entity_id: item.entity_id,
          details: item.details,
        },
      });
    } catch {
      // Graceful fallback: recorded in memory
    }
  }

  return item;
}

export async function getAuditLogs(params: {
  limit?: number;
  offset?: number;
  action?: string | null;
  search?: string | null;
}): Promise<AuditLogItem[]> {
  const limit = params.limit || 150;
  const offset = params.offset || 0;
  const actionFilter = params.action ? params.action.toUpperCase() : null;
  const searchFilter = params.search ? params.search.trim().toLowerCase() : null;

  if (prisma) {
    try {
      const where: any = {};
      if (actionFilter) {
        where.action = actionFilter;
      }
      if (searchFilter) {
        where.OR = [
          { user_name: { contains: searchFilter } },
          { details: { contains: searchFilter } },
          { action: { contains: searchFilter } },
        ];
      }

      const rows = await prisma.adminAuditLog.findMany({
        where,
        orderBy: { timestamp: "desc" },
        take: limit,
        skip: offset,
      });

      if (rows && rows.length > 0) {
        return rows.map((r: any) => ({
          id: r.id,
          timestamp: r.timestamp.toISOString(),
          user_id: r.user_id,
          user_name: r.user_name,
          user_role: r.user_role,
          action: r.action,
          entity_type: r.entity_type,
          entity_id: r.entity_id,
          details: r.details,
        }));
      }
    } catch {
      // Fallback to in-memory logs
    }
  }

  let filtered = [...inMemoryAuditLogs];
  if (actionFilter) {
    filtered = filtered.filter((l) => l.action === actionFilter);
  }
  if (searchFilter) {
    filtered = filtered.filter(
      (l) =>
        l.user_name.toLowerCase().includes(searchFilter) ||
        l.details.toLowerCase().includes(searchFilter) ||
        l.action.toLowerCase().includes(searchFilter)
    );
  }

  return filtered.slice(offset, offset + limit);
}

