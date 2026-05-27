"use client";

import type React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BookOpen, Compass, LayoutDashboard, LogOut, Map, Sparkles } from "lucide-react";
import { Button } from "~/components/ui/button";
import { trpc } from "~/trpc/client";

export function SiteNav() {
  const router = useRouter();
  const pathname = usePathname();
  const utils = trpc.useUtils();
  const shouldReadSession = pathname.startsWith("/dashboard");
  const { data } = trpc.auth.me.useQuery(undefined, { enabled: shouldReadSession, retry: false });
  const logout = trpc.auth.logout.useMutation({
  onSuccess: async () => {
    utils.auth.me.setData(undefined, {
      user: null,
    });

    await utils.auth.me.invalidate();

    router.replace("/login");
    router.refresh();
  },

  onError: (error) => {
    console.error("Logout failed:", error);
  },
});


  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#08111f]/88 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 text-sm font-semibold tracking-wide text-white">
          <span className="grid size-9 place-items-center rounded-md border border-yellow-300/50 bg-yellow-300 text-slate-950">
            PF
          </span>
          <span>PokeForms</span>
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          <NavLink href="/explore" icon={<Compass className="size-4" />} label="Explore" />
          <NavLink href="/journey" icon={<Map className="size-4" />} label="Journey" />
          <NavLink href="/pricing" icon={<Sparkles className="size-4" />} label="Pricing" />
          <a
            href={process.env.NEXT_PUBLIC_API_DOCS_URL ?? "http://localhost:8000/docs"}
            className="inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm text-slate-300 hover:bg-white/10 hover:text-white"
          >
            <BookOpen className="size-4" />
            API Docs
          </a>
          {data?.user ? (
            <NavLink href="/dashboard" icon={<LayoutDashboard className="size-4" />} label="Dashboard" />
          ) : null}
        </nav>
        <div className="flex items-center gap-2">
          {data?.user ? (
            <>
              <span className="hidden text-sm text-slate-300 sm:inline">{data.user.fullName}</span>
              <Button
                variant="outline"
                size="sm"
                className="border-white/15 bg-white/5 text-white hover:bg-white/10"
                onClick={() => logout.mutate()}
              >
                <LogOut className="size-4" />
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="text-white hover:bg-white/10">
                <Link href="/login">Login</Link>
              </Button>
              <Button asChild size="sm" className="bg-yellow-300 text-slate-950 hover:bg-yellow-200">
                <Link href="/register">Start free</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function NavLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm text-slate-300 hover:bg-white/10 hover:text-white"
    >
      {icon}
      {label}
    </Link>
  );
}
