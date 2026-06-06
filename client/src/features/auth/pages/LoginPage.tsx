import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useLogin } from "../hooks";
import { loginFormSchema, type LoginFormValues } from "../schemas";
import type { ApiError } from "../../../api/apiError";


export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const loginMutation = useLogin();

  const from =
  (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ??
  "/projects";

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: "",
      password: ""
    }
  });

  function onSubmit(values: LoginFormValues) {
    loginMutation.mutate(values, {
      onSuccess: () => {
        navigate(from, { replace: true });
      }
    });
  }

  const serverError = loginMutation.error as ApiError | null;

  return (
    <main>
      <h1>Log in</h1>

      <p>
        Do not have an account? <Link to="/register">Create one</Link>.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div>
          <label htmlFor="login-email">Email</label>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            {...register("email")}
          />
          {errors.email ? <p role="alert">{errors.email.message}</p> : null}
        </div>

        <div>
          <label htmlFor="login-password">Password</label>
          <input
            id="login-password"
            type="password"
            autoComplete="current-password"
            {...register("password")}
          />
          {errors.password ? <p role="alert">{errors.password.message}</p> : null}
        </div>

        {serverError ? <p role="alert">{serverError.message}</p> : null}

        <button type="submit" disabled={loginMutation.isPending}>
          {loginMutation.isPending ? "Logging in..." : "Log in"}
        </button>
      </form>
    </main>
  );
}