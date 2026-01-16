"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";

const spring = {
  type: "spring" as const,
  stiffness: 280,
  damping: 22,
  mass: 0.8,
};

interface AdminHeaderProps {
  title: string;
  description?: string;
  icon?: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  action?: {
    label: string;
    href: string;
    icon?: string;
  };
  onSearch?: (query: string) => void;
  showSearch?: boolean;
}

export default function AdminHeader({
  title,
  description,
  icon,
  breadcrumbs,
  action,
  onSearch,
  showSearch = true,
}: AdminHeaderProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    onSearch?.(value);
  };

  const closeSearch = () => {
    setSearchOpen(false);
  };

  return (
    <div className="relative overflow-hidden border-b border-white/10 bg-black/35 shadow-lg shadow-black/40 backdrop-blur-xl">
      <div className="pointer-events-none absolute -top-28 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-emerald-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 left-10 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />
      <div className="pointer-events-none absolute right-10 top-10 h-64 w-64 rounded-full bg-emerald-400/10 blur-3xl" />

      <div className="relative mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        {/* Breadcrumbs */}
        <div className="mb-4 flex flex-wrap items-center gap-2 text-sm font-semibold text-white/60">
          <Link
            href="/"
            className="rounded-lg px-3 py-1.5 font-semibold text-white/70 hover:text-white transition-all"
          >
            Home
          </Link>
          <span className="text-white/30">/</span>
          <Link
            href="/admin"
            className="rounded-lg px-3 py-1.5 font-semibold text-white/70 hover:text-white transition-all"
          >
            Admin
          </Link>
          {breadcrumbs?.map((crumb, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <span className="text-white/30">/</span>
              {crumb.href ? (
                <Link
                  href={crumb.href}
                  className="rounded-lg px-3 py-1.5 font-semibold text-white/70 hover:text-white transition-all"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="rounded-lg px-3 py-1.5 font-semibold text-white">{crumb.label}</span>
              )}
            </div>
          ))}
        </div>

        {/* Header Content */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              {icon && <span className="text-3xl sm:text-4xl">{icon}</span>}
              <div>
                <h1 className="text-3xl sm:text-5xl font-semibold tracking-tight text-white">
                  {title}
                </h1>
              </div>
            </div>
            {description && (
              <p className="mt-2 text-sm text-white/60 sm:ml-16">{description}</p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full lg:w-auto">
            {/* Search Bar */}
            {showSearch && (
              <div
                className={`relative flex gap-3 w-full sm:w-80 transition-all duration-300 ease-out ${
                  searchOpen ? "sm:w-[24rem]" : ""
                }`}
                onFocusCapture={() => setSearchOpen(true)}
                onBlurCapture={(e) => {
                  const next = e.relatedTarget as Node | null;
                  if (next && e.currentTarget.contains(next)) return;
                  closeSearch();
                }}
                onKeyDownCapture={(e) => {
                  if (e.key === "Escape") {
                    e.preventDefault();
                    closeSearch();
                  }
                }}
              >
                <div
                  className={`flex-1 relative z-50 group/search transition-transform duration-300 ease-out ${
                    searchOpen ? "-translate-y-[1px]" : ""
                  }`}
                >
                  <div className="pointer-events-none absolute inset-0 rounded-xl ring-2 ring-white/0 group-focus-within/search:ring-emerald-300/50 transition-all duration-300" />
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="text-lg text-white/40 transition-all duration-200 group-focus-within/search:text-emerald-300 group-focus-within/search:scale-110 group-focus-within/search:-rotate-6">🔍</span>
                  </div>
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="w-full rounded-xl border border-white/15 bg-black/40 px-4 py-2.5 pl-12 text-sm text-white outline-none transition-all duration-300 ease-out focus:border-emerald-300/60 focus:ring-2 focus:ring-emerald-400/20 focus:shadow-lg focus:shadow-emerald-500/20 placeholder:text-white/40"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleSearchChange("")}
                  aria-label="Clear search"
                  disabled={!searchQuery}
                  className={`px-3 py-2.5 rounded-xl border border-white/15 bg-white/10 hover:bg-white/20 transition-all duration-200 text-sm text-white ${
                    searchQuery
                      ? "opacity-100 scale-100 translate-y-0"
                      : "opacity-0 scale-95 translate-y-1 pointer-events-none"
                  }`}
                >
                  ✕
                </button>
              </div>
            )}

            {/* Action Button */}
            {action && (
              <motion.div whileHover={{ y: -2 }} transition={spring}>
                <Link
                  href={action.href}
                  className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition-all shadow-lg shadow-emerald-500/30 whitespace-nowrap"
                >
                  <span className="pointer-events-none absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100 bg-gradient-to-r from-black/10 via-black/0 to-transparent" />
                  {action.icon && <span>{action.icon}</span>}
                  {action.label}
                </Link>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
