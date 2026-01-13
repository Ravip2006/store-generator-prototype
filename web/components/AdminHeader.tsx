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

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    onSearch?.(value);
  };

  return (
    <div className="border-b border-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 bg-gradient-to-br from-background via-background/95 to-background/90 shadow-lg shadow-blue-500/5">
      <div className="mx-auto w-full max-w-6xl px-4 py-4 sm:px-6 sm:py-6">
        {/* Breadcrumbs */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <div className="mb-4 flex flex-wrap items-center gap-2 text-sm font-semibold text-foreground/70">
            <Link href="/admin" className="rounded-lg px-3 py-1.5 font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent hover:from-blue-700 hover:to-purple-700 hover:bg-gradient-to-r hover:shadow-lg transition-all duration-300">
              Admin
            </Link>
            {breadcrumbs.map((crumb, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="text-foreground/50">/</span>
                {crumb.href ? (
                  <Link href={crumb.href} className="rounded-lg px-3 py-1.5 font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent hover:from-blue-700 hover:to-purple-700 transition-all duration-300">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="rounded-lg px-3 py-1.5 font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{crumb.label}</span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Header Content */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              {icon && <span className="text-3xl sm:text-4xl drop-shadow-lg">{icon}</span>}
              <div>
                <h1 className="text-2xl sm:text-4xl font-black tracking-tight bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent drop-shadow-lg">
                  {title}
                </h1>
              </div>
            </div>
            {description && (
              <p className="mt-2 text-sm font-semibold text-foreground/70 sm:ml-16">{description}</p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full lg:w-auto">
            {/* Search Bar */}
            {showSearch && (
              <div className="flex gap-3 w-full sm:w-80">
                <div className="flex-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="text-lg text-foreground/40">🔍</span>
                  </div>
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="w-full rounded-xl border-2 border-blue-200/50 dark:border-blue-500/30 bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-blue-950/20 dark:to-purple-950/20 px-4 py-2 pl-12 text-sm font-medium text-slate-900 dark:text-white outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-300/50 dark:focus:ring-blue-500/50 hover:border-blue-300/70 transition-all"
                  />
                </div>
                {searchQuery && (
                  <button
                    onClick={() => handleSearchChange("")}
                    className="px-3 py-2 rounded-xl border border-foreground/20 hover:bg-foreground/10 transition-all font-medium text-sm"
                  >
                    ✕
                  </button>
                )}
              </div>
            )}

            {/* Action Button */}
            {action && (
              <Link
                href={action.href}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 px-6 py-3 text-sm font-bold text-white hover:from-blue-700 hover:via-purple-700 hover:to-blue-700 transition-all hover:shadow-xl hover:shadow-purple-500/30 hover:scale-105 whitespace-nowrap border border-white/20 backdrop-blur-sm"
              >
                {action.icon && <span>{action.icon}</span>}
                {action.label}
              </Link>
            )}
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute right-0 top-0 -z-10 h-96 w-96 rounded-full bg-gradient-to-b from-blue-600/5 to-transparent blur-3xl" />
      </div>
    </div>
  );
}
