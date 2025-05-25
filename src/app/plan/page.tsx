
"use client";

import { TripForm } from "@/components/domain/trip-form";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function PlanTripPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login?redirect=/plan");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-xl font-semibold mt-4 text-primary">Loading...</p>
        <p className="text-muted-foreground">Checking authentication status.</p>
      </div>
    );
  }

  return (
    <div className="py-8">
      <TripForm />
    </div>
  );
}
