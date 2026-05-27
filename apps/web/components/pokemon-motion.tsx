"use client";

import type React from "react";
import { Zap } from "lucide-react";
import { cn } from "~/lib/utils";

const particleStyles = [
  "left-[8%] top-[18%] delay-0 bg-yellow-300",
  "left-[18%] top-[64%] delay-200 bg-sky-300",
  "left-[32%] top-[28%] delay-500 bg-emerald-300",
  "left-[47%] top-[72%] delay-700 bg-rose-300",
  "left-[61%] top-[16%] delay-1000 bg-violet-300",
  "left-[72%] top-[52%] delay-300 bg-orange-300",
  "left-[86%] top-[31%] delay-700 bg-cyan-300",
  "left-[92%] top-[78%] delay-1000 bg-lime-300",
];

export function PokemonTypeAtmosphere({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      <div className="absolute inset-0 pokemon-grid opacity-45" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-yellow-200 to-transparent" />
      {particleStyles.map((style, index) => (
        <span key={index} className={cn("pokemon-particle absolute size-2 rounded-[2px] shadow-lg", style)} />
      ))}
      <span className="electric-bolt left-[15%] top-[36%]" />
      <span className="electric-bolt left-[76%] top-[22%] delay-700" />
      <span className="leaf-drift left-[24%] top-[12%]" />
      <span className="leaf-drift left-[68%] top-[68%] delay-1000" />
    </div>
  );
}

export function AnimatedPokeball({ className }: { className?: string }) {
  return (
    <div className={cn("pokeball-wrap relative grid place-items-center", className)} aria-hidden="true">
      <div className="pokeball-shadow" />
      <div className="pokeball-core">
        <div className="pokeball-top" />
        <div className="pokeball-band" />
        <div className="pokeball-button" />
      </div>
      <div className="pokeball-ring" />
    </div>
  );
}

export function PokedexScanner({
  imageUrl,
  title,
  subtitle,
  className,
}: {
  imageUrl: string;
  title: string;
  subtitle: string;
  className?: string;
}) {
  return (
    <div className={cn("pokedex-panel relative overflow-hidden rounded-md border border-white/10 bg-slate-950/70", className)}>
      <div className="scanline" />
      <div className="flex items-start gap-4 p-4">
        <div className="relative grid size-24 shrink-0 place-items-center rounded-md border border-yellow-300/30 bg-slate-900">
          <img src={imageUrl} alt="" className="pokemon-float h-20 w-20 object-contain" />
        </div>
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 rounded-md bg-yellow-300 px-2 py-1 text-xs font-semibold text-slate-950">
            <Zap className="size-3" />
            LIVE DEX
          </div>
          <p className="mt-3 text-lg font-semibold text-white">{title}</p>
          <p className="mt-1 text-sm leading-6 text-slate-300">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}

export function TypeMeter({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "electric" | "fire" | "water" | "grass" | "ghost";
}) {
  return (
    <div className="rounded-md border border-white/10 bg-white/[0.06] p-3">
      <div className="mb-2 flex items-center justify-between text-xs text-slate-300">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div className={cn("type-meter h-full rounded-full", `type-meter-${tone}`)} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

export function AnimatedBadge({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={cn("badge-pulse inline-flex items-center rounded-md border border-white/15 bg-white/10 px-3 py-1 text-sm", className)}>
      {children}
    </span>
  );
}
