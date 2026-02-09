import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Truck, Package, DollarSign, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "@/services/dashboard_services";

const getStatusVariant = (status?: string) => {
  const s = (status || "").toLowerCase();
  switch (s) {
    case "ended":
    case "completed":
      return "default";
    case "assigned":
    case "accepted":
      return "secondary";
    case "in_transit":
    case "in_progress":
      return "outline";
    case "pending":
    case "created":
      return "destructive";
    default:
      return "outline";
  }
};

const getStatusColor = (status?: string) => {
  const s = (status || "").toLowerCase();
  switch (s) {
    case "ended":
    case "completed":
      return "bg-red-100 text-red-800 border-red-200";
    case "assigned":
    case "accepted":
      return "bg-green-100 text-green-800 border-green-200";
    case "in_transit":
    case "in_progress":
      return "bg-indigo-100 text-indigo-800 border-indigo-200";
    case "pending":
    case "created":
      return "bg-amber-100 text-amber-800 border-amber-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

const truncateLocation = (address?: string) => {
  if (!address) return "-";
  const parts = address.split(",");
  if (parts.length >= 2) return `${parts[0].trim()}, ${parts[1].trim()}`;
  if (parts.length === 1) return parts[0].trim();
  return address.trim();
};

const AdminDashboard = () => {
  const {
    data: stats,
    isLoading: isStatsLoading,
    error: statsError,
  } = useQuery({
    queryKey: ["admin", "dashboard-stat"],
    queryFn: dashboardService.getDashboardStat,
  });

  const {
    data: recentShipments,
    isLoading: isRecentLoading,
    error: recentError,
  } = useQuery({
    queryKey: ["admin", "recent-shipments"],
    queryFn: () => dashboardService.getRecentShipments<any>(),
  });

  const cards = [
    {
      title: "Total Users",
      value: stats?.totalUsers?.toString() ?? "0",
      description: "Registered customer accounts",
      icon: Users,
      color: "text-blue-500",
    },
    {
      title: "Total Shipments",
      value: stats?.totalShipments?.toString() ?? "0",
      description: "Total shipments created",
      icon: Package,
      color: "text-emerald-500",
    },
    {
      title: "Total Payments",
      value: stats?.totalPayments?.toString() ?? "0",
      description: "Completed payments",
      icon: Truck,
      color: "text-orange-500",
    },
    {
      title: "Total Revenue",
      value: typeof stats?.totalRevenue === "number" ? `$${stats.totalRevenue.toLocaleString()}` : "$0",
      description: "Overall revenue",
      icon: DollarSign,
      color: "text-purple-500",
    },
  ];

  const isLoading = isStatsLoading || isRecentLoading;
  const errorMessage =
    (statsError instanceof Error ? statsError.message : "") ||
    (recentError instanceof Error ? recentError.message : "");

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          High-level overview of platform activity and operations.
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : errorMessage ? (
        <Card>
          <CardHeader>
            <CardTitle>Failed to load dashboard</CardTitle>
            <CardDescription>{errorMessage}</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="space-y-4 sm:space-y-6">
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {cards.map((card, index) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.title}
                  className="animate-in fade-in slide-in-from-bottom-2"
                  style={{ animationDelay: `${index * 70}ms` }}
                >
                  <Card className="h-full">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 sm:px-6 pt-4 sm:pt-6">
                      <CardTitle className="text-sm sm:text-sm font-medium truncate pr-2">
                        {card.title}
                      </CardTitle>
                      <Icon className={`h-3 w-3 sm:h-4 sm:w-4 ${card.color} flex-shrink-0`} />
                    </CardHeader>
                    <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
                      <div className="text-2xl sm:text-2xl font-bold leading-none">{card.value}</div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {card.description}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Shipments</CardTitle>
              <CardDescription>Latest shipment activity</CardDescription>
            </CardHeader>
            <CardContent>
              {Array.isArray(recentShipments?.data) && recentShipments.data.length > 0 ? (
                <div className="space-y-2">
                  {recentShipments.data.slice(0, 5).map((s: any) => (
                    <div key={s?._id} className="flex items-center justify-between gap-3 py-2 border-b last:border-b-0">
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium truncate">
                          {truncateLocation(s?.pickupLocation?.address)} → {truncateLocation(s?.deliveryLocation?.address)}
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(s?.status)}`}>
                          {s?.status ?? "-"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">No recent shipments</div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;

