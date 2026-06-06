import axios from "axios";

export type ApiError = {
  message: string;
  status?: number;
  details?: unknown;
};

export function toApiError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    const responseData = error.response?.data as
      | {
          message?: unknown;
          details?: unknown;
        }
      | undefined;

    return {
      message:
        typeof responseData?.message === "string"
          ? responseData.message
          : error.message || "Request failed",
      status: error.response?.status,
      details: responseData?.details
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message
    };
  }

  return {
    message: "An unknown error occurred"
  };
}