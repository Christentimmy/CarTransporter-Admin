import {
  API_ENDPOINTS,
  getAuthToken,
  removeAuthToken,
  storeAuthToken,
  getAccessToken,
  getRefreshToken,
  storeAuthTokens,
  removeAuthTokens,
} from "@/config/api";

type LoginPayload = {
  email: string;
  password: string;
};

type LoginResponse = {
  message?: string;
  accessToken: string;
  refreshToken: string;
  expiresIn?: number;
  role?: string;
  userId?: string;
};

export const authService = {
  async login(payload: LoginPayload): Promise<string> {
    const res = await fetch(API_ENDPOINTS.AUTH.LOGIN, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });


    let data: LoginResponse | undefined;   
    try {
      data = (await res.json()) as LoginResponse;
    } catch {
      data = undefined;
    }

    if (!res.ok) {
      const message = (data as any)?.message || "Login failed";
      throw new Error(message);
    }

    const { accessToken, refreshToken } = data || {};
    if (!accessToken || !refreshToken) {
      throw new Error("Login failed - missing tokens");
    }

    storeAuthTokens(accessToken, refreshToken);
    return accessToken;
  },

  isAuthenticated(): boolean {
    return Boolean(getAccessToken() || getAuthToken());
  },

  logout(): void {
    removeAuthTokens();
  },

  getToken(): string | null {
    return getAuthToken();
  },
};
