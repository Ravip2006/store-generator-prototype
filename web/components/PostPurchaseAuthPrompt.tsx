"use client";

import { useMemo, useState } from "react";
import { useAuth } from "@/lib/authContext";
import { AuthModal } from "@/components/AuthModal";

export function PostPurchaseAuthPrompt({ tenant }: { tenant: string }) {
  const { user, loading: authLoading } = useAuth();
  const [open, setOpen] = useState(false);

  const cleanTenant = useMemo(() => tenant.trim().toLowerCase(), [tenant]);

  if (authLoading || user) return null;

  return (
    <div className="mt-6 rounded-2xl border border-foreground/10 bg-foreground/5 p-5">
      <div className="text-sm font-semibold">Save your details for next time</div>
      <p className="mt-1 text-sm text-foreground/70">
        Create an account to speed up checkout and track orders. This is optional.
      </p>
      <div className="mt-4">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center justify-center rounded-xl border border-foreground/15 bg-background px-4 py-2 text-sm font-semibold hover:bg-foreground/5"
        >
          Create account / Log in
        </button>
      </div>

      <AuthModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onSuccess={() => setOpen(false)}
        tenant={cleanTenant}
        initialMode="signup"
      />
    </div>
  );
}
