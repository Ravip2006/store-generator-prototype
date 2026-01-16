"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { SPRING } from "@/lib/motion";
import { useAuth } from "@/lib/authContext";
import { AuthModal } from "@/components/AuthModal";

export function PostPurchaseAuthPrompt({ tenant }: { tenant: string }) {
  const { user, loading: authLoading } = useAuth();
  const [open, setOpen] = useState(false);

  const cleanTenant = useMemo(() => tenant.trim().toLowerCase(), [tenant]);

  if (authLoading || user) return null;

  return (
    <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
      <div className="text-sm font-semibold text-white">Save your details for next time</div>
      <p className="mt-1 text-sm text-white/70">
        Create an account to speed up checkout and track orders. This is optional.
      </p>
      <div className="mt-4">
        <motion.button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20"
          whileHover={{ y: -2 }}
          transition={SPRING}
        >
          Create account / Log in
        </motion.button>
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
