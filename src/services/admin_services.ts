import { API_ENDPOINTS, getAuthHeader } from "@/config/api";

export type Admin = {
  _id: string;
  full_name: string;
  email: string;
  phone_number?: string;
  status: string;
  is_email_verified: boolean;
  is_phone_verified: boolean;
  squareCustomerId: string | null;
  balance: number;
  role: string;
  paymentMethod: any[];
  createdAt: string;
  updatedAt: string;
};

type GetAllAdminsResponse = {
  message?: string;
  data: Admin[];
};

export const adminService = {
  async getAllAdmins(): Promise<Admin[]> {
    const res = await fetch(API_ENDPOINTS.ADMIN.GET_ALL_ADMINS, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(getAuthHeader() as Record<string, string>),
      },
    });

    const data = (await res.json()) as GetAllAdminsResponse;

    if (!res.ok) {
      const message = (data as any)?.message || "Failed to fetch admins";
      throw new Error(message);
    }

    return Array.isArray(data.data) ? data.data : [];
  },

  async register(payload: {
    full_name: string;
    email: string;
    password: string;
  }): Promise<void> {
    const res = await fetch(API_ENDPOINTS.ADMIN.REGISTER_ADMIN, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(getAuthHeader() as Record<string, string>),
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as any;
      const message = data?.message || "Failed to register admin";
      throw new Error(message);
    }
  },
};
