import Link from "next/link";
import type React from "react";
import { ArrowRight, BarChart3, Bot, KeyRound, WandSparkles } from "lucide-react";
import { ashJourneyPokemon, pokemonImage, pokemonJourneyStats } from "@repo/forms";
import { Button } from "~/components/ui/button";
import { SiteNav } from "~/components/site-nav";
import {
  AnimatedBadge,
  AnimatedPokeball,
  PokedexScanner,
  PokemonTypeAtmosphere,
  TypeMeter,
} from "~/components/pokemon-motion";

const typeBadges = ["electric", "fire", "water", "grass", "ghost", "dragon", "fairy", "steel"];
const heroPokemon = [25, 6, 131, 448, 501]
  .map((dexId) => ashJourneyPokemon.find((pokemon) => pokemon.dexId === dexId))
  .filter((pokemon): pokemon is NonNullable<typeof pokemon> => Boolean(pokemon));

export default function Home() {
  return (
    <main className="min-h-screen bg-[#07111f] text-white">
      <SiteNav />
      <section className="relative isolate overflow-hidden">
        <PokemonTypeAtmosphere />
        <div className="absolute inset-0 z-[-2] bg-[url('https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1800&q=80')] bg-cover bg-center opacity-30" />
        <div className="absolute inset-0 z-[-1] bg-[#07111f]/70" />
        <div className="mx-auto grid min-h-[82vh] max-w-7xl content-center gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="max-w-3xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-md border border-yellow-300/40 bg-yellow-300/12 px-3 py-2 text-sm text-yellow-100">
              <WandSparkles className="size-4" />
              Typeform-style forms with Pokemon-world energy
            </div>
            <h1 className="max-w-4xl text-5xl font-semibold leading-tight text-white sm:text-6xl lg:text-7xl">
              Build form quests that feel like legendary encounters.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-200">
              PokeForms gives creators dynamic schemas, public or unlisted links, response analytics,
              email flows, themes, API docs and seeded demo data in one Turborepo product.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-yellow-300 text-slate-950 hover:bg-yellow-200">
                <Link href="/register">
                  Create your first form <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/20 bg-white/5 text-white hover:bg-white/10">
                <Link href="/explore">Explore public forms</Link>
              </Button>
            </div>
            <div className="mt-8 flex flex-wrap gap-2">
              {typeBadges.map((type) => (
                <AnimatedBadge key={type} className="capitalize text-slate-100">
                  {type}
                </AnimatedBadge>
              ))}
            </div>
          </div>
          <div className="relative self-center">
            <AnimatedPokeball className="mx-auto mb-6" />
            <div className="rounded-md border border-white/12 bg-slate-950/70 p-4 shadow-2xl backdrop-blur">
              <PokedexScanner
                imageUrl={pokemonImage(25)}
                title="Ash Journey Dex"
                subtitle="Forms can follow badges, friends, rivals, evolutions and mysteries."
                className="mb-3"
              />
              <div className="mb-3 grid grid-cols-5 gap-2">
                {heroPokemon.map((pokemon) => (
                  <div key={pokemon.dexId} className="rounded-md border border-white/10 bg-slate-900 p-2">
                    <img src={pokemon.imageUrl} alt="" className="h-12 w-full object-contain" />
                    <p className="mt-1 truncate text-center text-[10px] text-slate-300">{pokemon.name}</p>
                  </div>
                ))}
              </div>
              <div className="grid gap-3">
                <TypeMeter label="Schema power" value={96} tone="electric" />
                <TypeMeter label="Public link reach" value={88} tone="water" />
                <TypeMeter label="Judge polish" value={94} tone="fire" />
              </div>
            </div>
          </div>
          <div className="lg:col-span-2 rounded-md border border-white/12 bg-slate-950/60 p-4 shadow-2xl backdrop-blur">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ["Public and unlisted", "Visibility checks keep galleries clean and direct links working."],
                ["Zod schemas", "Every dynamic answer is validated against creator field rules."],
                ["Scalar docs", "REST-shaped OpenAPI docs are generated from tRPC procedures."],
                ["Demo seeded", "Pokemon themes, forms, responses and analytics are ready for judging."],
              ].map(([title, copy]) => (
                <div key={title} className="motion-card rounded-md border border-white/10 bg-white/8 p-4">
                  <p className="font-medium text-white">{title}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{copy}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#0c1728]">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 py-8 sm:grid-cols-2 sm:px-6 lg:grid-cols-5">
          <Metric label="Field types" value="9" />
          <Metric label="Visibility modes" value="2" />
          <Metric label="Pokemon indexed" value={`${pokemonJourneyStats.pokemonCount}+`} />
          <Metric label="Journey templates" value="12+" />
          <Metric label="Docs stack" value="Scalar" />
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-4 py-16 sm:px-6 lg:grid-cols-3">
        <Feature icon={<KeyRound />} title="Creator auth that behaves like SaaS">
          Email/password registration, login, database sessions, reset-password flow, change password
          and demo credentials for judges.
        </Feature>
        <Feature icon={<Bot />} title="Dynamic Pokemon form builder">
          Add text, email, number, select, multi-select, checkbox, rating and date fields with rules,
          required flags, options, themes and custom slugs.
        </Feature>
        <Feature icon={<BarChart3 />} title="Responses and analytics">
          Public submissions require no login, rate limiting protects the endpoint, and creators get
          response tables, charts, CSV export and notification events.
        </Feature>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 pb-20 sm:px-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-yellow-200">Demo credentials</p>
          <h2 className="mt-3 text-3xl font-semibold">Judge-friendly from the first click.</h2>
          <p className="mt-4 leading-7 text-slate-300">
            The seed command creates a creator account, themed forms, public and unlisted visibility
            examples, responses, analytics and queued email events.
          </p>
        </div>
        <div className="grid gap-3 rounded-md border border-white/10 bg-white/8 p-5 text-sm text-slate-200 sm:grid-cols-2">
          <Info label="Email" value="demo@pokebuilder.dev" />
          <Info label="Password" value="Pikachu@2026" />
          <Info label="API docs" value="http://localhost:8000/docs" />
          <Info label="Demo link" value="/explore" />
        </div>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-white/8 p-5">
      <p className="text-3xl font-semibold text-yellow-200">{value}</p>
      <p className="mt-1 text-sm text-slate-300">{label}</p>
    </div>
  );
}

function Feature({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <article className="motion-card rounded-md border border-white/10 bg-white/[0.06] p-6">
      <div className="mb-5 grid size-10 place-items-center rounded-md bg-yellow-300 text-slate-950">{icon}</div>
      <h3 className="text-xl font-semibold">{title}</h3>
      <p className="mt-3 leading-7 text-slate-300">{children}</p>
    </article>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-slate-950/50 p-4">
      <p className="text-slate-400">{label}</p>
      <p className="mt-2 font-mono text-yellow-100">{value}</p>
    </div>
  );
}
