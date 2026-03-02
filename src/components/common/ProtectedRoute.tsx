import { Navigate, Outlet } from "react-router-dom";

import { useAuth } from "@/hooks";
import { PageLoader } from "./LoadingSpinner";

export function ProtectedRoute() {
  const { session, loading } = useAuth();

  if (loading) return <PageLoader />;
  if (!session) return <Navigate to="/login" replace />;

  return <Outlet />;
}
