import { apiRequest } from "@/lib/api/client";
import { apiEndpoints } from "@/lib/api/endpoints";
import type { LoginPayload, TokenPair } from "@/lib/api/types";
import { saveAuthTokens } from "@/lib/auth/token-storage";

export async function login(payload: LoginPayload) {
  const tokens = await apiRequest<TokenPair>(apiEndpoints.auth.token, {
    auth: false,
    body: JSON.stringify(payload),
    method: "POST"
  });

  saveAuthTokens(tokens);
  return tokens;
}

export function getCurrentUser() {
  return apiRequest<unknown>(apiEndpoints.auth.me);
}
