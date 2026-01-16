"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/authContext";
import { AnimatePresence, motion } from "framer-motion";
import { SPRING } from "@/lib/motion";

type AuthModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  tenant: string;
  initialMode?: "signin" | "signup";
};

export function AuthModal({ isOpen, onClose, onSuccess, tenant, initialMode = "signin" }: AuthModalProps) {
  const { signIn, signUp } = useAuth();
  const [isSignUp, setIsSignUp] = useState(initialMode === "signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isSignUp) {
        if (!name.trim()) {
          throw new Error("Name is required");
        }
        if (!phone.trim()) {
          throw new Error("Phone is required");
        }
        await signUp(email, password, phone, name);
      } else {
        await signIn(email, password);
      }

      // Success - close modal and call callback
      setTimeout(() => {
        onClose();
        onSuccess?.();
      }, 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleModalClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-xl p-4"
          onClick={handleModalClick}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={SPRING}
        >
          <motion.div
            className="w-full max-w-md rounded-2xl border border-white/15 bg-black/80 shadow-2xl shadow-black/50 relative z-[10000] max-h-[90vh] overflow-y-auto backdrop-blur-xl"
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={SPRING}
          >
            <div className="p-8">
        {/* Close button */}
          <motion.button
          onClick={onClose}
          className="absolute right-4 top-4 p-1 text-white/50 hover:text-white transition-colors z-50"
            whileHover={{ scale: 1.05 }}
            transition={SPRING}
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </motion.button>

        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-white">
            {isSignUp ? "Create Account" : "Welcome Back"}
          </h2>
          <p className="mt-2 text-sm text-white/60">
            {isSignUp ? "Sign up to enjoy faster checkout and order tracking" : "Sign in to view your orders and faster checkout"}
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 rounded-lg bg-red-500/10 p-4 text-sm text-red-200 border border-red-400/30">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <>
              {/* Name field */}
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full rounded-lg border border-white/15 bg-white/10 px-4 py-2.5 text-white placeholder-white/40 focus:border-emerald-300/60 focus:ring-2 focus:ring-emerald-400/20 transition-all"
                  disabled={loading}
                />
              </div>

              {/* Phone field */}
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1.5">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full rounded-lg border border-white/15 bg-white/10 px-4 py-2.5 text-white placeholder-white/40 focus:border-emerald-300/60 focus:ring-2 focus:ring-emerald-400/20 transition-all"
                  disabled={loading}
                />
              </div>
            </>
          )}

          {/* Email field */}
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-lg border border-white/15 bg-white/10 px-4 py-2.5 text-white placeholder-white/40 focus:border-emerald-300/60 focus:ring-2 focus:ring-emerald-400/20 transition-all"
              disabled={loading}
              required
            />
          </div>

          {/* Password field */}
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-lg border border-white/15 bg-white/10 px-4 py-2.5 text-white placeholder-white/40 focus:border-emerald-300/60 focus:ring-2 focus:ring-emerald-400/20 transition-all"
              disabled={loading}
              required
            />
          </div>

          {/* Submit button */}
          <motion.button
            type="submit"
            disabled={loading}
            className="w-full mt-6 py-2.5 px-4 rounded-lg font-semibold text-black bg-white hover:bg-white/90 disabled:bg-white/30 transition-all shadow-lg shadow-emerald-500/20"
            whileHover={{ y: -2 }}
            transition={SPRING}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Processing...
              </span>
            ) : isSignUp ? (
              "Create Account"
            ) : (
              "Sign In"
            )}
          </motion.button>
        </form>

        {/* Toggle auth mode */}
        <div className="mt-6 flex items-center justify-center gap-1 text-sm text-white/60">
          <span>{isSignUp ? "Already have an account?" : "Don't have an account?"}</span>
          <motion.button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError(null);
              setEmail("");
              setPassword("");
              setPhone("");
              setName("");
            }}
            className="font-semibold text-emerald-300 hover:text-emerald-200 transition-colors"
            whileHover={{ y: -1 }}
            transition={SPRING}
          >
            {isSignUp ? "Sign In" : "Sign Up"}
          </motion.button>
        </div>

        {/* Benefits */}
        <div className="mt-6 rounded-lg border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
          <p className="text-xs font-semibold text-white/70 mb-2">Benefits of signing up:</p>
          <ul className="space-y-1.5 text-xs text-white/60">
            <li className="flex items-start gap-2">
              <span className="text-emerald-300 font-bold">✓</span>
              <span>Faster checkout with saved address</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-300 font-bold">✓</span>
              <span>Track your orders in real-time</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-300 font-bold">✓</span>
              <span>Reorder your favorites instantly</span>
            </li>
          </ul>
        </div>
        </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
