import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Search, MapPin, Calendar, DollarSign, Car, Clock, User, CreditCard } from "lucide-react";

import { shipmentsService, type AdminShipment, type ShipmentStatus, type ShipmentDetails } from "@/services/shipments_services";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const getStatusVariant = (status?: ShipmentStatus) => {
  if (!status) return "outline";
  switch (status) {
    case "DRAFT":
      return "secondary";
    case "LIVE":
      return "default";
    case "ENDED":
    case "COMPLETED":
      return "default";
    case "ASSIGNED":
    case "IN_TRANSIT":
    case "DELIVERED":
      return "default";
    case "DISPUTED":
    case "CANCELLED":
      return "destructive";
    default:
      return "outline";
  }
};

const formatAddress = (loc: { address?: string; city?: string; state?: string; country?: string }) => {
  const parts = [loc.address, loc.city, loc.state, loc.country].filter(Boolean);
  return parts.join(", ") || "—";
};

const formatDate = (dateStr?: string) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString();
};

const AdminShipments = () => {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedShipmentId, setSelectedShipmentId] = useState<string | null>(null);

  const {
    data: shipments,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["admin", "shipments"],
    queryFn: shipmentsService.getAllShipments,
  });

  const {
    data: shipmentDetails,
    isLoading: detailsLoading,
    error: detailsError,
  } = useQuery({
    queryKey: ["admin", "shipment-details", selectedShipmentId],
    queryFn: async () => {
      if (!selectedShipmentId) return null;
      try {
        return await shipmentsService.getShipmentDetails(selectedShipmentId);
      } catch (err) {
        console.error("Failed to fetch shipment details:", err);
        throw err;
      }
    },
    enabled: !!selectedShipmentId,
    retry: false,
  });

  const filteredShipments = useMemo(() => {
    const list = Array.isArray(shipments) ? shipments : [];
    const q = query.trim().toLowerCase();

    return list.filter((s) => {
      const statusOk = statusFilter === "all" ? true : s.status === statusFilter;
      if (!statusOk) return false;
      if (!q) return true;
      const haystack = `${s._id} ${formatAddress(s.pickupLocation)} ${formatAddress(s.deliveryLocation)} ${s.vehicleDetails.make} ${s.vehicleDetails.model}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [shipments, query, statusFilter]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-destructive">
        {(error as Error).message || "Failed to load shipments"}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Shipments</h1>
        <p className="text-sm text-muted-foreground">
          Track and control all shipments across the platform.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search shipments..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {filteredShipments.length === 0 && query.trim() === "" && statusFilter === "all" ? (
        <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
          No shipments found.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredShipments.length === 0 ? (
            <div className="sm:col-span-full rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
              No shipments found
            </div>
          ) : (
            filteredShipments.map((s) => (
              <button
                key={s._id}
                type="button"
                onClick={() => setSelectedShipmentId(s._id)}
                className="text-left group"
              >
                <Card className="h-full hover:shadow-lg transition-all duration-200 hover:scale-[1.02] border-border/50 hover:border-primary/30">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="font-mono text-xs text-muted-foreground truncate">{s._id}</div>
                        <Badge variant={getStatusVariant(s.status) as any} className="text-xs mt-1">
                          {s.status}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDate(s.createdAt)}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-start gap-2 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3 flex-shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{formatAddress(s.pickupLocation)}</span>
                      </div>
                      <div className="flex items-start gap-2 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3 flex-shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{formatAddress(s.deliveryLocation)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <Car className="h-3 w-3 text-muted-foreground" />
                      <span className="font-medium">
                        {s.vehicleDetails.make} {s.vehicleDetails.model}
                      </span>
                      <span className="text-muted-foreground">({s.vehicleDetails.year})</span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t">
                      {s.currentBid ? (
                        <div className="flex items-center gap-1 text-xs font-medium">
                          <DollarSign className="h-3 w-3" />
                          ${s.currentBid.amount}
                        </div>
                      ) : (
                        <div className="text-xs text-muted-foreground">No bids</div>
                      )}
                      <div className="text-xs text-muted-foreground">
                        {s.distance} mi
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </button>
            ))
          )}
        </div>
      )}

      <Dialog open={Boolean(selectedShipmentId)} onOpenChange={(open) => {
      if (!open) setSelectedShipmentId(null);
    }}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-4xl sm:w-full max-h-[85vh] overflow-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>Shipment {shipmentDetails?.shipment._id || selectedShipmentId || "—"}</DialogTitle>
            <DialogDescription asChild>
              <div>
                {detailsLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading details...
                  </div>
                ) : detailsError ? (
                  <span className="text-destructive">Failed to load details</span>
                ) : (
                  shipmentDetails && (
                    <Badge variant={getStatusVariant(shipmentDetails.shipment.status) as any}>
                      {shipmentDetails.shipment.status}
                    </Badge>
                  )
                )}
              </div>
            </DialogDescription>
          </DialogHeader>

          {detailsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">Loading shipment details...</span>
            </div>
          ) : detailsError ? (
            <div className="text-center py-12">
              <div className="text-destructive text-sm font-medium mb-2">
                Failed to load shipment details
              </div>
              <div className="text-xs text-muted-foreground mb-4">
                {(detailsError as Error).message || "Please try again later."}
              </div>
              <button
                type="button"
                onClick={() => setSelectedShipmentId(null)}
                className="text-xs text-muted-foreground hover:text-foreground underline"
              >
                Close
              </button>
            </div>
          ) : shipmentDetails ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1 sm:col-span-2">
                <div className="text-xs text-muted-foreground">Shipment ID</div>
                <div className="text-sm font-mono break-all">{shipmentDetails.shipment._id}</div>
              </div>

              <div className="space-y-1 sm:col-span-2">
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <User className="h-3 w-3" /> Shipper
                </div>
                <div className="text-sm">
                  {shipmentDetails.shipment.shipper.full_name || shipmentDetails.shipment.shipper.email}
                </div>
                <div className="text-xs text-muted-foreground">
                  {shipmentDetails.shipment.shipper.email} | {shipmentDetails.shipment.shipper.phone_number || "—"}
                </div>
                {shipmentDetails.shipment.shipper.company_name && (
                  <div className="text-xs text-muted-foreground">{shipmentDetails.shipment.shipper.company_name}</div>
                )}
                <div className="text-xs text-muted-foreground">
                  Balance: ${shipmentDetails.shipment.shipper.balance ?? 0}
                </div>
              </div>

              {shipmentDetails.shipment.assignedTo && (
                <div className="space-y-1 sm:col-span-2">
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <User className="h-3 w-3" /> Assigned Transporter
                  </div>
                  <div className="text-sm">
                    {shipmentDetails.shipment.assignedTo.full_name || shipmentDetails.shipment.assignedTo.email}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {shipmentDetails.shipment.assignedTo.email} | {shipmentDetails.shipment.assignedTo.phone_number || "—"}
                  </div>
                  {shipmentDetails.shipment.assignedTo.company_name && (
                    <div className="text-xs text-muted-foreground">{shipmentDetails.shipment.assignedTo.company_name}</div>
                  )}
                  <div className="text-xs text-muted-foreground">
                    Balance: ${shipmentDetails.shipment.assignedTo.balance ?? 0}
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> Pickup Location
                </div>
                <div className="text-sm">{formatAddress(shipmentDetails.shipment.pickupLocation)}</div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> Delivery Location
                </div>
                <div className="text-sm">{formatAddress(shipmentDetails.shipment.deliveryLocation)}</div>
              </div>

              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Distance</div>
                <div className="text-sm">{shipmentDetails.shipment.distance} miles</div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Estimated Time</div>
                <div className="text-sm">{shipmentDetails.shipment.estimatedTime} hours</div>
              </div>

              <div className="space-y-1 sm:col-span-2">
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Car className="h-3 w-3" /> Vehicle Details
                </div>
                <div className="text-sm">
                  {shipmentDetails.shipment.vehicleDetails.make} {shipmentDetails.shipment.vehicleDetails.model} ({shipmentDetails.shipment.vehicleDetails.year})
                </div>
                <div className="text-xs text-muted-foreground">
                  Color: {shipmentDetails.shipment.vehicleDetails.color} | Drivetrain: {shipmentDetails.shipment.vehicleDetails.drivetrain} | Weight: {shipmentDetails.shipment.vehicleDetails.weight} lbs
                </div>
                <div className="text-xs text-muted-foreground">
                  Size: {shipmentDetails.shipment.vehicleDetails.size?.length}×{shipmentDetails.shipment.vehicleDetails.size?.width}×{shipmentDetails.shipment.vehicleDetails.size?.height} in
                </div>
                <div className="text-xs text-muted-foreground">
                  Running: {shipmentDetails.shipment.vehicleDetails.isRunning ? "Yes" : "No"} | Accidented: {shipmentDetails.shipment.vehicleDetails.isAccidented ? "Yes" : "No"} | Keys: {shipmentDetails.shipment.vehicleDetails.keysAvailable ? "Yes" : "No"}
                </div>
                {shipmentDetails.shipment.vehicleDetails.runningNote && (
                  <div className="text-xs text-muted-foreground">Note: {shipmentDetails.shipment.vehicleDetails.runningNote}</div>
                )}
              </div>

              <div className="space-y-1">
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> Pickup Window
                </div>
                <div className="text-sm">
                  {formatDate(shipmentDetails.shipment.pickupWindow.start)} – {formatDate(shipmentDetails.shipment.pickupWindow.end)}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" /> Delivery Deadline
                </div>
                <div className="text-sm">{formatDate(shipmentDetails.shipment.deliveryDeadline)}</div>
              </div>

              <div className="space-y-1">
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <DollarSign className="h-3 w-3" /> Current Bid
                </div>
                <div className="text-sm">{shipmentDetails.shipment.currentBid ? `$${shipmentDetails.shipment.currentBid.amount}` : "—"}</div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <DollarSign className="h-3 w-3" /> Instant Accept Price
                </div>
                <div className="text-sm">{shipmentDetails.shipment.instantAcceptPrice ? `$${shipmentDetails.shipment.instantAcceptPrice}` : "—"}</div>
              </div>

              <div className="space-y-1 sm:col-span-2">
                <div className="text-xs text-muted-foreground">Photos</div>
                <div className="flex flex-wrap gap-2">
                  {shipmentDetails.shipment.photos.length === 0 ? (
                    <div className="text-sm text-muted-foreground">No photos</div>
                  ) : (
                    shipmentDetails.shipment.photos.map((url, idx) => (
                      <img
                        key={idx}
                        src={url}
                        alt={`Shipment photo ${idx + 1}`}
                        className="w-16 h-16 object-cover rounded border"
                      />
                    ))
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Escrow Status</div>
                <div className="text-sm">{shipmentDetails.shipment.escrowStatus || "—"}</div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Created</div>
                <div className="text-sm">{formatDate(shipmentDetails.shipment.createdAt)}</div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Updated</div>
                <div className="text-sm">{formatDate(shipmentDetails.shipment.updatedAt)}</div>
              </div>

              {shipmentDetails.payment && (
                <div className="space-y-1 sm:col-span-2 border-t pt-4">
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <CreditCard className="h-3 w-3" /> Payment Details
                  </div>
                  <div className="text-sm">
                    Bid Amount: ${shipmentDetails.payment.bidAmount} | Shipper Fee: ${shipmentDetails.payment.shipperFeeAmount} | Transporter Fee: ${shipmentDetails.payment.transporterFeeAmount}
                  </div>
                  <div className="text-sm">
                    Total Charged: ${shipmentDetails.payment.totalChargeAmount} | Transporter Payout: ${shipmentDetails.payment.transporterPayoutAmount}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Square Status: {shipmentDetails.payment.squarePaymentStatus} | Escrow: {shipmentDetails.payment.escrowStatus} | Payout: {shipmentDetails.payment.payoutStatus}
                  </div>
                  {shipmentDetails.payment.payoutEligibleAt && (
                    <div className="text-xs text-muted-foreground">
                      Payout Eligible: {formatDate(shipmentDetails.payment.payoutEligibleAt)}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminShipments;

