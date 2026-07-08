import { ApiError } from "@/lib/api/client";

export function getApiErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    const details = flattenDetails(error.details);
    const message = details.length > 0 ? details.join(" ") : error.message;
    return `HTTP ${error.status}: ${message}`;
  }

  if (error instanceof TypeError) {
    return "Network error: the app could not reach the API proxy.";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "An unknown error occurred.";
}

function flattenDetails(details: unknown): string[] {
  if (!details) return [];

  if (typeof details === "string") {
    return [details];
  }

  if (Array.isArray(details)) {
    return details.flatMap(flattenDetails);
  }

  if (typeof details === "object") {
    return Object.entries(details).flatMap(([key, value]) => {
      const messages = flattenDetails(value);
      return messages.map((message) => (key === "detail" ? message : `${key}: ${message}`));
    });
  }

  return [String(details)];
}
