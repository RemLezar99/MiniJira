import { useNavigate } from "react-router-dom";
import { useLogout } from "../hooks";
import type { ApiError } from "../../../api/apiError";

export function LogoutButton() {
  const navigate = useNavigate();
  const logoutMutation = useLogout();

  function handleLogout() {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        navigate("/", {
          replace: true
        });
      }
    });
  }

  const error = logoutMutation.error as ApiError | null;

  return (
    <div>
      <button
        type="button"
        onClick={handleLogout}
        disabled={logoutMutation.isPending}
      >
        {logoutMutation.isPending ? "Logging out..." : "Log out"}
      </button>

      {error ? <p role="alert">{error.message}</p> : null}
    </div>
  );
}