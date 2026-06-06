import { useMutation, useQueryClient } from "@tanstack/react-query";
import { register } from "../api/authApi";
import type { RegisterInput } from "../types";
import { authQueryKeys } from "./authQueryKeys";

export function useRegister() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: RegisterInput) => register(input),
    onSuccess: (user) => {
      queryClient.setQueryData(authQueryKeys.currentUser, user);
    }
  });
}