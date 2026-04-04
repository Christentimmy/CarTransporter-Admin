import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Search, MapPin, Calendar, DollarSign, Car, Clock, User, CreditCard, Copy } from "lucide-react";

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
      return "outline";
    case "LIVE":
      return "secondary";
    case "ENDED":
    case "COMPLETED":
      return "default";
    case "ASSIGNED":
    case "IN_TRANSIT":
    case "DELIVERED":
      return "secondary";
    case "DISPUTED":
    case "CANCELLED":
      return "destructive";
    default:
      return "outline";
  }
};

const getStatusColor = (status?: ShipmentStatus) => {
  if (!status) return "bg-gray-100 text-gray-800 border-gray-200";
  switch (status) {
    case "ENDED":
    case "COMPLETED":
      return "bg-green-600 text-white border-green-700";
    case "DISPUTED":
      return "bg-red-600 text-white border-red-700";
    case "ASSIGNED":
    case "IN_TRANSIT":
    case "DELIVERED":
      return "bg-green-600 text-white border-green-700";
    case "LIVE":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "DRAFT":
      return "bg-amber-100 text-amber-800 border-amber-200";
    case "CANCELLED":
      return "bg-gray-100 text-gray-800 border-gray-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

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
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(s.status)}`}>
                          {s.status}
                        </span>
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
                        {s.distance} km
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
            <DialogTitle>Shipment Details</DialogTitle>
            {/* <DialogDescription asChild>
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
            </DialogDescription> */}
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
            <div className="space-y-6">
              {/* Header Section */}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 p-4 bg-muted/50 rounded-lg">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold">Shipment {shipmentDetails.shipment._id.substring(0, 8)}...</h2>
                    <button
                      onClick={() => copyToClipboard(shipmentDetails.shipment._id)}
                      className="p-1 hover:bg-muted rounded transition-colors"
                      title="Copy full shipment ID"
                    >
                      <Copy className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(shipmentDetails.shipment.status)}`}>
                      {shipmentDetails.shipment.status}
                    </span>
                    {/* <Badge variant="outline" className="text-xs">
                      {shipmentDetails.shipment.distance} km
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {shipmentDetails.shipment.estimatedTime}h
                    </Badge> */}
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <div className="text-sm font-medium">
                    {shipmentDetails.shipment.currentBid ? `$${shipmentDetails.shipment.currentBid.amount}` : "No bid"}
                  </div>
                  <div className="text-xs text-muted-foreground">Current Bid</div>
                </div>
              </div>

              {/* Main Content - Column Layout */}
              <div className="space-y-6">
                {/* Route & Timing */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-muted-foreground border-b pb-2">Route & Timing</h3>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="text-sm font-medium">Pickup</div>
                          <div className="text-xs text-muted-foreground">{formatAddress(shipmentDetails.shipment.pickupLocation)}</div>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="text-sm font-medium">Delivery</div>
                          <div className="text-xs text-muted-foreground">{formatAddress(shipmentDetails.shipment.deliveryLocation)}</div>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-muted-foreground block">Pickup Window</span>
                        <span className="font-medium">{formatDate(shipmentDetails.shipment.pickupWindow.start)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">Delivery Deadline</span>
                        <span className="font-medium">{formatDate(shipmentDetails.shipment.deliveryDeadline)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Vehicle Information */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-muted-foreground border-b pb-2">Vehicle Information</h3>
                  <div className="space-y-3">
                    <div>
                      <div className="text-sm font-medium">
                        {shipmentDetails.shipment.vehicleDetails.make} {shipmentDetails.shipment.vehicleDetails.model} ({shipmentDetails.shipment.vehicleDetails.year})
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {shipmentDetails.shipment.vehicleDetails.color} • {shipmentDetails.shipment.vehicleDetails.drivetrain} • {shipmentDetails.shipment.vehicleDetails.weight} lbs
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-muted-foreground block">Size</span>
                        <span className="font-medium">
                          {shipmentDetails.shipment.vehicleDetails.size?.length}×{shipmentDetails.shipment.vehicleDetails.size?.width}×{shipmentDetails.shipment.vehicleDetails.size?.height} in
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">Condition</span>
                        <span className="font-medium">
                          {shipmentDetails.shipment.vehicleDetails.isRunning ? "Running" : "Not Running"} 
                          {shipmentDetails.shipment.vehicleDetails.isAccidented ? " • Accidented" : ""}
                          {shipmentDetails.shipment.vehicleDetails.keysAvailable ? " • Keys Available" : ""}
                        </span>
                      </div>
                    </div>
                    {shipmentDetails.shipment.vehicleDetails.runningNote && (
                      <div className="text-xs bg-muted/30 p-2 rounded">
                        <span className="text-muted-foreground block">Note:</span> {shipmentDetails.shipment.vehicleDetails.runningNote}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Participants */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-muted-foreground border-b pb-2">Participants</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="p-3 rounded-lg border border-green-500">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="h-4 w-4" />
                      <span className="text-sm font-bold text-white bg-green-500 px-2 py-1 rounded">Shipper</span>
                    </div>
                    <div className="text-sm">
                      <div className="font-medium">{shipmentDetails.shipment.shipper.full_name || shipmentDetails.shipment.shipper.email}</div>
                      <div className="text-xs text-muted-foreground">{shipmentDetails.shipment.shipper.email}</div>
                      <div className="text-xs text-muted-foreground">{shipmentDetails.shipment.shipper.phone_number || "—"}</div>
                      {shipmentDetails.shipment.shipper.company_name && (
                        <div className="text-xs text-muted-foreground">{shipmentDetails.shipment.shipper.company_name}</div>
                      )}
                      <div className="text-xs text-green-600 font-medium mt-1">Balance: ${shipmentDetails.shipment.shipper.balance ?? 0}</div>
                    </div>
                  </div>
                  {shipmentDetails.shipment.assignedTo && (
                    <div className="p-3 rounded-lg border border-green-500">
                      <div className="flex items-center gap-2 mb-2">
                        <User className="h-4 w-4" />
                        <span className="text-sm font-bold text-white bg-green-500 px-2 py-1 rounded">Transporter</span>
                      </div>
                      <div className="text-sm">
                        <div className="font-medium">{shipmentDetails.shipment.assignedTo.full_name || shipmentDetails.shipment.assignedTo.email}</div>
                        <div className="text-xs text-muted-foreground">{shipmentDetails.shipment.assignedTo.email}</div>
                        <div className="text-xs text-muted-foreground">{shipmentDetails.shipment.assignedTo.phone_number || "—"}</div>
                        {shipmentDetails.shipment.assignedTo.company_name && (
                          <div className="text-xs text-muted-foreground">{shipmentDetails.shipment.assignedTo.company_name}</div>
                        )}
                        <div className="text-xs text-green-600 font-medium mt-1">Balance: ${shipmentDetails.shipment.assignedTo.balance ?? 0}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Photos */}
              {shipmentDetails.shipment.photos.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-muted-foreground border-b pb-2">Photos</h3>
                  <div className="flex flex-wrap gap-2">
                    {shipmentDetails.shipment.photos.map((url, idx) => (
                      <img
                        key={idx}
                        src={url}
                        alt={`Shipment photo ${idx + 1}`}
                        className="w-20 h-20 object-cover rounded border cursor-pointer hover:scale-105 transition-transform"
                        onClick={() => window.open(url, '_blank')}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Dispute Information */}
              {shipmentDetails.shipment.disputeInfo && (
                shipmentDetails.shipment.disputeInfo.issue || 
                (shipmentDetails.shipment.disputeInfo.disputePhotos && shipmentDetails.shipment.disputeInfo.disputePhotos.length > 0)
              ) && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-muted-foreground border-b pb-2">Dispute Information</h3>
                  <div className="p-4 rounded-lg border border-red-200">
                    {shipmentDetails.shipment.disputeInfo.issue && (
                      <div className="mb-3">
                        <span className="text-sm font-bold text-red-600 block mb-1">Issue Description:</span>
                        <p className="text-base text-white p-2 rounded">{shipmentDetails.shipment.disputeInfo.issue}</p>
                      </div>
                    )}
                    {shipmentDetails.shipment.disputeInfo.disputePhotos && shipmentDetails.shipment.disputeInfo.disputePhotos.length > 0 && (
                      <div>
                        <span className="text-sm font-bold text-red-600 block mb-2">Dispute Photos:</span>
                        <div className="flex flex-wrap gap-2">
                          {shipmentDetails.shipment.disputeInfo.disputePhotos.map((url, idx) => (
                            <img
                              key={idx}
                              src={url}
                              alt={`Dispute photo ${idx + 1}`}
                              className="w-16 h-16 object-cover rounded border cursor-pointer hover:scale-105 transition-transform"
                              onClick={() => window.open(url, '_blank')}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Payment Details */}
              {shipmentDetails.payment && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-muted-foreground border-b pb-2">Payment Details</h3>
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <div className="grid gap-4 sm:grid-cols-2 mb-4">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Bid Amount:</span>
                          <span className="text-sm font-medium">${shipmentDetails.payment.bidAmount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Shipper Fee ({shipmentDetails.payment.shipperFeePercent}%):</span>
                          <span className="text-sm font-medium">${shipmentDetails.payment.shipperFeeAmount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Transport Fee ({shipmentDetails.payment.transporterFeePercent}%):</span>
                          <span className="text-sm font-medium">${shipmentDetails.payment.transporterFeeAmount}</span>
                        </div>
                        {shipmentDetails.payment.gstTaxePercent !== undefined && (
                          <div className="flex justify-between">
                            <span className="text-sm">GST Tax ({shipmentDetails.payment.gstTaxePercent}%):</span>
                            <span className="text-sm font-medium">${shipmentDetails.payment.gstTaxeAmount}</span>
                          </div>
                        )}
                        {shipmentDetails.payment.qstTaxePercent !== undefined && (
                          <div className="flex justify-between">
                            <span className="text-sm">QST Tax ({shipmentDetails.payment.qstTaxePercent}%):</span>
                            <span className="text-sm font-medium">${shipmentDetails.payment.qstTaxeAmount}</span>
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Total Charged:</span>
                          <span className="text-sm font-medium text-green-600">${shipmentDetails.payment.totalChargeAmount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Transporter Payout:</span>
                          <span className="text-sm font-medium text-blue-600">${shipmentDetails.payment.transporterPayoutAmount}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1 border-t pt-3">
                      <div className="flex justify-between">
                        <span>Square Status:</span>
                        <span className="font-medium">{shipmentDetails.payment.squarePaymentStatus}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Escrow:</span>
                        <span className="font-medium">{shipmentDetails.payment.escrowStatus}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Payout:</span>
                        <span className="font-medium">{shipmentDetails.payment.payoutStatus}</span>
                      </div>
                      {shipmentDetails.payment.payoutEligibleAt && (
                        <div className="flex justify-between">
                          <span>Payout Eligible:</span>
                          <span className="font-medium">{new Date(shipmentDetails.payment.payoutEligibleAt).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Distance Information */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-muted-foreground border-b pb-2">Distance Information</h3>
                <div className="bg-muted/30 p-4 rounded-lg space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Distance:</span>
                    <span className="text-sm font-medium">{shipmentDetails.shipment.distance} Km</span>
                  </div>
                  {shipmentDetails.shipment.auctionStartedAt && (
                    <div className="flex justify-between">
                      <span className="text-sm">Auction Start:</span>
                      <span className="text-sm font-medium">{new Date(shipmentDetails.shipment.auctionStartedAt).toLocaleString()}</span>
                    </div>
                  )}
                  {shipmentDetails.shipment.auctionEndsAt && (
                    <div className="flex justify-between">
                      <span className="text-sm">Auction End:</span>
                      <span className="text-sm font-medium">{new Date(shipmentDetails.shipment.auctionEndsAt).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* System Information */}
              <div className="text-xs text-muted-foreground space-y-1 pt-4 border-t">
                <div>Escrow Status: <span className="font-medium">{shipmentDetails.shipment.escrowStatus || "—"}</span></div>
                <div>Created: <span className="font-medium">{formatDate(shipmentDetails.shipment.createdAt)}</span></div>
                <div>Updated: <span className="font-medium">{formatDate(shipmentDetails.shipment.updatedAt)}</span></div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminShipments;

