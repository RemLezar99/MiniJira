import { useCurrentUser } from "./useCurrentUser";

export function useAuthState() {
  const currentUserQuery = useCurrentUser();

  return {
    currentUser: currentUserQuery.data ?? null,
    isLoading: currentUserQuery.isPending,
    isAuthenticated: Boolean(currentUserQuery.data),
    isUnauthenticated:
      currentUserQuery.isSuccess && currentUserQuery.data === null,
    error: currentUserQuery.error,
    query: currentUserQuery
  };
}