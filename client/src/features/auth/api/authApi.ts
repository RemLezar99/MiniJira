import { apiClient } from "../../../api/apiClient";
import { toApiError } from "../../../api/apiError";
import type {
  AuthResponse,
  AuthUser,
  LoginInput,
  LogoutResponse,
  RegisterInput
} from "../types";

export async function register(input: RegisterInput): Promise<AuthUser> {
  try {
    const response = await apiClient.post<AuthResponse>("/auth/register", input);
    return response.data.user;
  } catch (error) {
    throw toApiError(error);
  }
}

export async function login(input: LoginInput): Promise<AuthUser> {
  try {
    const response = await apiClient.post<AuthResponse>("/auth/login", input);
    return response.data.user;
  } catch (error) {
    throw toApiError(error);
  }
}

export async function logout(): Promise<LogoutResponse> {
  try {
    const response = await apiClient.post<LogoutResponse>("/auth/logout");
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
}

export async function getCurrentUser(): Promise<AuthUser> {
  try {
    const response = await apiClient.get<AuthResponse>("/auth/me");
    return response.data.user;
  } catch (error) {
    throw toApiError(error);
  }
}