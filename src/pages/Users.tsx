import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Search, Mail, Phone, Calendar, Shield, User, History } from "lucide-react";

import {
  usersService,
  type AdminUser,
  ALLOWED_STATUSES,
  type AllowedStatus,
  type UserPaymentHistoryItem,
} from "@/services/users_services";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

const getStatusVariant = (status?: string) => {
  const s = (status || "").toLowerCase();
  if (s === "approved") return "secondary";
  if (s === "rejected" || s === "blocked") return "destructive";
  return "outline";
};

const getRoleVariant = (role?: string) => {
  const r = (role || "").toLowerCase();
  if (r === "admin") return "default";
  if (r === "transporter") return "secondary";
  return "outline";
};

const displayName = (u: AdminUser) => u.full_name || u.email || "Unknown";

const AdminUsers = () => {
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [showPaymentHistory, setShowPaymentHistory] = useState(false);
  const queryClient = useQueryClient();

  const {
    data: users,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: usersService.getAllUsers,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ userId, status }: { userId: string; status: AllowedStatus }) =>
      usersService.updateUserStatus(userId, status),
    onSuccess: () => {
      setSelectedUser(null);
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
    onError: (err) => {
      console.error("Failed to update user status:", err);
    },
  });

  const filteredUsers = useMemo(() => {
    const list = Array.isArray(users) ? users : [];
    const q = query.trim().toLowerCase();

    return list.filter((u) => {
      const roleOk = roleFilter === "all" ? true : (u.role || "").toLowerCase() === roleFilter;
      if (!roleOk) return false;
      if (!q) return true;
      const haystack = `${u.full_name || ""} ${u.email || ""} ${u.phone_number || ""}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [users, query, roleFilter]);

  const paymentHistoryQuery = useQuery({
    queryKey: ["admin", "user-payment-history", selectedUser?._id],
    queryFn: () => usersService.getUserPaymentHistory(selectedUser!._id),
    enabled: Boolean(showPaymentHistory && selectedUser?._id),
  });

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);

  const paymentHistoryTotals = useMemo(() => {
    const list = Array.isArray(paymentHistoryQuery.data) ? paymentHistoryQuery.data : [];
    return list.reduce(
      (acc, item) => {
        acc.count += 1;
        acc.bidAmount += item.bidAmount || 0;
        acc.totalCharge += item.totalChargeAmount || 0;
        acc.shipperFee += item.shipperFeeAmount || 0;
        acc.transporterFee += item.transporterFeeAmount || 0;
        return acc;
      },
      {
        count: 0,
        bidAmount: 0,
        totalCharge: 0,
        shipperFee: 0,
        transporterFee: 0,
      }
    );
  }, [paymentHistoryQuery.data]);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Users</h1>
        <p className="text-sm text-muted-foreground">Manage customer accounts, access levels, and statuses.</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, email, phone..."
            className="pl-9"
          />
        </div>

        <div className="w-full sm:w-[220px]">
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All roles</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="transporter">Transporter</SelectItem>
              <SelectItem value="user">User</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
          {error instanceof Error ? error.message : "Failed to fetch users"}
        </div>
      ) : (
        <>
          <div className="space-y-2 sm:hidden">
            {filteredUsers.length === 0 ? (
              <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground text-center">
                No users found
              </div>
            ) : (
              filteredUsers.map((u) => (
                <button
                  key={u._id}
                  type="button"
                  onClick={() => setSelectedUser(u)}
                  className="w-full text-left"
                >
                  <Card className="hover:bg-muted/50 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-medium truncate">{displayName(u)}</div>
                          <div className="text-xs text-muted-foreground truncate">{u.email}</div>
                        </div>
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          <Badge variant={getStatusVariant(u.status) as any}>{u.status || "-"}</Badge>
                          <Select
                            value={u.status || ""}
                            onValueChange={(newStatus) => {
                              if (newStatus && newStatus !== u.status) {
                                updateStatusMutation.mutate({ userId: u._id, status: newStatus as AllowedStatus });
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
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((u) => (
                    <TableRow key={u._id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedUser(u)}>
                      <TableCell className="font-medium">
                        <div className="min-w-0">
                          <div className="truncate">{displayName(u)}</div>
                        </div>
                      </TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(u.status) as any}>{u.status || "-"}</Badge>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={u.status || ""}
                          onValueChange={(newStatus) => {
                            if (newStatus && newStatus !== u.status) {
                              updateStatusMutation.mutate({ userId: u._id, status: newStatus as AllowedStatus });
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

      <Dialog open={Boolean(selectedUser)} onOpenChange={(open) => (!open ? setSelectedUser(null) : null)}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-2xl sm:w-full max-h-[85vh] overflow-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>{selectedUser ? displayName(selectedUser) : "User"}</DialogTitle>
            <DialogDescription>{selectedUser?.email}</DialogDescription>
          </DialogHeader>

          {selectedUser ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">User ID</div>
                <div className="text-sm font-mono break-all">{selectedUser._id}</div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Role</div>
                <div>
                  <Badge variant={getRoleVariant(selectedUser.role) as any}>{selectedUser.role || "-"}</Badge>
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Status</div>
                <div>
                  <Badge variant={getStatusVariant(selectedUser.status) as any}>{selectedUser.status || "-"}</Badge>
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Phone</div>
                <div className="text-sm break-all">{selectedUser.phone_number || "-"}</div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Email Verified</div>
                <div className="text-sm">{selectedUser.is_email_verified ? "Yes" : "No"}</div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Phone Verified</div>
                <div className="text-sm">{selectedUser.is_phone_verified ? "Yes" : "No"}</div>
              </div>
              <div className="space-y-1 sm:col-span-2 flex items-center justify-between">
                <div className="text-xs text-muted-foreground">Actions</div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowPaymentHistory(true)}
                  >
                    <History className="h-4 w-4 mr-2" />
                    View Payment History
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
              {selectedUser ? `${displayName(selectedUser)} • ${selectedUser.email}` : ""}
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
              <div className="grid gap-3 sm:grid-cols-2">
                <Card>
                  <CardContent className="p-4 space-y-1">
                    <div className="text-xs text-muted-foreground">Transactions</div>
                    <div className="text-lg font-semibold">{paymentHistoryTotals.count}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 space-y-1">
                    <div className="text-xs text-muted-foreground">Total Charged</div>
                    <div className="text-lg font-semibold">{formatCurrency(paymentHistoryTotals.totalCharge)}</div>
                  </CardContent>
                </Card>
              </div>

              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Bid Amount</TableHead>
                      <TableHead>Shipper Fee</TableHead>
                      <TableHead>Total Charged</TableHead>
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
                            {formatCurrency(p.bidAmount || 0)}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {formatCurrency(p.shipperFeeAmount || 0)}
                            <span className="text-xs text-muted-foreground"> ({p.shipperFeePercent || 0}%)</span>
                          </TableCell>
                          <TableCell className="whitespace-nowrap font-medium">
                            {formatCurrency(p.totalChargeAmount || 0)}
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
    </div>
  );
};

export default AdminUsers;

