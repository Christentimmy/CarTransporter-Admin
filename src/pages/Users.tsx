import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Search } from "lucide-react";

import { usersService, type AdminUser, ALLOWED_STATUSES, type AllowedStatus } from "@/services/users_services";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
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
                    <TableRow key={u._id}>
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
                          <SelectTrigger className="w-28 h-7 text-xs">
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
                <div className="text-xs text-muted-foreground">Company</div>
                <div className="text-sm break-all">{selectedUser.company_name || "-"}</div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Balance</div>
                <div className="text-sm">{typeof selectedUser.balance === "number" ? selectedUser.balance : "-"}</div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Email Verified</div>
                <div className="text-sm">{selectedUser.is_email_verified ? "Yes" : "No"}</div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Phone Verified</div>
                <div className="text-sm">{selectedUser.is_phone_verified ? "Yes" : "No"}</div>
              </div>
              <div className="space-y-1 sm:col-span-2">
                <div className="text-xs text-muted-foreground">Business Address</div>
                <div className="text-sm break-words">{selectedUser.business_address || "-"}</div>
              </div>
              <div className="space-y-1 sm:col-span-2">
                <div className="text-xs text-muted-foreground">Region</div>
                <pre className="text-xs bg-muted/50 rounded-md p-3 max-h-48 overflow-auto">{JSON.stringify(selectedUser.region ?? null, null, 2)}</pre>
              </div>
              <div className="space-y-1 sm:col-span-2">
                <div className="text-xs text-muted-foreground">Payment Methods</div>
                <pre className="text-xs bg-muted/50 rounded-md p-3 max-h-56 overflow-auto">
                  {JSON.stringify(selectedUser.paymentMethod ?? [], null, 2)}
                </pre>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUsers;

