import { API_ENDPOINTS, getAuthHeader } from "@/config/api";

export type PaymentMethod = {
  name: string;
  type: "bank" | "paypal" | "mobile_money" | "other" | "card";
  accountNumber?: string;
  email?: string;
  routingNumber?: string;
  bankName?: string;
  cvv?: string;
  expiryDate?: string;
  cardNumber?: string;
  cardHolderName?: string;
};

export type WithdrawalRequest = {
  _id: string;
  user: {
    _id: string;
    email: string;
    phone_number?: string;
    company_name?: string;
    business_address?: string;
    tax_number?: string;
    region?: string;
    status: string;
    is_email_verified: boolean;
    is_phone_verified: boolean;
    role: string;
    balance: number;
    createdAt: string;
    updatedAt: string;
  };
  amount: number;
  status: "pending" | "approved" | "rejected" | "processed";
  paymentMethod: PaymentMethod;
  processedAt?: string;
  processedBy?: {
    _id: string;
    full_name?: string;
    email: string;
  };
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
};

type GetAllWithdrawalRequestsResponse = {
  message?: string;
  data: WithdrawalRequest[];
};

export const paymentsService = {
  async getAllWithdrawalRequests(): Promise<WithdrawalRequest[]> {
    const res = await fetch(API_ENDPOINTS.ADMIN.GET_ALL_WITHDRAWAL_REQUESTS, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(getAuthHeader() as Record<string, string>),
      },
    });

    const data = (await res.json()) as GetAllWithdrawalRequestsResponse;

    if (!res.ok) {
      const message =
        (data as any)?.message || "Failed to fetch withdrawal requests";
      throw new Error(message);
    }

    return Array.isArray(data.data) ? data.data : [];
  },

  async updateWithdrawalStatus(
    withdrawalRequestId: string,
    status: "pending" | "approved" | "rejected",
  ): Promise<void> {
    const res = await fetch(API_ENDPOINTS.ADMIN.UPDATE_WITHDRAWAL_STATUS, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(getAuthHeader() as Record<string, string>),
      },
      body: JSON.stringify({ withdrawalRequestId, status }),
    });

    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as any;
      const message = data?.message || "Failed to update withdrawal status";
      throw new Error(message);
    }
  },
};
