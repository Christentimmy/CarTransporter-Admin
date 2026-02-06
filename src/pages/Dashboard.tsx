import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Truck, Package, DollarSign, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "@/services/dashboard_services";

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
                <div className="space-y-3">
                  {recentShipments.data.slice(0, 5).map((s: any) => (
                    <div
                      key={s?._id}
                      className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4"
                    >
                      <div className="min-w-0">
                        <div className="font-medium text-sm sm:text-base leading-snug">
                          {s?.pickupLocation?.address || "Pickup"} → {s?.deliveryLocation?.address || "Delivery"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {s?.vehicleDetails?.make ? `${s.vehicleDetails.make} ${s.vehicleDetails.model ?? ""}` : ""}
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:block sm:text-right flex-shrink-0">
                        <div className="text-sm font-medium">{s?.status ?? ""}</div>
                        {typeof s?.currentBid?.amount === "number" ? (
                          <div className="text-xs text-muted-foreground">Bid: ${s.currentBid.amount}</div>
                        ) : null}
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

