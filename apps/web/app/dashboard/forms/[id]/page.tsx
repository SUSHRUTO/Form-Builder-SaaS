"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import type React from "react";
import { useEffect, useMemo, useState } from "react";
import {
  Archive,
  BarChart3,
  Copy,
  Eye,
  Globe2,
  Plus,
  RadioTower,
  Save,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import {
  fieldTypeSchema,
  pokemonTypes,
  type FieldType,
  type FormDetail,
  type FormFieldOutput,
  type FormVisibility,
  type PokemonType,
  pokemonImage,
} from "@repo/forms";
import type { RouterInputs } from "@repo/trpc/client";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Textarea } from "~/components/ui/textarea";
import { SiteNav } from "~/components/site-nav";
import { FormFieldControl } from "~/components/form-field-control";
import { PokedexScanner, PokemonTypeAtmosphere, TypeMeter } from "~/components/pokemon-motion";
import { trpc } from "~/trpc/client";

export default function BuilderPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const utils = trpc.useUtils();
  const id = params.id;
  const me = trpc.auth.me.useQuery(undefined, { retry: false });
  const formQuery = trpc.forms.getMine.useQuery({ id }, { enabled: Boolean(me.data?.user && id) });
  const themes = trpc.forms.listThemes.useQuery();
  const [draft, setDraft] = useState<FormDetail | null>(null);
  const [previewAnswers, setPreviewAnswers] = useState<Record<string, unknown>>({});
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (formQuery.data) {
      setDraft(formQuery.data);
      setPreviewAnswers({});
    }
  }, [formQuery.data]);

  const save = trpc.forms.update.useMutation({
    onSuccess: async (form) => {
      setDraft(form);
      await utils.forms.getMine.invalidate({ id });
      await utils.forms.listMine.invalidate();
      toast.success("Form saved.");
    },
    onError: (error) => toast.error(error.message),
  });
  const publish = trpc.forms.publish.useMutation({
    onSuccess: async (form) => {
      setDraft(form);
      await utils.forms.getMine.invalidate({ id });
      toast.success("Form published.");
    },
    onError: (error) => toast.error(error.message),
  });
  const unpublish = trpc.forms.unpublish.useMutation({
    onSuccess: async (form) => {
      setDraft(form);
      await utils.forms.getMine.invalidate({ id });
      toast.success("Form unpublished.");
    },
    onError: (error) => toast.error(error.message),
  });
  const clone = trpc.forms.clone.useMutation({
    onSuccess: (form) => {
      toast.success("Form cloned.");
      router.push(`/dashboard/forms/${form.id}`);
    },
    onError: (error) => toast.error(error.message),
  });
  const archive = trpc.forms.archive.useMutation({
    onSuccess: () => {
      toast.success("Form archived.");
      router.push("/dashboard");
    },
    onError: (error) => toast.error(error.message),
  });

  const shareUrl = draft?.shareUrl ?? "";
  const selectedThemeId = draft?.theme?.id ?? "";
  const selectedTheme = useMemo(
    () => themes.data?.find((theme) => theme.id === selectedThemeId) ?? draft?.theme ?? null,
    [themes.data, selectedThemeId, draft?.theme],
  );

  if (me.isLoading) {
    return <Shell><div className="rounded-md border border-white/10 bg-white/8 p-8">Loading builder...</div></Shell>;
  }

  if (!me.data?.user) {
    return <Shell><LoginRequired /></Shell>;
  }

  if (formQuery.isLoading || !draft) {
    return <Shell><div className="rounded-md border border-white/10 bg-white/8 p-8">Loading builder...</div></Shell>;
  }

  return (
    <Shell>
      <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-yellow-200">Form builder</p>
          <Input
            value={draft.title}
            onChange={(event) => setDraft({ ...draft, title: event.target.value })}
            className="mt-3 h-auto border-none bg-transparent px-0 text-4xl font-semibold text-white shadow-none focus-visible:ring-0 sm:text-5xl"
          />
          <p className="mt-2 text-sm text-slate-400">/{draft.slug}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="border-white/15 bg-white/5 text-white hover:bg-white/10" asChild>
            <Link href={`/dashboard/forms/${id}/responses`}>
              <BarChart3 className="size-4" />
              Analytics
            </Link>
          </Button>
          <Button
            variant="outline"
            className="border-white/15 bg-white/5 text-white hover:bg-white/10"
            onClick={() => {
              navigator.clipboard.writeText(shareUrl);
              toast.success("Share link copied.");
            }}
          >
            <Copy className="size-4" />
            Copy link
          </Button>
          {draft.status === "published" ? (
            <Button variant="outline" className="border-white/15 bg-white/5 text-white hover:bg-white/10" onClick={() => unpublish.mutate({ id })}>
              Unpublish
            </Button>
          ) : (
            <Button className="bg-yellow-300 text-slate-950 hover:bg-yellow-200" onClick={() => publish.mutate({ id })}>
              <RadioTower className="size-4" />
              Publish
            </Button>
          )}
          <Button disabled={save.isPending} className="bg-yellow-300 text-slate-950 hover:bg-yellow-200" onClick={() => saveDraft(draft, password, save.mutate)}>
            <Save className="size-4" />
            Save
          </Button>
        </div>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[22rem_1fr_26rem]">
        <aside className="space-y-5">
          <Panel title="Settings">
            <div className="space-y-4">
              <div>
                <Label>Description</Label>
                <Textarea value={draft.description ?? ""} onChange={(event) => setDraft({ ...draft, description: event.target.value })} className="mt-2" />
              </div>
              <div>
                <Label>Slug</Label>
                <Input value={draft.slug} onChange={(event) => setDraft({ ...draft, slug: event.target.value })} className="mt-2" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Visibility</Label>
                  <Select value={draft.visibility} onValueChange={(value) => setDraft({ ...draft, visibility: value as FormVisibility })}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Public</SelectItem>
                      <SelectItem value="unlisted">Unlisted</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Pokemon type</Label>
                  <Select value={draft.pokemonType} onValueChange={(value) => setDraft({ ...draft, pokemonType: value as PokemonType })}>
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
              </div>
              <div>
                <Label>Theme</Label>
                <Select
                  value={selectedThemeId}
                  onValueChange={(themeId) => {
                    const theme = themes.data?.find((item) => item.id === themeId) ?? null;
                    setDraft({ ...draft, theme, pokemonType: theme?.pokemonType ?? draft.pokemonType });
                  }}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Choose theme" />
                  </SelectTrigger>
                  <SelectContent>
                    {themes.data?.map((theme) => (
                      <SelectItem key={theme.id} value={theme.id}>
                        {theme.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Cover image URL</Label>
                <Input value={draft.coverImageUrl ?? ""} onChange={(event) => setDraft({ ...draft, coverImageUrl: event.target.value })} className="mt-2" />
              </div>
              <div>
                <Label>Notification email</Label>
                <Input value={draft.notificationEmail ?? ""} onChange={(event) => setDraft({ ...draft, notificationEmail: event.target.value })} className="mt-2" />
              </div>
              <div>
                <Label>Thank-you title</Label>
                <Input value={draft.thankYouTitle ?? ""} onChange={(event) => setDraft({ ...draft, thankYouTitle: event.target.value })} className="mt-2" />
              </div>
              <div>
                <Label>Thank-you message</Label>
                <Textarea value={draft.thankYouMessage ?? ""} onChange={(event) => setDraft({ ...draft, thankYouMessage: event.target.value })} className="mt-2" />
              </div>
              <div>
                <Label>Form password</Label>
                <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder={draft.passwordProtected ? "Leave blank to keep current" : "Optional"} className="mt-2" />
              </div>
              <div>
                <Label>Response limit</Label>
                <Input
                  type="number"
                  value={draft.responseLimit ?? ""}
                  onChange={(event) => setDraft({ ...draft, responseLimit: event.target.value ? Number(event.target.value) : null })}
                  className="mt-2"
                />
              </div>
            </div>
          </Panel>

          <Panel title="Share">
            <MiniQr value={shareUrl} />
            <Button asChild variant="outline" className="mt-4 w-full border-white/15 bg-white/5 text-white hover:bg-white/10">
              <Link href={`/f/${draft.slug}`} target="_blank">
                <Eye className="size-4" />
                Open public link
              </Link>
            </Button>
          </Panel>
        </aside>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Fields</h2>
            <Button
              className="bg-yellow-300 text-slate-950 hover:bg-yellow-200"
              onClick={() => setDraft({ ...draft, fields: [...draft.fields, newField(draft.fields.length)] })}
            >
              <Plus className="size-4" />
              Add field
            </Button>
          </div>
          {draft.fields.map((field, index) => (
            <FieldEditor
              key={field.id}
              field={field}
              index={index}
              onChange={(next) => replaceField(draft, field.id, next, setDraft)}
              onRemove={() => setDraft({ ...draft, fields: draft.fields.filter((item) => item.id !== field.id) })}
            />
          ))}
        </section>

        <aside className="xl:sticky xl:top-24 xl:self-start">
          <div
            className="motion-card rounded-md border p-5"
            style={{
              borderColor: selectedTheme?.accentColor ?? "#facc15",
              backgroundColor: selectedTheme?.cardColor ?? "#111827",
              color: selectedTheme?.textColor ?? "#fff",
            }}
          >
            <PokedexScanner
              imageUrl={selectedTheme?.imageUrl ?? draft.coverImageUrl ?? pokemonImage(25)}
              title="Live form preview"
              subtitle={selectedTheme?.aura ?? "Choose a Pokemon type and watch the form energy shift."}
              className="mb-5"
            />
            <div className="mb-5 grid gap-2">
              <TypeMeter label="Completion forecast" value={draft.fields.length > 6 ? 76 : 92} tone="electric" />
              <TypeMeter label="Theme intensity" value={draft.theme ? 95 : 54} tone="ghost" />
            </div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="rounded-md px-2 py-1 text-xs capitalize" style={{ backgroundColor: selectedTheme?.accentColor ?? "#facc15", color: "#08111f" }}>
                  {draft.pokemonType}
                </span>
                <h2 className="mt-4 text-2xl font-semibold">{draft.title}</h2>
                <p className="mt-2 text-sm opacity-80">{draft.description}</p>
              </div>
              {selectedTheme?.imageUrl ? <img src={selectedTheme.imageUrl} alt="" className="size-20 object-contain" /> : null}
            </div>
            <div className="mt-6 space-y-6">
              {draft.fields.slice(0, 4).map((field) => (
                <FormFieldControl
                  key={field.id}
                  field={field}
                  value={previewAnswers[field.id]}
                  onChange={(value) => setPreviewAnswers({ ...previewAnswers, [field.id]: value })}
                />
              ))}
            </div>
          </div>
        </aside>
      </div>

      <div className="mt-8 flex flex-wrap gap-2">
        <Button variant="outline" className="border-white/15 bg-white/5 text-white hover:bg-white/10" onClick={() => clone.mutate({ id })}>
          <Copy className="size-4" />
          Clone
        </Button>
        <Button variant="outline" className="border-white/15 bg-white/5 text-white hover:bg-white/10" onClick={() => archive.mutate({ id })}>
          <Archive className="size-4" />
          Archive
        </Button>
      </div>
    </Shell>
  );
}

function saveDraft(draft: FormDetail, password: string, mutate: (input: RouterInputs["forms"]["update"]) => void) {
  mutate({
    id: draft.id,
    title: draft.title,
    description: draft.description,
    slug: draft.slug,
    visibility: draft.visibility,
    pokemonType: draft.pokemonType,
    coverImageUrl: draft.coverImageUrl || null,
    themeId: draft.theme?.id,
    thankYouTitle: draft.thankYouTitle,
    thankYouMessage: draft.thankYouMessage,
    notificationEmail: draft.notificationEmail || null,
    responseLimit: draft.responseLimit,
    password: password || undefined,
    fields: draft.fields.map((field) => ({
      id: field.id,
      key: field.key,
      type: field.type,
      label: field.label,
      helpText: field.helpText,
      placeholder: field.placeholder,
      required: field.required,
      options: field.options,
      validations: field.validations,
      conditionalLogic: field.conditionalLogic,
    })),
  });
}

function newField(order: number): FormFieldOutput {
  return {
    id: crypto.randomUUID(),
    key: `field_${order + 1}`,
    order,
    type: "short_text",
    label: "New question",
    helpText: null,
    placeholder: "Type your answer",
    required: false,
    options: [],
    validations: {},
    conditionalLogic: [],
  };
}

function replaceField(draft: FormDetail, fieldId: string, next: FormFieldOutput, setDraft: (form: FormDetail) => void) {
  setDraft({ ...draft, fields: draft.fields.map((field) => (field.id === fieldId ? next : field)) });
}

function FieldEditor({
  field,
  index,
  onChange,
  onRemove,
}: {
  field: FormFieldOutput;
  index: number;
  onChange: (field: FormFieldOutput) => void;
  onRemove: () => void;
}) {
  const optionsText = field.options.map((option) => option.label).join(", ");
  return (
    <article className="motion-card rounded-md border border-white/10 bg-white/[0.06] p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <div className="grid size-10 shrink-0 place-items-center rounded-md bg-yellow-300 text-sm font-semibold text-slate-950">{index + 1}</div>
        <div className="grid flex-1 gap-4">
          <div className="grid gap-3 md:grid-cols-[1fr_12rem_auto]">
            <div>
              <Label>Label</Label>
              <Input value={field.label} onChange={(event) => onChange({ ...field, label: event.target.value })} className="mt-2" />
            </div>
            <div>
              <Label>Type</Label>
              <Select value={field.type} onValueChange={(value) => onChange({ ...field, type: value as FieldType })}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {fieldTypeSchema.options.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.replace("_", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <button type="button" className="mt-7 grid size-10 place-items-center rounded-md border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10" onClick={onRemove}>
              <Trash2 className="size-4" />
            </button>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <Label>Help text</Label>
              <Input value={field.helpText ?? ""} onChange={(event) => onChange({ ...field, helpText: event.target.value })} className="mt-2" />
            </div>
            <div>
              <Label>Placeholder</Label>
              <Input value={field.placeholder ?? ""} onChange={(event) => onChange({ ...field, placeholder: event.target.value })} className="mt-2" />
            </div>
          </div>
          {["single_select", "multi_select"].includes(field.type) ? (
            <div>
              <Label>Options</Label>
              <Input
                value={optionsText}
                onChange={(event) =>
                  onChange({
                    ...field,
                    options: event.target.value
                      .split(",")
                      .map((value) => value.trim())
                      .filter(Boolean)
                      .map((value) => ({ label: value, value: value.toLowerCase().replace(/[^a-z0-9]+/g, "-") })),
                  })
                }
                className="mt-2"
              />
            </div>
          ) : null}
          <div className="flex items-center gap-3">
            <Checkbox checked={field.required} onCheckedChange={(checked) => onChange({ ...field, required: Boolean(checked) })} />
            <span className="text-sm text-slate-200">Required</span>
          </div>
        </div>
      </div>
    </article>
  );
}

function MiniQr({ value }: { value: string }) {
  const chars = value.split("");
  return (
    <div className="grid grid-cols-9 gap-1 rounded-md bg-white p-3">
      {Array.from({ length: 81 }).map((_, index) => {
        const active = (chars[index % Math.max(chars.length, 1)]?.charCodeAt(0) ?? index) % 3 !== 0;
        return <span key={index} className={`aspect-square rounded-[2px] ${active ? "bg-slate-950" : "bg-white"}`} />;
      })}
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="motion-card rounded-md border border-white/10 bg-white/[0.06] p-5">
      <h2 className="mb-4 text-xl font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#07111f] text-white">
      <PokemonTypeAtmosphere className="opacity-60" />
      <SiteNav />
      <section className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6">{children}</section>
    </main>
  );
}

function LoginRequired() {
  return (
    <div className="rounded-md border border-white/10 bg-white/[0.06] p-8">
      <h1 className="text-3xl font-semibold">Login required</h1>
      <p className="mt-3 text-slate-300">Creator dashboards are protected.</p>
      <Button asChild className="mt-6 bg-yellow-300 text-slate-950 hover:bg-yellow-200">
        <Link href="/login">Login</Link>
      </Button>
    </div>
  );
}
