import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Search } from "lucide-react";

import { transportersService, type AdminTransporter } from "@/services/transporters_services";
import { usersService, ALLOWED_STATUSES, type AllowedStatus } from "@/services/users_services";
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
                    <TableRow key={t._id}>
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
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminTransporters;

