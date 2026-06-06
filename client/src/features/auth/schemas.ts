import { z } from "zod";

export const registerFormSchema = z.object({
  email: z.email("Enter a valid email address").toLowerCase(),
  displayName: z
    .string()
    .trim()
    .min(1, "Display name is required")
    .max(80, "Display name must be at most 80 characters"),
  password: z.string().min(8, "Password must be at least 8 characters")
});

export const loginFormSchema = z.object({
  email: z.email("Enter a valid email address").toLowerCase(),
  password: z.string().min(1, "Password is required")
});

export type RegisterFormValues = z.infer<typeof registerFormSchema>;
export type LoginFormValues = z.infer<typeof loginFormSchema>;