import { useMutation, useQueryClient } from "@tanstack/react-query";
import { login } from "../api/authApi";
import type { LoginInput } from "../types";
import { authQueryKeys } from "./authQueryKeys";

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: LoginInput) => login(input),
    onSuccess: (user) => {
      queryClient.setQueryData(authQueryKeys.currentUser, user);
    }
  });
}