import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Truck, Package, DollarSign, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

interface AdminStats {
  totalUsers: number;
  totalTransporters: number;
  activeShipments: number;
  monthlyRevenue: number;
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // TODO: Replace with real admin dashboard API call
    const timer = setTimeout(() => {
      setStats({
        totalUsers: 0,
        totalTransporters: 0,
        activeShipments: 0,
        monthlyRevenue: 0,
      });
      setIsLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  const cards = [
    {
      title: "Total Users",
      value: stats?.totalUsers.toString() ?? "0",
      description: "Registered customer accounts",
      icon: Users,
      color: "text-blue-500",
    },
    {
      title: "Total Transporters",
      value: stats?.totalTransporters.toString() ?? "0",
      description: "Verified transporter partners",
      icon: Truck,
      color: "text-emerald-500",
    },
    {
      title: "Active Shipments",
      value: stats?.activeShipments.toString() ?? "0",
      description: "Currently in transit",
      icon: Package,
      color: "text-orange-500",
    },
    {
      title: "Monthly Revenue",
      value: stats ? `$${stats.monthlyRevenue.toLocaleString()}` : "$0",
      description: "This month",
      icon: DollarSign,
      color: "text-purple-500",
    },
  ];

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
      ) : (
        <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
          {cards.map((card, index) => {
            const Icon = card.icon;
            return (
              <div
                key={card.title}
                className="animate-in fade-in slide-in-from-bottom-2"
                style={{ animationDelay: `${index * 70}ms` }}
              >
                <Card className="h-full">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
                    <CardTitle className="text-xs sm:text-sm font-medium truncate pr-2">
                      {card.title}
                    </CardTitle>
                    <Icon className={`h-3 w-3 sm:h-4 sm:w-4 ${card.color} flex-shrink-0`} />
                  </CardHeader>
                  <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                    <div className="text-xl sm:text-2xl font-bold">{card.value}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {card.description}
                    </p>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;

