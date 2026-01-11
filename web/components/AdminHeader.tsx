"use client";

import Link from "next/link";

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
}

export default function AdminHeader({
  title,
  description,
  icon,
  breadcrumbs,
  action,
}: AdminHeaderProps) {
  return (
    <div className="border-b border-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 bg-gradient-to-br from-background via-background/95 to-background/90 shadow-lg shadow-blue-500/5">
      <div className="mx-auto w-full max-w-6xl px-6 py-6">
        {/* Breadcrumbs */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground/70">
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
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              {icon && <span className="text-4xl drop-shadow-lg">{icon}</span>}
              <div>
                <h1 className="text-4xl font-black tracking-tight bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent drop-shadow-lg">
                  {title}
                </h1>
              </div>
            </div>
            {description && (
              <p className="mt-2 text-sm font-semibold text-foreground/70 ml-16">{description}</p>
            )}
          </div>

          {/* Action Button */}
          {action && (
            <Link
              href={action.href}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 px-6 py-3 text-sm font-bold text-white hover:from-blue-700 hover:via-purple-700 hover:to-blue-700 transition-all hover:shadow-xl hover:shadow-purple-500/30 hover:scale-105 whitespace-nowrap mt-2 border border-white/20 backdrop-blur-sm"
            >
              {action.icon && <span>{action.icon}</span>}
              {action.label}
            </Link>
          )}
        </div>

        {/* Decorative elements */}
        <div className="absolute right-0 top-0 -z-10 h-96 w-96 rounded-full bg-gradient-to-b from-blue-600/5 to-transparent blur-3xl" />
      </div>
    </div>
  );
}
