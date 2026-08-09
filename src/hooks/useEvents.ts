"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { del, getJSON, patchJSON, postJSON } from "@/lib/api";
import type { CalEvent } from "@/lib/types";
import type { CreateEventInput, UpdateEventInput } from "@/lib/validators";

const KEY = ["events"] as const;

export function useEvents() {
  return useQuery({
    queryKey: KEY,
    queryFn: () => getJSON<CalEvent[]>("/api/events"),
  });
}

export function useCreateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateEventInput) =>
      postJSON<CalEvent>("/api/events", input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
    },
  });
}

interface UpdateEventVars {
  id: number;
  patch: UpdateEventInput;
}

export function useUpdateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: UpdateEventVars) =>
      patchJSON<CalEvent>(`/api/events/${id}`, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
    },
  });
}

export function useDeleteEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => del<{ ok: true }>(`/api/events/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
    },
  });
}
