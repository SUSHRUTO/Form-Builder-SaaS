"use client";

import Link from "next/link";
import type React from "react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BarChart3, BookOpen, Copy, Eye, FilePlus2, LockKeyhole, RadioTower, Send, Settings, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { ashJourneyFormTemplates, pokemonTypes, type PokemonFormTemplate, type PokemonType } from "@repo/forms";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { SiteNav } from "~/components/site-nav";
import { PokemonTypeAtmosphere } from "~/components/pokemon-motion";
import { trpc } from "~/trpc/client";

export default function DashboardPage() {
  const router = useRouter();
  const utils = trpc.useUtils();
  const [title, setTitle] = useState("Pokemon League Registration");
  const [pokemonType, setPokemonType] = useState<PokemonType>("electric");
  const [newPassword, setNewPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");

  const me = trpc.auth.me.useQuery(undefined, { retry: false });
  const themes = trpc.forms.listThemes.useQuery(undefined, { enabled: Boolean(me.data?.user) });
  const dashboard = trpc.forms.dashboard.useQuery(undefined, { enabled: Boolean(me.data?.user) });
  const forms = trpc.forms.listMine.useQuery(undefined, { enabled: Boolean(me.data?.user) });
  const create = trpc.forms.create.useMutation({
    onSuccess: async (form) => {
      await utils.forms.listMine.invalidate();
      await utils.forms.dashboard.invalidate();
      toast.success("Form created.");
      router.push(`/dashboard/forms/${form.id}`);
    },
    onError: (error) => toast.error(error.message),
  });
  const changePassword = trpc.auth.changePassword.useMutation({
    onSuccess: () => {
      toast.success("Password changed. Please login again.");
      router.push("/login");
    },
    onError: (error) => toast.error(error.message),
  });

  function generateFromTemplate(template: PokemonFormTemplate) {
    const theme = themes.data?.find((item) => item.name === template.themeName);
    create.mutate({
      title: template.title,
      slug: template.slug,
      description: template.description,
      visibility: template.visibility,
      pokemonType: template.pokemonType,
      themeId: theme?.id,
      coverImageUrl: template.coverImageUrl,
      notificationEmail: template.notificationEmail,
      thankYouTitle: "Journey entry received!",
      thankYouMessage: "Thanks for adding to Ash's Pokemon journey. The creator can review it in the trainer console.",
      fields: template.fields,
    });
  }

  if (me.isLoading) {
    return <Shell><div className="rounded-md border border-white/10 bg-white/8 p-8">Loading console...</div></Shell>;
  }

  if (!me.data?.user) {
    return (
      <Shell>
        <div className="rounded-md border border-white/10 bg-white/[0.06] p-8">
          <h1 className="text-3xl font-semibold">Login required</h1>
          <p className="mt-3 text-slate-300">Creator dashboards are protected.</p>
          <Button asChild className="mt-6 bg-yellow-300 text-slate-950 hover:bg-yellow-200">
            <Link href="/login">Login</Link>
          </Button>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-yellow-200">Trainer console</p>
          <h1 className="mt-4 text-4xl font-semibold sm:text-5xl">Welcome, {me.data.user.fullName}.</h1>
          <p className="mt-3 text-slate-300">Build, publish and analyze Pokemon-world forms from one dashboard. Demo access does not require a paid subscription.</p>
        </div>
        <div className="grid gap-3 rounded-md border border-white/10 bg-white/[0.06] p-4 sm:grid-cols-[1fr_auto]">
          <div>
            <Label htmlFor="title">New form title</Label>
            <Input id="title" value={title} onChange={(event) => setTitle(event.target.value)} className="mt-2" />
          </div>
          <div className="grid grid-cols-[1fr_auto] gap-2 sm:min-w-80">
            <div>
              <Label>Type</Label>
              <Select value={pokemonType} onValueChange={(value) => setPokemonType(value as PokemonType)}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {pokemonTypes.map((type) => (
                    <SelectItem key={type} value={type} className="capitalize">
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              disabled={create.isPending}
              className="mt-7 bg-yellow-300 text-slate-950 hover:bg-yellow-200"
              onClick={() => create.mutate({ title, pokemonType, visibility: "unlisted" })}
            >
              <FilePlus2 className="size-4" />
              Create
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <Metric icon={<FilePlus2 />} label="Forms" value={dashboard.data?.totalForms ?? 0} />
        <Metric icon={<RadioTower />} label="Published" value={dashboard.data?.publishedForms ?? 0} />
        <Metric icon={<Send />} label="Responses" value={dashboard.data?.responses ?? 0} />
        <Metric icon={<Eye />} label="Views" value={dashboard.data?.views ?? 0} />
        <Metric icon={<BarChart3 />} label="Completion" value={`${dashboard.data?.completionRate ?? 0}%`} />
      </div>

      <section className="mt-8 grid gap-5 xl:grid-cols-[0.82fr_1.18fr]">
        <div className="motion-card rounded-md border border-white/10 bg-white/[0.06] p-5">
          <div className="flex items-center gap-2 text-yellow-100">
            <BookOpen className="size-5" />
            <h2 className="text-xl font-semibold text-white">Creator path</h2>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {[
              ["1", "Choose Ash chapter"],
              ["2", "Generate a draft"],
              ["3", "Edit fields and theme"],
              ["4", "Publish, share and analyze"],
            ].map(([step, label]) => (
              <div key={step} className="rounded-md border border-white/10 bg-slate-950/40 p-4">
                <span className="grid size-8 place-items-center rounded-md bg-yellow-300 text-sm font-semibold text-slate-950">{step}</span>
                <p className="mt-3 text-sm font-medium text-slate-100">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-md border border-white/10 bg-white/[0.06] p-5">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-yellow-200">
                <Sparkles className="size-4" />
                Ash journey generator
              </p>
              <h2 className="mt-2 text-2xl font-semibold">Create different Pokemon forms one by one.</h2>
            </div>
            <Button asChild variant="outline" className="border-white/15 bg-white/5 text-white hover:bg-white/10">
              <Link href="/journey">Open 500+ Pokemon dex</Link>
            </Button>
          </div>
          <div className="mt-5 grid max-h-[34rem] gap-4 overflow-y-auto pr-1 md:grid-cols-2">
            {ashJourneyFormTemplates.map((template) => (
              <article key={template.slug} className="motion-card rounded-md border border-white/10 bg-slate-950/45 p-4">
                <div className="flex gap-3">
                  <img src={template.coverImageUrl} alt="" className="size-16 rounded-md bg-slate-900 object-contain p-1" />
                  <div className="min-w-0">
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-md bg-yellow-300/15 px-2 py-1 text-xs capitalize text-yellow-100">{template.pokemonType}</span>
                      <span className="rounded-md bg-white/10 px-2 py-1 text-xs capitalize text-slate-200">{template.visibility}</span>
                    </div>
                    <h3 className="mt-2 line-clamp-2 font-semibold">{template.title}</h3>
                  </div>
                </div>
                <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-300">{template.description}</p>
                <Button
                  disabled={create.isPending}
                  className="mt-4 w-full bg-yellow-300 text-slate-950 hover:bg-yellow-200"
                  onClick={() => generateFromTemplate(template)}
                >
                  <FilePlus2 className="size-4" />
                  Generate draft
                </Button>
              </article>
            ))}
          </div>
        </div>
      </section>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_22rem]">
        <section className="rounded-md border border-white/10 bg-white/[0.06]">
          <div className="flex items-center justify-between border-b border-white/10 p-5">
            <h2 className="text-xl font-semibold">Forms</h2>
            <span className="text-sm text-slate-400">{forms.data?.length ?? 0} total</span>
          </div>
          <div className="divide-y divide-white/10">
            {forms.data?.map((form) => (
              <article key={form.id} className="motion-card grid gap-4 p-5 lg:grid-cols-[1fr_auto] lg:items-center">
                <div className="flex gap-4">
                  {form.coverImageUrl ? <img src={form.coverImageUrl} alt="" className="size-16 rounded-md object-contain bg-slate-950" /> : null}
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">{form.title}</h3>
                      <span className="rounded-md bg-white/10 px-2 py-1 text-xs capitalize text-slate-200">{form.status}</span>
                      <span className="rounded-md bg-yellow-300/15 px-2 py-1 text-xs capitalize text-yellow-100">{form.visibility}</span>
                    </div>
                    <p className="mt-1 text-sm text-slate-400">/{form.slug}</p>
                    <p className="mt-2 text-sm text-slate-300">{form.responseCount} responses · {form.completionRate}% completion</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button asChild variant="outline" className="border-white/15 bg-white/5 text-white hover:bg-white/10">
                    <Link href={`/dashboard/forms/${form.id}`}>
                      <Settings className="size-4" />
                      Builder
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="border-white/15 bg-white/5 text-white hover:bg-white/10">
                    <Link href={`/dashboard/forms/${form.id}/responses`}>
                      <BarChart3 className="size-4" />
                      Analytics
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    className="border-white/15 bg-white/5 text-white hover:bg-white/10"
                    onClick={() => {
                      navigator.clipboard.writeText(form.shareUrl);
                      toast.success("Share link copied.");
                    }}
                  >
                    <Copy className="size-4" />
                  </Button>
                </div>
              </article>
            ))}
            {!forms.data?.length ? (
              <div className="p-10 text-center text-slate-300">Create your first form to start collecting responses.</div>
            ) : null}
          </div>
        </section>

        <aside className="space-y-6">
          <section className="rounded-md border border-white/10 bg-white/[0.06] p-5">
            <div className="flex items-center gap-2">
              <LockKeyhole className="size-5 text-yellow-200" />
              <h2 className="text-xl font-semibold">Change password</h2>
            </div>
            <div className="mt-4 space-y-3">
              <Input
                type="password"
                placeholder="Current password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
              />
              <Input
                type="password"
                placeholder="New password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
              />
              <Button
                disabled={changePassword.isPending}
                className="w-full bg-yellow-300 text-slate-950 hover:bg-yellow-200"
                onClick={() => changePassword.mutate({ currentPassword, newPassword })}
              >
                Update password
              </Button>
            </div>
          </section>
          <section className="rounded-md border border-white/10 bg-white/[0.06] p-5">
            <h2 className="text-xl font-semibold">API docs</h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Scalar renders OpenAPI routes generated from the tRPC router, including public submissions.
            </p>
            <Button asChild variant="outline" className="mt-5 w-full border-white/15 bg-white/5 text-white hover:bg-white/10">
              <a href={process.env.NEXT_PUBLIC_API_DOCS_URL ?? "http://localhost:8000/docs"}>Open Scalar docs</a>
            </Button>
          </section>
        </aside>
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#07111f] text-white">
      <PokemonTypeAtmosphere className="opacity-45" />
      <SiteNav />
      <section className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6">{children}</section>
    </main>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="motion-card rounded-md border border-white/10 bg-white/[0.06] p-5">
      <div className="mb-4 grid size-9 place-items-center rounded-md bg-yellow-300 text-slate-950">{icon}</div>
      <p className="text-3xl font-semibold">{value}</p>
      <p className="mt-1 text-sm text-slate-400">{label}</p>
    </div>
  );
}
