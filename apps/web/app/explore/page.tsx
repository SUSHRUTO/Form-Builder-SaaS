"use client";

import Link from "next/link";
import { useState } from "react";
import { Compass, Eye, Search, Send, Sparkles } from "lucide-react";
import { ashJourneyPokemon, pokemonJourneyStats } from "@repo/forms";
import { toast } from "sonner";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { SiteNav } from "~/components/site-nav";
import { PokemonTypeAtmosphere } from "~/components/pokemon-motion";
import { trpc } from "~/trpc/client";

export default function ExplorePage() {
  const [query, setQuery] = useState("");
  const utils = trpc.useUtils();
  const { data, isLoading, isError, error } = trpc.forms.publicList.useQuery({ query: query || null });
  const seedDemo = trpc.forms.seedDemo.useMutation({
    onSuccess: async () => {
      await utils.forms.publicList.invalidate();
      toast.success("Pokemon demo forms are ready.");
    },
    onError: (mutationError) => toast.error(mutationError.message),
  });
  const featuredPokemon = ashJourneyPokemon.slice(0, 18);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#07111f] text-white">
      <PokemonTypeAtmosphere className="opacity-55" />
      <SiteNav />
      <section className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.24em] text-yellow-200">
              <Compass className="size-4" />
              Public explore
            </p>
            <h1 className="mt-4 text-4xl font-semibold sm:text-6xl">Published forms in the wild.</h1>
            <p className="mt-4 max-w-2xl leading-7 text-slate-300">
              Only forms marked public appear here. Unlisted forms stay hidden and are available only
              from their direct links.
            </p>
            <div className="mt-5 flex flex-wrap gap-3 text-sm text-slate-200">
              <span className="rounded-md border border-white/10 bg-white/10 px-3 py-2">{pokemonJourneyStats.pokemonCount}+ Pokemon in Journey Dex</span>
              <span className="rounded-md border border-white/10 bg-white/10 px-3 py-2">{pokemonJourneyStats.seasonCount} Ash seasons</span>
              <span className="rounded-md border border-white/10 bg-white/10 px-3 py-2">{pokemonJourneyStats.typeCount} types covered</span>
            </div>
          </div>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search forms"
              className="pl-9"
            />
          </div>
        </div>

        <section className="mt-8 rounded-md border border-white/10 bg-white/[0.06] p-5">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-yellow-200">
                <Sparkles className="size-4" />
                Ash Ketchum journey
              </p>
              <h2 className="mt-2 text-2xl font-semibold">Pokemon, powers, seasons and form ideas.</h2>
            </div>
            <Button asChild className="bg-yellow-300 text-slate-950 hover:bg-yellow-200">
              <Link href="/journey">View full 500+ Pokemon journey</Link>
            </Button>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {featuredPokemon.map((pokemon) => (
              <article key={pokemon.dexId} className="motion-card rounded-md border border-white/10 bg-slate-950/45 p-3">
                <img src={pokemon.imageUrl} alt="" loading="lazy" className="mx-auto h-24 w-full object-contain" />
                <div className="mt-2 flex items-center justify-between gap-2">
                  <h3 className="truncate text-sm font-semibold">{pokemon.name}</h3>
                  <span className="rounded-md bg-yellow-300/15 px-2 py-1 text-[10px] capitalize text-yellow-100">{pokemon.primaryType}</span>
                </div>
                <p className="mt-1 truncate text-xs text-slate-400">{pokemon.region}</p>
              </article>
            ))}
          </div>
        </section>

        <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {isLoading
            ? Array.from({ length: 3 }).map((_, index) => <div key={index} className="h-80 rounded-md border border-white/10 bg-white/8" />)
            : data?.map((form) => (
                <article key={form.id} className="motion-card overflow-hidden rounded-md border border-white/10 bg-white/[0.06]">
                  <div className="relative h-44 bg-slate-950">
                    {form.coverImageUrl ? (
                      <img src={form.coverImageUrl} alt="" className="absolute inset-0 h-full w-full object-contain p-4" />
                    ) : null}
                    <div className="absolute left-4 top-4 rounded-md bg-slate-950/80 px-3 py-1 text-xs capitalize text-yellow-100">
                      {form.pokemonType}
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span className="inline-flex items-center gap-1">
                        <Eye className="size-3.5" />
                        {form.viewCount}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Send className="size-3.5" />
                        {form.responseCount}
                      </span>
                      <span className="capitalize">{form.visibility}</span>
                    </div>
                    <h2 className="mt-3 text-xl font-semibold">{form.title}</h2>
                    <p className="mt-2 line-clamp-3 min-h-16 text-sm leading-6 text-slate-300">{form.description}</p>
                    <Button asChild className="mt-5 w-full bg-yellow-300 text-slate-950 hover:bg-yellow-200">
                      <Link href={`/f/${form.slug}`}>Open form</Link>
                    </Button>
                  </div>
                </article>
              ))}
        </div>

        {isError ? (
          <div className="mt-10 rounded-md border border-red-400/30 bg-red-500/10 p-6 text-red-100">
            {error.message}
          </div>
        ) : null}

        {!isLoading && !data?.length ? (
          <div className="mt-10 rounded-md border border-white/10 bg-white/[0.06] p-10 text-center text-slate-300">
            <p>No public forms found yet.</p>
            <Button
              disabled={seedDemo.isPending}
              className="mt-5 bg-yellow-300 text-slate-950 hover:bg-yellow-200"
              onClick={() => seedDemo.mutate()}
            >
              <Sparkles className="size-4" />
              Prepare demo forms
            </Button>
          </div>
        ) : null}
      </section>
    </main>
  );
}
