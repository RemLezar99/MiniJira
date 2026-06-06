import { useCurrentUser } from "./useCurrentUser";

export function useAuthState() {
  const currentUserQuery = useCurrentUser();

  const isUnauthenticated =
    currentUserQuery.isError && currentUserQuery.error.status === 401;

  return {
    currentUser: currentUserQuery.data ?? null,
    isLoading: currentUserQuery.isLoading,
    isAuthenticated: Boolean(currentUserQuery.data),
    isUnauthenticated,
    error: isUnauthenticated ? null : currentUserQuery.error,
    query: currentUserQuery
  };
}