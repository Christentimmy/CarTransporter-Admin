import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Search, History, Wallet } from "lucide-react";

import {
  transportersService,
  type AdminTransporter,
  type TransporterWithdrawHistoryItem,
} from "@/services/transporters_services";
import {
  usersService,
  ALLOWED_STATUSES,
  type AllowedStatus,
  type UserPaymentHistoryItem,
} from "@/services/users_services";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const getStatusVariant = (status?: string) => {
  if (!status) return "outline";
  switch (status.toLowerCase()) {
    case "approved":
    case "active":
      return "default";
    case "rejected":
    case "banned":
    case "inactive":
      return "destructive";
    case "pending":
      return "secondary";
    default:
      return "outline";
  }
};

const getRoleVariant = (role?: string) => {
  if (!role) return "outline";
  switch (role.toLowerCase()) {
    case "admin":
      return "destructive";
    case "transporter":
      return "secondary";
    case "client":
      return "default";
    default:
      return "outline";
  }
};

const displayName = (t: AdminTransporter) => t.full_name || t.email || "Unknown";

const AdminTransporters = () => {
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [selectedTransporter, setSelectedTransporter] = useState<AdminTransporter | null>(null);
  const [showPaymentHistory, setShowPaymentHistory] = useState(false);
  const [showWithdrawHistory, setShowWithdrawHistory] = useState(false);
  const queryClient = useQueryClient();

  const {
    data: transporters,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["admin", "transporters"],
    queryFn: transportersService.getAllTransporters,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ userId, status }: { userId: string; status: AllowedStatus }) =>
      usersService.updateUserStatus(userId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "transporters"] });
    },
  });

  const filteredTransporters = useMemo(() => {
    const list = Array.isArray(transporters) ? transporters : [];
    const q = query.trim().toLowerCase();

    return list.filter((t) => {
      const roleOk = roleFilter === "all" ? true : (t.role || "").toLowerCase() === roleFilter;
      if (!roleOk) return false;
      if (!q) return true;
      const haystack = `${t.full_name || ""} ${t.email || ""} ${t.phone_number || ""}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [transporters, query, roleFilter]);

  const paymentHistoryQuery = useQuery({
    queryKey: ["admin", "transporter-payment-history", selectedTransporter?._id],
    queryFn: () => usersService.getUserPaymentHistory(selectedTransporter!._id),
    enabled: Boolean(showPaymentHistory && selectedTransporter?._id),
  });

  const withdrawHistoryQuery = useQuery({
    queryKey: ["admin", "transporter-withdraw-history", selectedTransporter?._id],
    queryFn: () => transportersService.getTransporterWithdrawHistory(selectedTransporter!._id),
    enabled: Boolean(showWithdrawHistory && selectedTransporter?._id),
  });

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);

  const paymentHistoryTotals = useMemo(() => {
    const list = Array.isArray(paymentHistoryQuery.data) ? paymentHistoryQuery.data : [];
    return list.reduce(
      (acc, item) => {
        acc.count += 1;
        const payoutAmount = item.transporterPayoutAmount || 0;
        const status = (item.payoutStatus || "").toUpperCase();
        if (status === "PAID") {
          acc.paidCount += 1;
          acc.paidAmount += payoutAmount;
        } else if (status === "PENDING") {
          acc.pendingCount += 1;
          acc.pendingAmount += payoutAmount;
        }
        return acc;
      },
      {
        count: 0,
        paidCount: 0,
        pendingCount: 0,
        paidAmount: 0,
        pendingAmount: 0,
      }
    );
  }, [paymentHistoryQuery.data]);

  const withdrawHistoryTotals = useMemo(() => {
    const list = Array.isArray(withdrawHistoryQuery.data) ? withdrawHistoryQuery.data : [];
    return list.reduce(
      (acc, item) => {
        const amount = item.amount || 0;
        const status = (item.status || "").toLowerCase();
        acc.count += 1;
        if (status === "approved") {
          acc.approvedCount += 1;
          acc.approvedAmount += amount;
        } else if (status === "pending") {
          acc.pendingCount += 1;
          acc.pendingAmount += amount;
        } else if (status === "rejected") {
          acc.rejectedCount += 1;
          acc.rejectedAmount += amount;
        }
        return acc;
      },
      {
        count: 0,
        approvedCount: 0,
        pendingCount: 0,
        rejectedCount: 0,
        approvedAmount: 0,
        pendingAmount: 0,
        rejectedAmount: 0,
      }
    );
  }, [withdrawHistoryQuery.data]);

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
        {(error as Error).message || "Failed to load transporters"}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Transporters</h1>
        <p className="text-sm text-muted-foreground">
          Oversee transporter partners, verification, and performance.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search transporters..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {filteredTransporters.length === 0 && query.trim() === "" && roleFilter === "all" ? (
        <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
          No transporters found.
        </div>
      ) : (
        <>
          <div className="sm:hidden space-y-2">
            {filteredTransporters.length === 0 ? (
              <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
                No transporters found
              </div>
            ) : (
              filteredTransporters.map((t) => (
                <button
                  key={t._id}
                  type="button"
                  onClick={() => setSelectedTransporter(t)}
                  className="w-full text-left"
                >
                  <Card className="hover:bg-muted/50 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-medium truncate">{displayName(t)}</div>
                          <div className="text-xs text-muted-foreground truncate">{t.email}</div>
                        </div>
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          <Badge variant={getStatusVariant(t.status) as any}>{t.status || "-"}</Badge>
                          <Select
                            value={t.status || ""}
                            onValueChange={(newStatus) => {
                              if (newStatus && newStatus !== t.status) {
                                updateStatusMutation.mutate({ userId: t._id, status: newStatus as AllowedStatus });
                              }
                            }}
                            disabled={updateStatusMutation.isPending}
                          >
                            <SelectTrigger className="w-28 h-7 text-xs" onClick={(e) => e.stopPropagation()}>
                              <SelectValue placeholder="Change" />
                            </SelectTrigger>
                            <SelectContent>
                              {ALLOWED_STATUSES.map((s) => (
                                <SelectItem key={s} value={s}>
                                  {s}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </button>
              ))
            )}
          </div>

          <div className="hidden sm:block rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransporters.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      No transporters found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTransporters.map((t) => (
                    <TableRow
                      key={t._id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelectedTransporter(t)}
                    >
                      <TableCell className="font-medium">
                        <div className="min-w-0">
                          <div className="truncate">{displayName(t)}</div>
                        </div>
                      </TableCell>
                      <TableCell>{t.email}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(t.status) as any}>{t.status || "-"}</Badge>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={t.status || ""}
                          onValueChange={(newStatus) => {
                            if (newStatus && newStatus !== t.status) {
                              updateStatusMutation.mutate({ userId: t._id, status: newStatus as AllowedStatus });
                            }
                          }}
                          disabled={updateStatusMutation.isPending}
                        >
                          <SelectTrigger className="w-28 h-7 text-xs" onClick={(e) => e.stopPropagation()}>
                            <SelectValue placeholder="Change" />
                          </SelectTrigger>
                          <SelectContent>
                            {ALLOWED_STATUSES.map((s) => (
                              <SelectItem key={s} value={s}>
                                {s}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      <Dialog open={Boolean(selectedTransporter)} onOpenChange={(open) => (!open ? setSelectedTransporter(null) : null)}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-2xl sm:w-full max-h-[85vh] overflow-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>{selectedTransporter ? displayName(selectedTransporter) : "Transporter"}</DialogTitle>
            <DialogDescription>{selectedTransporter?.email}</DialogDescription>
          </DialogHeader>

          {selectedTransporter ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Transporter ID</div>
                <div className="text-sm font-mono break-all">{selectedTransporter._id}</div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Role</div>
                <div>
                  <Badge variant={getRoleVariant(selectedTransporter.role) as any}>{selectedTransporter.role || "-"}</Badge>
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Status</div>
                <div>
                  <Badge variant={getStatusVariant(selectedTransporter.status) as any}>{selectedTransporter.status || "-"}</Badge>
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Email Verified</div>
                <div>
                  <Badge variant={selectedTransporter.is_email_verified ? "default" : "secondary"}>
                    {selectedTransporter.is_email_verified ? "Yes" : "No"}
                  </Badge>
                </div>
              </div>
              <div className="space-y-1 sm:col-span-2">
                <div className="text-xs text-muted-foreground">Full Name</div>
                <div className="text-sm">{selectedTransporter.full_name || "-"}</div>
              </div>
              <div className="space-y-1 sm:col-span-2">
                <div className="text-xs text-muted-foreground">Phone Number</div>
                <div className="text-sm">{selectedTransporter.phone_number || "-"}</div>
              </div>
              <div className="space-y-1 sm:col-span-2">
                <div className="text-xs text-muted-foreground">Company Name</div>
                <div className="text-sm">{selectedTransporter.company_name || "-"}</div>
              </div>
              <div className="space-y-1 sm:col-span-2">
                <div className="text-xs text-muted-foreground">Business Address</div>
                <div className="text-sm">{selectedTransporter.business_address || "-"}</div>
              </div>
              <div className="space-y-1 sm:col-span-2">
                <div className="text-xs text-muted-foreground">Tax Number</div>
                <div className="text-sm">{selectedTransporter.tax_number || "-"}</div>
              </div>
              <div className="space-y-1 sm:col-span-2">
                <div className="text-xs text-muted-foreground">Region</div>
                <pre className="text-xs bg-muted/50 rounded-md p-3 max-h-48 overflow-auto">{JSON.stringify(selectedTransporter.region ?? null, null, 2)}</pre>
              </div>

              <div className="space-y-1 sm:col-span-2 flex items-center justify-between">
                <div className="text-xs text-muted-foreground">Actions</div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setShowPaymentHistory(true)}>
                    <History className="h-4 w-4 mr-2" />
                    Payment History
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowWithdrawHistory(true)}
                  >
                    <Wallet className="h-4 w-4 mr-2" />
                    Withdraw History
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog
        open={showPaymentHistory}
        onOpenChange={(open) => {
          if (!open) setShowPaymentHistory(false);
        }}
      >
        <DialogContent className="w-[calc(100vw-2rem)] max-w-4xl sm:w-full max-h-[85vh] overflow-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>Payment History</DialogTitle>
            <DialogDescription>
              {selectedTransporter ? `${displayName(selectedTransporter)} • ${selectedTransporter.email}` : ""}
            </DialogDescription>
          </DialogHeader>

          {paymentHistoryQuery.isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
            </div>
          ) : paymentHistoryQuery.error ? (
            <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
              {paymentHistoryQuery.error instanceof Error
                ? paymentHistoryQuery.error.message
                : "Failed to fetch payment history"}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <Card>
                  <CardContent className="p-4 space-y-1">
                    <div className="text-xs text-muted-foreground">Transactions</div>
                    <div className="text-lg font-semibold">{paymentHistoryTotals.count}</div>
                    <div className="text-xs text-muted-foreground">
                      Paid: {paymentHistoryTotals.paidCount} • Pending: {paymentHistoryTotals.pendingCount}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 space-y-1">
                    <div className="text-xs text-muted-foreground">Paid Out</div>
                    <div className="text-lg font-semibold">{formatCurrency(paymentHistoryTotals.paidAmount)}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 space-y-1">
                    <div className="text-xs text-muted-foreground">Pending Payout</div>
                    <div className="text-lg font-semibold">{formatCurrency(paymentHistoryTotals.pendingAmount)}</div>
                  </CardContent>
                </Card>
              </div>

              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Payout Amount</TableHead>
                      <TableHead>Payout Status</TableHead>
                      <TableHead>Payout Eligible</TableHead>
                      <TableHead>Square Status</TableHead>
                      <TableHead>Escrow</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(paymentHistoryQuery.data || []).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                          No payment history
                        </TableCell>
                      </TableRow>
                    ) : (
                      (paymentHistoryQuery.data as UserPaymentHistoryItem[]).map((p) => (
                        <TableRow key={p._id}>
                          <TableCell className="whitespace-nowrap">
                            {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : "-"}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {formatCurrency(p.transporterPayoutAmount || 0)}
                          </TableCell>
                          <TableCell>
                            <Badge variant={(p.payoutStatus || "").toUpperCase() === "PAID" ? "default" : "secondary"}>
                              {p.payoutStatus || "-"}
                            </Badge>
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {p.payoutEligibleAt ? new Date(p.payoutEligibleAt).toLocaleDateString() : "-"}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                p.squarePaymentStatus === "COMPLETED"
                                  ? "default"
                                  : p.squarePaymentStatus === "APPROVED"
                                    ? "secondary"
                                    : "outline"
                              }
                            >
                              {p.squarePaymentStatus || "-"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={p.escrowStatus === "CAPTURED" ? "default" : "secondary"}>
                              {p.escrowStatus || "-"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={showWithdrawHistory}
        onOpenChange={(open) => {
          if (!open) setShowWithdrawHistory(false);
        }}
      >
        <DialogContent className="w-[calc(100vw-2rem)] max-w-4xl sm:w-full max-h-[85vh] overflow-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>Withdraw History</DialogTitle>
            <DialogDescription>
              {selectedTransporter ? `${displayName(selectedTransporter)} • ${selectedTransporter.email}` : ""}
            </DialogDescription>
          </DialogHeader>

          {withdrawHistoryQuery.isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
            </div>
          ) : withdrawHistoryQuery.error ? (
            <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
              {withdrawHistoryQuery.error instanceof Error
                ? withdrawHistoryQuery.error.message
                : "Failed to fetch withdraw history"}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <Card>
                  <CardContent className="p-4 space-y-1">
                    <div className="text-xs text-muted-foreground">Requests</div>
                    <div className="text-lg font-semibold">{withdrawHistoryTotals.count}</div>
                    <div className="text-xs text-muted-foreground">
                      Approved: {withdrawHistoryTotals.approvedCount} • Pending: {withdrawHistoryTotals.pendingCount}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 space-y-1">
                    <div className="text-xs text-muted-foreground">Approved Amount</div>
                    <div className="text-lg font-semibold">{formatCurrency(withdrawHistoryTotals.approvedAmount)}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 space-y-1">
                    <div className="text-xs text-muted-foreground">Pending Amount</div>
                    <div className="text-lg font-semibold">{formatCurrency(withdrawHistoryTotals.pendingAmount)}</div>
                  </CardContent>
                </Card>
              </div>

              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Account</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(withdrawHistoryQuery.data || []).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          No withdraw history
                        </TableCell>
                      </TableRow>
                    ) : (
                      (withdrawHistoryQuery.data as TransporterWithdrawHistoryItem[]).map((w) => {
                        const status = (w.status || "").toLowerCase();
                        const methodType = w.paymentMethod?.type || "-";
                        const bankName = w.paymentMethod?.bankName || w.paymentMethod?.name || "-";
                        const accountNumber = w.paymentMethod?.accountNumber || "";
                        const maskedAccount = accountNumber
                          ? `•••• ${accountNumber.slice(-4)}`
                          : "-";

                        return (
                          <TableRow key={w._id}>
                            <TableCell className="whitespace-nowrap">
                              {w.createdAt ? new Date(w.createdAt).toLocaleDateString() : "-"}
                            </TableCell>
                            <TableCell className="whitespace-nowrap font-medium">{formatCurrency(w.amount || 0)}</TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  status === "approved"
                                    ? "default"
                                    : status === "pending"
                                      ? "secondary"
                                      : status === "rejected"
                                        ? "destructive"
                                        : "outline"
                                }
                              >
                                {w.status || "-"}
                              </Badge>
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                              <div className="text-sm">{bankName}</div>
                              <div className="text-xs text-muted-foreground">{methodType}</div>
                            </TableCell>
                            <TableCell className="whitespace-nowrap">{maskedAccount}</TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminTransporters;

