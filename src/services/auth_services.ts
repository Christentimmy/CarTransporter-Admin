import {
  API_ENDPOINTS,
  getAuthToken,
  removeAuthToken,
  storeAuthToken,
} from "@/config/api";

type LoginPayload = {
  identifier: string;
  password: string;
};

type LoginResponse = {
  message?: string;
  token: string;
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

    const token = data?.token;
    if (!token) {
      throw new Error("Login failed");
    }

    storeAuthToken(token);
    return token;
  },

  logout(): void {
    removeAuthToken();
  },

  getToken(): string | null {
    return getAuthToken();
  },
};
