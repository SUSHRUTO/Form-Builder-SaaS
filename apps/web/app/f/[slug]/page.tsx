"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, LockKeyhole, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { SiteNav } from "~/components/site-nav";
import { FormFieldControl } from "~/components/form-field-control";
import { AnimatedPokeball, PokedexScanner, PokemonTypeAtmosphere } from "~/components/pokemon-motion";
import { trpc } from "~/trpc/client";

export default function FillPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const form = trpc.forms.publicGet.useQuery({ slug }, { retry: false });
  const start = trpc.forms.publicStart.useMutation();
  const submit = trpc.forms.submit.useMutation({
    onSuccess: (result) => setThanks(result),
    onError: (error) => toast.error(error.message),
  });
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [respondentEmail, setRespondentEmail] = useState("");
  const [password, setPassword] = useState("");
  const [website, setWebsite] = useState("");
  const [startedAt] = useState(() => new Date().toISOString());
  const [thanks, setThanks] = useState<{ thankYouTitle: string; thankYouMessage: string } | null>(null);

  useEffect(() => {
    if (slug) start.mutate({ slug });
  }, [slug]);

  const field = form.data?.fields[step];
  const theme = form.data?.theme;
  const progress = useMemo(() => {
    if (!form.data?.fields.length) return 0;
    return Math.round(((step + 1) / form.data.fields.length) * 100);
  }, [form.data?.fields.length, step]);

  if (form.isLoading) {
    return <Shell><div className="rounded-md border border-white/10 bg-white/8 p-8">Loading form...</div></Shell>;
  }

  if (form.error || !form.data) {
    return (
      <Shell>
        <div className="rounded-md border border-white/10 bg-white/[0.06] p-8">
          <h1 className="text-3xl font-semibold">Form unavailable</h1>
          <p className="mt-3 text-slate-300">{form.error?.message ?? "This link is invalid or unpublished."}</p>
          <Button asChild className="mt-6 bg-yellow-300 text-slate-950 hover:bg-yellow-200">
            <Link href="/explore">Explore public forms</Link>
          </Button>
        </div>
      </Shell>
    );
  }

  if (thanks) {
    return (
      <ThemedShell theme={theme} image={form.data.coverImageUrl}>
        <div className="mx-auto max-w-2xl rounded-md border border-white/10 bg-slate-950/70 p-8 text-center">
          <AnimatedPokeball className="mx-auto mb-8 scale-50" />
          <h1 className="text-4xl font-semibold">{thanks.thankYouTitle}</h1>
          <p className="mt-4 leading-7 text-slate-300">{thanks.thankYouMessage}</p>
          <Button asChild className="mt-8 bg-yellow-300 text-slate-950 hover:bg-yellow-200">
            <Link href="/explore">Explore more forms</Link>
          </Button>
        </div>
      </ThemedShell>
    );
  }

  return (
    <ThemedShell theme={theme} image={form.data.coverImageUrl}>
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.85fr_1.15fr]">
        <aside className="self-start">
          <span className="rounded-md bg-yellow-300 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-950">
            {form.data.pokemonType}
          </span>
          <h1 className="mt-5 text-4xl font-semibold sm:text-5xl">{form.data.title}</h1>
          <p className="mt-4 leading-7 text-slate-200">{form.data.description}</p>
          <div className="mt-8 h-2 overflow-hidden rounded-full bg-white/15">
            <div className="h-full bg-yellow-300 transition-all" style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-2 text-sm text-slate-300">
            Step {step + 1} of {form.data.fields.length}
          </p>
          {theme?.imageUrl ? (
            <PokedexScanner
              imageUrl={theme.imageUrl}
              title={theme.name}
              subtitle={theme.aura}
              className="mt-8"
            />
          ) : null}
        </aside>

        <form
          className="motion-card rounded-md border border-white/10 bg-slate-950/72 p-6 shadow-2xl backdrop-blur"
          onSubmit={(event) => {
            event.preventDefault();
            submit.mutate({
              slug,
              answers,
              respondentEmail: respondentEmail || null,
              password: password || null,
              startedAt,
              website,
            });
          }}
        >
          <input tabIndex={-1} aria-hidden="true" className="hidden" value={website} onChange={(event) => setWebsite(event.target.value)} />
          {form.data.passwordProtected ? (
            <div className="mb-6 rounded-md border border-yellow-300/30 bg-yellow-300/10 p-4">
              <Label className="flex items-center gap-2 text-yellow-100">
                <LockKeyhole className="size-4" />
                Form password
              </Label>
              <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2" />
            </div>
          ) : null}
          {field ? (
            <FormFieldControl
              field={field}
              value={answers[field.id]}
              onChange={(value) => setAnswers({ ...answers, [field.id]: value })}
            />
          ) : null}
          {step === form.data.fields.length - 1 ? (
            <div className="mt-6">
              <Label htmlFor="respondentEmail">Email receipt</Label>
              <Input
                id="respondentEmail"
                type="email"
                value={respondentEmail}
                onChange={(event) => setRespondentEmail(event.target.value)}
                placeholder="Optional"
                className="mt-2"
              />
            </div>
          ) : null}
          <div className="mt-8 flex justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              className="border-white/15 bg-white/5 text-white hover:bg-white/10"
              disabled={step === 0}
              onClick={() => setStep((value) => Math.max(0, value - 1))}
            >
              <ArrowLeft className="size-4" />
              Back
            </Button>
            {step === form.data.fields.length - 1 ? (
              <Button disabled={submit.isPending} className="bg-yellow-300 text-slate-950 hover:bg-yellow-200">
                {submit.isPending ? "Submitting..." : "Submit"}
                <Send className="size-4" />
              </Button>
            ) : (
              <Button type="button" className="bg-yellow-300 text-slate-950 hover:bg-yellow-200" onClick={() => setStep((value) => value + 1)}>
                Next
                <ArrowRight className="size-4" />
              </Button>
            )}
          </div>
        </form>
      </div>
    </ThemedShell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-[#07111f] text-white">
      <SiteNav />
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">{children}</section>
    </main>
  );
}

function ThemedShell({
  children,
  theme,
  image,
}: {
  children: React.ReactNode;
  theme?: { backgroundColor: string; accentColor: string; imageUrl: string } | null;
  image?: string | null;
}) {
  return (
    <main className="min-h-screen text-white" style={{ backgroundColor: theme?.backgroundColor ?? "#07111f" }}>
      <SiteNav />
      <section className="relative isolate min-h-[calc(100vh-4rem)] overflow-hidden px-4 py-12 sm:px-6">
        <PokemonTypeAtmosphere className="z-[-1] opacity-60" />
        {image ? <img src={image} alt="" className="absolute right-0 top-16 z-[-1] h-[38rem] w-[38rem] object-contain opacity-25" /> : null}
        <div className="absolute inset-0 z-[-2] bg-[#07111f]/45" />
        {children}
      </section>
    </main>
  );
}
