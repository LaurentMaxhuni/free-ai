"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "./auth-provider";
import { useEffect } from "react";

export function ChatAuthGuard({ children }: { children: React.ReactNode}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [loading, user, router]);

  if (loading || !user) return null;

  return <>{children}</>;
}