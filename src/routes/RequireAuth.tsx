import { Navigate, useLocation } from "react-router-dom";
import { authService } from "@/services/auth_services";
import { getRefreshToken, refreshAccessToken } from "@/config/api";
import { useState, useEffect } from "react";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      if (authService.isAuthenticated()) {
        setIsAuthenticated(true);
        return;
      }

      const refreshToken = getRefreshToken();
      if (refreshToken) {
        try {
          await refreshAccessToken();
          setIsAuthenticated(true);
        } catch (refreshError) {
          authService.logout();
          setIsAuthenticated(false);
        }
      } else {
        authService.logout();
        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, []);

  if (isAuthenticated === null) {
    return null; // or a loading spinner
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace state={{ from: location }} />;
  }

  return children;
}

