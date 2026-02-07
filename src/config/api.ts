const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: `${API_BASE_URL}/admin/login`,
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
  },
};

export const getAuthHeader = (): { Authorization: string } | {} => {
  const token = localStorage.getItem("authToken");
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
