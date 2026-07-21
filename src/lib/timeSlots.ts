import { pad } from "@/lib/dates";

/** Fixed 48-slot list of 24h times, 00:00..23:30, step 30 minutes. */
export const TIME_SLOTS: string[] = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2);
  const m = (i % 2) * 30;
  return `${pad(h)}:${pad(m)}`;
});
