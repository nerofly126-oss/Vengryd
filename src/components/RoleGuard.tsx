import { useQuery } from "@tanstack/react-query";
import { Navigate, useLocation } from "react-router-dom";
import LoadingScreen from "@/components/LoadingScreen";
import { getCurrentUserRole, getDashboardPath, type AppRole } from "@/lib/profile";
import { isSupabaseConfigured } from "@/lib/supabase";

type RoleGuardProps = {
  allowedRole: AppRole;
  children: React.ReactNode;
};

export function RoleGuard({ allowedRole, children }: RoleGuardProps) {
  const location = useLocation();

  const roleQuery = useQuery({
    queryKey: ["current-user-role"],
    queryFn: getCurrentUserRole,
    retry: false,
  });

  if (!isSupabaseConfigured()) {
    return <Navigate to={`/auth/select`} replace state={{ from: location }} />;
  }

  if (roleQuery.isLoading) {
    return <LoadingScreen />;
  }

  if (roleQuery.error || !roleQuery.data) {
    return <Navigate to={`/auth/select`} replace state={{ from: location }} />;
  }

  if (roleQuery.data !== allowedRole) {
    return <Navigate to={getDashboardPath(roleQuery.data)} replace />;
  }

  return <>{children}</>;
}
