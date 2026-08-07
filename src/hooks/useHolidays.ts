"use client";

import { useQuery } from "@tanstack/react-query";
import { getJSON } from "@/lib/api";
import type { Holiday } from "@/lib/holidays";

function normalizeYears(years: number[]): number[] {
  return [...new Set(years.filter((year) => Number.isInteger(year)).sort((a, b) => a - b))];
}

export function useHolidays(years: number[]) {
  const normalizedYears = normalizeYears(years);
  return useQuery({
    queryKey: ["holidays", normalizedYears] as const,
    queryFn: async () => {
      const chunks = await Promise.all(
        normalizedYears.map((year) => getJSON<Holiday[]>(`/api/holidays?year=${year}`))
      );
      return chunks.flat();
    },
    staleTime: 1000 * 60 * 60 * 24,
  });
}
