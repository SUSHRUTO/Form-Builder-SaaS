"use client";

import Link from "next/link";
import { useState } from "react";
import { KeyRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { SiteNav } from "~/components/site-nav";
import { trpc } from "~/trpc/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("demo@pokebuilder.dev");
  const [resetUrl, setResetUrl] = useState<string | null>(null);
  const forgot = trpc.auth.forgotPassword.useMutation({
    onSuccess: (result) => {
      setResetUrl(result.devResetUrl);
      toast.success("Reset instructions queued in the email outbox.");
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <main className="min-h-screen bg-[#07111f] text-white">
      <SiteNav />
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-lg items-center px-4 py-12">
        <form
          className="w-full rounded-md border border-white/10 bg-white/[0.07] p-6"
          onSubmit={(event) => {
            event.preventDefault();
            forgot.mutate({ email });
          }}
        >
          <div className="grid size-11 place-items-center rounded-md bg-yellow-300 text-slate-950">
            <KeyRound className="size-5" />
          </div>
          <h1 className="mt-5 text-3xl font-semibold">Reset password</h1>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            The API stores a reset email event. In demo mode, the secure reset link appears here too.
          </p>
          <div className="mt-6">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2" />
          </div>
          <Button disabled={forgot.isPending} className="mt-6 w-full bg-yellow-300 text-slate-950 hover:bg-yellow-200">
            {forgot.isPending ? "Queuing..." : "Send reset link"}
          </Button>
          {resetUrl ? (
            <Link href={resetUrl} className="mt-5 block break-all rounded-md border border-yellow-300/30 bg-yellow-300/10 p-3 text-sm text-yellow-100">
              {resetUrl}
            </Link>
          ) : null}
          <Link href="/login" className="mt-5 block text-sm text-slate-300 hover:text-white">
            Back to login
          </Link>
        </form>
      </section>
    </main>
  );
}
