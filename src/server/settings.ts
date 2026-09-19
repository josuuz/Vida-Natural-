import 'server-only';
import { cache } from 'react';
import { prisma } from './db';

/**
 * Configurações da loja em chave/valor. Nada de regra comercial hardcoded no
 * frontend: o que muda o preço ou o frete vive aqui.
 */
export const DEFAULTS = {
  'shipping.mode': 'quote', // quote = frete combinado pela equipe | table = tabela
  'shipping.freeShipping.enabled': 'false',
  'shipping.freeShipping.thresholdCents': '25000',
  'shipping.handlingDays': '2',
  'checkout.minOrderCents': '0',
} as const;

export type SettingKey = keyof typeof DEFAULTS;

export const getSettings = cache(async (): Promise<Record<string, string>> => {
  const rows = await prisma.setting.findMany();
  const values: Record<string, string> = { ...DEFAULTS };
  for (const row of rows) values[row.key] = row.value;
  return values;
});

export async function getSetting(key: SettingKey) {
  const settings = await getSettings();
  return settings[key] ?? DEFAULTS[key];
}

export async function getNumberSetting(key: SettingKey) {
  const value = Number(await getSetting(key));
  return Number.isFinite(value) ? value : Number(DEFAULTS[key]);
}

export async function getBooleanSetting(key: SettingKey) {
  return (await getSetting(key)) === 'true';
}

export async function setSetting(key: string, value: string) {
  await prisma.setting.upsert({ where: { key }, update: { value }, create: { key, value } });
}
