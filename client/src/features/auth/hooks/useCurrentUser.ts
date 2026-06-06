import { useQuery } from "@tanstack/react-query";
import { getCurrentUser } from "../api/authApi";
import type { AuthUser } from "../types";
import type { ApiError } from "../../../api/apiError";
import { authQueryKeys } from "./authQueryKeys";

export function useCurrentUser() {
  return useQuery<AuthUser, ApiError>({
    queryKey: authQueryKeys.currentUser,
    queryFn: getCurrentUser,

    /*
      401 is an expected state when the visitor is not logged in.
      We do not want TanStack Query to repeatedly retry /auth/me.
    */
    retry: (failureCount, error) => {
      if (error.status === 401) {
        return false;
      }

      return failureCount < 2;
    },

    /*
      Avoid refetching on every window focus while auth UI is still simple.
      We can revisit this later.
    */
    refetchOnWindowFocus: false
  });
}