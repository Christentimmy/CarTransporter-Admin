import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Search, Mail, Phone, Calendar, Shield, User, Plus, RefreshCw } from "lucide-react";

import { usersService, ALLOWED_STATUSES, type AllowedStatus } from "@/services/users_services";
import { adminService, type Admin } from "@/services/admin_services";
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

const AdminAdmins = () => {
  const [query, setQuery] = useState("");
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({ full_name: "", email: "", password: "" });

  const queryClient = useQueryClient();

  const {
    data: admins,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["admin", "admins"],
    queryFn: adminService.getAllAdmins,
  });

  const createAdminMutation = useMutation({
    mutationFn: adminService.register,
    onSuccess: () => {
      setShowCreateModal(false);
      setCreateForm({ full_name: "", email: "", password: "" });
      queryClient.invalidateQueries({ queryKey: ["admin", "admins"] });
    },
    onError: (err) => {
      console.error("Failed to create admin:", err);
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ userId, status }: { userId: string; status: AllowedStatus }) =>
      usersService.updateUserStatus(userId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "admins"] });
    },
    onError: (err) => {
      console.error("Failed to update admin status:", err);
    },
    onMutate: () => {
      setSelectedAdmin(null);
    },
  });

  const handleCreateAdmin = () => {
    if (!createForm.full_name || !createForm.email || !createForm.password) return;
    createAdminMutation.mutate(createForm);
  };

  const filteredAdmins = useMemo(() => {
    const list = Array.isArray(admins) ? admins : [];
    const q = query.trim().toLowerCase();
    return list.filter((u) => (q ? `${u.email} ${u.full_name || ""}`.toLowerCase().includes(q) : true));
  }, [admins, query]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search admins..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2 whitespace-nowrap">
          <Plus className="h-4 w-4" />
          Create Admin
        </Button>
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
          {(error as Error).message || "Failed to load admins"}
        </div>
      ) : filteredAdmins.length === 0 ? (
        <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
          {query.trim() ? "No admins found" : "No admins found"}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredAdmins.map((admin) => (
            <button
              key={admin._id}
              type="button"
              onClick={() => setSelectedAdmin(admin)}
              className="text-left group"
            >
              <Card className="h-full hover:shadow-lg transition-all duration-200 hover:scale-[1.02] border-border/50 hover:border-primary/30">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate">{admin.full_name || admin.email}</div>
                      <Badge variant="outline" className="text-xs mt-1">
                        {admin.role}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(admin.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Mail className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{admin.email}</span>
                    </div>
                    {admin.phone_number && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Phone className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{admin.phone_number}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t">
                    <Badge variant={admin.status === "approved" ? "default" : admin.status === "banned" ? "destructive" : "secondary"} className="text-xs">
                      {admin.status}
                    </Badge>
                    <div className="text-xs text-muted-foreground">
                      {admin.is_email_verified ? (
                        <span className="flex items-center gap-1">
                          <Shield className="h-3 w-3" />
                          Verified
                        </span>
                      ) : (
                        "Not verified"
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </button>
          ))}
        </div>
      )}

      <Dialog open={showCreateModal} onOpenChange={(open) => (!open ? setShowCreateModal(false) : null)}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-md sm:w-full p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>Create Admin</DialogTitle>
            <DialogDescription>Fill in the details to create a new admin account.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">Full Name</label>
              <Input
                placeholder="Full name"
                value={createForm.full_name}
                onChange={(e) => setCreateForm({ ...createForm, full_name: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                placeholder="Email"
                value={createForm.email}
                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Password</label>
              <Input
                type="password"
                placeholder="Password"
                value={createForm.password}
                onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateAdmin} disabled={createAdminMutation.isPending}>
                {createAdminMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Create
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(selectedAdmin)} onOpenChange={(open) => (!open ? setSelectedAdmin(null) : null)}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-2xl sm:w-full max-h-[85vh] overflow-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>Admin Details</DialogTitle>
            <DialogDescription asChild>
              <div>
                <Badge variant={selectedAdmin?.status === "approved" ? "default" : selectedAdmin?.status === "banned" ? "destructive" : "secondary"}>
                  {selectedAdmin?.status}
                </Badge>
              </div>
            </DialogDescription>
          </DialogHeader>

          {selectedAdmin && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1 sm:col-span-2">
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <User className="h-3 w-3" /> Name
                </div>
                <div className="text-sm">{selectedAdmin.full_name || "—"}</div>
              </div>

              <div className="space-y-1">
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Mail className="h-3 w-3" /> Email
                </div>
                <div className="text-sm">{selectedAdmin.email}</div>
              </div>

              <div className="space-y-1">
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Phone className="h-3 w-3" /> Phone
                </div>
                <div className="text-sm">{selectedAdmin.phone_number || "—"}</div>
              </div>

              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Role</div>
                <div className="text-sm">{selectedAdmin.role}</div>
              </div>

              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Status</div>
                <div className="flex items-center gap-2">
                  <Badge variant={selectedAdmin.status === "approved" ? "default" : selectedAdmin.status === "banned" ? "destructive" : "secondary"}>
                    {selectedAdmin.status}
                  </Badge>
                  <Select
                    value={selectedAdmin.status}
                    onValueChange={(newStatus) => {
                      setSelectedAdmin((prev) => prev ? { ...prev, status: newStatus } : null);
                      updateStatusMutation.mutate({ userId: selectedAdmin._id, status: newStatus as AllowedStatus });
                    }}
                    disabled={updateStatusMutation.isPending}
                  >
                    <SelectTrigger onClick={(e) => e.stopPropagation()}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ALLOWED_STATUSES.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Email Verified</div>
                <div className="text-sm">{selectedAdmin.is_email_verified ? "Yes" : "No"}</div>
              </div>

              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Phone Verified</div>
                <div className="text-sm">{selectedAdmin.is_phone_verified ? "Yes" : "No"}</div>
              </div>

              <div className="space-y-1">
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> Created
                </div>
                <div className="text-sm">{new Date(selectedAdmin.createdAt).toLocaleString()}</div>
              </div>

              <div className="space-y-1">
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> Updated
                </div>
                <div className="text-sm">{new Date(selectedAdmin.updatedAt).toLocaleString()}</div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminAdmins;
