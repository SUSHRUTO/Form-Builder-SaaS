"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import type React from "react";
import { ArrowLeft, Download, Eye, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { SiteNav } from "~/components/site-nav";
import { trpc } from "~/trpc/client";

export default function ResponsesPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const me = trpc.auth.me.useQuery(undefined, { retry: false });
  const form = trpc.forms.getMine.useQuery({ id }, { enabled: Boolean(me.data?.user && id) });
  const responses = trpc.forms.responses.useQuery({ id, page: 1 }, { enabled: Boolean(me.data?.user && id) });
  const analytics = trpc.forms.analytics.useQuery({ id }, { enabled: Boolean(me.data?.user && id) });
  const csv = trpc.forms.exportCsv.useQuery({ id }, { enabled: false });

  async function exportCsv() {
    const result = await csv.refetch();
    if (!result.data?.csv) return;
    const blob = new Blob([result.data.csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${form.data?.slug ?? "responses"}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("CSV export generated.");
  }

  if (me.isLoading) {
    return <Shell><div className="rounded-md border border-white/10 bg-white/8 p-8">Loading analytics...</div></Shell>;
  }

  if (!me.data?.user) {
    return (
      <Shell>
        <div className="rounded-md border border-white/10 bg-white/[0.06] p-8">
          <h1 className="text-3xl font-semibold">Login required</h1>
          <Button asChild className="mt-6 bg-yellow-300 text-slate-950 hover:bg-yellow-200">
            <Link href="/login">Login</Link>
          </Button>
        </div>
      </Shell>
    );
  }

  const fields = form.data?.fields ?? [];

  return (
    <Shell>
      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div>
          <Button asChild variant="ghost" className="mb-4 px-0 text-slate-300 hover:bg-transparent hover:text-white">
            <Link href={`/dashboard/forms/${id}`}>
              <ArrowLeft className="size-4" />
              Back to builder
            </Link>
          </Button>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-yellow-200">Responses</p>
          <h1 className="mt-3 text-4xl font-semibold sm:text-5xl">{form.data?.title ?? "Form analytics"}</h1>
        </div>
        <Button onClick={exportCsv} className="bg-yellow-300 text-slate-950 hover:bg-yellow-200">
          <Download className="size-4" />
          Export CSV
        </Button>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-4">
        <Metric label="Views" value={analytics.data?.views ?? 0} icon={<Eye />} />
        <Metric label="Starts" value={analytics.data?.starts ?? 0} icon={<Send />} />
        <Metric label="Submissions" value={analytics.data?.submissions ?? 0} icon={<Send />} />
        <Metric label="Completion" value={`${analytics.data?.completionRate ?? 0}%`} icon={<Eye />} />
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_24rem]">
        <section className="overflow-hidden rounded-md border border-white/10 bg-white/[0.06]">
          <div className="border-b border-white/10 p-5">
            <h2 className="text-xl font-semibold">Response inbox</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-white/[0.06] text-slate-300">
                <tr>
                  <th className="px-4 py-3">Submitted</th>
                  <th className="px-4 py-3">Email</th>
                  {fields.slice(0, 4).map((field) => (
                    <th key={field.id} className="px-4 py-3">
                      {field.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {responses.data?.map((response) => (
                  <tr key={response.id}>
                    <td className="px-4 py-3 text-slate-300">{new Date(response.submittedAt).toLocaleString()}</td>
                    <td className="px-4 py-3 text-slate-300">{response.respondentEmail ?? "Anonymous"}</td>
                    {fields.slice(0, 4).map((field) => (
                      <td key={field.id} className="max-w-64 truncate px-4 py-3 text-slate-200">
                        {formatAnswer(response.answers[field.id])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!responses.data?.length ? <div className="p-10 text-center text-slate-300">No responses yet.</div> : null}
        </section>

        <aside className="space-y-6">
          <section className="rounded-md border border-white/10 bg-white/[0.06] p-5">
            <h2 className="text-xl font-semibold">Choice breakdown</h2>
            <div className="mt-5 space-y-5">
              {analytics.data?.choiceBreakdown.map((field) => (
                <div key={field.fieldId}>
                  <p className="mb-2 text-sm text-slate-300">{field.label}</p>
                  <div className="space-y-2">
                    {field.values.map((item) => (
                      <div key={item.value}>
                        <div className="flex justify-between text-xs text-slate-400">
                          <span>{item.value}</span>
                          <span>{item.count}</span>
                        </div>
                        <div className="mt-1 h-2 rounded-full bg-white/10">
                          <div className="h-2 rounded-full bg-yellow-300" style={{ width: `${Math.min(100, item.count * 18)}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
          <section className="rounded-md border border-white/10 bg-white/[0.06] p-5">
            <h2 className="text-xl font-semibold">Daily responses</h2>
            <div className="mt-5 flex h-40 items-end gap-2">
              {analytics.data?.dailyResponses.map((day) => (
                <div key={day.date} className="flex flex-1 flex-col items-center gap-2">
                  <div className="w-full rounded-t-md bg-yellow-300" style={{ height: `${Math.max(12, day.count * 22)}px` }} />
                  <span className="text-[10px] text-slate-400">{day.date.slice(5)}</span>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </Shell>
  );
}

function formatAnswer(value: unknown) {
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (value === null || value === undefined) return "";
  return String(value);
}

function Metric({ label, value, icon }: { label: string; value: React.ReactNode; icon: React.ReactNode }) {
  return (
    <div className="rounded-md border border-white/10 bg-white/[0.06] p-5">
      <div className="mb-4 grid size-9 place-items-center rounded-md bg-yellow-300 text-slate-950">{icon}</div>
      <p className="text-3xl font-semibold">{value}</p>
      <p className="mt-1 text-sm text-slate-400">{label}</p>
    </div>
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
