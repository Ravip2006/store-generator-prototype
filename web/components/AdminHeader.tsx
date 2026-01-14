"use client";

import Link from "next/link";
import { useState } from "react";

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
    <div className="relative overflow-hidden border-b border-slate-200/60 bg-gradient-to-br from-green-100/70 via-emerald-50/60 to-white shadow-md shadow-emerald-500/10 dark:border-foreground/10 dark:from-green-950/30 dark:via-emerald-950/10 dark:to-background">
      <div className="pointer-events-none absolute -top-28 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-green-600/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 left-10 h-96 w-96 rounded-full bg-emerald-600/15 blur-3xl" />
      <div className="pointer-events-none absolute right-10 top-10 h-64 w-64 rounded-full bg-emerald-400/10 blur-3xl" />

      <div className="relative mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 sm:py-8">
        {/* Breadcrumbs */}
        <div className="mb-4 flex flex-wrap items-center gap-2 text-sm font-semibold text-foreground/70">
          <Link
            href="/"
            className="rounded-lg px-3 py-1.5 font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent hover:from-green-700 hover:to-emerald-700 transition-all"
          >
            Home
          </Link>
          <span className="text-foreground/40">/</span>
          <Link
            href="/admin"
            className="rounded-lg px-3 py-1.5 font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent hover:from-green-700 hover:to-emerald-700 transition-all"
          >
            Admin
          </Link>
          {breadcrumbs?.map((crumb, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <span className="text-foreground/40">/</span>
              {crumb.href ? (
                <Link
                  href={crumb.href}
                  className="rounded-lg px-3 py-1.5 font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent hover:from-green-700 hover:to-emerald-700 transition-all"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="rounded-lg px-3 py-1.5 font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">{crumb.label}</span>
              )}
            </div>
          ))}
        </div>

        {/* Header Content */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              {icon && <span className="text-3xl sm:text-4xl drop-shadow">{icon}</span>}
              <div>
                <h1 className="text-3xl sm:text-5xl font-black tracking-tight bg-gradient-to-r from-green-700 via-emerald-600 to-emerald-500 bg-clip-text text-transparent drop-shadow-sm">
                  {title}
                </h1>
              </div>
            </div>
            {description && (
              <p className="mt-2 text-sm font-semibold text-foreground/75 sm:ml-16">{description}</p>
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
                  <div className="pointer-events-none absolute inset-0 rounded-xl ring-2 ring-emerald-300/0 group-focus-within/search:ring-emerald-300/60 transition-all duration-300" />
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="text-lg text-foreground/40 transition-all duration-200 group-focus-within/search:text-emerald-600 group-focus-within/search:scale-110 group-focus-within/search:-rotate-6">🔍</span>
                  </div>
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="w-full rounded-xl border-2 border-emerald-200/70 bg-white/80 px-4 py-2.5 pl-12 text-sm font-semibold text-foreground outline-none hover:border-emerald-300/80 transition-all duration-300 ease-out focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/25 focus:shadow-lg focus:shadow-emerald-500/20 focus:-translate-y-[1px] placeholder:text-foreground/40 focus:placeholder:text-foreground/30 dark:border-emerald-500/30 dark:bg-foreground/5 dark:text-white dark:focus:ring-emerald-500/30"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleSearchChange("")}
                  aria-label="Clear search"
                  disabled={!searchQuery}
                  className={`px-3 py-2.5 rounded-xl border border-foreground/15 bg-white/70 hover:bg-white transition-all duration-200 font-bold text-sm dark:bg-foreground/5 dark:hover:bg-foreground/10 ${
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
              <Link
                href={action.href}
                className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-3 text-sm font-black text-white transition-all hover:from-green-700 hover:to-emerald-700 hover:shadow-xl hover:shadow-emerald-500/25 whitespace-nowrap border border-white/20"
              >
                <span className="pointer-events-none absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100 bg-gradient-to-r from-white/20 via-white/10 to-transparent" />
                {action.icon && <span>{action.icon}</span>}
                {action.label}
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
