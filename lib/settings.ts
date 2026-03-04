import { prisma } from "./prisma";

const MP_PAYMENTS_KEY = "mp_payments_enabled";
const WHATSAPP_NUMBER_KEY = "whatsapp_number";

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

export async function getWhatsappNumber(): Promise<string | null> {
  const setting = await prisma.setting.findUnique({
    where: { key: WHATSAPP_NUMBER_KEY }
  });
  const raw = setting?.stringValue?.trim();
  return raw || null;
}

export async function setWhatsappNumber(value: string) {
  const trimmed = value.trim();
  return prisma.setting.upsert({
    where: { key: WHATSAPP_NUMBER_KEY },
    update: { stringValue: trimmed || null },
    create: { key: WHATSAPP_NUMBER_KEY, stringValue: trimmed || null }
  });
}

