import { API_ENDPOINTS, getAuthHeader } from "@/config/api";

export const ALLOWED_STATUSES = [
  "approved",
  "rejected",
  "pending",
  "banned",
] as const;
export type AllowedStatus = (typeof ALLOWED_STATUSES)[number];

export type AdminUser = {
  _id: string;
  full_name?: string;
  email: string;
  phone_number?: string;
  company_name?: string;
  business_address?: string;
  tax_number?: string;
  status?: string;
  is_email_verified?: boolean;
  is_phone_verified?: boolean;
  squareCustomerId?: string | null;
  balance?: number;
  role?: string;
  paymentMethod?: unknown[];
  region?: unknown;
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
};

export type UserPaymentHistoryItem = {
  _id: string;
  shipment: string;
  bid: string;
  shipper: string;
  transporter: string;
  bidAmount: number;
  shipperFeePercent: number;
  transporterFeePercent: number;
  shipperFeeAmount: number;
  transporterFeeAmount: number;
  totalChargeAmount: number;
  transporterPayoutAmount: number;
  squarePaymentId?: string;
  squarePaymentStatus?: string;
  escrowStatus?: string;
  payoutStatus?: string;
  payoutEligibleAt?: string;
  capturedAt?: string;
  createdAt: string;
  updatedAt: string;
};

type GetUserPaymentHistoryResponse = {
  message?: string;
  data: UserPaymentHistoryItem[];
};

type GetAllUsersResponse = {
  message?: string;
  data: AdminUser[];
};

export const usersService = {
  async getAllUsers(): Promise<AdminUser[]> {
    const res = await fetch(API_ENDPOINTS.ADMIN.GET_ALL_USERS, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(getAuthHeader() as Record<string, string>),
      },
    });

    const data = (await res.json()) as GetAllUsersResponse;

    if (!res.ok) {
      const message = (data as any)?.message || "Failed to fetch users";
      throw new Error(message);
    }

    return Array.isArray(data.data) ? data.data : [];
  },

  async getUserPaymentHistory(
    userId: string,
  ): Promise<UserPaymentHistoryItem[]> {
    if (!userId) throw new Error("userId is required");

    const res = await fetch(
      API_ENDPOINTS.ADMIN.GET_USER_PAYMENT_HISTORY(userId),
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(getAuthHeader() as Record<string, string>),
        },
      },
    );

    const data = (await res.json()) as GetUserPaymentHistoryResponse;

    if (!res.ok) {
      const message =
        (data as any)?.message || "Failed to fetch payment history";
      throw new Error(message);
    }

    return Array.isArray(data.data) ? data.data : [];
  },

  async updateUserStatus(userId: string, status: AllowedStatus): Promise<void> {
    const res = await fetch(API_ENDPOINTS.ADMIN.UPDATE_USER_STATUS, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(getAuthHeader() as Record<string, string>),
      },
      body: JSON.stringify({ userId, status }),
    });

    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as any;
      const message = data?.message || "Failed to update user status";
      throw new Error(message);
    }
  },
};
