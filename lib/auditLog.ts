import { prisma } from "./prisma";
import { Prisma } from "@prisma/client";

export type AuditPayload = {
  action: string;
  userId?: string | null;
  entity?: string | null;
  entityId?: string | null;
  details?: Record<string, unknown> | null;
};

export async function createAuditLog(payload: AuditPayload) {
  try {
    await prisma.auditLog.create({
      data: {
        action: payload.action,
        userId: payload.userId ?? undefined,
        entity: payload.entity ?? undefined,
        entityId: payload.entityId ?? undefined,
        details: payload.details ? (payload.details as Prisma.InputJsonValue) : undefined
      }
    });
  } catch (err) {
    console.error("[AuditLog] Error al registrar:", err);
  }
}
