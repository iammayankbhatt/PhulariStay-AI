"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { UserRole } from "@/services/auth.service";
import { useAuth } from "./AuthContext";
import Loader from "./ui/Loader";

type ProtectedRouteProps = {
  children: ReactNode;
  roles?: UserRole[];
};

export default function ProtectedRoute({
  children,
  roles,
}: ProtectedRouteProps) {
  const router = useRouter();
  const { user, loading, isAuthenticated } = useAuth();
  const isAllowed = !roles?.length || (user ? roles.includes(user.role) : false);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, loading, router]);

  useEffect(() => {
    if (!loading && isAuthenticated && !isAllowed) {
      router.replace("/dashboard");
    }
  }, [isAllowed, isAuthenticated, loading, router]);

  if (loading || !isAuthenticated || !isAllowed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-100 dark:bg-gray-950">
        <Loader />
      </div>
    );
  }

  return <>{children}</>;
}
