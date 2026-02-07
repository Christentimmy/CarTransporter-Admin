import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Search, Calendar, DollarSign, User, CreditCard, CheckCircle, XCircle, Clock, RefreshCw } from "lucide-react";

import { paymentsService, type WithdrawalRequest } from "@/services/payments_services";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const AdminPayments = () => {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedRequest, setSelectedRequest] = useState<WithdrawalRequest | null>(null);

  const queryClient = useQueryClient();

  const {
    data: requests,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["admin", "withdrawal-requests"],
    queryFn: paymentsService.getAllWithdrawalRequests,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ requestId, status }: { requestId: string; status: "pending" | "approved" | "rejected" }) =>
      paymentsService.updateWithdrawalStatus(requestId, status),
    onSuccess: () => {
      setSelectedRequest(null);
      queryClient.invalidateQueries({ queryKey: ["admin", "withdrawal-requests"] });
    },
    onError: (err) => {
      console.error("Failed to update withdrawal status:", err);
    },
  });

  const filteredRequests = useMemo(() => {
    const list = Array.isArray(requests) ? requests : [];
    const q = query.trim().toLowerCase();
    const status = statusFilter === "all" ? "" : statusFilter;
    return list.filter(
      (r) =>
        (q ? `${r.user.email} ${r.user.company_name || ""}`.toLowerCase().includes(q) : true) &&
        (status ? r.status === status : true)
    );
  }, [requests, query, statusFilter]);

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "approved":
        return "default";
      case "rejected":
        return "destructive";
      case "processed":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-3 w-3" />;
      case "rejected":
        return <XCircle className="h-3 w-3" />;
      case "processed":
        return <Clock className="h-3 w-3" />;
      default:
        return <Clock className="h-3 w-3" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by user email or company..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="processed">Processed</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={() => refetch()} variant="outline" size="icon" className="h-9 w-9">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="text-center py-12 text-destructive">
          {(error as Error).message || "Failed to load withdrawal requests"}
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
          {query.trim() || statusFilter !== "all" ? "No withdrawal requests found" : "No withdrawal requests"}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredRequests.map((request) => (
            <button
              key={request._id}
              type="button"
              onClick={() => setSelectedRequest(request)}
              className="text-left group"
            >
              <Card className="h-full hover:shadow-lg transition-all duration-200 hover:scale-[1.02] border-border/50 hover:border-primary/30">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate">{request.user.company_name || request.user.email}</div>
                      <div className="text-xs text-muted-foreground truncate">{request.user.email}</div>
                    </div>
                    <div className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(request.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                    <DollarSign className="h-4 w-4" />
                    {formatCurrency(request.amount)}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t">
                    <Badge variant={getStatusVariant(request.status) as any} className="text-xs flex items-center gap-1">
                      {getStatusIcon(request.status)}
                      {request.status}
                    </Badge>
                    <div className="text-xs text-muted-foreground">
                      {request.paymentMethod.type}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </button>
          ))}
        </div>
      )}

      <Dialog open={Boolean(selectedRequest)} onOpenChange={(open) => (!open ? setSelectedRequest(null) : null)}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-2xl sm:w-full max-h-[85vh] overflow-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>Withdrawal Request Details</DialogTitle>
            <DialogDescription asChild>
              <div>
                <Badge variant={getStatusVariant(selectedRequest?.status || "") as any} className="flex items-center gap-1">
                  {selectedRequest ? getStatusIcon(selectedRequest.status) : null}
                  {selectedRequest?.status}
                </Badge>
              </div>
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1 sm:col-span-2">
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <User className="h-3 w-3" /> User
                  </div>
                  <div className="text-sm">
                    {selectedRequest.user.company_name || "—"} ({selectedRequest.user.email})
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <DollarSign className="h-3 w-3" /> Amount
                  </div>
                  <div className="text-sm font-semibold">{formatCurrency(selectedRequest.amount)}</div>
                </div>

                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <CreditCard className="h-3 w-3" /> Payment Method
                  </div>
                  <div className="text-sm">{selectedRequest.paymentMethod.name}</div>
                </div>

                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Status</div>
                  <div className="flex items-center gap-2">
                    <Badge variant={getStatusVariant(selectedRequest.status) as any} className="flex items-center gap-1">
                      {getStatusIcon(selectedRequest.status)}
                      {selectedRequest.status}
                    </Badge>
                    {selectedRequest.status === "pending" && (
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          onClick={() => updateStatusMutation.mutate({ requestId: selectedRequest._id, status: "approved" })}
                          disabled={updateStatusMutation.isPending}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => updateStatusMutation.mutate({ requestId: selectedRequest._id, status: "rejected" })}
                          disabled={updateStatusMutation.isPending}
                        >
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {selectedRequest.user.company_name && (
                  <div className="space-y-1 sm:col-span-2">
                    <div className="text-xs text-muted-foreground">Company</div>
                    <div className="text-sm">{selectedRequest.user.company_name}</div>
                  </div>
                )}

                {selectedRequest.user.business_address && (
                  <div className="space-y-1 sm:col-span-2">
                    <div className="text-xs text-muted-foreground">Business Address</div>
                    <div className="text-sm">{selectedRequest.user.business_address}</div>
                  </div>
                )}

                {selectedRequest.user.phone_number && (
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Phone</div>
                    <div className="text-sm">{selectedRequest.user.phone_number}</div>
                  </div>
                )}

                {selectedRequest.user.region && (
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Region</div>
                    <div className="text-sm">{selectedRequest.user.region}</div>
                  </div>
                )}

                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">User Status</div>
                  <Badge variant={selectedRequest.user.status === "approved" ? "default" : selectedRequest.user.status === "banned" ? "destructive" : "secondary"}>
                    {selectedRequest.user.status}
                  </Badge>
                </div>

                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Balance</div>
                  <div className="text-sm">{formatCurrency(selectedRequest.user.balance)}</div>
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <div className="text-xs text-muted-foreground">Payment Details</div>
                  <div className="text-sm bg-muted p-2 rounded">
                    <div className="grid gap-1 text-xs">
                      <div>Type: {selectedRequest.paymentMethod.type}</div>
                      {selectedRequest.paymentMethod.accountNumber && (
                        <div>Account: {selectedRequest.paymentMethod.accountNumber}</div>
                      )}
                      {selectedRequest.paymentMethod.email && (
                        <div>Email: {selectedRequest.paymentMethod.email}</div>
                      )}
                      {selectedRequest.paymentMethod.cardNumber && (
                        <div>Card: ****{selectedRequest.paymentMethod.cardNumber.slice(-4)}</div>
                      )}
                      {selectedRequest.paymentMethod.cardHolderName && (
                        <div>Cardholder: {selectedRequest.paymentMethod.cardHolderName}</div>
                      )}
                      {selectedRequest.paymentMethod.expiryDate && (
                        <div>Expires: {selectedRequest.paymentMethod.expiryDate}</div>
                      )}
                      {selectedRequest.paymentMethod.routingNumber && (
                        <div>Routing: {selectedRequest.paymentMethod.routingNumber}</div>
                      )}
                      {selectedRequest.paymentMethod.bankName && (
                        <div>Bank: {selectedRequest.paymentMethod.bankName}</div>
                      )}
                    </div>
                  </div>
                </div>

                {selectedRequest.rejectionReason && (
                  <div className="space-y-1 sm:col-span-2">
                    <div className="text-xs text-muted-foreground">Rejection Reason</div>
                    <div className="text-sm text-destructive">{selectedRequest.rejectionReason}</div>
                  </div>
                )}

                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> Created
                  </div>
                  <div className="text-sm">{new Date(selectedRequest.createdAt).toLocaleString()}</div>
                </div>

                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> Updated
                  </div>
                  <div className="text-sm">{new Date(selectedRequest.updatedAt).toLocaleString()}</div>
                </div>

                {selectedRequest.processedAt && (
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Processed At</div>
                    <div className="text-sm">{new Date(selectedRequest.processedAt).toLocaleString()}</div>
                  </div>
                )}

                {selectedRequest.processedBy && (
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Processed By</div>
                    <div className="text-sm">
                      {selectedRequest.processedBy.full_name || selectedRequest.processedBy.email}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPayments;
