"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { del, getJSON, patchJSON, postJSON } from "@/lib/api";
import type { Todo } from "@/lib/types";
import type { CreateTodoInput, UpdateTodoInput } from "@/lib/validators";

const KEY = ["todos"] as const;

export function useTodos() {
  return useQuery({
    queryKey: KEY,
    queryFn: () => getJSON<Todo[]>("/api/todos"),
  });
}

export function useCreateTodo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTodoInput) => postJSON<Todo>("/api/todos", input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
    },
  });
}

interface UpdateTodoVars {
  id: number;
  patch: UpdateTodoInput;
}

export function useUpdateTodo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: UpdateTodoVars) =>
      patchJSON<Todo>(`/api/todos/${id}`, patch),
    onMutate: async ({ id, patch }: UpdateTodoVars) => {
      await qc.cancelQueries({ queryKey: KEY });
      const previous = qc.getQueryData<Todo[]>(KEY);
      if (previous) {
        qc.setQueryData<Todo[]>(
          KEY,
          previous.map((t) => (t.id === id ? { ...t, ...patch } : t))
        );
      }
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) qc.setQueryData(KEY, context.previous);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: KEY });
    },
  });
}

export function useDeleteTodo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => del<{ ok: true }>(`/api/todos/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
    },
  });
}
