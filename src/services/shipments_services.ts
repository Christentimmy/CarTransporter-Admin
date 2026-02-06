import { API_ENDPOINTS, getAuthHeader } from "@/config/api";

export type Location = {
  type: string;
  coordinates: number[]; // [longitude, latitude]
  note?: string;
  address: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
};

export type VehicleDetails = {
  make: string;
  model: string;
  year: number;
  color: string;
  drivetrain: string;
  isRunning: boolean;
  isAccidented: boolean;
  runningNote: string;
  keysAvailable: boolean;
  weight: number;
  size: {
    length: number;
    width: number;
    height: number;
  };
};

export type CurrentBid = {
  amount: number;
  bidder: string;
  placedAt: string;
};

export type PickupWindow = {
  start: string;
  end: string;
};

export type ShipmentStatus =
  | "DRAFT"
  | "LIVE"
  | "ENDED"
  | "ASSIGNED"
  | "IN_TRANSIT"
  | "DELIVERED"
  | "COMPLETED"
  | "DISPUTED"
  | "CANCELLED";

export type EscrowStatus = "NONE" | "PAID_IN_ESCROW" | "PAID_OUT" | "REFUNDED";

export type AdminShipment = {
  _id: string;
  shipper: string;
  pickupLocation: Location;
  deliveryLocation: Location;
  distance: number;
  estimatedTime: number;
  vehicleDetails: VehicleDetails;
  pickupWindow: PickupWindow;
  deliveryDeadline: string;
  photos: string[];
  auctionDuration: number;
  instantAcceptPrice?: number;
  auctionStartTime?: string;
  auctionEndTime?: string;
  status: ShipmentStatus;
  currentBid?: CurrentBid;
  assignedTo?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  escrowStatus?: EscrowStatus;
  lastPayment?: string;
};

export type ShipmentDetails = {
  shipment: {
    _id: string;
    shipper: {
      _id: string;
      email: string;
      phone_number?: string;
      full_name?: string;
      company_name?: string;
      business_address?: string;
      tax_number?: string;
      status?: string;
      is_email_verified?: boolean;
      is_phone_verified?: boolean;
      role?: string;
      createdAt: string;
      updatedAt: string;
      region?: string;
      balance?: number;
      paymentMethod?: any[];
    };
    instantAcceptPrice?: number;
    assignedTo?: {
      _id: string;
      email: string;
      phone_number?: string;
      full_name?: string;
      company_name?: string;
      business_address?: string;
      tax_number?: string;
      status?: string;
      is_email_verified?: boolean;
      is_phone_verified?: boolean;
      role?: string;
      createdAt: string;
      updatedAt: string;
      region?: string;
      balance?: number;
      paymentMethod?: any[];
    };
    pickupLocation: Location;
    deliveryLocation: Location;
    distance: number;
    estimatedTime: number;
    vehicleDetails: VehicleDetails;
    pickupWindow: PickupWindow;
    deliveryDeadline: string;
    photos: string[];
    auctionDuration: number;
    auctionStartTime?: string;
    auctionEndTime?: string;
    status: ShipmentStatus;
    currentBid?: CurrentBid;
    createdAt: string;
    updatedAt: string;
    escrowStatus?: EscrowStatus;
    lastPayment?: string;
  };
  payment?: {
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
    squarePaymentId: string;
    squarePaymentStatus: string;
    escrowStatus: string;
    payoutStatus: string;
    payoutEligibleAt?: string;
    createdAt: string;
    updatedAt: string;
    capturedAt?: string;
  };
};

type GetAllShipmentsResponse = {
  message?: string;
  data: AdminShipment[];
};

type GetShipmentDetailsResponse = {
  message?: string;
  data: ShipmentDetails;
};

export const shipmentsService = {
  async getAllShipments(): Promise<AdminShipment[]> {
    const res = await fetch(API_ENDPOINTS.ADMIN.GET_ALL_SHIPMENTS, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(getAuthHeader() as Record<string, string>),
      },
    });

    const data = (await res.json()) as GetAllShipmentsResponse;

    if (!res.ok) {
      const message = (data as any)?.message || "Failed to fetch shipments";
      throw new Error(message);
    }

    return Array.isArray(data.data) ? data.data : [];
  },

  async getShipmentDetails(shipmentId: string): Promise<ShipmentDetails> {
    if (!shipmentId || typeof shipmentId !== "string") {
      throw new Error("Invalid shipment ID");
    }
    const url = API_ENDPOINTS.ADMIN.GET_SHIPMENT_DETAILS(shipmentId);
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(getAuthHeader() as Record<string, string>),
      },
    });

    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as any;
      const message =
        data?.message || `Failed to fetch shipment details (${res.status})`;
      throw new Error(message);
    }

    const data = (await res.json()) as GetShipmentDetailsResponse;
    if (!data?.data?.shipment) {
      throw new Error("Invalid shipment details response");
    }
    return data.data;
  },
};
