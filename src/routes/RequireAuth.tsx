import { Navigate, useLocation } from "react-router-dom";
import { authService } from "@/services/auth_services";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  if (!authService.isAuthenticated()) {
    return <Navigate to="/admin/login" replace state={{ from: location }} />;
  }

  return children;
}

