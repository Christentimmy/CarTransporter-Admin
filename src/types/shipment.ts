import { z } from "zod";

export const vehicleDetailsSchema = z.object({
  make: z.string().min(1, "Make is required"),
  model: z.string().min(1, "Model is required"),
  year: z
    .number()
    .min(1900)
    .max(new Date().getFullYear() + 1),
  color: z.string().optional(),
  drivetrain: z.string().optional(),
  isRunning: z.boolean().default(true),
  isAccidented: z.boolean().default(false),
  runningNote: z.string().optional(),
  keysAvailable: z.boolean().default(true),
  weight: z.number().positive().optional(),
  size: z
    .object({
      length: z.number().positive().optional(),
      width: z.number().positive().optional(),
      height: z.number().positive().optional(),
    })
    .optional(),
});

export const locationSchema = z.object({
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  country: z.string().min(1, "Country is required"),
  zipCode: z.string().min(1, "ZIP code is required"),
  coordinates: z.tuple([z.number(), z.number()]),
});

export const shipmentFormSchema = z.object({
  // Step 1: Vehicle Details
  vehicleDetails: vehicleDetailsSchema,

  // Step 2: Pickup & Delivery
  pickupLocation: locationSchema,
  deliveryLocation: locationSchema,

  // Step 3: Scheduling
  pickupWindow: z.object({
    start: z.date(),
    end: z.date(),
  }),
  deliveryDeadline: z.date(),

  // Step 4: Auction & Pricing
  auctionType: z.enum(["auction", "instant"]),
  instantAcceptPrice: z.number().optional(),
  auctionStartTime: z.date().optional(),
  auctionEndTime: z.date().optional(),

  // Step 5: Photos
  photos: z
    .array(z.instanceof(File))
    .min(1, "At least one photo is required")
    .max(10, "Maximum 10 photos allowed"),
});

export type ShipmentFormValues = z.infer<typeof shipmentFormSchema>;
export type LocationData = z.infer<typeof locationSchema>;
export type VehicleDetails = z.infer<typeof vehicleDetailsSchema>;

/**
 * GeoJSON Point + address fields for API create-shipment.
 * Matches backend schema: type (enum 'Point'), coordinates [lng, lat] required;
 * address, city, state, country, zipCode optional.
 * Coordinates come from autocomplete (LocationIQ) and are required to submit.
 */
export interface CreateShipmentLocation {
  type: "Point";
  coordinates: [number, number]; // [longitude, latitude] – required, from autocomplete
  note?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
}

/** Build payload for backend: only type + coordinates (required) and present address fields */
export function toShipmentLocationPayload(
  loc: CreateShipmentLocation,
): Record<string, unknown> {
  const out: Record<string, unknown> = {
    type: "Point",
    coordinates: loc.coordinates,
  };
  if (loc.note != null && loc.note !== "") out.note = loc.note;
  if (loc.address != null && loc.address !== "") out.address = loc.address;
  if (loc.city != null && loc.city !== "") out.city = loc.city;
  if (loc.state != null && loc.state !== "") out.state = loc.state;
  if (loc.country != null && loc.country !== "") out.country = loc.country;
  if (loc.zipCode != null && loc.zipCode !== "") out.zipCode = loc.zipCode;
  return out;
}

/** Location shape returned by get-my-shipments API */
export interface MyShipmentLocation {
  type: "Point";
  coordinates: [number, number];
  note?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
}

/** Vehicle details returned by get-my-shipments API */
export interface MyShipmentVehicleDetails {
  make: string;
  model: string;
  year: number;
  color?: string;
  drivetrain?: string;
  isRunning?: boolean;
  isAccidented?: boolean;
  runningNote?: string;
  keysAvailable?: boolean;
  weight?: number;
  size?: {
    length?: number;
    width?: number;
    height?: number;
  };
}

/** Single shipment from get-my-shipments API */
export interface MyShipment {
  _id: string;
  shipper: string;
  pickupLocation: MyShipmentLocation;
  deliveryLocation: MyShipmentLocation;
  vehicleDetails: MyShipmentVehicleDetails;
  pickupWindow: { start: string; end: string };
  deliveryDeadline: string;
  distance?: number;
  estimatedTime?: number;
  photos: string[];
  auctionDuration?: number;
  auctionStartTime?: string;
  auctionEndTime?: string;
  status: string;
  escrowStatus?: "NONE" | "PAID_IN_ESCROW" | "PAID_OUT" | "REFUNDED";
  createdAt: string;
  updatedAt: string;
  currentBid?: ListShipmentCurrentBid;
}

/** Pagination meta from get-my-shipments API */
export interface MyShipmentsPagination {
  total: number;
  page: number;
  pages: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

/** Response shape for GET /user/get-my-shipments */
export interface GetMyShipmentsResponse {
  data: MyShipment[];
  pagination: MyShipmentsPagination;
}

/** Current bid/winning bid as returned in assigned shipments */
export interface AssignedShipmentCurrentBid {
  amount: number;
  bidder: string;
  placedAt: string;
}

/** Single shipment from GET /user/get-my-assigned-shipments */
export interface AssignedShipment {
  _id: string;
  shipper: string;
  pickupLocation: MyShipmentLocation;
  deliveryLocation: MyShipmentLocation;
  vehicleDetails: MyShipmentVehicleDetails;
  pickupWindow: { start: string; end: string };
  deliveryDeadline: string;
  distance?: number;
  estimatedTime?: number;
  photos: string[];
  auctionDuration?: number;
  auctionStartTime?: string;
  auctionEndTime?: string;
  instantAcceptPrice?: number;
  currentBid?: AssignedShipmentCurrentBid;
  status: string;
  escrowStatus?: "NONE" | "PAID_IN_ESCROW" | "PAID_OUT" | "REFUNDED";
  createdAt: string;
  updatedAt: string;
  assignedTo?: string;
}

/** Response shape for GET /user/get-my-assigned-shipments */
export interface GetMyAssignedShipmentsResponse {
  data: AssignedShipment[];
  pagination: MyShipmentsPagination;
}

/** Shipper object in list-shipments response */
export interface ListShipmentShipper {
  _id: string;
  email?: string;
  phone_number?: string;
  region?: string;
  status?: string;
  is_email_verified?: boolean;
  is_phone_verified?: boolean;
  role?: string;
  createdAt?: string;
  updatedAt?: string;
}

/** Current bid in list-shipments item (when present) */
export interface ListShipmentCurrentBid {
  amount: number;
  bidder: string;
  placedAt: string;
}

/** Single shipment from GET /user/list-shipments (LIVE/DRAFT, for transporters to bid) */
export interface ListShipmentItem {
  _id: string;
  shipper: ListShipmentShipper;
  pickupLocation: MyShipmentLocation;
  deliveryLocation: MyShipmentLocation;
  vehicleDetails: MyShipmentVehicleDetails;
  pickupWindow: { start: string; end: string };
  deliveryDeadline: string;
  instantAcceptPrice: number;
  distance?: number;
  estimatedTime?: number;
  photos: string[];
  auctionDuration?: number;
  auctionStartTime?: string;
  auctionEndTime?: string;
  currentBid?: ListShipmentCurrentBid;
  status: string;
  createdAt: string;
  updatedAt: string;
}

/** Response shape for GET /user/list-shipments */
export interface ListShipmentsResponse {
  data: ListShipmentItem[];
  pagination: MyShipmentsPagination;
}
