import { API_ENDPOINTS, getAuthHeader } from "@/config/api";

export type AdminTransporter = {
  _id: string;
  full_name?: string;
  email: string;
  phone_number?: string;
  company_name?: string;
  business_address?: string;
  tax_number?: string;
  status?: string;
  is_email_verified?: boolean;
  role?: string;
  region?: unknown;
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
};

export type TransporterWithdrawPaymentMethod = {
  name?: string;
  type?: string;
  accountNumber?: string;
  routingNumber?: string;
  bankName?: string;
};

export type TransporterWithdrawHistoryItem = {
  _id: string;
  user: string;
  amount: number;
  status: string;
  paymentMethod?: TransporterWithdrawPaymentMethod;
  createdAt: string;
  updatedAt: string;
};

type GetTransporterWithdrawHistoryResponse = {
  message?: string;
  data: TransporterWithdrawHistoryItem[];
};

type GetAllTransportersResponse = {
  message?: string;
  data: AdminTransporter[];
};

export const transportersService = {
  async getAllTransporters(): Promise<AdminTransporter[]> {
    const res = await fetch(API_ENDPOINTS.ADMIN.GET_ALL_TRANSPORTERS, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(getAuthHeader() as Record<string, string>),
      },
    });

    const data = (await res.json()) as GetAllTransportersResponse;

    if (!res.ok) {
      const message = (data as any)?.message || "Failed to fetch transporters";
      throw new Error(message);
    }

    return Array.isArray(data.data) ? data.data : [];
  },

  async getTransporterWithdrawHistory(
    userId: string,
  ): Promise<TransporterWithdrawHistoryItem[]> {
    if (!userId) throw new Error("userId is required");

    const res = await fetch(
      API_ENDPOINTS.ADMIN.GET_TRANSPORTER_WITHDRAW_HISTORY(userId),
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(getAuthHeader() as Record<string, string>),
        },
      },
    );

    const data = (await res.json()) as GetTransporterWithdrawHistoryResponse;

    if (!res.ok) {
      const message =
        (data as any)?.message || "Failed to fetch withdrawal history";
      throw new Error(message);
    }

    return Array.isArray(data.data) ? data.data : [];
  },
};
