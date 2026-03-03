import { prisma } from "./prisma";

const MP_PAYMENTS_KEY = "mp_payments_enabled";

export async function getMpPaymentsEnabled(): Promise<boolean> {
  const setting = await prisma.setting.findUnique({
    where: { key: MP_PAYMENTS_KEY }
  });
  return Boolean(setting?.boolValue);
}

export async function setMpPaymentsEnabled(enabled: boolean) {
  return prisma.setting.upsert({
    where: { key: MP_PAYMENTS_KEY },
    update: { boolValue: enabled },
    create: { key: MP_PAYMENTS_KEY, boolValue: enabled }
  });
}

