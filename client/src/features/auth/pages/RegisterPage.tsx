import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useRegister } from "../hooks";
import {
  registerFormSchema,
  type RegisterFormValues
} from "../schemas";
import type { ApiError } from "../../../api/apiError";

export function RegisterPage() {
  const navigate = useNavigate();
  const registerMutation = useRegister();

  const {
    register: registerField,
    handleSubmit,
    formState: { errors }
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      email: "",
      displayName: "",
      password: ""
    }
  });

  function onSubmit(values: RegisterFormValues) {
    registerMutation.mutate(values, {
      onSuccess: () => {
        navigate("/projects");
      }
    });
  }

  const serverError = registerMutation.error as ApiError | null;

  return (
    <main>
      <h1>Create account</h1>

      <p>
        Already have an account? <Link to="/login">Log in</Link>.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div>
          <label htmlFor="displayName">Display name</label>
          <input
            id="displayName"
            type="text"
            autoComplete="name"
            {...registerField("displayName")}
          />
          {errors.displayName ? (
            <p role="alert">{errors.displayName.message}</p>
          ) : null}
        </div>

        <div>
          <label htmlFor="register-email">Email</label>
          <input
            id="register-email"
            type="email"
            autoComplete="email"
            {...registerField("email")}
          />
          {errors.email ? <p role="alert">{errors.email.message}</p> : null}
        </div>

        <div>
          <label htmlFor="register-password">Password</label>
          <input
            id="register-password"
            type="password"
            autoComplete="new-password"
            {...registerField("password")}
          />
          {errors.password ? (
            <p role="alert">{errors.password.message}</p>
          ) : null}
        </div>

        {serverError ? <p role="alert">{serverError.message}</p> : null}

        <button type="submit" disabled={registerMutation.isPending}>
          {registerMutation.isPending ? "Creating account..." : "Create account"}
        </button>
      </form>
    </main>
  );
}