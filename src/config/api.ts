const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: `${API_BASE_URL}/admin/login`,
    REFRESH_TOKEN: `${API_BASE_URL}/auth/refresh-token`,
  },
  ADMIN: {
    DASHBOARD_STAT: `${API_BASE_URL}/admin/dashboard-stat`,
    RECENT_SHIPMENTS: `${API_BASE_URL}/admin/recent-shipments`,
    GET_ALL_USERS: `${API_BASE_URL}/admin/get-all-users`,
    UPDATE_USER_STATUS: `${API_BASE_URL}/admin/update-user-status`,
    GET_ALL_TRANSPORTERS: `${API_BASE_URL}/admin/get-all-transporters`,
    GET_ALL_SHIPMENTS: `${API_BASE_URL}/admin/get-all-shipments`,
    GET_SHIPMENT_DETAILS: (shipmentId: string) =>
      `${API_BASE_URL}/admin/get-shipment-details/${shipmentId}`,
    REGISTER_ADMIN: `${API_BASE_URL}/admin/register`,
    GET_ALL_ADMINS: `${API_BASE_URL}/admin/get-all-admins`,
    GET_ALL_WITHDRAWAL_REQUESTS: `${API_BASE_URL}/admin/get-all-withdrawal-requests`,
    UPDATE_WITHDRAWAL_STATUS: `${API_BASE_URL}/admin/update-withdrawal-request-status`,
    GET_USER_PAYMENT_HISTORY: (userId: string) =>
      `${API_BASE_URL}/admin/get-user-payment-history/${userId}`,
    GET_TRANSPORTER_WITHDRAW_HISTORY: (userId: string) =>
      `${API_BASE_URL}/admin/get-transporter-withdraw-history/${userId}`,
  },
};

export const getAuthHeader = (): { Authorization: string } | {} => {
  const token = getAccessToken() || localStorage.getItem("authToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const storeAuthToken = (token: string): void => {
  localStorage.setItem("authToken", token);
};

export const removeAuthToken = (): void => {
  localStorage.removeItem("authToken");
};

export const getAuthToken = (): string | null => {
  return localStorage.getItem("authToken");
};

// NEW TOKEN STORAGE FUNCTIONS
export const storeAuthTokens = (accessToken: string, refreshToken: string): void => {
  localStorage.setItem("accessToken", accessToken);
  localStorage.setItem("refreshToken", refreshToken);
};

export const getAccessToken = (): string | null => {
  return localStorage.getItem("accessToken");
};

export const getRefreshToken = (): string | null => {
  return localStorage.getItem("refreshToken");
};

export const removeAuthTokens = (): void => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("authToken");
  localStorage.removeItem("userRole");
};

// TOKEN REFRESH LOGIC
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

const subscribeTokenRefresh = (callback: (token: string) => void) => {
  refreshSubscribers.push(callback);
};

const onTokenRefreshed = (token: string) => {
  refreshSubscribers.forEach(callback => callback(token));
  refreshSubscribers = [];
};

export const refreshAccessToken = async (): Promise<string> => {
  try {
    const refreshToken = getRefreshToken();
    if (!refreshToken) throw new Error("No refresh token");

    const response = await fetch(API_ENDPOINTS.AUTH.REFRESH_TOKEN, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) throw new Error("Token refresh failed");

    const data = await response.json();
    const { accessToken, refreshToken: newRefreshToken } = data;

    storeAuthTokens(accessToken, newRefreshToken);
    onTokenRefreshed(accessToken);

    return accessToken;
  } catch (error) {
    removeAuthTokens();
    window.location.href = '/login';
    throw error;
  }
};

export const fetchWithAuth = async (
  url: string,
  options: RequestInit = {},
): Promise<Response> => {
  const originalRequest = options;

  try {
    const response = await fetch(url, {
      ...originalRequest,
      headers: {
        ...originalRequest.headers,
        ...getAuthHeader(),
      },
    });

    if (response.status === 401 && !isRefreshing) {
      isRefreshing = true;
      try {
        const newToken = await refreshAccessToken();
        isRefreshing = false;
        return fetch(url, {
          ...originalRequest,
          headers: {
            ...originalRequest.headers,
            Authorization: `Bearer ${newToken}`,
          },
        });
      } catch (refreshError) {
        isRefreshing = false;
        throw refreshError;
      }
    }

    if (response.status === 401 && isRefreshing) {
      return new Promise((resolve) => {
        subscribeTokenRefresh((token: string) => {
          resolve(
            fetch(url, {
              ...originalRequest,
              headers: {
                ...originalRequest.headers,
                Authorization: `Bearer ${token}`,
              },
            }),
          );
        });
      });
    }

    return response;
  } catch (error) {
    throw error;
  }
};
