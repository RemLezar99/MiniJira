import { useQuery } from "@tanstack/react-query";
import { getCurrentUser } from "../api/authApi";
import type { AuthUser } from "../types";
import type { ApiError } from "../../../api/apiError";
import { authQueryKeys } from "./authQueryKeys";

export function useCurrentUser() {
  return useQuery<AuthUser | null, ApiError>({
    queryKey: authQueryKeys.currentUser,
    queryFn: getCurrentUser,
    retry: false,
    refetchOnWindowFocus: false
  });
}