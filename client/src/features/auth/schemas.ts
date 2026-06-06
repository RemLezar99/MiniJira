import { z } from "zod";

export const registerFormSchema = z.object({
  email: z.email("Enter a valid email address").toLowerCase(),
  displayName: z
    .string()
    .trim()
    .min(1, "Display name is required")
    .max(80, "Display name must be at most 80 characters"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
});

export type RegisterFormValues = z.infer<typeof registerFormSchema>;