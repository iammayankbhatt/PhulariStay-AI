import api from "@/lib/api";
import axios from "axios";

export type UserRole = "USER" | "OWNER" | "ADMIN";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type AuthResponse = {
  success: boolean;
  token: string;
  user: AuthUser;
};

export type RegisterPayload = {
  name: string;
  email: string;
  password: string;
  role: Exclude<UserRole, "ADMIN">;
};

export type LoginPayload = {
  email: string;
  password: string;
};

type ApiErrorResponse = {
  message?: string;
  errors?: {
    field?: string;
    message?: string;
  }[];
};

export function getAuthErrorMessage(error: unknown) {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    const data = error.response?.data;
    const validationMessages = data?.errors
      ?.map((item) => item.message)
      .filter(Boolean);

    if (validationMessages?.length) {
      return validationMessages.join(". ");
    }

    if (data?.message) {
      return data.message;
    }

    if (error.response?.status === 429) {
      return "Too many attempts. Please wait 15 minutes and try again.";
    }

    if (error.response?.status === 401) {
      return "Invalid email or password.";
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong. Please try again.";
}

export async function register(
  payload: RegisterPayload
): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>("/auth/register", payload);
  return response.data;
}

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>("/auth/login", payload);
  return response.data;
}

export async function logout(): Promise<void> {
  await api.post("/auth/logout");
}

export async function getCurrentUser(): Promise<AuthUser> {
  const response = await api.get<{ success: boolean; user: AuthUser }>(
    "/auth/me"
  );
  return response.data.user;
}
