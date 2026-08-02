import axios from "axios";

export function resolveApiBaseUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_API_URL || "/api";
  const normalizedUrl = configuredUrl.replace(/\/+$/, "");

  return normalizedUrl.endsWith("/api")
    ? normalizedUrl
    : `${normalizedUrl}/api`;
}

const api = axios.create({
  baseURL: resolveApiBaseUrl(),
  timeout: 10000,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  if (typeof window === "undefined") {
    return config;
  }

  const token = localStorage.getItem("phularistay_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

type ApiErrorResponse = {
  message?: string;
  errors?: {
    field?: string;
    message?: string;
  }[];
};

export function getApiErrorMessage(
  error: unknown,
  fallback = "Something went wrong. Please try again."
) {
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

    if (error.code === "ECONNABORTED") {
      return "The request took too long to finish. Please try again.";
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}

export default api;
