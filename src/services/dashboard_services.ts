import { API_ENDPOINTS, getAuthHeader } from "@/config/api";

type DashboardStatResponse = {
  message?: string;
  totalUsers: number;
  totalShipments: number;
  totalPayments: number;
  totalRevenue: number;
};

type RecentShipmentsResponse<TShipment = unknown> = {
  message?: string;
  data: TShipment[];
};

export const dashboardService = {
  async getDashboardStat(): Promise<DashboardStatResponse> {
    const res = await fetch(API_ENDPOINTS.ADMIN.DASHBOARD_STAT, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(getAuthHeader() as Record<string, string>),
      },
    });

    const data = (await res.json()) as DashboardStatResponse;

    if (!res.ok) {
      const message = (data as any)?.message || "Failed to fetch dashboard statistics";
      throw new Error(message);
    }

    return data;
  },

  async getRecentShipments<TShipment = unknown>(): Promise<RecentShipmentsResponse<TShipment>> {
    const res = await fetch(API_ENDPOINTS.ADMIN.RECENT_SHIPMENTS, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(getAuthHeader() as Record<string, string>),
      },
    });

    const data = (await res.json()) as RecentShipmentsResponse<TShipment>;

    if (!res.ok) {
      const message = (data as any)?.message || "Failed to fetch recent shipments";
      throw new Error(message);
    }

    return data;
  },
};
