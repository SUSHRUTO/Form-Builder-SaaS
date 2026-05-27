"use client";

import type React from "react";
import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, BadgeCheck, Search, Sparkles } from "lucide-react";
import {
  ashJourneyPokemon,
  ashJourneyRegions,
  ashSeasonJourney,
  pokemonJourneyStats,
  pokemonTypeCoverage,
  pokemonTypes,
  type PokemonType,
} from "@repo/forms";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { SiteNav } from "~/components/site-nav";
import { PokemonTypeAtmosphere } from "~/components/pokemon-motion";

type TypeFilter = "all" | PokemonType;

export default function JourneyPage() {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [regionFilter, setRegionFilter] = useState("all");

  const filteredPokemon = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return ashJourneyPokemon.filter((pokemon) => {
      const matchesQuery =
        !normalized ||
        pokemon.name.toLowerCase().includes(normalized) ||
        pokemon.region.toLowerCase().includes(normalized) ||
        pokemon.seasonArc.toLowerCase().includes(normalized);
      const matchesType = typeFilter === "all" || pokemon.primaryType === typeFilter;
      const matchesRegion = regionFilter === "all" || pokemon.region === regionFilter;
      return matchesQuery && matchesType && matchesRegion;
    });
  }, [query, regionFilter, typeFilter]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#07111f] text-white">
      <PokemonTypeAtmosphere className="opacity-50" />
      <SiteNav />
      <section className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-[1fr_24rem] lg:items-end">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold uppercase text-yellow-200">
              <Sparkles className="size-4" />
              Ash Ketchum 25-season journey
            </p>
            <h1 className="mt-4 max-w-4xl text-4xl font-semibold sm:text-6xl">
              Build forms from 500+ Pokemon, every type and every major Ash-era arc.
            </h1>
            <p className="mt-5 max-w-3xl leading-8 text-slate-300">
              Explore Pokemon names, type energy, images, special powers, regions and story hooks from Indigo League through Ultimate Journeys.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild className="bg-yellow-300 text-slate-950 hover:bg-yellow-200">
                <Link href="/login">
                  Generate forms <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="border-white/15 bg-white/5 text-white hover:bg-white/10">
                <Link href="/explore">Explore public forms</Link>
              </Button>
            </div>
          </div>
          <div className="grid gap-3 rounded-md border border-white/10 bg-white/[0.06] p-5 sm:grid-cols-2 lg:grid-cols-1">
            <Stat label="Pokemon indexed" value={`${pokemonJourneyStats.pokemonCount}+`} />
            <Stat label="Types covered" value={pokemonJourneyStats.typeCount} />
            <Stat label="Ash seasons" value={pokemonJourneyStats.seasonCount} />
            <Stat label="Regions surfaced" value={pokemonJourneyStats.regions.length} />
          </div>
        </div>

        <section className="mt-10 rounded-md border border-white/10 bg-white/[0.06] p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="relative w-full xl:max-w-sm">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search Pokemon, region or season" className="pl-9" />
            </div>
            <div className="flex flex-wrap gap-2">
              <FilterButton active={typeFilter === "all"} onClick={() => setTypeFilter("all")}>All types</FilterButton>
              {pokemonTypes.map((type) => (
                <FilterButton key={type} active={typeFilter === type} onClick={() => setTypeFilter(type)}>
                  {type}
                </FilterButton>
              ))}
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <FilterButton active={regionFilter === "all"} onClick={() => setRegionFilter("all")}>All regions</FilterButton>
            {pokemonJourneyStats.regions.map((region) => (
              <FilterButton key={region} active={regionFilter === region} onClick={() => setRegionFilter(region)}>
                {region}
              </FilterButton>
            ))}
          </div>
        </section>

        <section className="mt-8 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-md border border-white/10 bg-white/[0.06] p-5">
            <h2 className="text-xl font-semibold">Type coverage</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {pokemonTypeCoverage.map((item) => (
                <div key={item.type} className="rounded-md border border-white/10 bg-slate-950/45 p-3">
                  <div className="flex justify-between gap-3 text-sm">
                    <span className="capitalize text-slate-100">{item.type}</span>
                    <span className="text-yellow-100">{item.count}</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-yellow-300" style={{ width: `${Math.max(8, (item.count / pokemonJourneyStats.pokemonCount) * 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-md border border-white/10 bg-white/[0.06] p-5">
            <h2 className="text-xl font-semibold">Season timeline</h2>
            <div className="mt-5 max-h-80 space-y-2 overflow-y-auto pr-1">
              {ashSeasonJourney.map((season, index) => (
                <div key={season} className="flex gap-3 rounded-md border border-white/10 bg-slate-950/45 p-3">
                  <span className="grid size-8 shrink-0 place-items-center rounded-md bg-yellow-300 text-xs font-semibold text-slate-950">{index + 1}</span>
                  <p className="text-sm text-slate-200">{season}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-md border border-white/10 bg-white/[0.06] p-5">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <h2 className="text-2xl font-semibold">Pokemon atlas</h2>
              <p className="mt-2 text-sm text-slate-300">{filteredPokemon.length} Pokemon ready for form generation ideas.</p>
            </div>
            <Button asChild className="bg-yellow-300 text-slate-950 hover:bg-yellow-200">
              <Link href="/dashboard">Go to dashboard</Link>
            </Button>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredPokemon.map((pokemon) => (
              <article key={pokemon.dexId} className="motion-card rounded-md border border-white/10 bg-slate-950/45 p-4">
                <div className="flex gap-4">
                  <div className="grid size-24 shrink-0 place-items-center rounded-md border border-white/10 bg-slate-900">
                    <img src={pokemon.imageUrl} alt="" loading="lazy" className="h-20 w-20 object-contain" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-400">#{String(pokemon.dexId).padStart(3, "0")}</p>
                    <h3 className="truncate text-lg font-semibold">{pokemon.name}</h3>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="rounded-md bg-yellow-300/15 px-2 py-1 text-xs capitalize text-yellow-100">{pokemon.primaryType}</span>
                      <span className="rounded-md bg-white/10 px-2 py-1 text-xs text-slate-200">{pokemon.region}</span>
                    </div>
                  </div>
                </div>
                <p className="mt-4 line-clamp-2 text-sm leading-6 text-slate-300">{pokemon.feature}</p>
                <div className="mt-4 rounded-md border border-white/10 bg-white/[0.05] p-3">
                  <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-yellow-100">
                    <BadgeCheck className="size-3.5" />
                    Special power
                  </div>
                  <p className="line-clamp-2 text-sm leading-6 text-slate-300">{pokemon.specialPower}</p>
                </div>
                <p className="mt-3 line-clamp-1 text-xs text-slate-400">{pokemon.seasonArc}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {ashJourneyRegions.map((region) => (
            <article key={region.key} className="rounded-md border border-white/10 bg-white/[0.06] p-4">
              <h3 className="font-semibold">{region.region}</h3>
              <p className="mt-1 text-sm text-yellow-100">{region.arc}</p>
              <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-300">{region.challenge}</p>
            </article>
          ))}
        </section>
      </section>
    </main>
  );
}

function FilterButton({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md border px-3 py-2 text-sm capitalize transition ${
        active ? "border-yellow-300 bg-yellow-300 text-slate-950" : "border-white/10 bg-white/[0.05] text-slate-200 hover:bg-white/10"
      }`}
    >
      {children}
    </button>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-md border border-white/10 bg-slate-950/45 p-4">
      <p className="text-3xl font-semibold text-yellow-100">{value}</p>
      <p className="mt-1 text-sm text-slate-300">{label}</p>
    </div>
  );
}
