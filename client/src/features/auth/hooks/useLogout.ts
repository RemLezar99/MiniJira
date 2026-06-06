import { useMutation, useQueryClient } from "@tanstack/react-query";
import { logout } from "../api/authApi";
import { authQueryKeys } from "./authQueryKeys";

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.setQueryData(authQueryKeys.currentUser, null);
      queryClient.removeQueries({
        queryKey: authQueryKeys.currentUser
      });
    }
  });
}